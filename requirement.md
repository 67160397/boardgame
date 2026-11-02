# Software Requirement Specification (SRS) - Boardgame Store Platform

## 1. ขอบเขตระบบ (Project Scope)
ระบบร้านค้าบอร์ดเกมออนไลน์ (Boardgame Store Platform) เป็นเว็บแอปพลิเคชันรูปแบบ Full-Stack ที่พัฒนาขึ้นเพื่อให้บริการลูกค้าในการเลือกซื้อบอร์ดเกม เขียนรีวิว และแปลงราคาสินค้าตามอัตราแลกเปลี่ยนจริง พร้อมระบบหลังบ้านสำหรับผู้ดูแลระบบ (Admin) ในการจัดการข้อมูลสินค้าและรูปภาพ

## 2. ผู้ใช้งานในระบบ (User Roles)
1. **Guest (ผู้เยี่ยมชม):** สามารถเข้าดูรายการบอร์ดเกม อ่านรีวิว ดูอัตราแลกเปลี่ยนเงิน และเลือกใส่ตะกร้าสินค้าชั่วคราวได้
2. **User (สมาชิก):** สามารถสมัครสมาชิก, เข้าสู่ระบบ, ส่งคำสั่งซื้อสินค้า (Checkout) และเขียนรีวิว/ให้คะแนนดาวบอร์ดเกมได้
3. **Admin (ผู้ดูแลระบบ):** สามารถเพิ่ม แก้ไข ลบ ข้อมูลบอร์ดเกม และอัปโหลดไฟล์รูปภาพสินค้าจากเครื่องขึ้นเซิร์ฟเวอร์ได้

## 3. ความต้องการเชิงฟังก์ชัน (Functional Requirements)

### FR1: User Management & Authentication
- **FR1.1:** ระบบรองรับการสมัครสมาชิกใหม่ด้วย Name, Email, Password
- **FR1.2:** ระบบรองรับการเข้าสู่ระบบ และส่งคืน JSON Web Token (JWT) เพื่อใช้อ้างอิงสิทธิ์
- **FR1.3:** ระบบมีการเข้ารหัสรหัสผ่าน (Password Hashing) ด้วย `bcrypt` ก่อนบันทึกลงฐานข้อมูล

### FR2: Boardgame & Catalog Management
- **FR2.1:** ผู้ใช้ทุกคนสามารถดึงรายการบอร์ดเกมทั้งหมด พร้อมแสดงคะแนนดาวเฉลี่ยและจำนวนรีวิวได้ (`GET /api/boardgames`)
- **FR2.2:** Admin สามารถเพิ่มบอร์ดเกมใหม่ได้ (`POST /api/boardgames`)
- **FR2.3:** Admin สามารถแก้ไขข้อมูลบอร์ดเกมตาม ID ได้ (`PUT /api/boardgames/:id`)
- **FR2.4:** Admin สามารถลบบอร์ดเกมออกจากระบบได้ (`DELETE /api/boardgames/:id`)

### FR3: File Upload & Asset Management
- **FR3.1:** Admin สามารถอัปโหลดไฟล์รูปภาพบอร์ดเกมจากเครื่องท้องถิ่นไปยังเซิร์ฟเวอร์ผ่าน `multer` ได้ (`POST /api/upload`)
- **FR3.2:** ระบบสุ่มตั้งชื่อไฟล์ใหม่ด้วย Timestamp และ Random String เพื่อป้องกันปัญหาชื่อไฟล์ซ้ำกัน

### FR4: Cart & Order Management (E-Commerce Logic)
- **FR4.1:** ผู้ใช้สามารถเลือกสินค้าลงตะกร้า ปรับเพิ่ม/ลดจำนวน และคำนวณราคารวมได้แบบ Real-time
- **FR4.2:** สมาชิกที่เข้าสู่ระบบสามารถยืนยันคำสั่งซื้อ (Checkout) ได้ (`POST /api/orders`)
- **FR4.3:** ระบบทำการบันทึกข้อมูลใบเสร็จลงตาราง `orders` และรายละเอียดสินค้าลงตาราง `order_items` แบบคาสเคด

### FR5: Review & Rating System
- **FR5.1:** ผู้ใช้ทุกคนสามารถอ่านรีวิวของบอร์ดเกมแต่ละชิ้นได้ (`GET /api/boardgames/:id/reviews`)
- **FR5.2:** สมาชิกที่เข้าสู่ระบบสามารถส่งรีวิวและคะแนนดาว (1-5 ดาว) ได้ (`POST /api/boardgames/:id/reviews`)

### FR6: External API Integration & Resilience
- **FR6.1:** ระบบมีการเชื่อมต่อกับ External API เพื่อดึงอัตราแลกเปลี่ยนเงินตรา (`GET /api/exchange-rate`)
- **FR6.2:** มีการตั้งค่า Timeout (2,000ms), Retry Mechanism (3 ครั้ง) และ Fallback Rate (35.5 THB) เมื่อ External API ขัดข้อง

---

## 4. ความต้องการเชิงเทคนิค (Non-Functional Requirements)
- **Security:** ใช้ JWT ร่วมกับ Middleware `authenticateToken` และ `requireAdmin` ในการควบคุม Role-Based Access Control (RBAC)
- **API Documentation:** มี Swagger UI สำหรับทดสอบ API ที่เส้นทาง `/api-docs` ซึ่งสร้างจากไฟล์ `openapi.yaml`
- **Database:** ใช้ฐานข้อมูลเชิงสัมพันธ์ MySQL พร้อมกำหนด Foreign Keys เพื่อความสมบูรณ์ของข้อมูล (Data Integrity)