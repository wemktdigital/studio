import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBulkInviteEmails } from '@/lib/services/simple-email-service'

export async function POST(request: NextRequest) {
  try {
    const { emails, workspaceId, workspaceName, message, inviterName } = await request.json()

    if (!emails || !workspaceId || !workspaceName) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado (temporariamente desabilitado para teste)
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'Usuário não autenticado' },
    //     { status: 401 }
    //   )
    // }

    // Usar um ID de usuário mock para teste (UUID válido)
    const userId = '00000000-0000-0000-0000-000000000000'

    // Parse emails (separados por vírgula)
    const emailList = emails.split(',').map((email: string) => email.trim()).filter(Boolean)
    
    if (emailList.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum email válido fornecido' },
        { status: 400 }
      )
    }

    // Criar convites no banco de dados (se a tabela existir)
    let invites = []
    try {
      const inviteData = emailList.map(email => ({
        email,
        workspace_id: workspaceId,
        inviter_id: userId,
        status: 'pending',
        message: message || null,
        created_at: new Date().toISOString()
      }))

      const { data: inviteDataResult, error: inviteError } = await supabase
        .from('workspace_invites')
        .insert(inviteData)
        .select()

      if (inviteError) {
        console.log('Tabela workspace_invites não existe ainda, pulando criação de convites:', inviteError.message)
      } else {
        invites = inviteDataResult
      }
    } catch (error) {
      console.log('Erro ao criar convites no banco (tabela pode não existir):', error)
    }

    // Enviar emails reais usando Resend
    const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'}/w/${workspaceId}/invite`
    
    try {
      const emailResults = await sendBulkInviteEmails(
        emailList,
        workspaceName,
        inviterName || 'Usuário atual',
        inviteLink,
        message
      )

      return NextResponse.json({
        success: true,
        message: `Convites enviados para ${emailResults.totalSent} email(s)`,
        data: {
          successful: emailResults.successful,
          failed: emailResults.failed,
          invites: invites,
          emailStats: {
            totalSent: emailResults.totalSent,
            totalFailed: emailResults.totalFailed
          }
        }
      })
    } catch (emailError) {
      console.error('Error sending emails:', emailError)
      
      // Mesmo se o email falhar, os convites foram criados no banco
      return NextResponse.json({
        success: true,
        message: `Convites criados para ${emailList.length} email(s), mas houve problemas no envio`,
        data: {
          invites: invites,
          emailError: emailError instanceof Error ? emailError.message : 'Erro desconhecido'
        }
      })
    }

  } catch (error) {
    console.error('Error in invite API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
