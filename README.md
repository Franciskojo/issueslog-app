# IssuesLog — Asana-Style Issue Tracking System

A modern, fast, and intuitive work & issue management platform tailored for seamless collaboration between technical resolvers and non-technical departments. Designed with Asana-inspired UX, including grouped lists, interactive kanban boards, slide-over task drawers, and dedicated personal task queues.

---

## ✨ Features

- **Asana-Inspired Workspace Navigation**:
  - Clean left sidebar navigation with mobile off-canvas drawer.
  - Top-right corner profile pill with account management popover menu.
  - Quick-action **"Create"** button for non-tech reporters.

- **Grouped List View with Inline Editing**:
  - Flexible grouping by **Status**, **Priority**, **Assignee**, or ungrouped.
  - Collapsible section headers with item counters.
  - Click-to-complete circular checkboxes with title strikethrough.
  - Instant inline editing for **Assignee**, **Target Due Date**, **Priority**, and **Status**.
  - Smart due date badges highlighting **Overdue**, **Today**, **Tomorrow**, and upcoming deadlines.

- **Interactive Kanban Board**:
  - Drag-and-drop card status updates (Open, In Progress, Resolved, Closed).
  - Priority color indicators, category chips, comment counts, and assignee avatars.

- **Slide-Over Task Drawer (Detail Panel)**:
  - Deep-dive into any task without losing your place in the list or board.
  - Inline property editor for assignees, status, priority, and dates.
  - Unified activity timeline combining status change audit logs and user comments.
  - Embedded comment composer and attachment viewer.

- **Dedicated "My Issues" Hub**:
  - Replicates Asana's iconic *My Tasks* workflow.
  - Automatically categorizes personal workload into **Overdue**, **Today**, **Upcoming (Next 7 Days)**, **Later / No Due Date**, and **Completed**.

- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full control over users, team roles, issue management, and deletion.
  - **Tech**: Manage and resolve issues, reassign team members, update statuses.
  - **Non-Tech**: Submit new issues, track personal tickets, and participate in discussion threads.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI & Frontend**: [React 19](https://react.dev/), TypeScript
- **Styling**: Vanilla CSS Modules with custom design tokens (dark-first theme)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Credentials Provider, JWT sessions)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Security**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js) for password hashing

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18.18.0 or newer recommended)
- [MongoDB](https://www.mongodb.com/) instance (local or MongoDB Atlas connection string)

### 2. Clone the Repository

```bash
git clone https://github.com/<your-username>/issueslog.git
cd issueslog/issueslog-app
```

### 3. Configure Environment Variables

Create a `.env.local` file in the `issueslog-app` directory (or use `.env.example` as a starting point):

```bash
cp .env.example .env.local
```

Fill in your configuration:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/issueslog?retryWrites=true&w=majority
NEXTAUTH_SECRET=your-random-32-character-secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Seed Demo Data (Optional)

Populate your database with sample users and issues:

```bash
npm run seed
```

#### Demo Credentials:
- **Admin**: `admin@tech.com` / `admin123`
- **Tech Resolver**: `dev@tech.com` / `tech123`
- **Non-Tech (Marketing)**: `sarah@marketing.com` / `user123`
- **Non-Tech (Finance)**: `michael@finance.com` / `user123`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
issueslog-app/
├── app/
│   ├── admin/             # Admin user management panel
│   ├── api/               # API route handlers (issues, users, comments, auth)
│   ├── dashboard/         # All Issues list & kanban board view
│   ├── issues/            # Issue detail and creation pages
│   ├── my-issues/         # Personal "My Tasks" queue
│   ├── globals.css        # Enterprise design system tokens & utilities
│   └── layout.tsx         # Root layout & providers
├── components/            # Reusable components (Navbar, IssueList, IssueBoard, IssueDrawer)
├── lib/                   # Utility hooks, MongoDB client, NextAuth configs
├── models/                # Mongoose database schemas (User, Issue)
└── scripts/               # Database seed scripts
```

---

## 📄 License

This project is licensed under the MIT License.
