import { Button } from "@/components/ui/button";
import { ArrowRight, Layout as LayoutIcon, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <div className="lg:w-1/2 bg-slate-950 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <LayoutIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ProjectHub</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
            Turn your ideas into <span className="text-blue-400">actionable</span> tasks.
          </h1>
          <p className="text-lg text-slate-400 max-w-md leading-relaxed">
            Project management reimagined with a document-first approach. 
            Seamlessly convert notes to tasks and keep your team aligned.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} ProjectHub Inc. All rights reserved.
        </div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Sign in to access your workspace
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm" data-testid="text-login-error">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <Button 
              size="lg" 
              className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={handleLogin}
              data-testid="button-login"
            >
              Sign In with Replit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              Access restricted to @indee.tv email accounts only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
