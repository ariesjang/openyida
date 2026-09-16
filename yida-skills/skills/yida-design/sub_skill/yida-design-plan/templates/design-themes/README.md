# 完整主题模板维护规则

## 用途

本文件用于维护当前目录下的完整主题模板。正常生成项目 `design.md` 时读取 [visual-design.md](../../references/visual-design.md)，不读取本文件。

## 文件职责

- [index.json](index.json) 保存主题 ID、用户可读名称、视觉描述、模板路径和默认主题画像。
- `<themeId>.md` 保存一份完整主题模板。
- [basic-tokens.json](basic-tokens.json) 保存基础变量清单及固定字体、间距和 Tooltip 配色，作为模板校验依据。
- [validate_design_themes.py](../../scripts/validate_design_themes.py) 校验索引与模板是否一一对应。

## 索引记录

每条主题索引记录包含：

| 字段 | 维护要求 |
| --- | --- |
| `themeId` | 在索引中唯一，并与模板 frontmatter 一致 |
| `label` | 面向用户展示，在索引中唯一 |
| `templatePath` | 指向真实存在的完整主题模板 |
| `styleSummary` | 根据模板“风格摘要”精简为约 150–250 字，保留整体外观、核心差异、主要偏离风险及内容适用条件，供 AI 比较主题 |

一条索引记录对应一份模板；目录中的每份主题模板都必须登记在索引中。

`styleSummary` 从模板风格摘要提炼，不增加原文没有的特征或限制，不维护另一组关键词。精简时去掉重复通用说明与表格排版，保留能区分主题的表面、形状、强调方式、关键偏离风险以及按真实内容启用的条件。修改模板的风格摘要后，同步更新索引摘要。完整规则保留在模板中。`openyida design-plan catalog --json` 返回精简摘要及模板路径。AI 在用户确认主题前只按索引摘要比较与推荐；确认后才读取选中的一份完整模板，不预读候选全文。

每份模板都是全应用主题，不按 `experienceTopology` 或 `businessDomain` 限制候选资格。产品形态只用于生成项目的主题应用说明，逐页视觉记忆点继续按真实内容契约匹配。

## 模板结构

模板 frontmatter 记录 `themeId`、项目级设计 Token 和项目化占位符。模板正文包含以下九个一级章节：

1. 设计总览
2. 色彩
3. 字体与排版
4. 布局与间距
5. 表面与层级
6. 圆角与形状
7. 组件
8. 项目应用
9. 设计规范与禁忌

模板通过“视觉 DNA”和“视觉记忆点应用策略”保存主题的稳定识别特征。生成流程按页面内容契约选择记忆点，不为套用主题新增业务内容。

## 基础变量

主题统一在 `tokens.application-global` 中定义 59 个基础变量，按颜色、字体、间距和圆角分组；`custom-page` 保留为空对象。

- 字体与间距采用 `basic-tokens.json` 中的固定值；页面标题使用 subhead，表格正文使用 table。
- 颜色和圆角保留各主题的视觉差异。Tooltip 固定使用深色背景与反色文字。
- 应用根背景、Shell、页面画布和卡片分别使用对应基础变量；一级容器消费 `--pod-card-bg-color`。
- 组件直接引用基础变量；渐变、透明度和纹理在组件配方中组合基础变量，独立分类色在图表配方中说明。
- 生成器派生品牌色及基础表面色；CSS 输出按平台导航模式分别绑定浅色、深色、白色和灰色背景，根层 Shell 保存默认背景。

## 项目化占位符

| 占位符 | 数据来源 |
| --- | --- |
| `{{PROJECT_NAME}}` | `meta.projectName` |
| `{{BUSINESS_DOMAIN}}` | `meta.businessDomain` |
| `{{EXPERIENCE_TOPOLOGY}}` | `meta.experienceTopology` |
| `{{THEME_SOURCE}}` | `visualStyle.forUser.visualDirection.source`；旧计划兼容原选择来源 |
| `{{PRIMARY_COLOR}}` | `visualStyle.forUser.colorStrategy.primaryColor` |
| `{{COLOR_SOURCE}}` | `visualStyle.forUser.colorStrategy.source` |
| `{{PROJECT_CONSTRAINTS}}` | `visualStyle.constraints` |
| `{{PRODUCT_TOPOLOGY_APPLICATION}}` | `visualStyle.forDesignMd.productTopologyApplication` |
| `{{PAGE_PATTERN_SUMMARY}}` | `pages.customPageDetails[]` 的页面模式与内容丰富度摘要 |
| `{{PAGE_APPLICATIONS}}` | materialize 根据页面事实、主题标准和 `visualStyle.forUser.pageApplications[].visualMemoryApplications` 生成的完整逐页应用 |
| `{{PAGE_IMAGE_NEEDS}}` | 页面图片等级和槽位摘要 |
| `{{ASSET_GAPS}}` | `visualStyle.forUser.assetStrategy.missingAssets` |

模板中的 `<基于……生成的实际色值>` 和 `<由……生成的实际色值>` 是 Token 推导指令。生成项目 `design.md` 时必须替换成具体 CSS 色值。

## 维护操作

### 新增主题

1. 新建完整主题模板。
2. 在主题索引中新增唯一记录。
3. 运行模板校验。

### 修改主题

1. 修改目标主题模板。
2. 保持索引 ID、路径和默认画像与模板一致。
3. 运行模板校验。

### 删除主题

1. 从索引中删除目标记录。
2. 删除对应模板。
3. 运行模板校验。

## 校验

在 `yida-design-plan` 目录运行：

```bash
python scripts/validate_design_themes.py
```

校验通过表示：

- 索引与主题模板一一对应。
- 每份模板包含九个一级章节和全部标准占位符。
- 模板声明和正文引用均属于基础变量清单，固定值与契约一致。
- 自动测试对全部登记主题执行完整校验，并用错误样例验证变量、字体和间距检查。
- 正文中的多个 Token 分别完整书写，不使用后缀缩写或 `*` 通配写法。
- 候选规则文件没有硬编码主题 ID 或主题名称。
