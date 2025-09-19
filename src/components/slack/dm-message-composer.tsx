'use client'

import React, { useState, useRef } from 'react'
import { Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface DMMessageComposerProps {
  onSendMessageAction: (content: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function DMMessageComposer({ 
  onSendMessageAction, 
  placeholder = "Digite uma mensagem...",
  disabled = false 
}: DMMessageComposerProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim()) {
      return
    }

    const messageContent = text.trim()
    setText('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    
    await onSendMessageAction(messageContent)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setText(value)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div className="border-t border-border bg-background p-4">
      <form onSubmit={handleSendMessage} className="flex gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[44px] max-h-32 resize-none pr-12"
            disabled={disabled}
          />
        </div>
        
        <Button
          type="submit"
          size="sm"
          disabled={!text.trim() || disabled}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}