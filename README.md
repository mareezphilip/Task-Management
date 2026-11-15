# Task Management Dashboard

A responsive **Angular 20** dashboard with task management, a Kanban board, English/Arabic localization, and a persistent mock API.

**Lighthouse Accessibility: 100/100** — achieved in the project's reported Lighthouse test.

## Features

**Create, edit, and delete tasks** with validation and confirmation dialogs.
**Search** titles and descriptions, and filter by status, priority, or assignee.
**Drag and drop** tasks to change status or reorder them.
View task statistics and **Chart.js analytics** for task distribution by status and priority, alongside **recent activity**.
**Team Directory / User Management:** Browse and search team members, and assign them to tasks. The member list can use mocked data.
Switch between **English and Arabic**, with RTL support and a saved language preference.
**Responsive layouts**, loading indicators, and error notifications.

## Technology choices

| Technology                                   | Why it is used                                                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Angular 20 and TypeScript 5.9                | Standalone components, dependency injection, routing, and strict type checking.                                        |
| Signals                                      | Simple reactive state; `computed()` derives filtered tasks and statistics without an extra state library.              |
| Angular Material 20                          | Task/confirmation dialogs and snackbar notifications with focus management.                                            |
| PrimeNG 20 and Aura                          | Selects, checkboxes, and text inputs for task forms.                                                                   |
| Angular CDK                                  | Drag-and-drop task movement and ordering.                                                                              |
| Chart.js                                     | Responsive doughnut and bar charts for task status and priority analytics.                                             |
| Reactive Forms                               | Validation, dirty/touched state, and shared create/edit behavior.                                                      |
| Angular `httpResource`, HttpClient, and RxJS | Signal-based HTTP reads with `httpResource`, plus mutation requests, loading/error handling, and subscription cleanup. |
| Custom localization and SCSS                 | English/Arabic dictionaries, RTL/LTR layouts, and responsive styling.                                                  |
| Node.js and JSON files                       | A persistent mock backend without database setup.                                                                      |
| Jasmine, Karma, and Node tests               | Angular component/service tests and backend behavior tests.                                                            |
| ESLint, Prettier, and Husky                  | Code quality, formatting, and staged-file checks before commits.                                                       |
| Docker, Nginx, and GitHub Actions            | Containerized delivery and automated validation/image publishing.                                                      |

## Setup

Use **Node.js 22.22.1+ within the Node 22 release line**, npm, and Git. Chrome/Chromium is required for browser tests.

```bash
npm ci
npm run start:api
```

In a second terminal, run `npm start`, then open **http://localhost:4200**. Keep both processes running.

### Configuration

- API: port `3001`, configurable through `API_PORT`. Update `proxy.conf.json` if changing it.
- Browser requests: relative `/api` URLs, forwarded by the development proxy or production Nginx.
- Data: `public/data-fetching/`; task changes persist to JSON files.
- Translations: `public/assets/i18n/en.json` and `ar.json`.
- No `.env` loader or Angular environment-file replacement is configured.

`node data-fetching/generate-data.js` regenerates demo tasks/statistics with current dates and **overwrites existing task/statistics data**.

## Commands

| Command                                                               | Purpose                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------- |
| `npm start` / `npm run start:api`                                     | Start the frontend / mock API.                                |
| `npm run build`                                                       | Production output: `dist/task-management-dashboard/browser/`. |
| `npm run watch`                                                       | Rebuild in development mode when files change.                |
| `npm test`                                                            | Angular tests in watch mode.                                  |
| `npm test -- --watch=false --browsers=ChromeHeadless --code-coverage` | Headless tests and reports in `coverage/`.                    |
| `node --test data-fetching/server.spec.js`                            | Backend tests.                                                |
| `npm run lint` / `npm run format`                                     | Lint / format the project.                                    |
| `npm run ng -- <command>`                                             | Run Angular CLI commands.                                     |
| `npm run prepare`                                                     | Install Husky hooks; also runs during installation.           |

Husky runs `lint-staged` before commits to lint and format staged files.

## Architecture and state

- `core/`: HTTP interceptors, loading/error handling, and localization.
- `features/dashboard/` and `features/team/`: lazy-loaded feature routes around standalone components.
- `shared/` and `layout/`: reusable UI and the application shell.
- `data-fetching/`: mock API, data generator, and backend tests.

The dashboard container coordinates data and dialogs; presentational components receive inputs and emit events. Services use `inject()` for dependency injection. `DashboardDataService` owns writable task state and exposes a read-only signal; successful mutations update it. Computed signals derive views and metrics. Drag-and-drop updates optimistically and restores saved state on failure.

Reactive Forms handle required fields, non-whitespace text, title length, email validation, and assignee selection. Dirty forms require discard confirmation.

## API and caching

The Node API supports task CRUD at `/api/tasks`, movement at `/api/tasks/:id/move`, and reads at `/api/statistics` and `/api/team`. `/api/translations` translates task content into Arabic. Status values are `todo`, `in_progress`, and `done`.

The cache interceptor stores successful task/statistics GET responses for **five minutes**, using the full URL and query parameters as the key. Task mutations invalidate the cache; translation requests do not. Cache entries live in browser memory and reset on reload.

**Centralized error handling:** A global HTTP interceptor catches API errors and delegates them to `GlobalErrorHandler`, which displays the server message or a fallback message through an Angular Material snackbar. The interceptor also manages a shared loading counter and uses `finalize()` to clear loading state on success or failure.

## Localization and performance

English/Arabic UI dictionaries load synchronously. Language switching updates document `lang`/`dir` and saves the preference in local storage. Task content is translated separately through MyMemory, with batching, caching, and source-text fallback when the provider is unavailable.

Performance uses **OnPush**, zoneless change detection, Signals, lazy-loaded routes, tracked `@for` lists, HTTP caching, and `takeUntilDestroyed()` where used. Production builds enable optimization, output hashing, and bundle budgets.

## Accessibility — Lighthouse 100/100

The project achieved an **accessibility score of 100/100 in Lighthouse**, as reported by the project author. The UI includes accessible labels, ARIA states, visible keyboard focus, associated form errors, and dialog focus management, with English/Arabic and responsive layouts.

The Lighthouse report is not committed to the repository; the score refers to the reported test run.

## Testing

Angular tests use Jasmine/Karma, TestBed, and HTTP mocks. Node tests cover persisted task movement and translation behavior. Set `CHROME_BIN` if Chrome is not detected automatically.

Local validation on **14 November 2026** passed **43 Angular tests** and **2 API tests**. Coverage: **81.53% statements**, **83.73% lines**, **62.23% branches**, and **69.23% functions**. CI uploads reports; a minimum coverage threshold is not enforced.

## CI/CD and Docker

[CI](.github/workflows/ci.yml) runs on pushes/pull requests: install dependencies, lint, run Angular/API tests, build production assets, build both containers, and smoke-test the frontend/API. Coverage/build artifacts are retained for 14 days.

[CD](.github/workflows/cd.yml) publishes web/API images to **GitHub Container Registry** after successful CI for pushes to `master` or branches starting with `v`. It publishes the tested commit using `GITHUB_TOKEN`; enable Actions and package publishing permissions. Images receive branch/SHA tags, plus `latest` for `master`.

### Run with Docker Compose

Install **Docker Engine with the Compose plugin**, or **Docker Desktop**, and make sure Docker is running. Run these commands from the repository root, which contains [compose.yaml](compose.yaml):

```bash
docker compose up --build -d
docker compose ps
```

Open **http://localhost:8080**. Docker builds the application and starts both services; you do not need to run `npm ci`, `npm start`, or the API separately on your host.

- **`web`** serves the Angular production build through Nginx on host port `8080` and forwards `/api` requests to the API container.
- **`api`** runs the Node mock API on container port `3001`. It is available inside the Compose network and is not published directly to the host. The web service starts after the API health check passes.
- **`task-data`** is a named volume that persists the API's JSON data across container restarts and rebuilds.

| Command                        | Purpose                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| `docker compose up --build -d` | Build or rebuild images and start both services in the background.      |
| `docker compose ps`            | Show container status and published ports.                              |
| `docker compose logs -f`       | Follow logs from both services; press Ctrl+C to stop following.         |
| `docker compose logs -f api`   | Follow only the API logs.                                               |
| `docker compose restart`       | Restart the existing containers without rebuilding images.              |
| `docker compose down`          | Stop and remove containers and the Compose network, keeping saved data. |

To use a different host port, change `"8080:80"` to, for example, `"18080:80"` in `compose.yaml`, then run `docker compose up -d` and open **http://localhost:18080**. The current Compose file uses a fixed port mapping; it does not read `WEB_PORT`.

The data volume survives `docker compose down`. Adding `--volumes` deletes it and removes saved task changes.

## Limitations and next steps

- Replace demo JSON storage with a database and authentication; add durable activity history.
- Improve branch/function coverage, add end-to-end tests, and reduce the initial bundle (692.43 kB, above the 500 kB warning budget).
- Task translation depends on provider availability; live-server rollout remains to be configured after image publishing.
