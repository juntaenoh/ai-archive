export type WorkMeta = {
  slug: string
  title: string
  date: string
  summary: string
  category: 'planning' | 'design' | 'development' | 'full-stack'
  aiTools: string[]
  tags: string[]
  thumbnail?: string
  links?: {
    github?: string
    live?: string
    figma?: string
  }
}
