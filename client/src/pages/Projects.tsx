import { Layout } from "@/components/Layout";
import { useProjects } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { useGuilds, useProjectGuilds } from "@/hooks/use-guilds";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderOpen, ArrowRight, Loader2, Shield, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Projects() {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: allGuilds, isLoading: guildsLoading } = useGuilds();
  const { data: projectGuildLinks } = useProjectGuilds();
  const [viewMode, setViewMode] = useState<"clients" | "guilds">("clients");
  const [selectedGuildId, setSelectedGuildId] = useState<number | null>(null);

  const guildsByProject = useMemo(() => {
    if (!projectGuildLinks) return {};
    const map: Record<number, typeof projectGuildLinks> = {};
    for (const pg of projectGuildLinks) {
      if (!map[pg.projectId]) map[pg.projectId] = [];
      map[pg.projectId].push(pg);
    }
    return map;
  }, [projectGuildLinks]);

  const projectsByGuild = useMemo(() => {
    if (!projectGuildLinks || !projects) return {};
    const map: Record<number, typeof projects> = {};
    for (const pg of projectGuildLinks) {
      const project = projects.find(p => p.id === pg.projectId);
      if (project) {
        if (!map[pg.guildId]) map[pg.guildId] = [];
        map[pg.guildId].push(project);
      }
    }
    return map;
  }, [projectGuildLinks, projects]);

  if (clientsLoading || projectsLoading || guildsLoading) {
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-title-explorer-heading">Title Explorer</h1>
            <p className="text-muted-foreground mt-1">Manage all your client titles and documents.</p>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as "clients" | "guilds"); setSelectedGuildId(null); }}>
            <TabsList>
              <TabsTrigger value="clients" data-testid="tab-clients-view">
                <FolderOpen className="h-4 w-4 mr-1.5" />
                By Client
              </TabsTrigger>
              <TabsTrigger value="guilds" data-testid="tab-guilds-view">
                <Shield className="h-4 w-4 mr-1.5" />
                By Guild
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {viewMode === "guilds" && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedGuildId === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGuildId(null)}
              data-testid="button-guild-filter-all"
            >
              All Guilds
            </Button>
            {allGuilds?.map(guild => (
              <Button
                key={guild.id}
                variant={selectedGuildId === guild.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGuildId(guild.id)}
                data-testid={`button-guild-filter-${guild.id}`}
              >
                <Shield className="h-3 w-3 mr-1.5" />
                {guild.name}
              </Button>
            ))}
          </div>
        )}

        {viewMode === "clients" ? (
          <div className="grid gap-6">
            {clients?.map((client) => {
              const clientProjects = projects?.filter(p => p.clientId === client.id) || [];
              
              if (clientProjects.length === 0) return null;

              return (
                <div key={client.id} className="space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <div className="w-2 h-6 bg-primary rounded-full" />
                    {client.name}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clientProjects.map((project) => {
                      const projectGuildsForThis = guildsByProject[project.id] || [];
                      return (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                          <div className="block h-full group">
                            <Card className="h-full border-2 border-transparent hover:border-primary/20 transition-all shadow-sm hover:shadow-md cursor-pointer bg-card">
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="p-2 bg-primary/5 rounded-lg text-primary mb-2">
                                    <FolderOpen className="h-5 w-5" />
                                  </div>
                                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                                    {project.status}
                                  </Badge>
                                </div>
                                <CardTitle className="group-hover:text-primary transition-colors">
                                  {project.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2">
                                  {project.description || "No description provided."}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex flex-wrap gap-1">
                                    {projectGuildsForThis.map(pg => (
                                      <Badge key={pg.id} variant="secondary" className="text-[10px]">
                                        <Shield className="h-2.5 w-2.5 mr-0.5" />
                                        {pg.guild?.name}
                                      </Badge>
                                    ))}
                                  </div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    View <ArrowRight className="h-3 w-3" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-6">
            {allGuilds?.filter(g => selectedGuildId === null || g.id === selectedGuildId).map((guild) => {
              const guildProjects = projectsByGuild[guild.id] || [];
              
              if (guildProjects.length === 0) return null;

              return (
                <div key={guild.id} className="space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {guild.name}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guildProjects.map((project) => {
                      const client = clients?.find(c => c.id === project.clientId);
                      return (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                          <div className="block h-full group">
                            <Card className="h-full border-2 border-transparent hover:border-primary/20 transition-all shadow-sm hover:shadow-md cursor-pointer bg-card">
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="p-2 bg-primary/5 rounded-lg text-primary mb-2">
                                    <FolderOpen className="h-5 w-5" />
                                  </div>
                                  {client && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {client.name}
                                    </Badge>
                                  )}
                                </div>
                                <CardTitle className="group-hover:text-primary transition-colors">
                                  {project.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2">
                                  {project.description || "No description provided."}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-sm text-muted-foreground flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                  View details <ArrowRight className="h-3 w-3" />
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {allGuilds?.every(g => (projectsByGuild[g.id] || []).length === 0) && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No titles are associated with any guilds yet. Use the Team Feed with @Guild to link titles.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
