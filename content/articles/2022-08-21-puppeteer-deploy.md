---
title: "Puppeteer กับการ deploy"
author: "Nanpipat Klinpratoom"
published: "2022-08-21"
published_time: "2022-08-21T14:31:52Z"
source_url: "https://medium.com/@nanpipat.k/puppeteer-%E0%B8%81%E0%B8%B1%E0%B8%9A%E0%B8%81%E0%B8%B2%E0%B8%A3-deploy-44435eb7ff95"
medium_id: "44435eb7ff95"
---

# Puppeteer กับการ deploy

Puppeteer ทำให้ Node.js ควบคุม Chrome ได้ เราสั่งเปิดหน้าเว็บ กรอกฟอร์ม สร้าง PDF หรือถ่าย Screenshot เหมือนมีพนักงานตัวจิ๋วนั่งกด Browser ให้ทั้งวัน ปัญหาคือพนักงานคนนี้ไม่ได้มาแค่ไฟล์ JavaScript เขาต้องพา Chrome ตัวโต ๆ พร้อม Library ระบบปฏิบัติการอีกกระเป๋าหนึ่งไปด้วย

โค้ดที่วิ่งสบายบน Notebook ของเรา จึงอาจล้มทันทีเมื่อ Deploy ด้วยข้อความประมาณ “หา Browser ไม่เจอ” หรือ “ขาด Shared library” บทความนี้จะอธิบายว่าทำไม และเลือกวิธี Deploy ให้เหมาะในปี 2026 ครับ

## ก่อน Deploy แยกสองสิ่งนี้ให้ออก

Puppeteer มีสอง Package ที่เจอบ่อย:

- `puppeteer` ดาวน์โหลด Chrome for Testing ที่เข้ากันได้มาให้โดยปกติ
- `puppeteer-core` มีเฉพาะ Library ควบคุม Browser เราต้องเตรียม Browser และ `executablePath` เอง

ถ้าเริ่มต้นและไม่มีข้อจำกัดเรื่องขนาด ใช้ `puppeteer` ง่ายกว่า ถ้า Platform มี Chrome อยู่แล้วหรือต้องควบคุม Binary เอง ใช้ `puppeteer-core` จะเบากว่า แต่ต้องรับผิดชอบ Version compatibility ด้วย

ตัวอย่างพื้นฐาน:

```javascript
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.goto("https://example.com", {
    waitUntil: "networkidle2",
    timeout: 30_000,
  });

  await page.screenshot({ path: "example.png", fullPage: true });
} finally {
  await browser.close();
}
```

การใช้ `finally` สำคัญมาก เพราะถ้า Task พังกลางทางแล้วไม่ปิด Browser Process จะสะสมเหมือนลูกค้าออกจากห้องประชุมแต่เปิดแอร์ทิ้งไว้ทุกห้องครับ

## การ Deploy แบบ Serverless

วิธีเดิมในปี 2022 คือใช้ Vercel Function ร่วมกับ Package อย่าง `chrome-aws-lambda` เพื่อเตรียม Chromium ที่เล็กพอสำหรับ Serverless

![Image 1](https://miro.medium.com/v2/resize:fit:700/1*yLM6zieHhORNT0RSBLutKA.png)

แนวคิดยังถูกต้อง แต่ก่อนใช้ Package เดิมควรเช็กว่ารองรับ Runtime, Puppeteer และ Chromium เวอร์ชันปัจจุบันหรือไม่ เพราะ Browser กับ Puppeteer ต้องเดินคู่กัน ถ้าคนหนึ่งใส่รองเท้าวิ่ง แต่อีกคนใส่สเก็ต ก็มีโอกาสล้มตั้งแต่ `launch()`

Serverless เหมาะเมื่อ:

- งานสั้นและจำนวนไม่มาก
- ไม่ต้องเก็บ Session ยาว
- ขนาด Deployment อยู่ในข้อจำกัดของ Platform
- Memory และ Timeout เพียงพอกับ Chrome
- ไฟล์ผลลัพธ์ถูกส่งไป Object Storage ไม่ใช่หวังพึ่ง Disk ชั่วคราวถาวร

แต่ต้องตรวจข้อจำกัดของผู้ให้บริการจริง เช่น Maximum duration, Memory, Ephemeral storage, Bundle size และ Process sandbox ไม่มี Config ชุดเดียวใช้ได้กับทุก Platform

ตัวอย่างโครง Handler:

```javascript
export async function capture(url) {
  const browser = await launchBrowserForThisPlatform();

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30_000);

    await page.goto(url, { waitUntil: "networkidle2" });
    return await page.screenshot({ type: "png", fullPage: true });
  } finally {
    await browser.close();
  }
}
```

ฟังก์ชัน `launchBrowserForThisPlatform()` ควรอยู่ชั้นเดียวที่รู้ว่า Browser อยู่ Path ไหน อย่าให้รายละเอียด Platform กระจายไปทั่ว Business Logic จะได้เปลี่ยนผู้ให้บริการหรือ Package ได้ง่ายครับ

## การ Deploy แบบ Container

ถ้างานหนักขึ้น เช่น Render PDF หลายหน้า Crawl หลาย URL หรือควบคุม Memory/CPU เอง การใช้ Container มักตรงไปตรงมากว่า เราแพ็ก Node, Puppeteer, Chrome และ System dependency ไว้ด้วยกัน จึงลดประโยค “เครื่องผมรันได้นะ” ได้เยอะ

โค้ดเรียกใช้งานยังเรียบง่ายเหมือนเดิม

![Image 2](https://miro.medium.com/v2/resize:fit:700/1*pTvrORRVz2cZFA4v196QSA.png)

ในอดีตเราต้องเขียน Dockerfile ติดตั้ง Chromium และ Library ยาวพอ ๆ กับรายการซื้อของเข้าบ้าน

![Image 3](https://miro.medium.com/v2/resize:fit:700/1*o-EOhdrxC6-c69eHBYf2og.png)

ปี 2026 Puppeteer มี Docker image ทางการที่รวม Chrome for Testing, Dependency และ Puppeteer ที่จับคู่กันไว้แล้ว เช่น:

```bash
docker pull ghcr.io/puppeteer/puppeteer:latest
```

สำหรับ Production ควร Pin เป็น Version ที่ทดสอบแล้วแทน `latest` เพื่อไม่ให้ Build วันพรุ่งนี้ได้ Browser คนละตัวกับวันนี้

ตัวอย่างใช้ Image ทางการเป็น Base:

```dockerfile
FROM ghcr.io/puppeteer/puppeteer:25.12.0

WORKDIR /home/pptruser/app

COPY --chown=pptruser:pptruser package*.json ./
RUN npm ci --omit=dev

COPY --chown=pptruser:pptruser . .

CMD ["node", "server.js"]
```

ตรวจ Tag ที่มีจริงจากเอกสารและ Registry ก่อนใช้ เพราะตัวเลขด้านบนเป็นตัวอย่างที่ตรงกับเอกสารขณะอัปเดตบทความ ไม่ควรสุ่มเปลี่ยน Version เพียงเพราะเห็นเลขใหม่กว่า

เอกสารทางการระบุว่า Image นี้ออกแบบให้ Browser รันใน Sandbox mode และตัวอย่าง `docker run` ต้องมี `--init` กับ Capability ที่กำหนด:

```bash
docker run \
  --rm \
  --init \
  --cap-add=SYS_ADMIN \
  my-puppeteer-app
```

`--init` ช่วยเก็บ Child process ของ Chrome ไม่ให้กลายเป็น Zombie process ส่วน Capability ต้องพิจารณาตาม Environment และ Security policy ของระบบ อย่าปิด Sandbox ด้วย `--no-sandbox` เป็นสูตรสำเร็จเพียงเพื่อให้รันผ่าน เพราะเราอาจแก้ปัญหา Deploy ด้วยการถอดประตูนิรภัยออกครับ

## Browser หนึ่งตัวเปิดหลาย Page หรือเปิดใหม่ทุกงาน

การเปิด Chrome มีต้นทุนสูง ถ้ามีงานต่อเนื่อง เราอาจ Reuse Browser แล้วเปิด Page หรือ BrowserContext แยกต่อ Task:

```javascript
const browser = await puppeteer.launch({ headless: true });

async function render(url) {
  const context = await browser.createBrowserContext();

  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    return await page.pdf({ format: "A4" });
  } finally {
    await context.close();
  }
}
```

Context ช่วยแยก Cookie และ Storage ระหว่างงาน แต่ Browser ที่อยู่ยาวต้องมีระบบจำกัดจำนวนงาน ตรวจ Memory และ Restart เป็นระยะ ไม่มี Chrome ตัวไหนควรถูกคาดหวังให้วิ่งมาราธอนไม่หยุดพักหลายเดือนครับ

## สิ่งที่ต้องป้องกันเมื่อรับ URL จากผู้ใช้

ถ้า API เปิดให้ผู้ใช้ส่ง URL แล้ว Server ใช้ Puppeteer เข้าไปเปิด เรากำลังสร้าง Browser ที่เข้าถึง Network ในนามระบบ ต้องระวัง SSRF อย่างจริงจัง

อย่างน้อยควร:

- อนุญาตเฉพาะ `http` และ `https`
- Block `localhost`, Private IP และ Metadata endpoints
- Resolve DNS แล้วตรวจปลายทาง ไม่ตรวจแค่ข้อความ URL
- จำกัด Redirect และตรวจปลายทางซ้ำ
- ตั้ง Timeout, ขนาด Response และจำนวน Request
- ใช้ Network policy แยก Worker ออกจากระบบภายใน
- ไม่ส่ง Secret หรือ Cookie ที่ไม่จำเป็นเข้า Page

Browser automation เปรียบเหมือนส่งเด็กฝึกงานพร้อมบัตรผ่านเข้าออฟฟิศไปเปิดทุกประตูตาม URL ที่คนแปลกหน้าบอก ถ้าไม่กำหนดเขตให้ดี ปัญหาไม่ได้หยุดที่ Screenshot ล้มเหลวครับ

## Checklist ก่อนขึ้น Production

- Pin Version ของ Puppeteer และ Browser image
- ปิด Browser, Context และ Page ใน `finally`
- ตั้ง Navigation timeout และ Overall job timeout
- จำกัด Concurrency ตาม Memory จริง
- มี Retry เฉพาะ Error ที่เหมาะสมและกำหนดเพดาน
- เก็บ Log, URL ที่ผ่านการ Mask และ Screenshot ตอน Error
- ส่งไฟล์ออก Object Storage ก่อน Worker จบ
- ป้องกัน SSRF หาก URL มาจากผู้ใช้
- รันด้วยสิทธิ์เท่าที่จำเป็น และรักษา Browser sandbox
- มี Health check และวิธี Restart Worker

## สรุป

Puppeteer Deploy ยากกว่า Node API ทั่วไปเพราะมันไม่ได้พกมาแค่ Library แต่พา Browser และ Dependency ระดับระบบมาด้วย Serverless เหมาะกับงานสั้นที่เข้ากับข้อจำกัด Platform ส่วน Container เหมาะเมื่ออยากควบคุม Runtime, Resource และ Version ให้แน่นขึ้น

สิ่งที่สะดวกขึ้นในปี 2026 คือมี Docker image ทางการพร้อม Chrome for Testing เราไม่ต้องประกอบ Chrome ด้วยมือทุกครั้ง แต่ยังต้องดูแลเรื่อง Sandbox, Process lifecycle, Concurrency และ Network security เอง เพราะการมีรถจากโรงงานไม่ได้แปลว่าถนนทุกเส้นปลอดภัยครับ

อ่านต่อจากเอกสารทางการ:

- [Puppeteer Docker guide](https://pptr.dev/guides/docker)
- [Puppeteer configuration](https://pptr.dev/guides/configuration)
