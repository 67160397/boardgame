-- เพิ่มข้อมูลผู้ใช้ตัวอย่าง (รหัสผ่านคือ: 123456)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@boardgame.com', '$2b$10$vI8aWBnW3fID.ZQ4/pG7O.xR5A6l3Cq4O6d4H8k9L0M1N2O3P4Q5R', 'admin'),
('John Doe', 'john@gmail.com', '$2b$10$vI8aWBnW3fID.ZQ4/pG7O.xR5A6l3Cq4O6d4H8k9L0M1N2O3P4Q5R', 'user');

-- เพิ่มข้อมูลบอร์ดเกมตัวอย่าง (ระบุราคาเป็น THB)
INSERT INTO boardgames (title, description, price, min_players, max_players, play_time_minutes, image_url) VALUES
('Catan', 'เกมสร้างเมืองและแลกเปลี่ยนทรัพยากรยอดฮิตระดับโลก', 1650.00, 3, 4, 75, 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500'),
('Splendor', 'เกมสะสมอัญมณีเพื่อชิงไหวพริบและสร้างคะแนนเกียรติยศ', 1250.00, 2, 4, 30, 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=500'),
('Codenames', 'เกมถอดรหัสคำพูดสุดสนุกสำหรับสายปาร์ตี้', 790.00, 2, 8, 15, 'https://images.unsplash.com/photo-1563941433-b6a0946f79d8?w=500');

-- เพิ่มรีวิวตัวอย่าง
INSERT INTO reviews (boardgame_id, user_id, rating, comment) VALUES
(1, 2, 5, 'เกมสนุกมากครับ เล่นกับเพื่อนได้ยาวๆ วางแผนเพลิน'),
(2, 2, 4, 'เล่นง่าย เข้าใจเร็ว เหมาะกับชวนคนพึ่งเริ่มเล่นบอร์ดเกม');