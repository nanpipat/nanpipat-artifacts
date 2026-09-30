import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const SITE_URL = 'https://artifacts.nanpipat.top'
const ROOT = process.cwd()

function listMarkdown(dir) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) return []
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(full, f), 'utf8')
      const { data } = matter(raw)
      const date = String(data.date ?? data.published ?? data.updated ?? '')
      return { file: f, date: date.slice(0, 10) }
    })
}

const articles = listMarkdown('content/articles')
const courseFiles = listMarkdown('content/courses') // placeholder, courses listed by folder below
const courses = fs
  .readdirSync(path.join(ROOT, 'content', 'courses'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .filter((d) =>
    fs.existsSync(path.join(ROOT, 'content', 'courses', d.name, 'course.md'))
  )
  .map((d) => {
    const raw = fs.readFileSync(
      path.join(ROOT, 'content', 'courses', d.name, 'course.md'),
      'utf8'
    )
    const { data } = matter(raw)
    return { slug: d.name, date: String(data.updated ?? '').slice(0, 10) }
  })

const urls = [
  { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${SITE_URL}/articles`, changefreq: 'weekly', priority: '0.9' },
  { loc: `${SITE_URL}/courses`, changefreq: 'weekly', priority: '0.9' },
  ...articles.map((a) => ({
    loc: `${SITE_URL}/articles/${a.file.replace(/\.md$/, '')}`,
    lastmod: a.date || undefined,
    changefreq: 'monthly',
    priority: '0.8',
  })),
  ...courses.map((c) => ({
    loc: `${SITE_URL}/courses/${c.slug}`,
    lastmod: c.date || undefined,
    changefreq: 'monthly',
    priority: '0.8',
  })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${
      u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
    }
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), xml)
console.log(`sitemap.xml generated with ${urls.length} urls`)
