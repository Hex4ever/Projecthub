import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGuilds() {
  return useQuery({
    queryKey: [api.guilds.list.path],
    queryFn: async () => {
      const res = await fetch(api.guilds.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch guilds");
      return api.guilds.list.responses[200].parse(await res.json());
    },
  });
}

export function useProjectGuilds(projectId?: number, guildId?: number) {
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", String(projectId));
  if (guildId) params.set("guildId", String(guildId));
  
  return useQuery({
    queryKey: [api.projectGuilds.list.path, projectId, guildId],
    queryFn: async () => {
      const url = `${api.projectGuilds.list.path}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch project guilds");
      return api.projectGuilds.list.responses[200].parse(await res.json());
    },
  });
}
