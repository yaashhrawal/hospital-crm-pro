// Supabase Edge Function for sending emails via Resend
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || 're_hnhQfxdQ_8NijQc84CxHijKYLUcpPaGf6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    const { to, subject, html, from = 'onboarding@resend.dev', fromName = 'Valant Hospital', attachments = [] } = await req.json()

    console.log('📧 Sending email to:', to)

    // Prepare email payload
    const emailPayload: any = {
      from: `${fromName} <${from}>`,
      to: [to],
      subject,
      html,
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      console.log('📎 Attachments count:', attachments.length)
      emailPayload.attachments = attachments.map((attachment: any) => ({
        filename: attachment.filename,
        content: attachment.content,
      }))
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Resend API error:', data)
      throw new Error(data.message || 'Failed to send email')
    }

    console.log('✅ Email sent successfully:', data.id)

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
