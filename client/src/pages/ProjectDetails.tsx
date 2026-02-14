import { Layout } from "@/components/Layout";
import { useRoute, Link } from "wouter";
import { useProject } from "@/hooks/use-projects";
import { usePages, useCreatePage } from "@/hooks/use-pages";
import { useTasks } from "@/hooks/use-tasks";
import { Loader2, FileText, Plus, Clock, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { TaskCard } from "@/components/TaskCard";

export default function ProjectDetails() {
  const [match, params] = useRoute("/projects/:id");
  const projectId = parseInt(params!.id);
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: pages, isLoading: pagesLoading } = usePages(projectId);
  const { data: tasks, isLoading: tasksLoading } = useTasks({ projectId });
  const createPage = useCreatePage();

  if (projectLoading || pagesLoading || tasksLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!project) return <div>Project not found</div>;

  const handleCreatePage = () => {
    createPage.mutate({
      title: "Untitled Page",
      projectId: project.id,
      content: { type: "doc", content: [] }
    });
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>Projects</span>
              <span>/</span>
              <span className="font-medium text-foreground">{project.name}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground max-w-2xl">{project.description}</p>
          </div>
          <div className="flex gap-3">
             {/* Actions could go here */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Pages */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documents
              </h2>
              <Button size="sm" onClick={handleCreatePage} disabled={createPage.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                New Page
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {pages?.map(page => (
                <Link key={page.id} href={`/pages/${page.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-medium group-hover:text-primary transition-colors">
                          {page.title || "Untitled Page"}
                        </CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {formatDistanceToNow(new Date(page.updatedAt || page.createdAt!), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.preventDefault()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Rename</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
              
              {pages?.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No documents yet. Create one to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Tasks */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Project Tasks</h2>
            <div className="space-y-3">
              {tasks?.slice(0, 5).map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              {(!tasks || tasks.length === 0) && (
                 <p className="text-sm text-muted-foreground italic">No tasks created specifically for this project.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
