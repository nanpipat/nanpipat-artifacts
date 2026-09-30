---
title: "Go กับ RabbitMQ"
author: "Nanpipat Klinpratoom"
published: "2024-06-06"
published_time: "2024-06-06T07:13:17Z"
source_url: "https://medium.com/@nanpipat.k/go-%E0%B8%81%E0%B8%B1%E0%B8%9A-rabbitmq-19c83fe9ddcf"
medium_id: "19c83fe9ddcf"
---

# Go กับ RabbitMQ

![Image 2](https://miro.medium.com/v2/resize:fit:500/0*KQuN5d9votmGJZLj.png)

สมมติระบบร้านค้าได้รับ Order แล้วต้องตัดสต็อก ส่ง Email ออกใบเสร็จ และแจ้งขนส่ง ถ้า Web API ทำทุกอย่างต่อกัน ลูกค้าจะยืนรอเหมือนต่อคิวร้านที่พนักงานคนเดียวรับออเดอร์ ชงกาแฟ ล้างแก้ว และขี่มอเตอร์ไซค์ไปส่งเอง

RabbitMQ ช่วยวาง “จุดรับฝากงาน” ไว้ตรงกลาง API ส่งข้อความแล้วตอบลูกค้าได้เร็วขึ้น ส่วน Worker แต่ละตัวมารับงานที่ตัวเองถนัด ระบบจึงแยกส่วนและรองรับ Load ได้ยืดหยุ่นขึ้นครับ

## RabbitMQ คืออะไร

RabbitMQ เป็น Message broker รับ เก็บ และส่งต่อ Message ระหว่าง Producer กับ Consumer ผ่าน Queue และ Exchange

- **Producer** สร้างและส่ง Message
- **Exchange** ตัดสินว่าจะ Route Message ไป Queue ใด
- **Queue** พัก Message รอ Consumer
- **Binding** กติกาเชื่อม Exchange กับ Queue
- **Consumer** รับและประมวลผล Message

เปรียบเหมือนไปรษณีย์ Producer หย่อนพัสดุ Exchange ดูรหัสปลายทาง Queue เป็นชั้นพักของ และ Consumer เป็นบุรุษไปรษณีย์ที่มารับไปส่ง ผู้ส่งไม่ต้องโทรหาคนส่งทุกคนโดยตรงครับ

## ทำไมไม่เรียก Service ตรง ๆ ทุกครั้ง

Message broker เหมาะเมื่อเราต้องการ:

- แยก Producer กับ Consumer ไม่ให้รู้รายละเอียดกันมาก
- รับ Load กระชากแล้วค่อยระบายงาน
- Retry งานชั่วคราวที่ล้มเหลว
- กระจายงานให้ Worker หลายตัว
- ส่ง Event หนึ่งชุดไปหลายปลายทาง

แต่ RabbitMQ ไม่ใช่ยาวิเศษ มันเพิ่มระบบที่ต้อง Monitor, Backup, Upgrade และออกแบบ Delivery semantics ถ้างานเป็น Request/Response ง่าย ๆ และต้องการคำตอบทันที HTTP หรือ gRPC อาจเหมาะกว่า อย่าสร้างที่ทำการไปรษณีย์เพื่อส่งกระดาษโน้ตจากโต๊ะหนึ่งไปอีกโต๊ะที่อยู่ข้างกันครับ

## อัปเดต Library สำหรับ Go

ตัวอย่างเก่าใช้ `github.com/streadway/amqp` ซึ่งไม่ได้เป็นตัวเลือกที่ควรเริ่มงานใหม่แล้ว ปัจจุบัน Tutorial ทางการของ RabbitMQ ใช้ Client:

```bash
go get github.com/rabbitmq/amqp091-go
```

Import พร้อม Alias เพื่อให้โค้ดอ่านสั้น:

```go
import amqp "github.com/rabbitmq/amqp091-go"
```

ตัวอย่างนี้ใช้ AMQP 0-9-1 ส่วน RabbitMQ 4.x รองรับ AMQP 1.0 ด้วย เลือก Protocol และ Client ตาม Ecosystem ของระบบ อย่าผสม Tutorial คนละ Protocol แล้วสงสัยว่าชื่อ API ไม่ตรงกันครับ

## เปิด RabbitMQ สำหรับทดลอง

ใช้ Container ที่มี Management UI:

```bash
docker run --rm \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:4-management
```

- Port 5672 สำหรับ AMQP
- Port 15672 สำหรับ Management UI

บัญชี `guest/guest` เหมาะกับ Local test และโดยค่าเริ่มต้นจำกัดการเชื่อมต่อจาก localhost Production ต้องสร้าง User, Virtual host, Permission และ TLS ให้เหมาะสม ห้ามเอารหัสตัวอย่างไปวางกลาง Internet ครับ

## Publisher ส่ง Message

```go
package main

import (
	"context"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	if err != nil {
		log.Fatal("connect RabbitMQ: ", err)
	}
	defer conn.Close()

	channel, err := conn.Channel()
	if err != nil {
		log.Fatal("open channel: ", err)
	}
	defer channel.Close()

	queue, err := channel.QueueDeclare(
		"orders",
		true,  // durable
		false, // auto-delete
		false, // exclusive
		false, // no-wait
		nil,
	)
	if err != nil {
		log.Fatal("declare queue: ", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = channel.PublishWithContext(
		ctx,
		"",         // default exchange
		queue.Name, // routing key
		false,      // mandatory
		false,      // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			MessageId:    "order-123",
			Timestamp:    time.Now().UTC(),
			Body:         []byte(`{"order_id":"order-123"}`),
		},
	)
	if err != nil {
		log.Fatal("publish message: ", err)
	}

	log.Println("published order-123")
}
```

Queue ตั้ง `durable: true` และ Message ใช้ `DeliveryMode: Persistent` ช่วยให้ Broker พยายามเก็บ Message ลง Durable storage แต่ถ้าต้องรู้ว่า Broker รับ Message จริง ควรใช้ Publisher Confirms เพิ่ม การที่ `PublishWithContext` คืน `nil` หมายถึง Client ส่งได้ ไม่ได้แปลว่า Consumer ทำงานสำเร็จแล้วครับ

## Consumer รับงานและ Ack เอง

```go
package main

import (
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	if err != nil {
		log.Fatal("connect RabbitMQ: ", err)
	}
	defer conn.Close()

	channel, err := conn.Channel()
	if err != nil {
		log.Fatal("open channel: ", err)
	}
	defer channel.Close()

	queue, err := channel.QueueDeclare("orders", true, false, false, false, nil)
	if err != nil {
		log.Fatal("declare queue: ", err)
	}

	if err := channel.Qos(10, 0, false); err != nil {
		log.Fatal("set qos: ", err)
	}

	deliveries, err := channel.Consume(
		queue.Name,
		"order-worker",
		false, // auto-ack ต้องเป็น false
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatal("consume: ", err)
	}

	for delivery := range deliveries {
		if err := processOrder(delivery.Body); err != nil {
			log.Printf("process failed: %v", err)
			_ = delivery.Nack(false, false)
			continue
		}

		if err := delivery.Ack(false); err != nil {
			log.Printf("ack failed: %v", err)
		}
	}
}

func processOrder(body []byte) error {
	log.Printf("received: %s", body)
	return nil
}
```

จุดสำคัญคือ `autoAck: false` เรา Ack หลังงานเสร็จเท่านั้น ถ้า Worker ตายก่อน Ack Broker สามารถส่ง Message ใหม่ได้ ต่างจาก Auto Ack ที่เปรียบเหมือนพนักงานเซ็นรับพัสดุก่อนเปิดกล่อง แล้วทำกล่องหายระหว่างเดินกลับโต๊ะ

ตัวอย่าง `Nack(false, false)` ไม่ Requeue Message ที่ล้มเหลว ปกติควรผูก Dead Letter Exchange เพื่อเก็บงานเสียไว้ตรวจหรือ Retry ตามรอบ ถ้า `requeue: true` ทันทีทุก Error อาจเกิด Poison message วิ่งวนกิน CPU ไม่จบครับ

## Delivery เป็น At least once จึงต้อง Idempotent

RabbitMQ ทั่วไปออกแบบให้ Message อาจถูกส่งซ้ำ เช่น Consumer ทำงานสำเร็จแต่ Connection หลุดก่อน Ack Broker ไม่รู้ว่างานจบแล้วจึงส่งอีกครั้ง

Consumer ควร Idempotent:

- มี `message_id` หรือ Business key
- เก็บสถานะว่า Event ไหนประมวลผลแล้ว
- ใช้ Database unique constraint ป้องกันผลซ้ำ
- ออกแบบ Operation ให้เรียกซ้ำแล้วได้ผลเดิม

การสัญญาว่า “Exactly once” โดยไม่มี Transaction ครอบ Broker กับ Database เป็นเรื่องซับซ้อนมาก ในงานจริงเรามักยอมรับ At-least-once แล้วทำ Consumer ให้รับมือข้อความซ้ำครับ

## Connection กับ Channel ใช้อย่างไร

Connection เป็น TCP connection ที่มีราคาแพง ส่วน Channel เป็น Virtual connection ที่เบากว่า แนวทางทั่วไปคือ Reuse Connection และเปิด Channel ตามรูปแบบ Concurrency ที่ Client รองรับ ไม่สร้าง Connection ใหม่ทุก Message

ต้องมีแผนรับ Connection ขาดด้วย Client Library ไม่ได้ทำ Reconnect และ Restore topology ให้ทุกอย่างโดยอัตโนมัติตามใจเราเสมอ Worker Production ควรมี Loop reconnect พร้อม Backoff, ประกาศ Exchange/Queue/Binding ใหม่อย่าง Idempotent และหยุดระบบอย่าง Graceful เมื่อรับ Signal

## Reliability checklist

- Queue และ Exchange ที่ต้องอยู่ข้าม Restart ตั้ง Durable
- Message สำคัญใช้ Persistent delivery
- Publisher ใช้ Confirm เมื่อจำเป็นต้องรู้ว่า Broker รับแล้ว
- Consumer ปิด Auto Ack และ Ack หลังประมวลผลสำเร็จ
- ตั้ง Prefetch/QoS ตามงานและ Memory
- มี Dead Letter Queue และ Retry policy ที่จำกัดรอบ
- Consumer เป็น Idempotent
- ใช้ TLS, User และ Virtual host แยก Environment
- Monitor Queue depth, Unacked message, Consumer count และ Disk alarm
- วางแผน Reconnect, Shutdown และ Deploy แบบไม่ทำ Message หาย

## สรุป

RabbitMQ ช่วยแยก Producer ออกจาก Consumer และทำให้ระบบรับงานกระชากได้ดีขึ้น แต่ความน่าเชื่อถือไม่ได้เกิดเพียงเพราะมี Queue อยู่ตรงกลาง เราต้องออกแบบ Durability, Acknowledgement, Retry, Dead letter และ Idempotency ให้ครบ

สำหรับ Go ในปี 2026 ให้เริ่มจาก `github.com/rabbitmq/amqp091-go` ตาม Tutorial ทางการ แล้วค่อยขยายจาก Hello World ไปสู่ Publisher confirms และ Work queues เมื่อเข้าใจเส้นทาง Message จริง ๆ ก่อน กระต่ายส่งจดหมายได้เร็วครับ แต่เรายังต้องเขียนที่อยู่ให้ชัดและมีแผนตอนผู้รับไม่อยู่บ้านเสมอ

อ่านต่อจากเอกสารทางการ:

- [RabbitMQ tutorial for Go](https://www.rabbitmq.com/tutorials/tutorial-one-go)
- [RabbitMQ tutorials](https://www.rabbitmq.com/tutorials)
