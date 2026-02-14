import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
  };
  completedCount: number;
  totalCount: number;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
}

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-leaderboard-title">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Team rankings based on completed tasks.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Task Completion Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard?.map((entry, index) => {
                const rank = index + 1;
                const completionRate = entry.totalCount > 0
                  ? Math.round((entry.completedCount / entry.totalCount) * 100)
                  : 0;

                return (
                  <div
                    key={entry.user.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-md border transition-colors",
                      rank === 1 && "bg-yellow-50/50 border-yellow-200/50 dark:bg-yellow-900/10 dark:border-yellow-800/30",
                      rank === 2 && "bg-gray-50/50 border-gray-200/50 dark:bg-gray-800/10 dark:border-gray-700/30",
                      rank === 3 && "bg-amber-50/50 border-amber-200/50 dark:bg-amber-900/10 dark:border-amber-800/30",
                      rank > 3 && "bg-background border-border/50"
                    )}
                    data-testid={`card-leaderboard-${entry.user.id}`}
                  >
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(rank)}
                    </div>

                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={entry.user.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {entry.user.firstName?.[0]}{entry.user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {entry.user.firstName} {entry.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.user.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{entry.completedCount}</p>
                        <p className="text-[11px] text-muted-foreground">completed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{entry.totalCount} total</p>
                        {entry.totalCount > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {completionRate}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!leaderboard || leaderboard.length === 0) && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                  <p className="text-muted-foreground">
                    No team members found. Assign tasks to see the leaderboard.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
