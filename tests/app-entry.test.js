'use strict';

jest.mock('../lib/core/yida-client', () => ({
  createAuthRef: jest.fn(() => ({ baseUrl: 'https://tenant.example.com' })),
  createYidaClient: jest.fn(),
  unwrapYidaResponse: jest.fn((response) => {
    if (response.success === false) { throw new Error(response.errorMsg); }
    return response.content;
  }),
}));
const { createAuthRef, createYidaClient } = require('../lib/core/yida-client');
const { run, parseArgs, normalizePath } = require('../lib/app/app-entry');
const origin = 'https://tenant.example.com';
const response = (accessEntries, revision = 'v1') => ({ success: true, content: { accessEntries, revision } });
let client;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  client = { get: jest.fn(), postForm: jest.fn().mockResolvedValue(response({})) };
  createYidaClient.mockReturnValue(client);
});
afterEach(() => jest.restoreAllMocks());

test.each([
  ['/APP/custom/FORM', '/APP/custom/FORM'],
  [`${origin}/APP/workbench/FORM?viewUuid=VIEW#tab`, '/APP/workbench/FORM?viewUuid=VIEW#tab'],
  ['/APP/workbench', '/APP/workbench'],
  ['/APP/submission/FORM', '/APP/submission/FORM'],
])('normalizes a runtime address %s', (input, expected) => {
  expect(normalizePath(input, 'APP', origin)).toBe(expected);
});
test.each([
  '/OTHER/custom/FORM', '//evil.test/APP/custom/FORM', 'https://evil.test/APP/workbench',
  '/APP/admin', '/APP/custom/../admin', '/APP/custom/%2e%2e', '/APP/custom/FORM?token=secret',
  '/APP/workbench/FORM?viewUuid=X&token=secret', '/APP/custom/FORM#<script>',
  '/APP/custom/FORM\\x', '/APP/custom/FORM\nsecret', '/APP/workbench?', '/APP/workbench#',
])('rejects unsafe or transient address %s', (input) => {
  expect(() => normalizePath(input, 'APP', origin)).toThrow();
});
test.each([
  ['set', 'APP'], ['get', '../APP'], ['set', 'APP', '--frontend'],
  ['set', 'APP', '--frontend', '--management'], ['get', 'APP', '--clear-frontend'],
  ['set', 'APP', '--frontend', '/APP/custom/F', '--clear-frontend'],
])('rejects ambiguous arguments %j', (...args) => expect(() => parseArgs(args)).toThrow());
test('help does not require authentication', async () => {
  await run(['--help']);
  expect(createAuthRef).not.toHaveBeenCalled();
});
test('updates only the supplied entry and uses the read revision', async () => {
  const management = { path: '/APP/workbench' };
  client.get.mockResolvedValueOnce(response({ management })).mockResolvedValueOnce(response({
    management, frontend: { path: '/APP/custom/FORM' },
  }, 'v2'));
  const result = await run(['set', 'APP', '--frontend', `${origin}/APP/custom/FORM`, '--json']);
  expect(client.postForm).toHaveBeenCalledWith('/APP/query/app/saveAccessEntries.json', {
    accessEntries: JSON.stringify({ frontend: { path: '/APP/custom/FORM' } }), revision: 'v1',
  });
  expect(result.accessEntries.management).toEqual(management);
  expect(client.get).toHaveBeenCalledTimes(2);
});
test('clear is explicit and leaves other entries alone', async () => {
  client.get.mockResolvedValueOnce(response({ frontend: { path: '/APP/custom/F' } })).mockResolvedValueOnce(response({}, 'v2'));
  await run(['set', 'APP', '--clear-frontend']);
  expect(JSON.parse(client.postForm.mock.calls[0][1].accessEntries)).toEqual({ frontend: null });
});
test('conflict does not retry or overwrite', async () => {
  client.get.mockResolvedValue(response({}));
  client.postForm.mockResolvedValue({ success: false, errorMsg: 'conflict' });
  await expect(run(['set', 'APP', '--management', '/APP/workbench'])).rejects.toThrow('conflict');
  expect(client.postForm).toHaveBeenCalledTimes(1);
  expect(client.get).toHaveBeenCalledTimes(1);
});
test('missing revision prevents writes', async () => {
  client.get.mockResolvedValue(response({}, ''));
  await expect(run(['set', 'APP', '--management', '/APP/workbench'])).rejects.toThrow();
  expect(client.postForm).not.toHaveBeenCalled();
});
test('readback mismatch is not reported as success', async () => {
  client.get.mockResolvedValue(response({}));
  await expect(run(['set', 'APP', '--management', '/APP/workbench'])).rejects.toThrow();
  expect(console.log).not.toHaveBeenCalled();
});
test('get is read-only and returns resolved URLs', async () => {
  client.get.mockResolvedValue(response({ management: { path: '/APP/workbench' } }));
  await run(['get', 'APP']);
  expect(client.postForm).not.toHaveBeenCalled();
  expect(JSON.parse(console.log.mock.calls[0][0]).urls.management).toBe(`${origin}/APP/workbench`);
});
