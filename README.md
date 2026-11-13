# TaskPulse

TaskPulse is a local-first checklist and daily planning app built for fast, focused task management. It combines grouped checklists, smart natural-language quick entry, recurring reminders, and mobile-like notifications in a clean interface designed for everyday productivity.

Whether you are planning today’s priorities, scheduling recurring tasks, or capturing an idea in a few seconds, TaskPulse helps you move from intention to completion without a complicated backend or account setup.

## Why TaskPulse?

TaskPulse is designed for people who want a lightweight, fast, and private productivity tool:

- Keep tasks organized by groups and categories
- Add items using natural language like “Buy groceries tomorrow at 18:00”
- Review work in Today, Upcoming, Anytime, and Groups views
- Manage recurring tasks automatically
- Receive local browser/mobile notifications for time-based reminders
- Use it as a PWA or wrap it for Android with Capacitor

## Core Features

- Smart task entry with quick parsing for dates, times, recurrence, and group tags
- Grouped checklist organization for projects, routines, and contexts
- Today / Upcoming / Anytime dashboard views
- Recurring task support for daily, weekly, and monthly routines
- Search and status filtering to focus on open or completed tasks
- Local-first storage using browser storage, with no remote database required
- Push-like notifications using the Web Notification API, vibration, and audio chime
- Progressive Web App support for installable mobile-style usage
- Android build pipeline via Capacitor

## Screenshot

<img width="328" height="589" alt="image" src="https://github.com/user-attachments/assets/dcece7ce-e058-44f7-8c91-7703e88a1b02" />


## Tech Stack

- React 19 + TypeScript
- Vite for development and build tooling
- Tailwind CSS for styling
- PWA support via Vite PWA plugin
- Capacitor for Android packaging
- Express dev server for local execution

## Project Structure

```text
.
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── public/
├── android/
├── server.ts
├── capacitor.config.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── bun.lock
└── metadata.json
```

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm or bun

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

This starts the local development server and serves the app in the browser.

### Production build

```bash
npm run build
```

### Lint / type check

```bash
npm run lint
```

## Android Build

The app includes an Android build flow using Capacitor.

```bash
npm run android:build
```

This script builds the web app, syncs it with Android, assembles the debug APK, and copies it to `build/TaskPulse.apk`.

## Local-First Architecture

TaskPulse is intentionally designed to work without a backend service:

- checklist data is stored locally in the browser
- notifications are generated on-device
- date and task parsing runs client-side for instant feedback
- the app can function offline after installation

This makes it well suited for personal productivity workflows, mobile-style usage, and quick task capture without cloud setup.

## Usage Examples

TaskPulse supports quick natural-language entries such as:

- “Buy groceries tomorrow at 18:00”
- “Workout every Monday at 07:00”
- “Call mom in 2 days”
- “Pay rent #Finance”

The app automatically detects:

- due date
- due time
- recurring pattern
- group association
- whether the task is anytime-based

## App Workflow

1. Create or select a checklist group
2. Add a task using quick input or voice input
3. Review tasks in Today, Upcoming, or Anytime views
4. Mark work complete as you go
5. Allow reminders for timed tasks to stay on schedule

## Contributing

Contributions are welcome. To propose improvements:

1. Fork the repository
2. Create a feature branch
3. Make your change
4. Run the relevant validation commands
5. Open a pull request with a clear description

## License

Apache 2.0

## Notes

TaskPulse is a mobile-friendly productivity app focused on speed, privacy, and usability. It is especially useful for users who prefer lightweight planning without the overhead of a full SaaS task management platform.
