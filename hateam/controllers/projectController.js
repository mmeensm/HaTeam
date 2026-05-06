const driver = require('../config/db');

exports.getAllProjects = async (req, res) => {
  const session = driver.session();
  try {
    const query = `MATCH (u:User)-[:OWNS_PROJECT]->(p:Project) RETURN p.projectId AS id, p.title AS title, p.description AS description, p.status AS status, u.name AS owner`;
    const result = await session.run(query);
    const projects = result.records.map(record => ({
      id: record.get('id'), title: record.get('title'), description: record.get('description'), status: record.get('status'), owner: record.get('owner')
    }));
    res.json(projects);
  } catch (error) { res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' }); } finally { await session.close(); }
};

exports.createProject = async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'กรุณาตั้งชื่อโปรเจกต์' });
  const session = driver.session();
  try {
    const query = `
      MATCH (u:User {userId: $userId}) 
      CREATE (p:Project {projectId: randomUUID(), title: $title, description: $description, status: 'Recruiting'}) 
      CREATE (u)-[:OWNS_PROJECT]->(p) RETURN p`;
    await session.run(query, { userId: req.user.userId, title, description });
    res.status(201).json({ message: 'สร้างโปรเจกต์สำเร็จ' });
  } catch (error) { res.status(500).json({ error: 'สร้างไม่สำเร็จ' }); } finally { await session.close(); }
};

exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, status } = req.body;
  const session = driver.session();
  try {
    const checkQuery = `MATCH (u:User {userId: $userId})-[:OWNS_PROJECT]->(p:Project {projectId: $projectId}) RETURN p`;
    const checkResult = await session.run(checkQuery, { userId: req.user.userId, projectId });
    if (checkResult.records.length === 0) return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไข' });

    const updateQuery = `MATCH (p:Project {projectId: $projectId}) SET p.title = $title, p.description = $description, p.status = $status RETURN p`;
    await session.run(updateQuery, { projectId, title, description, status });
    res.json({ message: 'อัปเดตเรียบร้อย' });
  } catch (error) { res.status(500).json({ error: 'แก้ไขไม่สำเร็จ' }); } finally { await session.close(); }
};

exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;
  const session = driver.session();
  try {
    const checkQuery = `MATCH (u:User {userId: $userId})-[:OWNS_PROJECT]->(p:Project {projectId: $projectId}) RETURN p`;
    const checkResult = await session.run(checkQuery, { userId: req.user.userId, projectId });
    if (checkResult.records.length === 0) return res.status(403).json({ error: 'ไม่มีสิทธิ์ลบ' });

    await session.run(`MATCH (p:Project {projectId: $projectId}) DETACH DELETE p`, { projectId });
    res.json({ message: 'ลบเรียบร้อย' });
  } catch (error) { res.status(500).json({ error: 'ลบไม่สำเร็จ' }); } finally { await session.close(); }
};

// // ==========================================
// ฟังก์ชัน: ขอเข้าร่วมทีม (Join Project)
// ==========================================
exports.joinProject = async (req, res) => {
    const projectId = req.params.id; 
    const userId = req.user.userId;  

    const session = driver.session();
    try {
        // หา User และ Project ให้เจอ แล้วลากเส้นหากัน
        const query = `
            MATCH (u:User {userId: $userId}) 
            MATCH (p:Project {projectId: $projectId}) 
            MERGE (u)-[r:APPLIED_TO]->(p) 
            RETURN r
        `;

        const result = await session.run(query, { userId, projectId });

        if (result.records.length === 0) {
            return res.status(404).json({ error: 'ไม่พบโปรเจกต์ หรือ เกิดข้อผิดพลาดในการเชื่อมโยง' });
        }

        res.status(200).json({ message: 'ส่งคำขอเข้าร่วมทีมสำเร็จแล้ว! รอหัวหน้าทีมตอบรับนะ ✨' });

    } catch (error) {
        console.error('Join Project Error:', error);
        res.status(500).json({ error: 'ไม่สามารถส่งคำขอเข้าร่วมทีมได้' });
    } finally {
        await session.close();
    }
};