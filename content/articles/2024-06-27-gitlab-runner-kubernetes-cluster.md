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

วันนี้เรามาพูดถึงวิธีการติดตั้ง GitLab Runner บน Kubernetes Cluster กันเถอะ 😎 ถ้าคุณใช้ GitLab เพื่อการ CI/CD อยู่แล้ว แต่ยังไม่ได้ใช้ Kubernetes เพื่อจัดการ Runner บทความนี้เหมาะสำหรับคุณเลย 💪

### 1. เตรียมพร้อมก่อนเริ่ม 🚀

ก่อนอื่นเราต้องแน่ใจว่าเรามีสิ่งต่อไปนี้พร้อมแล้ว:

- Kubernetes Cluster ที่พร้อมใช้งาน 🏞️
- GitLab Account 🐱‍💻
- GitLab Project ที่ต้องการใช้ Runner 🛠️

### 2. ติดตั้ง Helm 🛳️

Helm เป็น package manager สำหรับ Kubernetes ถ้ายังไม่มี Helm ในเครื่องคุณ ติดตั้งได้ง่ายๆ ด้วยคำสั่งนี้:

curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
ตรวจสอบว่า Helm ติดตั้งสำเร็จด้วยคำสั่ง:

helm version
### 3. ติดตั้ง GitLab Runner ด้วย Helm 🏃‍♂️

ใช้ Helm เพื่อเพิ่ม GitLab Runner chart repo:

helm repo add gitlab https://charts.gitlab.io  
helm repo update
จากนั้นเราจะติดตั้ง GitLab Runner ใน Kubernetes Cluster ด้วยคำสั่ง:

helm install --namespace gitlab-runner --create-namespace gitlab-runner -f values.yaml gitlab/gitlab-runner
**ตัวอย่างไฟล์**`values.yaml`

gitlabUrl: https://gitlab.com/  
runnerRegistrationToken: "YOUR_REGISTRATION_TOKEN"  
unregisterRunners: true  
terminationGracePeriodSeconds: 3600  
concurrent: 10  
checkInterval: 30  
rbac:  
 create: true  
runners:  
 privileged: true  
 tags: "k8s-runner"  
 config: |  
 [[runners]]  
 [runners.kubernetes]  
 namespace = "gitlab-runner"  
 image = "alpine:3.12"  
 [[runners.kubernetes.volumes.empty_dir]]  
 name = "docker-certs"  
 [[runners.kubernetes.volumes.host_path]]  
 name = "docker-sock"  
 mount_path = "/var/run/docker.sock"  
 host_path = "/var/run/docker.sock"  
 [runners.docker]  
 tls_verify = false  
 image = "docker:latest"  
 privileged = true  
 disable_entrypoint_overwrite = false  
 oom_kill_disable = false  
 disable_cache = false  
 volumes = ["/cache"]  
 shm_size = 0
ในไฟล์นี้ เราได้เพิ่มการตั้งค่า Docker ให้กับ GitLab Runner ด้วย โดยเฉพาะการตั้งค่า `docker` ในส่วน `config` ของ Runner และการ mount Docker socket เข้าไปใน pod ของ Runner

แทนที่ `"YOUR_REGISTRATION_TOKEN"` ด้วย token ที่คุณได้รับจาก GitLab เมื่อคุณตั้งค่า Runner

### 4. ตรวจสอบสถานะ 🧐

หลังจากติดตั้งเสร็จ เรามาตรวจสอบสถานะของ Runner กัน

kubectl get pods --namespace gitlab-runner
คุณควรจะเห็น pod ของ GitLab Runner กำลังรันอยู่

### 5. ทดสอบการทำงาน 🎯

กลับไปที่ GitLab และตรวจสอบว่า Runner ได้ถูกลงทะเบียนเรียบร้อยแล้ว ไปที่ Project Settings > CI/CD > Runners คุณจะเห็น Runner ที่เราเพิ่งติดตั้งขึ้นมา

ลองสร้าง Pipeline และดูว่า Runner ของเราเริ่มทำงานหรือไม่ ถ้าใช่แปลว่าคุณได้ติดตั้งสำเร็จแล้ว! 🎉
