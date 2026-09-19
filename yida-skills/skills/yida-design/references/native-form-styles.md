# 原生表单样式与提交页背景

原生表单通过平台已有变量表达不同风格。应用包含表单时，同时设计控件、标签、分组和背景；不能只换主色、Divider 或 Canvas 首页。先沿用选中主题，再按填写场景确定具体值，同类表单保持一致。

## 应用风格先于表单选型

先读取当前 `design.md` 中已确认的应用风格、字体、表面、线条、圆角、密度与状态规则，再设计提交、编辑和详情页。表单是应用风格的延续，不单独抽取另一套配色或风格；多样性来自不同应用的设计方向，以及同一应用内不同业务任务的合理布局差异，不是让每张表单随机换肤。

| 应用方向示例 | 表单与详情的延续方式 |
| --- | --- |
| 杂志编辑风 | 延续标题字体、纸面底色、细线或强调侧线、章节层级和舒展留白；长说明单列，短字段可用主次分栏，详情保留相同阅读节奏 |
| 精密商务风 | 延续克制圆角、细边界、稳定对齐和紧凑间距，适合成组双列和清晰章节 |
| 柔和服务风 | 延续低对比表面、柔圆控件和宽松标签间距，优先易读单列或舒展双列 |
| 高密度运营风 | 延续紧凑控件、明确网格与分组，按字段长度使用多列或横向标签，窄屏收拢 |

这些是推导示例，不是固定行业映射或新增 preset。不能把杂志风等同于某个固定颜色，也不能让所有风格最后都变成相同白卡、相同圆角和相同间距。

在现有 `design.md` 的组件规则及相关页面说明中写清：表单继承了哪些应用特征、主体宽度、列数/比例、标签位置、字段与组间距、分割线、背景层次、底部操作区和响应式，以及详情如何保持一致。无需新增文档或必填机器字段。

## 实现职责与禁止注入

- **设计源**：风格与页面布局决策归 `design.md`；Fast 的 token 写入 `tokens.application-global`，Plan 通过 `visualStyle.tokens` 生成同一设计契约。
- **应用样式**：颜色、字体、控件、状态、背景、详情表面与底栏样式统一进入当前应用的 `app_theme.css` / `app-theme.css`，以实际生成路径为准，通过应用主题设置加载。已有变量优先；需要边框形式、伪元素等额外表达时，仅在核实平台 DOM 后向同一应用 CSS 添加有限作用域规则，并在设计源记录用途。装饰不遮挡输入、不承载必要信息，不用全局 `.next-*` 覆盖所有组件。
- **原生结构**：列数、字段排列和标签位置通过已支持的 Schema 属性及 `ColumnContainer`、`Divider` 实现；不同控件遵守自身能力。应用 CSS 不替代字段结构，也不重排 DOM、伪造字段或改变提交行为。
- **禁止页面注入**：不得在表单或 `formDetail` 的 `didMount`、加载代码、动作模块中创建 style、写 CSS 变量、添加主题 class 或插入装饰 DOM；不得从 Canvas、iframe 父页面或跨框脚本修改表单样式。主题应由 iframe 自己加载的应用资源生效。

修改风格时更新设计源和同一份应用主题文件，不给每张表单复制主题代码。若目标平台尚不支持某项表现，保留原生能力并说明限制，不用页面注入绕过。已有实验注入仅在明确授权迁移后移除并验证，修改技能本身不代表已迁移线上应用。

## 控件和标签

| 变量 | 平台消费位置 | 未配置时的消费回退 |
| --- | --- | --- |
| `--form-element-medium-corner` | 控件 `border-radius` | `8px` |
| `--form-element-medium-height` | 单行控件 `height`，部分控件的 `line-height` | `32px` |
| `--form-element-medium-font-size` | 控件 `font-size` | `14px` |
| `--input-bg-color` | 输入表面 `background-color` | `#fff` |
| `--input-border-width` | 输入边框宽度 | `1px` |
| `--input-border-color` | 输入边框颜色 | `rgba(24, 28, 31, .12)` |
| `--pod-form-label-color` | 字段标签 `color` | `var(--color-text1-10, rgba(24, 28, 31, .8))` |
| `--form-top-label-margin-b` | 顶部标签 `margin-bottom` | `0` |

表中的回退不是必须写死的设计值。模板将圆角连接到 `--corner-2`，填充连接到 `--pod-card-bg-color`，边框连接到 `--color-line1-2`，标签连接到 `--color-text1-10`；项目可以按语义单独调整。高度和使用同一变量的行高一起变化，不再增加一个平行行高变量。

以下是不同方向的起点，按主题和真实业务选择，不随机逐字段切换，也不作为 CLI preset：

| 方向 | 控件圆角 / 高度 / 字号 | 填充与边框 | 顶部标签间距 |
| --- | --- | --- | --- |
| 紧凑工具表单 | `4px` / `32px` / `14px` | 内容底色、清晰的 `1px` 细边界 | `4px` |
| 舒展线框表单 | `8px` / `40px` / `14px` | 透明或内容底色、`1px` 细边界 | `8px` |
| 柔和填充表单 | `12px` / `40px` / `14px` | 与内容表面可辨的弱填充、轻边界 | `8px` |
| 暖纸登记表单 | `6px` / `40px` / `14px` | 暖白输入、暖灰边界、深色标签 | `6px` |

多行文本、附件、成员选择和子表保留自身布局，不用全局 `input/textarea/.next-*` 规则强制同一高度。顶部标签间距不代表所有字段的行间距。

默认、hover、focus 和只读详情应成套设计，不能只改默认边框后让聚焦跳回另一套风格。核实当前运行时对 `--input-hover-border-color`、`--input-focus-border-color`、`--input-hover-bg-color`、`--input-focus-bg-color` 等变量的消费与作用域后，写入应用主题；不能假定声明在根部就覆盖组件局部变量。焦点保持可辨，错误、警告、禁用保留独立语义。详情核对 `--pod-field-preview-text-color`、`--pod-field-preview-bg-color`、圆角、padding 与阴影等实际消费项，尤其避免深色底配旧版深色正文；未核实的变量不编造。

## 底部操作区与宽度对齐

`--pod-page-footer-bg-color` 根据应用主题选择与画布或内容表面协调的实色、半透明或透明；不统一强制透明，也不默认白底。`--pod-sticky-footer-box-shadow` 根据材质和层次选取，可为 `none`。区分外层固定区域与内层按钮容器，避免重复背景、双重阴影和无设计依据的边线。

主体和底栏使用同一内容宽度与水平对齐基准。不能仅为两者设置相同 `max-width` 就认为已对齐；同时检查包含块、百分比宽度、内边距、边框盒、左右 margin、滚动条和平台规则优先级。应用 CSS 的适配限定在已核实的页面/主题作用域，不把实验中的固定尺寸和高优先级覆盖作为所有应用默认值。

底部占位在背景连续的布局内处理，避免底部 margin 露出 body 底色；确需从 margin 改成 padding 时，根据实际固定栏高度保留空间，不盲目复制某个固定值。分别检查独立页面、实际 iframe/抽屉宽度与窄屏，左右边缘需符合设计，最后一个字段及错误提示可完整滚动到操作栏上方。

## 提交页的背景分层

`submission/{formUuid}?isRenderNav=false` 隐藏导航，不会取消应用主题，也不要求纯白背景。PC 抽屉里的 iframe 与独立提交页都需要检查；父页面的 CSS 变量不会自动继承进 iframe。

| 层级 | 既有配置 | 使用边界 |
| --- | --- | --- |
| 应用外衬、无导航壳层 | `--pod-app-root-bg-color`、`--pod-app-root-bg-image` | 颜色与图片分开；图片值可为 `none`、渐变或真实 `url(...)` |
| 页面画布、表单内容区 | `--pod-page-bg-color` | 只接受颜色；新版表单可通过 `--yida-form-content-bgcolor` 消费它 |
| 卡片表面 | `--pod-card-bg-color` | 控制卡片及引用它的控件，不替代页面背景 |
| 输入控件内部 | `--input-bg-color` | 独立于外层背景，保证填写内容可读 |

模板通过 `body.pod-premium.page-type-submit .vc-shell-without-nav.pod-premium` 将外衬变量用于新版无导航提交页；平台默认壳层取导航背景，单独声明根背景图变量并不足以显示图片。该规则不修改有导航页面、旧主题或表单字段。渐变或背景图放在外层，内容表面保留可读底色。背景素材必须来自已确定的真实资源，不能让图像妨碍字段阅读；长表单、窄屏和滚动到底部时均应保持连续背景。默认居中靠上、cover、不重复，需要其他铺放方式时在已核实的作用范围调整。

已有表单的 `Page.props.pageStyle`、`contentBgColor`、`contentBgColorMobile` 和页面 CSS 可能保留历史底色；不同运行版本的优先级也可能不同。先查看实际 body、壳层、`.vc-rootcontent` 和控件的计算样式，再决定调整应用主题还是目标页面配置。新表单的透明 `pageStyle` 只是一层默认值，不能迁移已有 Schema；不要批量清空页面样式，也不要在 Canvas 中向父页面注入主题。

## 写入现有主题源

Fast 将以下变量合并到 `design.md` 的 `tokens.application-global`；Plan 合并到 `build-plan.json` 的 `visualStyle.tokens`，重新物化生成 `design.md` 和 CSS。原有品牌、导航、文字等 token 保留。以下只示范暖纸表单的项目差异，不是所有应用的默认主题：

```json
{
  "--form-element-medium-corner": "6px",
  "--form-element-medium-height": "40px",
  "--form-element-medium-font-size": "14px",
  "--input-bg-color": "#FFFCF6",
  "--input-border-width": "1px",
  "--input-border-color": "#D8CDBD",
  "--pod-form-label-color": "#554B40",
  "--form-top-label-margin-b": "6px",
  "--pod-app-root-bg-color": "#F3EBDD",
  "--pod-app-root-bg-image": "linear-gradient(135deg, #F3EBDD, #E8DDCB)",
  "--pod-page-bg-color": "#FFFCF6",
  "--pod-card-bg-color": "#FFFCF6"
}
```

Fast 更新使用 `openyida sample yida-design app-theme --design-file <design.md> --output <app-theme.css>`；Plan 使用物化结果中的 `outputs.theme`。两条路径都复用现有主题生成器，不新增表单专属主题文件、CLI 参数或一套 preset。已有主题增量更新时保留未修改的变量和定制 CSS。

增量更新不会将新版模板的所有选择器自动合并到旧 CSS。已有主题缺少上述提交页背景规则时，先确认实际 DOM，再将模板中的这一小段规则补入原主题文件；不能省略 `--design-file` 重置整份主题。新建主题已包含该规则。

通过 `openyida update-app <appType> --theme-file <app-theme.css>` 上传并绑定后，读回资源并检查实际页面；本地生成不代表线上生效。已有表单的字段更新不需要重新建表。

## 验证

- 查看控件包装层、输入文字和标签的计算样式，确认圆角、高度、字号、填充、边框和标签间距实际生效，不能只检查 `:root` 中是否出现变量。
- 分别查看外层背景、表单内容底色和控件填充；外层渐变不能写入 `background-color`。遇到历史 inline 样式，查清来源后只改目标配置。
- 核对长标签、多行文本、选择器、日期、附件、子表，以及焦点、错误和禁用状态；单行行高不能截断内容。
- 检查独立提交页、PC 抽屉 iframe、移动端及底部操作区；固定提交按钮不能遮挡最后一个字段。移动端按其实际组件能力验证，不声称 PC token 全部等效。
- 新版主题、旧版主题与已保存页面分别验证。没有运行态证据时，交付注明“主题已生成/绑定，视觉待验证”。
