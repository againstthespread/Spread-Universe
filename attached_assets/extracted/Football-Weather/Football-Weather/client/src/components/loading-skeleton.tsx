import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function GameCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Badges skeleton */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>

        {/* Weather skeleton */}
        <div className="bg-muted/50 rounded-md p-3">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <div>
                  <Skeleton className="h-4 w-12 mb-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="border-0 bg-card">
          <CardContent className="p-3 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div>
              <Skeleton className="h-7 w-8 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSummarySkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
