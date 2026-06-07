import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { WorkMeta } from '@/types/work'

const WORKS_DIR = path.join(process.cwd(), 'content/works')

export function getAllWorkSlugs(): string[] {
  if (!fs.existsSync(WORKS_DIR)) return []
  return fs
    .readdirSync(WORKS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
}

export function getAllWorks(): WorkMeta[] {
  return getAllWorkSlugs()
    .map((slug) => getWorkMeta(slug))
    .filter((w): w is WorkMeta => w !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getWorkMeta(slug: string): WorkMeta | null {
  const filePath = path.join(WORKS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const { data } = matter(fs.readFileSync(filePath, 'utf8'))
  return { slug, ...data } as WorkMeta
}

export function getWorkContent(slug: string): { meta: WorkMeta; content: string } | null {
  const filePath = path.join(WORKS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const { data, content } = matter(fs.readFileSync(filePath, 'utf8'))
  return { meta: { slug, ...data } as WorkMeta, content }
}
