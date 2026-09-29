import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const ROOT = process.cwd()
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles')
const COURSES_DIR = path.join(ROOT, 'content', 'courses')
const DECKS_DIR = path.join(ROOT, 'public', 'decks')
const MATERIALS_DIR = path.join(ROOT, 'public', 'materials')

export interface Article {
  slug: string
  title: string
  date: string
  tags: string[]
  excerpt: string
  sourceUrl?: string
}

export interface Deck {
  /** file name without extension, used as url param */
  id: string
  file: string
  /** public url of the deck html */
  url: string
  title: string
  slides: number
}

export interface Material {
  file: string
  label: string
  url: string
  size: string
}

export interface Course {
  slug: string
  title: string
  level?: string
  summary: string
  tags: string[]
  updated?: string
  decks: Deck[]
  materials: Material[]
}

export interface CourseWithContent extends Course {
  html: string
}

function firstParagraph(markdown: string): string {
  const lines = markdown.split('\n')
  let buf: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      if (buf.length) break
      continue
    }
    if (t.startsWith('#') || t.startsWith('---') || t.startsWith('![')) {
      if (buf.length) break
      continue
    }
    buf.push(t)
    if (buf.join(' ').length > 220) break
  }
  return buf
    .join(' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

export function getAllArticles(): Article[] {
  if (!fs.existsSync(ARTICLES_DIR)) return []
  const articles = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8')
      const { data, content } = matter(raw)
      const slug = file.replace(/\.md$/, '')
      return {
        slug,
        title: String(data.title ?? slug),
        date: String(data.date ?? data.published ?? ''),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        excerpt: String(data.excerpt ?? firstParagraph(content)),
        sourceUrl: data.source_url ? String(data.source_url) : undefined,
      } as Article
    })
    .sort((a, b) => b.date.localeCompare(a.date))
  return articles
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function scanDecks(slug: string): Deck[] {
  const dir = path.join(DECKS_DIR, slug)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8')
      const titleMatch = raw.match(/<title>([^<]*)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.html$/, '')
      const slides = (raw.match(/<section class="slide[^"]*"/g) ?? []).length
      return {
        id: file.replace(/\.html$/, ''),
        file,
        url: `/decks/${slug}/${file}`,
        title,
        slides,
      }
    })
}

function scanMaterials(slug: string): Material[] {
  const dir = path.join(MATERIALS_DIR, slug)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith('.'))
    .map((file) => ({
      file,
      label: file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      url: `/materials/${slug}/${encodeURIComponent(file)}`,
      size: humanSize(fs.statSync(path.join(dir, file)).size),
    }))
}

export function getAllCourses(): Course[] {
  if (!fs.existsSync(COURSES_DIR)) return []
  const courses = fs
    .readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const courseFile = path.join(COURSES_DIR, d.name, 'course.md')
      if (!fs.existsSync(courseFile)) return null
      const raw = fs.readFileSync(courseFile, 'utf8')
      const { data } = matter(raw)
      return {
        slug: d.name,
        title: String(data.title ?? d.name),
        level: data.level ? String(data.level) : undefined,
        summary: String(data.summary ?? ''),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        updated: data.updated ? String(data.updated) : undefined,
        decks: scanDecks(d.name),
        materials: scanMaterials(d.name),
      } as Course
    })
    .filter((c): c is Course => c !== null)
    .sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? ''))
  return courses
}

export function getAllCourseSlugs(): string[] {
  if (!fs.existsSync(COURSES_DIR)) return []
  return fs
    .readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => fs.existsSync(path.join(COURSES_DIR, d.name, 'course.md')))
    .map((d) => d.name)
}

export async function getCourse(slug: string): Promise<CourseWithContent | null> {
  const courseFile = path.join(COURSES_DIR, slug, 'course.md')
  if (!fs.existsSync(courseFile)) return null
  const raw = fs.readFileSync(courseFile, 'utf8')
  const { data, content } = matter(raw)
  const { remark } = await import('remark')
  const { default: gfm } = await import('remark-gfm')
  const { default: html } = await import('remark-html')
  const processed = await remark().use(gfm).use(html).process(content)
  return {
    slug,
    title: String(data.title ?? slug),
    level: data.level ? String(data.level) : undefined,
    summary: String(data.summary ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    updated: data.updated ? String(data.updated) : undefined,
    decks: scanDecks(slug),
    materials: scanMaterials(slug),
    html: processed.toString(),
  }
}

export async function getArticle(slug: string): Promise<{ article: Article; html: string } | null> {
  const file = path.join(ARTICLES_DIR, `${slug}.md`)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, 'utf8')
  const { data, content } = matter(raw)
  const { remark } = await import('remark')
  const { default: gfm } = await import('remark-gfm')
  const { default: html } = await import('remark-html')
  const processed = await remark().use(gfm).use(html).process(content)
  const article: Article = {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? data.published ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    excerpt: String(data.excerpt ?? firstParagraph(content)),
    sourceUrl: data.source_url ? String(data.source_url) : undefined,
  }
  return { article, html: processed.toString() }
}
