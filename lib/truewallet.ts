import axios from 'axios'
import { redeemVoucherWithBrowser } from './truewallet-puppeteer'

interface RedeemResult {
  status: 'SUCCESS' | 'FAIL'
  amount?: number
  reason?: string
}

export async function redeemVoucher(
  phoneNumber: string,
  voucherCode: string,
  useBrowser: boolean = true
): Promise<RedeemResult> {
  // Use browser automation to bypass Cloudflare if enabled
  if (useBrowser) {
    try {
      console.log('🌐 Attempting to use browser automation to bypass Cloudflare...')
      return await redeemVoucherWithBrowser(phoneNumber, voucherCode)
    } catch (error: any) {
      console.error('⚠️ Browser automation failed, falling back to direct API:', error.message)
      // Fall through to direct API call
    }
  }
  
  try {
    // Remove URL prefix if exists
    voucherCode = voucherCode.replace('https://gift.truemoney.com/campaign/?v=', '')
    
    console.log('📝 Data to send:', { phoneNumber, voucherCode })
    
    // ตรวจสอบ voucher code
    if (!/^[a-z0-9]*$/i.test(voucherCode)) {
      return {
        status: 'FAIL',
        reason: 'Voucher code must contain only English letters and numbers'
      }
    }
    
    if (voucherCode.length <= 0) {
      return {
        status: 'FAIL',
        reason: 'Please enter voucher code'
      }
    }
    
    const data = {
      mobile: `${phoneNumber}`,
      voucher_hash: `${voucherCode}`
    }
    
    console.log('🌐 Sending data to TrueWallet API...')
    
    const response = await axios({
      method: 'POST',
      url: `https://gift.truemoney.com/campaign/vouchers/${voucherCode}/redeem`,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://gift.truemoney.com',
        'Referer': 'https://gift.truemoney.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Connection': 'keep-alive',
      },
      data: JSON.stringify(data),
      timeout: 30000, // 30 seconds
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    })
    
    console.log('📋 Response status:', response.status)
    console.log('📋 Response data type:', typeof response.data)
    
    // ตรวจสอบการตอบกลับ
    if (!response.data) {
      return {
        status: 'FAIL',
        reason: 'No response received from TrueWallet'
      }
    }
    
    // ตรวจสอบว่า response เป็น HTML (Cloudflare block) หรือไม่
    const responseData = response.data
    const responseDataString = typeof responseData === 'string' 
      ? responseData 
      : JSON.stringify(responseData || '')
    
    // ตรวจสอบ Cloudflare block ก่อน
    if (responseDataString.includes('Cloudflare') || 
        responseDataString.includes('Attention Required') ||
        responseDataString.includes('Sorry, you have been blocked') ||
        responseDataString.includes('cf-wrapper') ||
        responseDataString.includes('Cloudflare Ray ID')) {
      console.log('⚠️ Cloudflare block detected in response')
      return {
        status: 'FAIL',
        reason: 'Access blocked by Cloudflare security. The TrueWallet API is currently protected. Please try again later or contact administrator for alternative payment methods.'
      }
    }
    
    // ตรวจสอบว่าเป็น HTML response หรือไม่
    if (responseDataString.includes('<!DOCTYPE html>') || 
        responseDataString.includes('<!DOCTYPE HTML>') ||
        responseDataString.includes('<html')) {
      console.log('⚠️ HTML response detected (not JSON)')
      return {
        status: 'FAIL',
        reason: `Server error (${response.status}). Please try again later`
      }
    }
    
    // ตรวจสอบว่า status code ไม่ใช่ 2xx
    if (response.status < 200 || response.status >= 300) {
      return {
        status: 'FAIL',
        reason: `Server responded with status ${response.status}. Please try again later`
      }
    }
    
    // พยายาม parse เป็น JSON
    let resjson
    if (typeof responseData === 'string') {
      try {
        resjson = JSON.parse(responseData)
      } catch (e) {
        return {
          status: 'FAIL',
          reason: 'Invalid response format from TrueWallet'
        }
      }
    } else {
      resjson = responseData
    }
    
    // ตรวจสอบโครงสร้างข้อมูล
    if (!resjson || !resjson.status) {
      console.log('❌ Response data missing status field:', resjson)
      return {
        status: 'FAIL',
        reason: 'Invalid response format from TrueWallet'
      }
    }
    
    // ตรวจสอบความสำเร็จ
    if (resjson.status.code === 'SUCCESS') {
      const amount = resjson.data && resjson.data.voucher
        ? parseInt(resjson.data.voucher.redeemed_amount_baht)
        : 0
        
      return {
        status: 'SUCCESS',
        amount: amount
      }
    } else {
      return {
        status: 'FAIL',
        reason: resjson.status.message || 'Unknown error occurred'
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error in redeemVoucher:', error)
    
    // ตรวจสอบประเภทของ error
    if (error.response) {
      // Server ตอบกลับแต่มี error status
      console.log('📋 Error response status:', error.response.status)
      console.log('📋 Error response data type:', typeof error.response.data)
      
      const responseData = error.response.data
      const responseDataString = typeof responseData === 'string' 
        ? responseData 
        : JSON.stringify(responseData || '')
      
      // ตรวจสอบว่าเป็น Cloudflare block หรือไม่
      if (responseDataString.includes('Cloudflare') || 
          responseDataString.includes('Attention Required') ||
          responseDataString.includes('Sorry, you have been blocked') ||
          responseDataString.includes('cf-wrapper') ||
          responseDataString.includes('Cloudflare Ray ID')) {
        console.log('⚠️ Cloudflare block detected')
        return {
          status: 'FAIL',
          reason: 'Access blocked by Cloudflare security. The TrueWallet API is currently protected. Please try again later or contact administrator for alternative payment methods.'
        }
      }
      
      // ตรวจสอบว่าเป็น HTML response หรือไม่ (มักจะเป็น error page)
      if (responseDataString.includes('<!DOCTYPE html>') || 
          responseDataString.includes('<!DOCTYPE HTML>') ||
          responseDataString.includes('<html')) {
        return {
          status: 'FAIL',
          reason: `Server error (${error.response.status}). Please try again later`
        }
      }
      
      // ตรวจสอบว่าเป็น JSON response หรือไม่
      if (typeof responseData === 'object' && responseData !== null) {
        return {
          status: 'FAIL',
          reason: responseData.message || responseData.error || `Server error (${error.response.status})`
        }
      }
      
      return {
        status: 'FAIL',
        reason: `Server responded with status ${error.response.status}: ${responseDataString.substring(0, 100)}`
      }
    } else if (error.request) {
      // ส่ง request ไปแล้วแต่ไม่ได้รับการตอบกลับ
      console.log('📋 No response received:', error.request)
      return {
        status: 'FAIL',
        reason: 'Unable to connect to TrueWallet server'
      }
    } else {
      // Error อื่นๆ
      return {
        status: 'FAIL',
        reason: `Error occurred: ${error.message}`
      }
    }
  }
}

