# tv-resource

webhtv「订阅」功能用的资源清单仓库。清单里每一条是一个第三方 TVBox 资源地址，app 拉取清单后由用户择一启用。

## 订阅地址

```text
https://raw.githubusercontent.com/Bobjoy/tv-resource/main/vod.json
https://raw.githubusercontent.com/Bobjoy/tv-resource/main/live.json
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

`vod.json` / `live.json` 里的条目地址来自公开社区清单，随时可能失效。`remark` 记录的是录入时的实测状态（HTTP 状态与响应体大小），失效后直接替换条目即可，格式保持不变。
