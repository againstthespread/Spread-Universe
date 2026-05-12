import { Link, useLocation } from "wouter";
import { Shield, ExternalLink, Newspaper, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { PlatformRow } from "@/components/platform-card";
import { platforms } from "@shared/schema";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

type NewsItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  imageUrl: string | null;
};

function formatPubDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  const { data: news, isLoading: newsLoading, isError: newsError } = useQuery<NewsItem[]>({
    queryKey: ["/api/news/sports"],
    queryFn: async () => {
      const res = await fetch("/api/news/sports", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Welcome back, {user.username}!</h1>
          <p className="text-muted-foreground">
            Access all your sports betting platforms from one place
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0 space-y-4">

            {/* Platforms list */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Platforms
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <nav className="space-y-0.5">
                  {platforms.map((platform) => (
                    <PlatformRow
                      key={platform.id}
                      platform={platform}
                      onClick={() => setLocation(platform.url)}
                    />
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-4 space-y-2">
                <Link href="/account">
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-manage-account">
                    Manage Account
                  </Button>
                </Link>
                <Link href="/account">
                  <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-security-settings">
                    Security Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Newspaper className="h-5 w-5 text-primary" />
                <CardTitle>Sports News</CardTitle>
                <Badge variant="outline" className="ml-auto text-xs">CBS Sports</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {newsLoading && (
                  <div className="divide-y divide-border">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="px-6 py-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    ))}
                  </div>
                )}

                {newsError && (
                  <div className="px-6 py-12 flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm">Couldn't load sports news right now. Try refreshing the page.</p>
                  </div>
                )}

                {news && news.length === 0 && (
                  <div className="px-6 py-12 text-center text-muted-foreground text-sm">
                    No news articles available at this time.
                  </div>
                )}

                {news && news.length > 0 && (
                  <div className="divide-y divide-border">
                    {news.slice(0, 10).map((item, i) => (
                      <a
                        key={i}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`link-news-${i}`}
                        className="flex items-start gap-3 px-6 py-4 hover:bg-muted/40 transition-colors group"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-16 w-16 rounded-md object-cover shrink-0 bg-muted"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {item.source}{item.pubDate ? ` · ${formatPubDate(item.pubDate)}` : ""}
                          </p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
