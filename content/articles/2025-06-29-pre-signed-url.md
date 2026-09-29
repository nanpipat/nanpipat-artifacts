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

Pre-signed URL เป็นเทคนิคที่ทำให้เราสามารถแชร์ไฟล์ได้อย่างปลอดภัย โดยไม่ต้องให้ “กุญแจบ้าน” กับใครทั้งนั้น คิดง่ายๆ ว่าเหมือนการให้บัตรเข้าออฟฟิศชั่วคราวที่หมดอายุในเวลาที่กำหนด

**ทำไมต้องใช้?** เพราะการเปิดเผย access key ในโค้ดหรือ URL เหมือนกับการปักป้าย “เอา username/password ไปเลย” 😅

## ปัญหาเก่าที่เราต้องเจอ

## ❌ วิธีที่ไม่ควรทำ

  
const unsafeUrl = "https://storage.com/file.jpg?access_key=AKIAI...&secret=wJalr..."// หรือการเปิด bucket แบบ public (อันตรายกว่า)  
const publicUrl = "https://storage.com/public-bucket/secret-document.pdf"
## ✅ วิธีที่ควรทำ (Pre-signed URL)

  
const safeUrl = "https://storage.com/file.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600&..."
## การทำงานในระบบจริง (จากโค้ดของคุณ)

## 1. การสร้าง Pre-signed URL

const getPresignedUrl = async (objectKey) => {  
 try {  
 const response = await fetch(  
 `/api/presigned-url?objectKey=${encodeURIComponent(objectKey)}`  
 );
if (!response.ok) {  
 throw new Error("ไม่สามารถสร้าง URL ได้");  
 }

const data = await response.json();  
 return data.url;   
 } catch (error) {  
 console.error("เกิดข้อผิดพลาด:", error);  
 return "";  
 }  
};

## 2. กระบวนการ Upload แบบ Smart

const handleUploadImage = async (plotIndex, imageIndex) => {  
   
 const formData = new FormData();  
 formData.append("file", image.file);  
 formData.append("communityId", communityId);  
 formData.append("plotCode", plotCode); try {  
 // 📤 ส่งไฟล์ไปยัง cloud storage  
 const response = await fetch("/api/upload", {  
 method: "POST",  
 body: formData,  
 }); const data = await response.json(); // 🎉 ได้ objectKey กลับมา (เป็นตัวตนของไฟล์ใน cloud)  
 const uploadedImage = {  
 objectKey: data.objectKey, // สำคัญมาก! เก็บไว้สร้าง pre-signed URL  
 url: data.url,  
 uploaded: true,  
 file: undefined // ล้างไฟล์ local ออก เพื่อประหยัด memory  
 };
} catch (error) {  
 console.error("อัพโหลดไม่สำเร็จ:", error);  
 }  
};

## 3. การแสดงภาพแบบ Dynamic Preview

const ImagePreview = ({ image }) => {  
 const [previewUrl, setPreviewUrl] = useState(""); useEffect(() => {  
 const setupPreview = async () => {  
 if (image.objectKey && image.uploaded) {  
 // 🔄 สร้าง pre-signed URL สำหรับไฟล์ที่อัพโหลดแล้ว  
 const signedUrl = await getPresignedUrl(image.objectKey);  
 setPreviewUrl(signedUrl);  
 } else if (image.previewUrl) {  
 // 👀 ใช้ local preview สำหรับไฟล์ที่ยังไม่อัพโหลด  
 setPreviewUrl(image.previewUrl);  
 }  
 }; setupPreview(); // 🔄 Refresh URL ทุก 50 นาที (ป้องกันหมดอายุ)  
 const refreshTimer = setInterval(setupPreview, 50 * 60 * 1000);
return () => clearInterval(refreshTimer);  
 }, [image.objectKey, image.uploaded]);

 if (!previewUrl) return <div>กำลังโหลด...</div>; return (  
 <img   
 src={previewUrl}   
 alt="Preview"   
 className="max-h-24 object-contain"  
 onError={() => console.log("รูปภาพโหลดไม่ได้")}  
 />  
 );  
};
## Journey ของไฟล์: จากเลือกถึงแสดงผล

## Phase 1: การเลือกไฟล์ 🎯

User เลือกไฟล์ → สร้าง Object URL (local) → แสดง preview ทันที
## Phase 2: การอัพโหลด 🚀

กดอัพโหลด → ส่งไฟล์ไป MinIO → ได้ objectKey → อัพเดท state
## Phase 3: การแสดงผลถาวร 🖼️

ใช้ objectKey → สร้าง pre-signed URL → แสดงภาพจาก cloud
## ข้อดีที่ได้จากการใช้ระบบนี้

## 🛡️ ความปลอดภัย

- ไม่มี credentials รั่วไหล
- ควบคุมเวลาการเข้าถึงได้แม่นยำ
- ไฟล์ปลอดภัยใน private storage

## ⚡ ประสิทธิภาพ

- ไม่ต้องส่งไฟล์ผ่าน application server
- ลด load บน backend
- User เข้าถึงไฟล์โดยตรงจาก cloud

## 🎨 User Experience

- Preview ได้ทันทีหลังเลือกไฟล์
- ไม่ต้องรอโหลดผ่าน server
- แสดงผลรวดเร็ว

## Best Practices จากโค้ดจริง

## 1. การจัดการ State อย่างชาญฉลาด

const imageState = {  
 id: generateId(),  
 file: localFile, // สำหรับ upload  
 previewUrl: localUrl, // สำหรับ preview ก่อน upload  
 objectKey: cloudKey, // สำหรับสร้าง pre-signed URL  
 url: signedUrl, // Pre-signed URL ปัจจุบัน  
 uploaded: false, // สถานะ  
 uploading: false  
};
## 2. การ Handle Error แบบมืออาชีพ

if (!response.ok) {  
 throw new Error("ไม่สามารถดึง pre-signed URL ได้");  
}// แสดง toast notification ให้ user ทราบ  
toast({  
 title: "เกิดข้อผิดพลาด",  
 description: "ไม่สามารถโหลดรูปภาพได้",  
 variant: "destructive",  
});
## 3. การ Optimize Performance

  
updatedImages[imageIndex] = {  
 ...updatedImages[imageIndex],  
 file: undefined,   
 uploaded: true  
};
## สรุป

Pre-signed URL เป็นเครื่องมือสำคัญที่ช่วยให้เราสร้างระบบ file sharing ที่ปลอดภัย มีประสิทธิภาพ และใช้งานง่าย ผสมผสานกับเทคนิคการทำ local preview ทำให้ user experience ลื่นไหลและรวดเร็ว

คิดง่ายๆ ว่าเป็นการให้ “บัตรเข้าชมพิเศษ” แทนการให้ “กุญแจบ้าน” — ปลอดภัยกว่า ควบคุมได้ดีกว่า! 🎉
