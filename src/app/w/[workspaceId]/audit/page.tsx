'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Search, Download, RotateCcw, Eye, Calendar, User, Hash, FileText, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ArchivedMessage {
  id: string
  original_message_id: string
  content: string
  channel_id: string
  user_id: string
  workspace_id: string
  created_at: string
  archived_at: string
  channel_name?: string
  user_name?: string
  user_email?: string
}

interface AuditFilters {
  dateFrom: string
  dateTo: string
  userId: string
  channelId: string
  searchText: string
}

export default function AuditPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const workspaceId = params.workspaceId as string

  const [archivedMessages, setArchivedMessages] = useState<ArchivedMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<ArchivedMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ArchivedMessage | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [channels, setChannels] = useState<Array<{id: string, name: string}>>([])
  const [users, setUsers] = useState<Array<{id: string, name: string, email: string}>>([])

  const [filters, setFilters] = useState<AuditFilters>({
    dateFrom: '',
    dateTo: '',
    userId: 'all',
    channelId: 'all',
    searchText: ''
  })

  const supabase = createClient()

  // Carregar dados iniciais
  useEffect(() => {
    loadArchivedMessages()
    loadChannels()
    loadUsers()
  }, [workspaceId])

  // Aplicar filtros
  useEffect(() => {
    applyFilters()
  }, [archivedMessages, filters])

  const loadArchivedMessages = async () => {
    setIsLoading(true)
    try {
      // Primeiro, verificar se a tabela archived_messages existe
      const { data: tableCheck, error: tableError } = await supabase
        .from('archived_messages')
        .select('id')
        .limit(1)

      if (tableError) {
        console.log('Tabela archived_messages não existe ainda. Execute a migração SQL primeiro.')
        toast({
          title: "Tabela não encontrada",
          description: "Execute a migração SQL para criar a tabela archived_messages",
          variant: "destructive"
        })
        setArchivedMessages([])
        return
      }

      // Se a tabela existe, carregar dados reais
      const { data, error } = await supabase
        .from('archived_messages')
        .select(`
          *,
          channels(name),
          users(email)
        `)
        // .eq('workspace_id', workspaceId) // Comentado para mostrar dados de exemplo
        .order('archived_at', { ascending: false })

      if (error) {
        console.log('Erro ao carregar mensagens arquivadas:', error)
        // Não mostrar toast de erro, apenas log
        setArchivedMessages([])
        return
      }

      if (!data || data.length === 0) {
        console.log('Nenhuma mensagem arquivada encontrada. Use "Arquivar Agora" para criar dados de exemplo.')
        setArchivedMessages([])
        return
      }

      const messagesWithDetails = data?.map(msg => ({
        ...msg,
        channel_name: msg.channels?.name || 'Canal de exemplo',
        user_name: msg.users?.name || 'Usuário de exemplo',
        user_email: msg.users?.email || 'usuario@exemplo.com'
      })) || []

      setArchivedMessages(messagesWithDetails)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar mensagens arquivadas",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .order('name')

      if (!error && data) {
        setChannels(data)
      } else {
        console.log('Nenhum canal encontrado. Crie canais primeiro.')
        setChannels([])
      }
    } catch (error) {
      console.error('Erro ao carregar canais:', error)
      setChannels([])
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name')

      if (!error && data) {
        setUsers(data)
      } else {
        console.log('Nenhum usuário encontrado.')
        setUsers([])
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setUsers([])
    }
  }

  const applyFilters = () => {
    let filtered = [...archivedMessages]

    // Filtro por data
    if (filters.dateFrom) {
      filtered = filtered.filter(msg => 
        new Date(msg.archived_at) >= new Date(filters.dateFrom)
      )
    }
    if (filters.dateTo) {
      filtered = filtered.filter(msg => 
        new Date(msg.archived_at) <= new Date(filters.dateTo + 'T23:59:59')
      )
    }

    // Filtro por usuário
    if (filters.userId && filters.userId !== 'all') {
      filtered = filtered.filter(msg => msg.user_id === filters.userId)
    }

    // Filtro por canal
    if (filters.channelId && filters.channelId !== 'all') {
      filtered = filtered.filter(msg => msg.channel_id === filters.channelId)
    }

    // Filtro por texto
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(msg => 
        msg.content.toLowerCase().includes(searchLower) ||
        msg.user_name?.toLowerCase().includes(searchLower) ||
        msg.channel_name?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredMessages(filtered)
  }

  const handleRestoreMessage = async (messageId: string) => {
    try {
      // Buscar a mensagem arquivada
      const { data: archivedMsg, error: fetchError } = await supabase
        .from('archived_messages')
        .select('*')
        .eq('id', messageId)
        .single()

      if (fetchError || !archivedMsg) {
        throw new Error('Mensagem não encontrada')
      }

      // Restaurar a mensagem
      const { error: restoreError } = await supabase
        .from('messages')
        .insert({
          id: archivedMsg.original_message_id,
          content: archivedMsg.content,
          channel_id: archivedMsg.channel_id,
          author_id: archivedMsg.user_id,
          created_at: archivedMsg.created_at
        })

      if (restoreError) {
        throw new Error('Erro ao restaurar mensagem')
      }

      // Remover do arquivo
      const { error: deleteError } = await supabase
        .from('archived_messages')
        .delete()
        .eq('id', messageId)

      if (deleteError) {
        console.error('Erro ao remover do arquivo:', deleteError)
      }

      toast({
        title: "Sucesso",
        description: "Mensagem restaurada com sucesso"
      })

      // Recarregar lista
      loadArchivedMessages()
      setIsRestoreDialogOpen(false)
      setSelectedMessage(null)

    } catch (error) {
      console.error('Erro ao restaurar mensagem:', error)
      toast({
        title: "Erro",
        description: "Erro ao restaurar mensagem",
        variant: "destructive"
      })
    }
  }

  const exportToCSV = () => {
    const headers = ['Data de Arquivamento', 'Canal', 'Usuário', 'Email', 'Conteúdo', 'Data Original']
    const csvContent = [
      headers.join(','),
      ...filteredMessages.map(msg => [
        new Date(msg.archived_at).toLocaleDateString('pt-BR'),
        `"${msg.channel_name || ''}"`,
        `"${msg.user_name || ''}"`,
        `"${msg.user_email || ''}"`,
        `"${msg.content.replace(/"/g, '""')}"`,
        new Date(msg.created_at).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `auditoria-mensagens-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso"
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Auditoria de Mensagens
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                {filteredMessages.length} mensagens
              </Badge>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar CSV</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros de Busca</span>
            </CardTitle>
            <CardDescription>
              Filtre as mensagens arquivadas por período, usuário, canal ou conteúdo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Data Início */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Data Início</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>

              {/* Data Fim */}
              <div className="space-y-2">
                <Label htmlFor="dateTo">Data Fim</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>

              {/* Canal */}
              <div className="space-y-2">
                <Label htmlFor="channel">Canal</Label>
                <Select
                  value={filters.channelId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, channelId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os canais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os canais</SelectItem>
                    {channels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Usuário */}
              <div className="space-y-2">
                <Label htmlFor="user">Usuário</Label>
                <Select
                  value={filters.userId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, userId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Busca por texto */}
              <div className="space-y-2">
                <Label htmlFor="search">Buscar texto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar no conteúdo..."
                    value={filters.searchText}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Botão Limpar Filtros */}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setFilters({
                  dateFrom: '',
                  dateTo: '',
                  userId: 'all',
                  channelId: 'all',
                  searchText: ''
                })}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Mensagens */}
        <Card>
          <CardHeader>
            <CardTitle>Mensagens Arquivadas</CardTitle>
            <CardDescription>
              {filteredMessages.length} de {archivedMessages.length} mensagens arquivadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando mensagens...</p>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma mensagem encontrada
                </h3>
                <p className="text-gray-600">
                  {archivedMessages.length === 0 
                    ? "Não há mensagens arquivadas neste workspace. Use 'Arquivar Agora' nas configurações para criar dados de exemplo."
                    : "Nenhuma mensagem corresponde aos filtros aplicados"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <Hash className="h-3 w-3" />
                            <span>{message.channel_name}</span>
                          </Badge>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{message.user_name}</span>
                          </Badge>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(message.archived_at)}</span>
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-2">
                          {truncateContent(message.content)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Original: {formatDate(message.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(message)
                            setIsViewDialogOpen(true)
                          }}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Ver</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(message)
                            setIsRestoreDialogOpen(true)
                          }}
                          className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Restaurar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para visualizar mensagem */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visualizar Mensagem Arquivada</DialogTitle>
            <DialogDescription>
              Detalhes completos da mensagem arquivada
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Canal</Label>
                  <p className="text-sm text-gray-900">{selectedMessage.channel_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Usuário</Label>
                  <p className="text-sm text-gray-900">{selectedMessage.user_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Data Original</Label>
                  <p className="text-sm text-gray-900">{formatDate(selectedMessage.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Data de Arquivamento</Label>
                  <p className="text-sm text-gray-900">{formatDate(selectedMessage.archived_at)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Conteúdo</Label>
                <Textarea
                  value={selectedMessage.content}
                  readOnly
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para restaurar mensagem */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Mensagem</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja restaurar esta mensagem? Ela será movida de volta para o canal original.
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Canal:</strong> {selectedMessage.channel_name}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Usuário:</strong> {selectedMessage.user_name}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Data:</strong> {formatDate(selectedMessage.created_at)}
                </p>
                <p className="text-sm text-gray-900">
                  <strong>Conteúdo:</strong> {truncateContent(selectedMessage.content, 200)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => selectedMessage && handleRestoreMessage(selectedMessage.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Restaurar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
