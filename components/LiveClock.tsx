"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, Settings2, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// Common timezones with friendly names
const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "Mumbai (IST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Africa/Cairo", label: "Cairo (EET)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
]

interface LiveClockProps {
  className?: string
  showSettings?: boolean
  compact?: boolean
}

export function LiveClock({ className, showSettings = true, compact = false }: LiveClockProps) {
  const [time, setTime] = useState<Date>(new Date())
  const [is24Hour, setIs24Hour] = useState(true)
  const [timezone, setTimezone] = useState("Africa/Cairo") // Default to Cairo (EET)
  const [mounted, setMounted] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Load preferences from localStorage
  useEffect(() => {
    setMounted(true)
    const savedFormat = localStorage.getItem("clock_format")
    const savedTimezone = localStorage.getItem("clock_timezone")
    
    if (savedFormat !== null) {
      setIs24Hour(savedFormat === "24")
    }
    if (savedTimezone) {
      setTimezone(savedTimezone)
    } else {
      // Try to detect user's timezone
      try {
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone
        setTimezone(detectedTz)
      } catch {
        // Keep default
      }
    }
  }, [])

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Save preferences
  const handleFormatChange = useCallback((value: boolean) => {
    setIs24Hour(value)
    localStorage.setItem("clock_format", value ? "24" : "12")
  }, [])

  const handleTimezoneChange = useCallback((value: string) => {
    setTimezone(value)
    localStorage.setItem("clock_timezone", value)
  }, [])

  // Format time based on settings
  const formatTime = useCallback(() => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: !is24Hour,
        timeZone: timezone,
      }
      return time.toLocaleTimeString("en-US", options)
    } catch {
      return time.toLocaleTimeString()
    }
  }, [time, is24Hour, timezone])

  // Get timezone abbreviation
  const getTimezoneAbbr = useCallback(() => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZoneName: "short",
        timeZone: timezone,
      }
      const parts = time.toLocaleDateString("en-US", options).split(", ")
      return parts[parts.length - 1] || timezone.split("/").pop()
    } catch {
      return timezone.split("/").pop()
    }
  }, [time, timezone])

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Clock className="size-4 text-muted-foreground" />
        <span className="font-mono text-muted-foreground">--:--:--</span>
      </div>
    )
  }

  const timeDisplay = formatTime()
  const tzAbbr = getTimezoneAbbr()

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "bg-muted/50 border border-border/50",
        compact && "px-2 py-1"
      )}>
        <Clock className={cn("text-primary", compact ? "size-3.5" : "size-4")} />
        <span className={cn(
          "font-mono font-medium tracking-tight",
          compact ? "text-xs" : "text-sm"
        )}>
          {timeDisplay}
        </span>
        {!compact && (
          <span className="text-xs text-muted-foreground font-medium">
            {tzAbbr}
          </span>
        )}
      </div>

      {showSettings && (
        <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-lg hover:bg-muted/80",
                compact ? "size-7" : "size-8"
              )}
            >
              <Settings2 className={cn(compact ? "size-3.5" : "size-4")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Clock Settings</h4>
                <Clock className="size-4 text-muted-foreground" />
              </div>

              {/* 12/24 Hour Format Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="clock-format" className="text-sm">24-Hour Format</Label>
                  <p className="text-xs text-muted-foreground">
                    {is24Hour ? "Using 24-hour time" : "Using 12-hour time (AM/PM)"}
                  </p>
                </div>
                <Switch
                  id="clock-format"
                  checked={is24Hour}
                  onCheckedChange={handleFormatChange}
                />
              </div>

              {/* Timezone Selector */}
              <div className="space-y-2">
                <Label className="text-sm">Timezone</Label>
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        <span className="flex items-center gap-2">
                          {timezone === tz.value && (
                            <Check className="size-3 text-primary" />
                          )}
                          <span className={timezone === tz.value ? "font-medium" : ""}>
                            {tz.label}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Current time:</span>
                  <span className="font-mono text-sm font-medium">{timeDisplay}</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default LiveClock
