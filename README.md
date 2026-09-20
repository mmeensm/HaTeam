# 🤝 HaTeam (หาทีม) - Smart Team Matching Web Application

HaTeam is a Single Page Application (SPA) designed to help university students seamlessly find the right teammates for their academic projects and activities. Powered by a Graph Database (Neo4j), it features an intelligent "Smart Matching" algorithm that connects users based on skill set intersections.[cite: 9, 10]

This project was developed as part of the CP151 Web Programming course at Srinakharinwirot University.[cite: 9, 10]

## 🛠️ Tech Stack
**Frontend:**
- HTML5, CSS3, Vanilla JavaScript (SPA Architecture)[cite: 9, 10]
- DOM Manipulation & Fetch API[cite: 9, 10]
- Custom Skill Tags System (Interactive UI)[cite: 9, 10]

**Backend:**
- Node.js & Express framework (MVC Architecture)[cite: 9, 10]
- RESTful API[cite: 9, 10]
- Security: JWT (JSON Web Token) for Stateless Authentication & bcrypt for password hashing[cite: 9, 10]

**Database:**
- Neo4j (Graph Database) running via Docker[cite: 9, 10]

## ✨ Core Features

### 🧠 Smart Matching Algorithm
Leveraging Neo4j's graph processing power, the system analyzes the array of skills (`Skill Tags`) provided by users and compares them with the required skills of active projects. A Cypher query calculates a "Match Score" based on intersections and dynamically recommends the top 5 most suitable projects on the user's dashboard.[cite: 9, 10]

### 🔒 Secure Authentication & Authorization
- Robust registration and login system utilizing `bcrypt` for password encryption.[cite: 9, 10]
- JWT-based authentication ensures secure, stateless API access (`Authorization: Bearer <token>`).[cite: 9, 10]
- **Role-based Access Control & Ownership Check:** Cypher queries validate whether a user has the `OWNS_PROJECT` relationship before allowing them to edit, delete, or manage team members, preventing broken access control vulnerabilities.[cite: 9, 10]

### ⚙️ Automated Project Management (Auto-Close)
Project owners can accept, reject, or kick applicants.[cite: 10] The system incorporates an automated mechanism: when an applicant is accepted (relationship changes to `MEMBER_OF`), the backend checks if the current member count equals the `maxMembers` limit. If true, the project's status automatically switches from 'Recruiting' to 'Full' without requiring manual intervention.[cite: 9, 10]

### 💻 Seamless User Experience (UX)
- **SPA & Conditional Rendering:** Smooth navigation without page reloads.[cite: 9] Modals dynamically display different action buttons based on the user's context (e.g., Owner vs. Applicant).[cite: 9, 10]
- **Persistent Session:** JWT tokens are securely stored in `localStorage`. The application auto-authenticates returning users upon page refresh, maintaining workflow continuity.[cite: 9, 10]

## 🗄️ Database Schema (Neo4j Graph Model)
The database operates on a Property Graph Model defining nodes and their relationships:[cite: 9, 10]

**Nodes:**
- `(:User)` - Stores authentication and profile data (userId, name, email, encrypted password, skills array).[cite: 9]
- `(:Project)` - Stores project details (projectId, title, description, maxMembers, status, required skills array).[cite: 9]

**Relationships:**
- `(:User)-[:OWNS_PROJECT]->(:Project)`: Grants management privileges to the creator.[cite: 9, 10]
- `(:User)-[:APPLIED_TO]->(:Project)`: Represents a pending application request.[cite: 9, 10]
- `(:User)-[:MEMBER_OF]->(:Project)`: Represents an accepted team member.[cite: 9, 10]

## 🚀 Future Enhancements
- **Real-time Notifications:** Implementing WebSockets (e.g., Socket.io) for instant alerts on applications and team updates.[cite: 9]
- **Karma & Review System:** Allowing post-project evaluations to build trust and enhance the matching algorithm.[cite: 9]
- **In-app Chat:** A dedicated communication space for users with `MEMBER_OF` relationships.[cite: 9]

---
*Developed by Amin Samae (Full-Stack Developer) - 2026*[cite: 9]
