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

สวัสดีชาว DevOps ทั้งหลาย! 👋 วันนี้เรามาทำความรู้จักกับ ELK Stack กันแบบเจาะลึก พร้อมวิธีติดตั้งบน Kubernetes แบบมืออาชีพ!

> 📌 **หมายเหตุ**: บทความนี้สมมติว่าคุณมี Kubernetes cluster อยู่แล้วนะ!

## ELK คืออะไร? 🤔

ELK Stack คือชุดเครื่องมือสุดเจ๋งที่ประกอบด้วย:

- **E**lasticsearch 🔍: ฐานข้อมูลค้นหาเร็วแรง
- **L**ogstash 🚰: ท่อลำเลียงและแปลง log สารพัดรูปแบบ
- **K**ibana 📊: หน้าตาสวยๆ ให้เราดู log แบบฟินๆ

## ทำไมต้อง ELK? 🌟

1.   รวม log จากทุกที่มาไว้ที่เดียว
2.   ค้นหา log เร็วปานสายฟ้าแลบ
3.   วิเคราะห์ปัญหาได้แบบเทพๆ
4.   ทำ dashboard สวยๆ ให้บอสดู

## มาติดตั้ง ELK บน Kubernetes กัน! 🛠️

## 1. สร้าง Namespace ก่อนเลย!

kubectl create namespace elk-stack
## 2. ติดตั้ง Elasticsearch กันเถอะ!

สร้างไฟล์ `elasticsearch.yaml` แล้วใส่โค้ดนี้เข้าไป:

apiVersion: apps/v1  
kind: Deployment  
metadata:  
 name: elasticsearch  
 namespace: elk-stack  
spec:  
 replicas: 1  
 selector:  
 matchLabels:  
 app: elasticsearch  
 template:  
 metadata:  
 labels:  
 app: elasticsearch  
 spec:  
 containers:  
 - name: elasticsearch  
 image: docker.elastic.co/elasticsearch/elasticsearch:7.10.0  
 env:  
 - name: discovery.type  
 value: single-node  
 ports:  
 - containerPort: 9200  
---  
apiVersion: v1  
kind: Service  
metadata:  
 name: elasticsearch  
 namespace: elk-stack  
spec:  
 selector:  
 app: elasticsearch  
 ports:  
 - port: 9200  
 targetPort: 9200
แล้วรันคำสั่ง:

kubectl apply -f elasticsearch.yaml
## 3. ติดตั้ง Kibana กันต่อ!

สร้างไฟล์ `kibana.yaml` แล้วใส่โค้ดนี้:

apiVersion: apps/v1  
kind: Deployment  
metadata:  
 name: kibana  
 namespace: elk-stack  
spec:  
 replicas: 1  
 selector:  
 matchLabels:  
 app: kibana  
 template:  
 metadata:  
 labels:  
 app: kibana  
 spec:  
 containers:  
 - name: kibana  
 image: docker.elastic.co/kibana/kibana:7.10.0  
 env:  
 - name: ELASTICSEARCH_HOSTS  
 value: http://elasticsearch:9200  
 ports:  
 - containerPort: 5601  
---  
apiVersion: v1  
kind: Service  
metadata:  
 name: kibana  
 namespace: elk-stack  
spec:  
 type: NodePort  
 selector:  
 app: kibana  
 ports:  
 - port: 5601  
 targetPort: 5601
รันคำสั่ง:

kubectl apply -f kibana.yaml
## 4. สุดท้าย ติดตั้ง Filebeat!

สร้างไฟล์ `filebeat.yaml` แล้วใส่โค้ดนี้:

apiVersion: apps/v1  
kind: DaemonSet  
metadata:  
 name: filebeat  
 namespace: elk-stack  
spec:  
 selector:  
 matchLabels:  
 app: filebeat  
 template:  
 metadata:  
 labels:  
 app: filebeat  
 spec:  
 serviceAccountName: filebeat  
 containers:  
 - name: filebeat  
 image: docker.elastic.co/beats/filebeat:7.10.0  
 args: [  
 "-c", "/etc/filebeat.yml",  
 "-e",  
 ]  
 env:  
 - name: ELASTICSEARCH_HOST  
 value: elasticsearch.elk-stack.svc.cluster.local  
 - name: ELASTICSEARCH_PORT  
 value: "9200"  
 - name: NODE_NAME  
 valueFrom:  
 fieldRef:  
 fieldPath: spec.nodeName  
 securityContext:  
 runAsUser: 0  
 volumeMounts:  
 - name: config  
 mountPath: /etc/filebeat.yml  
 subPath: filebeat.yml  
 - name: dockersock  
 mountPath: /var/run/docker.sock  
 - name: logs  
 mountPath: /var/log  
 volumes:  
 - name: config  
 configMap:  
 name: filebeat-config  
 - name: dockersock  
 hostPath:  
 path: /var/run/docker.sock  
 - name: logs  
 hostPath:  
 path: /var/log  
---  
apiVersion: v1  
kind: ConfigMap  
metadata:  
 name: filebeat-config  
 namespace: elk-stack  
data:  
 filebeat.yml: |-  
 filebeat.inputs:  
 - type: container  
 paths:  
 - /var/log/containers/*.log  
 processors:  
 - add_kubernetes_metadata:  
 host: ${NODE_NAME}  
 matchers:  
 - logs_path:  
 logs_path: "/var/log/containers/"  
 setup.template.name: "filebeat"  
 setup.template.pattern: "filebeat-*"  
 setup.ilm.enabled: false  
 output.elasticsearch:  
 hosts: ['${ELASTICSEARCH_HOST}:${ELASTICSEARCH_PORT}']  
 index: "filebeat-%{[agent.version]}-%{+yyyy.MM.dd}"  
---  
apiVersion: v1  
kind: ServiceAccount  
metadata:  
 name: filebeat  
 namespace: elk-stack  
---  
apiVersion: rbac.authorization.k8s.io/v1  
kind: ClusterRole  
metadata:  
 name: filebeat  
rules:  
- apiGroups: [""]  
 resources:  
 - namespaces  
 - pods  
 verbs:  
 - get  
 - watch  
 - list  
---  
apiVersion: rbac.authorization.k8s.io/v1  
kind: ClusterRoleBinding  
metadata:  
 name: filebeat  
subjects:  
- kind: ServiceAccount  
 name: filebeat  
 namespace: elk-stack  
roleRef:  
 kind: ClusterRole  
 name: filebeat  
 apiGroup: rbac.authorization.k8s.io
รันคำสั่ง:

kubectl apply -f filebeat.yaml
วิธีใช้งาน Kibana แบบคูล ๆ 🧙‍♂️

1.   เข้า Kibana: หา URL ของ Kibana ด้วยคำสั่ง

kubectl get service kibana -n elk-stack
2. สร้าง Index Pattern:

- ไปที่ Management > Stack Management > Index Patterns
- สร้าง pattern ใหม่ชื่อ `filebeat-*`

3. ดู log สุดเจ๋ง:

- ไปที่ Discover
- ลองใช้ query เทพๆ เช่น:

`- kubernetes.namespace.name: "your-cool-namespace"`

`- kubernetes.pod.name: "your-awesome-pod"`

`- message: "error"` (ถ้าอยากเห็น error นะ 😅)

## เคล็ดลับ 🔮

1.   ใช้ช่วงเวลาที่มุมบนขวาเพื่อดู log ย้อนหลัง
2.   ใช้ KQL (Kibana Query Language) เพื่อค้นหา
3.   บันทึก query ที่ใช้บ่อยๆ ไว้ใช้ทีหลัง
4.   สร้าง Alert เพื่อให้ระบบเตือนเมื่อมีอะไรผิดปกติ

## สรุป

ตอนนี้คุณก็สามารถมี Logging Tools เจ๋ง ๆ แล้ว ซึ่งจริง ๆ แล้วเราสามารถใช้ helm ติดตั้งได้เหมือนกันนะ แต่ผมจะถนัดสร้างเป็น config files มากกว่า เพราะรู้สึกว่า custom อะไรได้เยอะกว่า จึงลองแชร์ด้วยวิธีนี้ครับ
