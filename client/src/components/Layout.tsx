import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useClients } from "@/hooks/use-clients";
import { useProjects } from "@/hooks/use-projects";
import { useNotifications } from "@/hooks/use-notifications";
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderOpen, 
  Bell, 
  LogOut, 
  Plus, 
  ChevronRight,
  Menu,
  FileText,
  MessageSquare,
  ChevronDown,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateClient } from "@/hooks/use-clients";
import { useCreateProject } from "@/hooks/use-projects";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function CreateClientDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createClient = useCreateClient();
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClient.mutateAsync({ name });
    setOpen(false);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input 
              placeholder="e.g. Acme Corp" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateProjectDialog({ children, clientId }: { children: React.ReactNode, clientId: number }) {
  const [open, setOpen] = useState(false);
  const createProject = useCreateProject();
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject.mutateAsync({ name, clientId });
    setOpen(false);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input 
              placeholder="e.g. Website Redesign" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SidebarNav() {
  const [location] = useLocation();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const [openClients, setOpenClients] = useState<Record<number, boolean>>({});
  
  // Helper to find projects for a client
  const getClientProjects = (clientId: number) => 
    projects?.filter(p => p.clientId === clientId) || [];

  const toggleClient = (clientId: number) => {
    setOpenClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  return (
    <div className="space-y-6 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary">
          Project Hub
        </h2>
        <div className="space-y-1">
          <Link href="/my-tasks" className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
            location === "/my-tasks" ? "bg-accent text-accent-foreground" : "text-transparent-foreground"
          )}>
            <CheckSquare className="mr-2 h-4 w-4" />
            My Tasks
          </Link>
          <Link href="/team-feed" className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
            location === "/team-feed" ? "bg-accent text-accent-foreground" : "text-transparent-foreground"
          )}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Team Feed
          </Link>
          <Link href="/all-tasks" className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
            location === "/all-tasks" ? "bg-accent text-accent-foreground" : "text-transparent-foreground"
          )}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            All Tasks
          </Link>
          <Link href="/projects" className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
            location === "/projects" ? "bg-accent text-accent-foreground" : "text-transparent-foreground"
          )}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Title Explorer
          </Link>
          <Link href="/leaderboard" className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
            location === "/leaderboard" ? "bg-accent text-accent-foreground" : "text-transparent-foreground"
          )} data-testid="link-leaderboard">
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Link>
        </div>
      </div>
      
      <div className="px-3 py-2">
        <div className="flex items-center justify-between px-4 mb-2">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Clients
          </h3>
          <CreateClientDialog>
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-muted">
              <Plus className="h-3 w-3" />
            </Button>
          </CreateClientDialog>
        </div>
        
        <ScrollArea className="h-[400px] sidebar-scroll px-1">
          <div className="space-y-2">
            {clients?.map((client) => {
              const clientProjects = getClientProjects(client.id);
              const isOpen = openClients[client.id] ?? true; // Default to open

              return (
                <Collapsible
                  key={client.id}
                  open={isOpen}
                  onOpenChange={() => toggleClient(client.id)}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between px-2 group hover:bg-muted/30 rounded-md py-1 transition-colors">
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 flex-1 flex items-center justify-start gap-2 hover:bg-transparent font-medium text-foreground/80"
                      >
                        <ChevronRight className={cn(
                          "h-3 w-3 transition-transform duration-200 text-muted-foreground/50",
                          isOpen && "rotate-90"
                        )} />
                        <span className="truncate">{client.name}</span>
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CreateProjectDialog clientId={client.id}>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </CreateProjectDialog>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="ml-3 pl-3 border-l border-border/50 space-y-1 mt-1">
                      {clientProjects.length > 0 ? (
                        clientProjects.map(project => (
                          <Link 
                            key={project.id} 
                            href={`/projects/${project.id}`}
                            className={cn(
                              "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-all hover:bg-muted/50",
                              location === `/projects/${project.id}` ? "bg-muted font-medium text-primary" : "text-muted-foreground"
                            )}
                          >
                            <span className="truncate">{project.name}</span>
                            {location === `/projects/${project.id}` && <ChevronRight className="h-3 w-3 opacity-50" />}
                          </Link>
                        ))
                      ) : (
                        <div className="text-[11px] text-muted-foreground italic py-1 pl-1">No projects</div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function NotificationsMenu() {
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">{unreadCount} New</Badge>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications?.map((n) => (
                <div key={n.id} className={cn("p-4 text-sm hover:bg-muted/30 transition-colors", !n.read && "bg-blue-50/50 dark:bg-blue-900/10")}>
                  <p className="font-medium text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt!).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <SidebarNav />
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar & Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="h-full flex flex-col">
                  <SidebarNav />
                  <div className="mt-auto p-4 border-t">
                     <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => logout()}>
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Breadcrumbs placeholder or page title logic could go here */}
          </div>

          <div className="flex items-center gap-2">
            <NotificationsMenu />
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
