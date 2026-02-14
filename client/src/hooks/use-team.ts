import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useTeam() {
  return useQuery({
    queryKey: [api.team.list.path],
    queryFn: async () => {
      const res = await fetch(api.team.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch team members");
      return api.team.list.responses[200].parse(await res.json());
    },
  });
}
