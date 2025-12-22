import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function GameCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32" />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-6 w-full" />
            </div>
            <Skeleton className="w-20 h-16" />
          </div>

          <div className="flex items-center justify-center">
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-6 w-full" />
            </div>
            <Skeleton className="w-20 h-16" />
          </div>
        </div>

        <Skeleton className="w-full h-12" />
      </CardContent>

      <CardFooter className="pt-0 pb-4 border-t">
        <div className="w-full space-y-2">
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
