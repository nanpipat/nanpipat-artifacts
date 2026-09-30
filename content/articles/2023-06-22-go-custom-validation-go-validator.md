---
title: "[GO] Custom Validation ด้วย Go Validator"
author: "Nanpipat Klinpratoom"
published: "2023-06-22"
published_time: "2023-06-22T10:57:03Z"
source_url: "https://medium.com/@nanpipat.k/go-custom-validation-%E0%B8%94%E0%B9%89%E0%B8%A7%E0%B8%A2-go-validator-d35167063a51"
medium_id: "d35167063a51"
---

# [GO] Custom Validation ด้วย Go Validator

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*CPyXyDSvGAzZ8A1z)

ข้อมูลจากผู้ใช้เหมือนแขกที่มาเคาะประตู API ครับ บางคนกรอกครบ บางคนลืม Email บางคนส่งอายุเป็น `-42` และบางคนพยายามยัดข้อความยาวเท่านิยายสามเล่มลงช่องชื่อ เราจึงต้องมีพนักงานหน้าประตูคอยตรวจรูปแบบก่อนปล่อยข้อมูลเข้า Business logic

`go-playground/validator` เป็น Library ยอดนิยมสำหรับตรวจ Struct และ Field ผ่าน Tag มี Validator สำเร็จรูปอย่าง `required`, `email`, `min`, `max` และ `oneof` แต่เมื่อกฎเป็นภาษาของธุรกิจ เช่น Username ต้องขึ้นต้นด้วยตัวอักษร หรือ Code ต้องผ่าน Checksum เราสร้าง Custom Validation เองได้ครับ

## ติดตั้งและสร้าง Validator หนึ่ง Instance

```bash
go get github.com/go-playground/validator/v10
```

![Image 3](https://miro.medium.com/v2/resize:fit:700/1*om0wu02-wOAuoK3oz1kHlA.png)

Import Package:

```go
import "github.com/go-playground/validator/v10"
```

![Image 4](https://miro.medium.com/v2/resize:fit:700/1*Eg8V50tNilOaX9U8P3nMsg.png)

ในปี 2026 Library ยังอยู่ที่ Major version 10 และเอกสารแนะนำให้เปิดพฤติกรรม Required Struct แบบใหม่ล่วงหน้า ซึ่งจะกลายเป็นค่าเริ่มต้นใน v11:

```go
var validate = validator.New(validator.WithRequiredStructEnabled())
```

ควร Reuse Instance นี้แทนสร้างใหม่ทุก Request เพราะ Validator Cache ข้อมูลของ Struct และ Tag ไว้ การสร้างทุกครั้งเหมือนจ้างพนักงานใหม่แล้วสอนกฎบริษัทซ้ำทุกครั้งที่แขกเดินเข้าประตูครับ

## เริ่มจาก Built in Tag ก่อน

```go
type CreateUserRequest struct {
	Name  string `json:"name" validate:"required,min=2,max=100"`
	Email string `json:"email" validate:"required,email"`
	Role  string `json:"role" validate:"required,oneof=admin member viewer"`
}
```

```go
request := CreateUserRequest{
	Name:  "Nan",
	Email: "nan@example.com",
	Role:  "member",
}

if err := validate.Struct(request); err != nil {
	return err
}
```

อย่าเขียน Custom validator ถ้าของเดิมทำได้อยู่แล้ว เพราะ Validator ที่เราสร้างเองคือโค้ดที่ต้อง Test, Document และดูแลเพิ่มครับ

## สร้าง Custom Validation ระดับ Field

สมมติ Username ต้องขึ้นต้นด้วยตัวอักษรอังกฤษ และตามด้วยตัวอักษร ตัวเลข หรือ `_` รวม 3–20 ตัว

```go
var usernamePattern = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_]{2,19}$`)

func validUsername(fl validator.FieldLevel) bool {
	return usernamePattern.MatchString(fl.Field().String())
}
```

![Image 5](https://miro.medium.com/v2/resize:fit:700/1*VQNBvG4pSnO1HMqAjlOsNg.png)

`FieldLevel` เปิดให้เราอ่าน Field ปัจจุบัน ชื่อ Field ค่า Parameter จาก Tag และ Context ของ Struct ได้ สำหรับ Validation ง่าย ๆ เราดึง String แล้วคืน `true` เมื่อผ่าน

Register ชื่อ Tag ก่อนใช้งาน:

```go
if err := validate.RegisterValidation("username", validUsername); err != nil {
	log.Fatal(err)
}
```

![Image 6](https://miro.medium.com/v2/resize:fit:700/1*hk5DsF0_3YAjbTIfrxY7lQ.png)

จากนั้นใช้ใน Struct:

```go
type CreateUserRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=100"`
	Email    string `json:"email" validate:"required,email"`
	Username string `json:"username" validate:"required,username"`
}
```

![Image 7](https://miro.medium.com/v2/resize:fit:700/1*TETG5rWtnnQ7v7SPYIhs7w.png)

เรียกเหมือน Validator ปกติ:

```go
input := CreateUserRequest{
	Name:     "Nan",
	Email:    "nan@example.com",
	Username: "nan_dev",
}

err := validate.Struct(input)
```

![Image 8](https://miro.medium.com/v2/resize:fit:700/1*eDmRGMhuH3cARyWPTBAGrg.png)

## แยก Error อย่างปลอดภัย อย่า Type assert ตรง ๆ

ถ้าข้อมูลถูก `validate.Struct()` จะคืน `nil` การเขียน `err.(validator.ValidationErrors)` ทันทีจึง Panic ได้ ใช้ `errors.As` แทน:

```go
err := validate.Struct(input)
if err == nil {
	return nil
}

var validationErrors validator.ValidationErrors
if errors.As(err, &validationErrors) {
	for _, fieldError := range validationErrors {
		fmt.Printf(
			"field=%s tag=%s value=%v\n",
			fieldError.Field(),
			fieldError.Tag(),
			fieldError.Value(),
		)
	}
	return err
}

return fmt.Errorf("invalid validation input: %w", err)
```

Library แยก `ValidationErrors` สำหรับข้อมูลที่ไม่ผ่าน และ `InvalidValidationError` สำหรับการเรียก Validator ผิดวิธี ชั้น HTTP ควรแปลง Error เหล่านี้เป็น Response ของระบบเอง ไม่ส่ง Internal error ดิบทั้งหมดให้ Client

## ใช้ชื่อ JSON ใน Error แทนชื่อ Field ของ Go

ผู้ใช้ส่ง `username` มา เขาไม่จำเป็นต้องรู้ว่า Struct ใช้ชื่อ `Username` Register TagName function เพื่อดึงชื่อจาก `json` tag:

```go
validate.RegisterTagNameFunc(func(field reflect.StructField) string {
	name := strings.SplitN(field.Tag.Get("json"), ",", 2)[0]
	if name == "-" {
		return ""
	}
	return name
})
```

จากนั้น `fieldError.Field()` จะคืนชื่อที่ตรงกับ API มากขึ้น ทำให้ Response อ่านง่าย:

```json
{
  "errors": [
    {
      "field": "username",
      "code": "username",
      "message": "username ใช้ได้เฉพาะตัวอักษร ตัวเลข และ _"
    }
  ]
}
```

อย่าผูกข้อความภาษาไทยทั้งหมดไว้ใน Validator function ให้คืนเพียงผ่านหรือไม่ผ่าน แล้วแปลง Tag เป็น Error code หรือข้อความตาม Locale ในชั้น Presentation จะดูแลง่ายกว่าครับ

## กฎที่ต้องดูหลาย Field ใช้ Struct level Validation

สมมติถ้า `Role` เป็น `admin` ต้องมี `AdminReason` การตรวจ Field เดียวมองภาพไม่ครบ:

```go
type CreateUserRequest struct {
	Role        string `json:"role" validate:"required,oneof=admin member"`
	AdminReason string `json:"admin_reason"`
}

func validateCreateUser(sl validator.StructLevel) {
	request := sl.Current().Interface().(CreateUserRequest)

	if request.Role == "admin" && strings.TrimSpace(request.AdminReason) == "" {
		sl.ReportError(
			request.AdminReason,
			"AdminReason",
			"admin_reason",
			"required_for_admin",
			"",
		)
	}
}
```

Register:

```go
validate.RegisterStructValidation(validateCreateUser, CreateUserRequest{})
```

Library มี Cross-field tag เช่น `eqfield`, `gtefield` อยู่แล้ว ควรใช้ของเดิมเมื่อกฎเป็นการเปรียบเทียบตรง ๆ และใช้ Struct-level เมื่อกฎมีความหมายทางธุรกิจมากขึ้น

## Validation ไม่ควร Query Database แบบซ่อน ๆ

คำถามว่า “Email นี้มีคนใช้หรือยัง” ไม่ใช่ Format validation ธรรมดา มันต้องคุยกับ Database และมี Race condition ต่อให้ตรวจว่าไม่ซ้ำผ่าน อีก Request อาจ Insert ก่อนเราได้

แนวทางที่แข็งแรงกว่า:

1. ใช้ Validator ตรวจรูปแบบ Email
2. ให้ Service ตรวจเงื่อนไขธุรกิจถ้าต้องการ Error ที่เป็นมิตร
3. บังคับ Unique constraint ใน Database เป็นด่านสุดท้าย
4. แปลง Constraint error เป็น Conflict response

อย่าเอา Database call ซ่อนไว้ใน Field validator จนการตรวจ Struct ธรรมดากลายเป็น Network operation ที่คนเรียกไม่รู้ตัวครับ

## เขียน Table driven Test ให้ Custom Rule

```go
func TestValidUsername(t *testing.T) {
	v := validator.New(validator.WithRequiredStructEnabled())
	if err := v.RegisterValidation("username", validUsername); err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name     string
		username string
		wantErr  bool
	}{
		{name: "valid", username: "nan_dev", wantErr: false},
		{name: "too short", username: "na", wantErr: true},
		{name: "starts with number", username: "1nan", wantErr: true},
		{name: "contains dash", username: "nan-dev", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			input := struct {
				Username string `validate:"required,username"`
			}{Username: tt.username}

			err := v.Struct(input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("error = %v, wantErr = %v", err, tt.wantErr)
			}
		})
	}
}
```

Test ทั้งขอบล่าง ขอบบน Unicode ช่องว่าง และค่าที่ดูคล้ายถูก การทดสอบ Validator เหมือนตรวจตะแกรง ต้องลองทั้งก้อนที่ผ่านได้และก้อนที่ควรติดครับ

## สรุป

Custom Validation มีขั้นตอนหลักเพียงสามอย่าง:

1. เขียน Function ที่รับ `validator.FieldLevel` และคืน Boolean
2. Register ชื่อ Tag กับ Validator Instance ที่ Reuse ร่วมกัน
3. ใช้ Tag ใน Struct และแปลง `ValidationErrors` เป็นรูปแบบของ API

เริ่มจาก Built-in rule ก่อน ใช้ Struct-level rule เมื่อหลาย Field เกี่ยวข้อง และปล่อยกฎที่ต้องพึ่ง Database ไปอยู่ชั้น Service กับ Constraint อย่าให้พนักงานตรวจบัตรหน้าประตูต้องวิ่งไปถามฝ่ายบัญชีทุกครั้งที่มีแขกเข้ามาครับ

อ่านต่อจากเอกสารทางการ: [go-playground validator](https://github.com/go-playground/validator) และ [Custom validation example](https://github.com/go-playground/validator/tree/master/_examples/custom-validation)
