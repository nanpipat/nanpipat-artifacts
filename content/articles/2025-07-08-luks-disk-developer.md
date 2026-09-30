---
title: "ทำความรู้จักกับ LUKS: การเข้ารหัสข้อมูลบน Disk สำหรับ Developer"
author: "Nanpipat Klinpratoom"
published: "2025-07-08"
published_time: "2025-07-08T04:06:22Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%97%E0%B8%B3%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%A3%E0%B8%B9%E0%B9%89%E0%B8%88%E0%B8%B1%E0%B8%81%E0%B8%81%E0%B8%B1%E0%B8%9A-luks-%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%80%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B8%A3%E0%B8%AB%E0%B8%B1%E0%B8%AA%E0%B8%82%E0%B9%89%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%9A%E0%B8%99-disk-%E0%B8%AA%E0%B8%B3%E0%B8%AB%E0%B8%A3%E0%B8%B1%E0%B8%9A-developer-0761c47df91b"
medium_id: "0761c47df91b"
---

# ทำความรู้จักกับ LUKS: การเข้ารหัสข้อมูลบน Disk สำหรับ Developer

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*9Qauq1YW6esKazgq.jpg)

ถ้ามีคนถอด Disk ออกจาก Server แล้วเอาไปต่อกับเครื่องอื่น สิทธิ์ในแอป, Password ของ Database และ Login ของ Linux อาจไม่ช่วยอะไร เพราะคนร้ายกำลังอ่าน Block บน Disk โดยตรง

LUKS หรือ Linux Unified Key Setup ช่วยป้องกันสถานการณ์นี้ด้วยการเข้ารหัสระดับ Block device ข้อมูลบน Disk จึงอ่านไม่ออกจนกว่าจะปลดล็อกด้วย Passphrase, Key file หรือกลไกที่กำหนดไว้ เปรียบเหมือนย้ายแฟ้มทั้งหมดเข้าไปอยู่ในตู้เซฟ ต่อให้มีคนยกตู้ไปทั้งใบ เขาก็ยังต้องเปิดล็อกก่อนอ่านเอกสารครับ

แต่ตู้เซฟช่วยเฉพาะตอนล็อก ถ้าเครื่องกำลังทำงานและ Volume ถูกปลดล็อกอยู่ แอปและผู้โจมตีที่ยึดระบบได้ก็อาจอ่านข้อมูลตามสิทธิ์ LUKS จึงเป็นการป้องกัน **Data at rest** ไม่ใช่เกราะครอบจักรวาล

## LUKS อยู่ตรงไหนของระบบ

โครงสร้างโดยย่อ:

```text
Application
    ↓
File system เช่น ext4 หรือ XFS
    ↓
Mapped device เช่น /dev/mapper/secure-data
    ↓
dm-crypt และ LUKS
    ↓
Encrypted block device เช่น /dev/nvme1n1p1
    ↓
Physical disk
```

Application เห็น Filesystem ปกติ MySQL ยังเขียน Table และ File เหมือนเดิม Kernel รับหน้าที่เข้ารหัสก่อนลง Block device และถอดรหัสเมื่ออ่านกลับ ความโปร่งใสนี้ทำให้เราเปิด Encryption โดยไม่ต้องแก้ Code ของแอปทุกตัว

## LUKS กับ dm-crypt ไม่ใช่คำเดียวกัน

- **dm-crypt** เป็นกลไกใน Linux kernel ที่เข้ารหัส Block device
- **LUKS** เป็นรูปแบบ Metadata และระบบจัดการ Key slot, Parameters และการปลดล็อก
- **cryptsetup** เป็นเครื่องมือ CLI ที่ใช้สร้าง เปิด ปิด และจัดการ LUKS volume

ถ้า dm-crypt เป็นเครื่องยนต์ LUKS คือระบบกุญแจและคู่มือประจำรถ ส่วน cryptsetup คือแผงควบคุมที่เราใช้สั่งงานครับ

## กุญแจของ LUKS ทำงานอย่างไร

ภาพที่ถูกต้องแบบย่อ:

```text
Passphrase หรือ Key file
        ↓ ผ่าน KDF
Key ที่ใช้เปิด Keyslot
        ↓ ถอดข้อมูลใน Keyslot
Volume key
        ↓
dm-crypt เข้ารหัสและถอดรหัส Sector
```

ข้อมูลบน Volume ถูกเข้ารหัสด้วย Volume key ส่วน Passphrase ไม่ได้เข้ารหัสข้อมูลทุก Sector โดยตรง มันใช้เปิด Keyslot ที่ปกป้อง Volume key อีกชั้น

ผลดีคือเราเพิ่มหรือลบ Passphrase ได้โดยไม่ต้องเข้ารหัสข้อมูลทั้ง Disk ใหม่ ตราบใดที่ Volume key เดิมยังอยู่ เหมือนตู้เซฟใช้กลไกภายในชุดเดิม แต่อนุญาตให้เปลี่ยนบัตรพนักงานที่เปิดตู้ได้

LUKS2 รองรับ Keyslot ได้มากกว่า LUKS1 และใช้ KDF แบบ Memory-hard อย่าง Argon2 ตามค่าและสภาพระบบ ช่วยเพิ่มต้นทุนการเดา Passphrase แต่ Passphrase ที่อ่อนยังคงอ่อนอยู่ ไม่มี Algorithm ตัวไหนเปลี่ยน `123456` ให้กลายเป็นปราสาทที่ตีไม่แตกครับ

## LUKS2 คือค่าเริ่มต้นที่ควรเลือก

ถ้าไม่มีข้อกำหนด Compatibility เฉพาะ ให้ใช้ LUKS2 เพราะมี Metadata format ที่ขยายได้, Keyslot มากขึ้น, สำเนา Header บางส่วน และรองรับ KDF สมัยใหม่กว่า

ตรวจ Device แบบ Read-only:

```bash
sudo cryptsetup luksDump /dev/<device>
```

คำสั่งนี้แสดง Version, Cipher, Sector size และ Keyslot แต่ชื่อ Device ต้องถูกต้องเสมอ การอ่านผิด Device อาจแค่ Error ส่วนคำสั่งสร้างหรือ Format ผิด Device ทำให้ข้อมูลหายทันทีครับ

## ตัวอย่างสร้าง Volume สำหรับ Lab

> คำสั่ง `luksFormat` ด้านล่างทำลายข้อมูลบน Device เป้าหมาย ใช้กับ Disk/Partition ทดลองที่ว่างเท่านั้น ตรวจชื่อ Device จาก `lsblk` หลายครั้ง และมี Backup ก่อนเสมอ

ดูรายการ Block device:

```bash
lsblk --fs
```

สร้าง LUKS2:

```bash
sudo cryptsetup luksFormat --type luks2 /dev/<LAB_DEVICE>
```

เปิด Mapping:

```bash
sudo cryptsetup open /dev/<LAB_DEVICE> secure-data
```

ตอนนี้จะมี `/dev/mapper/secure-data` ให้สร้าง Filesystem:

```bash
sudo mkfs.ext4 /dev/mapper/secure-data
sudo mkdir -p /mnt/secure-data
sudo mount /dev/mapper/secure-data /mnt/secure-data
```

ตรวจ:

```bash
findmnt /mnt/secure-data
sudo cryptsetup status secure-data
```

เมื่อเลิกใช้:

```bash
sudo umount /mnt/secure-data
sudo cryptsetup close secure-data
```

ห้าม `close` ขณะ Filesystem ยัง Mount หรือมี Process ใช้งานอยู่ เพราะอาจทำให้ข้อมูลเสียหาย

## เพิ่ม Passphrase และจัดการ Keyslot

เพิ่ม Key ใหม่โดยต้องยืนยัน Key ที่ใช้งานได้อยู่ก่อน:

```bash
sudo cryptsetup luksAddKey /dev/<DEVICE>
```

ดู Keyslot:

```bash
sudo cryptsetup luksDump /dev/<DEVICE>
```

ลบ Key อย่างระมัดระวัง:

```bash
sudo cryptsetup luksRemoveKey /dev/<DEVICE>
```

ก่อนลบต้องทดสอบ Key ใหม่ว่าเปิด Volume ได้จริง และห้ามลบ Keyslot สุดท้ายที่ใช้งานได้ ถ้ากุญแจทุกดอกหาย ข้อมูลไม่ได้ “ล็อกแน่นขึ้น” แต่กลายเป็นกล่องที่ไม่มีใครเปิดได้ รวมถึงเจ้าของครับ

## Backup LUKS header สำคัญพอ ๆ กับ Backup กุญแจ

LUKS metadata และ Keyslot อยู่ใน Header ถ้า Header เสียหาย ต่อให้จำ Passphrase ได้ก็อาจเปิด Volume ไม่ได้

Backup Header:

```bash
sudo cryptsetup luksHeaderBackup /dev/<DEVICE> \
  --header-backup-file luks-header.img
```

เก็บไฟล์นี้ในตำแหน่งที่ปลอดภัย แยกจาก Disk ต้นทาง และป้องกันด้วยสิทธิ์/Encryption ที่เหมาะสม Header backup รวม Material ที่ใช้โจมตี Passphrase แบบ Offline ได้ จึงไม่ใช่ไฟล์ที่ควรแนบ Email ส่งกันเล่น ๆ

การ Restore Header ผิด Device หรือผิด Version อาจทำลายข้อมูล ต้องทดสอบขั้นตอนกู้ใน Lab และใช้เอกสารทางการตรง Version ก่อนทำจริง

## LUKS ป้องกันอะไรได้บ้าง

ช่วยป้องกัน:

- Disk หรือเครื่องถูกขโมยขณะปิดหรือล็อก Volume
- Disk ถูกถอดไปอ่าน Offline
- Snapshot หรือ Backup storage ที่เก็บเป็น Block เข้ารหัสตามขอบเขต
- การทิ้ง Disk โดยยังมีข้อมูลอ่านได้

ไม่ช่วยโดยตรงกับ:

- ผู้โจมตีที่ยึด Root ขณะ Volume เปิดอยู่
- SQL injection หรือช่องโหว่ของ Application
- Malware ที่อ่าน File ผ่าน Filesystem
- ข้อมูลที่ส่งผ่าน Network
- Secret ที่ถูก Log หรือส่งไปบริการอื่น
- การลบไฟล์หรือ Ransomware ตอนระบบทำงาน

LUKS ไม่แทน Access control, TLS, Backup, Application security หรือ Monitoring มันเป็นกำแพงหนึ่งชั้นที่ป้องกัน Threat model เฉพาะครับ

## Auto unlock สะดวกแต่เปลี่ยน Threat model

Server มักต้อง Boot เองหลังไฟดับ จึงมีตัวเลือกอย่าง Key file, TPM2, Network bound disk encryption หรือระบบจัดการ Key ภายนอก

ถ้าเก็บ Key file ไว้บน Disk เดียวกับ Volume โดยไม่มีการป้องกันเพิ่มเติม ก็คล้ายติดกุญแจตู้เซฟไว้ข้างตู้ การเข้ารหัสยังอาจช่วยบางกรณี แต่ไม่ได้ป้องกันคนที่เอาเครื่องทั้งชุดไป

ออกแบบโดยถามว่าเรากำลังป้องกัน:

- คนขโมยเฉพาะ Data disk
- คนขโมยทั้งเครื่อง
- Admin ที่เข้าถึง Host
- Snapshot ที่รั่ว
- ผู้โจมตีผ่าน Network

คำตอบต่างกัน วิธีจัด Key ก็ต่างกันครับ

## Performance และการวัดผล

CPU สมัยใหม่มี Hardware acceleration ทำให้ Overhead ของ Disk encryption มักรับได้ แต่ผลจริงขึ้นกับ Cipher, Sector size, Storage speed, CPU และ Workload

ทดสอบก่อนและหลังด้วย Workload ที่ใกล้ Production เช่น Database random I/O ไม่ใช่ใช้ `dd` Sequential อย่างเดียว ตรวจ CPU, Latency, IOPS และ Queue depth ร่วมกัน

อย่าปรับ Cipher หรือ KDF ตาม Blog เพื่อไล่ตัวเลข Benchmark โดยไม่เข้าใจผลด้าน Security ค่าเริ่มต้นของ cryptsetup ผ่านการพิจารณาความเข้ากันได้และความปลอดภัยมามากกว่า Config ที่เราเดาจากกราฟหนึ่งรูปครับ

## LUKS ใน Cloud และ Container

Cloud volume encryption ของผู้ให้บริการกับ LUKS ป้องกันคนละขอบเขตและใช้ร่วมกันได้:

- Provider encryption จัดการ Key และ Storage layer ให้สะดวก
- LUKS ทำ Encryption ภายใน Guest OS และให้ทีมควบคุม Key เพิ่ม

สำหรับ Container ตัว Container filesystem ไม่ได้ทำให้ Persistent volume เข้ารหัสเอง ถ้า Workload เก็บข้อมูลสำคัญ ต้องดูตั้งแต่ StorageClass, Cloud disk encryption, Node disk, LUKS และ Application-level encryption ตาม Threat model

## Checklist สำหรับทีม

- ใช้ LUKS2 เว้นแต่มีเหตุผล Compatibility
- ใช้ Passphrase entropy สูงหรือ Key management ที่เหมาะสม
- เก็บ Recovery key แยกและจำกัดการเข้าถึง
- Backup LUKS header อย่างปลอดภัย
- ทดสอบ Unlock และ Restore จริง
- Document ว่าใครถือ Key และ Rotate อย่างไร
- Monitor Volume state และ Boot failure
- วางแผน Auto unlock ตาม Threat model
- มี Backup ข้อมูล เพราะ Encryption ไม่ใช่ Backup
- ทำ Secure erase/Retirement process ของ Device

## สรุป

LUKS ทำให้ข้อมูลบน Block device อ่านไม่ออกเมื่อ Volume ยังล็อก โดย Application และ Filesystem ด้านบนทำงานแทบเหมือนเดิม Passphrase ผ่าน KDF เพื่อเปิด Keyslot แล้วได้ Volume key ที่ dm-crypt ใช้กับข้อมูลจริง

จุดแข็งคือความโปร่งใสและการจัดการหลาย Key แต่สิ่งสำคัญที่สุดไม่ใช่คำสั่ง `luksFormat` ครับ มันคือการออกแบบ Threat model, Backup header, Recovery key และขั้นตอนตอนเครื่อง Boot หรือคนในทีมเปลี่ยนงาน ตู้เซฟที่ดีต้องไม่ใช่แค่ขโมยเปิดไม่ได้—เจ้าของที่ได้รับอนุญาตต้องเปิดได้ในวันที่เกิดเหตุด้วย

อ่านต่อจากเอกสารทางการ:

- [cryptsetup FAQ](https://gitlab.com/cryptsetup/cryptsetup/-/blob/main/FAQ.md)
- [cryptsetup manual](https://gitlab.com/cryptsetup/cryptsetup/-/blob/main/man/cryptsetup.8.adoc)
