# webhtv-sub

webhtv「订阅」功能用的资源清单仓库。清单里每一条是一个第三方 TVBox 资源地址，app 拉取清单后由用户择一启用。

## 订阅地址

```text
https://raw.githubusercontent.com/Bobjoy/webhtv-sub/main/vod.json
https://raw.githubusercontent.com/Bobjoy/webhtv-sub/main/live.json
```

在 app 的「设置 → 订阅」里新增订阅时粘贴上面的地址，分组分别选「点播」和「直播」。

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
