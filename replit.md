# ProjectHub

## Overview

ProjectHub is a web-based project management application designed for creative teams (e.g., film/TV production). It follows a document-first approach where users organize work by **Clients → Projects → Pages**, with the ability to convert free-form notes into actionable tasks. The app has two main user roles: managers (full visibility) and team members (personal task view grouped by client/project). Key features include a rich text page editor (Tiptap), task management with status/priority/assignment, a team feed for shared updates, in-app notifications, and dashboard analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, built with Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; no global client state library
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Rich Text Editor**: Tiptap (ProseMirror-based) with StarterKit and Placeholder extensions for the page editor
- **Charts**: Recharts for dashboard analytics (task status distribution)
- **Animations**: Framer Motion for UI transitions
- **Styling**: Tailwind CSS with CSS variables for theming, custom color system with status colors
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript, executed via tsx
- **API Pattern**: RESTful JSON API under `/api/` prefix, with a shared route contract (`shared/routes.ts`) using Zod schemas for input validation and response typing
- **Authentication**: Replit Auth via OpenID Connect (OIDC), with Passport.js and server-side sessions stored in PostgreSQL (`connect-pg-simple`)
- **Session Management**: Express sessions with 1-week TTL, stored in the `sessions` table
- **Build**: esbuild for server bundling, Vite for client bundling; output to `dist/`

### Data Layer
- **Database**: PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-Zod validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `drizzle-kit push` command; migrations output to `./migrations`

### Database Schema
The core tables and their relationships:
- **users** — Replit Auth managed, stores id, email, name, profile image
- **sessions** — Required for Replit Auth session persistence
- **clients** — Top-level organization (e.g., A24, Netflix)
- **projects** — Belongs to a client; has name, description, status
- **pages** — Belongs to a project; stores Tiptap JSON content in `jsonb` column
- **guilds** — Guild organizations (e.g., DGA, SAG-AFTRA) with name and optional description
- **projectGuilds** — Junction table linking projects to guilds (many-to-many)
- **tasks** — Belongs to project and client; optionally linked to a page; has assignee, creator, status (todo/in_progress/review/done), priority (low/medium/high), due date, parentTaskId (for subtask hierarchy), guildId (optional guild association)
- **notifications** — Per-user notifications for assignments and updates
- **commonDocs** — Team feed posts with tags (supports @Guild, @Title, @mentions with subtask bullets that auto-create tasks)

### Key Design Patterns
- **Shared Contract**: `shared/routes.ts` defines API paths, methods, Zod input/output schemas used by both client hooks and server routes — keeps them in sync
- **Storage Interface**: `server/storage.ts` defines an `IStorage` interface abstracting all database operations, making the data layer swappable
- **Auth Middleware**: `isAuthenticated` middleware protects all API routes; user info available via `req.user.claims`
- **Auto-save Editor**: Page editor uses debounced updates (1-second delay) to auto-save content changes
- **Development Mode**: Vite dev server runs as middleware in development with HMR; production serves static built files

### Application Pages
- `/login` — Auth page with Replit Auth login
- `/` — My Tasks (personal view, tasks grouped by client → project)
- `/all-tasks` — All Tasks with table view and status chart
- `/projects` — Project Explorer grouped by client
- `/projects/:id` — Project detail with pages list and task board
- `/pages/:id` — Rich text page editor (Tiptap)
- `/team-feed` — Team Feed for shared posts and @mention task creation

## External Dependencies

### Required Services
- **PostgreSQL Database**: Must be provisioned and connected via `DATABASE_URL` environment variable
- **Replit Auth (OIDC)**: Authentication via Replit's OpenID Connect provider; requires `ISSUER_URL` (defaults to `https://replit.com/oidc`), `REPL_ID`, and `SESSION_SECRET` environment variables

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** + **drizzle-zod**: Database ORM, migrations, and schema validation
- **@tiptap/react** + **@tiptap/starter-kit** + **@tiptap/extension-placeholder**: Rich text editor
- **@tanstack/react-query**: Async server state management
- **recharts**: Dashboard charts
- **framer-motion**: Animations
- **passport** + **openid-client**: Authentication strategy
- **connect-pg-simple**: PostgreSQL session store
- **express-session**: Session middleware
- **zod**: Runtime validation throughout
- **date-fns**: Date formatting
- **wouter**: Client-side routing
- **react-day-picker**: Calendar date picker component