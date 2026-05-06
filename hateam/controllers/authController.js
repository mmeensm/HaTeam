const driver = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' });

  const session = driver.session();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `CREATE (u:User { userId: randomUUID(), name: $name, email: $email, password: $password }) RETURN u.name AS name`;
    const result = await session.run(query, { name, email, password: hashedPassword });
    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ!', user: result.records[0].get('name') });
  } catch (error) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด หรืออีเมลนี้มีในระบบแล้ว' });
  } finally {
    await session.close();
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const session = driver.session();
  try {
    const query = `MATCH (u:User {email: $email}) RETURN u`;
    const result = await session.run(query, { email });
    if (result.records.length === 0) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const user = result.records[0].get('u').properties;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const token = jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ 
        message: 'เข้าสู่ระบบสำเร็จ', 
        token,
        name: user.name // <--- เพิ่มบรรทัดนี้เข้าไปครับ
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  } finally {
    await session.close();
  }
};