const driver = require('../config/db');

// ==========================================
// 1. ดึงโปรเจกต์ทั้งหมด (เวอร์ชันอัปเกรด มีสมาชิกทีม)
// ==========================================
exports.getAllProjects = async (req, res) => {
  const session = driver.session();
  try {
    const query = `
      MATCH (u:User)-[:OWNS_PROJECT]->(p:Project)
      OPTIONAL MATCH (m:User)-[:MEMBER_OF]->(p)
      RETURN p.projectId AS id, 
             p.title AS title, 
             p.description AS description, 
             p.status AS status, 
             p.skills AS skills,
             p.maxMembers AS maxMembers,
             u.name AS owner, 
             collect(m.name) AS members
    `;
    const result = await session.run(query);
    const projects = result.records.map(record => ({
      id: record.get('id'),
      title: record.get('title'),
      description: record.get('description'),
      status: record.get('status'),
      skills: record.get('skills') || [],
      maxMembers: record.get('maxMembers') ? (record.get('maxMembers').toNumber ? record.get('maxMembers').toNumber() : record.get('maxMembers')) : 0,
      owner: record.get('owner'),
      members: record.get('members')
    }));
    res.json(projects);
  } catch (error) { 
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' }); 
  } finally { 
    await session.close(); 
  }
};

// ==========================================
// 2. สร้างโปรเจกต์
// ==========================================
exports.createProject = async (req, res) => {
  const { title, description, skills, maxMembers } = req.body;
  if (!title) return res.status(400).json({ error: 'กรุณาตั้งชื่อโปรเจกต์' });
  const session = driver.session();
  try {
    const query = `
      MATCH (u:User {userId: $userId}) 
      CREATE (p:Project {
        projectId: randomUUID(), 
        title: $title, 
        description: $description, 
        skills: $skills,
        maxMembers: toInteger($maxMembers),
        status: 'Recruiting'
      }) 
      CREATE (u)-[:OWNS_PROJECT]->(p) RETURN p`;
    await session.run(query, { 
      userId: req.user.userId, 
      title, 
      description,
      skills: skills || [],
      maxMembers: parseInt(maxMembers) || 0
    });
    res.status(201).json({ message: 'สร้างโปรเจกต์สำเร็จ' });
  } catch (error) { res.status(500).json({ error: 'สร้างไม่สำเร็จ' }); } finally { await session.close(); }
};

// ==========================================
// 3. แก้ไขโปรเจกต์
// ==========================================
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

// ==========================================
// 4. ลบโปรเจกต์
// ==========================================
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

// ==========================================
// 5. ขอเข้าร่วมทีม (Join Project)
// ==========================================
exports.joinProject = async (req, res) => {
    const projectId = req.params.id; 
    const userId = req.user.userId;  
    const session = driver.session();
    try {
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
        res.status(500).json({ error: 'ไม่สามารถส่งคำขอเข้าร่วมทีมได้' });
    } finally {
        await session.close();
    }
};

// ==========================================
// 6. ดึงรายชื่อผู้สมัคร (Get Applicants) *** อันนี้แหละที่หายไป! ***
// ==========================================
exports.getApplicants = async (req, res) => {
    const projectId = req.params.id;
    const session = driver.session();
    try {
        const query = `
            MATCH (u:User)-[:APPLIED_TO]->(p:Project {projectId: $projectId})
            RETURN u.userId AS userId, u.name AS name
        `;
        const result = await session.run(query, { projectId });
        const applicants = result.records.map(record => ({
            userId: record.get('userId'),
            name: record.get('name')
        }));
        res.status(200).json(applicants);
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผู้สมัครได้' });
    } finally {
        await session.close();
    }
};

// ==========================================
// 7. รับเข้าทีม (Accept Applicant)
// ==========================================
exports.acceptApplicant = async (req, res) => {
    const projectId = req.params.id;
    const { applicantId } = req.body;
    const session = driver.session();

    try {
        // 1. รับคนเข้าทีม และลบเส้นคำขอ
        const acceptQuery = `
            MATCH (u:User {userId: $applicantId})-[r:APPLIED_TO]->(p:Project {projectId: $projectId})
            DELETE r
            MERGE (u)-[:MEMBER_OF]->(p)
            RETURN p
        `;
        const result = await session.run(acceptQuery, { applicantId, projectId });
        
        if (result.records.length === 0) {
            return res.status(404).json({ error: 'ไม่พบคำขอ หรือเกิดข้อผิดพลาด' });
        }

        // 2. Auto-Close: เช็กจำนวนคนว่าเต็มหรือยัง
        const checkFullQuery = `
            MATCH (p:Project {projectId: $projectId})
            OPTIONAL MATCH (m:User)-[:MEMBER_OF]->(p)
            WITH p, count(m) AS currentMembers
            WHERE p.maxMembers IS NOT NULL AND currentMembers >= p.maxMembers
            SET p.status = 'Full'
            RETURN p
        `;
        await session.run(checkFullQuery, { projectId });

        res.status(200).json({ message: 'รับเข้าทีมสำเร็จ!' });
    } catch (error) {
        console.error('Accept Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการรับเข้าทีม' });
    } finally {
        await session.close();
    }
};

// ==========================================
// 8. ปฏิเสธคำขอ (Reject Applicant)
// ==========================================
exports.rejectApplicant = async (req, res) => {
    const projectId = req.params.id;
    const { applicantId } = req.body;
    const session = driver.session();
    try {
        const query = `
            MATCH (u:User {userId: $applicantId})-[r:APPLIED_TO]->(p:Project {projectId: $projectId})
            DELETE r
        `;
        await session.run(query, { applicantId, projectId });
        res.status(200).json({ message: 'ปฏิเสธคำขอสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ' });
    } finally {
        await session.close();
    }
};

// ==========================================
// 9. ออกจากทีม (Leave Project)
// ==========================================
exports.leaveProject = async (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.userId; // ไอดีของคนที่ล็อกอินและกดปุ่มออก
    const session = driver.session();

    try {
        // หาเส้น MEMBER_OF ที่เชื่อมระหว่างคนกดกับโปรเจกต์ แล้วตัดมันทิ้งซะ!
        const query = `
            MATCH (u:User {userId: $userId})-[r:MEMBER_OF]->(p:Project {projectId: $projectId})
            DELETE r
        `;
        await session.run(query, { userId, projectId });
        res.status(200).json({ message: 'ออกจากทีมเรียบร้อย' });
    } catch (error) {
        console.error('Leave Team Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการออกจากทีม' });
    } finally {
        await session.close();
    }
};

// ==========================================
// 10. ปิดรับสมัคร (Close Recruitment)
// ==========================================
exports.closeRecruitment = async (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.userId; // ต้องเอา ID เจ้าของมาเช็ก เพื่อป้องกันคนอื่นแอบมากดปิด
    const session = driver.session();

    try {
        // MATCH หาโปรเจกต์ที่เราเป็นเจ้าของ แล้ว SET status ให้กลายเป็น 'Full'
        const query = `
            MATCH (u:User {userId: $userId})-[:OWNS_PROJECT]->(p:Project {projectId: $projectId})
            SET p.status = 'Full'
            RETURN p
        `;
        const result = await session.run(query, { userId, projectId });

        if (result.records.length === 0) {
            return res.status(403).json({ error: 'ไม่มีสิทธิ์ หรือไม่พบโปรเจกต์' });
        }

        res.status(200).json({ message: 'ปิดรับสมัครเรียบร้อยแล้ว!' });
    } catch (error) {
        console.error('Close Recruitment Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการปิดรับสมัคร' });
    } finally {
        await session.close();
    }
};

// ==========================================
// 11. เตะสมาชิกออกจากทีม (Kick Member)
// ==========================================
exports.kickMember = async (req, res) => {
    const projectId = req.params.id;
    const { memberName } = req.body; // รับ "ชื่อ" ของคนที่จะเตะมา
    const session = driver.session();

    try {
        // หาความสัมพันธ์ MEMBER_OF ระหว่างคนที่ชื่อตรงกัน กับ โปรเจกต์นี้ แล้วลบทิ้ง!
        const query = `
            MATCH (u:User {name: $memberName})-[r:MEMBER_OF]->(p:Project {projectId: $projectId})
            DELETE r
        `;
        await session.run(query, { memberName, projectId });
        res.status(200).json({ message: 'เตะออกจากทีมเรียบร้อย' });
    } catch (error) {
        console.error('Kick Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเตะสมาชิก' });
    } finally {
        await session.close();
    }
};

// ==========================================
// 12. ดึงข้อมูลงานของฉัน (My Tasks)
// ==========================================
exports.getMyTasks = async (req, res) => {
    const userId = req.user.userId;
    const session = driver.session();
    try {
        // หางานที่รอตอบรับ
        const appliedQuery = `
            MATCH (u:User {userId: $userId})-[r:APPLIED_TO]->(p:Project)
            OPTIONAL MATCH (owner:User)-[:OWNS_PROJECT]->(p)
            OPTIONAL MATCH (m:User)-[:MEMBER_OF]->(p)
            RETURN p.projectId AS id, p.title AS title, p.description AS description, p.status AS status,
                   p.skills AS skills, p.maxMembers AS maxMembers, owner.name AS owner, collect(m.name) AS members
        `;
        const appliedResult = await session.run(appliedQuery, { userId });
        const appliedProjects = appliedResult.records.map(record => ({
            id: record.get('id'),
            title: record.get('title'),
            description: record.get('description'),
            status: record.get('status'),
            skills: record.get('skills') || [],
            maxMembers: record.get('maxMembers') ? (record.get('maxMembers').toNumber ? record.get('maxMembers').toNumber() : record.get('maxMembers')) : 0,
            owner: record.get('owner'),
            members: record.get('members')
        }));

        // หางานที่กำลังทำ (เป็นสมาชิก)
        const memberQuery = `
            MATCH (u:User {userId: $userId})-[:MEMBER_OF]->(p:Project)
            OPTIONAL MATCH (owner:User)-[:OWNS_PROJECT]->(p)
            OPTIONAL MATCH (m:User)-[:MEMBER_OF]->(p)
            RETURN p.projectId AS id, p.title AS title, p.description AS description, p.status AS status,
                   p.skills AS skills, p.maxMembers AS maxMembers, owner.name AS owner, collect(m.name) AS members
        `;
        const memberResult = await session.run(memberQuery, { userId });
        const memberProjects = memberResult.records.map(record => ({
            id: record.get('id'),
            title: record.get('title'),
            description: record.get('description'),
            status: record.get('status'),
            skills: record.get('skills') || [],
            maxMembers: record.get('maxMembers') ? (record.get('maxMembers').toNumber ? record.get('maxMembers').toNumber() : record.get('maxMembers')) : 0,
            owner: record.get('owner'),
            members: record.get('members')
        }));

        res.json({ appliedProjects, memberProjects });
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลงานของฉันได้' });
    } finally {
        await session.close();
    }
};

// ==========================================
// 13. ยกเลิกการสมัคร (Cancel Application)
// ==========================================
exports.cancelApplication = async (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.userId;
    const session = driver.session();
    try {
        const query = `
            MATCH (u:User {userId: $userId})-[r:APPLIED_TO]->(p:Project {projectId: $projectId})
            DELETE r
        `;
        await session.run(query, { userId, projectId });
        res.status(200).json({ message: 'ยกเลิกการสมัครเรียบร้อยแล้ว' });
    } catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการยกเลิกการสมัคร' });
    } finally {
        await session.close();
    }
};

// ==========================================
// ระบบแนะนำโปรเจกต์ (Smart Matching)
// ==========================================
exports.getRecommendedProjects = async (req, res) => {
    const userId = req.user.userId;
    const session = driver.session();

    try {
        // Cypher อัจฉริยะ: ดึงสกิล User มาเทียบกับสกิล Project แล้วนับจำนวนที่ตรงกัน (Match Score)
        const query = `
            MATCH (u:User {userId: $userId})
            MATCH (p:Project {status: 'Recruiting'})
            WHERE NOT (u)-[:OWNS_PROJECT]->(p) AND NOT (u)-[:MEMBER_OF]->(p)
            
            // หาจุดร่วมของ Skills
            WITH p, u, 
                 [skill IN p.skills WHERE skill IN u.skills] AS matchedSkills
                 
            // คำนวณคะแนน (ยิ่งสกิลตรงกันเยอะ คะแนนยิ่งสูง)
            WITH p, size(matchedSkills) AS matchScore
            WHERE matchScore > 0 // เอาเฉพาะงานที่มีสกิลตรงอย่างน้อย 1 อย่าง
            
            // ดึงเจ้าของและสมาชิกมาด้วย
            MATCH (owner:User)-[:OWNS_PROJECT]->(p)
            OPTIONAL MATCH (m:User)-[:MEMBER_OF]->(p)
            
            RETURN p.projectId AS id, 
                   p.title AS title, 
                   p.description AS description, 
                   p.status AS status,
                   p.skills AS skills,
                   p.maxMembers AS maxMembers,
                   owner.name AS owner, 
                   collect(m.name) AS members,
                   matchScore
            ORDER BY matchScore DESC
            LIMIT 5
        `;
        const result = await session.run(query, { userId });
        
        const projects = result.records.map(record => ({
            id: record.get('id'),
            title: record.get('title'),
            description: record.get('description'),
            status: record.get('status'),
            skills: record.get('skills') || [],
            maxMembers: record.get('maxMembers') || 0,
            owner: record.get('owner'),
            members: record.get('members'),
            matchScore: record.get('matchScore')
        }));
        
        res.json(projects);
    } catch (error) {
        console.error('Smart Match Error:', error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลแนะนำได้' });
    } finally {
        await session.close();
    }
};