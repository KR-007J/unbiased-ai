import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
  handleError,
  validateContent,
  corsHeaders,
  ERROR_CODES
} from '../_shared/api.ts'
import { withRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { logAuditEvent } from '../_shared/audit.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_VERSION = 'v1'
const GEMINI_MODEL = 'gemini-2.5-flash'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const buildModelUrl = (): string => {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
}

const SYSTEM_PROMPT = `You are the Sovereign Arbiter - a specialized AI counselor focused on ethical governance and objective communication.

Your core responsibilities:
1. Help users understand bias in their content and thinking
2. Provide ethical frameworks for objective, inclusive communication
3. Suggest neutral, fact-based alternatives to biased language
4. Guide users toward more balanced perspectives
5. Answer questions about bias detection, measurement, and mitigation
6. Foster inclusive dialogue across different viewpoints

Your approach:
- Be empathetic and non-judgmental
- Explain bias in educational terms
- Provide actionable suggestions
- Encourage reflection without shame
- Respect diverse perspectives while promoting objectivity
- Use evidence-based reasoning
- Support users in their journey to more objective communication

Always respond thoughtfully and help users grow in their understanding of bias and inclusivity.`

// WebSocket connection manager (in-memory for this implementation)
// In production, use Redis or a proper WebSocket server
const activeConnections = new Map<string, any>()
const chatRooms = new Map<string, Set<any>>()

// Enhanced chat with real-time features and organization support
const enhancedHandler = withRateLimit(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const startTime = Date.now()
  const requestId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'send'
    const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null

    if (!supabase) {
      throw new Error('Database connection not available')
    }

    // Get authenticated user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify(createErrorResponse('Authentication required', 401)), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extract user ID from JWT (simplified)
    let userId: string | null = null
    try {
      userId = 'authenticated-user' // Placeholder
    } catch (error) {
      return new Response(JSON.stringify(createErrorResponse('Invalid authentication token', 401)), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    switch (action) {
      case 'send': {
        const { message, conversationId, organizationId, analysisId } = await req.json()

        // Validate input
        const validation = validateContent(message, 2000)
        if (!validation.valid) {
          return new Response(JSON.stringify(createErrorResponse(validation.error!, 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        if (!GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY is not configured in Supabase secrets.')
        }

        // Check organization permissions if org provided
        if (organizationId) {
          const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .eq('is_active', true)
            .single()

          if (!membership) {
            return new Response(JSON.stringify(createErrorResponse('Not a member of this organization', 403)), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
        }

        const convId = conversationId || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Get conversation history for context
        const { data: history } = await supabase
          .from('messages')
          .select('message_content, role')
          .eq('conversation_id', convId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(20)

        // Save user message
        const { data: userMessage, error: userMsgError } = await supabase
          .from('messages')
          .insert({
            user_id: userId,
            conversation_id: convId,
            message_content: message,
            role: 'user',
            organization_id: organizationId,
            analysis_id: analysisId,
            metadata: {
              source: 'api',
              requestId,
            }
          })
          .select()
          .single()

        if (userMsgError) throw userMsgError

        // Build conversation with proper structure
        const contents = [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT }] }, // System prompt
          ...(history || []).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.message_content }]
          })),
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ]

        console.log(`[${requestId}] Processing chat message for user: ${userId}, model: ${GEMINI_MODEL}`)

        const requestBody = {
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 1024
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        }

        const fetchUrl = buildModelUrl()
        const res = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: { message: res.statusText } }))
          const errorMsg = errorData.error?.message || res.statusText
          console.error(`[${requestId}] Gemini API error (${res.status}): ${errorMsg}`)

          throw new Error(`Gemini API error: ${errorMsg}`)
        }

        const data = await res.json()
        const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!assistantMessage) {
          throw new Error('No response generated from Gemini')
        }

        // Save AI response
        const { data: aiMessage, error: aiMsgError } = await supabase
          .from('messages')
          .insert({
            user_id: userId,
            conversation_id: convId,
            message_content: assistantMessage,
            role: 'assistant',
            organization_id: organizationId,
            analysis_id: analysisId,
            metadata: {
              source: 'ai',
              model: GEMINI_MODEL,
              tokens_used: Math.ceil(assistantMessage.length / 4), // Rough estimate
              requestId,
            }
          })
          .select()
          .single()

        if (aiMsgError) throw aiMsgError

        // Broadcast to real-time connections
        broadcastToConversation(convId, {
          type: 'new_message',
          conversationId: convId,
          message: aiMessage,
          timestamp: new Date().toISOString()
        })

        // Log chat interaction
        await logAuditEvent({
          user_id: userId,
          action: 'chat_message_sent',
          target_table: 'messages',
          target_id: userMessage.id,
          changes: {
            conversationId: convId,
            messageLength: message.length,
            aiResponseLength: assistantMessage.length,
            organizationId,
          },
          organization_id: organizationId,
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({
          conversationId: convId,
          userMessage: userMessage,
          aiMessage: aiMessage,
          organizationId,
        }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'history': {
        const conversationId = url.searchParams.get('conversationId')
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const offset = parseInt(url.searchParams.get('offset') || '0')

        if (!conversationId) {
          return new Response(JSON.stringify(createErrorResponse('Conversation ID required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Get conversation history
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('user_id', userId) // Only user's conversations
          .order('created_at', { ascending: true })
          .range(offset, offset + limit - 1)

        if (error) throw error

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({
          conversationId,
          messages: messages || [],
          pagination: {
            limit,
            offset,
            hasMore: messages && messages.length === limit
          }
        }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'conversations': {
        const organizationId = url.searchParams.get('organizationId')
        const limit = parseInt(url.searchParams.get('limit') || '20')
        const offset = parseInt(url.searchParams.get('offset') || '0')

        let query = supabase
          .from('messages')
          .select(`
            conversation_id,
            created_at,
            message_content,
            role,
            organization_id
          `)
          .eq('user_id', userId)

        if (organizationId) {
          query = query.eq('organization_id', organizationId)
        }

        const { data: conversations, error } = await query
          .order('created_at', { ascending: false })
          .limit(limit * 2) // Get more to group by conversation

        if (error) throw error

        // Group by conversation and get latest message
        const convMap = new Map()
        conversations?.forEach(msg => {
          if (!convMap.has(msg.conversation_id)) {
            convMap.set(msg.conversation_id, {
              id: msg.conversation_id,
              organizationId: msg.organization_id,
              lastMessage: msg.message_content,
              lastMessageAt: msg.created_at,
              messageCount: 1
            })
          } else {
            convMap.get(msg.conversation_id).messageCount++
          }
        })

        const convList = Array.from(convMap.values())
          .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
          .slice(offset, offset + limit)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({
          conversations: convList,
          pagination: {
            limit,
            offset,
            total: convMap.size,
            hasMore: offset + limit < convMap.size
          }
        }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'connect': {
        // Real-time connection establishment
        const conversationId = url.searchParams.get('conversationId')

        if (!conversationId) {
          return new Response(JSON.stringify(createErrorResponse('Conversation ID required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Generate connection token
        const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const connectionToken = crypto.randomUUID()

        // Store connection info (in production, use Redis)
        activeConnections.set(connectionId, {
          id: connectionId,
          userId,
          conversationId,
          token: connectionToken,
          connectedAt: new Date().toISOString()
        })

        // Add to conversation room
        if (!chatRooms.has(conversationId)) {
          chatRooms.set(conversationId, new Set())
        }
        chatRooms.get(conversationId)?.add(connectionId)

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({
          connectionId,
          token: connectionToken,
          conversationId,
          status: 'connected'
        }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'disconnect': {
        const connectionId = url.searchParams.get('connectionId')

        if (!connectionId) {
          return new Response(JSON.stringify(createErrorResponse('Connection ID required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Remove connection
        const connection = activeConnections.get(connectionId)
        if (connection) {
          const room = chatRooms.get(connection.conversationId)
          if (room) {
            room.delete(connectionId)
            if (room.size === 0) {
              chatRooms.delete(connection.conversationId)
            }
          }
          activeConnections.delete(connectionId)
        }

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({ success: true }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      default:
        return new Response(JSON.stringify(createErrorResponse('Invalid action', 400)), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (err: any) {
    const errorResponse = await handleError(err, {
      userId: 'chat-user', // TODO: Extract from request
      action: 'chat',
      requestId,
      additionalData: { action: new URL(req.url).searchParams.get('action') }
    })

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
    })
  }
}, 'CHAT')

// Broadcast message to conversation (simplified - in production use Redis pub/sub)
function broadcastToConversation(conversationId: string, message: any) {
  const room = chatRooms.get(conversationId)
  if (room) {
    // In a real WebSocket implementation, we'd send to each WebSocket in the room
    console.log(`Broadcasting to conversation ${conversationId}:`, message)

    // For polling clients, the message is already saved to database
    // Real-time clients would receive via WebSocket or Server-Sent Events
  }
}

serve(enhancedHandler)


