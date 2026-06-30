"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Notification {
  notification_id: number
  auth_user_id: string
  type?: string
  title: string
  message: string
  related_id: number | null
  is_read: boolean
  created_at: string
  task_id?: number
}

interface NotificationPanelProps {
  userId: string // Switched to string UUID
}

export function NotificationPanel({ userId }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchNotifications()
      
      // Set up Supabase Realtime subscription for instant updates
      const supabase = createClient()
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `auth_user_id=eq.${userId}`
          },
          (payload) => {

            // Add new notification to the list
            const newNotif = payload.new as Notification
            setNotifications(prev => [newNotif, ...prev])
            setUnreadCount(prev => prev + 1)

            // Show a toast for the incoming notification
            toast(newNotif.title, {
              description: newNotif.message,
              icon: getNotificationIcon(newNotif.type),
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `auth_user_id=eq.${userId}`
          },
          (payload) => {

            // Update notification in the list
            const updated = payload.new as Notification
            setNotifications(prev => 
              prev.map(n => n.notification_id === updated.notification_id ? updated : n)
            )
            if (updated.is_read === true) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
            // Removed the else if that was incrementing count on UPDATE
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `auth_user_id=eq.${userId}`
          },
          (payload) => {
            // Remove deleted notification from the list
            const deleted = payload.old as Notification
            setNotifications(prev => prev.filter(n => n.notification_id !== deleted.notification_id))
            if (deleted.is_read === false) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications`)
      
      // If server error, silently fail and keep notifications empty
      if (!res.ok) {

        return
      }

      const result = await res.json()

      if (result.success) {
        setNotifications(result.data || [])
        const unread = result.data?.filter((n: Notification) => n.is_read === false).length || 0
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId })
      })

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        toast.success('Notification marked as read')
      } else {
        toast.error('Failed to mark notification as read')
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('An error occurred')
    }
  }

  const markAllAsRead = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
        toast.success('All notifications marked as read')
      } else {
        toast.error('Failed to mark all as read')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        const notification = notifications.find(n => n.notification_id === notificationId)
        setNotifications(prev => prev.filter(n => n.notification_id !== notificationId))
        if (notification && notification.is_read === false) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        toast.success('Notification deleted')
      } else {
        toast.error('Failed to delete notification')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('An error occurred')
    }
  }

  const getNotificationIcon = (type?: string) => {
    if (!type) return '🔔'
    switch (type) {
      case 'task_due':
        return '⏰'
      case 'profile_update':
        return '👤'
      case 'team_added':
        return '👥'
      case 'team_join_request':
        return '🤝'
      case 'team_request_declined':
        return '❌'
      case 'team_invitation':
        return '📩'
      case 'task_assigned':
        return '📝'
      case 'task_date_changed':
        return '📅'
      case 'task_completed':
        return '✅'
      case 'task_priority_changed':
        return '⚡'
      default:
        return '🔔'
    }
  }

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount}</Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isLoading}
                style={{
                  marginRight: '40px'
                }}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Read All
              </Button>
            )}
          </div>
          <SheetDescription>
            Stay updated with your tasks, profile, and team changes
          </SheetDescription>
        </SheetHeader>
        
        <Separator />
        
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4 space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something important happens</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors cursor-pointer hover:bg-accent",
                    notification.is_read === false ? "bg-primary/5 border-primary/20" : "bg-background"
                  )}
                  onClick={() => notification.is_read === false && markAsRead(notification.notification_id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {notification.is_read === false && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.notification_id)
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.notification_id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 break-words">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

