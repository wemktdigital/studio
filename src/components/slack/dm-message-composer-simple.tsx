'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Paperclip, Mic, Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { User } from '@/lib/types'
import { useDMMessagesSimple } from '@/hooks/use-dm-messages-simple'
import { useAuthContext } from '@/components/providers/auth-provider'

interface DMMessageComposerSimpleProps {
  dmId: string
  userId: string
  workspaceId: string
}

export default function DMMessageComposerSimple({ dmId, userId, workspaceId }: DMMessageComposerSimpleProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { sendMessage, isSending } = useDMMessagesSimple(dmId)
  const { user } = useAuthContext()

  console.log('🚨🚨🚨 DMMessageComposerSimple: RENDERING! 🚨🚨🚨', { 
    dmId,
    userId,
    workspaceId,
    text,
    isSending,
    timestamp: new Date().toISOString()
  })

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!text.trim() || isSending) return

    console.log('🚨🚨🚨 DMMessageComposerSimple: SUBMITTING MESSAGE! 🚨🚨🚨', { 
      text: text.trim(),
      dmId,
      userId: user?.id
    })

    try {
      await sendMessage({ content: text.trim() })
      setText('')
      
      // Focus back to textarea
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    } catch (error) {
      console.error('🚨🚨🚨 DMMessageComposerSimple: ERROR SUBMITTING! 🚨🚨🚨', error)
    }
  }

  const handleFileUpload = () => {
    console.log('🚨🚨🚨 DMMessageComposerSimple: File upload clicked')
    // TODO: Implement file upload
  }

  const handleVoiceRecord = () => {
    console.log('🚨🚨🚨 DMMessageComposerSimple: Voice record clicked')
    // TODO: Implement voice recording
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        {/* File upload button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFileUpload}
          className="h-8 w-8 p-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Text input */}
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message @${userId}`}
            className="min-h-[40px] max-h-[120px] resize-none"
            disabled={isSending}
          />
        </div>

        {/* Voice record button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleVoiceRecord}
          className="h-8 w-8 p-0"
        >
          <Mic className="h-4 w-4" />
        </Button>

        {/* Send button */}
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isSending}
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
