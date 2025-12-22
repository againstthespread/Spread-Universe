import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Notification } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

const NotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { 
    data: notifications = [], 
    refetch,
    isLoading 
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/unread"],
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  const markAsRead = async (id: number) => {
    try {
      await apiRequest("POST", `/api/notifications/read/${id}`, {});
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const formatNotificationTime = (date: Date) => {
    return format(new Date(date), "MMM d, h:mm a");
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2 text-white">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center p-0">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex justify-between items-center">
            <span className="font-bold">Notifications</span>
            {notifications.length > 0 && (
              <Badge variant="outline">{notifications.length} new</Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No new notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="cursor-pointer py-3 px-4">
              <div className="flex flex-col gap-1" onClick={() => markAsRead(notification.id)}>
                <div className="text-sm font-medium">{notification.message}</div>
                <div className="text-xs text-gray-500">
                  {formatNotificationTime(notification.createdAt)}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button variant="ghost" className="w-full justify-center text-primary">
            View all notifications
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
