import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Basic Rate Limiter using Supabase Table
 * @param key Unique key (e.g. "ip_address:api_endpoint")
 * @param limit Max requests
 * @param windowSeconds Window in seconds
 */
export async function rateLimit(key: string, limit: number = 10, windowSeconds: number = 60): Promise<RateLimitResult> {
  if (!supabaseAdmin) {
    console.warn('Rate limiting disabled: Supabase Admin client not initialized')
    return { success: true, remaining: limit, reset: windowSeconds }
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() - windowSeconds * 1000)

  // 1. Cleanup old entries for this key (lazy cleanup)
  // Actually, for a simple counter, we can just check the row.
  
  // Try to get existing limit
  const { data: existing } = await supabaseAdmin
    .from('rate_limits')
    .select('*')
    .eq('key', key)
    .single()

  if (existing) {
    // Check if expired
    if (new Date(existing.expires_at) < now) {
      // Reset
      await supabaseAdmin
        .from('rate_limits')
        .update({
          count: 1,
          last_request: now.toISOString(),
          expires_at: new Date(now.getTime() + windowSeconds * 1000).toISOString()
        })
        .eq('id', existing.id)
      
      return { success: true, remaining: limit - 1, reset: windowSeconds }
    } else {
      // Check limit
      if (existing.count >= limit) {
        return { 
          success: false, 
          remaining: 0, 
          reset: Math.ceil((new Date(existing.expires_at).getTime() - now.getTime()) / 1000) 
        }
      }

      // Increment
      await supabaseAdmin
        .from('rate_limits')
        .update({
          count: existing.count + 1,
          last_request: now.toISOString()
        })
        .eq('id', existing.id)
      
      return { 
        success: true, 
        remaining: limit - (existing.count + 1), 
        reset: Math.ceil((new Date(existing.expires_at).getTime() - now.getTime()) / 1000) 
      }
    }
  } else {
    // Create new
    await supabaseAdmin
      .from('rate_limits')
      .insert({
        key,
        count: 1,
        last_request: now.toISOString(),
        expires_at: new Date(now.getTime() + windowSeconds * 1000).toISOString()
      })
    
    return { success: true, remaining: limit - 1, reset: windowSeconds }
  }
}
