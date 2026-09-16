'use strict';

const Babel = require('@babel/standalone');
const { CliError } = require('../core/cli-error');
const { t } = require('../core/i18n');

// Check the maintained theme contract without executing business code.
// Dynamic component factories and runtime branches still need browser verification.
function assertCanvasThemeStructure(source, options = {}) {
  if (!/CanvasThemeProvider|useCanvasThemeContext|CanvasThemeContext/.test(source)) { return; }
  let ast;
  try {
    ast = Babel.packages.parser.parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch { return; } // Let the compiler report syntax errors.
  const traverse = Babel.packages.traverse.default || Babel.packages.traverse;
  const functions = new Map();
  let program;
  let defaultExport;
  const fail = (kind, node) => {
    const line = node?.loc?.start.line || 1;
    throw new CliError(t(`publish.canvas_theme_${kind}`, line), {
      code: 'OPENYIDA_CANVAS_THEME_PROVIDER_INVALID',
      details: { stage: 'canvas_compile', sourcePath: options.sourcePath || '', line, issueType: kind },
    });
  };

  traverse(ast, {
    Program(p) { program = p; },
    ExportDefaultDeclaration(p) { defaultExport = p.get('declaration'); },
    Function(p) {
      const name = p.node.id?.name || (p.parentPath.isVariableDeclarator() ? p.parentPath.node.id.name : '');
      functions.set(p.node, { name, calls: [], renders: [], hooks: [] });
    },
    VariableDeclarator(p) {
      if (p.node.id.name === 'CanvasThemeContext' && p.getFunctionParent()) {
        fail('context_scope', p.node);
      }
    },
  });

  function resolveFunction(p, seen = new Set()) {
    if (!p?.node || seen.has(p.node)) { return null; }
    seen.add(p.node);
    if (p.isFunction()) { return p.node; }
    if (p.isVariableDeclarator()) { return resolveFunction(p.get('init'), seen); }
    if (p.isIdentifier() || p.isJSXIdentifier()) {
      return resolveFunction(p.scope.getBinding(p.node.name)?.path, seen);
    }
    // React.memo/forwardRef retain the wrapped component's theme requirements.
    if (p.isCallExpression()) {
      const callee = p.node.callee;
      const name = callee.type === 'Identifier' ? callee.name : callee.property?.name;
      if (['memo', 'forwardRef'].includes(name)) { return resolveFunction(p.get('arguments.0'), seen); }
    }
    return null;
  }

  traverse(ast, {
    CallExpression(p) {
      const owner = functions.get(p.getFunctionParent()?.node);
      const target = resolveFunction(p.get('callee'));
      const targetName = functions.get(target)?.name || p.node.callee.name;
      if (targetName === 'useCanvasThemeContext') {
        if (!owner) { fail('root_hook', p.node); }
        owner.hooks.push(p.node);
      }
      if (!owner) { return; }
      if (target) { owner.calls.push(target); }
      const callee = p.node.callee;
      if (callee.type === 'MemberExpression' && callee.object.name === 'React' && callee.property.name === 'createElement') {
        const component = resolveFunction(p.get('arguments.0'));
        if (component) { owner.renders.push(component); }
      }
    },
    JSXOpeningElement(p) {
      const owner = functions.get(p.getFunctionParent()?.node);
      const component = resolveFunction(p.get('name'));
      if (owner && component) { owner.renders.push(component); }
    },
  });

  const entry = resolveFunction(program.scope.getBinding('YidaComp')?.path) || resolveFunction(defaultExport);
  if (!entry) { return; }

  // Calling a hook before returning a Provider cannot read that Provider.
  const directSeen = new Set();
  function checkEntryCalls(node) {
    if (directSeen.has(node)) { return; }
    directSeen.add(node);
    const info = functions.get(node);
    if (info.hooks.length) { fail('root_hook', info.hooks[0]); }
    info.calls.forEach(checkEntryCalls);
  }
  checkEntryCalls(entry);

  const seen = new Set();
  let providerMounted = false;
  let firstHook;
  function visit(node) {
    if (seen.has(node)) { return; }
    seen.add(node);
    const info = functions.get(node);
    firstHook = firstHook || info.hooks[0];
    info.renders.forEach(child => {
      if (functions.get(child).name === 'CanvasThemeProvider') { providerMounted = true; }
      visit(child);
    });
    info.calls.forEach(visit);
  }
  visit(entry);
  const hasProvider = [...functions.values()].some(info => info.name === 'CanvasThemeProvider');
  if (!providerMounted && (hasProvider || firstHook)) {
    fail('provider_missing', firstHook || entry);
  }
}

module.exports = { assertCanvasThemeStructure };
