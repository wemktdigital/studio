import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Message = Database['public']['Tables']['messages']['Row']
type Channel = Database['public']['Tables']['channels']['Row']

export interface SearchResult {
  message: Message & {
    channel: Pick<Channel, 'id' | 'name' | 'workspace_id'>
    author: {
      id: string
      display_name: string | null
      handle: string | null
      avatar_url: string | null
    }
  }
  relevance: number
}

export class SearchService {
  private supabase = createClient()

  /**
   * Search messages across all channels in a workspace
   */
  async searchMessages(
    workspaceId: string,
    query: string,
    options: {
      channelId?: string
      authorId?: string
      dateFrom?: Date
      dateTo?: Date
      limit?: number
      offset?: number
    } = {}
  ): Promise<SearchResult[]> {
    const {
      channelId,
      authorId,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0
    } = options

    console.log(`🔍 SearchService: Searching for "${query}" in workspace ${workspaceId}`)

    // Build the search query
    let searchQuery = this.supabase
      .from('messages')
      .select(`
        *,
        channel:channels!messages_channel_id_fkey(
          id,
          name,
          workspace_id
        ),
        author:users!messages_author_id_fkey(
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .textSearch('content', query, {
        type: 'websearch',
        config: 'english'
      })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by workspace (via channel)
    if (workspaceId) {
      searchQuery = searchQuery.eq('channels.workspace_id', workspaceId)
    }

    // Filter by specific channel
    if (channelId) {
      searchQuery = searchQuery.eq('channel_id', channelId)
    }

    // Filter by author
    if (authorId) {
      searchQuery = searchQuery.eq('author_id', authorId)
    }

    // Filter by date range
    if (dateFrom) {
      searchQuery = searchQuery.gte('created_at', dateFrom.toISOString())
    }
    if (dateTo) {
      searchQuery = searchQuery.lte('created_at', dateTo.toISOString())
    }

    const { data, error } = await searchQuery

    if (error) {
      console.error('🔍 SearchService: Search error:', error)
      throw error
    }

    console.log(`🔍 SearchService: Found ${data?.length || 0} results`)

    // Transform results and add relevance scoring
    const results: SearchResult[] = (data || []).map((item) => ({
      message: item as SearchResult['message'],
      relevance: this.calculateRelevance(query, item.content)
    }))

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance)
  }

  /**
   * Search messages in a specific channel
   */
  async searchChannelMessages(
    channelId: string,
    query: string,
    options: {
      authorId?: string
      dateFrom?: Date
      dateTo?: Date
      limit?: number
      offset?: number
    } = {}
  ): Promise<SearchResult[]> {
    return this.searchMessages('', query, { ...options, channelId })
  }

  /**
   * Get search suggestions based on recent messages
   */
  async getSearchSuggestions(
    workspaceId: string,
    partialQuery: string,
    limit: number = 5
  ): Promise<string[]> {
    if (partialQuery.length < 2) return []

    try {
      // For now, just get suggestions from all messages
      // We can improve this later by filtering by workspace via channel_id
      const { data, error } = await this.supabase
        .from('messages')
        .select('content')
        .ilike('content', `%${partialQuery}%`)
        .order('created_at', { ascending: false })
        .limit(limit * 2) // Get more to filter better

      if (error) {
        console.error('🔍 SearchService: Suggestions error:', error)
        return []
      }

      // Extract unique suggestions
      const suggestions = new Set<string>()
      data?.forEach((item) => {
        if (item.content) {
          const words = item.content.toLowerCase().split(/\s+/)
          words.forEach((word) => {
            if (word.includes(partialQuery.toLowerCase()) && word.length > 2) {
              suggestions.add(word)
            }
          })
        }
      })

      return Array.from(suggestions).slice(0, limit)
    } catch (error) {
      console.error('🔍 SearchService: Suggestions error:', error)
      return []
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevance(query: string, content: string): number {
    const queryLower = query.toLowerCase()
    const contentLower = content.toLowerCase()
    
    let score = 0
    
    // Exact match gets highest score
    if (contentLower.includes(queryLower)) {
      score += 100
    }
    
    // Word boundary matches
    const queryWords = queryLower.split(/\s+/)
    queryWords.forEach((word) => {
      if (word.length > 2) {
        const regex = new RegExp(`\\b${word}`, 'gi')
        const matches = contentLower.match(regex)
        if (matches) {
          score += matches.length * 10
        }
      }
    })
    
    // Proximity bonus (words close together)
    if (queryWords.length > 1) {
      const allWordsPresent = queryWords.every(word => 
        word.length <= 2 || contentLower.includes(word)
      )
      if (allWordsPresent) {
        score += 50
      }
    }
    
    return score
  }
}

export const searchService = new SearchService()
