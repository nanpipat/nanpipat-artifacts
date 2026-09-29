# nanpipat-artifacts

**Artifacts** — บทความ คอร์ส และสไลด์ ของ [Nanpipat Klinpratoom](https://nanpipat.top) อยู่ที่ subdomain `artifacts.nanpipat.top`

สร้างด้วย Next.js (Pages Router) + Chakra UI v3 + TypeScript deploy บน Vercel

## เพิ่มเนื้อหา

### เพิ่มบทความ

สร้างไฟล์ `content/articles/<YYYY-MM-DD-slug>.md`:

```markdown
---
title: "ชื่อบทความ"
date: "2026-01-22"
tags: ["go", "backend"]
source_url: "https://medium.com/..."   # (optional) ถ้าเป็นบทความจาก Medium
---

เนื้อหา markdown ...
```

ไฟล์จะขึ้นหน้าเว็บอัตโนมัติหลัง build (เรียงตามวันที่)

### เพิ่มคอร์ส

1. สร้างโฟลเดอร์ `content/courses/<slug>/course.md`:

```markdown
---
title: "ชื่อคอร์ส"
level: "Workshop"          # (optional) เช่น Workshop, 2-day course
tags: ["ai", "devops"]
updated: "2026-09-29"
summary: "สรุปสั้น ๆ แสดงบนการ์ดคอร์ส"
---

เนื้อหา overview แบบ markdown (แสดงเป็นบทความแนะนำคอร์ส)
```

2. ใส่ไฟล์สไลด์ HTML ลง `public/decks/<slug>/` — ทุกไฟล์ `.html` จะกลายเป็น deck ที่พรีวิวได้ในหน้าคอร์ส + เปิดเต็มจอ + โหลดได้ (ถ้า deck มีรูป ใส่โฟลเดอร์ `assets/` ไว้ข้างไฟล์ deck แล้วอ้างแบบ relative path ตามปกติ)

3. ใส่ไฟล์แจก (pdf/pptx/zip ฯลฯ) ลง `public/materials/<slug>/` — จะขึ้นเป็นรายการดาวน์โหลดพร้อมขนาดไฟล์อัตโนมัติ

## โครงสร้าง

- `content/` — markdown content (articles + course overviews)
- `public/decks/` — HTML slide decks (serve ตรงจาก public)
- `public/materials/` — ไฟล์ดาวน์โหลด
- `src/lib/content.ts` — ตัวอ่าน content ทั้งหมด (scan ที่ build time, SSG)
- `src/pages/` — pages router

## สั่งรัน

```bash
npm install
npm run dev     # dev server
npm run build   # production build
```
