# 输出：design.md

本文件是 Fast、Plan 和单页设计共同使用的唯一项目设计输出契约。Fast 手写项目 `design.md`，Plan 由 CLI 物化生成；两条流程保留各自编写方式，交付相同格式并使用同一校验。

业务对象、数据、流程、页面范围与操作由需求和 PRD 决定；主题选择按 [共享规则](../references/theme-selection.md) 执行。项目文件自包含，实现阶段读取 PRD 与 `design.md`，不再回到主题库推断规则。

## 内容职责

| 内容 | 唯一存放位置 | 用途 |
| --- | --- | --- |
| 项目身份、主题交付、最终 token、素材与图标映射 | frontmatter | 供 CLI 确定性读取；正文解释用途，不重复维护取值 |
| 页面、组件、状态的定位索引 | frontmatter | 只保存稳定 ID 与正文 anchor，不复制规则全文 |
| 视觉系统、组件机制、特色配方、具体页面设计与验收 | 正文 | 供实现者阅读；每条完整规则只写一次 |
| 候选、主题模板身份、生成过程、编写说明 | 内部选择记录或技能文档 | 不进入最终项目设计 |

`version`、`design_id`、`yidaThemeDelivery` 不再是项目必填字段；版本格式由 `schemaVersion` 表示，主题交付统一放在 `themeProfile`。正文可以沿用“布局骨架、表面层次、形状、密度、呼吸节奏”等设计概念，不强制重复建立 `visualScaffold` 或几十个英文字段。

## frontmatter 规范

文档从 YAML frontmatter 开始，完整解析为对象。字符串统一使用正确转义的引号；项目名称、说明包含引号、冒号或换行时不能直接拼接。以 `#` 开头的 HEX 颜色必须加引号，否则 YAML 会将其当作注释；token 数值可写数值或字符串。旧文件的读取兼容不作为新输出格式。frontmatter 结束后先出现唯一 H1，再写下述五章。

| 字段 | 必填与格式 |
| --- | --- |
| `schemaVersion` | 必填字符串 `"1.0"` |
| `name` | 必填，当前项目名 |
| `description` | 必填，当前项目视觉用途说明 |
| `tokens.application-global` | 必填，保留 appearance、colors、typography、spacing、rounded、shadow 六组基础变量，具体变量名与默认值以 [基础变量契约](../templates/design-themes/basic-tokens.json) 为准 |
| `tokens.custom-page` | 必填对象，保留主题独立页面语义变量；没有额外变量时允许空对象 |
| `themeProfile` | 必填，字段见下一节 |
| `sceneRecipes` | 必填对象，按场景记录真实页面的 `pageId` 与 `anchor`；没有自定义页时为 `{}` |
| `components` | 必填对象，每项仅为 `{anchor: "#component-…"}`；只登记有具体正文规则的组件 |
| `states` | 必填对象，每项仅为 `{anchor: "#state-…"}`；只登记有具体正文规则的状态 |
| `assetStrategy` | 必填，保持单行 JSON；至少 `{ "pages": [] }`，实际页面按素材契约填写 |
| `iconSystem` | 必填，`{library: "lucide-react", mappings: {}}`；library 仅为 `lucide-react` 或 `@ant-design/icons`，mappings 将实际业务语义映射到具体图标组件，无图标时为空对象 |
| `buildPlanRevision` | 仅 Plan 可选，用于与当前计划版本对应；Fast 不补造计划版本 |

`tokens` 中每个 `--token` 只占一行具体 CSS 值，可以带行尾注释。数值、颜色、变量引用均须能解析为有效单行值；不得遗留占位符、推导指令、同名冲突值或多行标量。字体与间距使用主题默认值，明确项目定制可以写入合法覆盖；`--color-white`、`--pod-table-cell-color` 的桥接关系及 Tooltip 固定值仍按公共契约保持。应用全局的七个品牌色阶为 1/2/3/5/6/9/10，不补造 4/7/8。分组只用于组织，CSS 变量使用叶子的完整原名；全局变量不得反向引用页面局部变量。移动端品牌桥接由公共 CSS 模板保留，不能删改其变量名。

### themeProfile

| 字段 | 规则 |
| --- | --- |
| `name` | 项目自己的视觉方向名称，不写主题模板名称 |
| `themeColor` | 当前主色，使用 6 位 HEX，与 `--color-brand1-6` 的最终值一致 |
| `themeColorSource` | 实际来源，如 `user-specified`、`application-theme` 或 `business-inferred`；不伪造模板默认品牌色 |
| `navTheme` | 当前导航明暗 `light` 或 `dark`；与页面画布明暗分开 |
| `themeDelivery` | `app-custom-theme-file` 或 `current-app-theme` |
| `themeFile` | 当前主题 CSS 的实际交付路径；继承当前应用且没有本地主题文件时为空字符串 |
| 既有导航配置 | 保留 navigationType、layoutDirection、hideAppNav、logoSource 等已确认配置，不重新推断入口范围 |

应用导航按 [四类导航契约](../../yida-prd/workflow/output-prd.md#导航类型与执行配置) 与 PRD 保持一致。全应用自绘导航才交接应用级隐藏；独立前台自绘菜单只影响该入口，后台保留平台导航。页面全屏不自动改变应用导航。`colorMode` 如有保留，表示宜搭配色模式，不代表页面明暗。

## 正文构成

使用共享主题现有的五章组织，不新增第二套固定模板。标题保持带编号的 H2，例如 `## 1. 风格摘要`，依次到 `## 5. 项目应用与调整规则`；不要省略编号或改成其他标题层级。内容按当前项目实例化：

1. **风格摘要**：当前项目的视觉方向、用户任务、明确约束与需要保留的核心特征；简要说明已选配色和导航，不写候选比较。
2. **页面视觉系统**：画布、导航、表面、边界、排版、间距、形状和色彩角色。项目配色与导航的覆盖合并到对应规则中，不另起一组相互冲突的“默认”和“适配”说明。
3. **基础组件表达**：当前项目组件的结构、变量消费与状态。每套规则正文只写一次，索引定位到该段。
4. **特色表达配方**：保留真实内容可用的配方、启用条件和不适用时处理；不为套用配方新增业务模块。未启用配方可省略细节，不影响基础视觉语言。
5. **项目应用与调整规则**：每个实际自定义页的具体设计与验收、必要项目差异和素材缺口；不保留“请填入下方”“生成时替换”等编写任务。

主题中的模板维护要求、frontmatter 模板身份要求、占位符替换步骤、色值计算指令及模型编写提示不进入最终正文。保留的是实例化结果与实现者仍需遵守的消费规则，不是模板作者的操作步骤。

按 [页面与导航连续性](../references/page-continuity.md) 逐页交接背景、滚动、切换/返回和异常状态；沉浸页导航叠加首屏，工作区导航占位，页内切换不创建应用导航。

### 页面设计的八项要点

每个实际自定义页只有一段完整设计，放在第 5 章并附显式 anchor；原生表单与流程沿用应用主题，不虚构自定义页面记录。八项逐行写成 `- 页面任务：具体内容` 或 `- **页面任务：** 具体内容`，依下表标签填写；值可以引用正文共享规则的 anchor，但关键标签不改成表格或自由标题，也不把冒号放到加粗范围之外。下表仅解释每项内容，不是产物的排版格式。

| 要点 | 写到可实现的内容 |
| --- | --- |
| 页面任务 | 当前用户要完成什么；内容与操作沿用 PRD |
| 首屏焦点 | 第一眼关注的对象、状态或行动，以及如何突出 |
| 布局 | 区块顺序、主次、宽度/比例、列数、对齐和内容增长方式；真实存在时才规划侧栏或摘要 |
| 表面与组件 | 各区块如何消费共享表面、边界、字体和组件规则；明确局部差异与特色配方位置 |
| 主操作 | 主次动作的位置、入口与反馈，保留表单、详情及现有业务功能契约 |
| 状态 | 当前页加载、空、错、无权限等实际反馈与恢复动作；公共状态用 anchor 引用，业务文案就近补充 |
| 响应式 | 窄屏的排列顺序、折叠、工具栏换行、表格滚动和触控方式 |
| 验收 | 焦点、内容、布局、主题、交互、素材与状态的可检查结果 |

页面外壳、焦点、主要内容、动作区、上下文与反馈这些设计含义都要覆盖；不要求创建同名 JSON/YAML 字段。尺寸和间距优先引用已定义 token，只有项目确实需要的数值差异才另外写明。不能仅写“按主题执行”，也不能把公共组件全文复制到每一页。

## 稳定引用规则

PRD 继续使用 `themeProfile`、`sceneRecipes.<sceneKey>`、`components.<componentName>` 和 `states.<stateName>` 这些 `designRefs`。引用先定位 frontmatter 索引，再进入对应正文；`themeProfile` 直接读取元数据。

Fast 保留 PRD 的 Markdown 逐页块与 `pageSpecHandoff` 格式，display-page 显式填写共享的稳定 `pageId`；`check-design --prd` 按 `pageId`、`designFile` 和 `designRefs` 核对页面与引用。Plan 使用已有 JSON 交接记录；不要求 Fast 转换成 Plan PRD。

- `sceneKey` 复用共享需求/计划的稳定场景 key，不翻译或重新命名。`sceneRecipes.<sceneKey>.pages[]` 每项仅保存 `pageId` 和 `anchor`，同一场景允许多个真实页面。
- 页面使用 `#page-…`，组件使用 `#component-…`，状态使用 `#state-…`。正文相应位置显式写 `<a id="page-…"></a>` 等 HTML anchor；同一 anchor 唯一，索引值必须能够精确找到。
- `components`、`states` 的 key 与 PRD 引用一致，目标 anchor 位于第 3 章基础组件表达内。只登记实际存在的规则；一个复合组件段落确实覆盖多类组件时可共享 anchor，不能因缺少规则就登记虚假引用。
- 索引只保存定位信息，不保存 `rules`、页面布局或组件正文副本。一个共享段落可以服务多个页面，但每个页面仍有自己的具体应用段。

## 图片素材与图标

`assetStrategy.pages[]` 按 [素材清单契约](../../yida-image-assets/references/manifest-contract.md) 记录图片等级与槽位；槽位含用途、数量、比例、尺寸、焦点、填充方式和生成许可。无图片需求的实际页面记录 `imageNeed: none`。保持 frontmatter 单行 JSON 兼容 `--design design.md`，不能只保留槽位数量；有需求时交给 `yida-image-assets`。

`iconSystem.mappings` 只登记实际业务动作、状态、导航和空态使用的具体组件名称。图标尺寸、描边和容器规则放在正文；Canvas 按选中库 import，旧平台 JSX 则按已验证的运行时加载方式使用。不能用 emoji、CSS 图形、字母占位、Unicode、临时 SVG 或 iconfont 绕过图标规范；无法稳定加载时去掉非必要图标或使用已验证资源。

## 用户配色与模板的优先级

用户确认的整体氛围高于模板默认灰阶。根据品牌和已确认方向协调页面、卡片、导航、填充、边界和交互，同时保留文字可读性和独立状态语义；不能只改按钮，也不能统一抹掉主题原有层次与材质。

Plan 使用 `colorStrategy.surfaceTone` 与 `visualStyle.tokens` 记录配色意图和显式差异；Fast 将相同决定直接写入 token 与正文。导航六色成组处理，导航明暗不带动内容画布变暗或变白。用户明确保留中性参考或只改强调色时尊重该范围。

圆角、padding、gap、密度、背景与卡片关系按选中主题和真实任务执行，通用参考值仅补未定义项。同色画布与面板可通过边界、共容器和留白建立层次；渐变、玻璃、阴影、纹理不互相强制绑定。需要动效时提供 reduced motion 降级，装饰不覆盖内容与操作。

## 应用主题 CSS 的职责

`app-theme.css` 是当前应用的主题资源产物，承载品牌色阶、语义色、字体、间距、圆角、阴影，以及 Shell、导航、页面、表单、表格和浮层的主题 token 与必要样式覆盖。`app_theme.css` 等其他 `.css` 文件名同样可用；CLI 根据 `--theme-file` 路径读取内容，不靠固定文件名识别用途。Plan 使用 `outputs.theme`，其他流程使用已记录的产物路径，避免生成多份后上传错文件。

- `design.md` 定义视觉意图、布局和交互；主题 CSS 把对应的平台样式契约落成可加载的资源。导航是否悬浮、侧栏如何折叠和拖拽、业务内容如何排布，仍由页面代码实现。
- 平台组件与自定义页面通过对应 token 消费主题。保留原有变量名和明暗导航作用域；页面组件用 `var(--token, fallback)`，不在每页重新注入全局主题。只有实际引用该 token 或命中 CSS 选择器的内容才会改变外观。
- 文件生成后，通过 `update-app --theme-file <实际路径>` 上传，再更新应用基础设置中的 `colour=custom`、`themeColor` 和 `customThemeStyle`；导航、Logo 来源与布局在同一次更新中同步。创建应用或仅修改本地 CSS 均不等于绑定了主题。
- iframe 是独立文档，不能假定它继承父页面的 CSS 变量。原生表单页依靠该应用的平台主题加载链路；自绘抽屉外壳由所在页面消费 token，高度兜底由容器代码保证。
- `themeVerification.verified=true` 证明应用设置已绑定资源，不证明所有页面视觉正确。发布后仍需检查实际页面及表单 iframe 的资源加载、计算样式与布局；CLI 无法仅凭 CSS 文件判断最终视觉效果。

主题准备与表单、页面开发按 [并行依赖](../../yida-app/workflow/parallel-work.md#主题与业务资源的依赖) 调度：计划或主题确认后即生成 CSS，不依赖表单或页面实现；appType 与 CSS 就绪便立即同步应用基础设置。页面先按已确认 token 开发，视觉验收再核对主题加载结果。

页面背景统一使用 `--pod-page-bg-color`，卡片和面板使用 `--pod-card-bg-color`，默认回退 `--color-white`；抽屉整体使用 `--pod-shell-theme-bg-color`，标题栏与正文容器透明承接，不用卡片底色铺满抽屉。导航归属不改变页面底色，隐藏导航不自动透明；深色或明确的应用背景通过同一平台 token 配置。Plan 和 Fast 将设计值写入 design.md 并生成 app-theme.css，Canvas 宿主、页面根和 antd 统一消费；渐变、纹理和素材作为页面局部装饰层。

## CLI token 契约（Fast / Plan 共用）

`tokens` 的格式与变量契约见 [frontmatter 规范](#frontmatter-规范)。需要改变平台表现的圆角、字体、间距等必须落实为 CSS token，不能只写正文。

Fast 或单独更新主题时，执行 `openyida sample yida-design app-theme --output .cache/openyida/<项目名>/app-theme.css --design-file prd/<项目名>/design.md`。首次从公共模板生成；已有 CSS 只更新设计中变化的 token，保留其他 token 和自定义样式。CLI 自动保存更新记录，内容相同时跳过写入，写入失败回滚。省略 `--design-file` 会用公共模板重置目标 CSS。

主题文件只能由上述 OpenYida CLI 契约生成或更新。不得另写 Python、Node、Shell 或 `run_workspace_script` 临时脚本来生成、复制、整文件重写、正则替换或 retheme 主题 CSS；校验脚本只能读取并报告问题，不能改写主题文件。需要调整 CLI 未覆盖的精确 classname 覆盖时，只允许在现有文件末尾做小范围编辑，并重新通过 `update-app --theme-file` 上传完整文件。

Plan 修改 `visualStyle.tokens` 并按模块更新草稿，最终由 `materialize` 同时生成设计文档和主题 CSS，使用返回的 `outputs.theme`。Fast 由 `yida-design` 直接维护 `design.md`。应用阶段由 `yida-app` 使用 `--theme-file` 应用同一份产物。

整体暗色方案按 [浮层适配](../references/theme/theme-token-presets.md#暗色主题浮层适配) 补齐组件 token。实现阶段可在生成的应用主题 CSS 末尾追加精确 classname 覆盖，再上传完整主题文件。

## 校验与交接

Fast 写完和更新 `design.md` 后执行：

```bash
openyida check-design prd/<项目名>/design.md --json
```

PRD 已就绪时带上关联校验；并行生成 PRD 时先做单文件校验，由 `yida-app` 合并阶段补执行：

```bash
openyida check-design prd/<项目名>/design.md --prd prd/<项目名>/prd.md --json
```

Plan 物化内部使用同一校验，不另维护宽松标准。校验覆盖格式、变量、定位引用和跨文档一致性；真实界面的视觉、数据、交互与可访问性仍按 [页面质量门禁](../references/page-quality-gates.md) 检查。

页面实现交给 `yida-canvas-custom-page`。

交接须满足：五章正文完整且项目化，frontmatter 可解析，所有引用可定位，真实页面八项要点齐备，主题变量和素材/图标记录一致，没有模板身份、未解析指令或重复维护的规则副本。页面实现按 `designRefs` 读取当前页及其共享规则；`page-spec.json` 仅派生业务输入、主题摘要和引用，保留 `sourceOfTruth.prdFile/designFile`，不复制完整设计。
