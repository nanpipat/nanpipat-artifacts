---
title: "บันทึกการใช้ foreign key ใน GORM"
author: "Nanpipat Klinpratoom"
published: "2023-01-18"
published_time: "2023-01-17T19:43:16Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%9A%E0%B8%B1%E0%B8%99%E0%B8%97%E0%B8%B6%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%83%E0%B8%8A%E0%B9%89-foreign-key-%E0%B9%83%E0%B8%99-gorm-5ca89dcd686c"
medium_id: "5ca89dcd686c"
---

# บันทึกการใช้ foreign key ใน GORM

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*BjMBILfid16wnYbs.png)

Foreign Key เปรียบเหมือนเลขอ้างอิงบนใบเสร็จ มันบอกว่า Order แถวนี้เป็นของ User คนไหน และช่วยกันไม่ให้เราเขียนเลขลูกค้าที่ไม่มีอยู่จริงลงไปในฐานข้อมูล

GORM เดาความสัมพันธ์พื้นฐานให้ได้ดี แต่พอชื่อ Column ไม่มาตรฐาน หรืออยากอ้างอิงคอลัมน์อื่นที่ไม่ใช่ Primary Key เราต้องบอกให้ชัด ไม่อย่างนั้น ORM จะเดาเหมือนพนักงานส่งพัสดุที่เห็นแค่ชื่อเล่น—บางครั้งถึงบ้าน บางครั้งไปอีกซอยครับ

## กรณีพื้นฐาน ใช้ Primary Key ตาม Convention

สมมติ User หนึ่งคนมีหลาย Order:

```go
type User struct {
	ID     uint
	Name   string
	Orders []Order
}

type Order struct {
	ID     uint
	UserID uint
	Total  int64
	User   User
}
```

GORM เห็น `UserID` และ `User` แล้วเข้าใจว่า `orders.user_id` อ้างอิง `users.id` ตาม Convention เราสามารถ Preload ความสัมพันธ์ได้:

```go
var orders []Order
err := db.Preload("User").Find(&orders).Error
```

`Preload` ทำ Query ความสัมพันธ์เพิ่ม ส่วน `Joins` เหมาะเมื่ออยากรวมข้อมูลใน SQL เดียว การเลือกไม่ได้มีผู้ชนะตลอดกาล ต้องดูจำนวนแถว เงื่อนไข และ Query plan จริงครับ

## กำหนด Foreign Key และ References เอง

ถ้าชื่อไม่เป็นไปตาม Convention บอกผ่าน Tag:

```go
type User struct {
	ID       uint
	Username string `gorm:"uniqueIndex"`
}

type Order struct {
	ID            uint
	OwnerUsername string
	Owner         User `gorm:"foreignKey:OwnerUsername;references:Username"`
}
```

อ่าน Tag จากซ้ายไปขวา:

- `foreignKey:OwnerUsername` ใช้ Field ใดใน `Order` เป็นกุญแจ
- `references:Username` ให้กุญแจนั้นไปเทียบกับ Field ใดใน `User`

ใน Database ความสัมพันธ์คือ:

```text
orders.owner_username → users.username
```

## อ้างอิงคอลัมน์ที่ไม่ใช่ Primary Key ต้อง Unique

แค่มี Index ไม่พอเสมอไป ถ้า `users.username` ซ้ำได้ แล้ว Order ระบุ `somchai` เราจะไม่รู้ว่าหมายถึง Somchai คนไหน สำหรับ Foreign Key ที่อ้างอิง Candidate key คอลัมน์ปลายทางควรมี Unique constraint หรือ Unique index ตามกติกาของ Database

```go
Username string `gorm:"size:100;uniqueIndex"`
```

นอกจากนี้ Type, Length และ Collation ของสองคอลัมน์ควรเข้ากัน เช่น อย่าให้ฝั่งหนึ่งเป็น `varchar(100)` อีกฝั่งเป็นเลขจำนวนเต็ม แล้วหวังว่า ORM จะเป็นล่ามแปลภาษาให้ทุกครั้ง

ถ้าค่าธุรกิจอย่าง Username เปลี่ยนได้ การใช้มันเป็น Foreign Key จะทำให้การ Rename กระทบหลายแถว บ่อยครั้ง Surrogate key อย่าง UUID หรือ Numeric ID เหมาะกว่า แล้วเก็บ Username เป็น Unique field แยกต่างหาก

## ควบคุมพฤติกรรมตอน Update และ Delete

เรากำหนด Constraint action ได้:

```go
type Order struct {
	ID     uint
	UserID uint
	User   User `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
}
```

- `CASCADE` ส่งการเปลี่ยนแปลงต่อไปยังลูก
- `RESTRICT` หรือ `NO ACTION` ปฏิเสธถ้ายังมีข้อมูลอ้างอิง
- `SET NULL` ตั้ง Foreign Key เป็น `NULL` จึงต้องใช้ชนิดที่รองรับ Null เช่น `*uint`

เลือกตามความหมายของข้อมูล อย่าใส่ `OnDelete:CASCADE` ทุกที่เพราะสะดวก การลบ User หนึ่งคนแล้ว Order, Invoice และ Audit log หายต่อกันเหมือนโดมิโนอาจเป็นเหตุการณ์ที่ทีมจำไปอีกนานครับ

## Migration ต้องตรวจผลจริง

`AutoMigrate` ช่วยสร้าง Table, Column, Index และ Constraint หลายกรณี:

```go
if err := db.AutoMigrate(&User{}, &Order{}); err != nil {
	return err
}
```

แต่ Production ที่ต้องควบคุมลำดับการเปลี่ยน Schema และ Rollback ควรใช้ Migration แบบ Versioned เช่น SQL migration tool ที่ทีมเลือก อย่าถือว่า Struct Tag เป็นเอกสาร Database ทั้งหมด

หลัง Migration ให้ตรวจ Schema จริง:

- Foreign Key ถูกสร้างหรือไม่
- ชื่อ Constraint ถูกต้องไหม
- Column ปลายทาง Unique จริงหรือเปล่า
- `ON DELETE` และ `ON UPDATE` เป็นค่าที่ตั้งใจ
- Existing data ผ่าน Constraint ใหม่ทุกแถวไหม

การประกาศความสัมพันธ์ใน Go เพียงอย่างเดียวไม่ได้รับประกันว่า Database มี Constraint อยู่ ถ้าปิดการสร้าง Constraint ระหว่าง Migration หรือ Schema ถูกสร้างด้วยวิธีอื่น ข้อมูลกำพร้ายังเกิดได้ครับ

## Query แล้วความสัมพันธ์ว่าง ไม่ได้แปลว่า Foreign Key พัง

GORM ไม่โหลด Association ให้เองทุกครั้ง

```go
var order Order
err := db.First(&order, 1).Error
```

โค้ดนี้อาจได้ `order.User` เป็นค่าเริ่มต้น เพราะเรายังไม่ได้ Preload:

```go
err := db.Preload("User").First(&order, 1).Error
```

Foreign Key มีหน้าที่รักษาความสัมพันธ์ใน Database ส่วน Preload มีหน้าที่ดึงข้อมูลที่สัมพันธ์เข้ามาใน Struct เป็นคนละงานกัน เหมือนทะเบียนบ้านยืนยันว่าคนนี้อยู่บ้านไหน แต่ไม่ได้พาเจ้าของบ้านมานั่งข้างเราอัตโนมัติครับ

## Checklist เวลาความสัมพันธ์ไม่ทำงาน

1. Field ที่ระบุใน `foreignKey` อยู่ฝั่งถูกหรือไม่
2. Field ที่ระบุใน `references` สะกดตรงกับ Struct หรือไม่
3. Type และขนาด Column เข้ากันหรือไม่
4. คอลัมน์ปลายทางเป็น Primary key หรือ Unique หรือไม่
5. Database มี Constraint จริงหรือแค่มี Tag ในโค้ด
6. Existing data มีค่ากำพร้าหรือไม่
7. Query ต้องใช้ `Preload` หรือ `Joins` เพิ่มหรือเปล่า
8. Delete action ตรงกับ Business rule หรือไม่

## สรุป

กรณีมาตรฐาน GORM จะจับคู่ `UserID` กับ `User.ID` ให้เอง แต่เมื่ออ้างอิง Column อื่น เราต้องกำหนดทั้ง `foreignKey` และ `references` พร้อมดูแล Unique constraint, Type และพฤติกรรมตอนลบให้ครบ

จำง่าย ๆ ว่า ORM ช่วยเขียนแผนที่ แต่ Database เป็นคนเฝ้าประตูจริง เราจึงต้องตรวจทั้ง Struct Tag และ Schema ที่ถูกสร้างขึ้น ไม่เช่นนั้นความสัมพันธ์อาจสวยอยู่ในโค้ด แต่ข้อมูลข้างล่างแยกย้ายกันอยู่คนละโลกครับ

อ่านต่อจากเอกสารทางการ: [GORM belongs to associations](https://gorm.io/docs/belongs_to.html) และ [GORM constraints](https://gorm.io/docs/constraints.html)
