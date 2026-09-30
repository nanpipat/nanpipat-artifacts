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

เคยยิง External API หลายครั้งแล้วพบว่าเวลาส่วนใหญ่ไม่ได้หมดกับการรับข้อมูล แต่หมดกับการ “ทักทายกันใหม่” ทุก Request ไหมครับ TCP ต้องจับมือ TLS ต้องตรวจ Certificate และตกลงกุญแจ กว่าจะเริ่มส่งของจริงก็เหมือนคนส่งพัสดุต้องสร้างถนนใหม่ทุกครั้งที่มาส่งบ้านเดิม

HTTP connection pooling ช่วยเก็บ Connection ที่ว่างไว้ใช้ซ้ำ ใน Go งานนี้อยู่ใน `http.Transport` และค่าเริ่มต้นก็รองรับ Keep-Alive อยู่แล้ว สิ่งที่เราต้องทำคือ Reuse Client/Transport, ตั้ง Pool ให้ตรงกับ Load และอ่าน Response body ให้ถูกเพื่อให้ Connection กลับเข้าพูลครับ

## แยก Client กับ Transport ให้ออก

- `http.Client` จัดการ Request ระดับสูง เช่น Redirect, Cookie jar และ Overall timeout
- `http.Transport` จัดการ Connection, Proxy, TLS, Keep-Alive, Pool และ Protocol

ทั้ง Client และ Transport ปลอดภัยสำหรับใช้พร้อมกันหลาย Goroutine และควรสร้างครั้งเดียวแล้ว Reuse

ข้อเท็จจริงที่มักถูกเล่าง่ายเกินไปคือ “สร้าง Client ใหม่ทุกครั้งทำให้ Connection ใหม่ทุกครั้ง” ไม่จริงเสมอครับ ถ้า Client ไม่มี Custom Transport มันอาจใช้ `http.DefaultTransport` ร่วมกัน แต่การสร้าง `&http.Transport{}` ใหม่ต่อ Request จะสร้าง Pool ใหม่แน่นอน และยังทิ้งค่า Default สำคัญบางอย่างไปด้วย

## ตัวอย่างที่สร้าง Pool ใหม่ทุกครั้ง

```go
func fetch(ctx context.Context, url string) ([]byte, error) {
	transport := &http.Transport{}
	client := &http.Client{Transport: transport}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}
```

ทุกครั้งที่เรียก Function จะมี Transport และ Pool คนละชุด Connection เก่าไม่ได้ถูกใช้กับรอบใหม่ นอกจากนี้ `Transport{}` ศูนย์ค่าไม่เหมือน `http.DefaultTransport` ทุกจุด จึงควร Clone ค่า Default แล้วปรับเฉพาะสิ่งที่ต้องการครับ

## สร้าง Shared Client จาก Default Transport

```go
func NewHTTPClient() *http.Client {
	transport := http.DefaultTransport.(*http.Transport).Clone()

	transport.MaxIdleConns = 200
	transport.MaxIdleConnsPerHost = 50
	transport.MaxConnsPerHost = 100
	transport.IdleConnTimeout = 90 * time.Second
	transport.TLSHandshakeTimeout = 10 * time.Second
	transport.ExpectContinueTimeout = 1 * time.Second

	return &http.Client{
		Transport: transport,
		Timeout:   30 * time.Second,
	}
}
```

เก็บ Client ใน Service หรือ Dependency container:

```go
type Repository struct {
	client *http.Client
}

func NewRepository(client *http.Client) *Repository {
	return &Repository{client: client}
}
```

เรียกใช้:

```go
func (r *Repository) Fetch(
	ctx context.Context,
	url string,
) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := r.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<10))
		return nil, fmt.Errorf(
			"unexpected status %d: %s",
			resp.StatusCode,
			strings.TrimSpace(string(body)),
		)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	return body, nil
}
```

`defer resp.Body.Close()` กัน Resource รั่ว และการอ่าน Body จนจบทำให้ Transport มีโอกาสนำ HTTP/1.1 Connection กลับไปใช้ซ้ำ ถ้าเรา Close ก่อนอ่าน Body หมด Connection อาจไม่ถูก Reuse ตามสถานการณ์ครับ

## ถ้าไม่ต้องการ Body ให้ Drain อย่างมีเพดาน

```go
defer resp.Body.Close()
_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 64<<10))
```

อย่า Drain แบบไม่จำกัดจาก Server ที่ไม่ไว้ใจ เพราะ Response อาจมีขนาดมหาศาล ถ้า Body ใหญ่และเราไม่ต้องการ การยอมทิ้ง Connection แล้วสร้างใหม่อาจถูกกว่าการอ่านข้อมูลหลาย GB เพื่อรักษา Socket หนึ่งเส้น ต้องดู Workload จริงครับ

## Config สำคัญหมายถึงอะไร

### MaxIdleConns

จำนวน Idle connection รวมทุก Host ที่ Transport เก็บไว้ ไม่ใช่เพดาน Request ที่กำลังทำงาน

### MaxIdleConnsPerHost

จำนวน Idle connection ที่เก็บต่อ Host ค่า Default ของ Transport อยู่ที่ 2 ซึ่งอาจต่ำสำหรับ HTTP/1.1 ที่ยิง Host เดิมพร้อมกันมาก แต่ไม่ได้แปลว่าต้องตั้ง 100 ทุกระบบ

### MaxConnsPerHost

เพดาน Connection รวมต่อ Host ทั้ง Dialing, Active และ Idle ถ้าชนเพดาน Request จะรอ ช่วยกันระบบเราเปิด Connection มากเกินไป แต่ถ้าต่ำเกินจะสร้างคิวใน Client

### IdleConnTimeout

เวลาที่ Idle connection อยู่ใน Pool ก่อนปิด ควรสัมพันธ์กับ Load balancer และ Upstream keep-alive timeout ถ้า Upstream ปิดก่อน Client บ่อย เราอาจเห็นการ Retry หรือ Connection reset

### ResponseHeaderTimeout

จำกัดเวลารอ Response header หลังส่ง Request เหมาะเมื่ออยากแยก Timeout ช่วง Server processing จากเวลาที่ใช้ Stream body

### Client Timeout

ครอบเวลาทั้ง Request รวม Connect, Redirect และอ่าน Response body ใช้ง่ายแต่ไม่เหมาะกับ Download/Stream ยาวที่ต้องใช้ Context deadline และ Phase timeout ละเอียดกว่า

## HTTP/2 เปลี่ยนภาพของ Pool

HTTP/1.1 โดยทั่วไปหนึ่ง Connection รับหนึ่ง Request ที่กำลังตอบในเวลาหนึ่ง ส่วน HTTP/2 Multiplex หลาย Stream บน Connection เดียวได้ จึงไม่ควรตั้งค่าจากสูตร “Concurrency 100 เท่ากับต้องมี 100 Connection” โดยไม่ดู Protocol

`http.DefaultTransport` รองรับ HTTP/2 สำหรับ HTTPS เมื่อเงื่อนไขเข้ากัน ดู Metric และ Trace ว่าระบบใช้ Protocol ไหนก่อนปรับ Pool ครับ

## ห้ามใช้ InsecureSkipVerify เพื่อแก้ TLS

ตัวอย่างเก่ามี:

```go
TLSClientConfig: &tls.Config{InsecureSkipVerify: true}
```

ค่านี้ปิดการตรวจ Certificate ทำให้ Connection เข้ารหัสแต่ไม่รู้ว่ากำลังคุยกับ Server จริงหรือคนกลาง เปรียบเหมือนคุยผ่านซองปิดผนึก แต่ส่งซองให้ใครก็ได้ที่ยืนอยู่หน้าประตู

ทางแก้ที่ถูกคือ:

- ใช้ Certificate จาก CA ที่เชื่อถือได้
- เพิ่ม Corporate/private CA เข้า `RootCAs`
- ตรวจ Server name ให้ตรง
- แก้ Certificate chain ที่ Server

ใช้ `InsecureSkipVerify` เฉพาะ Lab ที่ควบคุมได้และไม่ให้กลายเป็น Config Production ครับ

## Timeout ควรมีทั้ง Request และ Caller context

```go
ctx, cancel := context.WithTimeout(parentCtx, 5*time.Second)
defer cancel()

body, err := repo.Fetch(ctx, url)
```

Client timeout เป็น Guardrail รวม ส่วน Context ให้ Caller กำหนด Budget ของงาน เช่น Request จากผู้ใช้เหลือเวลาเพียง 2 วินาที Downstream call ก็ไม่ควรมีสิทธิ์ใช้ 30 วินาทีเต็ม

ถ้าทำหลาย Call ต่อกัน แบ่ง Time budget ให้แต่ละขั้น ไม่ใช่ให้ทุกขั้นมี Timeout 30 วินาทีจน Request หนึ่งตัวเดินทางครึ่งนาทีหลายรอบครับ

## Retry ต้องรู้ว่า Request ทำซ้ำได้หรือไม่

Go Transport Retry Network error บางชนิดสำหรับ Request ที่ Idempotent ตามเงื่อนไข แต่ Application retry ยังต้องออกแบบเอง

เหมาะกับ Retry:

- Network error ชั่วคราว
- 429 ตาม `Retry-After`
- 502/503/504 บางกรณี
- GET/HEAD หรือ Operation ที่มี Idempotency key

ไม่ควร Retry POST ที่ตัดเงินซ้ำได้โดยไม่มี Idempotency protection การ Reuse Connection ลดต้นทุน Handshake แต่ไม่ได้แก้ Thundering herd หรือ Upstream ล่ม ต้องมี Backoff, Jitter, Limit และ Circuit breaker ตามความจำเป็นครับ

## วัดผลแทนการเดา

ผลจากเคสหนึ่งอาจลด Latency จากหลายวินาทีเหลือไม่ถึงวินาที แต่ไม่ควรสัญญาตัวเลขเดียวกับทุกระบบ วัดด้วย:

- DNS lookup duration
- TCP connect duration
- TLS handshake duration
- Time to first byte
- Connection reused หรือไม่
- Idle/active connection
- Error และ Timeout rate
- p50/p95/p99 latency

ใช้ `httptrace` ดู Phase ของ Request:

```go
trace := &httptrace.ClientTrace{
	GotConn: func(info httptrace.GotConnInfo) {
		log.Printf("reused=%v idle=%v", info.Reused, info.WasIdle)
	},
}

req = req.WithContext(httptrace.WithClientTrace(req.Context(), trace))
```

ถ้า `Reused` แทบไม่เคยเป็น `true` ให้ตรวจก่อนว่า Transport ถูกสร้างซ้ำ Body ถูกปิด/อ่านครบ Upstream ส่ง `Connection: close` หรือ Timeout สองฝั่งไม่เข้ากันครับ

## Checklist

- สร้าง Client/Transport ครั้งเดียวและ Reuse
- Clone `http.DefaultTransport` ก่อนปรับ
- Close Response body ทุกครั้ง
- อ่าน Body จนจบเมื่อเหมาะสมกับขนาด
- ตั้ง Client timeout และ Context deadline
- ไม่ใช้ `InsecureSkipVerify` ใน Production
- Tune `MaxIdleConnsPerHost` และ `MaxConnsPerHost` จาก Load test
- เข้าใจว่า HTTP/2 Multiplex ได้
- Retry เฉพาะ Operation ที่ปลอดภัย
- เก็บ Metric และ Trace ก่อนสรุปว่าปัญหาคือ Pool

## สรุป

Connection pooling ใน Go ไม่ต้องสร้างระบบพิเศษ `http.Transport` ทำอยู่แล้ว จุดสำคัญคืออย่าทิ้ง Pool ด้วยการสร้าง Transport ใหม่ทุก Request และต้องปิด/อ่าน Response body อย่างถูกต้อง

เริ่มจาก Clone Default Transport, Reuse Client, ใส่ Timeout และวัดว่า Connection ถูกใช้ซ้ำจริง จากนั้นค่อย Tune ตาม Concurrency, Host และ Protocol ของระบบ การมีท่อใหญ่ไม่ช่วยถ้าเราเปิดก๊อกผิดบ้านครับ และการตั้ง `MaxIdleConnsPerHost: 100` โดยไม่วัดก็เป็นเพียงตัวเลขสวย ๆ ที่นั่งกิน Socket รอเราอธิบายใน Incident ครั้งหน้า

อ่านต่อจากเอกสารทางการ: [Go net/http package](https://pkg.go.dev/net/http)
