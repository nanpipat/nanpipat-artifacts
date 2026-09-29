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

ช่วงนี้ผมลองทำ RAG system แบบจริงจัง ไม่ใช่ demo แต่เป็นระบบที่ตั้งใจจะใช้กับหลายโปรเจค หลาย repo และรองรับทั้ง code, PDF, image, document ต่างๆ

ตอนแรกคิดง่ายๆ เลยว่า:

> _“ก็เขียน Go อย่างเดียวไปเลยสิ เราเป็น Gopher อยู่แล้ว ถถถถถถ+”_

แต่พอทำไปจริงๆ สรุปคือ…  
 สุดท้ายต้องใช้ **Go + Python ร่วมกัน** และมัน both ดี และ น่าหงุดหงิด ในเวลาเดียวกัน

บทความนี้เลยอยากมาแชร์ ประสบการณ์จริงๆ เผื่อใครกำลังจะทำ RAG หรือกำลังเลือก stack อยู่

## จุดเริ่มต้น: เริ่มจาก Go ล้วนๆ

โปรเจคแรกของผมใช้ Go ทั้งหมด:

upload file → chunk → embedding → store pgvector → retrieve → GPT generate
stack:

Go  
PostgreSQL + pgvector  
OpenAI embedding API  
OpenAI GPT
และต้องบอกว่า…

มันเวิร์คเลย

โดยเฉพาะส่วน retrieval + serving

Go ทำงานดีมาก:

- เร็ว
- เขียนง่าย
- deploy ง่าย
- concurrency ดีมาก

chat latency ต่ำมาก

ไม่มีปัญหาอะไร

ตอนนั้นคิดว่า:

> _“เออ Go ทำ RAG ได้สบายๆ”_

แต่ปัญหาจริงๆ มันมาเริ่มตอน…

**อยากรองรับ file มากกว่า text**

## ปัญหาเริ่มมา: โลกไม่ได้มีแค่ .txt

user ไม่ได้ upload แค่:

README.md  
auth.go
แต่ upload:

manual.pdf  
screenshot.png  
diagram.jpg  
docx file
และนี่คือจุดที่ Go เริ่ม painful

## Pain #1: OCR ใน Go มันไม่ friendly

ถ้าอยากอ่าน text จาก image:

ใน Python:

import pytesseract
text = pytesseract.image_to_string(image)

จบ

ใน Go คุณต้อง:

install tesseract binary  
call via exec.Command  
parse output  
handle errors
มันไม่ได้ impossible แต่ friction เยอะ

และ ecosystem ไม่ใหญ่

## Pain #2: PDF parsing ecosystem ของ Go ยังเล็ก

ใน Python:

import pymupdf
doc = pymupdf.open("file.pdf")  
text = doc[0].get_text()

ใน Go:

options มีน้อยกว่า และบาง lib:

- ไม่ stable
- parse ได้ไม่ครบ
- หรือ API ไม่ friendly

## Pain #3: open-source embedding models แทบไม่มี Go support

เช่น model พวกนี้:

bge-large  
e5-large  
instructor-xl
ทั้งหมด native ใน Python

Go ไม่มี native support

คุณต้อง:

- call Python service  
 หรือ
- call external API

## จุดที่ตัดสินใจ: แยก ingestion ไป Python

สุดท้ายผม split architecture เป็น:

Go → main backend  
Python → ingestion worker
flow กลายเป็น:

upload file → Go → send to Python worker → Python extract text → embed → store vector
Go ไม่ต้องสนใจ OCR, PDF parsing, model inference

Go สนใจแค่:

query → retrieval → GPT → response
และ honestly…

มัน clean มาก

## สิ่งที่ Go ทำได้ดีมาก (และเหมาะมาก)

Go เหมาะสุดสำหรับ:

## 1. Chat API

POST /chat
Go concurrency ดีมาก

รองรับ user เยอะได้สบาย

## 2. Retrieval layer

query pgvector:

ORDER BY embedding <-> query_embedding  
LIMIT 10
Go ทำได้เร็วมาก

latency ต่ำ

## 3. orchestration

เช่น:

embed query  
retrieve chunks  
build prompt  
call GPT  
return response
Go ทำ orchestration แบบนี้ดีมาก

## 4. deployment simplicity

Go binary file เดียวจบ

./server
ไม่มี dependency hell

## สิ่งที่ Python ทำได้ดีกว่ามาก

Python เหมาะสุดสำหรับ:

## 1. OCR

pytesseract  
easyocr
ง่ายมาก

## 2. document parsing

pymupdf  
pdfplumber  
python-docx
ecosystem ใหญ่มาก

## 3. embedding pipeline

ใช้ local models:

from sentence_transformers import SentenceTransformer
ง่ายมาก

## 4. advanced RAG features

เช่น:

- reranking
- semantic chunking
- AST parsing
- multimodal processing

ทั้งหมด Python ecosystem ใหญ่กว่าเยอะ

## สิ่งที่ annoy มากที่สุด: ต้อง maintain 2 ภาษา

นี่คือ downside จริง

คุณต้อง maintain:

backend/  
 go/worker/  
 python/
มี complexity เพิ่ม:

- deploy 2 services
- debug ข้าม service
- logging แยกกัน

บางที bug อยู่ใน Python worker

แต่ symptom อยู่ใน Go

debug ยากขึ้น

## Pain อีกอย่าง: local dev complexity เพิ่ม

จากเดิม:

go run main.go
กลายเป็น:

go run main.go  
python worker.py  
docker run postgres  
docker run redis
setup เยอะขึ้น

## แต่ข้อดี outweigh ข้อเสียไหม?

สำหรับ production RAG system:

คำตอบคือ

> _Yes, absolutely_

เพราะแต่ละภาษาทำในสิ่งที่มันเก่งที่สุด

Go:

- serving
- concurrency
- performance

Python:

- AI processing
- OCR
- embedding

## mental model ที่ดีที่สุดคือ

อย่าคิดว่า Python เป็น backend

คิดว่า Python เป็น:

AI worker
ไม่ใช่ main server

## final architecture ที่ผมใช้ตอนนี้

Go service  
 - chat API  
 - retrieval  
 - auth Python worker  
 - OCR  
 - PDF parsing  
 - embeddingPostgreSQL  
 - vector storage
simple  
 scalable  
 maintainable

คหสต.

Go ทำ RAG serving ได้ดีมาก  
 Python ทำ RAG processing ได้ดีกว่า

และ combination นี้ feels “right”

ไม่ใช่ hack แต่เป็น architecture ที่ธรรมชาติของ ecosystem มันพาไปทางนั้น
