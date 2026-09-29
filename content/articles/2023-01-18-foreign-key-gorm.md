---
title: "บันทึกการใช้ foreign key ใน GORM"
author: "Nanpipat Klinpratoom"
published: "2023-01-18"
published_time: "2023-01-17T19:43:16Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%9A%E0%B8%B1%E0%B8%99%E0%B8%97%E0%B8%B6%E0%B8%81%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%83%E0%B8%8A%E0%B9%89-foreign-key-%E0%B9%83%E0%B8%99-gorm-5ca89dcd686c"
medium_id: "5ca89dcd686c"
---

# บันทึกการใช้ foreign key ใน GORM

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*BjMBILfid16wnYbs.png)

บังเอิญไปเจอปัญหามาตอนที่ query data โดยใช้ gorm แล้ว foreign key จากอีก table ดันไม่ใช่คอลัมน์ที่เป็น primary key เลยอยากจะมาเขียนบันทึกวิธีใช้ foreign key ใน gorm ในรูปแบบต่าง ๆ ไว้สักหน่อย

แบบแรกเลย การใช้ foreign key แบบเบสิคเลยครับ ซึ่งปกติถ้าเราไม่กำหนดอะไร gorm จะ references ไปหา primary key ของ table user ซึ่งก็คือ ID ซึ่งเราอาจจะกำหนดค่า references ได้ด้วยครับ

แบบต่อมาเลยคือการที่ foreign key เป็นคอลัมน์อื่น ๆ ที่ไม่ใช่ primary key ซึ่งวิธีนี้คุณควรทำ index ให้กับคอลัมน์นั้น ๆ ด้วย ไม่อย่างนั้นการ query อาจจะมีปัญหาเรื่องของระยะเวลาได้

ประมานนี้เลยครับ อย่าลืมเช็คให้ดีนะครับว่าคอลัมน์ที่นำมาทำ foreign key นั้นข้อมูลเข้ากันได้ ไม่อย่างนั้นอาจจะบึ้มก็เป็นได้ครับ
