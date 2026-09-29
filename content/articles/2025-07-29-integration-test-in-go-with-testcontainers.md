---
title: "Integration Test ใน Go ด้วย testcontainers-go"
author: "Nanpipat Klinpratoom"
published: "2025-07-29"
published_time: "2025-07-29T06:41:45Z"
source_url: "https://medium.com/@nanpipat.k/integration-test-%E0%B9%83%E0%B8%99-go-%E0%B8%94%E0%B9%89%E0%B8%A7%E0%B8%A2-testcontainers-go-8d39418c17ef"
medium_id: "8d39418c17ef"
---

# Integration Test ใน Go ด้วย testcontainers-go

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*Nxz334QVZ-3KwUrS.png)

## ทำไมต้อง Integration Test?

Unit test ใช้สำหรับตรวจสอบ function หรือ logic เล็ก ๆ แบบแยกส่วน (isolated) แต่แอปพลิเคชันจริงมักต้องเชื่อมต่อกับระบบอื่น เช่น

- Database (Postgres, MySQL, MongoDB)
- Message Queue (Kafka, RabbitMQ)
- Cache (Redis)
- หรือแม้แต่ microservices อื่น

การทำ Integration Test จะช่วยให้เรามั่นใจว่าแอปของเราทำงานร่วมกับ service ภายนอกเหล่านี้ได้จริง และไม่มีปัญหาใน runtime

## ทำความรู้จัก `testcontainers-go`

`testcontainers-go` เป็น Go library ที่ช่วยให้เราสร้าง Docker container ชั่วคราวขึ้นมาในระหว่างรันทดสอบได้ โดยไม่ต้องพึ่ง `docker-compose` หรือ shell script

**จุดเด่นหลัก:**

- เขียนด้วย Go ทั้งหมด (ไม่ต้องสลับไปเขียน shell)
- ควบคุม lifecycle ของ container ได้
- ใช้ได้ทั้ง local และบน CI/CD
- ทดสอบระบบที่ต้องใช้ resource ภายนอกแบบ isolated ได้จริง

## เริ่มต้นใช้งาน

### ติดตั้ง dependency

go get github.com/testcontainers/testcontainers-go  
go get github.com/testcontainers/testcontainers-go/modules/postgres

### ตัวอย่าง: Integration Test กับ Postgres

สมมติเรามี repository ที่ใช้ PostgreSQL เราสามารถ spin up container ชั่วคราวระหว่างเทสต์ แล้วเชื่อมต่อเพื่อตรวจสอบได้เลย

package integration_test
import (  
 "context"  
 "database/sql"  
 "testing"  
 "time"

_ "github.com/lib/pq"  
 "github.com/testcontainers/testcontainers-go/modules/postgres"  
)

func TestWithPostgresContainer(t *testing.T) {  
 ctx := context.Background()

pgContainer, err := postgres.RunContainer(ctx,  
 postgres.WithDatabase("testdb"),  
 postgres.WithUsername("user"),  
 postgres.WithPassword("pass"),  
 postgres.WithImage("postgres:14-alpine"),  
 )  
 if err != nil {  
 t.Fatal(err)  
 }  
 defer pgContainer.Terminate(ctx)

dsn, err := pgContainer.ConnectionString(ctx, "sslmode=disable")  
 if err != nil {  
 t.Fatal(err)  
 }

db, err := sql.Open("postgres", dsn)  
 if err != nil {  
 t.Fatal(err)  
 }  
 defer db.Close()

time.Sleep(2 * time.Second)

var now string  
 err = db.QueryRow("SELECT NOW()").Scan(&now)  
 if err != nil {  
 t.Fatal(err)  
 }  
 t.Log("Current time from DB:", now)  
}

### การ Seed ข้อมูลด้วย Init Script (Optional)

หากต้องการใส่ข้อมูลตั้งต้น เช่น schema หรือ test data สามารถใช้ไฟล์ `init.sql` ได้

  
CREATE TABLE users (  
 id SERIAL PRIMARY KEY,  
 name TEXT  
);INSERT INTO users (name) VALUES ('Alice'), ('Bob');
เพิ่ม script นี้เข้าไปตอนสร้าง container:

postgres.WithInitScripts("init.sql")

### ตัวอย่างการทดสอบ Repository

func TestUserRepo(t *testing.T) {  
 ctx := context.Background()  
 pg, _ := postgres.RunContainer(ctx, ...)  
 defer pg.Terminate(ctx)
dsn, _ := pg.ConnectionString(ctx, "sslmode=disable")  
 db, _ := sql.Open("postgres", dsn)  
 defer db.Close()

repo := NewUserRepo(db)

err := repo.Create(ctx, "Charlie")  
 if err != nil {  
 t.Fatal(err)  
 }

name, err := repo.GetByID(ctx, 1)  
 if name != "Charlie" {  
 t.Fatalf("expected Charlie, got %s", name)  
 }  
}

### Best Practices

- ใช้ `defer container.Terminate()` เพื่อให้ลบ container หลังเทสต์จบ
- ใช้ `init.sql` เท่าที่จำเป็น ทำให้เทสต์เร็วและเข้าใจง่าย
- ใช้ interface ช่วยให้เปลี่ยนไปใช้ fake/mock ได้ถ้าต้องการ
- รอ container readiness (เช่น sleep หรือ wait strategy) ป้องกันปัญหา test เร็วเกินไป

### ใช้งานบน CI/CD

สามารถรันบน GitHub Actions ได้ทันทีโดยไม่ต้องติดตั้ง Postgres เพิ่ม:

jobs:  
 integration-test:  
 runs-on: ubuntu-latest  
 steps:  
 - uses: actions/checkout@v3  
 - uses: actions/setup-go@v5  
 with:  
 go-version: '1.21'
- run: go mod tidy  
 - run: go test ./... -v

เพราะ `testcontainers` จะสร้างและลบ container ชั่วคราวให้เองระหว่างรันทดสอบ

`testcontainers-go` ช่วยให้คุณสามารถทำ Integration Test ได้อย่างเป็นระบบและมีประสิทธิภาพ มันทำให้การ spin up/tear down ของ service ภายนอกในระหว่างการทดสอบเป็นเรื่องง่าย และเหมาะกับทั้ง local development และ pipeline automation

หากคุณสนใจทำ integration test กับ Redis, Kafka หรือ MongoDB ก็สามารถต่อยอดจากแนวคิดเดียวกันนี้ได้เช่นกัน และถ้าคุณใช้ `gorm`, `sqlx`, หรือ `pgx` ก็สามารถเชื่อมต่อกับ container ที่สร้างจาก `testcontainers-go` ได้โดยตรง
