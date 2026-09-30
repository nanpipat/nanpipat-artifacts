---
title: "ทำ Logging บน Kubernetes ด้วย ELK Stack 🚀"
author: "Nanpipat Klinpratoom"
published: "2024-09-16"
published_time: "2024-09-16T09:40:49Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%97%E0%B8%B3-logging-%E0%B8%9A%E0%B8%99-kubernetes-%E0%B8%94%E0%B9%89%E0%B8%A7%E0%B8%A2-elk-stack-5769714a0384"
medium_id: "5769714a0384"
---

# ทำ Logging บน Kubernetes ด้วย ELK Stack 🚀

![Image 2](https://miro.medium.com/v2/resize:fit:700/0*7boZAr831ieWpYQY.png)

เวลาแอปหนึ่งตัวรันอยู่ Pod เดียว เราใช้ `kubectl logs` ก็พอเอาตัวรอด แต่พอมี 80 Pod กระจายหลาย Node และ Pod เก่าถูกลบทิ้ง การไล่อ่าน Log จะเหมือนตามหาคนร้ายจากกระดาษโน้ตที่ลมพัดปลิวทั่วเมืองครับ

Centralized logging ช่วยรวบ Log ไว้ที่เดียว ค้นหาตาม Namespace, Pod, Trace ID หรือข้อความ Error ได้ และเก็บข้ามอายุของ Pod บทความนี้ใช้ Elastic Stack ซึ่งคนคุ้นชื่อเดิมว่า ELK แต่ในปี 2026 รูปแบบที่ Elastic แนะนำบน Kubernetes ขยับจากการเขียน Deployment ของ Elasticsearch, Kibana และ Filebeat ด้วยมือ ไปใช้ **Elastic Cloud on Kubernetes หรือ ECK** กับ **Elastic Agent** มากขึ้นครับ

## จาก ELK สู่ Elastic Stack

ชื่อ ELK มาจาก:

- **Elasticsearch** เก็บ Index และค้นหาข้อมูล
- **Logstash** รับ แปลง และส่งข้อมูล
- **Kibana** ใช้ค้นหา สร้าง Dashboard และ Alert

ใน Kubernetes เรายังมี Agent วิ่งบนแต่ละ Node เพื่อเก็บ Container logs เดิมนิยม Filebeat แต่เอกสาร Elastic ปัจจุบันแนะนำ Elastic Agent เป็นเส้นทางหลักสำหรับ Logs, Metrics และ Traces โดยรองรับ OpenTelemetry มากขึ้น

ภาพรวม:

```text
Application writes stdout/stderr
              ↓
Container runtime log files on each node
              ↓
Elastic Agent DaemonSet
              ↓
Elasticsearch
              ↓
Kibana Discover, Dashboard and Alert
```

กฎข้อแรกของ Logging บน Kubernetes คือให้แอปเขียน Log ไป `stdout`/`stderr` เป็นหลัก อย่าเก็บไฟล์สำคัญไว้ใน filesystem ของ Pod เพราะ Pod ถูกสร้างและลบได้ตลอดเวลา

## ทำไมไม่ควรใช้ Manifest Elasticsearch 7.10 เดิม

ตัวอย่างเก่าใช้ Elasticsearch และ Kibana 7.10 แบบ Deployment หนึ่ง Replica ไม่มี Persistent volume และปิด Security หลายส่วน นอกจาก Version เก่ามากแล้ว ยังเสี่ยงข้อมูลหายเมื่อ Pod ถูกย้าย และไม่ได้ออกแบบ Cluster lifecycle เช่น Upgrade, Certificate, Node roles และ Storage

ECK เป็น Operator ทางการที่ช่วยจัดการ Resource เหล่านี้ผ่าน Custom Resource Definition ลดงานประกอบระบบด้วยมือ และสร้าง TLS/Secret พื้นฐานให้ตามค่าเริ่มต้น

สำหรับ Production อย่าเริ่มด้วย Elasticsearch หนึ่ง Pod ที่ไม่มี Volume แล้วค่อยหวังเพิ่มความทนทานทีหลัง ข้อมูล Log อาจไม่ใช่ Transaction ธุรกิจ แต่เป็นหลักฐานชิ้นแรกตอนระบบไฟไหม้ครับ

## สิ่งที่ต้องมี

- Kubernetes cluster และ StorageClass
- `kubectl` กับสิทธิ์ติดตั้ง CRD/Operator
- Node resource เพียงพอสำหรับ Elasticsearch
- DNS/Ingress และ Certificate ถ้าจะเปิด Kibanaภายนอก
- นโยบาย Retention และงบ Storage

ตรวจ Context และ Storage:

```bash
kubectl config current-context
kubectl get storageclass
kubectl top nodes
```

## ติดตั้ง ECK Operator

Elastic รองรับทั้ง Manifest และ Helm วิธี Helm อ่าน Version ได้ชัด:

```bash
helm repo add elastic https://helm.elastic.co
helm repo update
helm search repo elastic/eck-operator --versions
```

Pin Version ที่ตรวจสอบแล้ว:

```bash
helm upgrade --install elastic-operator elastic/eck-operator \
  --namespace elastic-system \
  --create-namespace \
  --version <ECK_VERSION> \
  --wait
```

ตรวจ Operator:

```bash
kubectl get pods -n elastic-system
kubectl logs -n elastic-system statefulset/elastic-operator
```

CRD เป็น Resource ระดับ Cluster การลบ CRD อาจทำให้ Custom resource และระบบที่เกี่ยวข้องถูกลบตาม อย่า Treat การถอน Operator เหมือนลบ Deployment ทั่วไปครับ

## สร้าง Elasticsearch สำหรับ Lab

ไฟล์ `elastic-stack.yaml`:

```yaml
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: logging
  namespace: observability
spec:
  version: <ELASTIC_VERSION>
  nodeSets:
    - name: default
      count: 1
      config:
        node.store.allow_mmap: false
      podTemplate:
        spec:
          containers:
            - name: elasticsearch
              resources:
                requests:
                  cpu: 500m
                  memory: 2Gi
                limits:
                  memory: 2Gi
      volumeClaimTemplates:
        - metadata:
            name: elasticsearch-data
          spec:
            accessModes:
              - ReadWriteOnce
            resources:
              requests:
                storage: 20Gi
---
apiVersion: kibana.k8s.elastic.co/v1
kind: Kibana
metadata:
  name: logging
  namespace: observability
spec:
  version: <ELASTIC_VERSION>
  count: 1
  elasticsearchRef:
    name: logging
```

สร้าง Namespace และ Apply:

```bash
kubectl create namespace observability
kubectl apply -f elastic-stack.yaml
kubectl get elasticsearch,kibana,pods -n observability
```

ใช้ Version เดียวกันสำหรับ Elasticsearch และ Kibana และเลือกจาก Support matrix ของ ECK อย่า Copy Placeholder ไป Apply ตรง ๆ ครับ

หนึ่ง Node เหมาะกับ Lab เท่านั้น Production ต้องออกแบบ Replica, Availability zone, Storage, Snapshot และ Capacity จากปริมาณข้อมูลจริง Elasticsearch ไม่ได้ Scale ด้วยการเพิ่ม Replica แบบเดาสุ่มเหมือนเพิ่มเก้าอี้ตอนแขกมาเยอะครับ

## เข้า Kibana ผ่าน Port forward

```bash
kubectl port-forward service/logging-kb-http 5601:5601 -n observability
```

ดึง Password ของผู้ใช้ `elastic`:

```bash
kubectl get secret logging-es-elastic-user \
  -n observability \
  -o jsonpath='{.data.elastic}' | base64 -d
echo
```

เปิด `https://localhost:5601` Certificate เป็น Self-signed สำหรับ Lab ถ้าจะเปิดภายนอกให้วาง Ingress/Load balancer, TLS และ Authentication ตาม Security policy ห้ามใช้ NodePort เปิด Kibana ออก Internet พร้อมรหัสเริ่มต้นครับ

## ติดตั้ง Elastic Agent เพื่อเก็บ Log

Elastic Agent บน Kubernetes มักรันเป็น DaemonSet หนึ่ง Pod ต่อ Node เพื่ออ่าน Container log และเติม Kubernetes metadata เช่น Namespace, Pod, Container และ Node

เอกสารปี 2026 แนะนำ Helm เป็นทางหลักสำหรับ Elastic Agent รุ่นใหม่ แต่ค่าติดตั้งต่างกันตามว่าจะใช้ Fleet-managed, Standalone, ECK หรือ Elastic Cloud วิธีที่ปลอดภัยคือเข้า Kibana ที่เมนู Add data → Kubernetes แล้วใช้ Config ที่ระบบสร้างให้กับ Deployment ของเรา

โครงสร้างที่ควรตรวจใน Config:

- Output ใช้ HTTPS และตรวจ CA
- Credential อยู่ใน Kubernetes Secret
- Agent รันเป็น DaemonSet
- Mount `/var/log/containers` และ Path ที่ Runtime ใช้แบบ Read-only
- RBAC อ่านเฉพาะ Metadata ที่จำเป็น
- เปิด Kubernetes metadata processor
- มี Resource requests/limits

ตัวอย่างคำสั่ง Helm ตามแนวทางเอกสาร:

```bash
helm upgrade --install elastic-agent elastic/elastic-agent \
  --namespace kube-system \
  --version <AGENT_CHART_VERSION> \
  --values elastic-agent-values.yaml \
  --wait
```

อย่าใส่ API key หรือ Password ใน `values.yaml` ที่ Commit เข้า Git ให้ใช้ Existing secret หรือ External Secrets แทน

## Structured logging ช่วยมากกว่าการเพิ่ม Storage

Log แบบข้อความอิสระค้นได้ แต่ Log แบบ JSON ทำให้ Filter และ Aggregate ง่าย:

```json
{
  "level": "error",
  "service": "checkout-api",
  "message": "payment provider timeout",
  "trace_id": "8f9d...",
  "order_id": "ord_123",
  "duration_ms": 3021
}
```

Field ที่ควรมี:

- Timestamp พร้อม Timezone
- Log level
- Service และ Environment
- Message สั้นที่มีความหมาย
- Request/Trace/Correlation ID
- Error type และ Stack trace เมื่อจำเป็น
- Business identifier ที่ไม่ใช่ข้อมูลลับ

อย่า Log Password, Access token, Session cookie, หมายเลขบัตร หรือ Personal data แบบไม่จำเป็น ระบบค้นหา Log ที่ดีมากก็แปลว่าข้อมูลลับที่เผลอ Log ถูกค้นเจอได้ดีมากเช่นกันครับ

## ค้นหาใน Kibana

เมื่อ Data stream เริ่มมีข้อมูล เปิด Discover แล้ว Filter ด้วย KQL เช่น:

```text
kubernetes.namespace: "production"
```

```text
kubernetes.pod.name: checkout-* and log.level: error
```

```text
trace.id: "8f9d..."
```

ชื่อ Field จริงขึ้นกับ Integration และ Mapping ของระบบ ตรวจ Document ของ Event หนึ่งรายการก่อนเขียน Query อย่าท่อง Field จาก Tutorial เก่าเพราะ Schema เปลี่ยนได้

## Retention คือส่วนหนึ่งของ Architecture

ถ้าเก็บทุก Log ตลอดไป Elasticsearch จะกลายเป็นห้องเก็บของที่ค่าเช่าเพิ่มทุกเดือน กำหนด Data lifecycle ตามคุณค่าของข้อมูล:

- Hot data สำหรับค้นหาบ่อย
- Warm/Cold data สำหรับย้อนหลัง
- Delete เมื่อครบ Retention
- Snapshot ข้อมูลที่ต้องเก็บนาน

แยก Retention ตามประเภท เช่น Security audit อาจต้องนานกว่า Debug log และ Production อาจนานกว่า Development วัด Daily ingest volume, Replication และ Index overhead ก่อนซื้อ Disk ครับ

## Alert ที่ดีต้องพาไปสู่การลงมือทำ

อย่า Alert ทุกครั้งที่พบคำว่า `error` เพราะทีมจะโดนปลุกจาก Error ที่ระบบ Retry สำเร็จจนเลิกสนใจสัญญาณจริง

Alert ที่มีประโยชน์ควรมี:

- เงื่อนไขและช่วงเวลาชัดเจน
- Threshold ที่สัมพันธ์กับผลกระทบผู้ใช้
- Link ไป Query/Dashboard
- Service owner และ Runbook
- Deduplication หรือ Cooldown
- ระดับความรุนแรง

Logging ไม่ใช่เป้าหมายสุดท้าย เป้าหมายคือทำให้คนเข้าใจเหตุการณ์และแก้ระบบได้เร็วขึ้นครับ

## Checklist ก่อนใช้ Production

- ใช้ ECK/Elastic Agent version ที่อยู่ใน Support matrix
- Pin Version และทดสอบ Upgrade
- มี Persistent storage และ Snapshot
- วาง Replica/AZ ตาม Availability requirement
- เปิด TLS, Authentication และ RBAC
- ไม่เปิด Elasticsearch/Kibana สาธารณะโดยตรง
- กำหนด Retention และ Lifecycle policy
- Mask Secret/PII ก่อนส่ง Log
- ตั้ง Resource limit และ Monitor JVM/Storage
- ทดสอบกรณี Agent, Node และ Elasticsearch ล้ม

## สรุป

ELK ช่วยเปลี่ยน Log ที่กระจายตาม Pod ให้กลายเป็นข้อมูลค้นหาได้จากที่เดียว แต่บน Kubernetes ปี 2026 ไม่ควรเริ่มจาก Deployment Elasticsearch รุ่นเก่าแบบไม่มี Volume อีกแล้ว ใช้ ECK ดูแล Elastic Stack และใช้ Elastic Agent เก็บ Logs, Metrics และ Traces ตามแนวทางปัจจุบันจะมีเส้นทาง Upgrade และ Security ที่ชัดกว่า

จำไว้ว่า Logging platform ที่ดีไม่ใช่ระบบที่เก็บทุกตัวอักษรไว้ตลอดกาล แต่เป็นระบบที่เก็บข้อมูลถูกชนิดในเวลาที่เหมาะ ค้นเจอเมื่อเกิดเหตุ และไม่ทำข้อมูลลับหกใส่ Dashboard ครับ

อ่านต่อจากเอกสารทางการ:

- [Install ECK](https://www.elastic.co/docs/deploy-manage/deploy/cloud-on-k8s/install)
- [Monitor Kubernetes with Elastic Agent](https://www.elastic.co/docs/solutions/observability/get-started/quickstart-monitor-kubernetes-cluster-with-elastic-agent)
