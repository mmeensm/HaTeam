// ดึงส่วนต่างๆ ของหน้าจอมาเก็บไว้ในตัวแปร
const authForm = document.getElementById('auth-form');
const toggleModeText = document.getElementById('toggle-mode');
const nameField = document.getElementById('name-field');
const submitBtn = document.getElementById('submit-btn');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

let isLogin = true; // ตั้งสถานะเริ่มต้นให้เป็นหน้า "เข้าสู่ระบบ"
let allProjects = []; // เก็บโปรเจกต์ทั้งหมดไว้ใช้ใน Modal

// --- ระบบ Navigation Bar ---
const navHome = document.getElementById('nav-home');
const navMyTasks = document.getElementById('nav-mytasks');
const navProfile = document.getElementById('nav-profile');
const sectionHome = document.getElementById('home-section');
const sectionMyTasks = document.getElementById('mytasks-section');
const sectionProfile = document.getElementById('profile-section');

function switchTab(tab) {
    if(!navHome) return;
    navHome.classList.remove('active');
    navMyTasks.classList.remove('active');
    navProfile.classList.remove('active');
    sectionHome.style.display = 'none';
    sectionMyTasks.style.display = 'none';
    sectionProfile.style.display = 'none';
    
    if (tab === 'home') {
        navHome.classList.add('active');
        sectionHome.style.display = 'block';
        fetchProjects();
        fetchRecommendedProjects(); 
    } else if (tab === 'mytasks') {
        navMyTasks.classList.add('active');
        sectionMyTasks.style.display = 'block';
        fetchMyTasks();
    } else if (tab === 'profile') {
        navProfile.classList.add('active');
        sectionProfile.style.display = 'block';
        fetchProfile();
    }
}

if(navHome) navHome.addEventListener('click', (e) => { e.preventDefault(); switchTab('home'); });
if(navMyTasks) navMyTasks.addEventListener('click', (e) => { e.preventDefault(); switchTab('mytasks'); });
if(navProfile) navProfile.addEventListener('click', (e) => { e.preventDefault(); switchTab('profile'); });

// 1. ระบบสลับหน้า Login / Register
toggleModeText.addEventListener('click', () => {
    isLogin = !isLogin; // สลับสถานะ

    if (isLogin) {
        // ถ้าเป็นโหมด Login: ซ่อนช่องกรอกชื่อ
        nameField.style.display = 'none';
        nameInput.removeAttribute('required');
        submitBtn.innerText = 'เข้าสู่ระบบ';
        toggleModeText.innerHTML = 'ยังไม่มีบัญชีใช่ไหม? <span>สมัครสมาชิกที่นี่</span>';
    } else {
        // ถ้าเป็นโหมด Register: แสดงช่องกรอกชื่อ
        nameField.style.display = 'block';
        nameInput.setAttribute('required', 'true');
        submitBtn.innerText = 'สมัครสมาชิก';
        toggleModeText.innerHTML = 'มีบัญชีอยู่แล้ว? <span>เข้าสู่ระบบที่นี่</span>';
    }
});

// 2. ระบบส่งข้อมูลไปหา Backend เมื่อกดปุ่มฟอร์ม
authForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บรีเฟรชตัวเองตอนกดปุ่ม

    // ดึงค่าที่ผู้ใช้พิมพ์มา
    const email = emailInput.value;
    const password = passwordInput.value;
    const name = nameInput.value;

    // เลือก URL ว่าจะส่งไป API สมัครสมาชิก หรือ API เข้าสู่ระบบ
    // (อ้างอิงตามโครงสร้าง MVC ที่เราแยกโฟลเดอร์ไว้)
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const url = `http://localhost:5000${endpoint}`;

    // จัดเตรียมแพ็กเกจข้อมูล
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
        // ใช้คำสั่ง fetch เพื่อยิงข้อมูลไปหาเซิร์ฟเวอร์
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log("แอบดูข้อมูลจาก Backend ตอนล็อกอิน:", data);

        if (response.ok) {
            if (isLogin) {
                alert('เข้าสู่ระบบสำเร็จ!');
                localStorage.setItem('token', data.token);
                localStorage.setItem('currentUserName', data.name);
                
                document.getElementById('auth-section').style.display = 'none';
                document.getElementById('dashboard-section').style.display = 'block';
                switchTab('home');
            } else {
                alert('สมัครสมาชิกสำเร็จ! ลองเข้าสู่ระบบด้วยรหัสที่เพิ่งสมัครดูนะ');
                toggleModeText.click(); // สลับกลับมาหน้า Login ให้อัตโนมัติ
                passwordInput.value = ''; // เคลียร์ช่องรหัสผ่าน
            }
        } else {
            // ถ้าพ่น Error กลับมา (เช่น รหัสผิด, อีเมลซ้ำ)
            alert(`แจ้งเตือน: ${data.error}`);
        }
    } catch (error) {
        alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ครับ เช็กหน่อยว่าเปิด Backend (npm run dev) ไว้หรือยัง?');
    }
});

// ==========================================
// 3. ระบบออกจากระบบ (Logout)
// ==========================================
const logoutBtn = document.getElementById('logout-btn');

logoutBtn.addEventListener('click', () => {
    // ลบ Token กุญแจยืนยันตัวตนออกจากเบราว์เซอร์
    localStorage.removeItem('token');
    
    // ซ่อนหน้า Dashboard และโชว์หน้า Login กลับมา
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    
    // เคลียร์ช่องรหัสผ่านเพื่อความปลอดภัย
    passwordInput.value = '';
});

// ==========================================
// 4. ระบบดึงข้อมูลโปรเจกต์มาแสดงที่หน้า Dashboard
// ==========================================
async function fetchProjects() {
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = '<p>กำลังโหลดข้อมูล...</p>';

    try {
        const response = await fetch('http://localhost:5000/api/projects');
        const projects = await response.json();
        allProjects = projects;

        projectList.innerHTML = '';

        if (projects.length === 0) {
            projectList.innerHTML = '<p>ยังไม่มีโปรเจกต์ในระบบเลย มากดสร้างคนแรกกันเถอะ!</p>';
            return;
        }

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.style.cursor = 'pointer';
            card.onclick = () => openProjectDetailModal(project.id);
            
            let skillsHTML = '';
            if (project.skills && project.skills.length > 0) {
                skillsHTML = `<div style="margin-bottom: 10px;">` + 
                    project.skills.map(s => `<span class="skill-tag">${s.trim()}</span>`).join('') + 
                    `</div>`;
            }

            const currentMembersCount = (project.members && project.members[0] !== null) ? project.members.length : 0;
            const maxMembersCount = project.maxMembers || 0;
            const memberStatus = maxMembersCount > 0 ? `${currentMembersCount}/${maxMembersCount}` : `${currentMembersCount}`;
            const isFull = project.status === 'Full';
            
            let statusBadge = isFull 
                ? `<span style="color: white; background: #e74c3c; padding: 2px 8px; border-radius: 10px; font-size: 11px;">เต็มแล้ว</span>` 
                : `<span style="color: white; background: #3498db; padding: 2px 8px; border-radius: 10px; font-size: 11px;">กำลังรับสมัคร</span>`;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h4>${project.title}</h4>
                    ${statusBadge}
                </div>
                <p style="margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${project.description}</p>
                ${skillsHTML}
                <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 10px;">
                    <span class="owner">👑 ${project.owner}</span>
                    <span style="font-size: 12px; color: #7f8c8d; font-weight: bold;">👥 ${memberStatus} คน</span>
                </div>
            `;
            projectList.appendChild(card);
        });
    } catch (error) {
        projectList.innerHTML = '<p style="color: red;">โหลดข้อมูลไม่สำเร็จ กรุณาลองรีเฟรชหน้าเว็บ</p>';
    }
}

// ==========================================
// ระบบ Smart Matching (ดึงโปรเจกต์แนะนำ)
// ==========================================
async function fetchRecommendedProjects() {
    const recommendedSection = document.getElementById('recommended-section');
    const recommendedList = document.getElementById('recommended-list');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:5000/api/projects/recommended', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const projects = await response.json();
            
            // ถ้ามีโปรเจกต์แนะนำ ให้โชว์โซนนี้
            if (projects.length > 0) {
                recommendedSection.style.display = 'block';
                recommendedList.innerHTML = '';

                projects.forEach(project => {
                    // วาดการ์ดแบบเดียวกับหน้าหลัก
                    const card = document.createElement('div');
                    card.className = 'project-card';
                    card.style.cursor = 'pointer';
                    card.style.border = '1px solid #f1c40f'; // เน้นกรอบสีทอง
                    card.onclick = () => openProjectDetailModal(project.id);
                    
                    let skillsHTML = '';
                    if (project.skills && project.skills.length > 0) {
                        skillsHTML = `<div style="margin-bottom: 10px;">` + 
                            project.skills.map(s => `<span class="skill-tag">${s.trim()}</span>`).join('') + 
                            `</div>`;
                    }

                    const currentMembersCount = project.members ? project.members.length : 0;
                    const maxMembersCount = project.maxMembers || 0;
                    const memberStatus = maxMembersCount > 0 ? `${currentMembersCount}/${maxMembersCount}` : `${currentMembersCount}`;

                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h4>${project.title}</h4>
                            <span style="color: white; background: #f39c12; padding: 2px 8px; border-radius: 10px; font-size: 11px;">🔥 แมตช์!</span>
                        </div>
                        <p style="margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${project.description}</p>
                        ${skillsHTML}
                        <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 10px;">
                            <span class="owner">👑 ${project.owner}</span>
                            <span style="font-size: 12px; color: #7f8c8d; font-weight: bold;">👥 ${memberStatus} คน</span>
                        </div>
                    `;
                    // ยัดลงใน Array allProjects ด้วย เพื่อให้เปิด Modal ได้
                    if (!allProjects.find(p => p.id === project.id)) {
                        allProjects.push(project);
                    }
                    
                    recommendedList.appendChild(card);
                });
            } else {
                // ถ้าไม่มีโปรเจกต์ที่ตรงกับสกิลเลย ก็ซ่อนโซนนี้ไป
                recommendedSection.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('ไม่สามารถโหลดโปรเจกต์แนะนำได้', error);
    }
}

// ==========================================
// 5. ระบบสร้างโปรเจกต์ใหม่ (Modal & Create)
// ==========================================
const createModal = document.getElementById('create-modal');
const showCreateBtn = document.getElementById('show-create-btn');
const cancelBtn = document.getElementById('cancel-btn');
const createProjectForm = document.getElementById('create-project-form');

// เมื่อกดปุ่ม "+ สร้างโปรเจกต์ใหม่" ให้โชว์ป๊อปอัป
showCreateBtn.addEventListener('click', () => {
    createModal.style.display = 'flex';
});

// เมื่อกดปุ่ม "ยกเลิก" ให้ซ่อนป๊อปอัปและล้างข้อมูล
cancelBtn.addEventListener('click', () => {
    createModal.style.display = 'none';
    createProjectForm.reset();
});

// เมื่อกด "สร้างโปรเจกต์เลย!"
// เมื่อกด "สร้างโปรเจกต์เลย!"
createProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('project-title').value;
    const description = document.getElementById('project-desc').value;
    const maxMembers = document.getElementById('project-max-members').value;
    
    // 👇 แก้ไขตรงนี้: ดึงข้อมูลสกิลจากตัวแปร Tag
    const skills = currentProjectSkills;
    
    const token = localStorage.getItem('token'); 

    try {
        const response = await fetch('http://localhost:5000/api/projects', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ title, description, skills, maxMembers })
        });

        const data = await response.json();

        if (response.ok) {
            alert('สร้างโปรเจกต์สำเร็จแล้ว!');
            createModal.style.display = 'none';
            createProjectForm.reset();
            
            // 👇 แก้ไขตรงนี้: เคลียร์กล่อง Tag ให้ว่างเปล่าพร้อมสร้างงานถัดไป
            currentProjectSkills = [];
            renderTags(currentProjectSkills, 'project-tags-container', 'project-skill-input', 'project');
            
            fetchProjects();
        } else {
            alert(`แจ้งเตือน: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
});

// ==========================================
// 6. ระบบลบโปรเจกต์ (Delete)
// ==========================================
async function deleteProject(projectId) {
    // ถามย้ำอีกรอบเพื่อความชัวร์ เผื่อผู้ใช้มือลั่น
    if (!confirm('แน่ใจนะว่าต้องการลบโปรเจกต์นี้ทิ้ง?')) return;

    const token = localStorage.getItem('token'); // หยิบกุญแจยืนยันตัวตนมา

    try {
        // ยิงคำสั่ง DELETE ไปหา Backend พร้อมแนบ ID ของโปรเจกต์นั้นไป
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('ลบโปรเจกต์เรียบร้อยแล้ว!');
            fetchProjects(); // สั่งให้รีเฟรชกระดานเพื่ออัปเดตหน้าจอทันที
        } else {
            const data = await response.json();
            alert(`ไม่สามารถลบได้: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

// ==========================================
// 7. ระบบแก้ไขโปรเจกต์ (Edit)
// ==========================================
const editModal = document.getElementById('edit-modal');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editProjectForm = document.getElementById('edit-project-form');

// เมื่อผู้ใช้กดปุ่ม ✏️ แก้ไข ให้เอาข้อมูลเดิมมาใส่ในกล่องไว้รอเลย
function openEditModal(id, title, description) {
    document.getElementById('edit-project-id').value = id;
    document.getElementById('edit-project-title').value = title;
    document.getElementById('edit-project-desc').value = description;
    
    // โชว์ป๊อปอัป
    editModal.style.display = 'flex';
}

// กดปุ่มยกเลิก ให้ซ่อนป๊อปอัป
cancelEditBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});

// เวลากด "บันทึกการแก้ไข"
editProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-project-id').value;
    const title = document.getElementById('edit-project-title').value;
    const description = document.getElementById('edit-project-desc').value;
    const token = localStorage.getItem('token');

    try {
        // ยิงไปหา Backend โดยใช้เมธอด PUT (มาตรฐานการอัปเดตข้อมูล)
        const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description })
        });

        if (response.ok) {
            alert('อัปเดตข้อมูลโปรเจกต์เรียบร้อย!');
            editModal.style.display = 'none'; // ซ่อนป๊อปอัป
            fetchProjects(); // โหลดหน้ากระดานใหม่เพื่อดูความเปลี่ยนแปลง
        } else {
            const data = await response.json();
            alert(`ไม่สามารถแก้ไขได้: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
});

// ==========================================
// 8. ระบบขอเข้าร่วมทีม (Join Project)
// ==========================================
async function joinProject(projectId) {
    if (!confirm('คุณต้องการส่งคำขอเข้าร่วมทีมนี้ใช่หรือไม่?')) return;

    const token = localStorage.getItem('token');

    try {
        // ยิง POST ไปที่ API สำหรับการเข้าร่วมทีม (ตัวอย่าง: /api/projects/:id/join)
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/join`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('ส่งคำขอเข้าร่วมทีมสำเร็จแล้ว! รอหัวหน้าทีมตอบรับนะ ✨');
            fetchProjects(); // รีเฟรชหน้าจอ
        } else {
            alert(`ไม่สามารถเข้าร่วมได้: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

// ==========================================
// 9. ระบบจัดการผู้สมัคร (Manage Applicants)
// ==========================================
const applicantsModal = document.getElementById('applicants-modal');

// ฟังก์ชันปิดป๊อปอัป
function closeApplicantsModal() {
    applicantsModal.style.display = 'none';
}

// ฟังก์ชันเปิดป๊อปอัปและดึงข้อมูลจาก Backend
async function viewApplicants(projectId) {
    applicantsModal.style.display = 'flex';
    const listContainer = document.getElementById('applicants-list');
    listContainer.innerHTML = '<p style="text-align: center;">กำลังโหลดข้อมูล...</p>';

    const token = localStorage.getItem('token');

    try {
        // ยิงไปขอข้อมูลรายชื่อผู้สมัครจาก Backend
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/applicants`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const applicants = await response.json();

            // ถ้ายังไม่มีใครสมัครเลย
            if (applicants.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">ยังไม่มีผู้สมัครในขณะนี้ 😢</p>';
                return;
            }

            // ถ้ามีคนสมัคร ให้ล้างคำว่า "กำลังโหลด..." ทิ้ง แล้วสร้างรายชื่อคนใส่ลงไป
            listContainer.innerHTML = '';
            applicants.forEach(applicant => {
                const item = document.createElement('div');
                item.className = 'applicant-item';
                item.innerHTML = `
                    <span class="applicant-name">👤 ${applicant.name}</span>
                    <div>
                        <button onclick="acceptApplicant('${projectId}', '${applicant.userId}')" class="btn-accept">✅ รับเข้าทีม</button>
                        <button onclick="rejectApplicant('${projectId}', '${applicant.userId}')" class="btn-reject">❌ ปฏิเสธ</button>
                    </div>
                `;
                listContainer.appendChild(item);
            });

        } else {
            listContainer.innerHTML = '<p style="text-align: center; color: red;">โหลดข้อมูลล้มเหลว</p>';
        }
    } catch (error) {
        listContainer.innerHTML = '<p style="text-align: center; color: red;">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</p>';
    }
}

// ==========================================
// 10. ฟังก์ชันกดยอมรับ / ปฏิเสธผู้สมัคร
// ==========================================

// ฟังก์ชัน: รับเข้าทีม
async function acceptApplicant(projectId, applicantId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // ส่ง ID ของคนที่สมัครใส่กล่องพัสดุไปให้ Backend
            body: JSON.stringify({ applicantId }) 
        });

        if (response.ok) {
            alert('รับเพื่อนเข้าทีมเรียบร้อยแล้ว! 🎉');
            // สั่งให้โหลดป๊อปอัปรายชื่อผู้สมัครใหม่อีกรอบ (รายชื่อคนที่เพิ่งรับไปจะได้หายไปจากหน้าจอ)
            viewApplicants(projectId); 
        } else {
            const data = await response.json();
            alert(`ไม่สามารถทำรายการได้: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

// ฟังก์ชัน: ปฏิเสธ
async function rejectApplicant(projectId, applicantId) {
    // ถามย้ำเผื่อกดผิด
    if (!confirm('แน่ใจหรือไม่ที่จะปฏิเสธคำขอนี้?')) return;

    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ applicantId })
        });

        if (response.ok) {
            alert('ปฏิเสธคำขอเรียบร้อยแล้ว ❌');
            viewApplicants(projectId); // รีเฟรชหน้าต่างรายชื่อ
        } else {
            const data = await response.json();
            alert(`ไม่สามารถทำรายการได้: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

// ==========================================
// 11. ฟังก์ชันออกจากทีม (Leave Project)
// ==========================================
async function leaveProject(projectId) {
    if (!confirm('แน่ใจนะว่าต้องการออกจากทีมนี้? 😢')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/leave`, {
            method: 'POST', // หรือ DELETE ก็ได้ แต่เราจะใช้ POST ตามที่เคยตั้งไว้ครับ
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('คุณได้ออกจากทีมเรียบร้อยแล้ว 👋');
            fetchProjects(); // รีเฟรชหน้ากระดาน
        } else {
            const data = await response.json();
            alert(`เกิดข้อผิดพลาด: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

// ==========================================
// 12. ฟังก์ชันปิดรับสมัคร (Close Recruitment)
// ==========================================
async function closeRecruitment(projectId) {
    if (!confirm('ถ้าปิดรับสมัครแล้ว คนอื่นจะขอเข้าร่วมไม่ได้อีก แน่ใจนะ? 🔒')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/close`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('ปิดรับสมัครเรียบร้อยแล้ว! 🛑');
            fetchProjects(); // โหลดกระดานใหม่
        } else {
            const data = await response.json();
            alert(`เกิดข้อผิดพลาด: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

// ==========================================
// 13. ฟังก์ชันเตะสมาชิกออก (Kick Member)
// ==========================================
async function kickMember(projectId, memberName) {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะเตะ "${memberName}" ออกจากทีม? 🥾`)) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/kick`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ memberName }) // ส่งชื่อเป้าหมายไปให้ Backend เชือด!
        });

        if (response.ok) {
            alert(`เตะ ${memberName} ออกจากทีมเรียบร้อยแล้ว!`);
            fetchProjects(); // รีเฟรชหน้ากระดานใหม่ ชื่อคนนั้นจะหายไปทันที
        } else {
            const data = await response.json();
            alert(`เกิดข้อผิดพลาด: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

// ==========================================
// 14. Project Detail Modal (Phase 1)
// ==========================================
let currentDetailProjectId = null;

function closeProjectDetailModal() {
    document.getElementById('project-detail-modal').style.display = 'none';
    currentDetailProjectId = null;
}

async function openProjectDetailModal(projectId) {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return;
    
    currentDetailProjectId = projectId;
    const currentUserName = localStorage.getItem('currentUserName');
    const isOwner = project.owner === currentUserName;
    const isMember = project.members && project.members.includes(currentUserName);
    const isFull = project.status === 'Full';
    
    // Set data
    document.getElementById('detail-title').innerText = project.title;
    document.getElementById('detail-desc').innerText = project.description;
    document.getElementById('detail-owner').innerText = project.owner;
    
    // Skills
    const skillsContainer = document.getElementById('detail-skills');
    if (project.skills && project.skills.length > 0) {
        skillsContainer.innerHTML = project.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
    } else {
        skillsContainer.innerHTML = '<span style="color: #999; font-size: 14px;">ไม่ได้ระบุ</span>';
    }
    
    // Members
    const membersList = document.getElementById('detail-members-list');
    const currentMembersCount = (project.members && project.members[0] !== null) ? project.members.length : 0;
    const maxMembersCount = project.maxMembers || 0;
    document.getElementById('detail-member-count').innerText = maxMembersCount > 0 ? `${currentMembersCount}/${maxMembersCount}` : currentMembersCount;
    
    if (currentMembersCount > 0) {
        membersList.innerHTML = project.members.map(m => {
            if (isOwner) {
                return `<li style="margin-bottom: 8px;">${m} <button onclick="handleKick('${project.id}', '${m}')" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size: 12px;">[เตะออก]</button></li>`;
            }
            return `<li style="margin-bottom: 8px;">${m}</li>`;
        }).join('');
    } else {
        membersList.innerHTML = '<li style="color: #999;">ยังไม่มีสมาชิก</li>';
    }
    
    // Conditional Rendering
    const ownerSection = document.getElementById('owner-actions-section');
    const applicantSection = document.getElementById('applicant-actions-section');
    
    if (isOwner) {
        ownerSection.style.display = 'block';
        applicantSection.style.display = 'none';
        
        document.getElementById('btn-close-recruitment').onclick = async () => { 
            await closeRecruitment(projectId); 
            closeProjectDetailModal(); 
        };
        document.getElementById('btn-delete-project').onclick = async () => { 
            await deleteProject(projectId); 
            closeProjectDetailModal(); 
        };
        
        loadApplicantsForDetail(projectId);
    } else {
        ownerSection.style.display = 'none';
        applicantSection.style.display = 'block';
        
        const btnJoin = document.getElementById('btn-join-project');
        const btnLeave = document.getElementById('btn-leave-project');
        const statusMsg = document.getElementById('applicant-status-msg');
        
        btnJoin.style.display = 'none';
        btnLeave.style.display = 'none';
        statusMsg.style.display = 'none';
        
        if (isMember) {
            btnLeave.style.display = 'inline-block';
            btnLeave.onclick = async () => { 
                await leaveProject(projectId); 
                closeProjectDetailModal(); 
            };
        } else if (isFull) {
            statusMsg.innerText = 'เต็มแล้ว (ปิดรับสมัคร)';
            statusMsg.style.display = 'inline-block';
        } else {
            btnJoin.style.display = 'inline-block';
            btnJoin.onclick = async () => { 
                await joinProject(projectId); 
                statusMsg.innerText = 'รอการตอบรับ...';
                statusMsg.style.display = 'inline-block';
                btnJoin.style.display = 'none';
            };
        }
    }
    
    document.getElementById('project-detail-modal').style.display = 'flex';
}

async function loadApplicantsForDetail(projectId) {
    const listContainer = document.getElementById('detail-applicants-list');
    listContainer.innerHTML = '<p style="color: #7f8c8d;">กำลังโหลด...</p>';
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/applicants`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const applicants = await response.json();
            if (applicants.length === 0) {
                listContainer.innerHTML = '<p style="color: #7f8c8d;">ยังไม่มีผู้สมัครในขณะนี้ 😢</p>';
                return;
            }
            listContainer.innerHTML = '';
            applicants.forEach(applicant => {
                const item = document.createElement('div');
                item.className = 'applicant-item';
                item.style.padding = '8px';
                item.innerHTML = `
                    <span class="applicant-name">👤 ${applicant.name}</span>
                    <div>
                        <button onclick="handleAccept('${projectId}', '${applicant.userId}')" class="btn-accept">✅ รับ</button>
                        <button onclick="handleReject('${projectId}', '${applicant.userId}')" class="btn-reject">❌ ปฏิเสธ</button>
                    </div>
                `;
                listContainer.appendChild(item);
            });
        } else {
            listContainer.innerHTML = '<p style="color: red;">โหลดข้อมูลล้มเหลว</p>';
        }
    } catch (error) {
        listContainer.innerHTML = '<p style="color: red;">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</p>';
    }
}

// Wrapper เพื่อป้องกันการไปเรียก viewApplicants ที่จะเปิด Modal เก่าซ้อน
async function handleAccept(projectId, applicantId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ applicantId }) 
        });
        if (response.ok) {
            alert('รับเพื่อนเข้าทีมเรียบร้อยแล้ว! 🎉');
            await fetchProjects();
            openProjectDetailModal(projectId); // Reload current modal
        } else {
            const data = await response.json();
            alert(`ไม่สามารถทำรายการได้: ${data.error}`);
        }
    } catch (error) { alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'); }
}

async function handleReject(projectId, applicantId) {
    if (!confirm('แน่ใจหรือไม่ที่จะปฏิเสธคำขอนี้?')) return;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ applicantId })
        });
        if (response.ok) {
            alert('ปฏิเสธคำขอเรียบร้อยแล้ว ❌');
            loadApplicantsForDetail(projectId); // Reload applicant list
        } else {
            const data = await response.json();
            alert(`ไม่สามารถทำรายการได้: ${data.error}`);
        }
    } catch (error) { alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'); }
}

async function handleKick(projectId, memberName) {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะเตะ "${memberName}" ออกจากทีม? 🥾`)) return;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/kick`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ memberName }) 
        });
        if (response.ok) {
            alert(`เตะ ${memberName} ออกจากทีมเรียบร้อยแล้ว!`);
            await fetchProjects();
            openProjectDetailModal(projectId); // Reload modal
        } else {
            const data = await response.json();
            alert(`เกิดข้อผิดพลาด: ${data.error}`);
        }
    } catch (error) {
        // ✅ เพิ่มบล็อก catch ตรงนี้ เพื่อดักจับ Error และกันเว็บแครช
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

// ==========================================
// 15. ดึงข้อมูล "งานของฉัน" (My Tasks)
// ==========================================
async function fetchMyTasks() {
    const pendingList = document.getElementById('pending-tasks-list');
    const activeList = document.getElementById('active-tasks-list');
    
    pendingList.innerHTML = '<p>กำลังโหลด...</p>';
    activeList.innerHTML = '<p>กำลังโหลด...</p>';

    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:5000/api/projects/my-tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // รอตอบรับ (Pending)
            if (data.appliedProjects.length === 0) {
                pendingList.innerHTML = '<p style="color: #7f8c8d;">ไม่มีงานที่รอตอบรับ</p>';
            } else {
                pendingList.innerHTML = '';
                data.appliedProjects.forEach(project => {
                    const card = createMiniProjectCard(project);
                    
                    const actionDiv = document.createElement('div');
                    actionDiv.style.marginTop = '15px';
                    actionDiv.style.textAlign = 'right';
                    actionDiv.innerHTML = `<button onclick="cancelApplication('${project.id}')" class="btn-delete" style="float:none;">❌ ยกเลิกการสมัคร</button>`;
                    
                    card.appendChild(actionDiv);
                    pendingList.appendChild(card);
                });
            }

            // งานที่กำลังทำ (Active)
            if (data.memberProjects.length === 0) {
                activeList.innerHTML = '<p style="color: #7f8c8d;">ยังไม่มีงานที่กำลังทำ</p>';
            } else {
                activeList.innerHTML = '';
                data.memberProjects.forEach(project => {
                    const card = createMiniProjectCard(project);
                    
                    const actionDiv = document.createElement('div');
                    actionDiv.style.marginTop = '15px';
                    actionDiv.style.textAlign = 'right';
                    actionDiv.innerHTML = `<button onclick="openProjectDetailModal('${project.id}')" class="btn-main" style="width:auto; padding:8px 15px; font-size:12px;">ดูรายละเอียด / พูดคุย</button>`;
                    
                    card.appendChild(actionDiv);
                    activeList.appendChild(card);
                });
            }
        }
    } catch (error) {
        pendingList.innerHTML = '<p style="color: red;">โหลดไม่สำเร็จ</p>';
        activeList.innerHTML = '<p style="color: red;">โหลดไม่สำเร็จ</p>';
    }
}

function createMiniProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    let skillsHTML = '';
    if (project.skills && project.skills.length > 0) {
        skillsHTML = `<div style="margin-bottom: 10px;">` + 
            project.skills.map(s => `<span class="skill-tag">${s.trim()}</span>`).join('') + 
            `</div>`;
    }

    const currentMembersCount = (project.members && project.members[0] !== null) ? project.members.length : 0;
    const maxMembersCount = project.maxMembers || 0;
    const memberStatus = maxMembersCount > 0 ? `${currentMembersCount}/${maxMembersCount}` : `${currentMembersCount}`;
    const isFull = project.status === 'Full';
    
    let statusBadge = isFull 
        ? `<span style="color: white; background: #e74c3c; padding: 2px 8px; border-radius: 10px; font-size: 11px;">เต็มแล้ว</span>` 
        : `<span style="color: white; background: #3498db; padding: 2px 8px; border-radius: 10px; font-size: 11px;">กำลังรับสมัคร</span>`;

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h4>${project.title}</h4>
            ${statusBadge}
        </div>
        <p style="margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${project.description}</p>
        ${skillsHTML}
        <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 10px;">
            <span class="owner">👑 ${project.owner}</span>
            <span style="font-size: 12px; color: #7f8c8d; font-weight: bold;">👥 ${memberStatus} คน</span>
        </div>
    `;
    return card;
}

// ==========================================
// 16. ยกเลิกการสมัคร (Cancel Application)
// ==========================================
async function cancelApplication(projectId) {
    if (!confirm('แน่ใจหรือไม่ที่จะยกเลิกการสมัครโปรเจกต์นี้?')) return;
    
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/cancel-application`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('ยกเลิกการสมัครเรียบร้อยแล้ว');
            fetchMyTasks(); // รีเฟรชหน้าต่างใหม่
            fetchProjects(); // เผื่อมีการอัปเดตสถานะใน All Projects
        } else {
            const data = await response.json();
            alert(`เกิดข้อผิดพลาด: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

// ==========================================
// 17. โปรไฟล์ (Profile)
// ==========================================
async function fetchProfile() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const profile = await response.json();
            
            document.getElementById('profile-name').value = profile.name;
            document.getElementById('profile-email').value = profile.email;
            document.getElementById('profile-contact').value = profile.contact || '';
            
            // 👇 แก้ไขตรงนี้: ดึงสกิลมาใส่กล่อง Tag
            currentProfileSkills = profile.skills || [];
            renderTags(currentProfileSkills, 'profile-tags-container', 'profile-skill-input', 'profile');
            
            const historyList = document.getElementById('profile-history-list');
            if (profile.history && profile.history.length > 0) {
                historyList.innerHTML = profile.history.map(h => `<li style="margin-bottom: 10px; padding: 10px; background: #f4f7f6; border-radius: 8px;">✅ ${h.title}</li>`).join('');
            } else {
                historyList.innerHTML = '<li style="color: #7f8c8d;">ยังไม่มีประวัติการทำงานเสร็จสิ้น</li>';
            }
        }
    } catch (error) {
        console.error('Fetch Profile Error:', error);
    }
}

document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const contact = document.getElementById('profile-contact').value;
    
    // 👇 แก้ไขตรงนี้: ดึงข้อมูลจากตัวแปร Tag แทนช่อง Input เดิม
    const skills = currentProfileSkills; 
    
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ contact, skills })
        });
        
        if (response.ok) {
            alert('อัปเดตโปรไฟล์เรียบร้อยแล้ว!');
            fetchProfile(); // โหลดใหม่เพื่อความชัวร์
        } else {
            const data = await response.json();
            alert(`ไม่สามารถอัปเดตได้: ${data.error}`);
        }
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
});

// ==========================================
// ระบบ Tag Manager สำหรับจัดการ Skills
// ==========================================
let currentProfileSkills = [];
let currentProjectSkills = [];

// ฟังก์ชันวาด Tag ลงในกล่อง
function renderTags(tagsArray, containerId, inputId, arrayRefName) {
    const container = document.getElementById(containerId);
    // ลบ Tag เก่าออกให้หมดก่อนวาดใหม่ (ยกเว้นช่อง Input)
    const tags = container.querySelectorAll('.skill-tag-item');
    tags.forEach(t => t.remove());

    // วาด Tag ใหม่แทรกไว้หน้าช่อง Input
    const inputField = document.getElementById(inputId);
    
    tagsArray.forEach((skill, index) => {
        const tagEl = document.createElement('div');
        tagEl.className = 'skill-tag-item';
        tagEl.innerHTML = `
            ${skill} 
            <span class="skill-tag-remove" onclick="removeTag('${arrayRefName}', ${index})">×</span>
        `;
        container.insertBefore(tagEl, inputField);
    });
}

// ฟังก์ชันลบ Tag
function removeTag(arrayRefName, index) {
    if (arrayRefName === 'profile') {
        currentProfileSkills.splice(index, 1);
        renderTags(currentProfileSkills, 'profile-tags-container', 'profile-skill-input', 'profile');
    } else if (arrayRefName === 'project') {
        currentProjectSkills.splice(index, 1);
        renderTags(currentProjectSkills, 'project-tags-container', 'project-skill-input', 'project');
    }
}

// ดักจับเวลากด Enter ในช่อง Profile Skills
const profileSkillInput = document.getElementById('profile-skill-input');
if(profileSkillInput) {
    profileSkillInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // กันฟอร์ม submit
            e.stopPropagation();
            const val = this.value.trim();
            if (val) {
                // อนุญาตให้เพิ่มซ้ำได้ หรือถ้าซ้ำให้แจ้งเตือนและเคลียร์
                if (!currentProfileSkills.includes(val)) {
                    currentProfileSkills.push(val);
                    renderTags(currentProfileSkills, 'profile-tags-container', 'profile-skill-input', 'profile');
                }
                this.value = ''; // เคลียร์ช่องพิมพ์เสมอ
            }
        }
    });
}

// ดักจับเวลากด Enter ในช่อง Project Skills
const projectSkillInput = document.getElementById('project-skill-input');
if(projectSkillInput) {
    projectSkillInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            const val = this.value.trim();
            if (val) {
                if (!currentProjectSkills.includes(val)) {
                    currentProjectSkills.push(val);
                    renderTags(currentProjectSkills, 'project-tags-container', 'project-skill-input', 'project');
                }
                this.value = '';
            }
        }
    });
}

// ==========================================
// Session Restore: ถ้ายังมี Token ใน LocalStorage ให้กลับเข้า Dashboard ทันที
// ==========================================
(function restoreSession() {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        switchTab('home');
    }
})();