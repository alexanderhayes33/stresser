import puppeteer from 'puppeteer'

interface RedeemResult {
  status: 'SUCCESS' | 'FAIL'
  amount?: number
  reason?: string
}

export async function redeemVoucherWithBrowser(
  phoneNumber: string,
  voucherCode: string
): Promise<RedeemResult> {
  let browser
  try {
    // Remove URL prefix if exists
    voucherCode = voucherCode.replace('https://gift.truemoney.com/campaign/?v=', '')
    
    console.log('📝 Data to send:', { phoneNumber, voucherCode })
    
    // Validate voucher code
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
    
    console.log('🌐 Launching browser to bypass Cloudflare...')
    
    // Launch browser with stealth settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    })
    
    const page = await browser.newPage()
    
    // Set realistic viewport
    await page.setViewport({ width: 1920, height: 1080 })
    
    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    
    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      })
    })
    
    // Set additional properties to mimic real browser
    await page.evaluateOnNewDocument(() => {
      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      })
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'th'],
      })
    })
    
    const url = `https://gift.truemoney.com/campaign/vouchers/${voucherCode}/redeem`
    
    console.log('📋 Navigating to:', url)
    
    // Navigate to the page first to get cookies
    await page.goto('https://gift.truemoney.com/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })
    
    // Wait a bit for Cloudflare to pass
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Now make the API call using page.evaluate
    console.log('🌐 Making API request...')
    
    const result = await page.evaluate(
      async (data, url) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(data),
          })
          
          const responseText = await response.text()
          
          return {
            status: response.status,
            data: responseText,
            ok: response.ok,
          }
        } catch (error: any) {
          return {
            status: 0,
            data: error.message,
            ok: false,
          }
        }
      },
      {
        mobile: phoneNumber,
        voucher_hash: voucherCode,
      },
      url
    )
    
    console.log('📋 Response status:', result.status)
    
    if (!result.ok || result.status >= 400) {
      // Check if it's Cloudflare block
      if (result.data.includes('Cloudflare') || result.data.includes('Attention Required')) {
        return {
          status: 'FAIL',
          reason: 'Access blocked by Cloudflare security. The TrueWallet API is currently protected. Please try again later or contact administrator for alternative payment methods.',
        }
      }
      
      return {
        status: 'FAIL',
        reason: `Server error (${result.status}). Please try again later`,
      }
    }
    
    // Parse JSON response
    let resjson
    try {
      resjson = JSON.parse(result.data)
    } catch (e) {
      return {
        status: 'FAIL',
        reason: 'Invalid response format from TrueWallet',
      }
    }
    
    // Check response structure
    if (!resjson || !resjson.status) {
      return {
        status: 'FAIL',
        reason: 'Invalid response format from TrueWallet',
      }
    }
    
    // Check success
    if (resjson.status.code === 'SUCCESS') {
      const amount =
        resjson.data && resjson.data.voucher
          ? parseInt(resjson.data.voucher.redeemed_amount_baht)
          : 0
      
      return {
        status: 'SUCCESS',
        amount: amount,
      }
    } else {
      return {
        status: 'FAIL',
        reason: resjson.status.message || 'Unknown error occurred',
      }
    }
  } catch (error: any) {
    console.error('❌ Error in redeemVoucherWithBrowser:', error)
    return {
      status: 'FAIL',
      reason: `Error occurred: ${error.message}`,
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

