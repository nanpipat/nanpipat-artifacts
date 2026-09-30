---
title: "มาเล่าประสบการณ์: ใช้ Go + Python ทำ RAG"
author: "Nanpipat Klinpratoom"
published: "2026-02-21"
published_time: "2026-02-21T06:19:06Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%A1%E0%B8%B2%E0%B9%80%E0%B8%A5%E0%B9%88%E0%B8%B2%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%AA%E0%B8%9A%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%93%E0%B9%8C-%E0%B9%83%E0%B8%8A%E0%B9%89-go-python-%E0%B8%97%E0%B8%B3-rag-5ae8a8eafe4e"
medium_id: "5ae8a8eafe4e"
---

# มาเล่าประสบการณ์: ใช้ Go + Python ทำ RAG

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*DBgOaMz3MGGgd0i9)

ช่วงหนึ่งผมอยากทำ RAG แบบจริงจัง ไม่ใช่ Demo ที่โยน PDF หนึ่งไฟล์เข้าไปแล้วถามว่า “เอกสารนี้พูดถึงอะไร” ก่อนปรบมือให้ตัวเองสามที แต่เป็นระบบที่ต้องรับหลายโปรเจกต์ หลาย Repository และหลายชนิดไฟล์ ทั้ง Code, PDF, รูปภาพ และเอกสาร Office

แผนแรกฟังดูเรียบง่ายมาก:

> “เขียน Go ล้วนไปเลยสิ เราเป็น Gopher อยู่แล้ว ถถถ”

แล้วมันก็เวิร์กจริงครับ—อย่างน้อยในช่วงแรก

จนกระทั่งระบบเจอ PDF ที่เป็นภาพสแกน ตารางที่แตกเป็นเสี่ยง ๆ และ Screenshot ที่มีข้อความเอียงเหมือนถ่ายตอนกำลังวิ่ง จากโปรเจกต์ Go ล้วนที่เคยสะอาด ก็เริ่มมี Shell command, Binary ภายนอก และ Glue code งอกออกมาเหมือนสายไฟหลังโต๊ะคอม

สุดท้ายผมจึงเลือกใช้ **Go + Python ร่วมกัน** ให้แต่ละภาษารับงานที่ตัวเองถนัด บทความนี้คือประสบการณ์จากการตัดสินใจนั้น พร้อมบทเรียนที่สำคัญกว่าเรื่องภาษาเสียอีก: RAG ที่ดีไม่ได้จบตรง “เอาข้อความไปเก็บใน Vector Database” ครับ

## ก่อนอื่น RAG คืออะไร และมันไม่ได้มีเวทมนตร์ซ่อนอยู่

RAG ย่อมาจาก Retrieval-Augmented Generation แนวคิดคือก่อนให้ LLM ตอบ เราไปค้นข้อมูลที่เกี่ยวข้องจากฐานความรู้ แล้วแนบข้อมูลนั้นเข้าไปเป็น Context

ถ้าเปรียบ LLM เป็นเชฟ RAG ก็คือพนักงานวิ่งไปหยิบวัตถุดิบจากห้องเก็บของ เชฟยังเป็นคนปรุงคำตอบ แต่คุณภาพอาหารขึ้นอยู่กับว่าพนักงานหยิบของถูกชั้นหรือไม่ หยิบของหมดอายุหรือเปล่า และขนมาครบไหม

Pipeline แบบย่อมีสองฝั่ง:

```text
ฝั่งเตรียมข้อมูล
ไฟล์ → อ่านเนื้อหา → แบ่ง Chunk → สร้าง Embedding → เก็บลง Index

ฝั่งตอบคำถาม
คำถาม → ค้น Chunk ที่เกี่ยวข้อง → จัดอันดับ → สร้าง Context → ให้ LLM ตอบ
```

ตอนทำ Demo ลูกศรทุกเส้นดูตรงและสวย แต่ของจริงแต่ละลูกศรมีโอกาสกลายเป็นงานหนึ่ง Sprint ได้หมด

## จุดเริ่มต้น: Go ล้วน และมันดีจริงนะ

ระบบเวอร์ชันแรกของผมประมาณนี้:

```text
Upload → Chunk → Embedding → PostgreSQL + pgvector
                                      ↓
Question → Embed query → Retrieve → LLM → Answer
```

Go ทำส่วน Serving ได้ดีมาก:

- เปิดเป็น HTTP API ง่าย
- จัดการ Concurrency ได้ดี
- Latency คาดเดาได้
- Build เป็น Binary แล้ว Deploy สบาย
- เชื่อม PostgreSQL, Queue และบริการภายนอกได้ตรงไปตรงมา

ตอนข้อมูลเป็น Markdown กับ Source code ทุกอย่างไหลลื่น จนผมเกือบสรุปว่า “Go ทำ RAG ได้สบาย” ซึ่งก็ไม่ผิดครับ แต่เป็นความจริงเพียงครึ่งเดียว เหมือนบอกว่ารถเก๋งไปได้ทุกที่หลังทดลองขับบนถนนหน้าโชว์รูม

## จุดที่เรื่องเริ่มสนุก: ผู้ใช้ไม่ได้อัปโหลดแค่ `.txt`

ในโลกจริง ผู้ใช้มีของแบบนี้:

- PDF ที่มีทั้ง Text, ตาราง และรูป
- PDF Scan ที่ไม่มี Text layer
- Word ที่มีหัวข้อ ตาราง และ Footnote
- Screenshot จากระบบเก่า
- Diagram ที่ความหมายอยู่ในลูกศร ไม่ได้อยู่ในตัวอักษร
- Source code หลายภาษา พร้อมไฟล์ Generated ที่ไม่ควรเอาไป Index
- เอกสารเวอร์ชันซ้ำ ชื่อเหมือนกัน แต่เนื้อหาคนละปี

ตอนนี้คำว่า “อ่านไฟล์” ไม่ใช่ฟังก์ชันเล็ก ๆ แล้ว มันคือด่านศุลกากรที่ต้องตรวจคนเข้าเมืองหลายเชื้อชาติ

### Pain #1: OCR ทำได้ แต่ Ecosystem ใน Go ไม่ได้ลื่นที่สุด

Go เรียก Tesseract หรือบริการ OCR ได้ ไม่มีข้อห้ามทางฟิสิกส์ แต่โดยมากเราต้องดูแล Binary, Process, Timeout, Temporary file และการ Parse ผลลัพธ์เอง

ฝั่ง Python มี Library และ Workflow ด้านภาพกับ Machine Learning ให้เลือกเยอะกว่า โค้ดเริ่มต้นจึงสั้นกว่า และทดลอง Model ใหม่ได้เร็วกว่า เช่น:

```python
import pytesseract
from PIL import Image

text = pytesseract.image_to_string(Image.open("scan.png"), lang="tha+eng")
```

โค้ดสั้นไม่ได้แปลว่าระบบ Production ง่ายนะครับ เรายังต้องจัดการภาพหมุน, ภาษา, DPI, Noise และ OCR confidence แต่ Python ทำให้เราขึ้นชกบนเวทีได้เร็วกว่า ไม่ต้องเริ่มจากต่อเวทีเอง

### Pain #2: PDF ไม่ใช่กล่องข้อความธรรมดา

PDF อาจเก็บตัวอักษรแยกทีละตัว เก็บลำดับการอ่านไม่ตรงกับที่ตามองเห็น หรือมีตารางซึ่ง Parser อ่านเป็นข้อความสลับคอลัมน์

Python มีเครื่องมืออย่าง PyMuPDF, pdfplumber และเครื่องมือ Document AI จำนวนมาก ทำให้สลับวิธี Parse หรือทดลอง Layout-aware pipeline ได้ง่ายกว่า ส่วน Go เหมาะมากกับการรับไฟล์ ตรวจสิทธิ์ และส่งงานต่อ แต่ไม่จำเป็นต้องฝืนให้มันเป็นมีดสวิสทุกเล่มในครัว

### Pain #3: Model และงานทดลองวิ่งอยู่ฝั่ง Python ก่อน

Embedding model, Reranker, OCR model และ Multimodal model จำนวนมากมักมีตัวอย่างและ Runtime ฝั่ง Python ก่อน เราอาจ Export เป็น ONNX หรือเปิด Model server ให้ Go เรียกได้ แต่ทุกทางมีต้นทุน

คำถามที่ควรถามจึงไม่ใช่ “Go รัน Model ได้ไหม” เพราะคำตอบคือได้หลายแบบ แต่ควรถามว่า:

> “ทีมเราต้องทดลอง เปลี่ยน และดูแล Model บ่อยแค่ไหน?”

ถ้าต้องเปลี่ยนบ่อย Python มักทำให้รอบทดลองสั้นกว่า ถ้า Model นิ่งและ Throughput สำคัญ ค่อยพิจารณาแยก Model server หรือ Optimize จุดนั้นทีหลัง

## จุดตัดสินใจ: แยก Ingestion ไป Python

สุดท้ายผมแบ่งหน้าที่แบบนี้:

```text
                 ┌─────────────────────────────┐
User ──Upload──▶ │ Go API                      │
                 │ auth / quota / metadata     │
                 └──────────┬──────────────────┘
                            │ job + object key
                            ▼
                     Queue / Job Broker
                            │
                            ▼
                 ┌─────────────────────────────┐
                 │ Python Worker               │
                 │ parse / OCR / chunk / embed │
                 └──────────┬──────────────────┘
                            ▼
                    PostgreSQL + pgvector

Question ──▶ Go API ──▶ retrieve / rerank ──▶ LLM ──▶ Answer + citations
```

ไฟล์ใหญ่เก็บใน Object Storage แล้วส่งเพียง Object key ผ่าน Queue อย่ายัด PDF 200 MB ลง Message เหมือนเอาตู้เย็นใส่ซองจดหมายครับ

## ให้ Go เป็น Control Plane และทางด่วนหน้าเว็บ

Go รับผิดชอบงานที่ต้องนิ่ง เร็ว และเชื่อมระบบหลายจุด:

### 1. Authentication, Authorization และ Quota

ก่อนรับไฟล์ต้องรู้ว่าใครอัปโหลด เข้า Collection ไหนได้ ขนาดเกินหรือไม่ และข้อมูลนั้นควรแยก Tenant อย่างไร เรื่องเหล่านี้เป็นขอบเขตความปลอดภัย ไม่ควรปล่อยให้ Worker เดาจากชื่อไฟล์

### 2. Chat API และ Streaming

Go เหมาะกับ API ที่มีผู้ใช้พร้อมกันจำนวนมาก รวมถึง Server-Sent Events หรือ Streaming response ระหว่างรอ LLM สร้างคำตอบ

### 3. Retrieval orchestration

ลำดับจริงอาจเป็น:

1. ตรวจสิทธิ์และขอบเขต Collection
2. สร้าง Embedding ของคำถาม
3. ค้นแบบ Vector และ Keyword
4. รวมผลและตัดรายการซ้ำ
5. Rerank Candidate
6. ประกอบ Context ตาม Token budget
7. เรียก LLM
8. ส่งคำตอบพร้อม Citation

Go ทำหน้าที่เหมือนผู้จัดการร้านที่ไม่ได้ลงไปหั่นผักทุกชิ้น แต่รู้ว่า Order ไหนต้องออกก่อนและใครควรทำอะไร

### 4. Job state และ Idempotency

งาน Ingestion มีโอกาส Retry เสมอ Network ขาด Worker ถูก Kill หรือ Model endpoint สะดุด ถ้าเราไม่ออกแบบ Idempotency การ Retry หนึ่งครั้งอาจสร้าง Chunk ซ้ำทั้งเอกสาร

ตัว Job ควรมีข้อมูลอย่างน้อย:

```json
{
  "job_id": "ing_01...",
  "document_id": "doc_01...",
  "document_version": 7,
  "object_key": "tenant-a/uploads/manual.pdf",
  "content_sha256": "...",
  "pipeline_version": "2026-02",
  "trace_id": "..."
}
```

Worker ควรตอบสถานะที่อ่านรู้เรื่อง เช่น `queued`, `extracting`, `chunking`, `embedding`, `ready` และ `failed` พร้อม Error code ที่ Retry ได้หรือไม่ได้ ไม่ใช่โยน `500 something went wrong` แล้วปล่อยให้ทีมตามผีใน Log

## ให้ Python เป็นโรงงานแปรรูปเอกสาร

Python รับงานที่ต้องพึ่ง Ecosystem ด้าน Data และ AI:

### 1. ตรวจชนิดไฟล์จากเนื้อหา ไม่ใช่เชื่อ Extension อย่างเดียว

ไฟล์ชื่อ `.pdf` อาจไม่ใช่ PDF จริง และไฟล์ไม่มี Extension ก็อาจอ่านได้ Worker ควรตรวจ MIME และ Magic bytes พร้อมจำกัดขนาด จำนวนหน้า เวลา และหน่วยความจำ เพื่อไม่ให้เอกสารพิสดารหนึ่งไฟล์ลากทั้งระบบลงน้ำ

### 2. Extraction แบบมีโครงสร้าง

อย่าเก็บแค่ String ยาว ๆ ถ้า Parser ดึงหัวข้อ เลขหน้า ตาราง หรือ Bounding box ได้ ให้เก็บ Metadata เหล่านั้นไว้ เพราะ Citation และ Debugging ในอนาคตจะง่ายขึ้นมาก

ตัวอย่าง Chunk ที่มีประโยชน์:

```json
{
  "document_id": "doc_01...",
  "page": 18,
  "section": "การคืนสินค้า",
  "text": "ลูกค้าสามารถคืนสินค้าได้ภายใน...",
  "content_hash": "...",
  "parser_version": "pymupdf-x.y",
  "embedding_model": "..."
}
```

### 3. OCR เมื่อจำเป็น ไม่ใช่ OCR ทุกอย่าง

ถ้าหน้ามี Text layer ดีอยู่แล้ว การ OCR ซ้ำอาจทำให้ข้อความแย่ลงและเสียเวลา ควรมี Routing logic เช่นลอง Extract ก่อน ถ้าได้น้อยผิดปกติหรือพบว่าเป็นภาพสแกนจึงเข้า OCR

เก็บ Confidence หรือ Warning ไว้ด้วย คำตอบจากข้อความที่ OCR ได้ 42% ไม่ควรถูกปฏิบัติเหมือนข้อกำหนดที่อ่านได้ชัด 100%

### 4. Chunking ตามธรรมชาติของเอกสาร

การหั่นทุก 500 ตัวอักษรเหมือนใช้เครื่องตัดไส้กรอกกับหนังสือทั้งห้องสมุด มันทำงาน แต่ไม่สนใจว่าประโยคหรือหัวข้อจบตรงไหน

แนวทางที่ดีกว่าคือ:

- เอกสารทั่วไป: แบ่งตาม Heading และ Paragraph แล้วคุมขนาด
- Code: แบ่งตาม Function, Class หรือ Symbol
- ตาราง: เก็บ Header ร่วมกับแต่ละ Row group
- FAQ: เก็บคำถามกับคำตอบไว้ด้วยกัน
- Transcript: เก็บผู้พูดและช่วงเวลา

Chunk ที่ใหญ่เกินไปค้นเจอง่ายแต่มี Noise เยอะ ส่วน Chunk เล็กเกินไปแม่นเป็นคำ ๆ แต่ขาดบริบท ต้องทดลองกับข้อมูลจริงครับ ไม่มีเลขมหัศจรรย์ที่ใช้ได้กับทุกบริษัท

## ภาพปี 2026: RAG ไม่ใช่แค่ Vector Search แล้ว

Vector search ยังสำคัญ แต่ Production RAG มักต้องมีหลายชั้นประกอบกัน

### Hybrid search: ให้ความหมายกับคำตรง ๆ ช่วยกันหา

Vector search เก่งเรื่องความหมายใกล้กัน ส่วน Keyword/BM25 เก่งกับ Error code, ชื่อ Class, เลข Invoice และคำเฉพาะ

ถ้าผู้ใช้ถาม `ERR_CONNECTION_RESET` เราไม่อยากให้ระบบตอบเอกสารที่ “อารมณ์คล้ายการเชื่อมต่อมีปัญหา” เราอยากได้คำนี้ตรง ๆ Hybrid search จึงมักดีกว่าเลือกข้างเดียว

### Metadata filtering: ค้นให้ถูกห้องก่อนค้นให้เก่ง

ต้องกรอง Tenant, สิทธิ์, Product, ภาษา, Version และช่วงเวลาให้ถูกก่อน บางครั้ง Retrieval ที่ดูไม่แม่นไม่ใช่เพราะ Embedding ไม่ดี แต่เพราะเราให้มันค้นโกดังทั้งบริษัททั้งที่ผู้ใช้เข้าถึงได้เพียงชั้นเดียว

### Reranking: รอบแรกหาเร็ว รอบสองตัดสินละเอียด

ค้น Candidate สัก 30–100 ชิ้น แล้วให้ Reranker จัดอันดับใหม่ วิธีนี้เหมือนรอบ Audition ที่คัดคนจำนวนมากเร็ว ๆ ก่อนให้กรรมการดูตัวเต็งละเอียด ไม่ต้องเอา Model แพงไปอ่านเอกสารทุกชิ้นในโลก

### Citation: คำตอบที่เชื่อได้ต้องย้อนกลับไปดูต้นทางได้

คำตอบควรชี้กลับไปยังเอกสาร หน้า หัวข้อ หรือ Source URL ถ้าระบบบอกนโยบายคืนสินค้าแต่หาแหล่งอ้างอิงไม่ได้ ให้ถือว่านั่นคือสัญญาณเตือน ไม่ใช่พรสวรรค์ด้านการแต่งเรื่อง

### Evaluation: ถ้าไม่มีข้อสอบ เราไม่รู้ว่าระบบเก่งขึ้นหรือแค่พูดคล่องขึ้น

เตรียมชุดคำถามจริงพร้อมเอกสารที่ควรถูกค้นเจอ แล้ววัดอย่างน้อย:

- Retrieval recall: เอกสารที่ควรเจออยู่ใน Top-K ไหม
- Ranking quality: ของที่ถูกอยู่สูงพอหรือไม่
- Answer groundedness: คำตอบยึดกับ Context แค่ไหน
- Citation correctness: อ้างถูกชิ้นและถูกหน้าหรือเปล่า
- Latency และ Cost ต่อคำถาม
- อัตราคำถามที่ควรตอบว่า “ข้อมูลไม่พอ”

อย่าวัดแค่คำตอบดูดี เพราะ LLM พูดมั่นใจได้เก่งมาก—เหมือนเพื่อนที่ไม่รู้ทางแต่เดินนำเร็วที่สุดในกลุ่ม

## Contract ระหว่าง Go กับ Python สำคัญกว่าการเลือก Framework

เมื่อมีสองภาษา ปัญหาใหม่ไม่ใช่ Syntax แต่คือข้อตกลง

### Version Message schema

เพิ่ม `schema_version` และออกแบบให้ Worker รองรับการเปลี่ยนแปลง อย่าแก้ Field แล้ว Deploy ฝั่งเดียว เพราะ Queue อาจยังมี Message รุ่นเก่านอนรออยู่

### ส่ง Reference แทน Payload ใหญ่

เก็บไฟล์ใน Object Storage แล้วส่ง Key, Version และ Hash ช่วยให้ Queue เบา Retry ง่าย และตรวจว่า Worker กำลังอ่านไฟล์เดียวกับที่ API รับเข้ามาจริง

### ทำทุกขั้นให้ Retry ได้

ใช้ Unique key เช่น `(document_id, document_version, chunk_index, embedding_model)` และเขียนแบบ Upsert เมื่อเหมาะสม งานเดิมถูกส่งซ้ำต้องได้ผลลัพธ์เดิม ไม่ใช่เพิ่มสำเนาใหม่ทุกครั้ง

### Trace ข้าม Service

ส่ง `trace_id` จาก Go ไปกับ Job และต่อเข้า Log/Trace ของ Python เวลา User บอกว่า “ไฟล์ค้าง” เราควรตามเส้นทางเดียวได้ตั้งแต่ Upload ถึง Embedding ไม่ใช่เปิด Terminal สี่อันแล้วค้น Timestamp ด้วยสายตา

## ระวังกับดักเปลี่ยน Embedding Model

Embedding ไม่ใช่ผงปรุงรสที่เปลี่ยนยี่ห้อกลางหม้อได้ตามใจ ถ้าเปลี่ยน Model หรือ Dimension โดยไม่จัด Version Vector เก่ากับใหม่อาจเทียบกันไม่ได้

ควรเก็บอย่างน้อย:

- Provider และ Model identifier
- Dimension
- Pipeline/Chunking version
- วันที่สร้าง Embedding
- Document version และ Content hash

ถ้าจะเปลี่ยน Model ให้สร้าง Index รุ่นใหม่ Re-embed แบบ Background แล้วสลับ Traffic เมื่อพร้อม การเขียนทับทีละครึ่งทำให้ Search result กลายเป็นงานจับฉลาก

## PostgreSQL + pgvector ยังเป็นจุดเริ่มต้นที่ดีไหม

ถ้าระบบใช้ PostgreSQL อยู่แล้ว ปริมาณข้อมูลยังสมเหตุสมผล และทีมต้องการ Transaction/Metadata filter ที่คุ้นเคย `pgvector` เป็นจุดเริ่มต้นที่ดีมาก เราเก็บ Document, Permission, Metadata และ Vector ใกล้กันได้

แต่คำว่า “ใช้ PostgreSQL” ไม่ได้แปลว่าโยน Vector ลง Table แล้วจบ ต้องดู Index type, Distance metric, Query plan, Vacuum, Memory และรูปแบบ Filter ด้วย เอกสารทางการของ [pgvector](https://github.com/pgvector/pgvector) อธิบายทั้ง Exact และ Approximate search รวมถึง HNSW/IVFFlat ไว้ละเอียด

ถ้าข้อมูลใหญ่มาก มีหลาย Region หรือมี Requirement เฉพาะ ค่อยประเมิน Vector database แยก การย้ายฐานข้อมูลเพราะ Benchmark บน Laptop วิ่งเร็วกว่า 12 ms อาจแลกมากับงาน Operation อีกกองโต

## แล้ว Managed File Search ล่ะ?

ในปี 2026 บริการ LLM หลายเจ้ามี Managed retrieval/file search ให้ใช้ ถ้าโจทย์คืออัปโหลดเอกสารแล้วให้ Model ค้น การใช้ของ Managed ช่วยลดงาน Parse, Chunk, Embed และ Index ได้มาก

ตัวอย่างเช่น OpenAI มี [Vector stores และ File Search](https://platform.openai.com/docs/guides/tools-file-search) ให้ระบบค้นไฟล์ที่อัปโหลดไว้ได้โดยไม่ต้องสร้าง Retrieval stack ทุกชั้นเอง

แต่มันไม่ใช่คำตอบอัตโนมัติสำหรับทุกกรณี ให้ประเมินเรื่อง:

- Data residency และ Privacy
- รูปแบบไฟล์/การ Parse เฉพาะทาง
- Permission ระดับ Document หรือ Chunk
- ความสามารถในการควบคุม Chunking, Ranking และ Metadata
- Cost ตอน Ingest, Store และ Query
- การ Export หรือย้ายออกในอนาคต

ถ้าของ Managed ตรงโจทย์ ใช้เถอะครับ เราไม่ได้เหรียญเพิ่มจากการดูแล Queue ตอนตีสอง แต่ถ้าต้องควบคุม Pipeline ลึก ๆ หรือข้อมูลออกนอก Boundary ไม่ได้ ระบบ Custom ก็ยังมีเหตุผลชัดเจน

## สิ่งที่น่าหงุดหงิดจริง: ต้องดูแลสองภาษา

ข้อเสียนี้มีจริงและไม่ควรแต่งหน้าให้มัน

- มี Dependency และ Security update สองชุด
- CI/CD และ Container สองแบบ
- Log, Metric และ Profiling คนละ Ecosystem
- Local development มีหลาย Process
- Bug แสดงอาการฝั่งหนึ่ง แต่ต้นเหตุอยู่อีกฝั่ง
- ทีมต้อง Review ได้อย่างน้อยในระดับที่ดูแล Production ไหว

จากเดิมรันแค่:

```bash
go run ./cmd/api
```

อาจกลายเป็น API, Worker, PostgreSQL, Redis/Queue, Object Storage emulator และ Model service ยืนเรียงกันเหมือนวงดนตรีที่ทุกคนต้องตั้งเครื่องก่อนซ้อม

ทางลดความเจ็บคือทำ `docker compose` หรือ Dev environment ให้คำสั่งเดียวเปิดระบบ, ใช้ Contract test ระหว่าง Service และมี Sample document ชุดเล็กสำหรับ Smoke test

## เมื่อไรควรใช้ Go + Python

เหมาะเมื่อ:

- API มี Concurrency สูงและทีมถนัด Go
- Ingestion มี OCR, PDF, Office, Code parsing หรือ Model local
- Pipeline ทดลองและเปลี่ยนเร็ว
- ต้อง Scale Serving กับ Ingestion แยกกัน
- มีทีมพอดูแล Service boundary และ Observability ได้

## เมื่อไรไม่ควรรีบแยกสองภาษา

ไม่คุ้มเมื่อ:

- ระบบเล็ก รับเฉพาะ Text หรือ Markdown
- เรียก Managed embedding/API ทั้งหมดอยู่แล้ว
- ทีมมีคนไม่มากและ Deployment simplicity สำคัญกว่า
- Traffic ยังน้อยจน Service แยกเพิ่มแต่ Ceremony
- ปัญหายังไม่ชัด แค่แยกเพราะ Architecture diagram ดูเท่

เริ่ม Monolith ก่อนก็ได้ครับ ถ้า Interface ชัด เราค่อยดึง Ingestion ออกเมื่อมีเหตุผลจริง การแยก Service ก่อนรู้ว่ารอยต่ออยู่ตรงไหน เหมือนสร้างสะพานก่อนรู้ว่าแม่น้ำจะไหลทางใด

## Checklist ก่อนเรียก RAG ของเราว่า Production-ready

- ผู้ใช้เห็นสถานะ Ingestion และ Error ที่เข้าใจได้
- งาน Retry แล้วไม่สร้างข้อมูลซ้ำ
- แยก Tenant และ Permission ตั้งแต่ Retrieval
- มี Document version, Content hash และ Pipeline version
- เปลี่ยน Embedding model โดยไม่ปน Vector คนละรุ่น
- รองรับการลบเอกสารและลบ Chunk ที่เกี่ยวข้องครบ
- มี Citation กลับไปยัง Source
- มี Evaluation dataset จากคำถามจริง
- วัด Latency, Error, Queue depth, Token และ Cost
- มี Limit ป้องกันไฟล์ใหญ่หรือไฟล์อันตราย
- มีทางตอบว่า “ไม่พบข้อมูลเพียงพอ”

## บทสรุป

Go ทำ RAG ได้ครับ และทำฝั่ง API, Orchestration, Retrieval และงานที่ต้อง Concurrent ได้ดีมาก ส่วน Python เด่นเรื่อง Document processing, OCR, Model และการทดลอง Pipeline

การจับสองภาษามาทำงานร่วมกันจึงไม่ใช่การยอมแพ้ของภาษาใดภาษาหนึ่ง แต่เหมือนครัวที่ให้เชฟแต่ละคนถือมีดที่ถนัด ปัญหาเกิดก็ต่อเมื่อไม่มีใบ Order กลาง ไม่รู้ว่าใครรับผิดชอบจานไหน และทุกคนตั้งชื่อซอสว่า `final_v2_really_final`

ถ้าเริ่มวันนี้ ผมจะไม่เริ่มจากคำถามว่า “ใช้ภาษาอะไรทำ RAG ดี” แต่จะเริ่มจาก:

1. ข้อมูลเข้ามาในรูปแบบไหน
2. ต้องค้นภายใต้สิทธิ์อะไร
3. จะวัดว่าค้นถูกและตอบถูกอย่างไร
4. จุดไหนต้องทดลองเร็ว และจุดไหนต้องนิ่ง
5. ทีมพร้อมดูแลความซับซ้อนกี่ Service

ตอบห้าข้อนี้ได้ Stack มักเลือกตัวเองครับ และต่อให้คำตอบสุดท้ายเป็น Go ล้วน, Python ล้วน, Go + Python หรือ Managed service ก็ไม่มีฝ่ายไหนเสียหน้า—มีแค่ระบบที่ดูแลง่ายขึ้นกับทีมที่ได้นอนมากขึ้นเท่านั้นเอง
