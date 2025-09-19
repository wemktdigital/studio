interface SendInviteEmailProps {
  to: string
  workspaceName: string
  inviterName: string
  inviteLink: string
  message?: string
}

export async function sendInviteEmail({
  to,
  workspaceName,
  inviterName,
  inviteLink,
  message
}: SendInviteEmailProps) {
  try {
    // HTML simples sem dependências externas
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Studio</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Plataforma de comunicação moderna</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Você foi convidado!</h2>
          
          <p>Olá!</p>
          
          <p><strong>${inviterName}</strong> convidou você para participar do workspace <strong>"${workspaceName}"</strong> no Studio.</p>
          
          ${message ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-style: italic;">"${message}"</p>
          </div>` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold; 
                      display: inline-block;">
              Aceitar Convite
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Ou copie e cole este link no seu navegador:<br>
            <a href="${inviteLink}" style="color: #667eea; word-break: break-all;">${inviteLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            Este convite expira em 7 dias. Se você não tem uma conta no Studio, 
            será criada automaticamente quando você aceitar o convite.
          </p>
        </div>
      </div>
    `

    const textContent = `
      Você foi convidado para o workspace "${workspaceName}"
      
      ${inviterName} convidou você para participar do workspace "${workspaceName}" no Studio.
      
      ${message ? `Mensagem: "${message}"` : ''}
      
      Aceite o convite: ${inviteLink}
      
      Este convite expira em 7 dias.
    `

    // Usar fetch diretamente para evitar problemas com Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Studio <noreply@studio.com>',
        to: [to],
        subject: `Convite para o workspace ${workspaceName}`,
        html: htmlContent,
        text: textContent
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error sending email:', errorData)
      throw new Error(`Erro ao enviar email: ${errorData.message || 'Erro desconhecido'}`)
    }

    const data = await response.json()
    console.log('Email sent successfully:', data)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Error in sendInviteEmail:', error)
    throw error
  }
}

// Função para enviar múltiplos emails
export async function sendBulkInviteEmails(emails: string[], workspaceName: string, inviterName: string, inviteLink: string, message?: string) {
  const results = await Promise.allSettled(
    emails.map(email => 
      sendInviteEmail({
        to: email,
        workspaceName,
        inviterName,
        inviteLink,
        message
      })
    )
  )

  const successful = results
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<any>).value)

  const failed = results
    .filter(result => result.status === 'rejected')
    .map(result => (result as PromiseRejectedResult).reason)

  return {
    successful,
    failed,
    totalSent: successful.length,
    totalFailed: failed.length
  }
}
