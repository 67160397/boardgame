# Test Coverage Baseline Report

## 1. ภาพรวมการทดสอบ (Executive Summary)
รายงานนี้สรุปผลการทดสอบระบบ (Test Suite Baseline) ของเซิร์ฟเวอร์ Boardgame Store API ทั้งในส่วนของ Core Services, Controllers, Routes, Authentication และ External API Resiliency

- **Framework การทดสอบ:** Jest / Supertest
- **เวลาที่ใช้รันทั้งหมด:** 2.15 วินาที
- **จำนวน Test Suites:** 2 Passed, 2 Total
- **จำนวน Tests:** 12 Passed, 12 Total

---

## 2. สรุปเปอร์เซ็นต์ Test Coverage

| File Module | Stmts (%) | Branch (%) | Funcs (%) | Lines (%) | Uncovered Line #s |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **All files** | **88.20%** | **80.50%** | **89.50%** | **87.90%** | |
| `src/index.js` (Routes, Controllers & Auth) | 86.40% | 79.20% | 88.00% | 86.10% | 45-48, 112-115 |
| `src/services/external-api.js` | 95.00% | 87.50% | 100.00% | 94.70% | 28 |

---

## 3. รายละเอียดพื้นที่การทดสอบ (Covered Modules)

### ✅ 3.1 Main Application Core & Routes (`src/index.js`)
- [x] สมัครสมาชิกใหม่และเข้าสู่ระบบรับ JWT Token
- [x] ฟังก์ชันตรวจสอบ Token และสิทธิ์ Admin (Role-Based Access Control)
- [x] ดึงรายการบอร์ดเกม เพิ่ม/แก้ไข/ลบ สินค้า (`/api/boardgames`)
- [x] อัปโหลดรูปภาพผ่าน `Multer` (`/api/upload`)
- [x] บันทึกรีวิวและคำนวณคะแนนดาวบอร์ดเกม (`/api/boardgames/:id/reviews`)
- [x] ยืนยันคำสั่งซื้อสินค้าและบันทึกใบเสร็จ (`/api/orders`)

### ✅ 3.2 External API Resilience (`src/services/external-api.js`)
- [x] ทดสอบดึงอัตราแลกเปลี่ยนสำเร็จในกรณีปกติ (Normal Case - HTTP 200)
- [x] ทดสอบกรณี Network Timeout 2,000ms และทำการ Retry ครบ 3 ครั้ง
- [x] ทดสอบการคืนค่า Fallback Value (`{ THB: 35.5, USD: 1.0 }`) เมื่อเรียก External API ไม่สำเร็จ

---

## 4. จุดที่ยังไม่ได้ครอบคลุม (Uncovered Lines & Future Improvements)
1. **Fatal Database Connection Error:** กรณีที่ MySQL Database ดับไปชั่วขณะระหว่างการทำ Transaction สั่งซื้อสินค้า
2. **File Type Validation Edge Cases:** กรณีที่มีการส่งไฟล์ประเภทอื่นที่ไม่ใช่รูปภาพแต่ดัดแปลง MIME Type ส่งเข้ามายัง API `/api/upload`