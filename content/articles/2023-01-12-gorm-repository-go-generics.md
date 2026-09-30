---
title: "มาลองทำ gorm repository โดยใช้ Go Generics กันครับ"
author: "Nanpipat Klinpratoom"
published: "2023-01-12"
published_time: "2023-01-12T07:34:09Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%A1%E0%B8%B2%E0%B8%A5%E0%B8%AD%E0%B8%87%E0%B8%97%E0%B8%B3-gorm-repository-%E0%B9%82%E0%B8%94%E0%B8%A2%E0%B9%83%E0%B8%8A%E0%B9%89-go-generics-%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A-5f40d9955193"
medium_id: "5f40d9955193"
---

# มาลองทำ gorm repository โดยใช้ Go Generics กันครับ

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*Gm8A79k_thPeVUdh.png)

พอ Service มีหลาย Table เรามักได้ Repository หน้าตาคล้ายกันเต็มโปรเจกต์: `CreateUser`, `CreateProduct`, `CreateOrder` ต่างกันแทบแค่ชื่อ Model การ Copy โค้ดช่วยให้เริ่มเร็ว แต่เมื่ออยากเพิ่ม Context, Transaction หรือ Error handling ทีหนึ่ง เราต้องเดินแก้เหมือนเปลี่ยนหลอดไฟในโรงแรม 200 ห้อง

Go Generics ช่วยรวมพฤติกรรม CRUD ที่เหมือนกันไว้ใน Repository กลาง โดยยังรักษา Type ของ Model เอาไว้ แต่ก่อนเริ่มต้องอัปเดตข่าวสำคัญของปี 2026 ก่อนครับ: ตั้งแต่ GORM v1.30 ขึ้นไปมี **Generics API ทางการ** ผ่าน `gorm.G[T]` แล้ว เราจึงมีสองทางเลือก

1. ใช้ Generics API ของ GORM โดยตรง ถ้าต้องการ Query แบบ Type-safe โดยไม่เพิ่ม Abstraction
2. สร้าง Repository ของเราเอง เมื่ออยากกำหนดขอบเขตของ Domain, ซ่อน GORM หรือรวม Policy ที่ทุก Query ต้องทำเหมือนกัน

Repository ไม่ควรถูกสร้างเพียงเพราะ Architecture diagram มีช่องว่างหนึ่งช่องครับ ถ้ามันแค่เปลี่ยนชื่อ `db.Create` เป็น `repo.Create` โดยไม่เพิ่มความหมาย เราอาจกำลังห่อของขวัญกล่องเปล่าอยู่

## เริ่มจาก Generics API ที่ GORM มีให้

ตัวอย่าง Model:

```go
type User struct {
	ID    uint   `gorm:"primaryKey"`
	Email string `gorm:"uniqueIndex"`
	Name  string
}
```

สร้างและค้นข้อมูลผ่าน API แบบ Generic:

```go
ctx := context.Background()

err := gorm.G[User](db).Create(ctx, &User{
	Email: "gopher@example.com",
	Name:  "Gopher",
})
if err != nil {
	return err
}

user, err := gorm.G[User](db).
	Where("email = ?", "gopher@example.com").
	First(ctx)
if err != nil {
	return err
}
```

ผลลัพธ์ของ `First` เป็น `User` โดยตรง ไม่ต้องประกาศตัวแปรปลายทางแล้วส่ง Pointer เข้า `Find` แบบ API ดั้งเดิม นอกจากนี้ Context ถูกส่งเข้าทุก Operation อย่างชัดเจน

ถ้าโจทย์มีแค่นี้ ใช้ของ GORM ตรง ๆ ก็เพียงพอและอ่านง่ายครับ

## สร้าง Generic Repository เมื่อมีเหตุผลด้านระบบ

สมมติทีมอยากให้ CRUD พื้นฐานอยู่หลัง Interface เพื่อ Mock ใน Unit test หรือเปลี่ยน Implementation ได้ เราเริ่มจาก Contract เล็ก ๆ:

```go
type Repository[T any, ID comparable] interface {
	Create(ctx context.Context, value *T) error
	FindByID(ctx context.Context, id ID) (T, error)
	FindAll(ctx context.Context) ([]T, error)
	DeleteByID(ctx context.Context, id ID) error
}
```

ทำไมต้องมี `ID` แยกอีก Type เพราะ Primary key ไม่ได้เป็น `uint` เสมอ บางระบบใช้ UUID หรือ String การบังคับ Type เดียวเท่ากับสร้างรองเท้าเบอร์เดียวแล้วประกาศว่าทุกคนใส่ได้ครับ

Implementation ด้วย GORM Generics API:

```go
type GormRepository[T any, ID comparable] struct {
	db *gorm.DB
}

func NewGormRepository[T any, ID comparable](db *gorm.DB) *GormRepository[T, ID] {
	return &GormRepository[T, ID]{db: db}
}

func (r *GormRepository[T, ID]) Create(ctx context.Context, value *T) error {
	return gorm.G[T](r.db).Create(ctx, value)
}

func (r *GormRepository[T, ID]) FindByID(ctx context.Context, id ID) (T, error) {
	return gorm.G[T](r.db).
		Where("id = ?", id).
		First(ctx)
}

func (r *GormRepository[T, ID]) FindAll(ctx context.Context) ([]T, error) {
	return gorm.G[T](r.db).Find(ctx)
}

func (r *GormRepository[T, ID]) DeleteByID(ctx context.Context, id ID) error {
	result := r.db.WithContext(ctx).
		Where("id = ?", id).
		Delete(new(T))

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
```

ใช้งานกับ `User`:

```go
userRepo := NewGormRepository[User, uint](db)

user, err := userRepo.FindByID(ctx, 42)
if err != nil {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrUserNotFound
	}
	return fmt.Errorf("find user: %w", err)
}
```

Type ของ Repository ถูกกำหนดตั้งแต่สร้าง `NewGormRepository[User, uint]` จึงไม่มีทางเผลอรับ Product กลับจาก Repository นี้

## อย่าทำ Generic จน Business Rule หายไป

CRUD กลางเหมาะกับ Operation ทั่วไป แต่ Query จริงมักมีภาษาเฉพาะของ Domain เช่น “หา Order ที่ยังจ่ายไม่ครบ” หรือ “ล็อกบัญชีที่พยายาม Login ผิดเกินกำหนด” ถ้ายัดทุกอย่างเป็น `Where(query any, args ...any)` Repository จะกลายเป็น GORM ปลอมที่ Type safety หายไปครึ่งหนึ่ง

สร้าง Repository เฉพาะ Domain ต่อจากของกลางได้:

```go
type UserRepository struct {
	*GormRepository[User, uint]
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{
		GormRepository: NewGormRepository[User, uint](db),
	}
}

func (r *UserRepository) FindByEmail(
	ctx context.Context,
	email string,
) (User, error) {
	return gorm.G[User](r.db).
		Where("email = ?", email).
		First(ctx)
}
```

ตอนนี้ชื่อ Method เล่าเจตนาของระบบได้ และถ้าวันหนึ่ง Schema เปลี่ยนจาก `email` ไปใช้ Normalized column ผู้เรียกไม่ต้องรู้รายละเอียด

## Transaction ต้องส่ง DB ชุดเดียวกันไปตลอดทาง

กับดักยอดนิยมคือเริ่ม Transaction แต่ Repository ยังใช้ `r.db` ตัวเดิมนอก Transaction เหมือนบอกทุกคนให้ขึ้นรถคันเดียวกัน แต่ Repository แอบขึ้น Taxi อีกคัน

เพิ่ม Method สำหรับผูก Repository กับ `*gorm.DB` ใหม่:

```go
func (r *GormRepository[T, ID]) WithDB(db *gorm.DB) *GormRepository[T, ID] {
	return &GormRepository[T, ID]{db: db}
}
```

แล้วใช้ภายใน Transaction:

```go
err := db.Transaction(func(tx *gorm.DB) error {
	txUsers := userRepo.GormRepository.WithDB(tx)

	if err := txUsers.Create(ctx, &user); err != nil {
		return err
	}

	return tx.Create(&auditLog).Error
})
```

ถ้า Transaction ครอบหลาย Repository อาจสร้าง Unit of Work หรือส่ง `tx` ให้ Constructor ของแต่ละ Repositoryอย่างชัดเจน แนวไหนก็ได้ ขอเพียงทุก Operation ที่ต้อง Atomic ใช้ Transaction เดียวกันจริง ๆ

## Pagination และ Order ต้องไม่เปิดประตูให้ SQL Injection

ค่าที่ใช้ใน `WHERE` ส่งผ่าน Placeholder ได้ แต่ชื่อ Column และทิศทาง Sort มัก Parameterize ไม่ได้ อย่านำข้อความจาก Query string ไปต่อใน `Order` ตรง ๆ

```go
var allowedSort = map[string]string{
	"name":       "name",
	"created_at": "created_at",
}

func safeSort(input string) string {
	column, ok := allowedSort[input]
	if !ok {
		return "created_at"
	}
	return column
}
```

จากนั้นกำหนดเพดาน Page size ด้วย ไม่อย่างนั้น Endpoint `?limit=999999999` อาจเปลี่ยน Repository ให้กลายเป็นบริการย้ายฐานข้อมูลออกทาง HTTP ครับ

## Test อะไรบ้าง

Generic Repository ควรมี Integration test กับ Database จริงหรือ Container ชั่วคราว เพราะพฤติกรรมของ ORM ขึ้นกับ Driver, Constraint และ Transaction มากเกินกว่าจะมั่นใจจาก Mock อย่างเดียว

อย่างน้อยทดสอบ:

- Create แล้ว ID หรือ Generated field ถูกเติม
- Find ข้อมูลที่มีและไม่มี
- Delete แล้วตรวจ `RowsAffected`
- Context timeout หรือ cancellation
- Constraint violation
- Transaction rollback
- Soft delete ถ้า Model ใช้ `gorm.DeletedAt`

ส่วน Service ที่พึ่ง Interface สามารถใช้ Fake repository เพื่อทดสอบ Business rule ได้เร็วขึ้น แบ่งหน้าที่ให้ Test แต่ละชั้นเหมือนทีมฟุตบอล—ผู้รักษาประตูไม่จำเป็นต้องวิ่งยิงทุกลูกเองครับ

## Checklist ก่อนสร้าง Repository กลาง

- ใช้ GORM Generics API ตรง ๆ เพียงพอหรือยัง
- Generic Method เพิ่มความหมาย หรือแค่เปลี่ยนชื่อ API เดิม
- รองรับ Context ทุก Operation
- Error ถูกแปลงเป็น Domain error ที่ชั้นเหมาะสม
- Transaction ใช้ `*gorm.DB` ชุดเดียวกัน
- ไม่เปิด Query builder ดิบให้ทุกชั้นจน Abstraction รั่ว
- Sort และ Filter ที่มาจากผู้ใช้ถูก Allowlist
- มี Integration test กับ Database จริง
- Public API ของ Repository เล็กพอที่จะดูแลระยะยาว

## สรุป

Go Generics ช่วยตัด CRUD ที่ซ้ำกันได้จริง แต่ในปี 2026 เราควรรู้ก่อนว่า GORM มี Generics API ของตัวเองแล้ว ถ้าเพียงอยากได้ Query แบบ Type-safe ใช้ `gorm.G[T]` ตรง ๆ อาจง่ายและชัดที่สุด

สร้าง Generic Repository เพิ่มเมื่อมันรวม Policy ซ่อนรายละเอียด Persistence หรือทำให้ Domain อ่านง่ายขึ้นเท่านั้น ส่วน Query ที่มีความหมายทางธุรกิจควรมีชื่อของมันเอง อย่าบีบทุกปัญหาให้ผ่าน `FindAll` กับ `Where` จน Repository กลางกลายเป็นกล่องอเนกประสงค์ที่ใครก็เปิด แต่ไม่มีใครกล้าแก้ครับ

อ่านต่อจากเอกสารทางการ: [GORM Generics API](https://gorm.io/docs/the_generics_way.html) และ [GORM Guides](https://gorm.io/docs/)
