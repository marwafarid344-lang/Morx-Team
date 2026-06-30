"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Task {
  task_id: string // UUID
  title: string
  description: string
  status: number // 0=todo, 1=in-progress, 2=done
  priority: number // 1=low, 2=medium, 3=high
  due_date: string | null
  assigned_users: string | null
  comment_count: number
  auth_user_id: string
}

interface TaskCalendarProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function TaskCalendar({ tasks, onTaskClick }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true })
    }

    // Next month days to fill the grid
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }

    return days
  }, [currentDate])

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    
    tasks.forEach(task => {
      if (task.due_date) {
        const dateKey = new Date(task.due_date).toDateString()
        if (!map.has(dateKey)) {
          map.set(dateKey, [])
        }
        map.get(dateKey)!.push(task)
      }
    })

    return map
  }, [tasks])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSlideDirection(direction === 'next' ? 'left' : 'right')
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (date: Date, dayTasks: Task[]) => {
    if (dayTasks.length > 0) {
      setSelectedDate(date)
      setIsDrawerOpen(true)
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 3) return "bg-red-500"
    if (priority === 2) return "bg-orange-500"
    return "bg-blue-500"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority === 3) return "High"
    if (priority === 2) return "Medium"
    return "Low"
  }

  const getStatusInfo = (status: number) => {
    if (status === 2) return { label: "Done", color: "text-green-500", bg: "bg-green-500/10" }
    if (status === 1) return { label: "In Progress", color: "text-orange-500", bg: "bg-orange-500/10" }
    return { label: "To Do", color: "text-blue-500", bg: "bg-blue-500/10" }
  }

  const isOverdue = (dueDate: string | null, status: number) => {
    if (!dueDate || status === 2) return false
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return due < today
  }

  const selectedDateTasks = selectedDate 
    ? tasksByDate.get(selectedDate.toDateString()) || []
    : []

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={goToToday}
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="size-8 sm:size-9"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="size-8 sm:size-9"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((day, index) => (
          <div 
            key={day} 
            className={cn(
              "text-center text-xs sm:text-sm font-medium py-2",
              index === 0 || index === 6 ? "text-muted-foreground" : "text-foreground"
            )}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
          initial={{ opacity: 0, x: slideDirection === 'left' ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: slideDirection === 'left' ? -50 : 50 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="grid grid-cols-7 gap-px bg-border/50 rounded-xl overflow-hidden border border-border/50"
        >
          {calendarData.map((day, index) => {
            const dateKey = day.date.toDateString()
            const dayTasks = tasksByDate.get(dateKey) || []
            const isToday = day.date.toDateString() === today.toDateString()
            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
            const hasOverdue = dayTasks.some(t => isOverdue(t.due_date, t.status))
            const completedCount = dayTasks.filter(t => t.status === 2).length

            return (
              <motion.button
                key={index}
                whileHover={{ scale: dayTasks.length > 0 ? 1.02 : 1 }}
                whileTap={{ scale: dayTasks.length > 0 ? 0.98 : 1 }}
                onClick={() => handleDayClick(day.date, dayTasks)}
                disabled={dayTasks.length === 0}
                className={cn(
                  "relative min-h-[52px] sm:min-h-[80px] md:min-h-[100px] p-1 sm:p-2 transition-all duration-200",
                  "flex flex-col items-center sm:items-start",
                  "bg-card hover:bg-accent/50",
                  !day.isCurrentMonth && "opacity-40",
                  isWeekend && day.isCurrentMonth && "bg-muted/30",
                  dayTasks.length > 0 && "cursor-pointer",
                  isToday && "ring-2 ring-primary ring-inset"
                )}
              >
                {/* Date Number */}
                <span 
                  className={cn(
                    "text-xs sm:text-sm font-medium size-6 sm:size-7 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                    hasOverdue && !isToday && "text-destructive"
                  )}
                >
                  {day.date.getDate()}
                </span>

                {/* Task Indicators - Mobile (dots) */}
                {dayTasks.length > 0 && (
                  <div className="sm:hidden flex items-center gap-0.5 mt-1">
                    {dayTasks.slice(0, 3).map((task, i) => (
                      <span 
                        key={i}
                        className={cn(
                          "size-1.5 rounded-full",
                          task.status === 2 ? "bg-green-500" : getPriorityColor(task.priority)
                        )}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[8px] text-muted-foreground ml-0.5">
                        +{dayTasks.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Task Indicators - Desktop (mini cards) */}
                {dayTasks.length > 0 && (
                  <div className="hidden sm:flex flex-col gap-0.5 mt-1 w-full overflow-hidden">
                    {dayTasks.slice(0, 2).map((task, i) => (
                      <div 
                        key={i}
                        className={cn(
                          "text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate",
                          "border-l-2",
                          task.status === 2 
                            ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 line-through opacity-60" 
                            : cn(
                                "bg-card border-current",
                                task.priority === 3 ? "text-red-600 dark:text-red-400" :
                                task.priority === 2 ? "text-orange-600 dark:text-orange-400" :
                                "text-blue-600 dark:text-blue-400"
                              )
                        )}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-[10px] text-muted-foreground pl-1.5">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                )}

                {/* Completion indicator */}
                {completedCount > 0 && completedCount === dayTasks.length && (
                  <div className="absolute top-1 right-1 hidden sm:block">
                    <CheckCircle2 className="size-3 text-green-500" />
                  </div>
                )}
              </motion.button>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Task Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 px-1 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-orange-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-blue-500" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-green-500" />
          <span>Done</span>
        </div>
      </div>

      {/* Tasks Drawer/Sheet for Mobile */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="bottom" className="h-[70vh] sm:h-[60vh] rounded-t-2xl">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <CalendarIcon className="size-5 text-primary" />
              {selectedDate?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100%-80px)] mt-4">
            <div className="space-y-3 pr-4">
              <AnimatePresence>
                {selectedDateTasks.map((task, index) => {
                  const statusInfo = getStatusInfo(task.status)
                  const taskIsOverdue = isOverdue(task.due_date, task.status)
                  
                  // Parse assigned users - only split on first 2 colons to preserve URL
                  const assignees = task.assigned_users
                    ? task.assigned_users.split('||').map(a => {
                        const parts = a.split(':')
                        const id = parts[0]
                        const name = parts[1]
                        // Image URL may contain colons, so join remaining parts
                        const image = parts.slice(2).join(':')
                        return { id, name, image: image || undefined }
                      })
                    : []

                  return (
                    <motion.div
                      key={task.task_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        onTaskClick?.(task)
                        setIsDrawerOpen(false)
                      }}
                      className={cn(
                        "p-4 rounded-xl border bg-card cursor-pointer",
                        "hover:shadow-md transition-all duration-200",
                        "active:scale-[0.98]",
                        task.status === 2 && "opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "font-semibold text-sm sm:text-base mb-1 line-clamp-2",
                            task.status === 2 && "line-through"
                          )}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Status Badge */}
                            <Badge variant="outline" className={cn("text-[10px] sm:text-xs", statusInfo.color, statusInfo.bg)}>
                              {statusInfo.label}
                            </Badge>
                            
                            {/* Priority Badge */}
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] sm:text-xs",
                                task.priority === 3 && "text-red-600 bg-red-500/10 border-red-200",
                                task.priority === 2 && "text-orange-600 bg-orange-500/10 border-orange-200",
                                task.priority === 1 && "text-blue-600 bg-blue-500/10 border-blue-200"
                              )}
                            >
                              {getPriorityLabel(task.priority)}
                            </Badge>

                            {/* Overdue Warning */}
                            {taskIsOverdue && (
                              <Badge variant="destructive" className="text-[10px] sm:text-xs">
                                <AlertCircle className="size-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Priority Indicator Bar */}
                        <div className={cn(
                          "w-1 h-12 rounded-full shrink-0",
                          getPriorityColor(task.priority)
                        )} />
                      </div>

                      {/* Assignees & Comments */}
                      {(assignees.length > 0 || task.comment_count > 0) && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          {assignees.length > 0 && (
                            <div className="flex -space-x-2">
                              {assignees.slice(0, 3).map((assignee, i) => (
                                <Avatar key={i} className="size-6 border-2 border-background">
                                  <AvatarImage src={assignee.image || undefined} />
                                  <AvatarFallback className="text-[10px] bg-primary/10">
                                    {assignee.name?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {assignees.length > 3 && (
                                <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                                  +{assignees.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                          {task.comment_count > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3" />
                              {task.comment_count} comment{task.comment_count > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {selectedDateTasks.length === 0 && (
                <div className="text-center py-8">
                  <CalendarIcon className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No tasks for this day</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
