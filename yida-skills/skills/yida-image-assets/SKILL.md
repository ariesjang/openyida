---
name: yida-image-assets
description: >
  宜搭页面图片准备：每个位置一张图，最多两轮，按页并发采集和交接。
---

# 准备页面图片

按 `design.md.assetStrategy` 准备图片，每页输出 `prd/<项目名>/asset-manifests/<pageId>.json`。

搜索、生图、看图使用当前宿主工具；链接检查、必要的上传和写清单使用 `asset resolve`。Plan 确认后按 `materialize.assetTasks` 启动；Fast 设计就绪即启动。启动前读取已有页面清单，复用符合当前用途与尺寸要求的 final 图片，其余位置接着原轮次处理。

## 1. 确定哪些页面需要图片

按 `assetStrategy.pages[].pageId` 找页面，按 `slotId` 找图片位置。

| imageNeed | 怎么做 |
| --- | --- |
| `required` | 准备设计要求的图片；缺必需图片时该页保持草稿 |
| `beneficial` | 有图片位置就准备，没有则跳过 |
| `none` | 直接使用图标、图表和排版 |

设计缺失时交回 `yida-design` 补齐。每个位置一个 `slotId`、一张图，`count` 省略或填 `1`。

## 2. 检查工具

复用当前环境的能力查询结果；尚未查询时运行 `openyida agent-capabilities --summary-json`，查看 `online_search`、`image_search`、`image_generation`。

- `unavailable`：跳过。
- `unknown` 或 `requires_host_tool_inventory_check=true`：查看宿主实际工具清单。
- `available`：使用实际存在的工具；工具缺失则按不可用处理。

工具不可用时复用用户图片，记录剩余缺口，继续其他页面。

## 3. 最多两轮，按页面并发

优先用用户图片，其次搜索 **Unsplash / Pexels**；设计允许示意图时可用宿主生图。来源填写 `source=user|search|generated`，生成图标记 `isIllustrative=true`。

1. **第一轮**：批量找图，每个位置选一张信息齐全的图片，查看合适后交给 CLI 检查，允许外链就直接使用。
2. **第二轮**：只补第一轮失败的必需位置，每个位置换一张；允许示意图时可改用生图。
3. **结束**：可选位置用设计允许的无图布局，必需位置保留缺口。用户后续明确要求补图时再继续。

每页最多两轮，每个位置每轮最多一个候选，同一候选尝试一次。一轮包括选图、看图、来源记录、链接检查和必要的上传。换来源、换工具或恢复上传都接着当前轮次。Agent 记录各页轮次、失败位置和不可用来源。

各页及同页各图片位置同时搜索，整次采集共用最多四个在途请求，完成一个就补下一个；使用宿主批量并发调用或并行任务。每个位置返回选图和来源，由该页唯一写入者组装草稿，CLI 并发检查图片，仅需托管的图片下载上传。记录请求起止时间确认实际重叠。主流程同时创建应用、表单和无图页面；有图页面先做布局与交互，接图和验收时汇合。

### 失败后立即切换

搜索入口出现 401、403、429、反爬挑战或超时，立即切换可用来源；其他页面和后续轮次复用这份记录。已取得的独立图片直链按自身检查结果处理。图片直链失效、返回验证网页、尺寸不足或来源信息缺失时，在剩余轮次内换图。

查看实际图片的内容、比例、清晰度和主体位置。商品、房源、人员、案例使用真实图片。来源记录和使用条件见 [来源规则](references/source-policy.md)。

## 4. 检查图片并写入清单

按 [清单契约](references/manifest-contract.md) 写每页草稿：

```bash
openyida asset resolve --input asset-manifests/<pageId>.draft.json --manifest asset-manifests/<pageId>.json --design design.md --page-id <pageId> --json
```

页面草稿就绪即可执行。直链检查无需登录或等待应用创建；上传时追加 `--app-type <真实appType>`，省略时读取项目配置。

允许外链的图片经格式和尺寸检查后直接使用。用户或生成的外链经核实后填 `hotlinkAllowed=true`；本地图片和需托管的图片在允许转存时上传，最大 20 MiB。上传失败时保留已验证且允许外链的原地址。访问失败的图片记录缺口，按两轮规则换图。

## 5. 处理结果

- 退出码 `0`：清单为 `final` 或 `none`。
- 退出码 `2`、`ASSET_MATERIAL_NOT_FINAL`：清单已保存，按 `gaps` 找缺口。
- 其他错误：按错误修正参数或文件。

第二轮修改失败位置的 `input`，将该页清单同时作为 `--input` 和 `--manifest`。CLI 在原图内容未变时复用附件链接。字段、尺寸及错误处理见清单契约。

## 6. 交给页面使用

素材采集完成后直接继续搭建，沿用已有方案确认。读取该页清单的 `pages[].materialStatus`；已有总清单 `asset-manifest.json` 按 `pageId` 读取。

- `final`：该页可继续，只使用 `assets[].materialStatus=final` 的图片 URL。
- `draft`：该页缺必需图片；剩余轮次内补图，用尽则保留缺口，其他页面继续。
- `none`：该页直接继续。

可选图片失败时采用设计允许的无图布局。根状态只表示当前清单的整体结果。

页面任务只写自己的清单。需要更新 PRD/design 时，由应用编排汇总后统一处理：

- **Plan**：更新 `visualStyle.forUser.assetStrategy.materialStatus` 和 `missingAssets`，执行一次 `design-plan patch --set ... --materialize --json`。CLI 保留 revision 与已有确认，生成的文档直接用于开发。
- **Fast**：直接更新文档中的素材进度。

功能、页面结构或整体风格变化时交回规划技能。交付时说明哪些页面可以继续、哪些页面缺什么图。
