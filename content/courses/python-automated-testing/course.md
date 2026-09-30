---
title: "Automated Tester with Python — สร้างหุ่นยนต์เปิดเว็บ กรอกฟอร์ม และจับบั๊กแทนเรา"
level: "Part 4 of 4"
tags: ["python", "testing", "selenium"]
updated: "2026-09-30"
cover: "/covers/python-automated-testing.svg"
summary: "สร้างหุ่นยนต์ทดสอบเว็บด้วย Selenium — เปิดหน้า Login กรอกฟอร์ม กดปุ่ม และจับบั๊กแทนคน วนได้ทุกวันโดยไม่เบื่อ"
---


ลองนึกภาพว่าเรามีเว็บขายของ และก่อนปล่อยเวอร์ชันใหม่ต้องตรวจว่า

- เปิดหน้า Login ได้ไหม
- รหัสถูกต้องแล้วเข้าได้จริงหรือเปล่า
- รหัสผิดแล้วขึ้นข้อความเตือนหรือไม่
- ปุ่มซื้อของยังกดได้ไหม
- กรอกฟอร์มแล้วข้อมูลถูกส่งหรือเปล่า
- Logout แล้วกลับมาหน้าเดิมจริงไหม

ถ้าทำครั้งเดียวก็ยังพอไหว แต่ถ้าต้องทำทุกวัน บนหลายเบราว์เซอร์ และลองข้อมูลอีกหลายสิบชุด คนทดสอบจะกลายเป็นดีเจประจำเว็บ—คลิกช่องเดิม พิมพ์คำเดิม กดปุ่มเดิม วนไปทั้งวัน

Automated Testing คือการเขียนโปรแกรมให้ทำขั้นตอนซ้ำเหล่านี้แทนเรา ส่วน Selenium คือเครื่องมือที่ช่วยให้ Python ควบคุมเบราว์เซอร์ได้เหมือนมีมือที่มองไม่เห็นคอยคลิก พิมพ์ เลื่อนหน้า และตรวจผล

เป้าหมายไม่ได้อยู่ที่ทำให้คนทดสอบหายไป แต่คืนเวลาให้คนไปคิดกรณีที่ซับซ้อน สำรวจประสบการณ์ผู้ใช้ และตามหาบั๊กที่ต้องใช้วิจารณญาณจริง ๆ

---

## 1. Manual Test กับ Automated Test ต่างกันอย่างไร

### Manual Test

คนเปิดเว็บและลองใช้งานเอง เหมาะกับการสำรวจระบบใหม่ ตรวจความสวยงาม ดูความรู้สึกในการใช้งาน และกรณีที่ยังเปลี่ยนบ่อย

ข้อดีคือมนุษย์สังเกตสิ่งที่สคริปต์ไม่ได้ถูกสั่งให้มอง เช่น ปุ่มไม่เสียแต่ตำแหน่งชวนสับสน สีตัวอักษรอ่านยาก หรือขั้นตอนชำระเงินทำให้รู้สึกไม่มั่นใจ

ข้อจำกัดคือช้า เหนื่อย และผลอาจต่างกันตามคนหรือเวลา

### Automated Test

เราเขียนขั้นตอนและเงื่อนไขที่คาดหวังไว้ล่วงหน้า โปรแกรมทำซ้ำได้รวดเร็วและสม่ำเสมอ เหมาะกับ Regression Test หรือการเช็กว่าของที่เคยใช้ได้ยังไม่พังหลังแก้โค้ด

ข้อดีคือ:

- ทำซ้ำได้โดยไม่เบื่อ
- รันตอนกลางคืนหรือในกระบวนการ CI ได้
- ทดสอบข้อมูลหลายชุดได้เร็ว
- เก็บหลักฐานอย่างภาพหน้าจอและ Log ได้

ข้อจำกัดคือ:

- ต้องลงทุนเขียนและดูแล Test
- หน้าเว็บเปลี่ยนแล้ว Locator อาจพัง
- ไม่เก่งเรื่องความรู้สึกและงานเชิงสำรวจ
- Test ที่ออกแบบไม่ดีอาจผ่านทั้งที่ระบบมีปัญหา

Automation จึงเหมือนเครื่องล้างจาน มันเก่งกับงานซ้ำและช่วยประหยัดแรง แต่ไม่ใช่คนเลือกเมนู ไม่รู้ว่าจานใบไหนสวยพอเสิร์ฟ และถ้าเราเรียงจานผิด มันก็ล้างได้ไม่ดี

---

## 2. Selenium คืออะไร

Selenium เป็นชุดเครื่องมือสำหรับควบคุมเว็บเบราว์เซอร์ เหมาะกับการทดสอบ Web Application แบบ End-to-End เพราะมันใช้งานหน้าเว็บคล้ายผู้ใช้จริง

ภาพการทำงานมีสามฝ่าย

```text
Python Test Script
       ↓ คำสั่ง
WebDriver
       ↓ ควบคุม
Browser → Website
```

- **Test Script** บอกว่าจะเปิดหน้าไหน ทำอะไร และคาดหวังผลแบบใด
- **WebDriver** เป็นตัวกลางส่งคำสั่งไปยังเบราว์เซอร์
- **Browser** แสดงและทำงานกับเว็บจริง

เราสั่งว่า “หาช่อง username พิมพ์ student คลิก Submit แล้วตรวจหัวข้อ” ส่วน Selenium แปลงคำสั่งนั้นเป็นการกระทำใน Chrome หรือเบราว์เซอร์ที่เลือก

---

## 3. เตรียมเครื่องมือ

ติดตั้ง Selenium ด้วยคำสั่ง:

```bash
python -m pip install selenium
```

ทดสอบเปิดเบราว์เซอร์:

```python
from selenium import webdriver

driver = webdriver.Chrome()
driver.get("https://www.selenium.dev/selenium/web/web-form.html")

print(driver.title)
driver.quit()
```

Selenium รุ่นปัจจุบันมี Selenium Manager ช่วยจัดการ Driver ในหลายกรณี จึงมักไม่ต้องดาวน์โหลดไฟล์ ChromeDriver ด้วยตนเอง แต่เครื่องต้องมีเบราว์เซอร์ที่รองรับและเชื่อมต่ออินเทอร์เน็ตได้ในครั้งที่ต้องจัดเตรียม Driver

สองคำสั่งที่ต้องจำ:

- `driver.get(url)` เปิดหน้าเว็บ
- `driver.quit()` ปิดทุกหน้าต่างและจบ Session

ควรปิดด้วย `quit()` เสมอ ไม่อย่างนั้นเราอาจทิ้ง Chrome หลายสิบหน้าต่างไว้เหมือนเปิดประตูบ้านแล้วลืมปิดทั้งคืน

---

## 4. Test Case ที่ดีหน้าตาอย่างไร

ก่อนเขียนโค้ด ควรเขียนสถานการณ์เป็นภาษาคนก่อน เช่น

```text
ชื่อ: ผู้ใช้ Login ด้วยข้อมูลถูกต้อง

Given  ผู้ใช้อยู่หน้า Login
When   กรอก username และ password ที่ถูกต้อง
And    กด Submit
Then   ระบบพาไปหน้าสำเร็จ
And    แสดงข้อความ Logged In Successfully
And    มีปุ่ม Log out
```

รูปแบบ Given–When–Then ช่วยแยกสามช่วง:

- **Given** เตรียมสถานะก่อนเริ่ม
- **When** การกระทำที่ต้องการทดสอบ
- **Then** ผลที่ต้องเกิดขึ้น

อย่าเขียนเพียง “ทดสอบ Login” เพราะไม่มีใครรู้ว่าทดสอบกรณีไหน ข้อมูลอะไร และผ่านเมื่อใด ชื่อที่ดีควรอ่านแล้วเห็นพฤติกรรม เช่น `test_login_succeeds_with_valid_credentials`

---

## 5. Locator: บอกหุ่นยนต์ว่าจะจับอะไร

คนมองหน้าเว็บแล้วรู้ว่านี่คือปุ่ม Login แต่ Selenium มองเป็นโครงสร้าง HTML เราต้องให้ที่อยู่ของ Element ผ่าน Locator

สมมติ HTML เป็นแบบนี้:

```html
<input id="username" name="user" type="text">
<button id="submit" type="submit">Submit</button>
<a href="/logout">Log out</a>
```

เราหา Element ได้หลายวิธี:

```python
from selenium.webdriver.common.by import By

driver.find_element(By.ID, "username")
driver.find_element(By.NAME, "user")
driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
driver.find_element(By.LINK_TEXT, "Log out")
driver.find_element(By.TAG_NAME, "h1")
```

หลักเลือก Locator แบบง่าย:

1. ถ้ามี `id` ที่ไม่เปลี่ยนและไม่ซ้ำ ให้เริ่มจาก ID
2. ใช้ `name` เมื่อเป็นชื่อที่ชัดและคงที่
3. ใช้ CSS Selector เมื่อต้องระบุความสัมพันธ์หรือ Attribute
4. ใช้ข้อความของลิงก์เมื่อข้อความนั้นเป็นส่วนหนึ่งของพฤติกรรมที่ต้องตรวจ
5. หลีกเลี่ยง Selector ยาวตั้งแต่ `<body>` ลงมาหลายชั้น เพราะหน้าเว็บขยับนิดเดียวก็พัง

Locator เปรียบเหมือนที่อยู่ส่งพัสดุ `#username` คือบ้านเลขที่ชัดเจน ส่วน `body > div:nth-child(3) > div > form...` คล้ายบอกว่า “บ้านหลังที่สามถัดจากต้นไม้ซึ่งวันนี้อาจถูกตัด”

ถ้าเว็บเป็นของทีมเราเอง การเพิ่ม Attribute สำหรับทดสอบ เช่น `data-testid="login-button"` อาจทำให้ Test เสถียรขึ้น โดยต้องตกลงร่วมกับทีมพัฒนา

---

## 6. การกระทำพื้นฐาน: คลิก พิมพ์ อ่าน และกดปุ่ม

```python
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

search_box = driver.find_element(By.NAME, "q")
search_box.clear()
search_box.send_keys("Selenium Python")
search_box.send_keys(Keys.RETURN)

heading = driver.find_element(By.TAG_NAME, "h1")
print(heading.text)
```

คำสั่งที่ใช้บ่อย:

- `.click()` คลิก Element
- `.send_keys()` พิมพ์หรือส่งปุ่มพิเศษ
- `.clear()` ล้างข้อความเดิมในช่อง
- `.text` อ่านข้อความที่แสดง
- `.get_attribute("value")` อ่านค่า Attribute
- `.is_displayed()` ตรวจว่า Element มองเห็นหรือไม่
- `.is_enabled()` ตรวจว่าใช้งานได้หรือไม่
- `.is_selected()` ตรวจว่า Checkbox หรือ Radio ถูกเลือกหรือไม่

การที่หา Element เจอไม่ได้แปลว่าผู้ใช้ใช้งานได้เสมอ ปุ่มอาจอยู่ใน DOM แต่ถูกซ่อนหรือ Disable อยู่ เราจึงต้องตรวจคุณสมบัติให้ตรงกับสิ่งที่ผู้ใช้ควรทำได้

---

## 7. Wait: หน้าเว็บไม่ได้วิ่งเร็วเท่ากันทุกครั้ง

ตัวอย่างเริ่มต้นมักใช้:

```python
import time
time.sleep(3)
```

มันเข้าใจง่าย แต่เปราะ ถ้าหน้าโหลดเสร็จในครึ่งวินาที เราเสียเวลารออีกสองวินาทีครึ่ง ถ้าวันนี้เน็ตช้าและใช้สี่วินาที Test ก็พังทั้งที่ระบบไม่ได้ผิด

วิธีที่เหมาะกว่าคือ Explicit Wait บอกให้ Selenium รอ “เหตุการณ์” แทนรอ “จำนวนวินาทีตายตัว”

```python
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

wait = WebDriverWait(driver, 10)

username = wait.until(
    EC.visibility_of_element_located((By.ID, "username"))
)

submit = wait.until(
    EC.element_to_be_clickable((By.ID, "submit"))
)
```

นี่เหมือนรอรถโดยดูว่ารถมาหรือยัง ไม่ใช่หลับตานับสิบวินาทีแล้วหวังว่ารถจะจอดอยู่ตรงหน้า

เงื่อนไขที่ใช้บ่อย:

- `presence_of_element_located` มี Element ใน DOM
- `visibility_of_element_located` Element ปรากฏให้เห็น
- `element_to_be_clickable` มองเห็นและคลิกได้
- `url_contains` URL มีข้อความที่คาดหวัง
- `text_to_be_present_in_element` ข้อความปรากฏใน Element

---

## 8. โปรเจกต์ที่ 1: กรอก Web Form ให้ครบ

เว็บทดสอบของ Selenium มีช่องข้อความ Password Textarea Dropdown Checkbox และ Radio ให้ลองโดยไม่ไปรบกวนเว็บจริง

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
wait = WebDriverWait(driver, 10)

try:
    driver.get("https://www.selenium.dev/selenium/web/web-form.html")

    text_input = wait.until(
        EC.visibility_of_element_located((By.ID, "my-text-id"))
    )
    text_input.send_keys("สวัสดีจาก Selenium")

    driver.find_element(By.NAME, "my-password").send_keys("password123")
    driver.find_element(By.NAME, "my-textarea").send_keys(
        "บรรทัดที่ 1\nบรรทัดที่ 2"
    )

    dropdown = Select(driver.find_element(By.NAME, "my-select"))
    dropdown.select_by_value("2")

    checkbox = driver.find_element(By.ID, "my-check-2")
    if not checkbox.is_selected():
        checkbox.click()

    radio = driver.find_element(By.ID, "my-radio-2")
    radio.click()

    driver.find_element(
        By.CSS_SELECTOR, "button[type='submit']"
    ).click()

    message = wait.until(
        EC.visibility_of_element_located((By.ID, "message"))
    )

    assert message.text == "Received!"
    driver.save_screenshot("form_success.png")
    print("PASS: ส่งฟอร์มสำเร็จ")

finally:
    driver.quit()
```

จุดที่น่าสนใจ:

- ใช้ `Select` จัดการ `<select>` โดยตรง อ่านง่ายกว่าคลิกตัวเลือกเอง
- เช็ก `is_selected()` ก่อนคลิก Checkbox เพื่อไม่ให้เผลอเอาเครื่องหมายถูกออก
- ใช้ `assert` บอกเงื่อนไขว่าต้องเป็นจริง
- ครอบด้วย `try/finally` เพื่อให้ปิด Browser แม้ Test ล้มเหลว
- บันทึก Screenshot เป็นหลักฐาน

ถ้า `message.text` ไม่เท่ากับ `Received!` Python จะยก `AssertionError` และ Test ถือว่าไม่ผ่าน นี่สำคัญมาก เพราะ Script ที่เปิดเว็บและคลิกจนครบแต่ไม่ตรวจผล เป็นเพียง Automation ไม่ใช่ Automated Test

---

## 9. Assert คือกรรมการ ไม่ใช่แค่คนดู

ลองเปรียบเทียบสองโค้ด

```python
print("น่าจะ Login สำเร็จ")
```

กับ

```python
assert "logged-in-successfully" in driver.current_url
assert driver.find_element(By.TAG_NAME, "h1").text == "Logged In Successfully"
assert driver.find_element(By.LINK_TEXT, "Log out").is_displayed()
```

แบบแรกเพียงเล่าความรู้สึก แบบหลังตั้งกติกาที่ตรวจได้

Assertion ที่ดีควรตรวจสิ่งสำคัญต่อผู้ใช้ ไม่ใช่ตรวจรายละเอียดภายในทุกอย่างจน Test แตกเมื่อทีมปรับหน้าตาเล็กน้อย สำหรับ Login เราสนใจว่าเข้าหน้าสำเร็จ เห็นเนื้อหาที่ถูกต้อง และออกจากระบบได้ มากกว่าสนใจว่าสีปุ่มมีค่า Hex อะไร—เว้นแต่งานนั้นกำลังทดสอบ Design System โดยตรง

---

## 10. โปรเจกต์ที่ 2: ทดสอบ Login ทั้งทางสว่างและทางมืด

Happy Path คือเส้นทางปกติที่ข้อมูลถูกต้อง ส่วน Negative Case คือสถานการณ์ที่ข้อมูลผิดหรือขาด ระบบที่ดีต้องรับมือทั้งคู่

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

TEST_URL = "https://practicetestautomation.com/practice-test-login/"


def login(driver, username, password):
    driver.get(TEST_URL)
    wait = WebDriverWait(driver, 10)

    username_box = wait.until(
        EC.visibility_of_element_located((By.ID, "username"))
    )
    username_box.clear()
    username_box.send_keys(username)

    password_box = driver.find_element(By.ID, "password")
    password_box.clear()
    password_box.send_keys(password)

    driver.find_element(By.ID, "submit").click()


driver = webdriver.Chrome()

try:
    # Case 1: ข้อมูลถูกต้อง
    login(driver, "student", "Password123")

    WebDriverWait(driver, 10).until(
        EC.url_contains("logged-in-successfully")
    )

    assert driver.find_element(By.TAG_NAME, "h1").text == \
        "Logged In Successfully"
    assert driver.find_element(By.LINK_TEXT, "Log out").is_displayed()
    driver.save_screenshot("login_success.png")

    # Case 2: Password ผิด
    login(driver, "student", "wrongpassword")

    error = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.ID, "error"))
    )

    assert "invalid" in error.text.lower()
    driver.save_screenshot("login_invalid_password.png")

finally:
    driver.quit()
```

รายการกรณีที่ควรคิดต่อ:

| กรณี | สิ่งที่คาดหวัง |
|---|---|
| Username และ Password ถูก | เข้าใช้งานได้ |
| Username ผิด | แสดง Error ที่เข้าใจง่าย |
| Password ผิด | แสดง Error แต่ไม่เปิดเผยข้อมูลเกินจำเป็น |
| ช่องว่าง | ระบบขอให้กรอกข้อมูล |
| มีช่องว่างหัวท้าย | ทำงานตามกติกาที่กำหนด |
| กรอกหลายครั้งผิด | ระบบจัดการตามนโยบายความปลอดภัย |
| Logout | Session จบและกลับหน้า Login |

ในงานจริงอย่าใส่รหัสผ่าน Production ลงใน Source Code ควรใช้ Environment Variable หรือระบบจัดการ Secret และใช้บัญชีทดสอบที่สิทธิ์จำกัด

---

## 11. โปรเจกต์ที่ 3: ค้นหาข้อมูลและตรวจผล

ตัวอย่างค้นหาเหมาะกับการฝึก `send_keys(Keys.RETURN)` และการหา Element หลายตัว แต่ Search Engine สาธารณะอาจเปลี่ยนหน้า แสดง Consent หรือใช้ CAPTCHA จึงไม่เหมาะเป็น Test หลักที่ต้องเสถียร

ใช้เว็บสำหรับฝึกหรือระบบของเราเองดีกว่า ตัวอย่างแนวคิดกับ DuckDuckGo:

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()

try:
    driver.get("https://duckduckgo.com/")

    search_box = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.NAME, "q"))
    )
    search_box.send_keys("Selenium Python")
    search_box.send_keys(Keys.RETURN)

    results = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located(
            (By.CSS_SELECTOR, "[data-testid='result-title-a']")
        )
    )

    assert len(results) > 0
    assert any("selenium" in item.text.lower() for item in results)
    driver.save_screenshot("search_result.png")

finally:
    driver.quit()
```

ถ้าเจอ CAPTCHA อย่าพยายามเขียนโค้ดหลบหรือปลอมตัวเป็นผู้ใช้ การป้องกันนั้นมีไว้ควบคุมการใช้งานอัตโนมัติ ควรเปลี่ยนไปใช้ Environment ทดสอบ, API ที่ได้รับอนุญาต หรือ Mock ข้อมูลแทน

---

## 12. เมื่อ Test ล้มเหลว ต้องเหลือร่องรอยไว้

Test ที่บอกเพียง `FAIL` เหมือนสัญญาณเตือนไฟไหม้ที่ไม่บอกว่าชั้นไหน เราควรเก็บข้อมูลพอให้สืบย้อนกลับได้

```python
from pathlib import Path

evidence_dir = Path("test-evidence")
evidence_dir.mkdir(exist_ok=True)

try:
    # ขั้นตอนทดสอบ
    assert "expected" in driver.page_source
except Exception:
    driver.save_screenshot(str(evidence_dir / "failure.png"))
    (evidence_dir / "page.html").write_text(
        driver.page_source,
        encoding="utf-8"
    )
    raise
```

หลักฐานที่มีประโยชน์:

- Screenshot ตอนล้มเหลว
- URL ปัจจุบัน
- ข้อความ Error และ Stack Trace
- HTML ของหน้าในเวลานั้น
- Browser/OS/เวลาที่รัน
- ข้อมูลทดสอบที่ไม่ใช่ความลับ

อย่าบันทึก Password Token หมายเลขบัตร หรือข้อมูลส่วนบุคคลลง Log เพราะหลักฐานแก้บั๊กไม่ควรกลายเป็นบั๊กความปลอดภัยก้อนใหม่

---

## 13. ลด Test ที่เดี๋ยวผ่านเดี๋ยวพัง

Test ที่ผลไม่แน่นอนทั้งที่โค้ดไม่เปลี่ยนเรียกว่า Flaky Test มันอันตรายเพราะเมื่อเตือนผิดบ่อย ทีมจะเริ่มเมิน เหมือนสัญญาณกันขโมยที่ร้องทุกครั้งเมื่อแมวเดินผ่าน

สาเหตุยอดนิยม:

### ใช้ `sleep()` แบบเดาเวลา

แก้ด้วย Explicit Wait ที่รอเหตุการณ์จริง

### Locator ผูกกับโครงสร้างหน้าแน่นเกินไป

เลือก ID, Name หรือ Test Attribute ที่เสถียร

### Test พึ่งพากัน

Test B ต้องรอให้ Test A สร้างข้อมูล ทำให้รันเดี่ยวไม่ได้ ควรเตรียมและเก็บสถานะของแต่ละ Test ให้เป็นอิสระเมื่อเป็นไปได้

### ใช้ข้อมูลร่วมกันจนชนกัน

Test หลายตัวแก้บัญชีหรือรายการเดียวพร้อมกัน ควรสร้างข้อมูลเฉพาะ Test หรือมีวิธี Reset ที่ปลอดภัย

### ทดสอบบริการภายนอกโดยตรง

เว็บภายนอกเปลี่ยนได้และไม่อยู่ในการควบคุมของเรา ใช้ Mock, Stub หรือ Test Environment สำหรับส่วนที่ต้องเสถียร

### Assertion กว้างเกินไป

การค้นคำว่า `Success` ใน `page_source` อาจเจอในเมนูหรือ Script ทั้งที่งานล้มเหลว ควรหา Element ที่เป็นข้อความผลลัพธ์โดยตรง

---

## 14. จัดโค้ดให้โตได้ด้วย Page Object

เมื่อมี Test หลายสิบไฟล์ ถ้าทุกไฟล์เขียน Locator ของหน้า Login ซ้ำกัน หน้าเว็บเปลี่ยนทีต้องแก้ทุกแห่ง Page Object ช่วยรวมรายละเอียดของหน้าไว้ที่เดียว

```python
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class LoginPage:
    USERNAME = (By.ID, "username")
    PASSWORD = (By.ID, "password")
    SUBMIT = (By.ID, "submit")
    ERROR = (By.ID, "error")

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def open(self):
        self.driver.get(
            "https://practicetestautomation.com/practice-test-login/"
        )
        return self

    def login(self, username, password):
        self.wait.until(
            EC.visibility_of_element_located(self.USERNAME)
        ).send_keys(username)
        self.driver.find_element(*self.PASSWORD).send_keys(password)
        self.driver.find_element(*self.SUBMIT).click()

    def error_message(self):
        return self.wait.until(
            EC.visibility_of_element_located(self.ERROR)
        ).text
```

Test จึงอ่านคล้ายภาษาคนมากขึ้น:

```python
page = LoginPage(driver).open()
page.login("student", "wrongpassword")
assert "invalid" in page.error_message().lower()
```

Page Object ไม่ควรกลายเป็นโกดังรวมทุกอย่าง หน้าที่หลักคือซ่อนรายละเอียดการหาและโต้ตอบกับหน้า ส่วน Assertion ว่าพฤติกรรมถูกหรือไม่มักอ่านชัดกว่าเมื่ออยู่ใน Test

---

## 15. รันหลาย Test อย่างเป็นระบบด้วย pytest

เมื่อเริ่มมีหลายกรณี Framework อย่าง pytest ช่วยค้นหา Test รายงานผล และจัด Fixture สำหรับเปิด-ปิด Browser

ติดตั้ง:

```bash
python -m pip install pytest selenium
```

ตัวอย่างโครง:

```python
import pytest
from selenium import webdriver


@pytest.fixture
def driver():
    browser = webdriver.Chrome()
    yield browser
    browser.quit()


def test_page_has_expected_title(driver):
    driver.get("https://www.selenium.dev/selenium/web/web-form.html")
    assert driver.title == "Web form"
```

รันด้วย:

```bash
pytest -v
```

`yield` แบ่ง Fixture เป็นช่วงเตรียมก่อน Test และเก็บกวาดหลัง Test ไม่ว่า Test จะผ่านหรือพัง เราก็มีจุดดูแล Browser ที่เดียว

จากนั้นค่อยต่อยอดไปสู่ Parameterization, Report และ CI เมื่อพื้นฐานแข็งแรง อย่าเพิ่งติดตั้งของแต่งเต็มรถก่อนเครื่องยนต์สตาร์ตติด

---

## 16. Test Pyramid: ไม่ใช่ทุกอย่างต้องเปิด Browser

UI Test มีประโยชน์ แต่ช้าและเปราะที่สุด ถ้าทดสอบทุกเงื่อนไขผ่านหน้าเว็บ ชุด Test จะใช้เวลานานและดูแลยาก

แนวคิด Test Pyramid แนะนำให้มี:

```text
          UI / End-to-End     จำนวนน้อย
        Integration / API     จำนวนกลาง
             Unit Test        จำนวนมาก
```

- Unit Test ตรวจฟังก์ชันเล็ก ๆ เร็วมาก
- Integration/API Test ตรวจว่าส่วนต่าง ๆ ติดต่อกันได้
- UI Test ตรวจเส้นทางสำคัญแบบผู้ใช้จริง

ถ้าต้องตรวจสูตรส่วนลด 50 แบบ ไม่จำเป็นต้องเปิด Chrome 50 รอบ เราทดสอบสูตรด้วย Unit Test แล้วเหลือ UI Test เพียงไม่กี่กรณีเพื่อยืนยันว่าหน้าเว็บเชื่อมกับระบบถูกต้อง

Selenium จึงเป็นหนึ่งชิ้นในกล่องเครื่องมือ ไม่ใช่ค้อนวิเศษที่ทำให้ทุกปัญหากลายเป็นตะปู

---

## 17. สิ่งที่ Automation ควรทำ และสิ่งที่คนยังทำได้ดีกว่า

เหมาะกับ Automation:

- Regression ของเส้นทางสำคัญ
- Login, Checkout, Submit Form
- ทดสอบข้อมูลหลายชุด
- Smoke Test หลัง Deploy
- ตรวจหลาย Browser ตามแผน

เหมาะกับคน:

- Exploratory Testing
- ประเมินความเข้าใจง่ายและความรู้สึก
- มองหาความเสี่ยงที่ยังไม่มีใครเขียนเป็น Test Case
- ตรวจดีไซน์ใหม่ที่เปลี่ยนเร็ว
- ตัดสินกรณีคลุมเครือหรือมีบริบทสูง

ทีมที่ดีไม่ได้แข่งกันว่าคนหรือหุ่นยนต์ใครเหนือกว่า แต่แบ่งงานให้ตรงกับจุดแข็ง คนเป็นนักสืบและนักออกแบบการทดลอง ส่วน Automation เป็นผู้ช่วยที่จำขั้นตอนได้เป๊ะและไม่มีวันบ่นว่าต้องกรอกฟอร์มรอบที่ 317

---

## 18. เช็กลิสต์ก่อนบอกว่า Test พร้อมใช้งาน

- Test มีชื่อบอกพฤติกรรมชัดเจน
- มี Arrange/Given, Act/When และ Assert/Then
- Locator อ่านง่ายและเสถียร
- ใช้ Explicit Wait กับสิ่งที่โหลดแบบไม่พร้อมกัน
- มี Assertion ที่ตรวจผลลัพธ์จริง
- แต่ละ Test รันแยกได้เท่าที่เป็นไปได้
- ปิด Browser แม้เกิด Error
- เก็บ Screenshot หรือ Log เมื่อพัง
- ไม่ใส่ Secret หรือข้อมูลจริงใน Source Code
- ไม่พยายามหลบ CAPTCHA หรือข้อจำกัดของบริการ
- ใช้เว็บหรือบัญชีที่ได้รับอนุญาตให้ทดสอบ
- รู้ว่า Test นี้ควรเป็น UI Test จริงหรือย้ายลงไป API/Unit ได้

---

## สรุป: Automated Test ที่ดีไม่ใช่แค่คลิกเร็ว แต่ต้องตัดสินถูก

Selenium ทำให้ Python ควบคุมเบราว์เซอร์ได้ เราใช้ Locator หา Element ใช้ `click()` และ `send_keys()` จำลองการกระทำ ใช้ Wait รอหน้าเว็บอย่างฉลาด และใช้ Assertion ตัดสินว่าผลลัพธ์ตรงกับที่ระบบสัญญาไว้หรือไม่

ความต่างระหว่าง Script สาธิตกับ Test ที่ไว้ใจได้อยู่ตรงการออกแบบ:

```text
เปิดเว็บได้ + คลิกได้                = Automation
มีเงื่อนไขคาดหวัง + ตรวจผลชัดเจน    = Automated Test
รันซ้ำเสถียร + แกะรอยเมื่อพังได้     = Test ที่ทีมกล้าพึ่งพา
```

เริ่มจากเส้นทางสั้น ๆ เช่น Login หรือ Form หนึ่งหน้า ทำให้มันอ่านง่าย รออย่างถูกวิธี และพังแล้วบอกสาเหตุได้ จากนั้นค่อยขยายชุด Test

เพราะหุ่นยนต์ทดสอบที่มีประโยชน์ที่สุด ไม่ใช่ตัวที่คลิกเมาส์เร็วกว่าคน แต่เป็นตัวที่เฝ้าประตูให้ทั้งทีม และร้องเตือนได้ถูกเวลาว่า “ของชิ้นนี้เคยใช้ได้ แต่ตอนนี้มันพังแล้วนะ”
