/**
 * 🔮 Magic Link Authentication Service
 * Handles passwordless authentication using Supabase magic links
 */

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface MagicLinkResponse {
  success: boolean
  message: string
  error?: string
}

export interface ProfileData {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export class MagicLinkService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Enviar magic link para o email do usuário
   */
  async sendMagicLink(email: string): Promise<MagicLinkResponse> {
    try {
      console.log('🔮 Sending magic link to:', email)

      // Validar email
      if (!email || !this.isValidEmail(email)) {
        return {
          success: false,
          message: 'Por favor, insira um email válido',
          error: 'INVALID_EMAIL'
        }
      }

      // Obter URL do site
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const redirectTo = `${siteUrl}/auth/callback`

      console.log('🔮 Redirect URL:', redirectTo)

      // Enviar magic link via Supabase
      const { data, error } = await this.supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true, // Criar usuário se não existir
        }
      })

      if (error) {
        console.error('❌ Error sending magic link:', error)
        return {
          success: false,
          message: this.getErrorMessage(error.message),
          error: error.message
        }
      }

      console.log('✅ Magic link sent successfully')

      return {
        success: true,
        message: 'Verifique seu email! Enviamos um link de acesso.'
      }
    } catch (error: any) {
      console.error('❌ Unexpected error:', error)
      return {
        success: false,
        message: 'Erro ao enviar link. Tente novamente.',
        error: error.message
      }
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()

      if (error) {
        console.error('❌ Error getting current user:', error)
        return null
      }

      return user
    } catch (error) {
      console.error('❌ Unexpected error getting user:', error)
      return null
    }
  }

  /**
   * Obter perfil do usuário
   */
  async getUserProfile(userId: string): Promise<ProfileData | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Error getting profile:', error)
        return null
      }

      return data as ProfileData
    } catch (error) {
      console.error('❌ Unexpected error getting profile:', error)
      return null
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<Omit<ProfileData, 'id' | 'email' | 'created_at' | 'updated_at'>>
  ): Promise<ProfileData | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating profile:', error)
        return null
      }

      return data as ProfileData
    } catch (error) {
      console.error('❌ Unexpected error updating profile:', error)
      return null
    }
  }

  /**
   * Fazer logout
   */
  async signOut(): Promise<MagicLinkResponse> {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        console.error('❌ Error signing out:', error)
        return {
          success: false,
          message: 'Erro ao fazer logout',
          error: error.message
        }
      }

      return {
        success: true,
        message: 'Logout realizado com sucesso'
      }
    } catch (error: any) {
      console.error('❌ Unexpected error signing out:', error)
      return {
        success: false,
        message: 'Erro ao fazer logout',
        error: error.message
      }
    }
  }

  /**
   * Verificar se email é válido
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Obter mensagem de erro amigável
   */
  private getErrorMessage(errorMessage: string): string {
    const errorMessages: Record<string, string> = {
      'Invalid email': 'Email inválido',
      'Email not confirmed': 'Email não confirmado',
      'Invalid login credentials': 'Credenciais inválidas',
      'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
      'User not found': 'Usuário não encontrado',
      'Invalid refresh token': 'Sessão expirada. Faça login novamente.',
    }

    // Procurar mensagem correspondente
    for (const [key, value] of Object.entries(errorMessages)) {
      if (errorMessage.includes(key)) {
        return value
      }
    }

    return 'Erro ao processar sua solicitação. Tente novamente.'
  }

  /**
   * Verificar se sessão está ativa
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user !== null
  }

  /**
   * Obter sessão atual
   */
  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()

      if (error) {
        console.error('❌ Error getting session:', error)
        return null
      }

      return session
    } catch (error) {
      console.error('❌ Unexpected error getting session:', error)
      return null
    }
  }

  /**
   * Listener para mudanças de autenticação
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔮 Auth state changed:', event)
      callback(session?.user || null)
    })
  }
}

// Singleton instance
let magicLinkServiceInstance: MagicLinkService | null = null

export function getMagicLinkService(): MagicLinkService {
  if (!magicLinkServiceInstance) {
    magicLinkServiceInstance = new MagicLinkService()
  }
  return magicLinkServiceInstance
}

