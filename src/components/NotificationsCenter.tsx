
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

interface NotificationsCenterProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
}

const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearAll
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20';
      case 'warning':
        return 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'info':
      default:
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Close notifications panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the notifications panel
      if (isExpanded && !target.closest('[data-notifications-panel]')) {
        setIsExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded]);

  useEffect(() => {
    // Flash the notification bell when new notifications arrive
    if (unreadCount > 0 && !isExpanded) {
      const bellIcon = document.getElementById('notification-bell');
      if (bellIcon) {
        bellIcon.classList.add('animate-pulse');
        setTimeout(() => {
          bellIcon.classList.remove('animate-pulse');
        }, 1000);
      }
    }
  }, [unreadCount, isExpanded]);

  return (
    <div className="relative z-50">
      <Button
        variant="outline"
        size="sm"
        className="relative p-2"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Notifications"
      >
        <Bell id="notification-bell" className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600"
            variant="destructive"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isExpanded && (
        <Card className="absolute z-50 top-12 right-0 w-80 sm:w-96 shadow-lg" data-notifications-panel>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
                  Mark all read
                </Button>
                <Button variant="ghost" size="sm" onClick={onClearAll}>
                  Clear all
                </Button>
              </div>
            </div>
            <CardDescription>
              {unreadCount} unread notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="read">Read</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <NotificationList 
                  notifications={notifications}
                  onMarkRead={onMarkRead}
                  onDeleteNotification={onDeleteNotification}
                  getNotificationIcon={getNotificationIcon}
                  getNotificationClass={getNotificationClass}
                  formatTimestamp={formatTimestamp}
                />
              </TabsContent>
              <TabsContent value="unread">
                <NotificationList 
                  notifications={notifications.filter(n => !n.read)}
                  onMarkRead={onMarkRead}
                  onDeleteNotification={onDeleteNotification}
                  getNotificationIcon={getNotificationIcon}
                  getNotificationClass={getNotificationClass}
                  formatTimestamp={formatTimestamp}
                />
              </TabsContent>
              <TabsContent value="read">
                <NotificationList 
                  notifications={notifications.filter(n => n.read)}
                  onMarkRead={onMarkRead}
                  onDeleteNotification={onDeleteNotification}
                  getNotificationIcon={getNotificationIcon}
                  getNotificationClass={getNotificationClass}
                  formatTimestamp={formatTimestamp}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  getNotificationIcon: (type: string) => React.ReactNode;
  getNotificationClass: (type: string) => string;
  formatTimestamp: (timestamp: string) => string;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkRead,
  onDeleteNotification,
  getNotificationIcon,
  getNotificationClass,
  formatTimestamp
}) => {
  if (notifications.length === 0) {
    return (
      <div className="py-10 px-4 text-center text-muted-foreground">
        No notifications
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="divide-y">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-3 ${notification.read ? 'opacity-70' : ''} ${getNotificationClass(notification.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-muted-foreground">{notification.message}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(notification.timestamp)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {!notification.read && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkRead(notification.id);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotification(notification.id);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default NotificationsCenter;
