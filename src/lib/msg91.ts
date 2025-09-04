import { formatPhoneNumber } from './utils'

interface MSG91Response {
  type: string
  message: string
  request_id?: string
}

interface MSG91OTPResponse extends MSG91Response {
  otp?: string
}

export class MSG91Service {
  private apiKey: string
  private senderId: string
  private route: string
  private countryCode: string

  constructor() {
    this.apiKey = process.env.MSG91_API_KEY!
    this.senderId = process.env.MSG91_SENDER_ID || 'PLRAPP'
    this.route = process.env.MSG91_ROUTE || '4'
    this.countryCode = process.env.MSG91_COUNTRY_CODE || '91'
  }

  /**
   * Send OTP via SMS using MSG91
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      // Remove any country code prefixes and ensure we have the correct format
      const cleanPhone = phoneNumber.replace(/^\+?91/, '')

      const payload = {
        sender: this.senderId,
        route: this.route,
        country: this.countryCode,
        sms: [
          {
            message: `Your Punjab Flood Relief verification code is: ${otp}. Valid for 5 minutes.`,
            to: [cleanPhone]
          }
        ]
      }

      const response = await fetch('https://api.msg91.com/api/v2/sendsms', {
        method: 'POST',
        headers: {
          'authkey': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data: MSG91Response = await response.json()

      if (response.ok && data.type === 'success') {
        return {
          success: true,
          message: 'OTP sent successfully'
        }
      } else {
        console.error('MSG91 API Error:', data)
        return {
          success: false,
          message: data.message || 'Failed to send OTP'
        }
      }
    } catch (error) {
      console.error('MSG91 Service Error:', error)
      return {
        success: false,
        message: 'Network error while sending OTP'
      }
    }
  }

  /**
   * Send OTP via voice call (fallback option)
   */
  async sendVoiceOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const cleanPhone = phoneNumber.replace(/^\+?91/, '')

      const payload = {
        sender: this.senderId,
        country: this.countryCode,
        sms: [
          {
            message: `Your Punjab Flood Relief verification code is: ${otp}. Valid for 5 minutes.`,
            to: [cleanPhone]
          }
        ]
      }

      const response = await fetch('https://api.msg91.com/api/v2/voice/sendotp', {
        method: 'POST',
        headers: {
          'authkey': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data: MSG91Response = await response.json()

      if (response.ok && data.type === 'success') {
        return {
          success: true,
          message: 'Voice OTP sent successfully'
        }
      } else {
        console.error('MSG91 Voice API Error:', data)
        return {
          success: false,
          message: data.message || 'Failed to send voice OTP'
        }
      }
    } catch (error) {
      console.error('MSG91 Voice Service Error:', error)
      return {
        success: false,
        message: 'Network error while sending voice OTP'
      }
    }
  }

  /**
   * Verify OTP (for future use if needed)
   */
  async verifyOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const cleanPhone = phoneNumber.replace(/^\+?91/, '')

      const response = await fetch('https://api.msg91.com/api/v2/otp/verify', {
        method: 'POST',
        headers: {
          'authkey': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mobile: cleanPhone,
          otp: otp,
          country: this.countryCode
        })
      })

      const data: MSG91Response = await response.json()

      if (response.ok && data.type === 'success') {
        return {
          success: true,
          message: 'OTP verified successfully'
        }
      } else {
        return {
          success: false,
          message: data.message || 'OTP verification failed'
        }
      }
    } catch (error) {
      console.error('MSG91 Verify Error:', error)
      return {
        success: false,
        message: 'Network error during verification'
      }
    }
  }
}

export const msg91Service = new MSG91Service()
