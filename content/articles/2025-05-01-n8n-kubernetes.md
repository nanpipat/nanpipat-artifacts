---
title: "มาลง n8n บน Kubernetes กันเถอะ"
author: "Nanpipat Klinpratoom"
published: "2025-05-01"
published_time: "2025-05-01T08:06:12Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%A1%E0%B8%B2%E0%B8%A5%E0%B8%87-n8n-%E0%B8%9A%E0%B8%99-kubernetes-%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B9%80%E0%B8%96%E0%B8%AD%E0%B8%B0-cfccba1a1124"
medium_id: "cfccba1a1124"
---

# มาลง n8n บน Kubernetes กันเถอะ

วันนี้เราจะมาลองติดตั้ง **n8n** บน **Kubernetes** (K8s) โดยเราจะไปดูกันทั้ง 2 วิธีหลัก: **ใช้ Helm** กับ **ใช้ Deployment** 😎 ซึ่งเราสามารถเลือกใช้ฐานข้อมูลได้ทั้ง **SQLite** (local storage) หรือ **PostgreSQL** ขึ้นอยู่กับความสะดวกของเรากันเลย!

## 1. การติดตั้ง n8n ด้วย Helm

### ขั้นตอนที่ 1: เตรียม Kubernetes Cluster

ก่อนอื่นเลย ใครยังไม่ได้ตั้ง Kubernetes cluster หรือ **kubectl** ก็ต้องจัดการให้พร้อมนะครับ เพราะไม่งั้นมันจะไม่ได้! 😅

### ขั้นตอนที่ 2: ติดตั้ง Helm (ถ้ายังไม่ได้ติดตั้ง)

ถ้ายังไม่มี **Helm** ก็อย่าลืมติดตั้งก่อนนะครับ! วิธีการติดตั้งง่ายๆ ตามนี้:

  
brew install helm # สำหรับ Linux  
curl [https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3](https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3) | bash
### ขั้นตอนที่ 3: เพิ่ม Chart Repository ของ n8n

มาต่อกันที่การเพิ่ม repository ของ n8n เข้าไปใน Helm ซึ่งจะทำให้เราสามารถติดตั้ง n8n ได้ง่ายๆ จาก Chart:

helm repo add n8n https://n8n.io/helm-charts  
helm repo update
### ขั้นตอนที่ 4: ติดตั้ง n8n ด้วย Helm

เอาล่ะ ตอนนี้เราพร้อมติดตั้ง n8n แล้ว! ใช้คำสั่งนี้กันเลย:

helm install n8n n8n/n8n --namespace n8n --create-namespace
แบบนี้ n8n ก็จะถูกติดตั้งโดยใช้ **SQLite** เป็นฐานข้อมูลในตัว (local storage) ให้อัตโนมัติครับ 🎉

### ขั้นตอนที่ 5: ตั้งค่าเพิ่มเติม

ถ้าคุณอยากใช้ **PostgreSQL** แทน SQLite หรืออยากปรับแต่งการติดตั้ง ก็สามารถใช้ไฟล์ `values.yaml` แล้วใส่ค่าเหล่านี้ลงไป:

  
postgresql:  
 enabled: true  
 postgresqlPassword: "yourpassword"  
 postgresqlDatabase: "n8n_db"
แล้วใช้คำสั่งนี้เพื่อติดตั้งอีกครั้ง:

helm install n8n n8n/n8n --namespace n8n -f values.yaml

### ขั้นตอนที่ 6: การตั้งค่า Ingress (Optional)

ถ้าอยากให้ n8n เข้าถึงได้จากภายนอก ก็สามารถตั้งค่า **Ingress** ได้เลย! เพียงแค่สร้างไฟล์ **ingress.yaml** แบบนี้:

apiVersion: networking.k8s.io/v1  
kind: Ingress  
metadata:  
 name: n8n  
 namespace: n8n  
 annotations:  
 nginx.ingress.kubernetes.io/ssl-redirect: "true"  
 nginx.ingress.kubernetes.io/proxy-body-size: "100m"  
spec:  
 rules:  
 - host: n8n.example.com  
 http:  
 paths:  
 - path: /  
 pathType: Prefix  
 backend:  
 service:  
 name: n8n  
 port:  
 number: 80  
 tls:  
 - hosts:  
 - n8n.example.com  
 secretName: n8n-tls

## 2. การติดตั้ง n8n ด้วย Deployment

ถ้าไม่อยากใช้ Helm หรืออยากควบคุมทุกอย่างเองมากๆ ลองใช้ **Deployment** ดูครับ! โดยวิธีนี้เราจะต้องจัดการเองหมดทุกอย่าง แต่ก็ทำให้เรามีอิสระมากขึ้น 💪

### ขั้นตอนที่ 1: สร้าง Namespace

ก่อนอื่นให้สร้าง **Namespace** สำหรับแยกโปรเจกต์ n8n ของเราออกมา:

apiVersion: v1  
kind: Namespace  
metadata:  
 name: n8n
### ขั้นตอนที่ 2: สร้าง Deployment สำหรับ n8n

มาต่อที่ไฟล์ **deployment.yaml** ที่ใช้สำหรับติดตั้ง n8n:

apiVersion: apps/v1  
kind: Deployment  
metadata:  
 name: n8n  
 namespace: n8n  
spec:  
 replicas: 1  
 selector:  
 matchLabels:  
 app: n8n  
 template:  
 metadata:  
 labels:  
 app: n8n  
 spec:  
 containers:  
 - name: n8n  
 image: n8nio/n8n:latest  
 ports:  
 - containerPort: 5678  
 env:  
 - name: N8N_HOST  
 value: "n8n.example.com"  
 - name: WEBHOOK_URL  
 value: "https://n8n.example.com/"  
 - name: N8N_BASIC_AUTH_ACTIVE  
 value: "true"  
 - name: N8N_BASIC_AUTH_USER  
 value: "admin"  
 - name: N8N_BASIC_AUTH_PASSWORD  
 value: "supersecret"  
 - name: GENERIC_TIMEZONE  
 value: "Asia/Bangkok"  
   
 - name: DB_TYPE  
 value: "postgresdb"   
 - name: DB_POSTGRESDB_HOST  
 value: "postgresql.postgresql.svc.cluster.local"  
 - name: DB_POSTGRESDB_PORT  
 value: "5432"  
 - name: DB_POSTGRESDB_DATABASE  
 value: "n8n_db"  
 - name: DB_POSTGRESDB_USER  
 value: "postgres"  
 - name: DB_POSTGRESDB_PASSWORD  
 value: "yourpassword"
### ขั้นตอนที่ 3: สร้าง Service

เพื่อ expose n8n เราก็สร้าง **Service** กันเลย:

apiVersion: v1  
kind: Service  
metadata:  
 name: n8n  
 namespace: n8n  
spec:  
 selector:  
 app: n8n  
 ports:  
 - protocol: TCP  
 port: 80  
 targetPort: 5678
### ขั้นตอนที่ 4: สร้าง Ingress

สุดท้าย ถ้าอยากให้ n8n เข้าใช้งานจากภายนอกก็ทำการตั้งค่า **Ingress** ได้ตามนี้:

apiVersion: networking.k8s.io/v1  
kind: Ingress  
metadata:  
 name: n8n  
 namespace: n8n  
 annotations:  
 nginx.ingress.kubernetes.io/ssl-redirect: "true"  
 nginx.ingress.kubernetes.io/proxy-body-size: "100m"  
spec:  
 rules:  
 - host: n8n.example.com  
 http:  
 paths:  
 - path: /  
 pathType: Prefix  
 backend:  
 service:  
 name: n8n  
 port:  
 number: 80  
 tls:  
 - hosts:  
 - n8n.example.com  
 secretName: n8n-tls
### ขั้นตอนที่ 5: ติดตั้งทุกอย่างใน Kubernetes

พร้อมแล้ว! ใช้คำสั่งนี้เพื่อติดตั้งทุกอย่างใน K8s:

kubectl apply -f namespace.yaml  
kubectl apply -f deployment.yaml  
kubectl apply -f service.yaml  
kubectl apply -f ingress.yaml
