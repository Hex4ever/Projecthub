import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type CreateCommonDocRequest, type CommonDoc, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCommonDocs() {
  return useQuery({
    queryKey: [api.commonDocs.list.path],
    queryFn: async () => {
      const res = await fetch(api.commonDocs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch common docs");
      return api.commonDocs.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCommonDoc() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<CreateCommonDocRequest, "authorId">) => {
      const res = await fetch(api.commonDocs.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create post");
      return api.commonDocs.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.commonDocs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.guilds.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.projectGuilds.list.path] });
      
      const mentions = data.tags?.filter(t => t.startsWith('@'));
      if (mentions && mentions.length > 0) {
        toast({ 
          title: "Post created & tasks assigned", 
          description: `Assigned tasks to: ${mentions.join(', ')}` 
        });
      } else {
        toast({ title: "Post created", description: "Your information has been shared with the team." });
      }
    },
  });
}
