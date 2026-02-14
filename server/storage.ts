import { 
  users, clients, projects, pages, tasks, notifications, commonDocs, guilds, projectGuilds,
  type User, type InsertUser,
  type Client, type CreateClientRequest, type UpdateClientRequest,
  type Guild, type CreateGuildRequest,
  type Project, type CreateProjectRequest, type UpdateProjectRequest,
  type ProjectGuild, type CreateProjectGuildRequest,
  type Page, type CreatePageRequest, type UpdatePageRequest,
  type Task, type CreateTaskRequest, type UpdateTaskRequest,
  type Notification, type CommonDoc, type CreateCommonDocRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, isNull } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: CreateClientRequest): Promise<Client>;
  updateClient(id: number, updates: UpdateClientRequest): Promise<Client>;

  getGuilds(): Promise<Guild[]>;
  getGuild(id: number): Promise<Guild | undefined>;
  getGuildByName(name: string): Promise<Guild | undefined>;
  createGuild(guild: CreateGuildRequest): Promise<Guild>;

  getProjectGuilds(projectId?: number, guildId?: number): Promise<(ProjectGuild & { guild?: Guild; project?: Project })[]>;
  createProjectGuild(pg: CreateProjectGuildRequest): Promise<ProjectGuild>;

  getProjects(clientId?: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: CreateProjectRequest): Promise<Project>;
  updateProject(id: number, updates: UpdateProjectRequest): Promise<Project>;

  getPages(projectId?: number): Promise<Page[]>;
  getPage(id: number): Promise<Page | undefined>;
  createPage(page: CreatePageRequest): Promise<Page>;
  updatePage(id: number, updates: UpdatePageRequest): Promise<Page>;

  getTasks(filters?: { assigneeId?: string; projectId?: number; clientId?: number; status?: string; parentTaskId?: number | null }): Promise<(Task & { project?: Project, client?: Client, assignee?: User | null, guild?: Guild | null, subtasks?: Task[] })[]>;
  getTask(id: number): Promise<Task | undefined>;
  getSubtasks(parentTaskId: number): Promise<(Task & { assignee?: User | null })[]>;
  createTask(task: CreateTaskRequest): Promise<Task>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;

  getCommonDocs(): Promise<(CommonDoc & { author: User })[]>;
  createCommonDoc(doc: CreateCommonDocRequest): Promise<CommonDoc>;

  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<Notification>;
  createNotification(notification: { userId: string; type: string; message: string; resourceId?: number; resourceType?: string }): Promise<Notification>;

  getTeamMembers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: CreateClientRequest): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, updates: UpdateClientRequest): Promise<Client> {
    const [updated] = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
    return updated;
  }

  async getGuilds(): Promise<Guild[]> {
    return await db.select().from(guilds).orderBy(desc(guilds.createdAt));
  }

  async getGuild(id: number): Promise<Guild | undefined> {
    const [guild] = await db.select().from(guilds).where(eq(guilds.id, id));
    return guild;
  }

  async getGuildByName(name: string): Promise<Guild | undefined> {
    const allGuilds = await db.select().from(guilds);
    return allGuilds.find(g => g.name.toLowerCase() === name.toLowerCase());
  }

  async createGuild(guild: CreateGuildRequest): Promise<Guild> {
    const [newGuild] = await db.insert(guilds).values(guild).returning();
    return newGuild;
  }

  async getProjectGuilds(projectId?: number, guildId?: number): Promise<(ProjectGuild & { guild?: Guild; project?: Project })[]> {
    let conditions = [];
    if (projectId) conditions.push(eq(projectGuilds.projectId, projectId));
    if (guildId) conditions.push(eq(projectGuilds.guildId, guildId));

    const query = db.select({
      pg: projectGuilds,
      guild: guilds,
      project: projects,
    })
    .from(projectGuilds)
    .leftJoin(guilds, eq(projectGuilds.guildId, guilds.id))
    .leftJoin(projects, eq(projectGuilds.projectId, projects.id));

    if (conditions.length > 0) {
      // @ts-ignore
      query.where(and(...conditions));
    }

    const results = await query;
    return results.map(r => ({
      ...r.pg,
      guild: r.guild || undefined,
      project: r.project || undefined,
    }));
  }

  async createProjectGuild(pg: CreateProjectGuildRequest): Promise<ProjectGuild> {
    const existing = await db.select().from(projectGuilds)
      .where(and(eq(projectGuilds.projectId, pg.projectId), eq(projectGuilds.guildId, pg.guildId)));
    if (existing.length > 0) return existing[0];
    const [newPg] = await db.insert(projectGuilds).values(pg).returning();
    return newPg;
  }

  async getProjects(clientId?: number): Promise<Project[]> {
    if (clientId) {
      return await db
        .select()
        .from(projects)
        .where(eq(projects.clientId, clientId))
        .orderBy(desc(projects.createdAt));
    }
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: CreateProjectRequest): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, updates: UpdateProjectRequest): Promise<Project> {
    const [updated] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
    return updated;
  }

  async getPages(projectId?: number): Promise<Page[]> {
    let query = db.select().from(pages).orderBy(desc(pages.updatedAt));
    if (projectId) {
      // @ts-ignore
      query = query.where(eq(pages.projectId, projectId));
    }
    return await query;
  }

  async getPage(id: number): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    return page;
  }

  async createPage(page: CreatePageRequest): Promise<Page> {
    const [newPage] = await db.insert(pages).values(page).returning();
    return newPage;
  }

  async updatePage(id: number, updates: UpdatePageRequest): Promise<Page> {
    const [updated] = await db
      .update(pages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pages.id, id))
      .returning();
    return updated;
  }

  async getTasks(filters?: { assigneeId?: string; projectId?: number; clientId?: number; status?: string; parentTaskId?: number | null }) {
    let conditions = [];
    if (filters?.assigneeId) conditions.push(eq(tasks.assigneeId, filters.assigneeId));
    if (filters?.projectId) conditions.push(eq(tasks.projectId, filters.projectId));
    if (filters?.clientId) conditions.push(eq(tasks.clientId, filters.clientId));
    if (filters?.status) conditions.push(eq(tasks.status, filters.status));
    if (filters?.parentTaskId === null) conditions.push(isNull(tasks.parentTaskId));
    else if (filters?.parentTaskId) conditions.push(eq(tasks.parentTaskId, filters.parentTaskId));

    const query = db.select({
      task: tasks,
      project: projects,
      client: clients,
      assignee: users,
      guild: guilds
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(clients, eq(tasks.clientId, clients.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .leftJoin(guilds, eq(tasks.guildId, guilds.id))
    .orderBy(desc(tasks.createdAt));

    if (conditions.length > 0) {
      // @ts-ignore
      query.where(and(...conditions));
    }

    const results = await query;

    const allTasks = results.map(r => ({
      ...r.task,
      project: r.project || undefined,
      client: r.client || undefined,
      assignee: r.assignee || null,
      guild: r.guild || null,
    }));

    const parentIds = [...new Set(allTasks.filter(t => !t.parentTaskId).map(t => t.id))];
    const subtaskResults = parentIds.length > 0 
      ? await db.select({ task: tasks, assignee: users })
          .from(tasks)
          .leftJoin(users, eq(tasks.assigneeId, users.id))
          .where(and(...parentIds.map(pid => eq(tasks.parentTaskId, pid)).reduce((acc, cur, i) => {
            return i === 0 ? [cur] : [...acc, cur];
          }, [] as any[])))
      : [];

    const subtasksByParent: Record<number, (Task & { assignee?: User | null })[]> = {};
    
    if (parentIds.length > 0) {
      const allSubtasks = await db.select({ task: tasks, assignee: users })
        .from(tasks)
        .leftJoin(users, eq(tasks.assigneeId, users.id))
        .orderBy(desc(tasks.createdAt));
      
      for (const st of allSubtasks) {
        if (st.task.parentTaskId) {
          if (!subtasksByParent[st.task.parentTaskId]) {
            subtasksByParent[st.task.parentTaskId] = [];
          }
          subtasksByParent[st.task.parentTaskId].push({
            ...st.task,
            assignee: st.assignee || null,
          });
        }
      }
    }

    return allTasks.map(t => ({
      ...t,
      subtasks: subtasksByParent[t.id] || [],
    }));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getSubtasks(parentTaskId: number): Promise<(Task & { assignee?: User | null })[]> {
    const results = await db.select({ task: tasks, assignee: users })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(eq(tasks.parentTaskId, parentTaskId))
      .orderBy(tasks.createdAt);
    
    return results.map(r => ({
      ...r.task,
      assignee: r.assignee || null,
    }));
  }

  async createTask(task: CreateTaskRequest): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
    const updateData: any = { ...updates };
    if (updates.status === 'done') {
      updateData.completedAt = new Date();
    }
    const [updated] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async getCommonDocs(): Promise<(CommonDoc & { author: User })[]> {
    const results = await db.select({
      doc: commonDocs,
      author: users
    })
    .from(commonDocs)
    .innerJoin(users, eq(commonDocs.authorId, users.id))
    .orderBy(desc(commonDocs.createdAt));

    return results.map(r => ({
      ...r.doc,
      author: r.author
    }));
  }

  async createCommonDoc(doc: CreateCommonDocRequest): Promise<CommonDoc> {
    const [newDoc] = await db.insert(commonDocs).values(doc).returning();
    return newDoc;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async createNotification(notification: { userId: string; type: string; message: string; resourceId?: number; resourceType?: string }): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getTeamMembers(): Promise<User[]> {
    return await db.select().from(users);
  }
}

export const storage = new DatabaseStorage();
