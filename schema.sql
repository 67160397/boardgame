-- ลบตารางเดิมถ้ามีอยู่ (ลบตามลำดับ Foreign Key)
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS boardgames;
DROP TABLE IF EXISTS users;

-- 1. ตารางเก็บข้อมูลผู้ใช้งาน
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตารางเก็บข้อมูลบอร์ดเกม
CREATE TABLE boardgames (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  min_players INT NOT NULL DEFAULT 1,
  max_players INT NOT NULL DEFAULT 4,
  play_time_minutes INT DEFAULT 60,
  image_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตารางเก็บรีวิวบอร์ดเกม
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  boardgame_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (boardgame_id) REFERENCES boardgames(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);