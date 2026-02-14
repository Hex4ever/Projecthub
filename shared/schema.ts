import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";
import * as auth from "./models/auth";

export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guilds = pgTable("guilds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projectGuilds = pgTable("project_guilds", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  guildId: integer("guild_id").references(() => guilds.id).notNull(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull().default([]),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  status: text("status").default("todo"),
  priority: text("priority").default("medium"),
  dueDate: timestamp("due_date"),
  projectId: integer("project_id").references(() => projects.id),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  pageId: integer("page_id").references(() => pages.id),
  assigneeId: text("assignee_id").references(() => auth.users.id),
  creatorId: text("creator_id").references(() => auth.users.id),
  parentTaskId: integer("parent_task_id"),
  guildId: integer("guild_id").references(() => guilds.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const commonDocs = pgTable("common_docs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: text("author_id").references(() => auth.users.id).notNull(),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => auth.users.id).notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  resourceId: integer("resource_id"),
  resourceType: text("resource_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
}));

export const guildsRelations = relations(guilds, ({ many }) => ({
  projectGuilds: many(projectGuilds),
  tasks: many(tasks),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  pages: many(pages),
  tasks: many(tasks),
  projectGuilds: many(projectGuilds),
}));

export const projectGuildsRelations = relations(projectGuilds, ({ one }) => ({
  project: one(projects, {
    fields: [projectGuilds.projectId],
    references: [projects.id],
  }),
  guild: one(guilds, {
    fields: [projectGuilds.guildId],
    references: [guilds.id],
  }),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  project: one(projects, {
    fields: [pages.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
  page: one(pages, {
    fields: [tasks.pageId],
    references: [pages.id],
  }),
  assignee: one(auth.users, {
    fields: [tasks.assigneeId],
    references: [auth.users.id],
  }),
  creator: one(auth.users, {
    fields: [tasks.creatorId],
    references: [auth.users.id],
  }),
  guild: one(guilds, {
    fields: [tasks.guildId],
    references: [guilds.id],
  }),
  subtasks: many(tasks, { relationName: "parentChild" }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "parentChild",
  }),
}));

export const commonDocsRelations = relations(commonDocs, ({ one }) => ({
  author: one(auth.users, {
    fields: [commonDocs.authorId],
    references: [auth.users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(auth.users, {
    fields: [notifications.userId],
    references: [auth.users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertGuildSchema = createInsertSchema(guilds).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertProjectGuildSchema = createInsertSchema(projectGuilds).omit({ id: true });
export const insertPageSchema = createInsertSchema(pages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks, {
  dueDate: z.coerce.date().optional()
}).omit({ id: true, createdAt: true, completedAt: true });
export const insertCommonDocSchema = createInsertSchema(commonDocs).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, read: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Client = typeof clients.$inferSelect;
export type Guild = typeof guilds.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectGuild = typeof projectGuilds.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type CommonDoc = typeof commonDocs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type User = typeof auth.users.$inferSelect;

export type CreateClientRequest = z.infer<typeof insertClientSchema>;
export type UpdateClientRequest = z.infer<typeof insertClientSchema>;
export type CreateGuildRequest = z.infer<typeof insertGuildSchema>;
export type CreateProjectRequest = z.infer<typeof insertProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof insertProjectSchema>;
export type CreateProjectGuildRequest = z.infer<typeof insertProjectGuildSchema>;
export type CreatePageRequest = z.infer<typeof insertPageSchema>;
export type UpdatePageRequest = z.infer<typeof insertPageSchema>;
export type CreateTaskRequest = z.infer<typeof insertTaskSchema>;
export type UpdateTaskRequest = z.infer<typeof insertTaskSchema>;
export type CreateCommonDocRequest = z.infer<typeof insertCommonDocSchema>;

export type TaskQueryParams = {
  assigneeId?: string;
  projectId?: number;
  clientId?: number;
  status?: string;
};

export type TaskResponse = Task & {
  project?: Project;
  client?: Client;
  assignee?: User | null;
  guild?: Guild | null;
  subtasks?: (Task & { assignee?: User | null })[];
};
