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

Mock database บอกเราได้ว่า Repository เรียก Method ถูกหรือไม่ แต่ตอบไม่ได้ว่า SQL syntax ใช้กับ PostgreSQL จริงไหม Migration รันผ่านหรือเปล่า และ Constraint ทำงานอย่างที่คิดหรือไม่ มันเหมือนซ้อมว่ายน้ำบนพรม—ท่าดูสวย แต่ยังไม่รู้ว่าลงน้ำแล้วจะลอยหรือจมครับ

`testcontainers-go` ช่วยเปิด Service จริงใน Container ชั่วคราวระหว่าง Test เช่น PostgreSQL, Redis, Kafka หรือ RabbitMQ Test จึงได้คุยกับของจริงโดยไม่ต้องติดตั้งทุก Service ลงเครื่องถาวร และเมื่อจบก็เก็บ Container ทิ้งให้

## Unit Test, Integration Test และ End to End Test

- **Unit test** ตรวจ Logic ชิ้นเล็ก แยก Dependency ออก เร็วมาก
- **Integration test** ตรวจว่าส่วนของเราเชื่อมกับ Database/Broker/API ได้จริง
- **End-to-end test** ตรวจเส้นทางระบบกว้างตั้งแต่จุดเข้าไปถึงผลลัพธ์

ไม่ต้องเลือกเพียงชนิดเดียว Unit test จำนวนมากช่วย Feedback เร็ว ส่วน Integration test จำนวนน้อยกว่าแต่จับปัญหาที่ Mock มองไม่เห็น ให้แต่ละชั้นทำหน้าที่เหมือนตะแกรงคนละขนาดครับ

## สิ่งที่ต้องมี

- Go project ที่ใช้ Module
- Docker Engine หรือ Runtime ที่ Testcontainers รองรับ
- สิทธิ์สร้าง Container
- Network และ Disk พอสำหรับ Image

ติดตั้ง:

```bash
go get github.com/testcontainers/testcontainers-go
go get github.com/testcontainers/testcontainers-go/modules/postgres
go get github.com/jackc/pgx/v5/stdlib
```

Pin Version ผ่าน `go.mod` และอัปเดตอย่างมีแผน อย่าใช้ API จาก Blog แล้วเดาว่ารุ่นใหม่ยังชื่อเหมือนเดิม เพราะ Testcontainers มีการปรับ Module API ตามเวลา ตัวอย่างปี 2026 ใช้ `postgres.Run` แทนรูปแบบ `RunContainer` รุ่นเก่าครับ

## เปิด PostgreSQL แล้วรอให้พร้อมจริง

ปัญหาคลาสสิกคือ Container มีสถานะ Running แต่ Database ยังเปิดรับ Connection ไม่พร้อม การ `time.Sleep(2 * time.Second)` เป็นการหลับตานับหนึ่งถึงสองแล้วหวังว่าร้านจะเปิด บางเครื่องเร็วก็เสียเวลารอ บาง CI ช้าก็ยังตื่นเร็วเกินไป

ใช้ Wait strategy รอ Signal จริง:

```go
package integration_test

import (
	"context"
	"database/sql"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

func TestPostgresIsReady(t *testing.T) {
	ctx := context.Background()

	container, err := postgres.Run(
		ctx,
		"postgres:16-alpine",
		postgres.WithDatabase("app_test"),
		postgres.WithUsername("test"),
		postgres.WithPassword("test"),
		testcontainers.WithAdditionalWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2),
			wait.ForListeningPort("5432/tcp"),
		),
	)
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() {
		if err := container.Terminate(context.Background()); err != nil {
			t.Logf("terminate postgres: %v", err)
		}
	})

	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatal(err)
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })

	if err := db.PingContext(ctx); err != nil {
		t.Fatal(err)
	}
}
```

Postgres จะ Log ว่าพร้อมสองครั้งเพราะช่วงเริ่มต้นอาจ Restart หลัง Initialize และการรอ Port เพิ่มช่วยลด Flaky test บน macOS/Windows ที่มี Network proxy ระหว่าง Host กับ Container ตามคำแนะนำในเอกสาร Module ครับ

## ใส่ Schema ด้วย Migration เดียวกับ Production

อย่าสร้าง Table ใน Test ด้วย SQL ชุดหนึ่ง แต่ Production ใช้ Migration อีกชุด เพราะ Test จะผ่านบนโลกคู่ขนาน ใช้เครื่องมือ Migration และไฟล์เดียวกับระบบจริง:

```go
func applyMigrations(ctx context.Context, db *sql.DB) error {
	statements := []string{
		`CREATE TABLE users (
			id BIGSERIAL PRIMARY KEY,
			email TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL
		)`,
	}

	for _, statement := range statements {
		if _, err := db.ExecContext(ctx, statement); err != nil {
			return err
		}
	}

	return nil
}
```

ตัวอย่างด้านบนทำให้บทความรันง่าย แต่โปรเจกต์จริงควรเรียก Migration runner ของทีมกับไฟล์จริง แล้วมี Test ยืนยันว่า Migration จาก Version ก่อนหน้าไป Versionใหม่ได้ด้วย

Testcontainers Postgres รองรับ Init script:

```go
postgres.WithInitScripts("testdata/init.sql")
```

เหมาะกับ Bootstrap เล็ก ๆ แต่ถ้า Script นั้นไม่ใช่ Source of truth ของ Production ต้องระวัง Schema drift ครับ

## ทดสอบ Repository จริง

สมมติ Repository:

```go
type UserRepository struct {
	db *sql.DB
}

func (r *UserRepository) Create(
	ctx context.Context,
	email string,
	name string,
) (int64, error) {
	var id int64
	err := r.db.QueryRowContext(
		ctx,
		`INSERT INTO users (email, name)
		 VALUES ($1, $2)
		 RETURNING id`,
		email,
		name,
	).Scan(&id)

	return id, err
}

func (r *UserRepository) FindByID(
	ctx context.Context,
	id int64,
) (string, string, error) {
	var email, name string
	err := r.db.QueryRowContext(
		ctx,
		`SELECT email, name FROM users WHERE id = $1`,
		id,
	).Scan(&email, &name)

	return email, name, err
}
```

Test:

```go
func TestUserRepositoryCreateAndFind(t *testing.T) {
	ctx := context.Background()
	db := newTestDatabase(t, ctx)

	if err := applyMigrations(ctx, db); err != nil {
		t.Fatal(err)
	}

	repo := &UserRepository{db: db}
	id, err := repo.Create(ctx, "nan@example.com", "Nan")
	if err != nil {
		t.Fatal(err)
	}

	email, name, err := repo.FindByID(ctx, id)
	if err != nil {
		t.Fatal(err)
	}

	if email != "nan@example.com" || name != "Nan" {
		t.Fatalf("got (%q, %q)", email, name)
	}
}
```

แยก `newTestDatabase` เป็น Helper เพื่อลดเสียงรบกวน แต่ไม่ซ่อนการสร้าง Container จนคนอ่าน Test ไม่รู้ว่ามี External dependency อยู่ครับ

## หนึ่ง Container ต่อ Test หรือแชร์ทั้ง Package

### Container ต่อ Test

ข้อดีคือ Isolation สูง Test ไม่ปนข้อมูลกัน ข้อเสียคือช้าและใช้ Resource มาก

### Container ต่อ Package

เปิดใน `TestMain` แล้วใช้หลาย Test เร็วกว่า แต่ต้อง Reset Database ระหว่าง Test ให้แน่นอน และ Parallel test ต้องไม่ชนกัน

ทางกลางที่ดีคือ Container เดียวแล้วสร้าง Database/Schema แยกต่อ Test หรือใช้ Snapshot feature ของ Postgres module เพื่อนำฐานข้อมูลกลับสถานะเดิม ตรวจ API ของ Version ที่ใช้ก่อนเลือกวิธี

อย่ารีบ `t.Parallel()` ให้ Test ที่แชร์ Database ถ้ายังไม่มี Isolation ทุก Test จะกลายเป็นเพื่อนร่วมห้องที่พร้อมย้ายเฟอร์นิเจอร์ของกันและกันตอนเราหันหลังครับ

## Error ต้องไม่ถูกทิ้ง

โค้ดตัวอย่างเก่ามักเขียน:

```go
container, _ := postgres.Run(...)
dsn, _ := container.ConnectionString(...)
```

ใน Test ก็ไม่ควรทิ้ง Error เพราะเมื่อ CI พัง เราจะได้ข้อความ Panic ไกลจากต้นเหตุ ใช้ `t.Fatal` พร้อม Context และ Cleanup ทุก Resource ให้ครบ

ตรวจกรณีล้มเหลวด้วย ไม่ใช่เฉพาะ Happy path:

- Unique constraint
- Foreign key violation
- Transaction rollback
- Context timeout/cancel
- Database restart หรือ Connection หลุดตามขอบเขต Test
- Migration failure

## รันบน CI

Runner ต้องเข้าถึง Container runtime ได้ GitHub-hosted Linux runner มี Docker ให้โดยทั่วไป:

```yaml
name: test

on:
  pull_request:
  push:

jobs:
  integration:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
          cache: true
      - run: go test -race -count=1 ./...
```

ถ้า Runner อยู่ใน Container หรือ Kubernetes การเข้าถึง Runtime ต้องออกแบบเพิ่ม อย่า Mount Docker socket ให้ Job ที่ไม่ไว้ใจโดยอัตโนมัติ เพราะสิทธิ์นั้นอาจเทียบเท่า Host root แยก Runner สำหรับ Integration test และจำกัด Repository ที่ใช้งานได้ครับ

## ทำให้ Test เร็วและเชื่อถือได้

- Pin Image เช่น `postgres:16-alpine` หรือ Digest
- ใช้ Wait strategy แทน `sleep`
- Pull image ล่วงหน้าใน CI cache ถ้าเหมาะสม
- ใช้ Migration จริงแต่ Seed เท่าที่ Test ต้องใช้
- ไม่พึ่งลำดับการรัน
- เก็บ Log ของ Container เมื่อ Test fail
- Cleanup ด้วย `t.Cleanup`
-ตั้ง Timeout ให้ Test และ Context
- แยก Test ที่ต้อง Container ด้วย Build tag ถ้าทีมต้องการ Suite เร็ว

ตัวอย่าง Build tag:

```go
//go:build integration
```

รัน:

```bash
go test -tags=integration -count=1 ./...
```

## สรุป

Testcontainers ทำให้ Integration test คุยกับ PostgreSQL จริงโดยไม่บังคับให้ Developer ดูแล Database ทดสอบถาวร เราเปิด Container รอให้ Service พร้อม รัน Migration และ Test Repository ก่อน Cleanup ทุกอย่าง

จุดอัปเดตสำคัญในปี 2026 คือใช้ Module API ปัจจุบันอย่าง `postgres.Run` และใช้ Wait strategy ที่ตรวจทั้ง Log กับ Port แทน `time.Sleep` Integration test ที่ดีไม่ควรเป็น Test ที่ช้าจนไม่มีใครอยากรัน หรือ Flaky จนทุกคนกด Retry เป็นพิธีครับ มันควรเป็นสะพานสั้น ๆ ที่พาโค้ดเราไปเจอของจริงก่อนผู้ใช้

อ่านต่อจากเอกสารทางการ:

- [Testcontainers for Go](https://golang.testcontainers.org/)
- [Postgres module and wait strategies](https://golang.testcontainers.org/modules/postgres/)
