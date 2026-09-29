---
title: "ทำ HTTP Connection Pooling ใน Go"
author: "Nanpipat Klinpratoom"
published: "2026-01-22"
published_time: "2026-01-22T08:07:48Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%97%E0%B8%B3-http-connection-pooling-%E0%B9%83%E0%B8%99-go-664ba54c3b74"
medium_id: "664ba54c3b74"
---

# ทำ HTTP Connection Pooling ใน Go

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*IQ9tKSPtz6EYBF37.png)

เคยเจอปัญหาไหมครับ ? ยิง External API ไปเยอะๆ แล้ว Response Time ช้าผิดปกติ ทั้งที่ Network ก็ดูปกติดี วันนี้ผมจะมาแชร์เคสที่เจอจริง และวิธีแก้ด้วยการทำ HTTP Connection Pooling ที่ช่วยลด Latency จากหลักวิ (4–5s) เหลือหลักมิลลิวินาทีครับ

### 🔴 The Problem: สร้าง Client ใหม่ทุกครั้ง = พัง

ใน Go เวลาเราจะยิง HTTP Request เรามักจะใช้ `http.NewRequest` หรือสร้าง `http.Client` ขึ้นมาใหม่แบบนี้:

  
func GetExternalData(url string) {  
 client := &http.Client{  
 Transport: &http.Transport{  
 TLSClientConfig: &tls.Config{InsecureSkipVerify: true},  
 },  
 }  
 resp, _ := client.Get(url)  
   
}
ถ้าฟังก์ชันนี้ถูกเรียกบ่อยๆ (เช่น วนลูปดึงรูปภาพ 10 รูป) สิ่งที่เกิดขึ้นคือ:

1.   TCP Handshake (3-way): ต้องเปิด Connection ใหม่ทุกครั้ง
2.   TLS Handshake: ถ้าเป็น HTTPS ต้องเสียเวลาแลก Key เข้ารหัสใหม่ทุกครั้ง (กิน resource และเวลามาก!)
3.   Socket Exhaustion: สร้าง Connection เยอะเกินไปจน Port ไม่พอใช้

ผลลัพธ์คือ Latency พุ่งสูง เพราะเสียเวลาไปกับการ “ต่อท่อ” มากกว่า “ส่งข้อมูล” จริงๆ

### 🟢 The Solution: Connection Pooling (Reuse Connection)

วิธีแก้คือ “สร้างท่อทิ้งไว้ แล้วใช้ซ้ำ” (Keep-Alive) ครับ  
ใน Go `http.Client` และ `http.Transport` ถูกออกแบบมาให้ Thread-safe และใช้ซ้ำได้อยู่แล้ว เราควรสร้าง Client ไว้เป็น Global หรือ Singleton ใน Service level แล้ว config ค่า `Transport` ให้เหมาะสม

**Code ตัวอย่าง (Before vs After)  
Before (ช้า):**

  
func (r *Repo) FetchImage(url string) {  
 tr := &http.Transport{ ... }   
 client := &http.Client{Transport: tr}   
 client.Get(url)   
}
**After (เร็ว — Optimized):**

  
func NewRepository() *Repo {  
   
 tr := &http.Transport{  
 TLSClientConfig: &tls.Config{InsecureSkipVerify: true},  
 MaxIdleConns: 100,   
 MaxIdleConnsPerHost: 100,   
 IdleConnTimeout: 90 * time.Second,   
 }
sharedClient := &http.Client{  
 Transport: tr,  
 Timeout: 30 * time.Second,  
 }  
 return &Repo{  
 client: sharedClient,   
 }  
}  
  
func (r *Repo) FetchImage(url string) {  
   
   
 r.client.Get(url)   
}

## 🔑 Key Configs ที่ต้องรู้

- `MaxIdleConnsPerHost`: สำคัญที่สุด! Default ของ Go คือ 2 ซึ่งน้อยมาก ถ้าเรายิงไป Host เดิมพร้อมกัน 10 request อีก 8 request จะต้องสร้าง connection ใหม่ (ไม่ได้ reuse) ควรปรับให้เหมาะสมกับ load งานของเรา (เช่น 100)
- `MaxIdleConns`: จำนวน Idle connection รวมทั้งหมดทุก Host

## 📉 ผลลัพธ์ (The Impact)

หลังจากแก้โค้ด:

- Latency: ลดลงอย่างเห็นได้ชัด (เช่นจาก 4–5s เหลือ <1s ในเคสที่ยิงหลาย request)
- Resource: CPU/Memory ลดลง เพราะไม่ต้อง process TLS Handshake ถี่ๆ
- Stability: ลดโอกาสเกิด error connection timeout หรือ too many open files
