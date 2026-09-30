---
title: "มาลง Docker ใน Windows Server ผ่าน CLI"
author: "Nanpipat Klinpratoom"
published: "2023-12-22"
published_time: "2023-12-22T12:48:06Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%AD%E0%B8%A2%E0%B8%B2%E0%B8%81%E0%B9%80%E0%B8%9B%E0%B9%87%E0%B8%99-devops-%E0%B8%A1%E0%B8%B2%E0%B8%A5%E0%B8%87-docker-%E0%B9%83%E0%B8%99-windows-server-%E0%B8%9C%E0%B9%88%E0%B8%B2%E0%B8%99-cli-033062178cfc"
medium_id: "033062178cfc"
---

# มาลง Docker ใน Windows Server ผ่าน CLI

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*Wgz0OwWnrczG5o2Q.png)

ภาพจาก [Architecting IT](https://www.architecting.it/blog/windows-containers-making-windows-server-relevant-again/)

ตอนคนสาย Linux ได้ Requirement ว่า “ช่วยลง Container runtime บน Windows Server ให้หน่อย” ความรู้สึกคล้ายถูกส่งเข้าครัวที่มีอุปกรณ์ครบ แต่ปุ่มเปิดเตาอยู่คนละตำแหน่งทั้งหมดครับ ทำได้แน่นอน เพียงต้องแยกให้ชัดว่าเราจะรัน **Windows container** หรือ **Linux container** เพราะสองอย่างนี้ใช้ Kernel คนละโลก

บทความเดิมใช้ Docker CE ผ่าน PowerShell และทดลอง LCOW วันนี้เราจะปรับเส้นทางให้ตรงกับปี 2026: Windows Server รองรับ Runtime หลายตัว ได้แก่ Moby, Mirantis Container Runtime และ containerd ส่วนวิธี LCOW แบบ LinuxKit รุ่นเก่าไม่ควรนำมาทำตามแล้ว ถ้าต้องรัน Linux workload บน Server ให้ใช้ Linux VM, Kubernetes Linux node หรือ Platform ที่รองรับโดยตรงจะชัดและดูแลง่ายกว่าครับ

## ทำความเข้าใจก่อนติดตั้ง

Container ใช้ Kernel ร่วมกับ Host ดังนั้น:

```text
Windows Server host → Windows container
Linux host          → Linux container
```

การรัน Linux container บนเครื่อง Windows ต้องมีชั้น Virtualization ที่ให้ Linux kernel จริง ๆ ไม่ใช่เพียงตั้ง Environment variable แล้ว Windows แปลงร่างเป็น Linux

อีกเรื่องคือ Docker Desktop ออกแบบสำหรับ Windows 10/11 ฝั่ง Developer ไม่ใช่คำตอบมาตรฐานสำหรับ Windows Server แบบไม่มี Desktop เราจะติดตั้ง Runtime บน Server โดยตรงผ่าน PowerShell ครับ

## ขั้นตอนที่ 1 ตรวจเวอร์ชันและสิทธิ์

เปิด PowerShell แบบ Administrator แล้วเช็กระบบ:

```powershell
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber
```

ตรวจว่าเป็น Windows Server รุ่นที่ Runtime และ Base image รองรับ เช่น Windows Server 2022 หรือ 2025 และตรวจ Licensing/Support policy ขององค์กรด้วย โดยเฉพาะ Production ที่อาจต้องใช้ Mirantis Container Runtime หรือ Managed platform เพื่อให้มี Vendor support

## ขั้นตอนที่ 2 เปิด Containers feature

```powershell
Install-WindowsFeature -Name Containers
Restart-Computer -Force
```

คำสั่งเดิม `Enable-WindowsOptionalFeature` ยังพบได้ในหลายคู่มือ แต่สำหรับ Windows Server การใช้ `Install-WindowsFeature` อ่านเจตนาชัดและตรวจผลผ่าน Server Manager ได้

หลัง Restart:

```powershell
Get-WindowsFeature -Name Containers
```

สถานะควรเป็น Installed

## ขั้นตอนที่ 3 เลือก Runtime

Microsoft ระบุ Runtime ที่รองรับบน Windows Server ไว้หลายทาง:

- **Moby หรือ Docker CE** ได้ CLI ที่คนคุ้นเคย เหมาะกับ Lab และ Environment ที่ทีมรับผิดชอบ Support เอง
- **Mirantis Container Runtime** มีทางเลือก Support เชิงพาณิชย์สำหรับ Enterprise
- **containerd** เป็น Runtime มาตรฐานที่ใช้ในระบบ Orchestration จำนวนมาก และใช้ `nerdctl` เป็น CLI ที่หน้าตาคล้าย Docker

บทนี้ใช้ Moby/Docker CE เพื่อให้ต่อจากบทความเดิม แต่ Production ต้องเลือกตาม Support requirement ไม่ใช่เลือกเพราะคำสั่งสั้นที่สุดครับ

## ขั้นตอนที่ 4 ติดตั้ง Moby ผ่าน Script ของ Microsoft

ดาวน์โหลด Script จาก Repository ของทีม Windows Containers:

```powershell
Invoke-WebRequest `
  -UseBasicParsing `
  "https://raw.githubusercontent.com/microsoft/Windows-Containers/Main/helpful_tools/Install-DockerCE/install-docker-ce.ps1" `
  -OutFile "install-docker-ce.ps1"
```

ก่อนรันในระบบจริง ควรเปิดอ่าน Script, Pin Commit URL ที่ผ่าน Review และตรวจ Hash ตามกระบวนการ Supply chain ขององค์กร การดาวน์โหลด Script ล่าสุดแล้วรันเป็น Administrator ทันที สะดวกเหมือนฝากกุญแจบ้านไว้กับพนักงานส่งอาหาร—บาง Lab ยอมรับได้ แต่ Production ควรตรวจคนถือกุญแจก่อนครับ

รัน Script:

```powershell
.\install-docker-ce.ps1
```

ถ้า Script ขอ Restart:

```powershell
Restart-Computer -Force
```

หลังเครื่องกลับมา ตรวจ Runtime:

```powershell
docker version
Get-Service docker
```

จัดการ Service ได้ด้วย:

```powershell
Start-Service docker
Stop-Service docker
Restart-Service docker
```

ตั้งให้เริ่มพร้อมเครื่อง:

```powershell
Set-Service docker -StartupType Automatic
```

## ทางเลือก ติดตั้ง containerd และ nerdctl

ถ้าทีมเลือก containerd ใช้ Script ทางการจาก Repository เดียวกัน:

```powershell
Invoke-WebRequest `
  -UseBasicParsing `
  "https://raw.githubusercontent.com/microsoft/Windows-Containers/Main/helpful_tools/Install-ContainerdRuntime/install-containerd-runtime.ps1" `
  -OutFile "install-containerd-runtime.ps1"

.\install-containerd-runtime.ps1
```

Script นี้ติดตั้ง containerd, nerdctl, Windows CNI plugins และ Feature ที่เกี่ยวข้อง แต่การตั้งค่า Network ยังต้องเลือกให้เหมาะกับ Environment ของเรา อย่าถือว่า Container ขึ้นได้หนึ่งตัวแปลว่า Production networking พร้อมทั้งหมดครับ

## ขั้นตอนที่ 5 รัน Windows container แรก

เลือก Base image ให้เข้ากับ Host OS Windows container มีเรื่อง Version compatibility มากกว่า Linux image โดยทั่วไป Image ใหม่กว่า Host มักรันไม่ได้ และบางคู่ต้องใช้ Hyper-V isolation

ตัวอย่าง Windows Server 2022:

```powershell
docker pull mcr.microsoft.com/windows/nanoserver:ltsc2022
```

ลองรัน:

```powershell
docker run --rm `
  mcr.microsoft.com/windows/nanoserver:ltsc2022 `
  cmd.exe /s /c echo Hello-from-Windows-container
```

หรือใช้ .NET sample ที่เป็น Windows image และตรงกับ OS tag ที่รองรับ ตรวจ Tag จาก Microsoft Container Registry ก่อนทุกครั้ง อย่าใช้ `latest` แล้วหวังให้ Registryเดา Kernel version ให้เราครับ

## แล้ว Linux container บน Windows Server ล่ะ

บทความเดิมใช้ตัวแปร `LCOW_SUPPORTED`, Experimental feature และ LinuxKit release เก่ามาก เส้นทางนี้ไม่ควรถูกนำมาใช้กับระบบใหม่ปี 2026

ถ้าต้องรัน Linux container มีทางเลือกที่ชัดกว่า:

1. สร้าง Linux VM บน Hyper-V แล้วติดตั้ง Docker/containerd ข้างใน
2. ใช้ Kubernetes ที่มี Linux node pool และ Windows node pool แยกกัน
3. ใช้ Managed service เช่น AKS/EKS/GKE ตาม Cloud ที่เลือก
4. สำหรับเครื่อง Developer ใช้ Windows 10/11 กับ Docker Desktop หรือ WSL 2 ตาม Support matrix

การมี Node คนละ OS ไม่ใช่ปัญหา Kubernetes Scheduling ใช้ Node selector, Taint/Toleration และ RuntimeClass ช่วยวาง Workload ให้ถูกบ้านได้

```yaml
spec:
  nodeSelector:
    kubernetes.io/os: windows
```

Windows image ไป Windows node ส่วน Linux image ไป Linux node ไม่ต้องบังคับให้ Host ตัวเดียวใส่หมวกสองใบจนดูแลยากครับ

## เรื่องที่มักพลาด

### Image กับ Host version ไม่เข้ากัน

ตรวจ Windows container version compatibility และเลือก `ltsc2022`, `ltsc2025` หรือ Tag อื่นให้ตรง อย่าแก้ด้วยการสุ่ม Pull หลาย Tag จนเจอตัวที่รันได้โดยไม่รู้เหตุผล

### คิดว่า Docker Desktop เท่ากับ Docker Engine บน Server

สองอย่างมี Packaging, Licensing และ Support model ต่างกัน คู่มือ Desktop จึงไม่ควรถูก Copy มาใช้กับ Server โดยอัตโนมัติ

### เปิด Docker API ออก Network โดยไม่มี TLS

Docker daemon API มีสิทธิ์สูงมาก อย่าเปิด TCP port สาธารณะโดยไม่มี Authentication และ TLS ผู้ที่ควบคุม Daemon มักยกระดับไปควบคุม Host ได้

### ไม่วางแผน Patch

Windows container ผูกกับ Host และ Base image lifecycle ต้อง Patch ทั้ง Host, Runtime และ rebuild Image อย่างสม่ำเสมอ Container ที่สร้างเมื่อปีที่แล้วไม่ได้รับ Patch เพียงเพราะ Host อัปเดตแล้วครับ

### เอา Path หรือ Credential ของ Host เข้า Container เกินจำเป็น

Mount เฉพาะสิ่งที่ต้องใช้และกำหนดสิทธิ์ให้แคบ การ Mount pipe หรือ Directory สำคัญทำให้ Isolation ที่ควรเป็นกำแพงกลายเป็นประตูหลัง

## Checklist สำหรับ Production

- เลือก Runtime ตาม Support policy
- ตรวจ Host/Image compatibility
- Pin และ Scan Base image
- ใช้ Registry ภายในหรือ Trusted registry
- Patch Host และ rebuild Image เป็นรอบ
- จำกัดสิทธิ์ Service account และ Volume mount
- ปิด Remote daemon access ที่ไม่จำเป็น
- ส่ง Log และ Metrics ไปศูนย์กลาง
- ทดสอบ Restore และ Node replacement
- ถ้า Workload เป็น Linux ให้ใช้ Linux host หรือ Linux node

## สรุป

การรัน Container บน Windows Server ไม่ได้น่ากลัว แต่ต้องเริ่มจากการเลือก OS ของ Workload และ Runtime ให้ถูก Windows container รันบน Windows kernel ส่วน Linux container ควรมี Linux kernel ผ่าน VM หรือ Linux node จริง

สำหรับ Lab เราติดตั้ง Moby ผ่าน PowerShell แล้วลอง Nano Server ได้รวดเร็ว ส่วน Production ควรตัดสินใจเรื่อง Vendor support, Runtime, Version compatibility และ Patch lifecycle ให้ครบ อย่าให้คำว่า `docker run` ที่ดูง่ายหลอกเราว่าระบบข้างล่างไม่มีรายละเอียดครับ—Container เบา แต่การดูแล Host ยังมีน้ำหนักเต็มใบเหมือนเดิม

อ่านต่อจากเอกสารทางการ:

- [Prepare Windows for containers](https://learn.microsoft.com/virtualization/windowscontainers/quick-start/set-up-environment)
- [Run your first Windows container](https://learn.microsoft.com/virtualization/windowscontainers/quick-start/run-your-first-container)
