'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const os = require('os');
const { run } = require('../lib/core/sample');
const { buildApplicationProvider, assembleApplicationTheme } = require('../yida-skills/skills/yida-canvas-custom-page/scripts/build-canvas-theme');
const { compileCanvasLocal } = require('../lib/app/canvas-compile');
const samples = [
  'openyida-scaffold/canvas-form-drawer.canvas.jsx',
  'yida-canvas-table-form/table-form-batch-submit.canvas.jsx',
  'yida-rechart/trend-combo.canvas.jsx',
];
const provider = buildApplicationProvider();
const runtime = compileCanvasLocal(provider + '\nfunction YidaComp() { return <CanvasThemeProvider />; }').runtimeCode;

function setup() {
  const values = { '--color-brand1-6': 'rgb(0, 128, 0)' };
  const listeners = {};
  const observed = [];
  let notify;
  let pending;
  let cleanup;
  let state;
  const root = { parentElement: { parentElement: null }, appendChild: jest.fn() };
  const probe = { style: {}, remove: jest.fn() };
  const view = {
    CSS: { supports: (_property, value) => value !== 'invalid' },
    getComputedStyle: (element) => element === root
      ? { getPropertyValue: (name) => values[name] || '' }
      : { color: probe.style.color },
    MutationObserver: class {
      constructor(callback) { notify = callback; }
      observe(node) { observed.push(node); }
      disconnect() { observed.length = 0; }
    },
    requestAnimationFrame: (callback) => { pending = callback; return 1; },
    cancelAnimationFrame: () => { pending = undefined; },
    addEventListener: (name, callback) => { listeners[name] = callback; },
    removeEventListener: (name) => { delete listeners[name]; },
  };
  root.ownerDocument = {
    defaultView: view, head: {}, createElement: () => probe,
    addEventListener: view.addEventListener, removeEventListener: view.removeEventListener,
  };
  const context = { window: { antd: {},
    React: {
      createContext: () => ({}),
      createElement: (type, props, ...children) => ({ type, props, children }),
      useMemo: (factory) => factory(),
      useRef: (value) => ({ current: value === null ? root : value }),
      useState: (value) => { state = value; return [value, (update) => { state = update(state); }]; },
      useLayoutEffect: (effect) => { cleanup = effect(); },
    },
  } };
  vm.createContext(context);
  vm.runInContext(runtime, context);
  return { context, root, values, probe, observed, listeners,
    notify: () => notify(), flush: () => pending(), cleanup: () => cleanup(), state: () => state };
}

test.each(samples)('sample %s assembles the maintained provider', (sample) => {
  const source = fs.readFileSync(path.join(__dirname, '../lib/samples', sample), 'utf8');
  const assembled = assembleApplicationTheme(source);
  expect(assembled).toContain(buildApplicationProvider(false));
  expect(assembled).not.toContain('@canvas-application-theme');
  expect(assembled).not.toMatch(/function (?:useCanvasTheme|readCanvasTheme)\(/);
  expect(assembled.match(/function CanvasThemeProvider\(/g)).toHaveLength(1);
  expect(compileCanvasLocal(assembled).runtimeCode).toContain('CanvasThemeProvider');
});

test('assembly preserves ordinary sources and rejects duplicate markers', () => {
  expect(assembleApplicationTheme('const value = 1;')).toBe('const value = 1;');
  expect(() => assembleApplicationTheme('/* @canvas-application-theme *//* @canvas-application-theme */')).toThrow('exactly one');
});

test('reads component scope and omits invalid colors', () => {
  const fixture = setup();
  fixture.values['--color-text1-4'] = 'invalid';
  const token = fixture.context.resolveCanvasTheme(fixture.root);
  expect(token.colorPrimary).toBe('rgb(0, 128, 0)');
  expect(token.colorLink).toBe(token.colorPrimary);
  expect(token.colorText).toBeUndefined();
  expect(token.colorError).toBeUndefined();
  expect(fixture.probe.remove).toHaveBeenCalled();
});

test('refreshes after late theme load and clears removed tokens, then cleans up', () => {
  const fixture = setup();
  fixture.context.CanvasThemeProvider({});
  expect(fixture.state().token.colorPrimary).toBe('rgb(0, 128, 0)');
  expect(fixture.observed).toEqual([fixture.root, fixture.root.parentElement, fixture.root.ownerDocument.head]);
  fixture.values['--color-brand1-6'] = 'rgb(255, 128, 0)';
  fixture.listeners.load({ target: { tagName: 'LINK' } });
  fixture.flush();
  expect(fixture.state().token.colorPrimary).toBe('rgb(255, 128, 0)');
  delete fixture.values['--color-brand1-6'];
  fixture.notify();
  fixture.flush();
  expect(fixture.state()).toEqual({ token: {}, status: 'missing' });
  fixture.cleanup();
  expect(fixture.observed).toEqual([]);
  expect(fixture.listeners).toEqual({});
});

test('sample command outputs the maintained provider in application mode', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'canvas-theme-'));
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const output = path.join(directory, 'theme.jsx');
    await run(['openyida-page-template', 'canvas-theme', '--output', output]);
    const source = fs.readFileSync(output, 'utf8');
    expect(source).toBe(provider);
    expect(source).not.toContain('#1677ff');
    expect(source).not.toContain('function YidaComp');
  } finally {
    errorSpy.mockRestore();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});


test('page and panel roles use their own platform token before the shared white fallback', () => {
  const fixture = setup();
  fixture.values['--color-white'] = 'rgb(250, 250, 250)';
  fixture.values['--pod-page-bg-color'] = 'rgb(240, 240, 240)';
  const token = fixture.context.resolveCanvasTheme(fixture.root);
  expect(token.colorBgLayout).toBe('rgb(240, 240, 240)');
  expect(token.colorBgContainer).toBe('rgb(250, 250, 250)');
  expect(token.colorBgElevated).toBe(token.colorBgContainer);
  fixture.values['--pod-card-bg-color'] = 'rgb(255, 255, 255)';
  expect(fixture.context.resolveCanvasTheme(fixture.root).colorBgContainer).toBe('rgb(255, 255, 255)');
});

test('theme parse errors clear stale colors and expose an error state', () => {
  const fixture = setup();
  fixture.context.CanvasThemeProvider({});
  fixture.root.ownerDocument.defaultView.CSS.supports = () => { throw new Error('invalid style'); };
  fixture.listeners['openyida:theme-change']();
  fixture.flush();
  expect(fixture.state()).toEqual({ token: {}, status: 'error' });
  fixture.cleanup();
});
