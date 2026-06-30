"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Star, Award, ShieldCheck, HeartHandshake, Zap, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Member {
  auth_user_id: string
  first_name: string
  last_name: string
  profile_image?: string | null
}

interface TeammateRatingModalProps {
  projectId: string
  teamMembers: Member[]
  currentUserId: string
}

export function TeammateRatingModal({ projectId, teamMembers, currentUserId }: TeammateRatingModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Sliders scores (1 to 5)
  const [leadership, setLeadership] = useState(3)
  const [communication, setCommunication] = useState(3)
  const [reliability, setReliability] = useState(3)
  const [quality, setQuality] = useState(3)
  const [problemSolving, setProblemSolving] = useState(3)
  const [teamwork, setTeamwork] = useState(3)

  const candidates = teamMembers.filter(m => m.auth_user_id !== currentUserId)

  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error("Please select a teammate to review")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/teams/reputation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          reviewee_id: selectedMember,
          ratings: {
            leadership,
            communication,
            reliability,
            quality,
            problem_solving: problemSolving,
            teamwork
          }
        })
      })

      const result = await res.json()
      if (result.success) {
        toast.success("Teammate feedback submitted successfully!")
        setOpen(false)
        setSelectedMember("")
      } else {
        toast.error(result.error || "Failed to submit rating")
      }
    } catch (err) {
      console.error(err)
      toast.error("Network error submitting rating")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-purple-500/30 hover:bg-purple-500/10 text-purple-700 dark:text-purple-300 gap-1 text-xs">
          <Star className="size-3.5 text-purple-500" />
          <span>Rate Teammates</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="size-5 text-purple-500" />
            <span>Teammate Performance Review</span>
          </DialogTitle>
          <DialogDescription>
            Submit anonymous, verified ratings for your teammates to evolve their AI DNA profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Teammate selection */}
          <div className="space-y-1.5">
            <Label>Select Teammate</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a teammate..." />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((m) => (
                  <SelectItem key={m.auth_user_id} value={m.auth_user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarImage src={m.profile_image || ''} />
                        <AvatarFallback className="text-[10px] font-bold">
                          {m.first_name[0]}{m.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{m.first_name} {m.last_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMember && (
            <div className="space-y-4 mt-2 animate-in fade-in duration-200">
              {/* Sliders for the 6 attributes */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1"><Award className="size-3 text-purple-500" /> Leadership</span>
                  <span>{leadership} / 5</span>
                </div>
                <Slider min={1} max={5} step={1} value={[leadership]} onValueChange={(val: number[]) => setLeadership(val[0])} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1"><MessageSquare className="size-3 text-blue-500" /> Communication</span>
                  <span>{communication} / 5</span>
                </div>
                <Slider min={1} max={5} step={1} value={[communication]} onValueChange={(val: number[]) => setCommunication(val[0])} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1"><Zap className="size-3 text-amber-500" /> Reliability</span>
                  <span>{reliability} / 5</span>
                </div>
                <Slider min={1} max={5} step={1} value={[reliability]} onValueChange={(val: number[]) => setReliability(val[0])} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1"><ShieldCheck className="size-3 text-emerald-500" /> Quality of Work</span>
                  <span>{quality} / 5</span>
                </div>
                <Slider min={1} max={5} step={1} value={[quality]} onValueChange={(val: number[]) => setQuality(val[0])} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1"><Star className="size-3 text-indigo-500" /> Problem Solving</span>
                  <span>{problemSolving} / 5</span>
                </div>
                <Slider min={1} max={5} step={1} value={[problemSolving]} onValueChange={(val: number[]) => setProblemSolving(val[0])} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1"><HeartHandshake className="size-3 text-pink-500" /> Teamwork</span>
                  <span>{teamwork} / 5</span>
                </div>
                <Slider min={1} max={5} step={1} value={[teamwork]} onValueChange={(val: number[]) => setTeamwork(val[0])} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !selectedMember}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
