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

## RabbitMQ คืออะไร?

RabbitMQ เป็นระบบตัวกลางในการส่งข้อความ (Message Broker) ที่ช่วยให้แอปพลิเคชันสามารถส่งและรับข้อความระหว่างกันได้ง่ายๆ โดยใช้คิว (Queue) 📨 RabbitMQ ช่วยให้แอปพลิเคชันคุยกันได้ดีขึ้น โดยไม่ต้องรู้รายละเอียดภายในของกันและกัน

## ทำไมต้องใช้ RabbitMQ?

1.   **Decoupling**: RabbitMQ ช่วยแยกส่วนการทำงานของแอปพลิเคชันออกจากกัน ทำให้แต่ละส่วนสามารถพัฒนาและปรับปรุงได้โดยไม่กระทบส่วนอื่น 🔄
2.   **Scalability**: ขยายระบบได้ง่ายๆ โดยการเพิ่มคิวและโหนด RabbitMQ เพื่อรองรับงานที่เพิ่มขึ้น 📈
3.   **Reliability**: RabbitMQ มีระบบจัดการข้อความที่มั่นใจได้ว่าข้อความจะไม่หาย และเก็บไว้ในคิวจนกว่าจะมีผู้รับ 📥

## RabbitMQ ทำงานอย่างไร?

RabbitMQ ใช้คิวในการจัดการข้อความ โดยมีองค์ประกอบหลักดังนี้:

1.   **Producer**: ส่งข้อความไปยังคิว
2.   **Queue**: เก็บข้อความที่ส่งมา รอให้มีผู้รับมารับไป
3.   **Consumer**: รับข้อความจากคิว
4.   **Exchange**: รับข้อความจาก Producer แล้วส่งไปยังคิวที่เหมาะสมตามกฎการกำหนดเส้นทาง (routing rules)

## วิธีการทำงาน

1.   **Producer ส่งข้อความ**: Producer ส่งข้อความไปยัง Exchange ของ RabbitMQ
2.   **Exchange กำหนดเส้นทาง**: Exchange พิจารณากฎการกำหนดเส้นทางแล้วส่งข้อความไปยัง Queue ที่เหมาะสม
3.   **Queue เก็บข้อความ**: ข้อความถูกเก็บไว้ใน Queue รอให้ Consumer มารับ
4.   **Consumer รับข้อความ**: Consumer รับข้อความจาก Queue แล้วประมวลผลตามที่ต้องการ

## ตัวอย่างการใช้งาน RabbitMQ กับ Go

สมมติเรามีระบบสั่งซื้อสินค้าออนไลน์ เมื่อมีการสั่งซื้อใหม่:

1.   **Producer**: แอปพลิเคชันเว็บส่งข้อมูลการสั่งซื้อไปยัง RabbitMQ
2.   **Exchange**: RabbitMQ Exchange รับข้อมูลการสั่งซื้อและกำหนดเส้นทางไปยังคิวที่จัดการคำสั่งซื้อ
3.   **Queue**: คิวเก็บข้อมูลการสั่งซื้อจนกว่าจะมีการประมวลผล
4.   **Consumer**: แอปพลิเคชันที่จัดการคำสั่งซื้อรับข้อมูลจากคิวและทำการประมวลผล เช่น ยืนยันคำสั่งซื้อและเตรียมการจัดส่ง

เอาหละ เรามาดูการใช้ RabbitMQ กับ Go กันดีกว่าครับ ไปกันต๊อออ

## การติดตั้ง RabbitMQ

ก่อนอื่นเราต้องติดตั้ง RabbitMQ มีหลากหลายวิธีมาก [สามารถดูได้จาก official website ได้เลย](https://www.rabbitmq.com/docs/download) เสร็จแล้วก็เปิดเซิร์ฟเวอร์ RabbitMQ 🐇🚀

## การติดตั้งไลบรารี RabbitMQ สำหรับ Go

เราจะใช้ไลบรารี `streadway/amqp` ที่นิยมใช้กับ Go เพื่อติดตั้ง รันคำสั่งนี้:

go get github.com/streadway/amqp
## ส่งข้อความ

นี่คือตัวอย่างการส่งข้อความไปยังคิวใน RabbitMQ ด้วย Go:

**Publisher (Send)**

package main
import (  
 "log"  
 "github.com/streadway/amqp"  
)

func failOnError(err error, msg string) {  
 if err != nil {  
 log.Fatalf("%s: %s", msg, err)  
 }  
}

func main() {  
 conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")  
 failOnError(err, "Failed to connect to RabbitMQ")  
 defer conn.Close()

ch, err := conn.Channel()  
 failOnError(err, "Failed to open a channel")  
 defer ch.Close()

q, err := ch.QueueDeclare(  
 "hello",   
 false,   
 false,   
 false,   
 false,   
 nil,   
 )  
 failOnError(err, "Failed to declare a queue")

body := "Hello World!"  
 err = ch.Publish(  
 "",   
 q.Name,   
 false,   
 false,   
 amqp.Publishing{  
 ContentType: "text/plain",  
 Body: []byte(body),  
 })  
 failOnError(err, "Failed to publish a message")  
 log.Printf(" [x] Sent %s", body)  
}

โค้ดนี้จะส่งข้อความ “Hello World!” ไปยังคิวชื่อ “hello”

## รับข้อความ

นี่คือตัวอย่างการรับข้อความจากคิวใน RabbitMQ ด้วย Go:

### Consumer (Receive)

package main
import (  
 "log"  
 "github.com/streadway/amqp"  
)

func failOnError(err error, msg string) {  
 if err != nil {  
 log.Fatalf("%s: %s", msg, err)  
 }  
}

func main() {  
 conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")  
 failOnError(err, "Failed to connect to RabbitMQ")  
 defer conn.Close()

ch, err := conn.Channel()  
 failOnError(err, "Failed to open a channel")  
 defer ch.Close()

q, err := ch.QueueDeclare(  
 "hello",   
 false,   
 false,   
 false,   
 false,   
 nil,   
 )  
 failOnError(err, "Failed to declare a queue")

msgs, err := ch.Consume(  
 q.Name,   
 "",   
 true,   
 false,   
 false,   
 false,   
 nil,   
 )  
 failOnError(err, "Failed to register a consumer")

forever := make(chan bool)

go func() {  
 for d := range msgs {  
 log.Printf("Received a message: %s", d.Body)  
 }  
 }()

log.Printf(" [*] Waiting for messages. To exit press CTRL+C")  
 <-forever  
}

โค้ดนี้จะรับข้อความจากคิวชื่อ “hello” และพิมพ์ข้อความนั้นในคอนโซล

## การรันตัวอย่าง

1.   ตรวจสอบให้แน่ใจว่า RabbitMQ กำลังทำงานอยู่
2.   รันโปรแกรม publisher เพื่อส่งข้อความ:

go run publisher.go
3. รันโปรแกรม consumer เพื่อรับข้อความ:

go run consumer.go
เมื่อเรารัน consumer เราจะเห็นข้อความ “Hello World!” ถูกพิมพ์ในคอนโซล 📬

## สรุป

ตัวอย่างนี้แสดงวิธีส่งและรับข้อความโดยใช้ RabbitMQ กับ Go 🐇💌 RabbitMQ เป็นเครื่องมือเจ๋งๆ ที่ช่วยให้เราสร้างระบบที่ยืดหยุ่นและขยายตัวได้ดี 📈 ไลบรารี `streadway/amqp` ทำให้การใช้งาน RabbitMQ กับ Go ง่ายมากๆ เราสามารถขยายตัวอย่างนี้ต่อไปอีก เช่น การทำงานคิวงาน หรือ การแจ้งเตือนต่างๆ ได้ง่ายๆ เลย 🚀
