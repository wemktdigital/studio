'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchService, SearchResult } from '@/lib/services/search-service'
import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

export interface SearchOptions {
  channelId?: string
  authorId?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
}

export function useSearch(workspaceId: string) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<SearchOptions>({})
  const [isSearching, setIsSearching] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)
  const queryClient = useQueryClient()

  // Search results
  const {
    data: searchResults = [],
    isLoading: isLoadingResults,
    error: searchError,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ['search', workspaceId, debouncedQuery, options],
    queryFn: () => searchService.searchMessages(workspaceId, debouncedQuery, options),
    enabled: !!debouncedQuery && debouncedQuery.length >= 2 && !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Search suggestions
  const {
    data: suggestions = [],
    isLoading: isLoadingSuggestions
  } = useQuery({
    queryKey: ['search-suggestions', workspaceId, debouncedQuery],
    queryFn: () => searchService.getSearchSuggestions(workspaceId, debouncedQuery),
    enabled: !!debouncedQuery && debouncedQuery.length >= 2 && !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Search in specific channel
  const searchInChannel = useMutation({
    mutationFn: ({ channelId, query }: { channelId: string; query: string }) =>
      searchService.searchChannelMessages(channelId, query, options),
    onSuccess: (results) => {
      // Update the search results cache
      queryClient.setQueryData(['search', workspaceId, query, { ...options, channelId }], results)
    },
  })

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('')
    setOptions({})
    queryClient.removeQueries({ queryKey: ['search', workspaceId] })
  }, [workspaceId, queryClient])

  // Update search options
  const updateSearchOptions = useCallback((newOptions: Partial<SearchOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }))
  }, [])

  // Perform search
  const performSearch = useCallback(async (searchQuery: string, searchOptions?: SearchOptions) => {
    setIsSearching(true)
    try {
      const results = await searchService.searchMessages(
        workspaceId,
        searchQuery,
        searchOptions || options
      )
      return results
    } finally {
      setIsSearching(false)
    }
  }, [workspaceId, options])

  // Effect to track search state
  useEffect(() => {
    setIsSearching(isLoadingResults)
  }, [isLoadingResults])

  return {
    // State
    query,
    setQuery,
    options,
    isSearching,
    
    // Results
    searchResults,
    isLoadingResults,
    searchError,
    
    // Suggestions
    suggestions,
    isLoadingSuggestions,
    
    // Actions
    performSearch,
    searchInChannel,
    clearSearch,
    updateSearchOptions,
    refetchSearch,
    
    // Computed
    hasResults: searchResults.length > 0,
    totalResults: searchResults.length,
  }
}

// Hook for channel-specific search
export function useChannelSearch(channelId: string) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<Omit<SearchOptions, 'channelId'>>({})
  
  const debouncedQuery = useDebounce(query, 300)

  const {
    data: searchResults = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['channel-search', channelId, debouncedQuery, options],
    queryFn: () => searchService.searchChannelMessages(channelId, debouncedQuery, options),
    enabled: !!debouncedQuery && debouncedQuery.length >= 2 && !!channelId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const clearSearch = useCallback(() => {
    setQuery('')
    setOptions({})
  }, [])

  return {
    query,
    setQuery,
    options,
    setOptions,
    searchResults,
    isLoading,
    error,
    clearSearch,
    refetch,
    hasResults: searchResults.length > 0,
  }
}
