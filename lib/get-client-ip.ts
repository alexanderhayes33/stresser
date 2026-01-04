import { NextRequest } from 'next/server'

/**
 * Get client IP address from request headers
 * Supports both IPv4 and IPv6 addresses
 * Checks multiple headers in order of preference
 */
export function getClientIp(request: NextRequest): string {
  // Check x-forwarded-for header (can contain multiple IPs, take the first one)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs separated by commas
    // The first IP is usually the original client IP
    const ips = forwardedFor.split(',').map(ip => ip.trim()).filter(ip => ip && ip !== '::1' && ip !== '127.0.0.1')
    if (ips.length > 0) {
      return ips[0]
    }
  }

  // Check x-real-ip header
  const realIp = request.headers.get('x-real-ip')
  if (realIp && realIp.trim() !== '::1' && realIp.trim() !== '127.0.0.1') {
    return realIp.trim()
  }

  // Check cf-connecting-ip (Cloudflare)
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp && cfConnectingIp.trim() !== '::1' && cfConnectingIp.trim() !== '127.0.0.1') {
    return cfConnectingIp.trim()
  }

  // Check x-client-ip
  const clientIp = request.headers.get('x-client-ip')
  if (clientIp && clientIp.trim() !== '::1' && clientIp.trim() !== '127.0.0.1') {
    return clientIp.trim()
  }

  // Check true-client-ip
  const trueClientIp = request.headers.get('true-client-ip')
  if (trueClientIp && trueClientIp.trim() !== '::1' && trueClientIp.trim() !== '127.0.0.1') {
    return trueClientIp.trim()
  }

  // Check x-forwarded header (alternative format)
  const forwarded = request.headers.get('x-forwarded')
  if (forwarded) {
    const match = forwarded.match(/for=([^;,\s]+)/)
    if (match && match[1] && match[1] !== '::1' && match[1] !== '127.0.0.1') {
      return match[1].trim()
    }
  }

  // If running on localhost and no proxy headers, we can't get the real IP
  // Return localhost to indicate this is a local request
  return 'localhost'
}

/**
 * Normalize IP address - convert localhost IPs to readable format
 */
export function normalizeIpAddress(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown'
  
  // Normalize localhost IPv6
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return 'localhost'
  }
  
  // Normalize localhost IPv4
  if (ip === '127.0.0.1' || ip === '0.0.0.0') {
    return 'localhost'
  }
  
  // Remove IPv6 mapped IPv4 prefix if present
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }
  
  return ip
}

/**
 * Validate if a string is a valid IP address (IPv4 or IPv6)
 */
export function isValidIpAddress(ip: string): boolean {
  if (ip === 'unknown') return false
  
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  
  // IPv6 regex (simplified, covers most cases)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

