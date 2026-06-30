"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface VoiceAssistantWidgetProps {
  projectId?: string
}

export function VoiceAssistantWidget({ projectId }: VoiceAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [transcript, setTranscript] = useState("")
  const [replyText, setReplyText] = useState("")

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    // Initialize Web Speech APIs
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const rec = new SpeechRecognition()
        rec.continuous = false
        rec.interimResults = false
        rec.lang = "en-US"

        rec.onstart = () => {
          setIsListening(true)
          setTranscript("Listening...")
        }

        rec.onerror = (e: any) => {
          console.error("Speech recognition error:", e)
          setIsListening(false)
          setTranscript("")
        }

        rec.onend = () => {
          setIsListening(false)
        }

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript
          setTranscript(resultText)
          handleSendQuery(resultText)
        }

        recognitionRef.current = rec
      }
    }

    return () => {
      stopSpeaking()
    }
  }, [projectId])

  const startListening = () => {
    stopSpeaking() // Interrupt ongoing speech
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error("Failed to start speech recognition:", err)
      }
    } else {
      toast.error("Speech Recognition is not supported in this browser.")
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
  }

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return

    setIsProcessing(true)
    try {
      const res = await fetch("/api/ai/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          project_id: projectId
        })
      })

      const result = await res.json()
      if (result.success && result.data) {
        setReplyText(result.data.text)
        
        // Fulfill "supports interruption" - stop any existing voice
        stopSpeaking()

        if (speechEnabled && synthRef.current) {
          const utterance = new SpeechSynthesisUtterance(result.data.text)
          utterance.lang = "en-US"
          utterance.rate = 1.0
          utteranceRef.current = utterance
          synthRef.current.speak(utterance)
        }
      } else {
        toast.error("Failed to get response from Marlin")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error processing voice query")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-gradient-to-br from-card to-purple-500/5 border border-purple-500/20 rounded-2xl p-4 shadow-2xl w-72 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
              <Sparkles className="size-3.5 text-purple-500 animate-pulse" />
              Marlin Voice Assistant
            </span>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={() => setSpeechEnabled(!speechEnabled)}
              >
                {speechEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  stopSpeaking()
                  setIsOpen(false)
                }}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-xl min-h-[60px] text-xs flex flex-col justify-between">
            {transcript ? (
              <p className="italic text-foreground">"{transcript}"</p>
            ) : (
              <p className="text-muted-foreground">Click the mic and speak...</p>
            )}

            {replyText && !isListening && !isProcessing && (
              <p className="text-purple-600 dark:text-purple-400 font-medium mt-2 leading-snug">
                {replyText}
              </p>
            )}

            {isProcessing && (
              <div className="flex items-center gap-1 mt-2 text-[10px] text-purple-500 font-bold">
                <Loader2 className="size-3 animate-spin" />
                Marlin is thinking...
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {isListening ? (
              <Button 
                onClick={stopListening} 
                className="rounded-full size-12 bg-red-500 hover:bg-red-600 text-white animate-pulse"
              >
                <MicOff className="size-5" />
              </Button>
            ) : (
              <Button 
                onClick={startListening} 
                className="rounded-full size-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
              >
                <Mic className="size-5" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full size-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Mic className="size-6 animate-pulse" />
        </Button>
      )}
    </div>
  )
}
