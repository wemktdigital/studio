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
    // Para demonstração, vamos simular o envio de email
    console.log('📧 SIMULANDO ENVIO DE EMAIL:')
    console.log('Para:', to)
    console.log('Workspace:', workspaceName)
    console.log('Convidado por:', inviterName)
    console.log('Link:', inviteLink)
    console.log('Mensagem:', message || 'Nenhuma mensagem')
    
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simular sucesso
    const mockMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('✅ Email simulado enviado com sucesso!')
    console.log('📧 Em produção, o email seria enviado com o seguinte conteúdo:')
    console.log('---')
    console.log(`Assunto: Convite para o workspace ${workspaceName}`)
    console.log(`De: Studio <noreply@studio.com>`)
    console.log(`Para: ${to}`)
    console.log(`Conteúdo: ${inviterName} convidou você para participar do workspace "${workspaceName}"`)
    console.log(`Link: ${inviteLink}`)
    console.log('---')
    
    return { success: true, messageId: mockMessageId }
  } catch (error) {
    console.error('Error in sendInviteEmail:', error)
    throw error
  }
}

// Função para enviar múltiplos emails
export async function sendBulkInviteEmails(
  recipients: string[],
  workspaceName: string,
  inviterName: string,
  inviteLink: string,
  message?: string
) {
  const results = {
    successful: [] as string[],
    failed: [] as { email: string; error: string }[],
    totalSent: 0,
    totalFailed: 0,
  };

  for (const email of recipients) {
    try {
      await sendInviteEmail({
        to: email,
        workspaceName,
        inviterName,
        inviteLink,
        message
      });
      results.successful.push(email);
      results.totalSent++;
    } catch (error: any) {
      results.failed.push({ email, error: error.message });
      results.totalFailed++;
      console.error(`Failed to send invite email to ${email}:`, error);
    }
  }
  
  return results;
}
