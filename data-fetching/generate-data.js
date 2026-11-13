const fs = require('node:fs');
const path = require('node:path');

const outputDirectory = path.resolve(__dirname, '../public/data-fetching');
fs.mkdirSync(outputDirectory, { recursive: true });

const now = new Date();
const dateAt = (offsetDays) => {
  const date = new Date(now);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};
const today = now.toISOString().slice(0, 10);

const tasks = [
  {
    id: 'task-1', title: 'Prepare Q4 budget report',
    description: 'Compile and analyze financial data for the quarterly budget presentation.',
    status: 'todo', priority: 'high', dueDate: dateAt(-2), isOverdue: true, completedAt: null,
    assignee: { id: 'user-1', name: 'Sarah Smith', avatar: '', email: 'sarah@example.com' },
    tags: ['Finance', 'Planning'], createdAt: dateAt(-12), updatedAt: dateAt(-1),
  },
  {
    id: 'task-2', title: 'Design new homepage layout',
    description: 'Create wireframes and mockups for the homepage redesign.',
    status: 'todo', priority: 'high', dueDate: dateAt(2), isOverdue: false, completedAt: null,
    assignee: { id: 'user-2', name: 'John Davis', avatar: '', email: 'john@example.com' },
    tags: ['Design', 'Website'], createdAt: dateAt(-8), updatedAt: dateAt(-1),
  },
  {
    id: 'task-3', title: 'Update API documentation',
    description: 'Review and update API documentation for the v2.0 release.',
    status: 'todo', priority: 'medium', dueDate: dateAt(5), isOverdue: false, completedAt: null,
    assignee: { id: 'user-1', name: 'Sarah Smith', avatar: '', email: 'sarah@example.com' },
    tags: ['Documentation'], createdAt: dateAt(-6), updatedAt: dateAt(-2),
  },
  {
    id: 'task-4', title: 'Update payment gateway integration',
    description: 'Migrate to the new payment provider API and update billing logic.',
    status: 'in_progress', priority: 'high', dueDate: dateAt(-1), isOverdue: true, completedAt: null,
    assignee: { id: 'user-2', name: 'John Davis', avatar: '', email: 'john@example.com' },
    tags: ['Backend', 'Payments'], createdAt: dateAt(-10), updatedAt: dateAt(0),
  },
  {
    id: 'task-5', title: 'Implement user authentication',
    description: 'Add JWT-based authentication with refresh token support.',
    status: 'in_progress', priority: 'high', dueDate: dateAt(3), isOverdue: false, completedAt: null,
    assignee: { id: 'user-3', name: 'Mike Taylor', avatar: '', email: 'mike@example.com' },
    tags: ['Backend', 'Security'], createdAt: dateAt(-7), updatedAt: dateAt(0),
  },
  {
    id: 'task-6', title: 'Fix mobile login issue',
    description: 'Resolve the issue preventing users from logging in on mobile devices.',
    status: 'done', priority: 'medium', dueDate: dateAt(-1), isOverdue: false, completedAt: dateAt(0),
    assignee: { id: 'user-3', name: 'Mike Taylor', avatar: '', email: 'mike@example.com' },
    tags: ['Bug Fix', 'Mobile'], createdAt: dateAt(-5), updatedAt: dateAt(0),
  },
];

const statistics = [
  { id: 'total-tasks', title: 'Total Tasks', icon: '/assets/dashboard/totalTasks.svg', value: tasks.length, change: '+2', changeLabel: 'this week', changeType: 'positive', color: 'blue' },
  { id: 'completed', title: 'Completed', icon: '/assets/dashboard/completed.svg', value: tasks.filter((task) => task.status === 'done').length, change: '+1', changeLabel: 'today', changeType: 'positive', color: 'green' },
  { id: 'in-progress', title: 'In Progress', icon: '/assets/dashboard/inProgress.svg', value: tasks.filter((task) => task.status === 'in_progress').length, change: 'Active', changeLabel: 'right now', changeType: 'neutral', color: 'slate' },
  { id: 'overdue', title: 'Overdue', icon: '/assets/dashboard/overdue.svg', value: tasks.filter((task) => task.isOverdue).length, change: 'Needs attention', changeLabel: 'past due', changeType: 'negative', color: 'red' },
];

const writeJson = (fileName, value) => {
  fs.writeFileSync(path.join(outputDirectory, fileName), `${JSON.stringify(value, null, 2)}\n`);
};

writeJson('tasks.json', { tasks, meta: { totalCount: tasks.length, lastUpdated: now.toISOString() } });
writeJson('statistics.json', { statistics, lastUpdated: now.toISOString() });
console.log(`Generated tasks.json and statistics.json for ${today} in ${outputDirectory}`);
