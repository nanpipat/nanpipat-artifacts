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

image from : [https://www.architecting.it/blog/windows-containers-making-windows-server-relevant-again](https://www.architecting.it/blog/windows-containers-making-windows-server-relevant-again/)

สืบเนื่องมาจากได้รับ requirement มาให้ setup ตัว docker แต่มันติ๊ดดดดอยู่เรื่องนึงคือ server นั้นคือ windows server สำหรับสาย linux แบบผมนี่ถือว่าหนักเอาเรื่อง เพราะเคยไปจับ ๆ เล่นแล้วรู้สึกว่ามันไม่อ่อนโยนต่อผมเท่าไหร่เลย 5555555

โอเคเข้าเรื่อง คือไอตัว windows server ใหม่ ๆ เนี่ย จริง ๆ มันก็ค่อนข้างเป็นมิตรกับ docker แล้ว ก็คือลง docker desktop ก็จบปิ๊งอะไรทำนองนั้น แต่ก็ไม่น้อยเลยที่เราจะเจอปัจจัยไม่คาดคิดในหลาย ๆ อย่าง เช่น ปัญหาจาก hardware, การ config พวก bios อะไรต่าง ๆ ซึ่งหลังจากผมลองผิดลองถูกมาอย่างยาวนาน ก็เลยได้ solution นึงที่ลงผ่าน cli มา ซึ่งก็ถือว่าใช้ได้ในระดับนึงเลย เลยอยากจะเขียนเก็บไว้ให้สมกับเวลา research 😂😂 โอเคมาเริ่มกันเลย

**ขั้นตอนที่ 1 : เปิดฟีเจอร์ container**

ขั้นตอนแรกคือเปิดใช้งาน feature ของ Windows Server containers เปิด PowerShell ในฐานะ Administrator แล้วรันคำสั่งตามนี้

Enable-WindowsOptionalFeature -Online -FeatureName Containers
หากมี promt ขึ้นมาให้กด y เพื่อยอมรับ

**ขั้นตอนที่ 2 : ติดตั้ง Docker Engine บน Windows Server**

เมื่อเปิดใช้งาน feature Containers บน Windows Server แล้ว ติดตั้ง Docker Engine และ Client ล่าสุดโดยการรันคำสั่งด้านล่างใน PowerShell

Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/microsoft/Windows-Containers/Main/helpful_tools/Install-DockerCE/install-docker-ce.ps1" -o install-docker-ce.ps1
เมื่อดาวน์โหลดเรียบร้อย หลังจากนั้นเราจะกันติดตั้งกัน โดย

.\install-docker-ce.ps1
หากติดตั้งเรียบร้อย ใน powershell ของเราจะโชว์ข้อมูลของ repository , image และอื่น ๆ ขึ้นมา แต่มันจะยังไม่มีข้อมูลในลิสแต่อย่างใดเพราะเรายังไม่ได้ทำอะไรกับมัน หากขึ้นตามที่กล่าว restart server 1 รอบครับ

Restart-Computer -Force
หลังจาก server start ขึ้นมา ลองใช้ command

docker version
หากขึ้นข้อมูลต่าง ๆ ของ docker เป็นอันว่าเรียบร้อยครับ ละเราจะมาลอง start service docker กัน โดยใช้คำสั่ง

Start-Service Docker
ถ้าอยากจะปิด service ก็

Stop-Service Docker
**ขั้นตอนที่ 3 : รัน Docker Container**

ลองรัน container กันดูครับ แต่ด้วยตอนนี้เราลงใน env windows เพราะฉะนั้น ตัว images ที่เราจะใช้ได้ก็จะต้องเป็นตัวที่ใช้ได้กับ windows ผมเลยจะลองเป็นตัว .NET ดูแล้วกันครับ

docker run --rm mcr.microsoft.com/dotnet/samples docker run -it --rm -p 8000:8080 --name aspnetcore_sample mcr.microsoft.com/dotnet/samples:aspnetapp docker pull mcr.microsoft.com/windows/nanoserver:ltsc2022
ถ้าทุกอย่างผ่านหมดเป็นอันว่าโอเค ตรงนี้ผมจะไม่สอนการใช้ docker นะครับ คิดว่าคนที่เข้ามาอ่านน่าจะใช้ได้ในระดับนึงอยู่แล้ว

**ขั้นตอนที่ 4 : รัน Linux Containers**

อย่างที่บอกไปครับ ส่วนใหญ่ images ต่าง ๆ ที่รันกับ docker ก็จะ compatible กับ linux ซะเป็นส่วนใหญ่ เพราะงั้นเราจะมาทำ linux container เพื่อไว้รัน images กัน สิ่งนี้จะเรียกว่า LCOW (Linux containers on Windows) ผมจะแปะ ref ไว้เผื่อใครสนใจอยากจะอ่านนะครับ   
**_ref :_**[**_https://learn.microsoft.com/en-us/virtualization/windowscontainers/deploy-containers/linux-containers_**](https://learn.microsoft.com/en-us/virtualization/windowscontainers/deploy-containers/linux-containers)

โอเคขั้นแรกเราต้องเปิด Hyper-V ของเครื่อง server ก่อนเลย

Get-VM WinContainerHost | Set-VMProcessor -ExposeVirtualizationExtensions $true
เปิดใช้ LinuxKit system เพื่อรัน Linux containers

[Environment]::SetEnvironmentVariable("LCOW_SUPPORTED", "1", "Machine")
หลังจากนั้น restart Docker Service

Restart-Service docker
เปิดใช้งาน Experimental Features ใน Docker daemon

$configfile = @”
{

“experimental”: true

}

“@

$configfile|Out-File -FilePath C:\ProgramData\docker\config\daemon.json -Encoding ascii -Force

เนื่องจาก Linux Containers ต้องการเคอร์เนล Linux เราจึงต้องปรับใช้ LCOW เพื่อให้รันได้

Invoke-WebRequest -Uri "https://github.com/linuxkit/lcow/releases/download/v4.14.35-v0.3.9/release.zip" -UseBasicParsing -OutFile release.zip  
Expand-Archive release.zip -DestinationPath "$Env:ProgramFiles\Linux Containers\."
ลอง pull images มา test กันครับ

docker run --name test -it debian
ประมาณนี้ครับ ง่าย ๆ ไม่ยาก แต่ผมทำเป็นวันเลย 55555

Tips : หากเราอยากจะสลับไปใช้ windows env เหมือนเดิมก็รันคำสั่งนี้ได้เลยครับ

[Environment]::SetEnvironmentVariable("LCOW_SUPPORTED", "$null", "Machine")
เพียงเท่านี้เราก็จะใช้ docker บน windows server ได้แล้วครับ ขอให้เพลิดเพลินครับ ส่วนผมขออุญาตกลับไปหา linux ที่รักก่อนละครับ ฮาๆๆๆ หากมี error หรือติดอะไรลองคอมเม้นไว้ได้นะครับ ผมเองก็ได้ได้เชี่ยวชาญมากมายแต่จะลองช่วยหาคำตอบดูครับ ขอบคุณครับบบ
