import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { TaskCard } from "@/components/TaskCard";
import { Loader2, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { Separator } from "@/components/ui/separator";
import { CommonDocsSection } from "@/components/CommonDocsSection";

export default function MyTasks() {
  const { user } = useAuth();
  const { data: tasks, isLoading } = useTasks({ assigneeId: user?.id, status: "todo" });
  
  const parentTasks = tasks?.filter(t => !t.parentTaskId);

  const groupedTasks = parentTasks?.reduce((acc, task) => {
    const clientName = task.client?.name || "No Client";
    const projectName = task.project?.name || "Uncategorized";
    
    if (!acc[clientName]) acc[clientName] = {};
    if (!acc[clientName][projectName]) acc[clientName][projectName] = [];
    
    acc[clientName][projectName].push(task);
    return acc;
  }, {} as Record<string, Record<string, typeof parentTasks>>);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal assignments and priorities.
            </p>
          </div>
          <CreateTaskDialog>
            <Button size="lg" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </CreateTaskDialog>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Current Assignments</h2>
            <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {parentTasks?.length || 0} active
            </span>
          </div>

          {parentTasks?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">All caught up!</h3>
              <p className="text-muted-foreground max-w-sm text-center mt-2 mb-6">
                You have no active tasks. Enjoy your day or create a new task to get started.
              </p>
              <CreateTaskDialog>
                <Button variant="outline">Create Task</Button>
              </CreateTaskDialog>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedTasks || {}).map(([clientName, clientProjects]) => (
                <div key={clientName} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-primary rounded-full" />
                    <h2 className="text-2xl font-bold tracking-tight">{clientName}</h2>
                  </div>
                  
                  <div className="space-y-8 pl-4 border-l-2 border-muted ml-0.5">
                    {Object.entries(clientProjects).map(([projectName, projectTasks]) => (
                      <div key={projectName} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-muted-foreground">
                            {projectName === "Uncategorized" ? "General Tasks" : projectName}
                          </h3>
                          <Separator className="flex-1" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {projectTasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
