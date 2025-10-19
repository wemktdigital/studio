import { Resend } from 'resend'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

interface InviteEmailData {
  to: string
  workspaceName: string
  inviterName: string
  inviteLink: string
  message?: string
  inviteToken: string
}

interface BulkInviteResult {
  successful: string[]
  failed: { email: string; error: string }[]
  totalSent: number
  totalFailed: number
}

// HTML Template for invite emails
const createInviteEmailHTML = (data: InviteEmailData): string => {
  const { workspaceName, inviterName, inviteLink, message, to } = data
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para ${workspaceName}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .workspace-name {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 20px;
    }
    .inviter-info {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #2563eb;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background: #1d4ed8;
    }
    .message-box {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
      text-align: center;
    }
    .expiry-notice {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      padding: 12px;
      margin: 20px 0;
      font-size: 14px;
      color: #dc2626;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎯 Studio</div>
      <div class="workspace-name">${workspaceName}</div>
    </div>
    
    <h2 style="color: #1f2937; margin-bottom: 20px;">Você foi convidado!</h2>
    
    <div class="inviter-info">
      <p style="margin: 0; font-weight: 600;">
        <strong>${inviterName}</strong> convidou você para participar do workspace 
        <strong>"${workspaceName}"</strong>
      </p>
    </div>
    
    ${message ? `
    <div class="message-box">
      <p style="margin: 0; font-style: italic;">
        <strong>Mensagem do convidador:</strong><br>
        "${message}"
      </p>
    </div>
    ` : ''}
    
    <p>Para aceitar o convite e começar a colaborar, clique no botão abaixo:</p>
    
    <div style="text-align: center;">
      <a href="${inviteLink}" class="cta-button">
        🚀 Aceitar Convite
      </a>
    </div>
    
    <div class="expiry-notice">
      ⏰ <strong>Atenção:</strong> Este convite expira em 7 dias.
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:<br>
      <a href="${inviteLink}" style="color: #2563eb; word-break: break-all;">${inviteLink}</a>
    </p>
    
    <div class="footer">
      <p>Este é um convite automático do Studio.</p>
      <p>Se você não esperava receber este convite, pode ignorá-lo com segurança.</p>
      <p style="margin-top: 20px;">
        <strong>Studio</strong> - Plataforma de Comunicação<br>
        <a href="https://talk.we.marketing:9002" style="color: #2563eb;">talk.we.marketing:9002</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

// Plain text version for email clients that don't support HTML
const createInviteEmailText = (data: InviteEmailData): string => {
  const { workspaceName, inviterName, inviteLink, message, to } = data
  
  return `
🎯 Studio - Convite para ${workspaceName}

Olá!

${inviterName} convidou você para participar do workspace "${workspaceName}".

${message ? `Mensagem do convidador: "${message}"` : ''}

Para aceitar o convite, clique no link abaixo:
${inviteLink}

⚠️ ATENÇÃO: Este convite expira em 7 dias.

Se o link não funcionar, copie e cole a URL completa no seu navegador.

---
Studio - Plataforma de Comunicação
https://talk.we.marketing:9002

Este é um convite automático. Se você não esperava receber este convite, pode ignorá-lo com segurança.
  `.trim()
}

/**
 * Send a single invite email using Resend
 */
export async function sendInviteEmail(data: InviteEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validate required fields
    if (!data.to || !data.workspaceName || !data.inviterName || !data.inviteLink) {
      throw new Error('Missing required email data')
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, falling back to simulation mode')
      return await simulateEmailSend(data)
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'Studio <onboarding@resend.dev>',
      to: [data.to],
      subject: `Convite para o workspace ${data.workspaceName}`,
      html: createInviteEmailHTML(data),
      text: createInviteEmailText(data),
      tags: [
        { name: 'type', value: 'workspace_invite' },
        { name: 'workspace', value: data.workspaceName },
        { name: 'inviter', value: data.inviterName }
      ]
    })

    if (error) {
      console.error('❌ Resend API error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('✅ Email sent successfully:', {
      to: data.to,
      workspace: data.workspaceName,
      messageId: emailData?.id,
      inviter: data.inviterName
    })

    return { 
      success: true, 
      messageId: emailData?.id 
    }

  } catch (error: any) {
    console.error('❌ Error sending invite email:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}

/**
 * Send bulk invite emails
 */
export async function sendBulkInviteEmails(
  recipients: string[],
  workspaceName: string,
  inviterName: string,
  inviteLink: string,
  message?: string,
  inviteTokens?: string[]
): Promise<BulkInviteResult> {
  const results: BulkInviteResult = {
    successful: [],
    failed: [],
    totalSent: 0,
    totalFailed: 0,
  }

  console.log(`📧 Starting bulk email send to ${recipients.length} recipients`)

  // Process emails in parallel with concurrency limit
  const concurrencyLimit = 5
  const chunks = []
  
  for (let i = 0; i < recipients.length; i += concurrencyLimit) {
    chunks.push(recipients.slice(i, i + concurrencyLimit))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (email, index) => {
      const inviteToken = inviteTokens?.[recipients.indexOf(email)]
      
      const result = await sendInviteEmail({
        to: email,
        workspaceName,
        inviterName,
        inviteLink: inviteToken ? `${inviteLink}/${inviteToken}` : inviteLink,
        message,
        inviteToken: inviteToken || ''
      })

      if (result.success) {
        results.successful.push(email)
        results.totalSent++
      } else {
        results.failed.push({ 
          email, 
          error: result.error || 'Unknown error' 
        })
        results.totalFailed++
      }
    })

    await Promise.all(promises)
    
    // Small delay between chunks to avoid rate limiting
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`📊 Bulk email results:`, {
    totalSent: results.totalSent,
    totalFailed: results.totalFailed,
    successful: results.successful,
    failed: results.failed
  })

  return results
}

/**
 * Fallback simulation mode when Resend is not configured
 */
async function simulateEmailSend(data: InviteEmailData): Promise<{ success: boolean; messageId?: string }> {
  console.log('📧 SIMULANDO ENVIO DE EMAIL (Modo Desenvolvimento):')
  console.log('Para:', data.to)
  console.log('Workspace:', data.workspaceName)
  console.log('Convidado por:', data.inviterName)
  console.log('Link:', data.inviteLink)
  console.log('Token:', data.inviteToken)
  console.log('Mensagem:', data.message || 'Nenhuma mensagem')
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const mockMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log('✅ Email simulado enviado com sucesso!')
  console.log('📧 Em produção, o email seria enviado com template HTML completo')
  
  return { 
    success: true, 
    messageId: mockMessageId 
  }
}

/**
 * Verify email configuration
 */
export function verifyEmailConfig(): { configured: boolean; provider: string; issues: string[] } {
  const issues: string[] = []
  
  if (!process.env.RESEND_API_KEY) {
    issues.push('RESEND_API_KEY environment variable not set')
  }
  
  return {
    configured: issues.length === 0,
    provider: 'resend',
    issues
  }
}

/**
 * Get email service status
 */
export async function getEmailServiceStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'error'
  provider: string
  configured: boolean
  lastCheck: string
  issues?: string[]
}> {
  const config = verifyEmailConfig()
  
  if (!config.configured) {
    return {
      status: 'error',
      provider: 'resend',
      configured: false,
      lastCheck: new Date().toISOString(),
      issues: config.issues
    }
  }

  try {
    // Test API connectivity
    const { data, error } = await resend.emails.send({
      from: 'Studio <noreply@we.marketing>',
      to: ['test@example.com'],
      subject: 'Test Email',
      html: '<p>Test</p>',
      text: 'Test'
    })

    if (error) {
      return {
        status: 'degraded',
        provider: 'resend',
        configured: true,
        lastCheck: new Date().toISOString(),
        issues: [error.message]
      }
    }

    return {
      status: 'healthy',
      provider: 'resend',
      configured: true,
      lastCheck: new Date().toISOString()
    }

  } catch (error: any) {
    return {
      status: 'error',
      provider: 'resend',
      configured: true,
      lastCheck: new Date().toISOString(),
      issues: [error.message]
    }
  }
}