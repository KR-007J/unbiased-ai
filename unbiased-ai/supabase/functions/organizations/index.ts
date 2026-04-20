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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

// Apply rate limiting and enterprise utilities
const enhancedHandler = withRateLimit(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const startTime = Date.now()
  const requestId = `organizations-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'list'
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

    // Extract user ID from JWT (simplified - in production use proper JWT decoding)
    let userId: string | null = null
    try {
      // TODO: Properly decode JWT to extract user ID
      userId = 'authenticated-user' // Placeholder
    } catch (error) {
      return new Response(JSON.stringify(createErrorResponse('Invalid authentication token', 401)), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    switch (action) {
      case 'create': {
        const { name, slug, description, industry, size } = await req.json()

        // Validate input
        if (!name || !slug) {
          return new Response(JSON.stringify(createErrorResponse('Name and slug are required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if slug is available
        const { data: existing } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', slug)
          .single()

        if (existing) {
          return new Response(JSON.stringify(createErrorResponse('Organization slug already exists', 409)), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create organization
        const { data: org, error } = await supabase
          .from('organizations')
          .insert({
            name,
            slug,
            description,
            industry,
            size: size || 'small',
            created_by: userId,
          })
          .select()
          .single()

        if (error) throw error

        // Add creator as owner
        await supabase
          .from('organization_members')
          .insert({
            organization_id: org.id,
            user_id: userId,
            role: 'owner',
          })

        // Log organization creation
        await logAuditEvent({
          user_id: userId,
          action: 'organization_created',
          target_table: 'organizations',
          target_id: org.id,
          changes: { new: org },
          organization_id: org.id,
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(org, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'list': {
        const { data: userOrgs, error } = await supabase
          .rpc('get_user_organizations', { user_uuid: userId })

        if (error) throw error

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(userOrgs, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'get': {
        const orgId = url.searchParams.get('orgId')
        if (!orgId) {
          return new Response(JSON.stringify(createErrorResponse('Organization ID required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if user is member
        const { data: membership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', orgId)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()

        if (!membership) {
          return new Response(JSON.stringify(createErrorResponse('Not a member of this organization', 403)), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Get organization details
        const { data: org, error } = await supabase
          .from('organizations')
          .select(`
            *,
            organization_members!inner(count)
          `)
          .eq('id', orgId)
          .single()

        if (error) throw error

        // Get permissions
        const { data: permissions } = await supabase
          .rpc('get_organization_permissions', {
            user_uuid: userId,
            org_uuid: orgId
          })

        const result = {
          ...org,
          userRole: membership.role,
          permissions,
        }

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(result, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'invite': {
        const orgId = url.searchParams.get('orgId')
        const { email, role } = await req.json()

        if (!orgId || !email || !role) {
          return new Response(JSON.stringify(createErrorResponse('Organization ID, email, and role are required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if user can invite
        const { data: userRole } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', orgId)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()

        if (!userRole || !['owner', 'admin'].includes(userRole.role)) {
          return new Response(JSON.stringify(createErrorResponse('Insufficient permissions to invite members', 403)), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', orgId)
          .eq('user_id', email) // This should be user ID lookup
          .single()

        if (existingMember) {
          return new Response(JSON.stringify(createErrorResponse('User is already a member of this organization', 409)), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Create invitation
        const token = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        const { data: invitation, error } = await supabase
          .from('organization_invitations')
          .insert({
            organization_id: orgId,
            email,
            role,
            invited_by: userId,
            token,
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single()

        if (error) throw error

        // TODO: Send email invitation

        // Log invitation
        await logAuditEvent({
          user_id: userId,
          action: 'organization_invitation_sent',
          target_table: 'organization_invitations',
          target_id: invitation.id,
          changes: { new: invitation },
          organization_id: orgId,
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(invitation, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'accept_invitation': {
        const { token } = await req.json()

        if (!token) {
          return new Response(JSON.stringify(createErrorResponse('Invitation token required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Find invitation
        const { data: invitation, error: inviteError } = await supabase
          .from('organization_invitations')
          .select('*, organizations(*)')
          .eq('token', token)
          .gt('expires_at', new Date().toISOString())
          .is('accepted_at', null)
          .single()

        if (inviteError || !invitation) {
          return new Response(JSON.stringify(createErrorResponse('Invalid or expired invitation', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if user email matches invitation
        // TODO: Get user email from auth
        const userEmail = 'user@example.com' // Placeholder

        if (invitation.email !== userEmail) {
          return new Response(JSON.stringify(createErrorResponse('Invitation is for a different email address', 403)), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Add user to organization
        await supabase
          .from('organization_members')
          .insert({
            organization_id: invitation.organization_id,
            user_id: userId,
            role: invitation.role,
            invited_by: invitation.invited_by,
            invited_at: invitation.created_at,
          })

        // Mark invitation as accepted
        await supabase
          .from('organization_invitations')
          .update({
            accepted_at: new Date().toISOString(),
            accepted_by: userId,
          })
          .eq('id', invitation.id)

        // Log acceptance
        await logAuditEvent({
          user_id: userId,
          action: 'organization_invitation_accepted',
          target_table: 'organization_invitations',
          target_id: invitation.id,
          changes: { invitation, accepted: true },
          organization_id: invitation.organization_id,
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({
          organization: invitation.organizations,
          role: invitation.role,
        }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'update_member_role': {
        const orgId = url.searchParams.get('orgId')
        const { memberId, newRole } = await req.json()

        if (!orgId || !memberId || !newRole) {
          return new Response(JSON.stringify(createErrorResponse('Organization ID, member ID, and new role are required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check permissions
        const { data: userRole } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', orgId)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()

        if (!userRole || !['owner', 'admin'].includes(userRole.role)) {
          return new Response(JSON.stringify(createErrorResponse('Insufficient permissions to manage members', 403)), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Update member role
        const { data: updatedMember, error } = await supabase
          .from('organization_members')
          .update({ role: newRole })
          .eq('organization_id', orgId)
          .eq('id', memberId)
          .select()
          .single()

        if (error) throw error

        // Log role change
        await logAuditEvent({
          user_id: userId,
          action: 'organization_member_role_updated',
          target_table: 'organization_members',
          target_id: memberId,
          changes: { newRole },
          organization_id: orgId,
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse(updatedMember, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'remove_member': {
        const orgId = url.searchParams.get('orgId')
        const memberId = url.searchParams.get('memberId')

        if (!orgId || !memberId) {
          return new Response(JSON.stringify(createErrorResponse('Organization ID and member ID are required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check permissions
        const { data: userRole } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', orgId)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()

        if (!userRole || !['owner', 'admin'].includes(userRole.role)) {
          return new Response(JSON.stringify(createErrorResponse('Insufficient permissions to manage members', 403)), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Remove member
        const { error } = await supabase
          .from('organization_members')
          .delete()
          .eq('organization_id', orgId)
          .eq('id', memberId)

        if (error) throw error

        // Log member removal
        await logAuditEvent({
          user_id: userId,
          action: 'organization_member_removed',
          target_table: 'organization_members',
          target_id: memberId,
          changes: { removed: true },
          organization_id: orgId,
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({ success: true }, { processingTime })

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
        })
      }

      case 'usage_stats': {
        const orgId = url.searchParams.get('orgId')
        const period = url.searchParams.get('period') || 'month'

        if (!orgId) {
          return new Response(JSON.stringify(createErrorResponse('Organization ID required', 400)), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Check if user is member
        const { data: membership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', orgId)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single()

        if (!membership) {
          return new Response(JSON.stringify(createErrorResponse('Not a member of this organization', 403)), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Calculate date range
        let startDate: Date
        const now = new Date()

        switch (period) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'quarter':
            startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
            break
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        }

        // Get usage stats
        const { data: usage, error } = await supabase
          .from('organization_usage')
          .select('resource_type, usage_count, created_at')
          .eq('organization_id', orgId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })

        if (error) throw error

        // Aggregate usage by resource type
        const stats: { [key: string]: { total: number; daily: { [key: string]: number } } } = {}

        usage?.forEach((item) => {
          const date = item.created_at.split('T')[0]
          if (!stats[item.resource_type]) {
            stats[item.resource_type] = { total: 0, daily: {} }
          }
          stats[item.resource_type].total += item.usage_count
          stats[item.resource_type].daily[date] = (stats[item.resource_type].daily[date] || 0) + item.usage_count
        })

        const processingTime = Date.now() - startTime
        const response = createSuccessResponse({
          period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          stats,
        }, { processingTime })

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
      userId: 'organizations-user', // TODO: Extract from request
      action: 'organizations',
      requestId,
      additionalData: { action: new URL(req.url).searchParams.get('action') }
    })

    return new Response(JSON.stringify(errorResponse), {
      status: errorResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId }
    })
  }
}, 'GENERAL')

serve(enhancedHandler)