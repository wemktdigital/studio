import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Cliente admin para operações administrativas e banco (precisa service role)
// Usamos service role para garantir acesso completo nas API routes
const getSupabaseAdmin = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Gera um código numérico de 6 dígitos
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Envia código de recuperação de senha por email
 */
export async function sendPasswordResetCode(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Verificar se o email existe primeiro
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = users?.users.some(u => u.email?.toLowerCase() === email.toLowerCase()) || false
    
    // Gerar código de 6 dígitos
    const code = generateCode()

    // Salvar código no banco (expira em 15 minutos)
    // Por segurança, sempre salvamos o código mesmo se email não existir
    const { error: dbError } = await supabaseAdmin
      .from('password_reset_codes')
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos
        used: false
      })

    if (dbError) {
      console.error('Erro ao salvar código:', dbError)
      return { success: false, error: 'Erro ao gerar código de recuperação' }
    }
    
    // Se email não existe, não enviamos email mas retornamos sucesso (por segurança)
    if (!userExists) {
      console.log('Email não encontrado, mas código foi salvo (por segurança)')
      return { success: true }
    }

    // Enviar email com o código
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002'
    
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY não configurada')
      // Em desenvolvimento, apenas logar o código
      console.log('🔐 Código de recuperação (DEV):', code)
      return { success: true }
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Studio <onboarding@resend.dev>',
      to: [email],
      subject: 'Código de recuperação de senha',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Código de Recuperação</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Olá,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Você solicitou a recuperação de senha. Use o código abaixo para redefinir sua senha:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Este código expira em <strong>15 minutos</strong>.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Se você não solicitou esta recuperação, ignore este email.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #999; margin: 0;">Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Código de Recuperação de Senha\n\nSeu código é: ${code}\n\nEste código expira em 15 minutos.\n\nSe você não solicitou esta recuperação, ignore este email.`,
    })

    if (emailError) {
      console.error('Erro ao enviar email:', emailError)
      return { success: false, error: 'Erro ao enviar email' }
    }

    console.log('✅ Código de recuperação enviado para:', email)
    return { success: true }
  } catch (error: any) {
    console.error('Erro no sendPasswordResetCode:', error)
    return { success: false, error: error.message || 'Erro ao processar solicitação' }
  }
}

/**
 * Valida código de recuperação (sem marcar como usado ainda)
 */
export async function validateResetCode(email: string, code: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    const { data, error } = await supabaseAdmin
      .from('password_reset_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .limit(1)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Código inválido ou expirado' }
    }

    // Não marca como usado ainda - será marcado quando a senha for redefinida
    return { valid: true }
  } catch (error: any) {
    console.error('Erro ao validar código:', error)
    return { valid: false, error: 'Erro ao validar código' }
  }
}

/**
 * Redefine senha após validação do código
 */
export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Primeiro validar o código
    const validation = await validateResetCode(email, code)
    
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Código inválido' }
    }

    // Usar Admin API para redefinir senha (precisa de service role key)
    const supabaseAdmin = getSupabaseAdmin()

    // Buscar usuário pelo email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (userError) {
      return { success: false, error: 'Erro ao buscar usuário' }
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado' }
    }

    // Redefinir senha
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    })

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Marcar código como usado após redefinir senha com sucesso
    await supabaseAdmin
      .from('password_reset_codes')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('code', code)

    console.log('✅ Senha redefinida com sucesso para:', email)
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error)
    return { success: false, error: error.message || 'Erro ao redefinir senha' }
  }
}

