import { z } from 'zod';
import { 
  insertClientSchema, 
  insertGuildSchema,
  insertProjectSchema, 
  insertPageSchema, 
  insertTaskSchema,
  insertCommonDocSchema,
  clients,
  guilds,
  projects,
  projectGuilds,
  pages,
  tasks,
  notifications,
  users,
  commonDocs
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients',
      responses: {
        200: z.array(z.custom<typeof clients.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/clients/:id',
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients',
      input: insertClientSchema,
      responses: {
        201: z.custom<typeof clients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/clients/:id',
      input: insertClientSchema.partial(),
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  guilds: {
    list: {
      method: 'GET' as const,
      path: '/api/guilds',
      responses: {
        200: z.array(z.custom<typeof guilds.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/guilds/:id',
      responses: {
        200: z.custom<typeof guilds.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/guilds',
      input: insertGuildSchema,
      responses: {
        201: z.custom<typeof guilds.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },

  projectGuilds: {
    list: {
      method: 'GET' as const,
      path: '/api/project-guilds',
      responses: {
        200: z.array(z.custom<typeof projectGuilds.$inferSelect & { guild?: typeof guilds.$inferSelect; project?: typeof projects.$inferSelect }>()),
      },
    },
  },

  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects',
      input: z.object({ clientId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof projects.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id',
      responses: {
        200: z.custom<typeof projects.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects',
      input: insertProjectSchema,
      responses: {
        201: z.custom<typeof projects.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/projects/:id',
      input: insertProjectSchema.partial(),
      responses: {
        200: z.custom<typeof projects.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  pages: {
    list: {
      method: 'GET' as const,
      path: '/api/pages',
      input: z.object({ projectId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof pages.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/pages/:id',
      responses: {
        200: z.custom<typeof pages.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/pages',
      input: insertPageSchema,
      responses: {
        201: z.custom<typeof pages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/pages/:id',
      input: insertPageSchema.partial(),
      responses: {
        200: z.custom<typeof pages.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      input: z.object({
        assigneeId: z.string().optional(),
        projectId: z.coerce.number().optional(),
        clientId: z.coerce.number().optional(),
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect & { 
          project?: typeof projects.$inferSelect, 
          client?: typeof clients.$inferSelect,
          assignee?: typeof users.$inferSelect | null,
          guild?: typeof guilds.$inferSelect | null,
          subtasks?: (typeof tasks.$inferSelect)[]
        }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tasks/:id',
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    subtasks: {
      method: 'GET' as const,
      path: '/api/tasks/:id/subtasks',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect & { assignee?: typeof users.$inferSelect | null }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks',
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  commonDocs: {
    list: {
      method: 'GET' as const,
      path: '/api/common-docs',
      responses: {
        200: z.array(z.custom<typeof commonDocs.$inferSelect & { author: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/common-docs',
      input: insertCommonDocSchema,
      responses: {
        201: z.custom<typeof commonDocs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications',
      responses: {
        200: z.array(z.custom<typeof notifications.$inferSelect>()),
      },
    },
    markRead: {
      method: 'PATCH' as const,
      path: '/api/notifications/:id/read',
      responses: {
        200: z.custom<typeof notifications.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  
  team: {
    list: {
      method: 'GET' as const,
      path: '/api/team',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
  }
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
