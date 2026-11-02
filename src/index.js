import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

import db from '../db.js'; 
import { getExchangeRate } from './services/external-api.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';

// --- ตั้งค่า Multer สำหรับอัปโหลดรูปภาพ ---
const uploadDir = path.join(__dirname, '../frontend/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(uploadDir)); // ให้สามารถเปิดดูไฟล์รูปที่อัปโหลดได้

// --- Middlewares ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'สิทธิ์ไม่ถูกต้อง (สำหรับ Admin เท่านั้น)' });
  }
  next();
}

// Swagger UI
const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- 🔐 AUTH ENDPOINTS ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")',
      [name, email, hashedPassword]
    );

    res.status(201).json({ success: true, message: 'สมัครสมาชิกสำเร็จ!', userId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const tokenPayload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error: error.message });
  }
});

// --- 📁 FILE UPLOAD ENDPOINT ---
app.post('/api/upload', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์รูปภาพ' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});

// --- 🎲 BOARDGAME ENDPOINTS ---
app.get('/api/boardgames', async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id, b.title, b.description, b.price, b.min_players, b.max_players, b.play_time_minutes, b.image_url,
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
        COUNT(r.id) AS total_reviews
      FROM boardgames b
      LEFT JOIN reviews r ON b.id = r.boardgame_id
      GROUP BY b.id
      ORDER BY b.id DESC;
    `;
    const [rows] = await db.query(query);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database query failed', error: error.message });
  }
});

app.post('/api/boardgames', authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, price, min_players, max_players, play_time_minutes, image_url } = req.body;
  if (!title || price === undefined || !min_players || !max_players) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
  }

  try {
    const query = `
      INSERT INTO boardgames (title, description, price, min_players, max_players, play_time_minutes, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      title, description || '', price, min_players, max_players, play_time_minutes || 60,
      image_url || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500'
    ]);
    res.status(201).json({ success: true, message: 'เพิ่มบอร์ดเกมสำเร็จ', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to insert boardgame', error: error.message });
  }
});

app.put('/api/boardgames/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, price, min_players, max_players, play_time_minutes, image_url } = req.body;

  try {
    const query = `
      UPDATE boardgames 
      SET title = ?, description = ?, price = ?, min_players = ?, max_players = ?, play_time_minutes = ?, image_url = ?
      WHERE id = ?
    `;
    const [result] = await db.query(query, [title, description, price, min_players, max_players, play_time_minutes, image_url, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลบอร์ดเกมที่ต้องการแก้ไข' });
    }

    res.json({ success: true, message: 'อัปเดตข้อมูลและรูปภาพสำเร็จ' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update boardgame', error: error.message });
  }
});

app.delete('/api/boardgames/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM boardgames WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลบอร์ดเกมที่ต้องการลบ' });
    }
    res.json({ success: true, message: 'ลบบอร์ดเกมเรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete boardgame', error: error.message });
  }
});

// --- ⭐ REVIEWS ENDPOINTS ---
app.get('/api/boardgames/:id/reviews', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.boardgame_id = ?
      ORDER BY r.created_at DESC;
    `;
    const [reviews] = await db.query(query, [id]);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
});

app.post('/api/boardgames/:id/reviews', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'กรุณาให้คะแนนดาวระหว่าง 1 ถึง 5' });
  }

  try {
    const query = 'INSERT INTO reviews (boardgame_id, user_id, rating, comment) VALUES (?, ?, ?, ?)';
    await db.query(query, [id, userId, rating, comment || '']);
    res.status(201).json({ success: true, message: 'ส่งรีวิวเรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add review', error: error.message });
  }
});

// --- 🛒 ORDERS ENDPOINT ---
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { items, total_amount } = req.body;
  const userId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'ตะกร้าสินค้าว่างเปล่า' });
  }

  try {
    const [orderResult] = await db.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, "completed")',
      [userId, total_amount]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, boardgame_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price]
      );
    }

    res.status(201).json({ success: true, message: 'ชำระเงินและสั่งซื้อสินค้าสำเร็จ!', orderId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสั่งซื้อ', error: error.message });
  }
});

// --- 🎛️ EXTERNAL API ---
app.get('/api/exchange-rate', async (req, res) => {
  try {
    const result = await getExchangeRate();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unexpected server error', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;