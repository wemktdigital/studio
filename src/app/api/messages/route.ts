import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * 🔹 API ROUTE: Buscar mensagens de um canal
 * 
 * GET /api/messages?channelId=xxx
 * 
 * Retorna JSON com:
 * - Nome do autor
 * - Horário formatado
 * - Mensagem
 * - ID da conta
 * - Canal
 */
export async function GET(request: NextRequest) {
  try {
    // 🔹 BUSCAR PARÂMETROS: channelId da query string
    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🔍 API Messages: Buscando mensagens do canal:', channelId)

    const supabase = await createClient()

    // 🔹 BUSCAR MENSAGENS: Buscar mensagens simples primeiro
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, content, created_at, author_id, channel_id')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens:', messagesError)
      return NextResponse.json(
        { error: 'Erro ao buscar mensagens' },
        { status: 500 }
      )
    }

    // 🔹 BUSCAR DADOS ADICIONAIS: Buscar usuários e canais separadamente
    const authorIds = [...new Set(messages.map(m => m.author_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, username, handle')
      .in('id', authorIds)

    const { data: channel } = await supabase
      .from('channels')
      .select('id, name')
      .eq('id', channelId)
      .single()

    // 🔹 CRIAR MAPA: Para lookup rápido
    const usersMap = new Map(users?.map(u => [u.id, u]) || [])

    // 🔹 TRANSFORMAR: Formatar para o formato esperado
    const formattedMessages = messages.map(msg => {
      // 🔹 FORMATAR HORÁRIO: Converter ISO para formato brasileiro
      const hora = new Date(msg.created_at)
      const horarioFormatado = hora.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      const userData = usersMap.get(msg.author_id)

      return {
        Nome: userData?.display_name || userData?.username || 'Usuário',
        Horario: horarioFormatado,
        Mensagem: msg.content,
        IdConta: msg.author_id,
        Canal: channel?.name || 'geralzao'
      }
    })

    console.log('✅ API Messages: Retornando', formattedMessages.length, 'mensagens')

    return NextResponse.json({
      success: true,
      total: formattedMessages.length,
      messages: formattedMessages
    })

  } catch (error: any) {
    console.error('❌ Erro na API Messages:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    )
  }
}

/**
 * 🔹 API ROUTE: Enviar mensagem em um canal
 * 
 * POST /api/messages
 * Body: { channelId, content, authorId }
 * 
 * Retorna JSON com a mensagem enviada formatada
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelId, content, authorId } = body

    if (!channelId || !content || !authorId) {
      return NextResponse.json(
        { error: 'channelId, content e authorId são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('🔍 API Messages: Enviando mensagem:', { channelId, content, authorId })

    const supabase = await createClient()

    // 🔹 INSERIR MENSAGEM: Criar mensagem no banco
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        content,
        type: 'text',
        author_id: authorId,
        channel_id: channelId,
        dm_id: null
      })
      .select('id, content, created_at, author_id, channel_id')
      .single()

    if (insertError) {
      console.error('❌ Erro ao enviar mensagem:', insertError)
      return NextResponse.json(
        { error: 'Erro ao enviar mensagem' },
        { status: 500 }
      )
    }

    // 🔹 BUSCAR DADOS ADICIONAIS: Buscar usuário e canal
    const { data: user } = await supabase
      .from('users')
      .select('id, display_name, username, handle')
      .eq('id', authorId)
      .single()

    const { data: channel } = await supabase
      .from('channels')
      .select('id, name')
      .eq('id', channelId)
      .single()

    // 🔹 FORMATAR: Converter para o formato esperado
    const hora = new Date(message.created_at)
    const horarioFormatado = hora.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const formattedMessage = {
      Nome: user?.display_name || user?.username || 'Usuário',
      Horario: horarioFormatado,
      Mensagem: message.content,
      IdConta: message.author_id,
      Canal: channel?.name || 'Canal Desconhecido'
    }

    console.log('✅ API Messages: Mensagem enviada:', formattedMessage)

    return NextResponse.json({
      success: true,
      message: formattedMessage
    })

  } catch (error: any) {
    console.error('❌ Erro na API Messages POST:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    )
  }
}

