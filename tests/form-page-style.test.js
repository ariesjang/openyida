'use strict';

const { _private: createForm } = require('../lib/app/create-form');
const formCompiler = require('../lib/app/services/form-compiler');

describe('新建表单 Body 背景', () => {
  const args = ['主题表单', [], 'FORM-TEST', 'CORP-TEST', 'APP-TEST'];

  test.each([
    ['CLI 创建', () => createForm.buildFormSchema(...args)],
    ['离线编译', () => formCompiler.buildFormSchema(...args)],
    ['空表单', () => formCompiler.buildEmptyFormSchema()],
  ])('%s 同时生成透明 pageStyle 和新旧主题 CSS', (name, build) => {
    const schema = JSON.parse(JSON.stringify(build()));
    const page = schema.pages[0].componentsTree[0];

    expect(page.props.pageStyle).toEqual({ backgroundColor: 'transparent' });
    expect(page.css).toBe(
      'body:not(.pod-premium){background-color:#f2f3f5}body.pod-premium{background-color:transparent}'
    );
    expect(page.props.contentBgColor).toBe('white');
    expect(page.props.contentBgColorMobile).toBe('white');
  });

  test('各表单持有独立的样式对象，编辑不会污染后续默认值', () => {
    const first = formCompiler.buildFormSchema(...args);
    first.pages[0].componentsTree[0].props.pageStyle.backgroundColor = '#123456';

    const next = formCompiler.buildEmptyFormSchema();
    expect(next.pages[0].componentsTree[0].props.pageStyle.backgroundColor).toBe('transparent');
  });
});
