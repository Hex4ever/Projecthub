import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import type { TaskResponse } from "@shared/schema";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { Calendar, User as UserIcon, ListChecks, CheckCircle2, Circle, Shield } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateTask } from "@/hooks/use-tasks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function TaskCard({ task }: { task: TaskResponse }) {
  const [open, setOpen] = useState(false);
  const updateTask = useUpdateTask();

  const handleStatusChange = (status: string) => {
    updateTask.mutate({ id: task.id, status });
    setOpen(false);
  };

  const handleSubtaskToggle = (subtaskId: number, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    updateTask.mutate({ id: subtaskId, status: newStatus });
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.status === "done");
  const hasSubtasks = subtasks.length > 0;

  if (task.parentTaskId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="group hover:shadow-md transition-all cursor-pointer border-border/60" data-testid={`card-task-${task.id}`}>
          <CardHeader className="p-4 pb-2 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <PriorityBadge priority={task.priority || "medium"} />
              <div className="flex items-center gap-1">
                {task.guild && (
                  <Badge variant="secondary" className="text-[10px] font-normal truncate max-w-[80px]">
                    <Shield className="h-2.5 w-2.5 mr-0.5" />
                    {task.guild.name}
                  </Badge>
                )}
                {task.project && (
                  <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground truncate max-w-[100px]">
                    {task.project.name}
                  </Badge>
                )}
              </div>
            </div>
            <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
              {task.description}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="flex items-center justify-between mt-2">
              <StatusBadge status={task.status || "todo"} />
              {task.dueDate && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(task.dueDate), "MMM d")}
                </div>
              )}
            </div>
            {hasSubtasks && (
              <div className="mt-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ListChecks className="h-3 w-3" />
                  <span>{completedSubtasks.length}/{subtasks.length} subtasks</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full ml-1 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${subtasks.length > 0 ? (completedSubtasks.length / subtasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border">
                  {task.assignee ? (
                    <>
                      <AvatarImage src={task.assignee.profileImageUrl || undefined} />
                      <AvatarFallback className="text-[10px]">{task.assignee.firstName?.[0]}</AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="bg-muted text-[10px]"><UserIcon className="w-3 h-3 opacity-50"/></AvatarFallback>
                  )}
                </Avatar>
                {task.assignee && <span className="text-xs text-muted-foreground truncate max-w-[80px]">{task.assignee.firstName}</span>}
             </div>
          </CardFooter>
        </Card>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm font-medium">{task.description}</p>
          
          {task.guild && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Guild: {task.guild.name}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Change Status</Label>
            <Select defaultValue={task.status || "todo"} onValueChange={handleStatusChange}>
              <SelectTrigger data-testid="select-task-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasSubtasks && (
            <div className="space-y-2">
              <Label>Subtasks ({completedSubtasks.length}/{subtasks.length})</Label>
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                {subtasks.map(st => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSubtaskToggle(st.id, st.status || "todo")}
                    data-testid={`subtask-toggle-${st.id}`}
                  >
                    {st.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${st.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                      {st.description}
                    </span>
                    {st.assignee && (
                      <Avatar className="h-5 w-5 border shrink-0">
                        <AvatarImage src={st.assignee.profileImageUrl || undefined} />
                        <AvatarFallback className="text-[8px]">{st.assignee.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
