import React from 'react'
import { ExternalLink, Play, Code, FileText, Image, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

// ✅ TIPOS INLINE para evitar problemas de importação
interface LinkPreview {
  url: string
  type: 'youtube' | 'github' | 'image' | 'document' | 'code' | 'generic'
  title?: string
  description?: string
  thumbnail?: string
  domain: string
  metadata?: Record<string, any>
}

interface LinkPreviewProps {
  preview: LinkPreview
  className?: string
}

const LinkPreviewComponent: React.FC<LinkPreviewProps> = ({ preview, className }) => {
  const getIcon = (type: LinkPreview['type']) => {
    switch (type) {
      case 'youtube':
        return <Play className="h-4 w-4" />
      case 'github':
      case 'code':
        return <Code className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: LinkPreview['type']) => {
    switch (type) {
      case 'youtube':
        return 'border-red-200 bg-red-50 hover:bg-red-100'
      case 'github':
      case 'code':
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100'
      case 'document':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100'
      case 'image':
        return 'border-green-200 bg-green-50 hover:bg-green-100'
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100'
    }
  }

  const handleClick = () => {
    window.open(preview.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={cn(
        'group cursor-pointer rounded-lg border p-3 transition-all duration-200',
        getTypeColor(preview.type),
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <div className="relative h-16 w-24 overflow-hidden rounded-md bg-gray-100">
            {preview.thumbnail && (
              <img
                src={preview.thumbnail}
                alt={preview.title || 'Link preview'}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              {getIcon(preview.type)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {preview.type}
            </span>
            <span className="text-xs text-gray-500">
              {preview.domain}
            </span>
          </div>
          
          {preview.title && (
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
              {preview.title}
            </h4>
          )}
          
          {preview.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {preview.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{preview.url}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LinkPreviewComponent
