---
title: "5 เคล็ดลับ การใช้ Chrome Dev Tools ที่ Web Developer ไม่ควรพลาด"
author: "Nanpipat Klinpratoom"
published: "2020-08-27"
published_time: "2020-08-26T18:34:21Z"
source_url: "https://medium.com/@nanpipat.k/5-%E0%B9%80%E0%B8%97%E0%B8%84%E0%B8%99%E0%B8%B4%E0%B8%84-%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%83%E0%B8%8A%E0%B9%89-chrome-dev-tools-%E0%B8%97%E0%B8%B5%E0%B9%88-front-end-developer-%E0%B8%95%E0%B9%89%E0%B8%AD%E0%B8%87%E0%B8%94%E0%B8%B9-8fcd196d41a3"
medium_id: "8fcd196d41a3"
---

# 5 เคล็ดลับ การใช้ Chrome Dev Tools ที่ Web Developer ไม่ควรพลาด

พูดถึง Chrome Dev Tools คงไม่มีชาว Web Developer คนไหนไม่รู้จัก เพราะเป็นเครื่องมือตัวหนึ่งที่ถือว่ามีประโยชน์มากกกกกกก สำหรับคนทำเว็บ ไม่ว่าจะเป็นการ Debugging , การแก้โครงสร้างของ html , css แบบทันที หรือแม้แต่การใช้ console จัดการกับ javascript ต่างๆ เป็นต้น โดยวันนี้เราจะลองมาดู 5 เทคนิคที่มีประโยชน์แต่เราอาจจะไม่ได้หยิบมาใช้ในชีวิตประจำวัน หรือมองข้ามไปกันครับ

## 1. Page Load Time Monitor

เราสามารถใช้ dev tools เพื่อดูเวลาในการโหลดหน้าเว็บไซต์ต่าง ๆ ได้ว่า ใช้เวลาในการโหลดมากน้อยแค่ไหน

- _เปิด dev tools ขึ้นมา แล้วไปที่แท็บ Network_
- _ไปที่รูปเฟืองตั้งค่าด้านขวามือ แล้วติ๊กที่ Capture screenshots_
- _กด ctrl + r หรือ F5 เพื่อรีเฟรชหน้าเว็บไซต์ของเรา_

![Image 2](https://miro.medium.com/v2/resize:fit:1000/1*CGDrxHkHpj9buV_Zb4MH4Q.png)

จะเห็นได้ว่าที่ console จะมีบอกวินาทีในการโหลดหน้าเว็บนั้น ๆ แบบเฟรมต่อเฟรมกันเลยทีเดียวครับ

![Image 3](https://miro.medium.com/v2/resize:fit:1000/1*XEJPZVwBJIiTSGtZuWVREg.png)

ซึ่งเรื่องของ page load speed นี้จะมีผลในเรื่อง SEO หรือ UX ด้วย ถือว่าเป็นส่วนสำคัญอย่างนึงเลยครับ

## 2. Capture Screen Features

หากคุณเจอปัญหาการ capture หน้าเว็บไซต์ ไม่ว่าจะเป็นการ capture ได้ไม่หมด หรือต้องคอยมา crop เอาเฉพาะส่วนที่ต้องการ แถมต้องพึ่งโปรแกรมเสริมให้ยุ่งยาก ลองใช้ dev tools ช่วยดูครับ

- _เปิด dev tools ขึ้นมาครับ_
- _กด ctrl + shift + P จะขึ้นช่องให้ใส่ command ดังรูปครับ_

![Image 4](https://miro.medium.com/v2/resize:fit:700/1*EoswevMZxqTsnVcng3xbSA.png)

- _ให้เราพิมพ์คำว่า capture ลงไป จะขึ้นมาดังภาพ_

![Image 5](https://miro.medium.com/v2/resize:fit:541/1*jtV41ym2vvrYSTI_cnp3Tw.png)

> **- Capture area screenshot** คือการเลือกพื้นที่ที่ต้องการจะ capture ได้ตามต้องการ
> 
> 
> **- Capture full size screenshot** คือการ capture หน้าเว็บไซต์นั้นทั้งหน้าไม่ว่าจะยาวแค่ไหน
> 
> 
> **- Capture node screenshot** จะเป็นการเลือก capture เฉพาะ node html ที่เราเลือก เช่น div , h1 , label เป็นต้น

หลังจากนั้นไฟล์ภาพก็จะถูกดาวน์โหลดเองโดยอัตโนมัติ ง่ายและสะดวกมาก ๆ เลยครับ

## 3. Design Mode

มาทดลองแก้ไข Design หน้าเว็บต่าง ๆ ก่อนที่จะไปลง code จริงกันดีไหม อาจช่วยลดเวลาการแก้ไขลงได้เยอะเลยนะ

- _เปิด dev tools ขึ้นมาเลยครับ_
- _ไปที่แท็บ Console_
- _พิมพ์คำว่า_`document.designMode="on"`

![Image 6](https://miro.medium.com/v2/resize:fit:318/1*3TE2HOeYe3ETPhuDqFcdgg.png)

เท่านี้นะครับหน้าเว็บของเราก็จะเหมือนกับหน้ากระดาษบน ms word ที่สามารถ แก้ไขข้อความหรือเพิ่มลบส่วนต่าง ๆ ได้ โดยรูปแบบจะอิงจาก styles ของตัว element นั่นเองครับ

![Image 7](https://miro.medium.com/v2/resize:fit:700/1*b0a0NfmMQwJYTMqP9kdB8Q.png)

เหมาะสำหรับเวลาอยากจะจัด ปรับแต่ง หรือลองเพิ่มลบ โดยที่เราไม่ต้อง rebuild ใหม่เลยครับ

## 4. Current Location

ทำยังไงถ้าต้องการจะกำหนดตำแหน่งที่อยู่ของเราเอง แต่ไม่อยากโหลดโปรแกรมเสริมเลย ลองวิธีนี้ดูครับ

- _เปิด dev tools ขึ้นมาครับ_
- _แล้วเปิด command ( ctrl + shift + P )_
- _พิมพ์คำสั่ง_`Show Sensors`_ลงไปครับ แล้วกด enter_

![Image 8](https://miro.medium.com/v2/resize:fit:700/1*5VFyaOHJ9Z9626INPy0rIw.png)

จะเห็นได้ว่าจะมีแท็บ Sensors เพิ่มขึ้นมา ให้เราสามารถกำหนดค่าของ location ที่เราต้องการได้เลยครับ

![Image 9](https://miro.medium.com/v2/resize:fit:700/1*MfQLWAVWDBXB_6Vr9yTu8w.png)

เพียงแค่นี้ location ปัจจุบัน ณ ตอนนั้นที่หน้าเว็บไซต์ ก็จะเปลี่ยนไปเป็นที่ที่เราต้องการแล้วครับ เหมาะสำหรับการ dev บน pc ที่ไม่มีตัวจับสัญญาณ gps ว่าตอนนี้เราอยู่ที่ไหน หรืออาจะเหมาะสำหรับผู้ที่เขียน Mobile apps แต่รันบนเว็บบราวเซอร์ และต้องการใช้ location ครับ

## 5. Base64 Image

นอกจากที่ dev tools จะสามารถดู link url ของรูปภาพนั้น ๆ ได้แล้ว ยังสามารถดู data url ของรูปภาพได้อีกด้วย

- _เปิด dev tools เลยครับ_
- _ไปที่แท็บ Network_
- _ไปที่แท็บ Img_
- _จะเห็นว่ามีข้อมูลของรูปภาพต่าง ๆ บนหน้าเว็บไซต์ที่เราเปิดอยู่ (หากไม่ขึ้น ให้รีเฟรชหน้าเว็บครับ)_
- _จากนั้นเลือกภาพที่เราต้องการครับ_
- _ไปที่แท็บ Preview_

![Image 10](https://miro.medium.com/v2/resize:fit:636/1*47S4CWMJjWtXKnvglWoGyw.png)

- _คลิกขวาที่รูปที่ต้องการเลยครับ_
- _แล้วเลือก Copy image as data URI_

![Image 11](https://miro.medium.com/v2/resize:fit:311/1*KrkXa4P5Xwpxly3ZQ_mjQw.png)

- _กด paste ที่ไหนสักที่ครับ_

![Image 12](https://miro.medium.com/v2/resize:fit:700/1*MCr6nTiXE7ZQZ_Ex5Mcvdg.png)

เพียงเท่านี้เราก็จะได้ data URL ในฟอร์แมต base64 ของรูปภาพนั้นมาแล้วครับ

เป็นยังไงบ้างครับกับทริคเล็ก ๆ น้อย ๆ นี้ ซึ่งความจริงแล้วตัว dev tools นี้สามารถทำอะไรได้อีกเยอะแยะมากมายเลย ที่หยิบยกมานี่เป็นเพียงบางส่วนที่ผมคิดว่ามันค่อนข้างจะน่าสนใจ หวังว่าจะมีประโยชน์ไม่มากก็น้อยนะครับ
