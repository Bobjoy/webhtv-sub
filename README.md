# webhtv-sub

webhtv「订阅」功能用的资源清单仓库。清单里每一条是一个第三方 TVBox 资源地址，app 拉取清单后由用户择一启用。

> **免责声明** — 本仓库不存储、不制作、不控制任何影视或直播内容，清单里的地址全部收集自公开互联网，`remark` 记录的只是录入时的实测状态。本站内容仅供个人学习与技术研究使用，请在采集地址原作者的许可和当地法律法规允许的范围内使用；请勿用于商业用途或任何侵犯第三方合法权益的用途，因使用本清单产生的后果由使用者自行承担。相关权利人如认为某条地址不应被收录，请开 issue 说明，核实后即从清单移除。

## 订阅地址

```text
https://raw.githubusercontent.com/Bobjoy/webhtv-sub/main/vod.json
https://raw.githubusercontent.com/Bobjoy/webhtv-sub/main/live.json
```

app 的订阅入口默认隐藏：在「设置」页标题栏 2 秒内连点 5 次，输入下面的[授权码](#授权码codestxt)开启，再进「设置 → 订阅」新增订阅，粘贴上面的地址，分组分别选「点播」和「直播」。

国内网络直连 `raw.githubusercontent.com` 通常不通。app 的订阅拉取会复用「设置 → 更新」里的 **GitHub 代理** 开关，选一个可用代理（例如 `ghfast.top`）后这两个地址即可拉通。

## 支持的清单格式

1. 标准 JSON —— `list` 或 `urls` 数组，字段 `name` / `url` / `logo` / `remark`，`url` 缺失的条目会被丢弃，`name` 缺失时用 host 兜底：

   ```json
   { "name": "清单名", "list": [ { "name": "线路名", "url": "http://example.com/x.json" } ] }
   ```

2. 纯文本行 —— 每行一个地址，可跟空白和名称；`#`、`//` 开头的行和空行跳过：

   ```text
   # 接口源
   http://example.com/x.json    # 线路名
   http://example.com/y.json    线路名
   ```

3. 带注释的 JSON —— 允许 `//` 与 `/* */` 注释（社区多仓清单常见形态）。

## 清单内容与收录规则

`vod.json` 16 条点播配置，`live.json` 22 条直播源。条目主要来自社区清单 [`youhunwl/TVAPP`](https://github.com/youhunwl/TVAPP/blob/main/README.md) 的「接口源」「直播源」两节，录入时逐条实测，`remark` 记下实测状态。

收录判据（不满足的一律不录，以后补录也按同一套走）：

- **点播配置**必须剥掉 `//`、`/* */` 注释后能以 `{` 或 `[` 起头，且含 `sites` / `spider` / `lives` / `parses` 之类的实体字段。社区清单里以 `.png`、图片名、二维码页伪装的真配置照样收（例如「哈基米」）。
- **只有顶层 `urls` 的多仓/单仓不收**（小盒子多仓、游魂多仓、拾光多仓、潇洒单仓等共 7 条）。多仓的每一项还得再解一次，app 的订阅条目要的是能直接启用的线路地址，中间多一层只会让用户点进去看到一堆点不开的仓库。
- **直播源**必须是 `#EXTM3U`/`#EXTINF` 或 TVBox `#genre#` 形态，且含地址的频道行 ≥ 10 条。社区不少"直播源"到期后退化成只剩一条"更新时间"广告视频（游魂直播源、zbds IPv6、咪咕 IPTV、epg.pw 新加坡），收进去只会让订阅列表出现点开没台可看的条目。
- HTML 页面、图片/二维码伪装、直连 25 秒超时都判为不收（`iptv-org.github.io/iptv/index.m3u` 全量清单本机超时，只收同源的台湾分表；`web.utako.moe`、`gongdian.top`、`live.fanmingming.cn` 一类 DNS/连接直接失败的也略过）。`live.freetv.top` 的虎牙清单录入时持续 504，同源的斗鱼正常，想补的话单独验一次。
- GitHub raw 地址在国内直连通常不通，靠 app 里复用「设置 → 更新」的 **GitHub 代理** 开关；巡检机在境外不受此限制。

## 授权码（codes.txt）

`codes.txt` 是 app 内部门禁用的授权码表，一行一个 4 位数字，`#` 开头为注释，app 每次解锁时实时拉取、任一命中即通过：

```text
https://raw.githubusercontent.com/Bobjoy/webhtv-sub/main/codes.txt
```

它**不是**凭据：文件明文公开，校验发生在客户端，4 位数字只有 10000 种组合。作用只是让不知道手势和码的人不会误入订阅配置，给分发对象一个开关。因此码可以重复分发给人、可以随时增删行，但无法撤回、无法计数、无法区分谁在用。不要把其他敏感内容写进这个仓库。

## 维护

`vod.json` / `live.json` 里的地址来自公开社区，随时可能失效。`remark` 记录的是录入时的实测状态（HTTP 状态与响应体大小）。

仓库带一个 GitHub Action（`.github/workflows/check-resources.yml`），每天北京时间 **04:00** 自动巡检：

- 一条地址连续 3 次（间隔 5 秒）拿不到有效内容 → 从清单剔除，连原因一起搬进 `removed.json` 留档。
- 有效 = HTTP 2xx、响应体 ≥ 200B、内容不以 `<` 开头（HTML 页面一律判失效，app 的解析器不接受 HTML）。`.json` 地址还要求以 `{` 或 `[` 开头；TVBox 配置里的 `//`、`/* */` 注释**不**算失效。
- `removed.json` 里的条目每天复检，恢复可用且主清单里没有时自动搬回原清单。
- 某个清单里所有条目同时失败 → 跳过该清单不做剔除（视为巡检机自身网络问题）。
- 巡检机在境外，部分国内源会屏蔽海外 IP 而被误档；这类条目每天复检，长期被档多半只是 IP 问题，可从 `removed.json` 删掉后手工加回主清单。
- 想立刻巡检：Actions 页面 → `check-resources` → Run workflow；本地也可以 `node scripts/check-resources.mjs --dry-run` 只看结论不写文件。

手工增删条目随时可行，`git push` 后下一次巡检以仓库当前内容为准。
