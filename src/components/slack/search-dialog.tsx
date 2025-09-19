'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Search, X, Calendar, User, Hash, MessageSquare, Clock } from 'lucide-react'
import { useSearch, SearchOptions } from '@/hooks/use-search'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { UserAvatar } from './user-avatar'
import { useRouter } from 'next/navigation'
import { SearchResult } from '@/lib/services/search-service'

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  currentChannelId?: string
}

export function SearchDialog({ isOpen, onClose, workspaceId, currentChannelId }: SearchDialogProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchOptions>({
    channelId: currentChannelId,
    limit: 50
  })
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  const {
    query,
    setQuery,
    searchResults,
    isLoadingResults,
    suggestions,
    isLoadingSuggestions,
    hasResults,
    totalResults,
    updateSearchOptions,
    clearSearch
  } = useSearch(workspaceId)

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Update filters when currentChannelId changes
  useEffect(() => {
    if (currentChannelId) {
      updateSearchOptions({ channelId: currentChannelId })
    }
  }, [currentChannelId, updateSearchOptions])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    updateSearchOptions(filters)
  }

  const handleClearSearch = () => {
    clearSearch()
    setFilters({ channelId: currentChannelId, limit: 50 })
    setShowFilters(false)
  }

  const handleFilterChange = (key: keyof SearchOptions, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateSearchOptions(newFilters)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    searchInputRef.current?.focus()
  }

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the channel where the message was found
    if (result.message.channel?.id) {
      const channelUrl = `/w/${workspaceId}/c/${result.message.channel.id}`
      console.log('Navigate to:', channelUrl)
      router.push(channelUrl)
      onClose()
    } else {
      console.error('Channel ID not found in search result:', result)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Mensagens
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Buscar mensagens, usuários, ou palavras-chave..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs"
          >
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>
          
          {hasResults && (
            <span className="text-sm text-muted-foreground">
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Canal</label>
                <Input
                  placeholder="ID do canal"
                  value={filters.channelId || ''}
                  onChange={(e) => handleFilterChange('channelId', e.target.value || undefined)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Usuário</label>
                <Input
                  placeholder="ID do usuário"
                  value={filters.authorId || ''}
                  onChange={(e) => handleFilterChange('authorId', e.target.value || undefined)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">De</label>
                <Input
                  type="date"
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Até</label>
                <Input
                  type="date"
                  onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        <ScrollArea className="flex-1 min-h-0">
          {isLoadingResults ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : hasResults ? (
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.message.id}-${index}`}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      user={{
                        id: result.message.author.id,
                        displayName: result.message.author.display_name || result.message.author.handle || 'Usuário',
                        handle: result.message.author.handle || '',
                        avatarUrl: result.message.author.avatar_url || '',
                        status: 'online' // Default status
                      }}
                      className="h-8 w-8"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {result.message.author.display_name || result.message.author.handle || 'Usuário'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          {result.message.channel.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(result.message.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {result.message.content}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Relevância: {result.relevance}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>ID: {result.message.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query && !isLoadingResults ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma mensagem encontrada para "{query}"</p>
              <p className="text-sm">Tente usar palavras diferentes ou ajustar os filtros</p>
            </div>
          ) : null}
        </ScrollArea>

        {/* Search Suggestions */}
        {query && suggestions.length > 0 && !hasResults && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Sugestões:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            Use aspas para busca exata • Ctrl+F para busca rápida
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
