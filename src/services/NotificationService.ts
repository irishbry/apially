
import { Notification } from '@/components/NotificationsCenter';
import { toast } from "@/components/ui/use-toast";

class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private subscribers: ((notifications: Notification[]) => void)[] = [];

  private constructor() {
    // Load saved notifications from localStorage
    this.loadNotifications();
    
    // Set up event listener for custom events
    window.addEventListener('api-event', ((e: CustomEvent) => {
      if (e.detail && e.detail.type) {
        this.addFromEvent(e.detail);
      }
    }) as EventListener);
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private loadNotifications(): void {
    try {
      const saved = localStorage.getItem('csv-api-notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
        console.log(`Loaded ${this.notifications.length} saved notifications`);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem('csv-api-notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  public addNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Notification {
    const newNotification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    this.notifySubscribers();

    // Show toast with dismiss option and shorter duration
    toast({
      title: title,
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
      // Auto-dismiss after 5 seconds (matches the TOAST_REMOVE_DELAY we set)
      duration: 5000,
    });

    return newNotification;
  }

  private addFromEvent(event: any): void {
    const { type, title, message, notificationType } = event;
    
    // Map event types to notification types
    const notificationTypeMap: {[key: string]: 'info' | 'success' | 'warning' | 'error'} = {
      'data-received': 'info',
      'export-complete': 'success',
      'validation-error': 'warning',
      'api-error': 'error',
      'auth-error': 'error'
    };
    
    const mappedType = notificationTypeMap[type] || notificationType || 'info';
    
    this.addNotification(
      title || this.getDefaultTitle(type),
      message || 'An event occurred',
      mappedType
    );
  }

  private getDefaultTitle(eventType: string): string {
    switch (eventType) {
      case 'data-received': 
        return 'Data Received';
      case 'export-complete': 
        return 'Export Complete';
      case 'validation-error': 
        return 'Validation Error';
      case 'api-error': 
        return 'API Error';
      case 'auth-error': 
        return 'Authentication Error';
      default: 
        return 'Notification';
    }
  }

  public markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifySubscribers();
    }
  }

  public markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.saveNotifications();
    this.notifySubscribers();
  }

  public deleteNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifySubscribers();
  }

  public clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
    this.notifySubscribers();
  }

  public subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback([...this.notifications]));
  }

  // Helper to dispatch event for testing
  public dispatchTestEvent(type: string, message: string): void {
    window.dispatchEvent(new CustomEvent('api-event', {
      detail: {
        type,
        message
      }
    }));
  }
}

export default NotificationService.getInstance();
