// ดึงส่วนต่างๆ ของหน้าจอมาเก็บไว้ในตัวแปร
const authForm = document.getElementById('auth-form');
const toggleModeText = document.getElementById('toggle-mode');
const nameField = document.getElementById('name-field');
const submitBtn = document.getElementById('submit-btn');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

let isLogin = true; // ตั้งสถานะเริ่มต้นให้เป็นหน้า "เข้าสู่ระบบ"

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
                
                // -----> เพิ่มบรรทัดนี้ลงไปครับ <-----
                // ดึงชื่อของผู้ใช้ที่เซิร์ฟเวอร์ส่งกลับมา (เช่น data.user.name หรือตามที่ Backend ออกแบบไว้)
                // สมมติว่า Backend ส่งกลับมาในชื่อ data.name นะครับ
                localStorage.setItem('currentUserName', data.name);
                
                document.getElementById('auth-section').style.display = 'none';
                document.getElementById('dashboard-section').style.display = 'flex';
                fetchProjects();
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
    projectList.innerHTML = '<p>กำลังโหลดข้อมูล...</p>'; // โชว์ข้อความตอนกำลังโหลด

    try {
        // ยิงไปหา API ดูโปรเจกต์ทั้งหมดที่เราทำไว้ใน Backend
        const response = await fetch('http://localhost:5000/api/projects');
        const projects = await response.json();

        // เคลียร์ข้อความกำลังโหลดทิ้ง
        projectList.innerHTML = '';

        // ถ้ายังไม่มีโปรเจกต์เลย
        if (projects.length === 0) {
            projectList.innerHTML = '<p>ยังไม่มีโปรเจกต์ในระบบเลย มากดสร้างคนแรกกันเถอะ!</p>';
            return;
        }

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            
            // ดึงชื่อคนที่กำลังล็อกอินอยู่ออกมาเช็ก
            const currentUserName = localStorage.getItem('currentUserName');
            console.log("ชื่อเจ้าของโปรเจกต์:", project.owner, " | ชื่อคนที่ล็อกอินอยู่:", currentUserName);

            // สร้างตัวแปรไว้เก็บปุ่มที่จะโชว์
            const isFull = project.status === 'Full';
            let actionButtons = '';

            if (project.owner === currentUserName) {
                // ถ้าเราเป็นเจ้าของ
                actionButtons = `
                    <button onclick="deleteProject('${project.id}')" class="btn-delete">🗑️ ลบ</button>
                    <button onclick="openEditModal('${project.id}', '${project.title}', '${project.description}')" class="btn-edit">✏️ แก้ไข</button>
                    <button onclick="viewApplicants('${project.id}')" class="btn-edit" style="background-color: #9b59b6;">👀 ดูผู้สมัคร</button>
                `;
                // ถ้ายังไม่เต็ม ให้โชว์ปุ่ม "ปิดรับสมัคร" ด้วย
                if (!isFull) {
                    actionButtons += `<button onclick="closeRecruitment('${project.id}')" class="btn-edit" style="background-color: #34495e;">🔒 ปิดรับสมัคร</button>`;
                }
            } else if (project.members && project.members.includes(currentUserName)) {
                // ถ้าเป็นสมาชิกในทีมแล้ว โชว์ปุ่มออก
                actionButtons = `
                    <button onclick="leaveProject('${project.id}')" class="btn-delete" style="background-color: #e67e22;">👋 ออกจากทีม</button>
                `;
            } else {
                // ถ้าเป็นคนนอก ต้องเช็กก่อนว่าโปรเจกต์เต็มหรือยัง
                if (isFull) {
                    actionButtons = `<span style="color: #e74c3c; font-weight: bold;">🚫 ปิดรับสมัครแล้ว (ทีมเต็ม)</span>`;
                } else {
                    actionButtons = `<button onclick="joinProject('${project.id}')" class="btn-join">🤝 ขอเข้าร่วมทีม</button>`;
                }
            }

            // 👇👇👇 โค้ดใหม่ (Step 3) ถูกแทรกตรงนี้ครับ 👇👇👇
            let membersHTML = '<span style="color: #999;">ยังไม่มีสมาชิก</span>';
            
            if (project.members && project.members.length > 0 && project.members[0] !== null) {
                membersHTML = project.members.map(memberName => {
                    if (project.owner === currentUserName) {
                        // ถ้าเราเป็นเจ้าของ ให้มีปุ่ม ❌ ตามหลังชื่อ
                        return `${memberName} <button onclick="kickMember('${project.id}', '${memberName}')" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size: 14px; padding: 0;" title="เตะออกจากทีม">❌</button>`;
                    } else {
                        return memberName;
                    }
                }).join(', ');
            }
            // 👆👆👆 จบโค้ดใหม่ 👆👆👆

            // 📝 ในส่วนของ card.innerHTML จะถูกแก้ให้สั้นลงโดยใช้ ${membersHTML} แทน
            card.innerHTML = `
                <h4>${project.title}</h4>
                <p>${project.description}</p>
                
                <div style="margin: 10px 0; font-size: 0.9em; color: #555;">
                    <strong>👥 สมาชิกในทีม:</strong> 
                    ${membersHTML} </div>

                <div style="margin-top: 15px; overflow: hidden;">
                    <span class="owner">👑 สร้างโดย: ${project.owner}</span>
                    ${actionButtons}
                </div>
            `;
            projectList.appendChild(card);
        });

    } catch (error) {
        projectList.innerHTML = '<p style="color: red;">โหลดข้อมูลไม่สำเร็จ กรุณาลองรีเฟรชหน้าเว็บ</p>';
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
createProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // กันหน้าเว็บรีเฟรช

    const title = document.getElementById('project-title').value;
    const description = document.getElementById('project-desc').value;
    
    // ดึง Token ประจำตัวที่ระบบซ่อนไว้ในเครื่องออกมา เพื่อใช้ยืนยันตัวตนว่าใครเป็นคนสร้าง
    const token = localStorage.getItem('token'); 

    try {
        const response = await fetch('http://localhost:5000/api/projects', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // แนบกุญแจไปให้ Middleware ตรวจ
            },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (response.ok) {
            alert('สร้างโปรเจกต์สำเร็จแล้ว!');
            createModal.style.display = 'none'; // ปิดป๊อปอัป
            createProjectForm.reset(); // ล้างฟอร์ม
            fetchProjects(); // รีเฟรชกระดานเพื่อโชว์โปรเจกต์ใหม่ทันที!
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