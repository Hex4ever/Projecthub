import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreatePageRequest, type UpdatePageRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function usePages(projectId?: number) {
  return useQuery({
    queryKey: [api.pages.list.path, projectId],
    queryFn: async () => {
      const url = projectId 
        ? `${api.pages.list.path}?projectId=${projectId}` 
        : api.pages.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pages");
      return api.pages.list.responses[200].parse(await res.json());
    },
    enabled: !!projectId,
  });
}

export function usePage(id: number) {
  return useQuery({
    queryKey: [api.pages.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.pages.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch page");
      return api.pages.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePageRequest) => {
      const res = await fetch(api.pages.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create page");
      return api.pages.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.pages.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, variables.projectId] }); // Update project cache too
      toast({ title: "Page created", description: "New document ready for editing." });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdatePageRequest) => {
      const url = buildUrl(api.pages.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update page");
      return api.pages.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.pages.get.path, data.id], data);
      queryClient.invalidateQueries({ queryKey: [api.pages.list.path] });
      toast({ title: "Saved", description: "Page changes saved successfully." });
    },
  });
}
