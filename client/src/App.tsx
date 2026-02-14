import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import MyTasks from "@/pages/MyTasks";
import AllTasks from "@/pages/AllTasks";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import PageEditor from "@/pages/PageEditor";
import TeamFeed from "@/pages/TeamFeed";
import Leaderboard from "@/pages/Leaderboard";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/my-tasks" /> : <AuthPage />}
      </Route>

      <Route path="/my-tasks">
        <ProtectedRoute component={MyTasks} />
      </Route>

      <Route path="/all-tasks">
        <ProtectedRoute component={AllTasks} />
      </Route>

      <Route path="/team-feed">
        <ProtectedRoute component={TeamFeed} />
      </Route>

      <Route path="/projects">
        <ProtectedRoute component={Projects} />
      </Route>

      <Route path="/projects/:id">
        <ProtectedRoute component={ProjectDetails} />
      </Route>

      <Route path="/leaderboard">
        <ProtectedRoute component={Leaderboard} />
      </Route>

      <Route path="/pages/:id">
        <ProtectedRoute component={PageEditor} />
      </Route>

      <Route path="/">
        {user ? <Redirect to="/my-tasks" /> : <Redirect to="/login" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
