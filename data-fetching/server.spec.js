const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');

test('task moves persist column and order, and invalid moves leave saved data unchanged', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'task-board-'));
  const dataDirectory = path.join(directory, 'public/data-fetching');
  fs.mkdirSync(dataDirectory, { recursive: true });
  const tasksPath = path.join(dataDirectory, 'tasks.json');
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data-fetching/tasks.json'), 'utf8'));
  const original = seed.tasks[0];
  seed.tasks = ['first', 'second', 'third'].map((id) => ({ ...original, id, status: 'todo' }));
  fs.writeFileSync(tasksPath, JSON.stringify(seed));
  fs.copyFileSync(path.join(__dirname, '../public/data-fetching/statistics.json'), path.join(dataDirectory, 'statistics.json'));
  let server;
  const source = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  vm.runInNewContext(source, {
    require: (name) => name === 'node:http' ? {
      createServer: (handler) => {
        server = http.createServer(handler);
        return { listen() {} };
      },
    } : require(name),
    __dirname: path.join(directory, 'data-fetching'),
    process: { env: {} },
    console,
    URL,
  });
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/tasks`;
    const move = (id, status, beforeTaskId) => fetch(`${base}/${id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, beforeTaskId }),
    });
    const saved = () => JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

    assert.equal((await move('third', 'todo', 'first')).status, 200);
    assert.deepEqual(saved().tasks.map((task) => task.id), ['third', 'first', 'second']);
    assert.deepEqual((await (await fetch(base)).json()).tasks.map((task) => task.id), ['third', 'first', 'second']);

    assert.equal((await move('first', 'done', null)).status, 200);
    assert.equal(saved().tasks.find((task) => task.id === 'first').status, 'done');
    assert.ok(saved().tasks.find((task) => task.id === 'first').completedAt);
    assert.equal((await move('second', 'done', 'first')).status, 200);
    const done = await (await fetch(`${base}?status=done`)).json();
    assert.deepEqual(done.tasks.map((task) => task.id), ['second', 'first']);

    assert.equal((await move('second', 'in_progress', null)).status, 200);
    assert.equal(saved().tasks.find((task) => task.id === 'second').completedAt, null);
    const beforeInvalid = fs.readFileSync(tasksPath, 'utf8');
    assert.equal((await move('third', 'todo', 'first')).status, 400);
    assert.equal((await move('third', 'todo', 'third')).status, 400);
    assert.equal((await move('missing', 'todo', null)).status, 404);
    assert.equal((await move('third', 'invalid', null)).status, 400);
    assert.equal(fs.readFileSync(tasksPath, 'utf8'), beforeInvalid);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('task translations use MyMemory without configuration and cache arbitrary content', async () => {
  let handler;
  let providerStatus = 200;
  let providerResult = { responseStatus: 200, responseData: { translatedText: 'مهمة جديدة' } };
  const calls = [];
  const env = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8'), {
    require: (name) => name === 'node:http' ? {
      createServer: (callback) => { handler = callback; return { listen() {} }; },
    } : require(name),
    __dirname,
    process: { env },
    console,
    URL,
    AbortSignal,
    fetch: async (url, options) => {
      calls.push({ url: String(url) });
      return { ok: providerStatus === 200, json: async () => providerResult };
    },
  });
  const { EventEmitter } = require('node:events');
  const translate = async (input) => {
    const request = new EventEmitter();
    request.url = '/api/translations';
    request.method = 'POST';
    let status;
    let body;
    const completion = handler(request, {
      writeHead: (value) => { status = value; },
      end: (value) => { body = JSON.parse(value); },
    });
    request.emit('data', JSON.stringify(input));
    request.emit('end');
    await completion;
    return { status, body };
  };
  assert.equal((await translate({ texts: ['New task'], target: 'fr' })).status, 400);
  assert.equal((await translate({ texts: [''], target: 'ar' })).status, 400);
  assert.equal((await translate({ texts: Array(51).fill('Text'), target: 'ar' })).status, 400);
  assert.equal(calls.length, 0);
  const input = { texts: ['New task'], target: 'ar' };
  const result = await translate(input);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { translations: ['مهمة جديدة'] });
  const providerUrl = new URL(calls[0].url);
  assert.equal(providerUrl.origin, 'https://api.mymemory.translated.net');
  assert.equal(providerUrl.searchParams.get('q'), 'New task');
  assert.equal(providerUrl.searchParams.get('langpair'), 'en|ar');
  assert.equal((await translate(input)).status, 200);
  assert.equal(calls.length, 1);
  assert.deepEqual((await translate({ texts: ['مهمة جديدة'], target: 'ar' })).body.translations, ['مهمة جديدة']);
  assert.equal(calls.length, 1);
  const longInput = { texts: ['English ' + 'وصف طويل '.repeat(100)], target: 'ar' };
  assert.equal((await translate(longInput)).status, 200);
  assert.ok(calls.length > 2);
  assert.ok(calls.every(({ url }) => Buffer.byteLength(new URL(url).searchParams.get('q'), 'utf8') <= 500));
  providerStatus = 429;
  const uncached = { texts: ['Another task'], target: 'ar' };
  assert.equal((await translate(uncached)).status, 502);
  providerStatus = 200;
  providerResult = { responseStatus: 403, responseData: { translatedText: 'Daily limit reached' } };
  assert.equal((await translate(uncached)).status, 502);
  providerResult = { responseStatus: 200, responseData: { translatedText: 'مهمة أخرى' } };
  assert.equal((await translate(uncached)).status, 200);
});
