# Canvas 页面接入应用主题

antd 页面用 CanvasThemeProvider 包住业务组件；图表通过 useCanvasThemeContext 取色。纯 DOM 页面直接使用应用 CSS 变量。

## 1. 选择接入方式

`@canvas-theme-provider` 和 `.themed.canvas.jsx` 仅用于第 2 节的脚本装配路线，不是所有顶部导航、背景图或 Canvas 页面的必经步骤。已有 Provider 的页面直接编译原文件；不要重复插入 Provider 或增加标记。

| 页面情况 | 操作 |
| --- | --- |
| 用 `sample` 生成表单抽屉、批量表格或趋势图页面 | 已接好主题，继续编写业务内容 |
| 自己编写页面，直接使用应用主题 | 按下方命令提取 Provider，合并到页面 |
| 有本地 app-theme.css，需要生成完整页面或预览 | 按第 2 节运行主题脚本 |
| 维护 .oyd.jsx / 平台 Jsx 页面 | 使用 yida-custom-page |

```bash
openyida sample openyida-page-template canvas-theme --output <项目目录>/canvas-theme.jsx
```

将片段与业务代码合并到同一 Canvas 文件，React 和 ConfigProvider 的 import 各保留一份。把业务内容放进 PageContent，在 YidaComp 中用 CanvasThemeProvider 包住 PageContent。已有页面用它替换自带的主题 hook 和配色 ConfigProvider。

组件结构固定为 `YidaComp → CanvasThemeProvider → PageContent`。主题上下文和 Provider 定义放在模块顶层；`useCanvasThemeContext()` 放在 PageContent 或其子组件中；通过 `<PageContent />` 渲染业务内容。

## 2. 用本地主题文件生成页面

先按 design.md 准备 app-theme.css。应用主题使用 `openyida update-app <appType> --theme-file <app-theme.css>` 上传保存；页面由平台加载该 CSS。

在业务源文件的模块顶层保留一个标记：

```jsx
/* @canvas-theme-provider */
import { Button } from 'antd';

function PageContent() {
  const { token } = useCanvasThemeContext();
  return <section style={{ color: token.colorText }}><Button type="primary">新增</Button></section>;
}
function YidaComp() {
  return <CanvasThemeProvider><PageContent /></CanvasThemeProvider>;
}
export default YidaComp;
```

```bash
node <skill-dir>/scripts/build-canvas-theme.js \
  --theme-file <项目目录>/app-theme.css \
  --theme-url <已上传主题的HTTPS地址> \
  --page <项目目录>/pages/src/workbench.canvas.jsx \
  --output <项目目录>/pages/src/workbench.themed.canvas.jsx
```

- `<skill-dir>` 是当前安装的技能目录。
- `--theme-file`、`--output` 必填。输出使用独立文件，保留业务源文件和主题 CSS。
- `--theme-url` 可省略；填写时使用该 CSS 的真实上传地址或应用配置回读结果。
- 标记只写一次。脚本会插入 React、ConfigProvider、CanvasThemeProvider 和 useCanvasThemeContext；业务代码共用这些声明，hooks 使用 `React.useState` 等。
- 后续修改写入业务源文件或 app-theme.css，再运行脚本。编译和发布使用输出的 `.themed.canvas.jsx`。

需要本地主题预览时，省略 `--page`，将 `--output` 指向 `theme-preview.canvas.jsx`。生成的测试页默认开启 `preview`，使用 CSS 顶层 `:root` 变量；完整选择器、媒体查询和字体资源在实际应用中验证。测试真实应用主题时移除 `preview`。

## 3. 接入控件和图表

- 页面背景使用 `--pod-page-bg-color`，卡片使用 `--pod-card-bg-color`。Provider 已提供根节点背景和最小高度，业务内容负责布局、卡片和装饰。
- antd 自动接收主色、表面、文字、填充和边框色。成功、警告和错误使用 antd 默认色；尺寸、圆角、字体和图表色组按 design.md 设置。
- 图表在 PageContent 内调用 `useCanvasThemeContext()` 获取解析后的 token。
- 弹窗使用 `Modal.useModal`，消息使用上下文 API，holder 放在 Provider 内。
- 弹层默认使用 antd 的挂载位置。需要继承局部 CSS 时设置 `getPopupContainer`，并检查弹层是否被容器裁剪。

## 4. 检查主题和发布结果

先执行 `openyida compile <输出文件> --json`，再检查实际页面的主色、按钮状态、确认弹窗、延迟加载和换肤效果。用户要求发布时，执行 `openyida publish <输出文件> <appType> <formUuid>`。

编译会检查主题容器是否挂载、入口是否提前读取主题、主题上下文是否放在模块顶层。报错包含位置和调整方法，按提示修正后再次编译。发布后实际打开页面，检查首屏和主题交互；`--health-check` 用于核对保存内容，页面能否正常运行以浏览器结果为准。

原始文件仍有 `/* @canvas-theme-provider */` 时，编译和发布会报 `OPENYIDA_CANVAS_THEME_NOT_ASSEMBLED`。按第 2 节生成独立输出文件后编译该输出；不要仅删除标记掩盖尚未接入的 Provider。

Context 返回 `token/status/source/revision`：

| status | 含义与处理 |
| --- | --- |
| loading | 正在读取主题 |
| ready | 已读到应用主色，继续检查页面效果 |
| preview | 使用本地变量快照，实际应用效果另行验证 |
| missing | 未读到主色，检查应用 CSS 是否加载 |
| error | 解析失败，检查主题变量和运行错误 |

其他缺失颜色使用 antd 默认值。`source` 是生成时提供的 URL，`revision` 是本地 CSS 的 SHA256；直接提取的应用主题片段中这两项为空。

Provider 会监听祖先属性、head 样式、主题 link 加载和窗口尺寸变化。用 CSSOM 修改样式的代码需主动派发 `openyida:theme-change`；该事件由修改方负责。
