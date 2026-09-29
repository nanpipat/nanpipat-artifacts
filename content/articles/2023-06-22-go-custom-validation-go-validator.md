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

**เกริ่นสักนิดสักหน่อย 😎**

Go Validator เป็นไลบรารีที่มีประสิทธิภาพและยืดหยุ่นที่ช่วยให้นักพัฒนาสามารถตรวจสอบข้อมูลในแอปพลิเคชัน Go ได้ง่ายขึ้น ซึ่งในตัว package นั้นมีการ validate หลากหลายให้เลือกใช้ แต่ถึงอย่างนั้น มันก็อาจจะมีบางทีที่เราอยากจะปรับแต่งการ validate บางอย่างของเราเอง วันนี้เราเลยจะมาลองทำ custom validation แบบง่าย ๆ โดยใช้ Go Validator กันดูครับ

**มาเริ่มกันเลยครับ**

ขั้นแรกตอนแรก เดี๋ยวเราจะมาติดตั้งและเรียกใช้ตัว package Go Validator กันก่อนครับ

![Image 3](https://miro.medium.com/v2/resize:fit:700/1*om0wu02-wOAuoK3oz1kHlA.png)

![Image 4](https://miro.medium.com/v2/resize:fit:700/1*Eg8V50tNilOaX9U8P3nMsg.png)

ต่อไปเราจะมาลองสร้าง Custom Validation กันนะครับ โดยจะเป็นการสร้าง go function หนึ่งตัว ที่จะส่งเข้าไปให้ go-validator นั้นเช็คความถูกต้อง โดยใน function จะเป็นการ custom ในสิ่งที่เราต้องการจะ validate นั่นเอง

![Image 5](https://miro.medium.com/v2/resize:fit:700/1*VQNBvG4pSnO1HMqAjlOsNg.png)

ในตัวอย่างด้านบน เรากำหนดฟังก์ชันการตรวจสอบที่กำหนดเองชื่อ validateCustomName ซึ่งรับค่าในรูปแบบของ validator.FieldLevel ซึ่งให้เราเข้าถึงฟิลด์ที่จะ validate ภายในฟังก์ชัน เราดึงค่าของฟิลด์โดยใช้ fl.Field().String() และนำมาเช็คเงื่อนไขตามที่เราต้องการเอง

ขั้นตอนต่อไป หลังจากเราสร้าง function custom มาแล้วเราจะมา register มันเข้าไป เพื่อให้ go-validator นั้นรู้จักสิ่งที่เราสร้างขึ้นมา

![Image 6](https://miro.medium.com/v2/resize:fit:700/1*hk5DsF0_3YAjbTIfrxY7lQ.png)

ขึ้นตอนต่อไป เราจะลองมาดูวิธีเรียกใช้ validation ที่เรา custom ขึ้นมานะครับ โดยเราจะทำในขั้นตอนที่เราสร้าง model หรือ struct ขึ้นมานั่นเอง

![Image 7](https://miro.medium.com/v2/resize:fit:700/1*TETG5rWtnnQ7v7SPYIhs7w.png)

ในตัวอย่างด้านบน เรากำหนด User struct ที่มีฟิลด์ชื่อ Name เราใช้ตัว custom validation ที่ทำขึ้นมา โดยเพิ่ม customName เข้าไปในแท็ก validate นอกจากนี้ เรายังใช้แท็ก required เพื่อให้แน่ใจว่าฟิลด์ไม่เป็นค่าว่าง

ขั้นตอนสุดท้าย เราจะลองมาดูวิธีเรียกใช้กันครับ

![Image 8](https://miro.medium.com/v2/resize:fit:700/1*eDmRGMhuH3cARyWPTBAGrg.png)

ในโค้ดตัวอย่างด้านบน สร้าง User struct และกำหนดค่าให้กับฟิลด์ Name จากนั้น เราเรียกใช้ v.Struct(user) เพื่อทำการตรวจสอบฟิลด์ด้านใน หากมีข้อผิดพลาดในการตรวจสอบ จะถูกส่งคืนในรูปแบบของ error ของ Go Validator นั่นเอง
