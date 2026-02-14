import { Layout } from "@/components/Layout";
import { useTasks } from "@/hooks/use-tasks";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Fragment } from "react";
import { Loader2, ListChecks, Shield, ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

export default function AllTasks() {
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  const toggleExpand = (taskId: number) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleSubtaskToggle = (subtaskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    updateTask.mutate({ id: subtaskId, status: newStatus });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const parentTasks = tasks?.filter(t => !t.parentTaskId) || [];

  const userTaskCounts = parentTasks.reduce((acc, task) => {
    const userName = task.assignee 
      ? `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim() 
      : 'Unassigned';
    acc[userName] = (acc[userName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#15803d', '#ec4899', '#06b6d4', '#f97316', '#94a3b8'];
  const chartData = Object.entries(userTaskCounts || {})
    .sort(([, a], [, b]) => b - a)
    .map(([name, value], i) => ({
      name,
      value,
      color: userColors[i % userColors.length],
    }));

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-all-tasks-heading">Team Overview</h1>
          <p className="text-muted-foreground mt-1">High-level view of all tasks across projects.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Guild</TableHead>
                  <TableHead className="w-[300px]">Description</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parentTasks.map((task) => {
                  const subtasks = task.subtasks || [];
                  const hasSubtasks = subtasks.length > 0;
                  const isExpanded = expandedTasks.has(task.id);
                  const completedCount = subtasks.filter(s => s.status === "done").length;

                  return (
                    <Fragment key={task.id}>
                      <TableRow data-testid={`row-task-${task.id}`}>
                        <TableCell className="pr-0">
                          {hasSubtasks ? (
                            <button onClick={() => toggleExpand(task.id)} className="p-0.5 rounded hover:bg-muted" data-testid={`button-expand-${task.id}`}>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-medium text-muted-foreground">{task.client?.name}</TableCell>
                        <TableCell className="font-medium">{task.project?.name}</TableCell>
                        <TableCell>
                          {task.guild ? (
                            <Badge variant="secondary" className="text-[10px]">
                              <Shield className="h-2.5 w-2.5 mr-0.5" />
                              {task.guild.name}
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{task.description}</span>
                            {hasSubtasks && (
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                <ListChecks className="h-2.5 w-2.5 mr-0.5" />
                                {completedCount}/{subtasks.length}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignee?.profileImageUrl || undefined} />
                              <AvatarFallback className="text-[10px]">{task.assignee?.firstName?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{task.assignee?.firstName || "Unassigned"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={task.status || "todo"} />
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={task.priority || "medium"} />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "-"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && subtasks.map(st => (
                        <TableRow key={`sub-${st.id}`} className="bg-muted/30" data-testid={`row-subtask-${st.id}`}>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 pl-4">
                              <button 
                                onClick={() => handleSubtaskToggle(st.id, st.status || "todo")}
                                className="shrink-0"
                                data-testid={`button-subtask-toggle-${st.id}`}
                              >
                                {st.status === "done" ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                              <span className={`text-sm ${st.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                                {st.description}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {st.assignee && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={st.assignee?.profileImageUrl || undefined} />
                                  <AvatarFallback className="text-[8px]">{st.assignee?.firstName?.[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{st.assignee?.firstName}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={st.status || "todo"} />
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
