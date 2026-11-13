const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const dataDirectory = path.resolve(__dirname, '../public/data-fetching');
const tasksPath = path.join(dataDirectory, 'tasks.json');
const statisticsPath = path.join(dataDirectory, 'statistics.json');
const allowedStatuses = new Set(['todo', 'in_progress', 'done']);
const allowedPriorities = new Set(['low', 'medium', 'high']);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

function updateStatistics(tasks, lastUpdated) {
  const response = readJson(statisticsPath);
  for (const statistic of response.statistics) {
    if (statistic.id === 'total-tasks') statistic.value = tasks.length;
    if (statistic.id === 'completed') statistic.value = tasks.filter((task) => task.status === 'done').length;
    if (statistic.id === 'in-progress') statistic.value = tasks.filter((task) => task.status === 'in_progress').length;
    if (statistic.id === 'overdue') statistic.value = tasks.filter((task) => task.isOverdue).length;
  }
  response.lastUpdated = lastUpdated;
  fs.writeFileSync(statisticsPath, `${JSON.stringify(response, null, 2)}\n`);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');

  if (url.pathname === '/api/tasks' && request.method === 'GET') {
    const data = readJson(tasksPath);
    const status = url.searchParams.get('status');
    if (status && status !== 'all' && !allowedStatuses.has(status)) {
      sendJson(response, 400, { message: 'Unsupported task status.' });
      return;
    }
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const tasks = data.tasks.filter((task) => {
      const matchesStatus = !status || status === 'all' || task.status === status;
      const searchableText = `${task.title} ${task.description}`.toLowerCase();
      return matchesStatus && (!search || searchableText.includes(search));
    });
    sendJson(response, 200, {
      tasks,
      meta: { ...data.meta, totalCount: tasks.length },
    });
    return;
  }

  if (url.pathname === '/api/statistics' && request.method === 'GET') {
    sendJson(response, 200, readJson(statisticsPath));
    return;
  }

  if (url.pathname === '/api/tasks' && request.method === 'POST') {
    try {
      const input = await readRequestBody(request);
      if (!input.title?.trim() || !input.description?.trim() || !input.dueDate ||
          !input.assignee?.name?.trim() || !input.assignee?.email?.trim() ||
          !allowedStatuses.has(input.status) || !allowedPriorities.has(input.priority)) {
        sendJson(response, 400, { message: 'Provide a title, description, valid status and priority, due date, and assignee details.' });
        return;
      }

      const tasksResponse = readJson(tasksPath);
      const now = new Date().toISOString();
      const dueDate = new Date(`${input.dueDate}T00:00:00.000Z`);
      if (Number.isNaN(dueDate.getTime())) {
        sendJson(response, 400, { message: 'Due date must be a valid date.' });
        return;
      }
      const dateOnly = input.dueDate.slice(0, 10);
      const task = {
        id: `task-${Date.now()}`,
        title: input.title.trim(),
        description: input.description.trim(),
        status: input.status,
        priority: input.priority,
        dueDate: dueDate.toISOString(),
        isOverdue: input.status !== 'done' && dateOnly < now.slice(0, 10),
        completedAt: input.status === 'done' ? now : null,
        assignee: {
          id: `user-${Date.now()}`,
          name: input.assignee.name.trim(),
          avatar: '',
          email: input.assignee.email.trim(),
        },
        tags: Array.isArray(input.tags) ? input.tags.filter((tag) => typeof tag === 'string') : [],
        createdAt: now,
        updatedAt: now,
      };

      tasksResponse.tasks.push(task);
      tasksResponse.meta = { totalCount: tasksResponse.tasks.length, lastUpdated: now };
      fs.writeFileSync(tasksPath, `${JSON.stringify(tasksResponse, null, 2)}\n`);
      updateStatistics(tasksResponse.tasks, now);
      sendJson(response, 201, { task });
    } catch (error) {
      sendJson(response, 400, { message: error.message || 'Unable to create task.' });
    }
    return;
  }

  const moveRoute = url.pathname.match(/^\/api\/tasks\/([^/]+)\/move$/);
  if (moveRoute && request.method === 'PATCH') {
    try {
      const input = await readRequestBody(request);
      if (!allowedStatuses.has(input.status) ||
          (input.beforeTaskId !== null && typeof input.beforeTaskId !== 'string')) {
        sendJson(response, 400, { message: 'Provide a valid status and a destination task ID or null.' });
        return;
      }
      const tasksResponse = readJson(tasksPath);
      const taskIndex = tasksResponse.tasks.findIndex((task) => task.id === decodeURIComponent(moveRoute[1]));
      if (taskIndex === -1) {
        sendJson(response, 404, { message: 'Task not found.' });
        return;
      }
      const task = tasksResponse.tasks[taskIndex];
      const destination = tasksResponse.tasks.find((item) => item.id === input.beforeTaskId);
      if (input.beforeTaskId !== null &&
          (!destination || destination.id === task.id || destination.status !== input.status)) {
        sendJson(response, 400, { message: 'Destination task must belong to the target column.' });
        return;
      }

      const now = new Date().toISOString();
      task.status = input.status;
      task.isOverdue = input.status !== 'done' && task.dueDate.slice(0, 10) < now.slice(0, 10);
      task.completedAt = input.status === 'done' ? task.completedAt || now : null;
      task.updatedAt = now;
      tasksResponse.tasks.splice(taskIndex, 1);
      const beforeIndex = tasksResponse.tasks.findIndex((item) => item.id === input.beforeTaskId);
      tasksResponse.tasks.splice(beforeIndex === -1 ? tasksResponse.tasks.length : beforeIndex, 0, task);
      tasksResponse.meta = { totalCount: tasksResponse.tasks.length, lastUpdated: now };
      fs.writeFileSync(tasksPath, `${JSON.stringify(tasksResponse, null, 2)}\n`);
      updateStatistics(tasksResponse.tasks, now);
      sendJson(response, 200, tasksResponse);
    } catch (error) {
      sendJson(response, 400, { message: error.message || 'Unable to move task.' });
    }
    return;
  }

  const taskRoute = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
  if (taskRoute && (request.method === 'PUT' || request.method === 'DELETE')) {
    const taskId = decodeURIComponent(taskRoute[1]);
    const tasksResponse = readJson(tasksPath);
    const taskIndex = tasksResponse.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      sendJson(response, 404, { message: 'Task not found.' });
      return;
    }

    if (request.method === 'DELETE') {
      tasksResponse.tasks.splice(taskIndex, 1);
      const now = new Date().toISOString();
      tasksResponse.meta = { totalCount: tasksResponse.tasks.length, lastUpdated: now };
      fs.writeFileSync(tasksPath, `${JSON.stringify(tasksResponse, null, 2)}\n`);
      updateStatistics(tasksResponse.tasks, now);
      sendJson(response, 204, {});
      return;
    }

    try {
      const input = await readRequestBody(request);
      if (!input.title?.trim() || !input.description?.trim() || !input.dueDate ||
          !input.assignee?.name?.trim() || !input.assignee?.email?.trim() ||
          !allowedStatuses.has(input.status) || !allowedPriorities.has(input.priority)) {
        sendJson(response, 400, { message: 'Provide a title, description, valid status and priority, due date, and assignee details.' });
        return;
      }
      const now = new Date().toISOString();
      const dueDate = new Date(`${input.dueDate}T00:00:00.000Z`);
      if (Number.isNaN(dueDate.getTime())) {
        sendJson(response, 400, { message: 'Due date must be a valid date.' });
        return;
      }
      const existingTask = tasksResponse.tasks[taskIndex];
      const updatedTask = {
        ...existingTask,
        title: input.title.trim(),
        description: input.description.trim(),
        status: input.status,
        priority: input.priority,
        dueDate: dueDate.toISOString(),
        isOverdue: input.status !== 'done' && input.dueDate.slice(0, 10) < now.slice(0, 10),
        completedAt: input.status === 'done' ? existingTask.completedAt || now : null,
        assignee: { ...existingTask.assignee, name: input.assignee.name.trim(), email: input.assignee.email.trim() },
        tags: Array.isArray(input.tags) ? input.tags.filter((tag) => typeof tag === 'string') : [],
        updatedAt: now,
      };
      tasksResponse.tasks[taskIndex] = updatedTask;
      tasksResponse.meta = { totalCount: tasksResponse.tasks.length, lastUpdated: now };
      fs.writeFileSync(tasksPath, `${JSON.stringify(tasksResponse, null, 2)}\n`);
      updateStatistics(tasksResponse.tasks, now);
      sendJson(response, 200, { task: updatedTask });
    } catch (error) {
      sendJson(response, 400, { message: error.message || 'Unable to update task.' });
    }
    return;
  }

  sendJson(response, 404, { message: 'Endpoint not found.' });
});

const port = Number(process.env.API_PORT || 3001);
server.listen(port, () => console.log(`Task mock API listening at http://localhost:${port}`));
