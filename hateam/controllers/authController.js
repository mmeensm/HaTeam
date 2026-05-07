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

exports.getProfile = async (req, res) => {
  const userId = req.user.userId;
  const session = driver.session();
  try {
    const query = `
      MATCH (u:User {userId: $userId})
      OPTIONAL MATCH (u)-[:MEMBER_OF]->(p:Project {status: 'Full'})
      RETURN u.name AS name, u.email AS email, u.skills AS skills, u.contact AS contact,
             collect({id: p.projectId, title: p.title}) AS history
    `;
    const result = await session.run(query, { userId });
    if (result.records.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });

    const record = result.records[0];
    const profile = {
      name: record.get('name'),
      email: record.get('email'),
      skills: record.get('skills') || [],
      contact: record.get('contact') || '',
      history: record.get('history').filter(h => h.id !== null)
    };
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'ดึงข้อมูลโปรไฟล์ไม่สำเร็จ' });
  } finally {
    await session.close();
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user.userId;
  const { skills, contact } = req.body;
  const session = driver.session();
  try {
    const query = `
      MATCH (u:User {userId: $userId})
      SET u.skills = $skills, u.contact = $contact
      RETURN u
    `;
    await session.run(query, { userId, skills: skills || [], contact: contact || '' });
    res.json({ message: 'อัปเดตโปรไฟล์เรียบร้อยแล้ว' });
  } catch (error) {
    res.status(500).json({ error: 'อัปเดตโปรไฟล์ไม่สำเร็จ' });
  } finally {
    await session.close();
  }
};