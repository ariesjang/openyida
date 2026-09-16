'use strict';

const { createAuthRef, createYidaClient, unwrapYidaResponse } = require('../core/yida-client');
const { t } = require('../core/i18n');
const { throwUsage } = require('../core/command-errors');

/** Normalize a verified runtime URL to an application-relative path. */
function normalizePath(value, appType, origin) {
  const input = String(value || '').trim();
  const base = new URL(origin).origin;
  // eslint-disable-next-line no-control-regex -- reject control characters in persisted URLs
  if (!input || input.length > 2048 || /[\\\s\x00-\x1f\x7f]/.test(input) || input.startsWith('//')) {
    throw new Error(t('app_entry.invalid_path'));
  }
  const relative = input.startsWith(`${base}/`) ? input.slice(base.length) : input;
  const [route] = relative.split(/[?#]/);
  const prefix = `/${appType}/`;
  const parts = route.startsWith(prefix) ? route.slice(prefix.length).split('/') : [];
  if (!['custom', 'workbench', 'submission'].includes(parts[0]) || parts.length > 2 ||
      (parts.length === 1 && parts[0] !== 'workbench') ||
      (parts.length === 2 && !/^[A-Za-z0-9_-]+$/.test(parts[1]))) {
    throw new Error(t('app_entry.invalid_path'));
  }
  const url = new URL(relative, base);
  if (url.origin !== base || url.pathname !== route ||
      (relative.includes('?') && (parts[0] !== 'workbench' || parts.length !== 2 || !/^\?viewUuid=[A-Za-z0-9_-]+$/.test(url.search))) ||
      (relative.includes('#') && !/^#[A-Za-z0-9_/-]+$/.test(url.hash))) {
    throw new Error(t('app_entry.invalid_path'));
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Reject duplicate or ambiguous flags; omissions never clear stored entries. */
function parseArgs(args) {
  const [action, appType, ...flags] = args;
  if (!['get', 'set'].includes(action) || !/^[A-Za-z0-9_-]+$/.test(appType || '')) {
    throwUsage(t('app_entry.usage'));
  }
  const values = {};
  for (let index = 0; index < flags.length; index++) {
    const flag = flags[index];
    if (flag === '--json') {
      continue;
    }
    const match = /^--(clear-)?(frontend|management)$/.exec(flag);
    if (action !== 'set' || !match || Object.prototype.hasOwnProperty.call(values, match[2])) {
      throwUsage(t('app_entry.usage'));
    }
    const value = match[1] ? null : flags[++index];
    if (value !== null && (!value || value.startsWith('--'))) {
      throwUsage(t('app_entry.usage'));
    }
    values[match[2]] = value;
  }
  if (action === 'set' && !Object.keys(values).length) {
    throwUsage(t('app_entry.usage'));
  }
  return { action, appType, values };
}

/** Read the revision used for a conditional partial write. */
async function readEntries(client, appType) {
  const result = unwrapYidaResponse(await client.get(`/${appType}/query/app/getAccessEntries.json`));
  if (!result || typeof result.revision !== 'string' || !result.revision ||
      !result.accessEntries || typeof result.accessEntries !== 'object' || Array.isArray(result.accessEntries)) {
    throw new Error(t('app_entry.invalid_response'));
  }
  return result;
}

/** Persist only supplied entries and verify them through a separate read. */
async function run(args = []) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(t('app_entry.usage'));
    return;
  }
  const { action, appType, values } = parseArgs(args);
  const authRef = createAuthRef();
  const client = createYidaClient({ authRef });
  const patch = {};
  for (const [key, value] of Object.entries(values)) {
    patch[key] = value === null ? null : { path: normalizePath(value, appType, authRef.baseUrl) };
  }
  let result = await readEntries(client, appType);
  if (action === 'set') {
    unwrapYidaResponse(await client.postForm(`/${appType}/query/app/saveAccessEntries.json`, {
      accessEntries: JSON.stringify(patch), revision: result.revision,
    }));
    result = await readEntries(client, appType);
    for (const [key, entry] of Object.entries(patch)) {
      if ((result.accessEntries[key]?.path || '') !== (entry?.path || '')) {
        throw new Error(t('app_entry.readback_failed'));
      }
    }
  }
  const urls = {};
  for (const key of ['frontend', 'management']) {
    if (result.accessEntries[key]?.path) {
      urls[key] = new URL(normalizePath(result.accessEntries[key].path, appType, authRef.baseUrl), authRef.baseUrl).href;
    }
  }
  console.log(JSON.stringify({ appType, ...result, urls }, null, 2));
  return result;
}

module.exports = { run, parseArgs, normalizePath };
