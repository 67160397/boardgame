# บันทึกผลการทดสอบ Failure Scenario (External API Integration)

## 1. การกำหนดค่าระบบ Resilience (Axios Options)
- **Timeout:** 2,000 ms (2 วินาที)
- **Retry Attempt:** 2 ครั้ง (รวมเรียกครั้งแรกเป็น 3 ครั้ง)
- **Retry Delay:** 1,000 ms (1 วินาที)
- **Fallback Value:** `{ THB: 35.5, USD: 1.0 }`

---

## 2. สถานการณ์การทดสอบ (Test Scenarios)

### Scenario A: สภาวะปกติ (Normal Case - API Online)
- **วิธีทดสอบ:** เรียก GET `http://localhost:3000/api/exchange-rate` ขณะเชื่อมต่ออินเทอร์เน็ตปกติ
- **ผลการทำงาน:** ระบบดึงข้อมูลจาก API ภายนอกสำเร็จในครั้งแรก (Attempt 1/3)
- **Response Status:** `200 OK`
- **Response Body:** `source: "external_api"` พร้อมค่าอัตราแลกเปลี่ยนจริง (`thb_rate`)

### Scenario B: จำลอง API ล้มเหลว/ตัดเน็ต (Failure Scenario - Retry & Fallback)
- **วิธีทดสอบ:** ปิดการเชื่อมต่ออินเทอร์เน็ตเพื่อจำลอง Network Timeout
- **ผลการทำงาน (Console Log):**
  ```text
  [External API] Calling exchange rate API (Attempt 1/3)...
  [External API] Attempt 1 failed: timeout of 2000ms exceeded
  [External API] Waiting 1000ms before retry...
  [External API] Calling exchange rate API (Attempt 2/3)...
  [External API] Attempt 2 failed: timeout of 2000ms exceeded
  [External API] Waiting 1000ms before retry...
  [External API] Calling exchange rate API (Attempt 3/3)...
  [External API] Attempt 3 failed: timeout of 2000ms exceeded
  [External API] All attempts failed. Activating Fallback mechanism.