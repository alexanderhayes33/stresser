import { createClient } from '@/lib/supabase/server'

interface ExternalApiLogData {
  attack_id?: number | null
  user_id?: number | null
  api_url: string
  request_method?: string
  request_headers?: Record<string, string>
  response_status?: number
  response_body?: any
  response_headers?: Record<string, string>
  duration_ms?: number
  error_message?: string
}

export async function logExternalApiRequest(data: ExternalApiLogData) {
  try {
    const supabase = await createClient()
    
    // Clean up sensitive data from response body
    const cleanedResponseBody = data.response_body ? cleanSensitiveData(data.response_body) : null
    
    await supabase
      .from('external_api_logs')
      .insert({
        attack_id: data.attack_id,
        user_id: data.user_id,
        api_url: data.api_url,
        request_method: data.request_method || 'GET',
        request_headers: data.request_headers,
        response_status: data.response_status,
        response_body: cleanedResponseBody,
        response_headers: data.response_headers,
        duration_ms: data.duration_ms,
        error_message: data.error_message,
      })
  } catch (error) {
    // Don't throw error, just log to console
    // We don't want logging failures to break the API
    console.error('Failed to log external API request:', error)
  }
}

function cleanSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => cleanSensitiveData(item))
  }

  const sensitiveKeys = ['password', 'password_hash', 'api_key', 'token', 'authorization', 'cookie', 'key']
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

