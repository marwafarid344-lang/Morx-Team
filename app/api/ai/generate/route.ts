import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { checkAndIncrementAiUsage } from '@/lib/utils/aiUsage'

// General-purpose AI generation endpoint
// Rate limited based on user plan
// Protected - requires authentication

export async function POST(request: NextRequest) {
  // Require authentication
  const user = await requireAuth(request);
  
  if (user instanceof NextResponse) {
    return user; // Return 401 error
  }

  try {
    const body = await request.json()
    const { prompt, max_tokens = 500 } = body

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Use authenticated user ID
    const userId = user.id;

    // Check rate limit using shared utility
    const rateLimit = await checkAndIncrementAiUsage(userId)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimit.error,
          limitReached: true,
          remaining: 0,
          plan: rateLimit.plan,
          limit: rateLimit.limit
        },
        { status: 429 }
      )
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY

    if (!openRouterKey && !geminiKey) {
      return NextResponse.json(
        { success: false, error: 'No AI API key configured' },
        { status: 500 }
      )
    }

    let generatedText: string | null = null

    // Try OpenRouter first
    if (openRouterKey) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
          },
          body: JSON.stringify({
            model: 'openrouter/auto',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: max_tokens,
            temperature: 0.7,
          })
        })

        if (response.ok) {
          const data = await response.json()
          generatedText = data.choices?.[0]?.message?.content?.trim()
        } else {
          console.error('OpenRouter error:', await response.text())
        }
      } catch (error) {
        console.error('OpenRouter request failed:', error)
      }
    }

    // Fallback to Gemini if OpenRouter failed
    if (!generatedText && geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: max_tokens,
              }
            })
          }
        )

        if (response.ok) {
          const data = await response.json()
          generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        } else {
          console.error('Gemini error:', await response.text())
        }
      } catch (error) {
        console.error('Gemini request failed:', error)
      }
    }

    if (generatedText) {
      return NextResponse.json({
        success: true,
        data: generatedText
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to generate response from AI' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('AI generate error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
