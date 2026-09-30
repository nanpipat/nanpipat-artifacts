# Microservices Decision Field Guide

ใช้เอกสารนี้ตอนออกแบบระบบหรือคุยใน Architecture review เป้าหมายไม่ใช่พิสูจน์ว่า Microservices ดีหรือไม่ดี แต่หาว่า **เราต้องการอิสระตรงไหน และพร้อมจ่ายค่าระบบกระจายหรือยัง**

## 1. ปัญหาที่ต้องการแก้

- [ ] หลายทีมติดกันเพราะต้อง Deploy พร้อมกัน
- [ ] บาง Capability ต้อง Scale ต่างจากส่วนอื่นอย่างชัดเจน
- [ ] ต้องแยก Fault, Compliance หรือ Data boundary
- [ ] Release ของส่วนหนึ่งเสี่ยงกระทบระบบทั้งก้อน
- [ ] Domain ใหญ่พอจน Ownership ใน Application เดียวเริ่มไม่ชัด

ถ้ายังติ๊กไม่ได้สักข้อ ให้เริ่มจากปรับ Module, Test และ Delivery pipeline ก่อน การเพิ่ม Network ไม่ใช่วิธีรักษา Code ที่ไม่มี Boundary

## 2. Service Boundary Canvas

```text
ชื่อ Capability:
Business outcome ที่รับผิดชอบ:
ภาษาหรือกฎสำคัญใน Context นี้:
ทีมเจ้าของ:

ข้อมูลที่ Service เป็น Source of truth:
-

Command/API ที่รับ:
-

Event ที่ประกาศ:
-

Dependency ที่ต้องเรียกแบบ Synchronous:
-

สิ่งที่ทำต่อได้เมื่อ Dependency ล่ม:
-

เหตุผลที่ต้อง Deploy หรือ Scale แยก:
-
```

## 3. Boundary Tests

### Change together

- ถ้าสองส่วนเปลี่ยนพร้อมกันแทบทุกครั้ง ให้พิจารณาอยู่ Service เดียวกัน
- ถ้า Release หนึ่ง Service บังคับให้อีกหลาย Service Release พร้อมกัน Boundary ยังไม่อิสระ

### Chatty calls

- นับ Remote call ต่อหนึ่ง User journey
- ถ้าสอง Service โทรหากันกลับไปกลับมาถี่ ให้พิจารณารวม Boundary หรือเปลี่ยน Flow

### Data ownership

- ทุก Table/Collection ต้องมี Service เจ้าของเพียงรายเดียว
- Service อื่นอ่านผ่าน API, Event หรือ Read model
- แยก Source of truth ออกจากข้อมูลสำเนาที่ Eventually consistent

### Failure isolation

- กำหนด Timeout ของทุก Remote call
- ระบุพฤติกรรมเมื่อ Dependency ช้า ล่ม หรือส่งข้อมูลซ้ำ
- ตอบให้ได้ว่า Failure ใดควร Fail fast, Retry, Queue หรือ Degrade

## 4. Communication Decision

ใช้ Synchronous เมื่อ:

- ต้องตอบทันทีเพื่อเดินขั้นตอนปัจจุบัน
- Dependency chain สั้นและ Latency ควบคุมได้
- Caller รับมือ Failure ได้ชัดเจน

ใช้ Asynchronous เมื่อ:

- ผู้ส่งไม่จำเป็นต้องรอผลทันที
- ต้อง Buffer งานช่วง Traffic พุ่ง
- มี Consumer หลายตัว
- ต้องการให้ปลายทางล่มชั่วคราวโดยงานยังรอได้

ทุก Message consumer ควร:

- [ ] รับ Message ซ้ำได้อย่างปลอดภัย
- [ ] มี Message ID และ Correlation/Trace ID
- [ ] มี Retry policy และ Dead-letter handling
- [ ] ตรวจ Schema version
- [ ] มีวิธี Replay และ Reconcile

## 5. Distributed Transaction Canvas

```text
Business transaction:

Local transactions ตามลำดับ:
1.
2.
3.

จุดที่อาจล้ม:
-

Compensating action ของแต่ละขั้น:
-

ใช้ Choreography หรือ Orchestration เพราะอะไร:
-

ต้องใช้ Transactional outbox ที่ Service ใด:
-

Idempotency key คืออะไร:
-
```

## 6. Production Readiness

### Delivery

- [ ] Automated tests ครอบคลุม Logic และ Integration สำคัญ
- [ ] Contract test หรือ Breaking-change check
- [ ] Deploy และ Rollback/roll-forward แยกได้
- [ ] Database migration รองรับ Code เก่าและใหม่ช่วงเปลี่ยนรุ่น

### Observability

- [ ] Structured logs มี service, trace_id และ business identifier
- [ ] Metrics วัด Error, Latency, Traffic และ Saturation
- [ ] Distributed trace ข้าม Service ได้
- [ ] SLI/SLO สะท้อน User journey
- [ ] Alert บอกอาการที่คนลงมือแก้ได้

### Resilience

- [ ] Timeout ทุก Remote call
- [ ] Retry เฉพาะ Transient failure พร้อม Backoff และ Jitter
- [ ] Circuit breaker หรือ Fail-fast เมื่อ Dependency พังต่อเนื่อง
- [ ] Bulkhead/limit ป้องกัน Resource ถูกกินทั้งระบบ
- [ ] Queue backlog และ Dead letter มี Owner

### Security

- [ ] Service และผู้ใช้ผ่าน Authentication/Authorization ตามขอบเขต
- [ ] Secret ไม่อยู่ใน Source code หรือ Image
- [ ] Network และ Data access ใช้ Least privilege
- [ ] Dependency/Image ผ่านการตรวจช่องโหว่
- [ ] มี Audit trail สำหรับ Operation สำคัญ

### Ownership

- [ ] ทุก Service มีทีมเจ้าของ
- [ ] Owner มีสิทธิ์ดู Telemetry และ Deploy ตามหน้าที่
- [ ] มี Runbook และ On-call path
- [ ] Dependency และ Contract มีรายชื่อผู้รับผิดชอบ

## 7. Stop Signs

หยุดและทบทวนถ้า:

- เหตุผลหลักคืออยากใช้ Kubernetes
- ทุก Service ใช้ Database schema เดียวกัน
- Feature ส่วนใหญ่ต้องแก้ทุก Service
- มี Service มากกว่าคนที่เข้าใจมัน
- ยังไม่มี Monitoring แต่กำลังเลือก Service mesh
- ทีมเรียกทุก Endpoint ว่า Microservice ทั้งที่ Deploy พร้อมกันหมด

## 8. Migration Slice

เริ่ม Extract Capability หนึ่งส่วนด้วยลำดับนี้:

1. ระบุ Pain และ Metric ก่อนย้าย
2. เลือก Boundary ที่ชัดและมี Business value
3. สร้าง Contract หรือ Anti-corruption layer
4. ย้าย Logic และ Data ownership ทีละช่วง
5. เปิด Telemetry และ Rollback ก่อนรับ Traffic จริง
6. ให้ระบบเก่ากับใหม่ Coexist
7. ย้าย Traffic แบบ Progressive
8. ลบเส้นทางเก่าเมื่อยืนยันว่าไม่มี Consumer เหลือ

## คำถามสุดท้ายใน Architecture Review

> อิสระที่เราจะได้จาก Service นี้ มีค่ามากกว่าค่าประสานงานที่เพิ่มขึ้นหรือไม่?

ถ้าตอบได้ด้วยหลักฐาน เรากำลังออกแบบ Architecture ถ้าตอบได้เพียงว่า “บริษัทดัง ๆ ก็ทำ” เรากำลังเลือกของแต่งบ้านครับ
