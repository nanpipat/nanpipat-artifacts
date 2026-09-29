---
title: "มาลองสร้าง AWS EC2 ด้วย Terraform กันเถอะ"
author: "Nanpipat Klinpratoom"
published: "2023-12-29"
published_time: "2023-12-29T08:03:38Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%AD%E0%B8%A2%E0%B8%B2%E0%B8%81%E0%B9%80%E0%B8%9B%E0%B9%87%E0%B8%99-devops-%E0%B8%A1%E0%B8%B2%E0%B8%A5%E0%B8%AD%E0%B8%87%E0%B8%AA%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%87-aws-ec2-%E0%B8%94%E0%B9%89%E0%B8%A7%E0%B8%A2-terraform-%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B9%80%E0%B8%96%E0%B8%AD%E0%B8%B0-b6c43a401fd7"
medium_id: "b6c43a401fd7"
---

# มาลองสร้าง AWS EC2 ด้วย Terraform กันเถอะ

โอเคมาเริ่มจากรู้จัก Terraform คร่าว ๆ กันก่อน

**Terraform** เป็นเครื่องมือที่ใช้สำหรับการจัดการโครงสร้างพื้นฐาน (Infrastructure as Code — IaC) ซึ่งช่วยให้ผู้ดูแลระบบและนักพัฒนาสามารถกำหนดและจัดการทรัพยากร IT ในรูปแบบของโค้ด ทำให้สามารถสร้าง, ปรับปรุง, และลบทรัพยากรได้โดยอัตโนมัติและมีประสิทธิภาพ.

Terraform สามารถใช้กับหลายๆ ผู้ให้บริการคลาวด์ (cloud providers) เช่น Amazon Web Services (AWS), Microsoft Azure, Google Cloud Platform (GCP), และอื่นๆ รวมทั้งบริหารจัดการทรัพยากรที่ตั้งอยู่ภายใน Provider ได้ด้วย เช่น เซิร์ฟเวอร์, ฐานข้อมูล, เครือข่าย, และการกำหนดค่าต่าง ๆ.

โดยอันที่ผมยกมาเป็นตัวอย่างจะเป็นตัวอย่างง่าย ๆ นะครับ เป็นการสร้างเครื่อง EC2 บน AWS และติดตั้ง nginx พร้อมเอา index.html ที่เรามีขึ้นไปรันบนนั้นนะครับ

## Prerequisites

1.   **AWS Account** ตรงนี้อาจจะต้องเช็คด้วยว่า account เรานั้นมี permission ที่จะสร้างหรือจัดการกับ services นั้น ๆ ได้หรือไม่นะครับ
2.   **Terraform Installed** ติดตั้ง Terraform บนเครื่องของเรา โดยสามารถดาวน์โหลดและติดตั้งได้จาก [เว็บไซต์ของ Terraform.](https://developer.hashicorp.com/terraform/install)

## Terraform Code

เราจะสร้างไฟล์ขึ้นมาหนึ่งไฟล์ชื่อว่า main.tf เพื่อใช้สำหรับการ config ต่าง ๆ โดยอันนี้ผมจะค่อย ๆ ไล่ไปทีละ section นะครับ จะได้มีพร้อมคำอธิบาย และเดี๋ยวจะมีโค้ดรวมทั้งหมดให้อีกทีครับ

- เริ่มต้นโดยการเราบอกก่อนว่าเราจะใช้อะไร provider เจ้าไหนหรือ service อะไรและเราจะใส่พวก provider config ลงไปในนี้เลย (จริง ๆ แล้วเป็นท่าที่ไม่ได้แนะนำนะครับ แนะนำให้เป็นการ config ผ่านเครื่องที่เราใช้ดีกว่า อันนี้แค่ตัวอย่างว่าทำได้)

terraform {  
 required_providers {  
 aws = {  
 source = "hashicorp/aws"  
 version = "~> 4.0"  
 }  
 }  
}
provider "aws" {  
 region = "ap-southeast-1"  
 access_key = "AKXXXXXXXXXXXXXX"   
 secret_key = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"   
}

- ต่อมาเป็นเรื่องของการ generate key pair เพื่อเอาไว้สำหรับการ connect เข้ามาที่เครื่องผ่าน SSH นะครับ โดยเราสามารถกำหนดให้มันเซฟไฟล์ PEM ลงมาที่เครื่องเราได้เลย

  
resource "tls_private_key" "rsa_4096" {  
 algorithm = "RSA"  
 rsa_bits = 4096  
}
variable "key_name" {  
 description = "Name of the SSH key pair"  
}

resource "aws_key_pair" "key_pair" {  
 key_name = var.key_name  
 public_key = tls_private_key.rsa_4096.public_key_openssh  
}

resource "local_file" "private_key" {  
 content = tls_private_key.rsa_4096.private_key_pem  
 filename = var.key_name  
}

- ต่อไปเราจะมาสร้าง security group ของ aws นะครับเพื่อเอาไว้ผูกกับตัว instance นี้ โดยเราสามารถ config ที่เราต้องการได้เลยผ่านตัวโค้ดนี้ หรือหากใครมีตัว security group เดิมหรือที่ต้องการใช้ก็สามารถข้ามตรงนี้ไปได้ครับ

  
resource "aws_security_group" "sg_web" {  
 name = "sg_web"  
 description = "Allow inbound traffic from specified IP"
ingress {  
 from_port = 80  
 to_port = 80  
 protocol = "tcp"  
 cidr_blocks = ["0.0.0.0/0"]  
 }

egress {  
 from_port = 0  
 to_port = 0  
 protocol = "-1"  
 cidr_blocks = ["0.0.0.0/0"]   
 }  
}

- ต่อไปเราจะมาสร้าง ec2 instance กันครับ ขั้นตอนนี้ผมจะรวมการติดตั้ง nginx พร้อมกับการ copy file index.html ของเราเข้าไปแทนที่ของ nginx เลยนะครับ โดยวิธีที่ผมใช้จะเป็นการสร้างเครื่องขึ้นมาก่อน แล้วจึง ssh เข้าไปติดตั้งและทำ action อื่น ๆ ทีหลังนะครับ

  
resource "aws_instance" "test-terraform-instance" {  
 ami = "ami-078c1149d8ad719a7"  
 instance_type = "t2.micro"  
 key_name = aws_key_pair.key_pair.key_name  
 vpc_security_group_ids = [aws_security_group.sg_web.id]  
 tags = {  
 Name = "test-terraform-instance"  
 }
provisioner "file" {  
 source = "index.html"  
 destination = "/tmp/index.html"

# Connection is necessary for file provisioner to work  
 connection {  
 type = "ssh"  
 host = self.public_ip  
 user = "ubuntu"  
 private_key = file("name_of_pem_file")  
 timeout = "4m"  
 }  
 }

provisioner "remote-exec" {  
 inline = [  
 "sudo apt-get update",  
 "sudo apt-get install -y docker.io",  
 "sudo docker run -d -p 80:80 --name my-nginx -v /tmp/index.html:/usr/share/nginx/html/index.html:ro nginx"  
 ]  
 }  
}

อันนี้เป็นโค้ดเต็ม ๆ ของไฟล์ main.tf นะครับ

terraform {  
 required_providers {  
 aws = {  
 source = "hashicorp/aws"  
 version = "~> 4.0"  
 }  
 }  
}
provider "aws" {  
 region = "ap-southeast-1"  
 access_key = "AKXXXXXXXXXXXXXX"   
 secret_key = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"   
}

resource "tls_private_key" "rsa_4096" {  
 algorithm = "RSA"  
 rsa_bits = 4096  
}

variable "key_name" {  
 description = "Name of the SSH key pair"  
}

resource "aws_key_pair" "key_pair" {  
 key_name = var.key_name  
 public_key = tls_private_key.rsa_4096.public_key_openssh  
}

resource "local_file" "private_key" {  
 content = tls_private_key.rsa_4096.private_key_pem  
 filename = var.key_name  
}

resource "aws_security_group" "sg_web" {  
 name = "sg_web"  
 description = "Allow inbound traffic from specified IP"

ingress {  
 from_port = 80  
 to_port = 80  
 protocol = "tcp"  
 cidr_blocks = ["0.0.0.0/0"]  
 }

egress {  
 from_port = 0  
 to_port = 0  
 protocol = "-1"  
 cidr_blocks = ["0.0.0.0/0"]  
 }  
}

resource "aws_instance" "test-terraform-instance" {  
 ami = "ami-078c1149d8ad719a7"  
 instance_type = "t2.micro"  
 key_name = aws_key_pair.key_pair.key_name  
 vpc_security_group_ids = [aws_security_group.sg_web.id]  
 tags = {  
 Name = "test-terraform-instance"  
 }

provisioner "file" {  
 source = "index.html"  
 destination = "/tmp/index.html"

# Connection is necessary for file provisioner to work  
 connection {  
 type = "ssh"  
 host = self.public_ip  
 user = "ubuntu"  
 private_key = file("name_of_pem_file")  
 timeout = "4m"  
 }  
 }

provisioner "remote-exec" {  
 inline = [  
 "sudo apt-get update",  
 "sudo apt-get install -y docker.io",  
 "sudo docker run -d -p 80:80 --name my-nginx -v /tmp/index.html:/usr/share/nginx/html/index.html:ro nginx"  
 ]  
 }  
}

## Usage

1.ทำการ initialize Terraform

terraform init
2.ตรวจสอบข้อมูลทั้งหมดอีกครั้ง (plan, services ต่าง ๆ)

terraform plan
3.ทำการ apply

terraform apply
4.เรียบร้อยครับ Terraform จะแสดงข้อมูลเกี่ยวกับสิ่งที่สร้างขึ้น, รวมถึงที่อยู่ IP public ของ EC2 instance ด้วย

เรียบร้อยครับ เพียงเท่านี้เราก็จะได้ EC2 instance 1 เครื่อง พร้อม setting config ทุกอย่าง โดยจัดการผ่าน code หมดทุกอย่างเลย ซึ่งวิธีนี้ทำให้เราจัดการเครื่องได้ง่ายมาก ๆ ไม่ต้องเข้าไปทำในหน้าเว็บไซต์ให้ยุ่งยากเลย เดี๋ยวผมจะแปะ ref พวก command ต่าง ๆ เอาไว้ให้ด้วยนะครับ

> ref : [https://developer.hashicorp.com/terraform/cli/commands](https://developer.hashicorp.com/terraform/cli/commands)
