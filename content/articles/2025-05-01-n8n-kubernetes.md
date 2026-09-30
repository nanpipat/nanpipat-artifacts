---
title: "มาลง n8n บน Kubernetes กันเถอะ"
author: "Nanpipat Klinpratoom"
published: "2025-05-01"
published_time: "2025-05-01T08:06:12Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%A1%E0%B8%B2%E0%B8%A5%E0%B8%87-n8n-%E0%B8%9A%E0%B8%99-kubernetes-%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B9%80%E0%B8%96%E0%B8%AD%E0%B8%B0-cfccba1a1124"
medium_id: "cfccba1a1124"
---

# มาลง n8n บน Kubernetes กันเถอะ

n8n เป็นเครื่องมือ Workflow automation ที่ให้เราต่อ API, Database, Webhook และ Logic เป็น Flow เหมือนต่อรางรถไฟ ของมันสนุกตรงลาก Node ไม่กี่ตัวก็ทำงานแทนคนได้ แต่พอเอาขึ้น Production เราต้องดูแลมากกว่า Pod หนึ่งก้อน เพราะข้างในมีทั้ง Workflow, Credential, Webhook, Execution history และไฟล์ชั่วคราวครับ

บทความเดิมเสนอทั้ง Helm และ Deployment พร้อม SQLite ปี 2026 เราจะปรับใหม่ให้ปลอดภัยกว่า:

- ใช้ PostgreSQL สำหรับ Production
- เก็บ `N8N_ENCRYPTION_KEY` ให้คงที่และเป็น Secret
- Pin Image version ไม่ใช้ `latest`
- เปิดผ่าน HTTPS และตั้ง `WEBHOOK_URL` ให้ถูก
- ใช้ Helm chart ชุมชนได้ แต่ต้อง Review เพราะ URL `n8n.io/helm-charts` ในตัวอย่างเดิมไม่ควรถูกถือว่าเป็น Chart ทางการโดยอัตโนมัติ

## เลือกก่อนว่า Kubernetes จำเป็นไหม

ถ้ามี n8n ตัวเดียว งานไม่มาก และทีมไม่ได้ดูแล Kubernetes อยู่แล้ว Docker Compose บน VM อาจเรียบง่ายกว่า Kubernetes ไม่ได้ทำให้ระบบ Production โดยการโรย YAML ลงไป มันแค่เพิ่มเครื่องมือ Orchestration ซึ่งมาพร้อม Cluster, Ingress, Storage, Backup และ Monitoring ที่ต้องดูแล

Kubernetes เหมาะเมื่อ:

- องค์กรมี Cluster และทีม Platform อยู่แล้ว
- ต้องการมาตรฐาน Deployment, Secret และ Observability เดียวกับระบบอื่น
- ต้อง Scale Worker หรือแยก Webhook processor
- ต้องการ Rollout/Resource policy/Network policy

ถ้าเหตุผลมีเพียง “อยากลอง K8s” ทำ Lab ได้ครับ แต่อย่าเอา Lab ไปสวมหมวก Production แล้วส่งกุญแจให้ฝ่ายธุรกิจทันที

## n8n เก็บอะไรไว้ที่ไหน

ก่อนเขียน Manifest ต้องรู้จักของสำคัญ:

- **Database** เก็บ Workflow, Credential ที่เข้ารหัส, User และ Execution metadata
- **Encryption key** ใช้เข้ารหัส Credential ถ้าหายอาจอ่าน Credential เดิมไม่ได้
- **Binary data** เช่นไฟล์จาก Workflow อาจเก็บบน Filesystem หรือ External storage ตาม Config
- **Timezone และ URL** กระทบ Schedule และ Webhook

SQLite เหมาะกับ Local test แต่ Pod และ Volume model ทำให้ Scale/HA ยุ่งยาก สำหรับ Production ใช้ PostgreSQL ที่ Backup และดูแลแยกชัดเจนจะเหมาะกว่าครับ

## สิ่งที่ต้องมี

- Kubernetes cluster และ `kubectl`
- Ingress controller
- TLS certificate หรือ cert-manager
- PostgreSQL ที่พร้อมใช้งาน
- Secret manager หรืออย่างน้อย Kubernetes Secret ที่เข้ารหัส at rest
- Domain เช่น `n8n.example.com`

## สร้าง Namespace และ Secret

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: n8n
```

Apply:

```bash
kubectl apply -f namespace.yaml
```

สร้าง Encryption key แบบสุ่มจากเครื่องที่ไว้ใจ แล้วเก็บใน Secret manager:

```bash
openssl rand -hex 32
```

ตัวอย่างสร้าง Secret ผ่าน CLI เพื่อไม่เขียนค่าลง Git:

```bash
kubectl create secret generic n8n-secrets \
  --namespace n8n \
  --from-literal=N8N_ENCRYPTION_KEY='<RANDOM_KEY>' \
  --from-literal=DB_POSTGRESDB_PASSWORD='<DB_PASSWORD>'
```

Encryption key ต้องเหมือนกันทุก Replica และทุก Worker และต้องอยู่ใน Backup plan เปลี่ยนหรือทำหายไม่ได้เหมือนเปลี่ยนรหัส Wi-Fi เพราะ Credential เก่าใน Database ถูกเข้ารหัสด้วยกุญแจเดิมครับ

## ConfigMap สำหรับค่าที่ไม่ใช่ Secret

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: n8n-config
  namespace: n8n
data:
  N8N_HOST: n8n.example.com
  N8N_PROTOCOL: https
  N8N_PORT: "5678"
  WEBHOOK_URL: https://n8n.example.com/
  N8N_EDITOR_BASE_URL: https://n8n.example.com/
  GENERIC_TIMEZONE: Asia/Bangkok
  TZ: Asia/Bangkok
  DB_TYPE: postgresdb
  DB_POSTGRESDB_HOST: postgres.example.internal
  DB_POSTGRESDB_PORT: "5432"
  DB_POSTGRESDB_DATABASE: n8n
  DB_POSTGRESDB_USER: n8n
```

`WEBHOOK_URL` สำคัญมาก n8n ใช้มันสร้าง URL ที่ Service ภายนอกจะยิงกลับมา ถ้าตั้งเป็น `http://localhost:5678` Workflow อาจดูดีใน Editor แต่ Webhook จากโลกภายนอกจะเคาะผิดบ้านครับ

## Deployment แบบ Single main instance

เริ่มจาก Replica เดียวก่อน:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n
  namespace: n8n
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: n8n
  template:
    metadata:
      labels:
        app: n8n
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: n8n
          image: docker.n8n.io/n8nio/n8n:<PINNED_N8N_VERSION>
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 5678
          envFrom:
            - configMapRef:
                name: n8n-config
            - secretRef:
                name: n8n-secrets
          readinessProbe:
            httpGet:
              path: /healthz/readiness
              port: http
            initialDelaySeconds: 20
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 30
            periodSeconds: 20
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              memory: 1Gi
          volumeMounts:
            - name: n8n-data
              mountPath: /home/node/.n8n
      volumes:
        - name: n8n-data
          persistentVolumeClaim:
            claimName: n8n-data
```

ใช้ `Recreate` กับ Replica เดียวเพื่อลดโอกาสสอง Pod เขียนพื้นที่เดียวกันตอน Rollout ถ้าจะทำ Queue mode และแยกบทบาท ต้องใช้ Config สำหรับ Scaling โดยเฉพาะ ไม่ใช่เปลี่ยน `replicas: 3` แล้วหวังว่าทุกอย่างจะเรียบร้อยครับ

PVC:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: n8n-data
  namespace: n8n
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

แม้ใช้ PostgreSQL โฟลเดอร์ `.n8n` ยังอาจมี Config และข้อมูลบางชนิด แต่ถ้าออกแบบให้ Binary data ไป External storage และ Config ผ่าน Environment ทั้งหมด ภาระ Filesystem จะลดลง ตรวจ Version docs ให้ตรงกับวิธีใช้งานของทีมเสมอ

## Service และ Ingress

```yaml
apiVersion: v1
kind: Service
metadata:
  name: n8n
  namespace: n8n
spec:
  selector:
    app: n8n
  ports:
    - name: http
      port: 80
      targetPort: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: n8n
  namespace: n8n
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - n8n.example.com
      secretName: n8n-tls
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
                  name: http
```

ถ้าอยู่หลัง Reverse proxy ต้องตั้งจำนวน Proxy hop ตาม Topology และตรวจ Secure cookie, WebSocket และ Forwarded headers ให้ถูก Config ของ Ingress controller แต่ละตัวไม่เหมือนกัน อย่า Copy Annotation จาก NGINX ไปใช้กับ ALB หรือ Traefik ตรง ๆ ครับ

## Apply และตรวจสถานะ

```bash
kubectl apply -f pvc.yaml
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service-ingress.yaml
```

ตรวจ:

```bash
kubectl rollout status deployment/n8n -n n8n
kubectl get pods,svc,ingress,pvc -n n8n
kubectl logs deployment/n8n -n n8n
```

ถ้า Pod Restart ให้ดู `describe` เพื่อแยกว่าเป็น Config, Database, Permission หรือ OOM:

```bash
kubectl describe pod <pod-name> -n n8n
```

## แล้ว Helm ล่ะ

Helm มีประโยชน์เมื่อทีมต้องการ Template, Upgrade และ Values ที่เป็นมาตรฐาน แต่ควรแยกคำว่า “มี Chart ให้ใช้” ออกจาก “เป็น Chart ที่ n8n ดูแลอย่างเป็นทางการ”

ก่อนใช้ Community chart ให้ตรวจ:

- Maintainer และความถี่ Release
- Image version ที่ Chart รองรับ
- วิธีจัดการ Encryption key และ Existing secret
- PostgreSQL/Redis dependency เป็น Chart ใด
- Queue mode และ Webhook processor รองรับแค่ไหน
- SecurityContext, Probe, Resource และ NetworkPolicy
- Upgrade path และ Breaking change

Pin ทั้ง Chart version และ App version ใน Git อย่าใช้ `latest` เพราะ Rollout ที่เกิดจาก Node ย้ายไม่ควรกลายเป็นการอัปเกรด n8n แบบเซอร์ไพรส์ครับ

## Scale ด้วย Queue mode เมื่อมีเหตุผล

เมื่อ Execution เยอะ n8n มี Queue mode ที่แยก Main instance ออกจาก Worker และใช้ Redis เป็นคิว โดยทั่วไป:

```text
Editor and API main instance
          ↓
        Redis
       ↙     ↘
  Worker 1  Worker 2
          ↓
      PostgreSQL
```

ทุก Process ต้องใช้ Database, Encryption key และ Config ที่เข้ากัน Worker สามารถ Scale แยกจาก Main ได้ แต่ระบบเพิ่ม Redis, Deployment หลายชุด, Monitoring และ Shutdown behavior

อย่าเปิด Queue mode เพียงเพราะอยากเห็น Pod หลายตัว เริ่มจากวัด Queue wait, Execution duration, CPU และ Memory ก่อน แล้ว Scale ตรงคอขวดครับ

## Backup อะไรบ้าง

- PostgreSQL แบบทดสอบ Restore ได้
- `N8N_ENCRYPTION_KEY`
- Binary data store
- Workflow export ตามนโยบาย
- Kubernetes manifest/Helm values ที่ไม่มี Secret
- Version และ Migration notes

Backup ที่ไม่เคย Restore เป็นเพียงความหวังที่มีไฟล์แนบ ลองกู้ใน Environment แยกเป็นรอบ โดยเฉพาะก่อน Upgrade ใหญ่

## Security checklist

- เปิด HTTPS เท่านั้น
- ใช้ SSO/Authentication ตาม Edition และ Requirement
- เก็บ Credential ใน Kubernetes/External secret
- จำกัด Network ไป Database และ Redis
- Pin image ด้วย Version หรือ Digest และ Scan image
- ไม่เปิด Editor สู่ Internet ถ้าไม่จำเป็น
- จำกัด Community nodes และตรวจ Code ก่อนใช้
- กำหนด Execution retention ไม่เก็บข้อมูล Input/Output ลับนานเกินไป
- แยก Credential ของแต่ละ Workflow ตาม Least privilege
- Monitor Login, Workflow change และ Execution failure

## สรุป

การรัน n8n บน Kubernetes ไม่ได้จบที่ Deployment กับ Service เราต้องรักษา Database, Encryption key, Webhook URL, TLS และ Binary data ให้เป็นระบบด้วย

สำหรับ Production ให้ใช้ PostgreSQL, Pin image version, เก็บ Secret นอก Git และเริ่มจากหนึ่ง Main instance ที่เข้าใจได้ก่อน ถ้าปริมาณงานเพิ่มค่อยขยับไป Queue mode กับ Redis การต่อ Workflow ใน n8n สนุกเหมือนต่อรางรถไฟครับ แต่ Platform ข้างล่างต้องแน่ใจว่ารางไม่หายทุกครั้งที่ Pod ย้ายสถานี

อ่านต่อจากเอกสารทางการ:

- [n8n hosting documentation](https://docs.n8n.io/hosting/)
- [n8n queue mode](https://docs.n8n.io/hosting/scaling/queue-mode/)
