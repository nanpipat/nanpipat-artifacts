---
title: "การติดตั้ง GitLab Runner บน Kubernetes Cluster 🎉🚀"
author: "Nanpipat Klinpratoom"
published: "2024-06-27"
published_time: "2024-06-27T06:03:27Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%95%E0%B8%B1%E0%B9%89%E0%B8%87-gitlab-runner-%E0%B8%9A%E0%B8%99-kubernetes-cluster-1d1b59971846"
medium_id: "1d1b59971846"
---

# การติดตั้ง GitLab Runner บน Kubernetes Cluster 🎉🚀

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*5FEMAOCat9fVvMsp.png)

GitLab Runner คือคนงานที่หยิบ Job จาก Pipeline มาทำ ส่วน Kubernetes executor ทำให้ Job แต่ละตัวได้ Pod ใหม่ของตัวเอง ทำเสร็จแล้วก็เก็บ Pod กลับ ไม่ต้องมีเครื่อง Build หนึ่งตัวที่สะสมไฟล์ Cache และเศษโปรเจกต์จนกลายเป็นห้องเก็บของใต้บันไดครับ

ปี 2026 Helm chart ยังเป็นวิธีทางการสำหรับติดตั้ง GitLab Runner บน Kubernetes แต่ขั้นตอน Registration เปลี่ยนจากบทความยุคก่อนพอสมควร ปัจจุบันควรสร้าง Runner ใน GitLab UI ก่อน แล้วใช้ **Runner authentication token** ซึ่งมักขึ้นต้นด้วย `glrt-` แทน Workflow เก่าที่ใช้ Registration token

อีกจุดที่ต้องแก้คือไม่ควรเริ่มจาก `privileged: true` และ Mount `/var/run/docker.sock` โดยอัตโนมัติ เพราะเท่ากับยื่นกุญแจ Host ให้ Build job ทุกตัวครับ

## ภาพการทำงาน

```text
GitLab Pipeline
      ↓ รับ Job
Runner manager Pod
      ↓ สร้าง Pod ชั่วคราว
Build Pod → ทำงาน → ส่งผลลัพธ์ → ถูกลบ
```

Runner manager ไม่ได้ Compile งานทั้งหมดใน Pod ตัวเอง มันคุยกับ Kubernetes API เพื่อสร้าง Pod ต่อ Job ตาม Config ที่กำหนด

## สิ่งที่ต้องมี

- Kubernetes cluster และ `kubectl`
- Helm CLI
- GitLab project หรือ group ที่มีสิทธิ์สร้าง Runner
- Namespace สำหรับ Runner
- Network จาก Cluster ไป GitLab และ Container registry
- Storage/Cache backend ถ้าต้องการ Cache ข้าม Job

ตรวจ Context ก่อน:

```bash
kubectl config current-context
kubectl auth can-i create pods --namespace gitlab-runner
```

## สร้าง Runner ใน GitLab

ไปที่ Project หรือ Group:

```text
Settings → CI/CD → Runners → New project/group runner
```

กำหนด Description, Tag, การรับ Untagged job และ Protection ตามที่ต้องการ แล้วเก็บ Runner authentication token ไว้ใน Secret manager Token นี้เป็น Credential ไม่ควร Commit ใน `values.yaml`

ถ้าระบบของทีมยังแสดงคำว่า Registration token ให้ตรวจ GitLab version และ Migration guide เพราะ Workflow เก่าถูกทยอยยกเลิกไปแล้วครับ

## เพิ่ม Helm repository

```bash
helm repo add gitlab https://charts.gitlab.io
helm repo update
helm search repo -l gitlab/gitlab-runner
```

เลือก Chart version และ Pin ไว้ใน Pipeline แทนติดตั้งล่าสุดแบบลอย ๆ เพื่อให้ Upgrade มีจังหวะ Review

## สร้าง Namespace และ Secret

```bash
kubectl create namespace gitlab-runner
```

สร้าง Secret โดยไม่เขียน Token ลงไฟล์:

```bash
kubectl create secret generic gitlab-runner-token \
  --namespace gitlab-runner \
  --from-literal=runner-token='glrt-REPLACE_ME' \
  --from-literal=runner-registration-token=''
```

ชื่อ Key อาจขึ้นกับ Chart version ที่ใช้งาน ตรวจ `values.yaml` ทางการของ Version นั้นเสมอ ถ้าองค์กรมี External Secrets ให้ดึง Token จาก Secret manager แทนการสร้างมือครับ

## เขียน values.yaml แบบสิทธิ์พอดีตัว

```yaml
gitlabUrl: https://gitlab.com/

rbac:
  create: true

serviceAccount:
  create: true

concurrent: 5
checkInterval: 10

runners:
  secret: gitlab-runner-token
  tags: "kubernetes"
  runUntagged: false
  protected: true
  config: |
    [[runners]]
      [runners.kubernetes]
        namespace = "gitlab-runner"
        image = "alpine:3.20"
        privileged = false
        poll_timeout = 600

        cpu_request = "250m"
        memory_request = "256Mi"
        cpu_limit = "1"
        memory_limit = "1Gi"

      [runners.kubernetes.pod_security_context]
        run_as_non_root = true
        run_as_user = 1000
```

ตัวอย่าง Resource เป็นจุดเริ่มต้น ต้องวัดจาก Job จริง ถ้าต่ำเกิน Job ถูก OOMKilled ถ้าสูงเกิน Scheduler วาง Pod ได้น้อยเหมือนจองโต๊ะสิบที่ให้คนนั่งคนเดียวครับ

Field ใน Helm chart เปลี่ยนได้ตาม Version ให้เทียบกับ Default `values.yaml` และเอกสารก่อน Apply โดยเฉพาะชื่อ Secret และ Runner token

## ติดตั้ง Runner

```bash
helm upgrade --install gitlab-runner gitlab/gitlab-runner \
  --namespace gitlab-runner \
  --version <PINNED_CHART_VERSION> \
  --values values.yaml \
  --wait \
  --timeout 5m
```

ตรวจ Resource:

```bash
kubectl get pods -n gitlab-runner
kubectl logs deployment/gitlab-runner -n gitlab-runner
helm status gitlab-runner -n gitlab-runner
```

กลับไปหน้า Runners ใน GitLab สถานะควร Online

## ทดสอบด้วย Pipeline เล็ก ๆ

ไฟล์ `.gitlab-ci.yml`:

```yaml
stages:
  - test

hello-runner:
  stage: test
  tags:
    - kubernetes
  image: alpine:3.20
  script:
    - echo "Hello from Kubernetes executor"
    - cat /etc/os-release
```

เมื่อ Pipeline เริ่ม Runner manager จะสร้าง Build Pod ใหม่ ดูได้ด้วย:

```bash
kubectl get pods -n gitlab-runner --watch
```

ถ้า Job ค้างที่ Pending ให้ดู Event:

```bash
kubectl describe pod <job-pod> -n gitlab-runner
```

สาเหตุมักเป็น Image pull, Resource ไม่พอ, Admission policy, ServiceAccount หรือ Node selector ไม่ตรงครับ

## ทำไมไม่ควร Mount Docker socket

Config แบบเก่ามักมี:

```text
/var/run/docker.sock:/var/run/docker.sock
privileged = true
```

เมื่อ Container ควบคุม Docker socket ของ Node ได้ มันอาจสร้าง Container ใหม่ Mount filesystem ของ Host หรือขยายสิทธิ์ออกนอก Job Pod ได้ Isolation ที่ Kubernetes เตรียมไว้จึงแทบหายไป

ถ้าต้อง Build image พิจารณาทางเลือกที่ไม่ยื่น Socket ของ Host ให้ Job เช่น:

- BuildKit แบบ Rootless
- Buildah ตาม Environment ที่รองรับ
- Cloud-native image builder ของ Platform
- แยก Runner สำหรับงานที่ต้องสิทธิ์สูงออกจาก Runner ทั่วไป

ถ้าจำเป็นต้อง Privileged จริง ให้ใช้ Dedicated node, Taint/Toleration, Network policy และไม่รับ Job จาก Repository ที่ไม่ไว้ใจ อย่าให้ Pull request จากคนแปลกหน้ารันบน Runner ที่ถือกุญแจ Cluster ครับ

## จำกัด Blast radius

Runner เป็นระบบประมวลผลโค้ดจาก Repository จึงควรมองเหมือนห้องทดลองที่อาจมีสารเคมี ไม่ใช่ Pod ธรรมดา

แนวปฏิบัติที่ควรมี:

- Namespace แยก
- ServiceAccount และ RBAC ขั้นต่ำ
- NetworkPolicy จำกัดปลายทาง
- Pod Security Admission ระดับที่เหมาะสม
- Resource requests/limits และ Namespace quota
- Runner แยกตาม Trust boundary
- Protected runner สำหรับ Branch/Tag สำคัญ
- ไม่ส่ง Secret ให้ Job ที่ไม่ต้องใช้
- Rotate Runner token เมื่อสงสัยว่ารั่ว

## Cache และ Artifact คนละอย่าง

- **Cache** ช่วยให้ Job รอบต่อไปเร็วขึ้น เช่น Dependency cache ลบได้และ Pipeline ควรสร้างใหม่ได้
- **Artifact** คือผลลัพธ์ของ Job เช่น Binary, Test report หรือ Coverage ที่ต้องส่งต่อหรือตรวจย้อนหลัง

สำหรับ Runner ที่ Pod หายหลังจบ Job Local cache ไม่ได้อยู่ถาวร ถ้าต้องแชร์ข้าม Pod ให้ตั้ง Object storage เช่น S3-compatible backend และกำหนด Lifecycle ไม่ให้ Cache เก่าสะสมจนค่าใช้จ่ายโตเงียบ ๆ

## Upgrade อย่างไม่สะดุด

ก่อน Upgrade:

1. Pause Runner ใน GitLab ถ้าต้องการหยุดรับงานใหม่
2. รอ Job ปัจจุบันจบ
3. อ่าน Release note ของ Chart และ Runner
4. `helm diff` หรือดูค่าที่เปลี่ยน
5. Upgrade ด้วย Version ที่ Pin
6. รัน Pipeline ทดสอบ

```bash
helm upgrade gitlab-runner gitlab/gitlab-runner \
  --namespace gitlab-runner \
  --version <NEW_CHART_VERSION> \
  --values values.yaml \
  --wait
```

## สรุป

Helm chart ทำให้ติดตั้ง GitLab Runner บน Kubernetes ได้ไม่ยาก ส่วน Kubernetes executor ช่วยสร้าง Pod ใหม่ต่อ Job และเก็บกวาดหลังทำงานเสร็จ

สิ่งสำคัญในปี 2026 คือใช้ Runner authentication token รุ่นใหม่ เก็บ Token ใน Secret, Pin Chart version และเริ่มจาก Runner ที่ไม่ Privileged อย่า Mount Docker socket เป็นค่าเริ่มต้น ความเร็วของ CI สำคัญครับ แต่ถ้า Pipeline หนึ่งตัวสามารถเปิดประตูทั้ง Node ได้ เรากำลังประหยัดเวลาสร้าง Imageแลกกับการยกกุญแจ Data center ให้ Job ไปถือเล่น

อ่านต่อจากเอกสารทางการ:

- [GitLab Runner Helm chart](https://docs.gitlab.com/runner/install/kubernetes/)
- [Kubernetes executor](https://docs.gitlab.com/runner/executors/kubernetes/)
