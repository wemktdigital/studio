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

interface LinkMetadata {
  title?: string
  description?: string
  image?: string
  siteName?: string
  type?: string
}

export class LinkService {
  private linkPatterns = {
    youtube: /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    github: /github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/,
    githubGist: /gist\.github\.com\/([a-zA-Z0-9_-]+)/,
    image: /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i,
    document: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|md)(\?.*)?$/i,
    code: /(?:github\.com|gitlab\.com|bitbucket\.org|codepen\.io|jsfiddle\.net|replit\.com)/,
  }

  /**
   * Detectar tipo de link baseado na URL
   */
  detectLinkType(url: string): LinkPreview['type'] {
    console.log('🔗 LinkService.detectLinkType: Testing URL:', url);
    
    // ✅ TESTE DETALHADO: Verificar cada pattern
    const youtubeMatch = this.linkPatterns.youtube.test(url);
    const githubMatch = this.linkPatterns.github.test(url);
    const githubGistMatch = this.linkPatterns.githubGist.test(url);
    const imageMatch = this.linkPatterns.image.test(url);
    const documentMatch = this.linkPatterns.document.test(url);
    const codeMatch = this.linkPatterns.code.test(url);
    
    console.log('🔗 LinkService.detectLinkType: Pattern matches:', {
      youtube: youtubeMatch,
      github: githubMatch,
      githubGist: githubGistMatch,
      image: imageMatch,
      document: documentMatch,
      code: codeMatch
    });
    
    if (youtubeMatch) {
      console.log('🔗 LinkService.detectLinkType: YouTube link detected!');
      return 'youtube';
    }
    if (githubMatch) {
      console.log('🔗 LinkService.detectLinkType: GitHub link detected!');
      return 'github';
    }
    if (githubGistMatch) {
      console.log('🔗 LinkService.detectLinkType: GitHub Gist link detected!');
      return 'github';
    }
    if (imageMatch) {
      console.log('🔗 LinkService.detectLinkType: Image link detected!');
      return 'image';
    }
    if (documentMatch) {
      console.log('🔗 LinkService.detectLinkType: Document link detected!');
      return 'document';
    }
    if (codeMatch) {
      console.log('🔗 LinkService.detectLinkType: Code link detected!');
      return 'code';
    }
    
    console.log('🔗 LinkService.detectLinkType: Generic link detected');
    return 'generic';
  }

  /**
   * Extrair metadados de uma URL
   */
  async extractMetadata(url: string): Promise<LinkMetadata> {
    try {
      // ✅ Para desenvolvimento, vamos usar mock data
      // ✅ Em produção, você pode usar Open Graph scraping
      return this.getMockMetadata(url)
    } catch (error) {
      console.error('LinkService: Error extracting metadata:', error)
      return {}
    }
  }

  /**
   * Gerar preview completo de um link
   */
  async generatePreview(url: string): Promise<LinkPreview> {
    console.log('🔗 LinkService: Generating preview for:', url)
    
    const type = this.detectLinkType(url)
    const domain = this.extractDomain(url)
    const metadata = await this.extractMetadata(url)
    
    const preview: LinkPreview = {
      url,
      type,
      domain,
      title: metadata.title || this.generateDefaultTitle(url, type),
      description: metadata.description || this.generateDefaultDescription(url, type),
      thumbnail: metadata.image || this.generateDefaultThumbnail(url, type),
      metadata
    }
    
    console.log('🔗 LinkService: Generated preview:', preview)
    return preview
  }

  /**
   * Extrair domínio de uma URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return 'unknown'
    }
  }

  /**
   * Gerar título padrão baseado no tipo
   */
  private generateDefaultTitle(url: string, type: LinkPreview['type']): string {
    switch (type) {
      case 'youtube':
        return 'YouTube Video'
      case 'github':
        return 'GitHub Repository'
      case 'image':
        return 'Image'
      case 'document':
        return 'Document'
      case 'code':
        return 'Code Repository'
      default:
        return this.extractDomain(url)
    }
  }

  /**
   * Gerar descrição padrão baseado no tipo
   */
  private generateDefaultDescription(url: string, type: LinkPreview['type']): string {
    switch (type) {
      case 'youtube':
        return 'Watch this video on YouTube'
      case 'github':
        return 'View this repository on GitHub'
      case 'image':
        return 'View this image'
      case 'document':
        return 'Download or view this document'
      case 'code':
        return 'Explore this code repository'
      default:
        return `Visit ${this.extractDomain(url)}`
    }
  }

  /**
   * Gerar thumbnail padrão baseado no tipo
   */
  private generateDefaultThumbnail(url: string, type: LinkPreview['type']): string {
    switch (type) {
      case 'youtube':
        return 'https://via.placeholder.com/300x200/FF0000/FFFFFF?text=YouTube'
      case 'github':
        return 'https://via.placeholder.com/300x200/24292E/FFFFFF?text=GitHub'
      case 'image':
        return url // Usar a própria imagem como thumbnail
      case 'document':
        return 'https://via.placeholder.com/300x200/4285F4/FFFFFF?text=Document'
      case 'code':
        return 'https://via.placeholder.com/300x200/6C63FF/FFFFFF?text=Code'
      default:
        return 'https://via.placeholder.com/300x200/666666/FFFFFF?text=Link'
    }
  }

  /**
   * Mock metadata para desenvolvimento
   */
  private getMockMetadata(url: string): LinkMetadata {
    const type = this.detectLinkType(url)
    
    switch (type) {
      case 'youtube':
        return {
          title: 'Amazing YouTube Video',
          description: 'This is a fantastic video that you should definitely watch!',
          image: 'https://via.placeholder.com/300x200/FF0000/FFFFFF?text=YouTube+Video',
          siteName: 'YouTube',
          type: 'video'
        }
      case 'github':
        return {
          title: 'Awesome GitHub Repository',
          description: 'A really cool project with amazing features and clean code.',
          image: 'https://via.placeholder.com/300x200/24292E/FFFFFF?text=GitHub+Repo',
          siteName: 'GitHub',
          type: 'repository'
        }
      case 'image':
        return {
          title: 'Beautiful Image',
          description: 'A stunning image that captures the moment perfectly.',
          image: url,
          siteName: 'Image Host',
          type: 'image'
        }
      default:
        return {
          title: 'Interesting Link',
          description: 'This looks like an interesting resource worth checking out.',
          image: 'https://via.placeholder.com/300x200/666666/FFFFFF?text=Link',
          siteName: this.extractDomain(url),
          type: 'website'
        }
    }
  }

  /**
   * Validar se uma URL é válida
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Extrair URLs de um texto
   */
  extractUrls(text: string): string[] {
    console.log('🔗 LinkService.extractUrls: Extracting URLs from text:', text);
    
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = text.match(urlRegex) || []
    
    console.log('🔗 LinkService.extractUrls: Found URLs:', urls);
    return urls
  }
}

export const linkService = new LinkService()
