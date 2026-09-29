---
title: "Puppeteer กับการ deploy"
author: "Nanpipat Klinpratoom"
published: "2022-08-21"
published_time: "2022-08-21T14:31:52Z"
source_url: "https://medium.com/@nanpipat.k/puppeteer-%E0%B8%81%E0%B8%B1%E0%B8%9A%E0%B8%81%E0%B8%B2%E0%B8%A3-deploy-44435eb7ff95"
medium_id: "44435eb7ff95"
---

# Puppeteer กับการ deploy

**การ deploy แบบ serverless**

มาดูวิธีแรกกันก่อน คือวิธีที่ผมใช้อยู่ ซึ่งด้วยความที่ผมต้องการจะใช้ free hosting บวกกับโปรเจคนี้ใช้ Nextjs เป็นหลัก ผมจึงเลือก Vercel เป็น hosting ในครั้งนี้ ซึ่งตัว Vercel เนี่ยมันสามารถ deploy api แบบ serverless ได้ด้วย ทีนี้ลองมาดู tools ที่ผมเลือกใช้กัน

ตัว package ที่เลือกใช้นั้นคือตัว [**_chrome-aws-lambda_**](https://www.npmjs.com/package/chrome-aws-lambda)อ่าน doc ได้ [ที่นี่](https://github.com/alixaxel/chrome-aws-lambda) ซึ่งตัวนี้จะทำมาเพื่อซัพพอร์ตบราวเซอร์ chromium ในรูปแบบ headless ได้ดีพอสมควรเลย และนี่คือตัวอย่างวิธีเรียกใช้มันแบบง่ายมาก ๆ

![Image 1](https://miro.medium.com/v2/resize:fit:700/1*yLM6zieHhORNT0RSBLutKA.png)

แค่นี้เลยครับ ถ้าเรามี path ของ chromium เราก็บอกมันได้ ต่อไปมาดูอีกแบบนึง

**การ deploy แบบ container**

วิธีนี้จะมีการ config เยอะพอสมควร แต่ถ้าต้องทำเป็นระบบใหญ่ ๆ รองรับ load เยอะ ๆ การทำ container service ถือว่าเป็นเรื่องที่สมควรที่จะทำเลยครับ

ตัว package สำหรับวิธีนี้ ผมเลือกที่จะใช้ package official ของ [**puppeteer**](https://www.npmjs.com/package/puppeteer) เลย เพราะเดี๋ยวเราจะมีการ config ภายใน container อยู่แล้ว ซึ่งผมจะเขียนโค้ดเรียกใช้มันแบบ simple มาก ๆ (จริง ๆ มันปรับอะไรได้เยอะมาก ๆ ครับ ลองอ่านใน [document](https://pptr.dev/) ดูก็ได้ครับ) ประมาณนี้ครับ

![Image 2](https://miro.medium.com/v2/resize:fit:700/1*pTvrORRVz2cZFA4v196QSA.png)

แต่หากเรา deploy ไปแบบนี้ตรง ๆ จะ error แน่นอนครับ เพราะบน container ของเรายังไม่มี browser ให้ตัว package ได้เรียกใช้เลย ดังนั้นเราจึงต้อง config มันซะหน่อยตอนทำ dockerfile จะได้เป็นประมาณนี้

![Image 3](https://miro.medium.com/v2/resize:fit:700/1*o-EOhdrxC6-c69eHBYf2og.png)

จะเห็นได้ว่าสคริปต์ชุดนี้เราจะทำการติดตั้ง chromium browser ลงไปด้วย เพื่อให้ตัว package ของเรานั้นสามารถหาเจอและเรียกใช้งานได้ เพียงเท่านี้เราก็จะสามารถ deploy ตัว puppeteer ของเราขึ้นไปได้แล้วครับ
