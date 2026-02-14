import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

function findUserByName(team: any[], name: string) {
  const n = name.toLowerCase().trim();
  return team.find(m =>
    m.firstName?.toLowerCase() === n ||
    m.email?.split('@')[0].toLowerCase() === n ||
    (m.firstName + m.lastName).toLowerCase() === n ||
    (`${m.firstName} ${m.lastName}`).toLowerCase() === n
  );
}

interface ParsedFeedPost {
  guildName?: string;
  guildContext?: string;
  titleName?: string;
  mainAssignee?: string;
  mainDescription: string;
  subtasks: { description: string; assigneeName?: string; completed?: boolean }[];
}

function parseFeedContent(title: string, content: string): ParsedFeedPost {
  const result: ParsedFeedPost = {
    mainDescription: title,
    subtasks: [],
  };

  const fullText = `${title}\n${content}`;
  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length === 0) return result;

  const headerLine = lines[0];

  const guildMatch = headerLine.match(/@Guild\s+([^@\-]+?)(?=\s+-\s+|\s+@|$)/i);
  if (guildMatch) {
    result.guildName = guildMatch[1].trim();
    const afterGuild = headerLine.substring(guildMatch.index! + guildMatch[0].length).trim();
    const dashIdx = afterGuild.indexOf(' - ');
    if (dashIdx !== -1) {
      result.guildContext = afterGuild.substring(0, dashIdx).trim();
    } else {
      result.guildContext = afterGuild.replace(/@Title\s+.*/i, '').replace(/@\w+/g, '').trim() || undefined;
    }
  }

  const titleMatch = headerLine.match(/@Title\s+([^@]+?)(?:\s+@(?!Title|Guild|Client)\w+|$)/i);
  if (titleMatch) {
    result.titleName = titleMatch[1].trim();
  }

  const explicitTitleTag = content.match(/@title:([^@\n]+)/i);
  if (explicitTitleTag && !result.titleName) {
    result.titleName = explicitTitleTag[1].trim();
  }

  const headerAssignees: string[] = [];
  const headerMentionRegex = /@(?!Guild|Title|Client)(\w+)/gi;
  let hm;
  while ((hm = headerMentionRegex.exec(headerLine)) !== null) {
    headerAssignees.push(hm[1]);
  }
  if (headerAssignees.length > 0) {
    result.mainAssignee = headerAssignees[headerAssignees.length - 1];
  }

  let mainDesc = headerLine
    .replace(/@Guild\s+[^@\-]+?(?=\s+-\s+|\s+@|$)/i, '')
    .replace(/@Title\s+[^@]+?(?=\s+@(?!Title|Guild|Client)\w+|$)/i, '')
    .replace(/@\w+/g, '')
    .replace(/^\*\s*/, '')
    .replace(/\s*-\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (result.guildContext) {
    mainDesc = result.guildContext;
  }
  if (result.titleName) {
    if (mainDesc) {
      mainDesc = `${mainDesc} - ${result.titleName}`;
    } else {
      mainDesc = result.titleName;
    }
  }
  if (!mainDesc) mainDesc = title;
  result.mainDescription = mainDesc;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const subtaskMatch = line.match(/^-\s*\[([xX\s]?)\]\s*(.*)/);
    if (subtaskMatch) {
      const isCompleted = subtaskMatch[1].toLowerCase() === 'x';
      const subtaskText = subtaskMatch[2];
      const subtaskMentionMatch = subtaskText.match(/@(\w+)\s*$/);
      const assigneeName = subtaskMentionMatch ? subtaskMentionMatch[1] : undefined;
      const description = subtaskText.replace(/@\w+\s*$/, '').trim();

      result.subtasks.push({ description, assigneeName, completed: isCompleted });
    }
  }

  return result;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Clients ===
  app.get(api.clients.list.path, isAuthenticated, async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.get(api.clients.get.path, isAuthenticated, async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  });

  app.post(api.clients.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.clients.create.input.parse(req.body);
      const client = await storage.createClient(input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.clients.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.clients.update.input.parse(req.body);
      const client = await storage.updateClient(Number(req.params.id), input);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      res.json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === Guilds ===
  app.get(api.guilds.list.path, isAuthenticated, async (req, res) => {
    const guilds = await storage.getGuilds();
    res.json(guilds);
  });

  app.get(api.guilds.get.path, isAuthenticated, async (req, res) => {
    const guild = await storage.getGuild(Number(req.params.id));
    if (!guild) {
      return res.status(404).json({ message: 'Guild not found' });
    }
    res.json(guild);
  });

  app.post(api.guilds.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.guilds.create.input.parse(req.body);
      const guild = await storage.createGuild(input);
      res.status(201).json(guild);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === Project Guilds ===
  app.get(api.projectGuilds.list.path, isAuthenticated, async (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const guildId = req.query.guildId ? Number(req.query.guildId) : undefined;
    const pgs = await storage.getProjectGuilds(projectId, guildId);
    res.json(pgs);
  });

  // === Projects ===
  app.get(api.projects.list.path, isAuthenticated, async (req, res) => {
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const projects = await storage.getProjects(clientId);
    res.json(projects);
  });

  app.get(api.projects.get.path, isAuthenticated, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  });

  app.post(api.projects.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.projects.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.projects.update.input.parse(req.body);
      const project = await storage.updateProject(Number(req.params.id), input);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === Pages ===
  app.get(api.pages.list.path, isAuthenticated, async (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const pages = await storage.getPages(projectId);
    res.json(pages);
  });

  app.get(api.pages.get.path, isAuthenticated, async (req, res) => {
    const page = await storage.getPage(Number(req.params.id));
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(page);
  });

  app.post(api.pages.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.pages.create.input.parse(req.body);
      const page = await storage.createPage(input);
      res.status(201).json(page);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.pages.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.pages.update.input.parse(req.body);
      const page = await storage.updatePage(Number(req.params.id), input);
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
      res.json(page);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === Tasks ===
  app.get(api.tasks.list.path, isAuthenticated, async (req, res) => {
    const filters = {
      assigneeId: req.query.assigneeId as string,
      projectId: req.query.projectId ? Number(req.query.projectId) : undefined,
      clientId: req.query.clientId ? Number(req.query.clientId) : undefined,
      status: req.query.status as string,
    };
    const tasks = await storage.getTasks(filters);
    res.json(tasks);
  });

  app.get(api.tasks.subtasks.path, isAuthenticated, async (req, res) => {
    const subtasks = await storage.getSubtasks(Number(req.params.id));
    res.json(subtasks);
  });

  app.get(api.tasks.get.path, isAuthenticated, async (req, res) => {
    const task = await storage.getTask(Number(req.params.id));
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  });

  app.post(api.tasks.create.path, isAuthenticated, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.dueDate === "") {
        delete body.dueDate;
      }

      const input = api.tasks.create.input.parse({
        ...body,
        creatorId: (req.user as any).claims.sub
      });
      const task = await storage.createTask(input);
      
      if (task.assigneeId && task.assigneeId !== task.creatorId) {
        await storage.createNotification({
          userId: task.assigneeId,
          type: 'assignment',
          message: `You were assigned a new task: ${task.description}`,
          resourceId: task.id,
          resourceType: 'task'
        });
      }
      
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.tasks.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(Number(req.params.id), input);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      if (input.status === 'done' && task.parentTaskId) {
        const siblings = await storage.getSubtasks(task.parentTaskId);
        const allDone = siblings.every(s => s.status === 'done');
        if (allDone) {
          await storage.updateTask(task.parentTaskId, { status: 'done' } as any);
        }
      }

      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === Notifications ===
  app.get(api.notifications.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const notifications = await storage.getNotifications(userId);
    res.json(notifications);
  });

  app.patch(api.notifications.markRead.path, isAuthenticated, async (req, res) => {
    const notification = await storage.markNotificationRead(Number(req.params.id));
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  });

  // === Team ===
  app.get(api.team.list.path, isAuthenticated, async (req, res) => {
    const team = await storage.getTeamMembers();
    res.json(team);
  });

  // === Common Docs ===
  app.get(api.commonDocs.list.path, isAuthenticated, async (req, res) => {
    const docs = await storage.getCommonDocs();
    res.json(docs);
  });

  app.post(api.commonDocs.create.path, isAuthenticated, async (req, res) => {
    try {
      const authorId = (req.user as any).claims.sub;
      const input = api.commonDocs.create.input.parse({
        ...req.body,
        authorId
      });
      const doc = await storage.createCommonDoc(input);

      const parsed = parseFeedContent(doc.title, doc.content);
      const team = await storage.getTeamMembers();
      const allProjects = await storage.getProjects();
      const clientsList = await storage.getClients();

      let guild = null;
      if (parsed.guildName) {
        guild = await storage.getGuildByName(parsed.guildName);
        if (!guild) {
          guild = await storage.createGuild({ name: parsed.guildName });
        }
      }

      let matchedClient = null;
      let matchedProject = null;

      const explicitClientTag = `${doc.title} ${doc.content}`.match(/@client:([^@\n]+)/i);
      if (explicitClientTag) {
        const clientName = explicitClientTag[1].trim();
        matchedClient = clientsList.find(c => c.name.toLowerCase() === clientName.toLowerCase());
        if (!matchedClient && clientName) {
          matchedClient = await storage.createClient({ name: clientName });
        }
      }

      if (!matchedClient) {
        const normalizedText = `${doc.title} ${doc.content}`.toLowerCase();
        matchedClient = clientsList.find(c => {
          const name = c.name.toLowerCase().trim();
          return name && normalizedText.includes(name);
        });
      }

      if (parsed.titleName) {
        matchedProject = allProjects.find(p => p.name.toLowerCase() === parsed.titleName!.toLowerCase());
        if (!matchedProject && matchedClient) {
          matchedProject = await storage.createProject({
            name: parsed.titleName,
            clientId: matchedClient.id,
            status: "active"
          });
        }
      }

      if (!matchedProject) {
        const normalizedText = `${doc.title} ${doc.content}`.toLowerCase();
        matchedProject = allProjects.find(p => {
          const name = p.name.toLowerCase().trim();
          const isNameMatch = name && normalizedText.includes(name);
          if (matchedClient) return isNameMatch && p.clientId === matchedClient.id;
          return isNameMatch;
        });
      }

      const finalClientId = matchedClient?.id || matchedProject?.clientId;
      const finalProjectId = matchedProject?.id || null;

      if (guild && matchedProject) {
        await storage.createProjectGuild({
          projectId: matchedProject.id,
          guildId: guild.id,
        });
      }

      if (finalClientId && (parsed.subtasks.length > 0 || parsed.mainAssignee)) {
        const mainAssigneeUser = parsed.mainAssignee ? findUserByName(team, parsed.mainAssignee) : null;

        const mainTask = await storage.createTask({
          description: parsed.mainDescription,
          priority: "medium",
          status: "todo",
          projectId: finalProjectId,
          clientId: finalClientId,
          assigneeId: mainAssigneeUser?.id || null,
          creatorId: authorId,
          guildId: guild?.id || null,
        });

        if (mainAssigneeUser && mainAssigneeUser.id !== authorId) {
          await storage.createNotification({
            userId: mainAssigneeUser.id,
            type: 'assignment',
            message: `You were assigned a task: ${parsed.mainDescription}`,
            resourceId: mainTask.id,
            resourceType: 'task'
          });
        }

        for (const subtask of parsed.subtasks) {
          let subtaskAssignee = subtask.assigneeName ? findUserByName(team, subtask.assigneeName) : null;
          if (!subtaskAssignee) {
            subtaskAssignee = mainAssigneeUser;
          }

          const st = await storage.createTask({
            description: subtask.description,
            priority: "medium",
            status: subtask.completed ? "done" : "todo",
            projectId: finalProjectId,
            clientId: finalClientId,
            assigneeId: subtaskAssignee?.id || null,
            creatorId: authorId,
            parentTaskId: mainTask.id,
            guildId: guild?.id || null,
          });

          if (subtaskAssignee && subtaskAssignee.id !== authorId) {
            await storage.createNotification({
              userId: subtaskAssignee.id,
              type: 'assignment',
              message: `You were assigned a subtask: ${subtask.description}`,
              resourceId: st.id,
              resourceType: 'task'
            });
          }
        }
      } else if (finalClientId) {
        const fullText = `${doc.title} ${doc.content}`;
        const mentionRegex = /@(?!Guild|Title|Client|title:|client:)(\w+)/gi;
        let match;
        const mentionedUsers: any[] = [];
        while ((match = mentionRegex.exec(fullText)) !== null) {
          const user = findUserByName(team, match[1]);
          if (user && !mentionedUsers.find(u => u.id === user.id)) {
            mentionedUsers.push(user);
          }
        }

        for (const assignee of mentionedUsers) {
          const taskDescription = doc.title.length > 50 ? doc.title.slice(0, 47) + "..." : doc.title;
          await storage.createTask({
            description: `Task from Team Feed: ${taskDescription}`,
            priority: "medium",
            status: "todo",
            projectId: finalProjectId,
            clientId: finalClientId,
            assigneeId: assignee.id,
            creatorId: authorId,
            guildId: guild?.id || null,
          });

          if (assignee.id !== authorId) {
            await storage.createNotification({
              userId: assignee.id,
              type: 'assignment',
              message: `Auto-assigned task from team feed: ${doc.title}`,
              resourceType: 'task'
            });
          }
        }
      }

      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });
  
  // === Leaderboard ===
  app.get("/api/leaderboard", isAuthenticated, async (req, res) => {
    const tasks = await storage.getTasks();
    const team = await storage.getTeamMembers();
    
    const leaderboard = team.map(member => {
      const memberTasks = tasks.filter(t => t.assigneeId === member.id);
      const completedTasks = memberTasks.filter(t => t.status === "done");
      const totalTasks = memberTasks.length;
      
      return {
        user: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          profileImageUrl: member.profileImageUrl,
        },
        completedCount: completedTasks.length,
        totalCount: totalTasks,
      };
    })
    .sort((a, b) => b.completedCount - a.completedCount);
    
    res.json(leaderboard);
  });

  // === Seed Data ===
  const existingClients = await storage.getClients();
  if (existingClients.length === 0) {
    console.log("Seeding database...");
    
    const clientA = await storage.createClient({ name: "Amazon Studios" });
    const clientB = await storage.createClient({ name: "A24" });
    const clientC = await storage.createClient({ name: "Netflix" });

    const project1 = await storage.createProject({ 
      name: "Marty Supreme", 
      clientId: clientA.id,
      description: "Feature film production"
    });
    
    const project2 = await storage.createProject({ 
      name: "The Girlfriend", 
      clientId: clientA.id,
      description: "Series development"
    });
    
    const project3 = await storage.createProject({
      name: "Uncut Gems 2",
      clientId: clientB.id,
      description: "Early pre-production"
    });

    await storage.createPage({
      title: "Production Notes",
      projectId: project1.id,
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Production Kickoff" }] },
        { type: "paragraph", content: [{ type: "text", text: "Initial meeting notes for the project." }] }
      ]
    });

    await storage.createPage({
      title: "Casting Wishlist",
      projectId: project2.id,
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Leads" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Actor A" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Actor B" }] }] }
        ]}
      ]
    });
    
    await storage.createTask({
      description: "Send for guild approval",
      priority: "high",
      status: "todo",
      projectId: project1.id,
      clientId: clientA.id,
      dueDate: new Date(Date.now() + 86400000 * 2),
    });

    await storage.createTask({
      description: "Review budget proposal",
      priority: "medium",
      status: "in_progress",
      projectId: project2.id,
      clientId: clientA.id,
      dueDate: new Date(Date.now() + 86400000 * 5),
    });

    const dgaGuild = await storage.createGuild({ name: "DGA" });
    const sagGuild = await storage.createGuild({ name: "SAG-AFTRA" });
    
    await storage.createProjectGuild({ projectId: project1.id, guildId: dgaGuild.id });
    
    console.log("Seeding completed.");
  }

  return httpServer;
}
