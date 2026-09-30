---
title: "มาลองสร้าง AWS EC2 ด้วย Terraform กันเถอะ"
author: "Nanpipat Klinpratoom"
published: "2023-12-29"
published_time: "2023-12-29T08:03:38Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%AD%E0%B8%A2%E0%B8%B2%E0%B8%81%E0%B9%80%E0%B8%9B%E0%B9%87%E0%B8%99-devops-%E0%B8%A1%E0%B8%B2%E0%B8%A5%E0%B8%AD%E0%B8%87%E0%B8%AA%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%87-aws-ec2-%E0%B8%94%E0%B9%89%E0%B8%A7%E0%B8%A2-terraform-%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B9%80%E0%B8%96%E0%B8%AD%E0%B8%B0-b6c43a401fd7"
medium_id: "b6c43a401fd7"
---

# มาลองสร้าง AWS EC2 ด้วย Terraform กันเถอะ

การสร้าง EC2 ผ่าน Console ครั้งเดียวไม่ยากครับ คลิกเลือก AMI, Instance type, Network แล้วกด Launch แต่พออยากสร้างเครื่องเหมือนเดิมอีกครั้ง เราจะเริ่มเล่นเกม “เมื่อวานเลือกอะไรไว้นะ” และถ้ามีหลาย Environment เกมนี้จะกลายเป็นรายการวาไรตี้ที่ไม่มีใครอยากดู

Terraform เปลี่ยน Infrastructure ให้เป็น Code เราเก็บ Configuration ใน Git, Review การเปลี่ยนแปลง, ดู Plan ก่อนสร้าง และทำซ้ำได้ วันนี้เราจะสร้าง EC2 พร้อม Security Group และติดตั้ง NGINX ผ่าน `user_data` โดยหลีกเลี่ยงสามกับดักจากตัวอย่างยุคก่อน: ไม่ฝัง AWS key ในไฟล์, ไม่สร้าง Private key ลง State และไม่ใช้ SSH provisioner ถ้า Cloud-init ทำงานแทนได้ครับ

> ตัวอย่างนี้สร้าง Resource ที่อาจมีค่าใช้จ่าย ตรวจ AWS pricing และรัน `terraform destroy` เมื่อทดลองเสร็จ

## สิ่งที่ต้องมี

- AWS account และ IAM permission ที่เหมาะสม
- AWS CLI ที่ Authentication แล้ว
- Terraform CLI
- VPC และ Public subnet สำหรับทดลอง

ตรวจเครื่องมือ:

```bash
aws sts get-caller-identity
terraform version
```

คำสั่งแรกควรแสดง Account และ ARN ที่เราตั้งใจใช้ ถ้า Account ผิด ให้หยุดตรงนี้ก่อน เพราะ Infrastructure as Code ทำงานไวมาก—รวมถึงตอนสร้างของผิดบ้านด้วยครับ

## อย่าใส่ Access key ใน main.tf

ตัวอย่างเก่ามักเขียนแบบนี้:

```hcl
provider "aws" {
  access_key = "AKIA..."
  secret_key = "..."
}
```

ไม่ควรทำ เพราะ Secret จะติด Git, Log หรือไฟล์ที่แชร์ได้ ใช้ AWS profile, Environment variable, IAM role, OIDC หรือ Short-lived credential แทน

```bash
aws configure sso
export AWS_PROFILE=my-sandbox
```

ใน CI ใช้ OIDC เพื่อ Assume role ชั่วคราวแทน Long-lived access key เมื่อ Platform รองรับ หลักคิดคือให้ Terraform ยืมกุญแจเท่าที่จำเป็นและหมดอายุได้ ไม่ใช่สักสำเนากุญแจไว้ใน Source Code ครับ

## โครงไฟล์

```text
terraform-ec2/
├── terraform.tf
├── variables.tf
├── main.tf
├── outputs.tf
└── cloud-init.sh
```

จะแยกไฟล์หรือรวมไฟล์เดียว Terraform ก็อ่านได้ทั้งหมด การแยกมีไว้ช่วยคนอ่าน ไม่ใช่ข้อบังคับของเครื่องมือ

## กำหนด Terraform และ Provider

ไฟล์ `terraform.tf`:

```hcl
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "terraform-ec2-demo"
      Environment = "sandbox"
      ManagedBy   = "terraform"
    }
  }
}
```

Provider version เปลี่ยนตามเวลา ตรวจ Release ที่ทีมทดสอบจริงแล้ว Lock ผ่าน `.terraform.lock.hcl` ตัวอย่าง `~> 6.0` แสดงแนวทางปี 2026 แต่ไม่ใช่คำสั่งให้กระโดด Major version โดยไม่อ่าน Upgrade guide ครับ

## ประกาศตัวแปร

ไฟล์ `variables.tf`:

```hcl
variable "aws_region" {
  description = "AWS region for the demo"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_id" {
  description = "VPC where the EC2 instance will run"
  type        = string
}

variable "subnet_id" {
  description = "Public subnet for the demo instance"
  type        = string
}

variable "allowed_http_cidr" {
  description = "CIDR allowed to reach port 80"
  type        = string
  default     = "0.0.0.0/0"
}
```

สำหรับระบบจริง `0.0.0.0/0` อาจตั้งใจเปิดเว็บ Public แต่ SSH ไม่ควรเปิดทั้งโลก ถ้าต้องเข้าจัดการเครื่อง พิจารณา AWS Systems Manager Session Manager เพื่อลดการเปิด Port 22 และลดภาระจัดการ Key

## หา AMI แบบไม่ฝัง ID ตายตัว

AMI ID ต่างกันตาม Region และเปลี่ยนเมื่อมี Image ใหม่ ใช้ Parameter Store ของ AWS หา Amazon Linux 2023 ล่าสุด:

```hcl
data "aws_ssm_parameter" "amazon_linux_2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}
```

ถ้าต้องการ Reproducibility แบบเป๊ะ ให้ Pin AMI ID ผ่าน Variable หรือ Pipeline ที่มีขั้นตอนอัปเดตและทดสอบ ไม่ว่าทางไหนควรเลือกโดยรู้ Trade-off ระหว่างความสดใหม่กับความทำซ้ำได้ครับ

## สร้าง Security Group

```hcl
resource "aws_security_group" "web" {
  name_prefix = "terraform-web-"
  description = "Allow HTTP to the demo web server"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.allowed_http_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

Security Group เป็น Stateful firewall ไม่ต้องเปิด Inbound port สำหรับ Response traffic แยก และทุก Rule ควรมีเหตุผล อย่าเปิด Port เผื่อไว้ “เดี๋ยวอาจใช้” เพราะ Rule ที่ไม่มีเจ้าของมักอยู่ยาวกว่าคนเขียนครับ

## ติดตั้ง NGINX ผ่าน user_data

ไฟล์ `cloud-init.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

dnf install -y nginx

cat >/usr/share/nginx/html/index.html <<'HTML'
<!doctype html>
<html lang="th">
  <head><meta charset="utf-8"><title>Terraform EC2</title></head>
  <body><h1>Hello from Terraform</h1></body>
</html>
HTML

systemctl enable --now nginx
```

แล้วสร้าง EC2:

```hcl
resource "aws_instance" "web" {
  ami                         = data.aws_ssm_parameter.amazon_linux_2023.value
  instance_type               = "t3.micro"
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [aws_security_group.web.id]
  associate_public_ip_address = true

  user_data                   = file("${path.module}/cloud-init.sh")
  user_data_replace_on_change = true

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    encrypted   = true
    volume_type = "gp3"
    volume_size = 10
  }

  tags = {
    Name = "terraform-web-demo"
  }
}
```

`http_tokens = "required"` บังคับใช้ IMDSv2 ส่วน Disk เปิด Encryption ไว้ตั้งแต่ต้น ค่าเหล่านี้ไม่ทำให้ Demo สนุกขึ้นทันที แต่ช่วยให้ตัวอย่างไม่สอนนิสัยที่ต้องตามแก้ตอนขึ้น Production ครับ

เหตุผลที่ใช้ `user_data` แทน `remote-exec` คือ Terraform ส่ง Script ให้ EC2 ตอน Boot แล้วไม่ต้องเปิด SSH จากเครื่องที่รัน Terraform Provisioner ยังมีกรณีใช้งาน แต่ควรเป็นทางเลือกท้าย ๆ เพราะเชื่อมโลก Configuration management เข้ากับ Infrastructure lifecycle จน Failure และ Retry ซับซ้อนขึ้น

## แสดง Public IP

ไฟล์ `outputs.tf`:

```hcl
output "public_ip" {
  description = "Public IP of the demo web server"
  value       = aws_instance.web.public_ip
}

output "website_url" {
  description = "URL of the demo website"
  value       = "http://${aws_instance.web.public_ip}"
}
```

## เริ่มใช้งาน

Format และ Validate ก่อน:

```bash
terraform fmt -recursive
terraform init
terraform validate
```

ดูแผน:

```bash
terraform plan \
  -var="vpc_id=vpc-xxxxxxxx" \
  -var="subnet_id=subnet-xxxxxxxx" \
  -out=tfplan
```

อ่าน Plan ว่าจะสร้างอะไร Region ถูกไหม และมี Resource ไหนถูกลบโดยไม่ตั้งใจหรือไม่ จากนั้น Apply แผนเดียวกัน:

```bash
terraform apply tfplan
```

เมื่อเสร็จ Terraform จะแสดง `website_url` Cloud-init อาจใช้เวลาเล็กน้อยก่อน NGINX พร้อม ตรวจได้จาก:

```bash
curl "$(terraform output -raw website_url)"
```

## State คือข้อมูลสำคัญ ไม่ใช่ไฟล์ Cache ธรรมดา

Terraform state เชื่อม Resource ใน Code กับของจริง และอาจมีข้อมูล Sensitive ต่อให้เราประกาศ Output เป็น Sensitive ข้อมูลก็ยังอยู่ใน State ได้

สำหรับงานทีม:

- เก็บ State ใน Remote backend ที่เข้ารหัส
- เปิด Locking ตาม Backend ที่ใช้
- จำกัด IAM access
- เปิด Versioning และ Audit log
- ห้าม Commit `terraform.tfstate` เข้า Git
- แยก State ระหว่าง Environment

นี่เป็นเหตุผลอีกข้อที่ไม่ควรสร้าง Private key ด้วย `tls_private_key` แล้วเขียนลง Local file แบบไม่วางแผน เพราะ Key จะเข้า State ด้วย เท่ากับเราย้ายกุญแจบ้านไปเก็บในสมุดบัญชี Infrastructure ครับ

## เก็บของหลังทดลอง

ดูแผน Destroy ก่อน:

```bash
terraform plan -destroy \
  -var="vpc_id=vpc-xxxxxxxx" \
  -var="subnet_id=subnet-xxxxxxxx"
```

จากนั้น:

```bash
terraform destroy \
  -var="vpc_id=vpc-xxxxxxxx" \
  -var="subnet_id=subnet-xxxxxxxx"
```

ตรวจ Console หรือ AWS CLI ว่า Instance และ Security Group ถูกลบครบ ค่า Cloud ที่ลืมปิดเป็นเหมือนก๊อกน้ำหยด—ดูทีละน้อย แต่สิ้นเดือนรวมแล้วชัดเจนครับ

## สรุป

Terraform ทำให้การสร้าง EC2 เปลี่ยนจากชุดคลิกที่จำยากเป็น Code ที่ Review และทำซ้ำได้ ตัวอย่างที่ดีควรแยก Provider, Variables, Resource และ Output ชัดเจน พร้อมรักษา Credential กับ State ตั้งแต่ต้น

หัวใจของเวอร์ชันปี 2026 คือไม่ฝัง Access key, ไม่เก็บ SSH private key ใน State โดยไม่จำเป็น, ใช้ `user_data` หรือ Image pipeline แทน SSH provisioner และเปิด Security baseline อย่าง IMDSv2 กับ Encrypted volume มาเลย IaC ไม่ใช่แค่ทำของให้เกิดครับ แต่ทำให้การสร้าง แก้ และลบมีหลักฐานและคาดเดาได้

อ่านต่อจากเอกสารทางการ:

- [Terraform AWS get started](https://developer.hashicorp.com/terraform/tutorials/aws-get-started)
- [Configure Terraform providers](https://developer.hashicorp.com/terraform/tutorials/configuration-language/configure-providers)
