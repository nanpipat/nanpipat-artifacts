---
title: "ทำความรู้จักกับ LUKS: การเข้ารหัสข้อมูลบน Disk สำหรับ Developer"
author: "Nanpipat Klinpratoom"
published: "2025-07-08"
published_time: "2025-07-08T04:06:22Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%97%E0%B8%B3%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%A3%E0%B8%B9%E0%B9%89%E0%B8%88%E0%B8%B1%E0%B8%81%E0%B8%81%E0%B8%B1%E0%B8%9A-luks-%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%80%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B8%A3%E0%B8%AB%E0%B8%B1%E0%B8%AA%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%9A%E0%B8%99-disk-%E0%B8%AA%E0%B8%B3%E0%B8%AB%E0%B8%A3%E0%B8%B1%E0%B8%9A-developer-0761c47df91b"
medium_id: "0761c47df91b"
---

# ทำความรู้จักกับ LUKS: การเข้ารหัสข้อมูลบน Disk สำหรับ Developer

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*9Qauq1YW6esKazgq.jpg)

### 🤔 LUKS คืออะไร?

**LUKS (Linux Unified Key Setup)** เป็นมาตรฐานสำหรับการเข้ารหัสข้อมูลบน hard disk ใน Linux ง่ายๆ คือการ “ล็อคข้อมูลในตู้เซฟ” บน disk ของเรา

### เปรียบเทียบง่ายๆ

- **ไม่มี LUKS**: เหมือนเก็บเงินไว้ในกล่องธรรมดา ใครเปิดได้ก็ดูได้
- **มี LUKS**: เหมือนเก็บเงินไว้ในตู้เซฟ ต้องมีรหัสถึงจะเปิดได้

## 🏗️ LUKS ทำงานใน Layer ไหน?

### โครงสร้างระบบปกติ

Application (MySQL, File Server)  
 ↕  
File System (ext4, xfs)  
 ↕   
Block Device (/dev/sda1)  
 ↕  
Physical Disk (Hard Disk)
### โครงสร้างเมื่อมี LUKS

Application (MySQL, File Server) ← ไม่รู้ว่ามี encryption  
 ↕  
File System (ext4, xfs) ← ทำงานปกติ  
 ↕  
🔒 LUKS Layer 🔒 ← เข้ารหัส/ถอดรหัสที่นี่!  
 ↕  
Block Device (/dev/sda1) ← เห็นแต่ข้อมูลเข้ารหัส  
 ↕  
Physical Disk (Hard Disk) ← เก็บข้อมูลเข้ารหัส
**สิ่งสำคัญ:** LUKS อยู่ระหว่าง File System กับ Physical Disk ทำให้ application ไม่รู้เลยว่ามี encryption!

## 🔄 LUKS ทำงานยังไง?

### เมื่อ Application เขียนข้อมูล

1. MySQL เขียน: "INSERT INTO users VALUES ('john', 'secret123')"  
 ↓  
2. File System: แปลงเป็น file operations  
 ↓   
3. LUKS: เข้ารหัสข้อมูลด้วย AES-256  
 "INSERT INTO users..." → "a8f7k2m9x5n1p3q7..."  
 ↓  
4. Physical Disk: เก็บข้อมูลเข้ารหัส "a8f7k2m9x5n1p3q7..."
### เมื่อ Application อ่านข้อมูล

1. MySQL ขอ: "SELECT * FROM users"  
 ↑  
2. File System: ขอข้อมูลจาก disk  
 ↑  
3. LUKS: ถอดรหัสข้อมูล  
 "a8f7k2m9x5n1p3q7..." → "INSERT INTO users..."  
 ↑  
4. Physical Disk: ส่งข้อมูลเข้ารหัส "a8f7k2m9x5n1p3q7..."
**เนื่องจากเป็น “transparent encryption”** MySQL จึงไม่รู้เลยว่ามี encryption เกิดขึ้น!

## 🔑 ระบบจัดการ Key ของ LUKS

### โครงสร้าง Key

User Password/Keyfile  
 ↓  
[Key Derivation Function] ← ทำให้ password แข็งแรงขึ้น  
 ↓  
Volume Key ← ใช้ unlock Master Key  
 ↓  
Master Key ← ใช้เข้ารหัสข้อมูลจริง  
 ↓  
Per-Sector Keys ← แต่ละ sector ใช้ key ต่างกัน  
 ↓  
Encrypted Data
### ทำไมถึงซับซ้อนแบบนี้?

- **Security**: ถ้า attacker ได้ Master Key ตอนนี้ ก็อ่านข้อมูลในอดีตไม่ได้
- **Flexibility**: เปลี่ยนรหัสผ่านได้โดยไม่ต้องเข้ารหัสข้อมูลใหม่
- **Multiple Keys**: มีรหัสผ่านได้หลายตัว (8 slots)

## 🚀 ข้อดีของ LUKS

### 1. Transparent Operation

  
db.execute("INSERT INTO users VALUES (?)", [user_data])# Code หลังใส่ LUKS   
db.execute("INSERT INTO users VALUES (?)", [user_data]) # เหมือนเดิม!# ไม่ต้องแก้โค้ดเลย!
### 2. Performance ดี

- **Modern CPU (มี AES-NI)**: ช้าลงแค่ 2–5%
- **Older CPU (ไม่มี AES-NI)**: ช้าลง 10–20%
- **Memory**: ใช้เพิ่มแค่ 50–100MB

### 3. Compliance Ready

- **GDPR**: ข้อมูลเข้ารหัส = ลดความรับผิดชอบ
- **PCI-DSS**: จำเป็นสำหรับข้อมูลบัตรเครดิต
- **HIPAA**: สำหรับข้อมูลสุขภาพ

## 💼 Use Cases จริงๆ

### 1. Database Server

MySQL/PostgreSQL + LUKS = ข้อมูล customer ปลอดภัย  
- ขโมย disk ไป → อ่านข้อมูลไม่ได้  
- Backup disk → ปลอดภัยอัตโนมัติ
### 2. File Server

File Server + LUKS = ไฟล์เอกสารปลอดภัย  
- ทิ้ง disk เก่า → ไม่กลัวข้อมูลรั่ว  
- เข้าถึงเครื่องแบบ physical → ต้องมีรหัส
### 3. Development Environment

Docker Volumes + LUKS = ข้อมูลทดสอบปลอดภัย  
- ข้อมูล production ใน staging → เข้ารหัสไว้  
- Laptop หาย → ข้อมูลไม่รั่ว

## 🔍 Technical Deep Dive (สำหรับคนสนใจ)

### Encryption Algorithm

Default: AES-XTS-Plain64  
- AES: Advanced Encryption Standard (ใช้กันทั่วโลก)  
- XTS: mode สำหรับ disk encryption (ป้องกัน pattern)   
- Plain64: sector numbering scheme  
- Key Size: 512-bit (256-bit x 2 สำหรับ XTS)
### Key Derivation

PBKDF2 (Password-Based Key Derivation Function)  
- Input: Password + Salt + Iteration Count  
- Output: Strong key สำหรับ unlock Master Key  
- Iteration: ปกติ 1000 ms (ทำให้ brute force ช้า)

### Block-level Operation

- แต่ละ sector (512 bytes) เข้ารหัสแยกกัน  
- ใช้ sector number เป็นส่วนหนึ่งของ encryption key  
- ข้อดี: random access, parallel encryption

## ⚠️ สิ่งที่ต้องระวัง

### LUKS ป้องกันได้

- ✅ **Physical theft**: ขโมย disk/server
- ✅ **Data disposal**: ทิ้ง disk เก่า
- ✅ **Cold boot attacks**: เข้าถึงเครื่องที่ปิด
- ✅ **Forensic analysis**: วิเคราะห์ disk

### LUKS ป้องกันไม่ได้

- ❌ **Running system attacks**: malware, backdoor
- ❌ **Application vulnerabilities**: SQL injection
- ❌ **Memory dumps**: ดูข้อมูลใน RAM
- ❌ **Social engineering**: หลอกขอรหัส
- ❌ **Insider threats**: คนในบริษัททำร้าย

### สิ่งที่อันตรายที่สุด

😱 ลืมรหัสผ่าน + ไม่มี backup keyfile = ข้อมูลหายหมด  
😱 LUKS header เสียหาย + ไม่มี backup = ข้อมูลหายหมด  
😱 Keyfile หาย + ลืมรหัสผ่าน = ข้อมูลหายหมด💡 Solution: สำรอง keyfile และ LUKS header ไว้หลายที่!

## 🛠️ การใช้งานจริงในทีม

### สำหรับ Developer

  
cryptsetup status encrypted_volume# ดู performance impact  
iostat -x 1 5# เช็ค logs  
journalctl -u systemd-cryptsetup@encrypted_volume
### สำหรับ DevOps

  
df -h /encrypted/data# Check auto-unlock configuration   
cat /etc/crypttab# Backup LUKS header  
cryptsetup luksHeaderBackup /dev/sdb1 --header-backup-file backup.luks
### สำหรับ Security Team

  
cryptsetup luksDump /dev/sdb1# Check encryption strength  
cryptsetup luksDump /dev/sdb1 | grep -E "Cipher|Hash|Key size"# Monitor access logs  
auditctl -w /etc/luks-keys/ -p rwxa -k luks_access

## 📚 เมื่อไหร่ควรใช้ LUKS?

### ใช้เมื่อ

- 🏢 **มีข้อมูลสำคัญ**: customer data, financial data
- 📜 **ต้อง compliance**: GDPR, PCI-DSS, HIPAA
- 💻 **Server อยู่ที่ไม่ปลอดภัย**: co-location, cloud
- 🔄 **ต้องการ simple solution**: ไม่อยากแก้โค้ด

### ไม่ต้องใช้เมื่อ

- 🏠 **ข้อมูลไม่สำคัญ**: test data, public data
- ⚡ **ต้องการ performance สูงสุด**: HFT, real-time systems
- 🔒 **มี application-level encryption แล้ว**: และเพียงพอ
- 🏃 **ทีมไม่พร้อม**: ไม่มีคนดูแล key management

## 🎯 สรุป

### LUKS เป็น

- 🔒 **Block-level encryption** ที่ทำงานใต้ file system
- 🔄 **Transparent** ไม่กระทบ application
- 🚀 **Fast** เพราะมี hardware support
- 🆓 **Free** ไม่ต้องเสียเงิน

### เหมาะกับ

- 📊 **Database servers** ที่เก็บข้อมูลสำคัญ
- 📁 **File servers** ที่เก็บเอกสาร
- 🐳 **Docker environments** ที่มี persistent data
- 💻 **Developer workstations** ที่ทำงานกับข้อมูลจริง

### Key Takeaway

**LUKS ให้ “insurance” สำหรับข้อมูลของเรา** ถ้าเครื่องหายหรือ disk เสีย ข้อมูลจะไม่รั่วไหล แต่ระหว่างใช้งานปกติ เราจะไม่รู้สึกถึงการมีอยู่ของ encryption เลย!
