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
