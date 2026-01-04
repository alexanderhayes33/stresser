import { createClient } from '@/lib/supabase/server'

interface ApiLogData {
  user_id?: number | null
  endpoint: string
  method: string
  request_body?: any
  request_headers?: Record<string, string>
  response_status?: number
  response_body?: any
  ip_address?: string
  user_agent?: string
  duration_ms?: number
}

export async function logApiRequest(data: ApiLogData) {
  try {
    const supabase = await createClient()
    
    // Clean up sensitive data from request body
    const cleanedRequestBody = data.request_body ? cleanSensitiveData(data.request_body) : null
    const cleanedResponseBody = data.response_body ? cleanSensitiveData(data.response_body) : null
    
    await supabase
      .from('api_logs')
      .insert({
        user_id: data.user_id,
        endpoint: data.endpoint,
        method: data.method,
        request_body: cleanedRequestBody,
        request_headers: data.request_headers,
        response_status: data.response_status,
        response_body: cleanedResponseBody,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        duration_ms: data.duration_ms,
      })
  } catch (error) {
    // Don't throw error, just log to console
    // We don't want logging failures to break the API
    console.error('Failed to log API request:', error)
  }
}

function cleanSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => cleanSensitiveData(item))
  }

  const sensitiveKeys = ['password', 'password_hash', 'api_key', 'token', 'authorization', 'cookie']
  const cleaned: any = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      cleaned[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = cleanSensitiveData(value)
    } else {
      cleaned[key] = value
    }
  }

  return cleaned
}

