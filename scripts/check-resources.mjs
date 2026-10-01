import { readFile, writeFile } from 'node:fs/promises';

const SOURCES = { vod: 'vod.json', live: 'live.json' };
const REMOVED = 'removed.json';
const ATTEMPTS = 3;
const RETRY_MS = 5000;
const TIMEOUT_MS = 20000;
const MIN_BYTES = 200;
const DRY_RUN = process.argv.includes('--dry-run');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readJson(path, fallback) {
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch (e) {
    if (fallback && e.code === 'ENOENT') return fallback;
    throw new Error(`${path} 读取失败: ${e.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${path} 解析失败: ${e.message}`);
  }
}

function classify(url, status, body) {
  if (status < 200 || status >= 300) return `HTTP ${status}`;
  if (body.length < MIN_BYTES) return `响应过小 ${body.length}B`;
  const head = body.subarray(0, 512).toString('utf8').trimStart().toLowerCase();
  // TVBox 配置带 // 与 /* */ 注释，严格 JSON.parse 会误杀，只按首字符判形态
  if (head.startsWith('<')) return '返回 HTML 页面';
  if (/\.json(\?|$)/i.test(url) && !head.startsWith('{') && !head.startsWith('[')) return 'JSON 形态异常';
  return null;
}

async function probe(url) {
  let reason = '未知错误';
  for (let i = 0; i < ATTEMPTS; i++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'user-agent': 'Mozilla/5.0', accept: '*/*' },
      });
      const body = Buffer.from(await res.arrayBuffer());
      const problem = classify(url, res.status, body);
      if (!problem) return { alive: true, note: `${body.length}B` };
      reason = problem;
    } catch (e) {
      reason = e.name === 'TimeoutError' ? `超时 ${TIMEOUT_MS / 1000}s` : e.cause?.code || e.message;
    }
    if (i < ATTEMPTS - 1) await sleep(RETRY_MS);
  }
  return { alive: false, note: reason };
}

const strip = ({ source, removedAt, reason, ...item }) => item;

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const lists = {};
  for (const [key, file] of Object.entries(SOURCES)) lists[key] = { file, doc: await readJson(file) };
  const archived = (await readJson(REMOVED, { items: [] })).items || [];

  const lines = [];
  const keepArchived = [];

  for (const [key, entry] of Object.entries(lists)) {
    const results = await Promise.all(entry.doc.list.map((item) => probe(item.url)));
    const alive = [];
    const dead = [];
    results.forEach((r, i) => (r.alive ? alive : dead).push({ item: entry.doc.list[i], note: r.note }));
    if (entry.doc.list.length > 0 && alive.length === 0) {
      lines.push(`跳过    ${key}  全部条目验证失败，疑似巡检机网络问题，不做剔除`);
      continue;
    }
    entry.doc.list = alive.map((x) => x.item);
    dead.forEach(({ item, note }) => lines.push(`剔除    ${key}  ${item.url}  (${note})`));
    keepArchived.push(...dead.map(({ item, note }) => ({ ...item, source: key, removedAt: today, reason: note })));
  }

  for (const entry of archived) {
    const target = lists[entry.source];
    if (!target) {
      keepArchived.push(entry);
      continue;
    }
    const r = await probe(entry.url);
    if (!r.alive) {
      keepArchived.push(entry);
      lines.push(`仍失效  ${entry.source}  ${entry.url}  (${r.note})`);
    } else if (target.doc.list.some((x) => x.url === entry.url)) {
      lines.push(`已存在  ${entry.source}  ${entry.url}  从留档移除`);
    } else {
      target.doc.list.push(strip(entry));
      keepArchived.push(entry);
      lines.push(`复活    ${entry.source}  ${entry.url}  已搬回清单`);
    }
  }

  const outputs = [];
  for (const { file, doc } of Object.values(lists)) outputs.push([file, JSON.stringify(doc, null, 2) + '\n']);
  outputs.push([REMOVED, JSON.stringify({ items: keepArchived }, null, 2) + '\n']);

  const writes = [];
  for (const [file, text] of outputs) {
    const original = await readFile(file, 'utf8').catch(() => '');
    if (text !== original) writes.push([file, text]);
  }

  console.log(lines.join('\n') || '无变化');
  const count = (prefix) => lines.filter((l) => l.startsWith(prefix)).length;
  console.log(`汇总: 剔除 ${count('剔除')} / 复活 ${count('复活')} / 留档 ${keepArchived.length} / 改动文件 ${writes.length}`);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await writeFile(process.env.GITHUB_STEP_SUMMARY, `## 资源巡检 ${today}\n\n\`\`\`\n${lines.join('\n') || '无变化'}\n\`\`\`\n`);
  }
  if (DRY_RUN) return console.log('dry-run: 未写入任何文件');
  for (const [file, text] of writes) await writeFile(file, text);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
