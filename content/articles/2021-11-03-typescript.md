---
title: "ทำไมถึงใช้ TypeScript"
author: "Nanpipat Klinpratoom"
published: "2021-11-03"
published_time: "2021-11-03T15:02:04Z"
source_url: "https://medium.com/@nanpipat.k/%E0%B8%97%E0%B8%B3%E0%B9%84%E0%B8%A1%E0%B8%96%E0%B8%B6%E0%B8%87%E0%B9%83%E0%B8%8A%E0%B9%89-typescript-97b17534d47c"
medium_id: "97b17534d47c"
---

# ทำไมถึงใช้ TypeScript

ตอนเริ่มใช้ TypeScript ใหม่ ๆ ความรู้สึกคล้ายมีเจ้าหน้าที่ตรวจเอกสารมายืนข้างโต๊ะครับ เขาจะถามตลอดว่า “ตัวแปรนี้เป็นอะไร” “ฟังก์ชันนี้คืนค่าอะไร” และ “แน่ใจนะว่าของชิ้นนี้มี Property ชื่อนั้น” ช่วงแรกน่ารำคาญนิดหนึ่ง แต่พอโปรเจกต์โต เราจะพบว่าเจ้าหน้าที่คนนี้ช่วยกันบั๊กไว้ตั้งแต่ยังไม่เดินออกจากออฟฟิศ

TypeScript ไม่ได้มาแทน JavaScript มันเพิ่มระบบ Type และเครื่องมือสำหรับตรวจโค้ด แล้วแปลงผลลัพธ์กลับเป็น JavaScript เพื่อให้ Runtime ทำงานตามปกติ เป้าหมายจึงไม่ใช่ทำให้โปรแกรม “ไม่มีวันพัง” แต่ทำให้ข้อผิดพลาดจำนวนมากถูกพบเร็วขึ้น ในจังหวะที่ยังแก้ถูกและแก้ถูกที่ครับ

ในปี 2026 TypeScript โตมาถึงสาย 5.9 แล้ว แต่เหตุผลหลักที่คนเลือกใช้ยังคงเป็น 5 เรื่องนี้

## 1. Type ช่วยหยุดบั๊กก่อนถึงผู้ใช้

JavaScript ยืดหยุ่นมาก และความยืดหยุ่นนั้นบางครั้งก็เหมือนประตูบานเลื่อนที่เปิดง่ายจนแมวเดินออกจากบ้านเองได้

```javascript
function add(a, b) {
  return a + b;
}

add("1", "2"); // ได้ "12" ไม่ใช่ 3
```

สำหรับ JavaScript เครื่องหมาย `+` ทำได้ทั้งบวกตัวเลขและต่อข้อความ จึงไม่ได้มองว่านี่เป็น Error แต่ธุรกิจของเราอาจมองว่าเป็นบั๊กเต็ม ๆ

TypeScript ทำสัญญาให้ชัด:

```typescript
function add(a: number, b: number): number {
  return a + b;
}

add(1, 2);     // 3
add("1", "2"); // Type error
```

ประโยชน์ไม่ได้อยู่ที่ต้องเขียน Type ทุกบรรทัด เพราะ TypeScript มี Type Inference และเดา Type จากบริบทได้ดี สิ่งสำคัญคือข้อมูลมีขอบเขตที่เครื่องมือตรวจสอบได้

```typescript
const taxRate = 0.07; // TypeScript รู้ว่าเป็น number
```

Type ไม่ได้ตรวจข้อมูลจากโลกภายนอกให้เราโดยอัตโนมัติ Response จาก API, JSON, Form และ Environment variable ยังต้อง Validate ตอน Runtime เสมอ TypeScript เป็นยามเฝ้าประตูในโลกของโค้ด ไม่ใช่เครื่อง X-ray ที่รู้ว่าพัสดุจากข้างนอกใส่อะไรมาครับ

## 2. Refactor ได้เหมือนเปิดไฟทั้งโกดัง

Requirement เปลี่ยนเป็นเรื่องปกติ วันนี้ `User.name` เป็น String เดียว พรุ่งนี้อาจแยกเป็น `firstName` กับ `lastName` ถ้าโปรเจกต์มีสิบไฟล์ การค้นข้อความอาจพอไหว แต่ถ้ามีหลายร้อยไฟล์ เราต้องรู้ด้วยว่า `name` ไหนคือชื่อผู้ใช้ `name` ไหนคือชื่อสินค้า และ `name` ไหนเป็นชื่อฟังก์ชัน

เมื่อ Type เชื่อมโยงกัน IDE สามารถ Rename Symbol, Find References และแจ้งทุกจุดที่ยังใช้โครงสร้างเก่าได้

```typescript
type User = {
  id: string;
  firstName: string;
  lastName: string;
};

function displayName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}
```

ถ้าใครยังเรียก `user.name` Compiler จะส่งสัญญาณทันที มันเหมือนเราย้ายห้องประชุมแล้วมีระบบบอกทุก Calendar ที่ยังชี้ไปห้องเก่า แทนที่จะรอให้คนเดินชนประตูทีละคน

อย่างไรก็ตาม TypeScript ช่วยได้มากเมื่อ Type อธิบาย Domain จริง ถ้าเราใช้ `any` กระจายเต็มโปรเจกต์ ก็เหมือนติดกล้องวงจรปิดแล้วเอาถุงดำคลุมเลนส์ไว้

## 3. Error หลายชนิดถูกจับตั้งแต่ตอนเขียน

ข้อผิดพลาดยอดนิยมที่ TypeScript ช่วยเห็นได้เร็ว เช่น:

- เรียก Property ที่ไม่มี
- ส่ง Argument ผิด Type
- ลืมจัดการค่า `undefined`
- คืนค่าผิดรูปแบบ
- ลืมกรณีหนึ่งของ Union Type

![Image 1](https://miro.medium.com/v2/resize:fit:500/0*C5TECmtui_WEN9fu.png)

ตัวอย่าง Union Type ที่ช่วยให้เราเขียน Logic ครบ:

```typescript
type PaymentStatus = "pending" | "paid" | "failed";

function statusLabel(status: PaymentStatus): string {
  switch (status) {
    case "pending":
      return "กำลังตรวจสอบ";
    case "paid":
      return "ชำระแล้ว";
    case "failed":
      return "ชำระไม่สำเร็จ";
  }
}
```

ถ้าเราเพิ่มสถานะ `refunded` เครื่องมือจะช่วยชี้ว่าฟังก์ชันนี้ยังไม่รู้จักสถานะใหม่ ยิ่งเปิด `strict` ใน `tsconfig.json` ระบบตรวจจะยิ่งจริงจังและมีประโยชน์กับโปรเจกต์ระยะยาว

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

ไม่จำเป็นต้องเปิดทุก Flag พร้อมกันใน Legacy project ค่อย ๆ เพิ่มและแก้เป็นส่วน ๆ ได้ แต่โปรเจกต์ใหม่ควรเริ่มจาก `strict` เพราะการขันเข็มขัดหลังรถวิ่งออกจากบ้านไปแล้วมักยากกว่าขันก่อนสตาร์ตครับ

## 4. Type กลายเป็นแผนที่ให้คนอ่านโค้ด

ลองเทียบสองฟังก์ชัน:

```javascript
function checkout(data) {
  // ...
}
```

กับ:

```typescript
type CheckoutInput = {
  cartId: string;
  couponCode?: string;
  paymentMethod: "card" | "promptpay";
};

type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: string };

function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  // ...
}
```

แบบหลังยังไม่ต้องเปิด Implementation เราก็รู้ว่า Function ต้องการอะไรและผลลัพธ์มีหน้าตาแบบไหน Type จึงทำหน้าที่เหมือนป้ายบนกล่องสายไฟ คนใหม่ในทีมไม่ต้องลองเสียบทุกช่องเพื่อดูว่าไฟจะดับหรือไม่

แต่ Type ไม่ควรกลายเป็นวิทยานิพนธ์ ถ้า Generic ซ้อนกันจนคนอ่านต้องวาดแผนผังสามหน้า ให้หยุดถามว่าเรากำลังสร้าง Abstraction ที่มีประโยชน์ หรือกำลังเล่นเกมต่อ Type เพื่อความสะใจครับ

## 5. IDE ช่วยทำงานได้เต็มกำลัง

Autocomplete ของ TypeScript ไม่ใช่เพียงเดาคำจากตัวอักษร แต่เข้าใจโครงสร้างข้อมูล จึงช่วยได้ตั้งแต่:

- แนะนำ Property และ Method ที่เรียกได้จริง
- แสดง Documentation ขณะ Hover
- กระโดดไป Definition
- หา Reference ทั้งโปรเจกต์
- Rename Symbol อย่างปลอดภัยขึ้น
- เตือน Deprecation และ Signature ที่เปลี่ยน

```typescript
type Product = {
  id: string;
  title: string;
  price: number;
};

function formatProduct(product: Product) {
  // พิมพ์ product. แล้ว IDE จะแนะนำ id, title และ price
  return `${product.title}: ${product.price.toFixed(2)}`;
}
```

นี่เป็นผลตอบแทนที่สัมผัสได้ทุกวัน เราใช้เวลาจำชื่อ Key และสลับไปดูไฟล์อื่นน้อยลง สมองจึงเหลือพื้นที่คิดเรื่อง Logic มากขึ้น

## TypeScript ไม่ได้ช่วยทุกอย่าง

เพื่อไม่ให้บทความกลายเป็นโฆษณายาสารพัดโรค ต้องพูดให้ครบว่า TypeScript มีต้นทุน:

- ต้องตั้งค่า Compiler และ Build pipeline
- Library บางตัวมี Type ไม่ครบหรือไม่ตรง Runtime
- Error ของ Type ขั้นสูงอาจอ่านยาก
- ทีมต้องเรียนรู้ Narrowing, Generics และ Utility Types
- Type หายไปหลัง Compile จึงใช้แทน Runtime validation ไม่ได้

ตัวอย่างอันตรายที่พบบ่อย:

```typescript
const user = JSON.parse(rawJson) as User;
```

คำว่า `as User` ไม่ได้ตรวจข้อมูล มันเพียงบอก Compiler ว่า “เชื่อผมเถอะ” ซึ่งคล้ายเขียนป้ายว่าอาหารปลอดภัยแล้วแปะบนกล่องโดยไม่เคยเปิดดู ถ้าข้อมูลมาจากภายนอก ให้ Validate ด้วย Schema หรือ Logic ที่ Runtime ก่อนนำไปใช้

## เริ่มใช้กับโปรเจกต์ใหม่

ติดตั้งและสร้าง Config ได้ด้วย:

```bash
npm install --save-dev typescript
npx tsc --init
```

ตรวจ Type โดยไม่สร้างไฟล์ JavaScript:

```bash
npx tsc --noEmit
```

ใน CI ควรมี Type Check แยกจาก Test และ Lint เพราะทั้งสามอย่างจับปัญหาคนละชนิด:

```text
Type Check  ตรวจสัญญาระหว่างข้อมูล
Test        ตรวจพฤติกรรมตอนรัน
Lint        ตรวจรูปแบบและความเสี่ยงของโค้ด
```

ไม่มีอันไหนแทนกันได้ทั้งหมดครับ

## สรุป

เหตุผลที่ใช้ TypeScript ไม่ใช่เพราะ JavaScript แย่ แต่เพราะเมื่อระบบใหญ่ขึ้น เราต้องการข้อตกลงที่มองเห็นและตรวจได้ Type ช่วยกันบั๊กก่อนรัน ทำให้ Refactor มั่นใจขึ้น อธิบายโค้ดให้คนอ่าน และปลดพลัง IDE ให้ทำงานแทนความจำของเรา

ช่วงแรกมันอาจดูเหมือนเพื่อนร่วมทีมที่ชอบทักทุกเรื่อง แต่พอวันหนึ่งเราเปลี่ยน Data Model ใหญ่ ๆ แล้ว Compiler ไล่จุดที่ต้องแก้ให้ครบ เราจะเริ่มรู้สึกว่าเพื่อนคนนี้ไม่ได้จู้จี้ครับ เขาแค่ไม่อยากให้เราไปรู้จักบั๊กครั้งแรกจากข้อความของลูกค้าเท่านั้นเอง

อ่านต่อจากเอกสารทางการ: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) และ [TypeScript 5.9 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)
