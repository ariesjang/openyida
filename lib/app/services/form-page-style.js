'use strict';

/**
 * 表单 Body 默认透明，由平台主题承接背景；旧主题保留历史灰底。
 * CLI 没有浏览器主题上下文，使用平台 isUseNewAppThemeStyle 对应的
 * body.pod-premium 标识在运行时选择，兼容应用创建后的主题切换。
 * 旧主题选择器优先于设计器由 pageStyle 生成的普通 body 规则。
 */
const FORM_PAGE_STYLE = Object.freeze({ backgroundColor: 'transparent' });
const FORM_PAGE_CSS = 'body:not(.pod-premium){background-color:#f2f3f5}body.pod-premium{background-color:transparent}';

module.exports = { FORM_PAGE_STYLE, FORM_PAGE_CSS };
