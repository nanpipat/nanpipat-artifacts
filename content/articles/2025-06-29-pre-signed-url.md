---
title: "🔐 Pre-signed URL: การแชร์ไฟล์อย่างปลอดภัย"
author: "Nanpipat Klinpratoom"
published: "2025-06-29"
published_time: "2025-06-29T16:31:53Z"
source_url: "https://medium.com/@nanpipat.k/pre-signed-url-%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%81%E0%B8%8A%E0%B8%A3%E0%B9%8C%E0%B9%84%E0%B8%9F%E0%B8%A5%E0%B9%8C%E0%B8%AD%E0%B8%A2%E0%B8%B9%E0%B9%88%E0%B8%B2%E0%B8%87%E0%B8%9B%E0%B8%A5%E0%B8%AD%E0%B8%94%E0%B8%A0%E0%B8%B1%E0%B8%A2-0458df64e7a6"
medium_id: "0458df64e7a6"
---

# 🔐 Pre-signed URL: การแชร์ไฟล์อย่างปลอดภัย

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*WgBhEaD7h07OxQ2Z.jpeg)

Pre-signed URL เปรียบเหมือนบัตรผ่านชั่วคราวที่ระบุทั้งประตู เวลา และสิ่งที่ผู้ถือทำได้ เช่น “อัปโหลดไฟล์นี้เข้าห้องหมายเลข 42 ได้ภายใน 10 นาที” ผู้ใช้ไม่ต้องรู้ Access key ของ Storage และ Bucket ยังเป็น Private ได้

แต่คำว่า Pre-signed ไม่ได้แปลว่าลิงก์เปิดเผยได้อย่างสบายใจครับ ใครก็ตามที่ได้ URL ไปสามารถใช้สิทธิ์ตามที่เซ็นไว้จนหมดอายุ มันจึงเป็น **Bearer credential ชั่วคราว** ต้องป้องกันเหมือน Token ไม่ใช่ URL รูปภาพธรรมดา

## ปัญหาที่ Pre-signed URL ช่วยแก้

วิธีที่ไม่ควรทำคือส่ง Access key ให้ Browser หรือเปิด Bucket เป็น Public เพื่อความสะดวก:

```javascript
const unsafeUrl =
  "https://storage.example/file.jpg?access_key=AKIA...&secret=...";
```

ถ้า Credential รั่ว ผู้โจมตีอาจเข้าถึงมากกว่าหนึ่งไฟล์ และเราอาจต้อง Rotate key ทั้งระบบ

Pre-signed URL ให้ Backend ใช้ Credential ของตัวเองเซ็น Request ที่จำกัด:

```text
https://bucket.s3.amazonaws.com/path/file.jpg
  ?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Expires=600
  &X-Amz-Signature=...
```

Browser เห็นเพียง Request ที่เซ็นล่วงหน้า ไม่เห็น Secret key ที่ใช้เซ็น

## Flow อัปโหลดที่ลดภาระ Backend

```text
1. Browser ขอสิทธิ์อัปโหลด พร้อม Metadata
2. Backend ตรวจผู้ใช้และสร้าง Object key
3. Backend คืน Pre-signed PUT URL
4. Browser PUT ไฟล์ตรงไป Object storage
5. Browser แจ้ง Backend ว่าอัปโหลดเสร็จ
6. Backend ตรวจ Object แล้วบันทึกสถานะ
```

ไฟล์ก้อนใหญ่ไม่ต้องวิ่งผ่าน Application server สองรอบ จึงลด Bandwidth, Memory และ Timeout ของ Backend แต่ Backend ยังเป็นคนตัดสินว่าใครอัปโหลดไปที่ไหนได้

## Backend ต้องสร้าง Object key เอง

อย่ารับ `objectKey` เต็ม ๆ จาก Client แล้วเซ็นทันที เช่นผู้ใช้อาจขอเขียนทับ `users/admin/avatar.png` หรือ Path ของคนอื่น

สร้าง Key จากข้อมูลที่ Backend เชื่อถือ:

```typescript
const objectKey = [
  "uploads",
  authenticatedUser.id,
  crypto.randomUUID(),
].join("/");
```

เก็บชื่อไฟล์เดิมเป็น Metadata ที่ผ่านการทำความสะอาด แต่อย่าใช้ชื่อไฟล์ผู้ใช้เป็น Authority ของ Path การสุ่ม UUID ยังช่วยไม่ให้เดาชื่อไฟล์อื่นง่ายครับ

## สร้าง Pre-signed PUT URL ด้วย AWS SDK v3

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function createUploadUrl(input: {
  userId: string;
  contentType: string;
}) {
  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "application/pdf",
  ]);

  if (!allowedTypes.has(input.contentType)) {
    throw new Error("unsupported content type");
  }

  const objectKey = `uploads/${input.userId}/${crypto.randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: process.env.UPLOAD_BUCKET,
    Key: objectKey,
    ContentType: input.contentType,
    Metadata: {
      owner: input.userId,
    },
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 10 * 60,
  });

  return { objectKey, uploadUrl, expiresIn: 600 };
}
```

Credential ของ Backend ควรมาจาก IAM role หรือ Temporary credential ไม่ใช่ Access key ที่ฝังใน Source Code และ IAM policy ควรเขียนได้เฉพาะ Prefix ที่ระบบต้องใช้

ข้อสำคัญคืออายุ URL ไม่สามารถยาวกว่า Credential ที่ใช้เซ็นได้ ถ้า Role session หมดก่อน URL ก็หมดตาม แม้เราตั้ง `expiresIn` ไว้นานกว่านั้นครับ

## Browser อัปโหลดตรงไป Storage

```typescript
async function uploadFile(file: File) {
  const presignResponse = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentType: file.type,
      size: file.size,
      filename: file.name,
    }),
  });

  if (!presignResponse.ok) {
    throw new Error("ขอสิทธิ์อัปโหลดไม่สำเร็จ");
  }

  const { uploadUrl, objectKey } = await presignResponse.json();

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("อัปโหลดไฟล์ไม่สำเร็จ");
  }

  await fetch("/api/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objectKey }),
  });

  return objectKey;
}
```

Header ที่เซ็นไว้ต้องตรงกับ Request จริง เช่นถ้าเซ็น `Content-Type: image/png` แต่ Browser ส่ง `image/jpeg` Signature อาจไม่ตรง อย่าแก้ด้วยการเลิกเซ็น Header สำคัญทั้งหมด ควรทำ Contract ระหว่าง Backend กับ Client ให้ชัดครับ

## ตรวจขนาดและชนิดไฟล์ที่ไหน

การเช็ก `file.type` และ `file.size` ใน Browser ช่วย UX แต่ผู้ใช้แก้ Request ได้ Backend ต้องตรวจซ้ำก่อนเซ็น และหลัง Upload ควรมี Pipeline ตรวจ Object จริง:

- ขนาดไฟล์จาก Storage metadata
- Magic bytes ไม่เชื่อ Extension อย่างเดียว
- Malware scan เมื่อความเสี่ยงต้องการ
- Decode รูปเพื่อยืนยันว่าเป็นภาพจริง
- แยก Quarantine prefix ก่อนผ่านการตรวจ
- ป้องกัน Zip bomb และไฟล์บีบอัดอันตราย

Pre-signed PUT URL จำกัด Content length ได้ไม่ยืดหยุ่นเท่า Presigned POST policy ในบางกรณี ถ้าต้องบังคับช่วงขนาดหรือ Field หลายตัว ลองพิจารณา Presigned POST ครับ

## Local Preview ที่ไม่ต้องรอ Upload

สร้าง Object URL จากไฟล์ในเครื่อง:

```tsx
function ImagePreview({ file }: { file: File }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <img src={previewUrl} alt="ไฟล์ตัวอย่างก่อนอัปโหลด" />;
}
```

ต้อง `revokeObjectURL` ตอนเลิกใช้เพื่อคืน Memory โดยเฉพาะหน้าที่ผู้ใช้เลือกภาพจำนวนมาก ไม่อย่างนั้น Preview ที่ดูเบา ๆ จะค่อย ๆ กิน Memory เหมือนวางกล่องเปล่าเต็มห้องครับ

## ดาวน์โหลดไฟล์ Private ด้วย Pre-signed GET

Backend ตรวจว่าผู้ใช้มีสิทธิ์เห็น Object ก่อน แล้วเซ็น URL อายุสั้น:

```typescript
import { GetObjectCommand } from "@aws-sdk/client-s3";

const command = new GetObjectCommand({
  Bucket: process.env.UPLOAD_BUCKET,
  Key: authorizedObject.key,
  ResponseContentDisposition: `inline; filename="preview.jpg"`,
});

const downloadUrl = await getSignedUrl(s3, command, {
  expiresIn: 5 * 60,
});
```

อย่าให้ Client ส่ง Key มาแล้วเซ็นโดยไม่ตรวจ Ownership การรู้ชื่อห้องไม่ได้แปลว่ามีสิทธิ์รับบัตรผ่านเข้าไปครับ

## อย่า Refresh URL ทุก 50 นาทีแบบไม่ดูผู้ใช้

ตัวอย่างเก่าตั้ง `setInterval` ขอ URL ใหม่เรื่อย ๆ แม้ Tab อยู่พื้นหลังหรือ Component ไม่ได้แสดงแล้ว วิธีที่ประหยัดกว่าคือ:

- ขอ URL เมื่อกำลังจะแสดง
- Cache ตาม Object key จนใกล้หมดอายุ
- เมื่อรูปโหลดไม่ได้เพราะ URL หมดอายุ ค่อยขอใหม่หนึ่งครั้ง
- ยกเลิก Request เมื่อ Component unmount
- ถ้ามีรูปจำนวนมาก ใช้ Intersection Observer ขอเฉพาะรูปใกล้ Viewport

URL คือ Credential ชั่วคราว ไม่ควรสร้างแจกโดยไม่จำเป็นครับ

## CORS ต้องอนุญาต Origin และ Method ให้ถูก

Browser อัปโหลดตรงข้าม Origin ต้องตั้ง CORS ที่ Bucket เช่นอนุญาต `PUT` จาก Domain ของแอป และ Header ที่ใช้จริง อย่าใช้ `AllowedOrigins: ["*"]` พร้อมเปิดทุก Method ใน Production เพราะแก้ง่ายตอนแรกแต่ขยายพื้นที่โจมตีโดยไม่จำเป็น

แยก CORS ออกจาก IAM:

- CORS บอก Browser ว่าหน้าเว็บ Origin นี้อ่าน Response ได้ไหม
- IAM/Signature บอก Storage ว่า Request มีสิทธิ์ทำ Operation หรือไม่

CORS ไม่ใช่ระบบ Authorization ครับ

## Pre-signed URL ยกเลิกกลางทางได้ไหม

โดยธรรมชาติ URL ใช้ได้จนหมดอายุ ตราบใดที่ Credential และ Permission ที่เซ็นยังใช้ได้ การลบ Object, ปิด Principal หรือเปลี่ยน Policy อาจหยุดบางกรณี แต่ไม่ควรออกแบบโดยหวัง Revoke URL รายลิงก์ได้สะดวก

วิธีลดความเสี่ยง:

- ตั้งอายุสั้นที่สุดที่ UX รับได้
- ใช้ Temporary credential
- จำกัด Method, Bucket, Key และ Header
- เพิ่ม Bucket policy เช่นจำกัด Signature age ตาม Requirement
- ไม่ Log Query string ของ Signed URL
- ใช้ CloudFront signed URL/cookie เมื่อโจทย์คือ Distribution และ Revocation model ต่างออกไป

## Checklist ก่อนขึ้น Production

- Backend ตรวจ Authentication และ Authorization ก่อนเซ็น
- Backend สร้าง Object key เอง
- IAM จำกัด Bucket, Prefix และ Action
- URL อายุสั้น
- Credential มาจาก Role/Temporary credential
- ตรวจ Type, Size และ Malware หลัง Upload
- CORS จำกัด Origin และ Method
-ไม่เก็บ Signed URL เป็นตัวตนถาวร เก็บ Object key
- Log เฉพาะ Object key หรือ Request ID ไม่ Log Signature
- มี Lifecycle ลบ Upload ที่ไม่ Complete
- รองรับ Multipart upload สำหรับไฟล์ใหญ่ พร้อมเก็บกวาด Upload ที่ค้าง

## สรุป

Pre-signed URL ช่วยให้ Browser อัปโหลดหรือดาวน์โหลดกับ Object storage โดยตรง โดยไม่แจก Access key และไม่บังคับให้ Application server แบกไฟล์ทุก Byte

แต่ความปลอดภัยเกิดจากขอบเขตที่เราเซ็น ไม่ใช่คำว่า Signed เพียงคำเดียว ให้ Backend เป็นคนสร้าง Key ตรวจสิทธิ์ จำกัดอายุและ Operation พร้อมตรวจไฟล์หลัง Upload แล้วเก็บ Object key เป็นข้อมูลถาวร ส่วน Signed URL เป็นเพียงบัตรผ่านชั่วคราว—ใช้เสร็จแล้วก็ปล่อยให้หมดอายุ ไม่ต้องเอาไปใส่กรอบแขวนหน้าบ้านครับ

อ่านต่อจากเอกสารทางการ:

- [Amazon S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [AWS presigned URL best practices](https://docs.aws.amazon.com/prescriptive-guidance/latest/presigned-url-best-practices/overview.html)
