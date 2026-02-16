# 📄 Resume Builder — Full-Stack Web Application

Resume Builder is a full-stack web application that allows users to create, edit, preview, and manage multiple resumes through a secure and user-specific interface.

The application implements authentication, protected routes, and full CRUD functionality to allow users to save and manage resume data using a modern web-based dashboard.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- User registration and login system
- Password encryption using **bcrypt**
- Secure authentication using **JWT (JSON Web Tokens)**
- Protected backend API routes
- Session persistence using token-based authentication

---

### 📑 Resume Management
- Create multiple resumes per user
- Edit and update resume details
- Delete existing resumes
- Save resume data in MongoDB
- Retrieve user-specific resumes securely
- Resume template selection saved per document

---

### 🖥️ Frontend Functionality
- Built using **React (Vite)**
- Client-side routing using React Router
- Resume editor with live preview
- Protected routes for authenticated users
- Token-based API communication

---

### 🛠️ Backend Functionality
- RESTful API architecture using Express.js
- Resume data stored using MongoDB (Mongoose)
- Resume CRUD operations:
  - Create resume
  - Retrieve resume
  - Update resume
  - Delete resume
- User-specific document storage

---

## 🛠️ Tech Stack

| Layer | Technology Used |
|-------|-----------------|
| Frontend | React (Vite), React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JSON Web Token (JWT), bcrypt |
| Dev Tools | Nodemon, Concurrently |

---

## 📂 Project Structure

```
resume-builder/
│
├── src/
├── server/
│   └── src/
├── package.json
└── vite.config.js
```

---

## ⚙️ Local Setup Instructions

### 1️⃣ Install Dependencies
```bash
npm install
npm --prefix server install
```

---

### 2️⃣ Backend Environment Setup

Create a `.env` file inside:

```
server/
```

Add:

```
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/resume_builder
JWT_SECRET=your_secret_here
```

---

### 3️⃣ Run Application

Run both client and server:

```bash
npm run dev
```

Application will run on:

Frontend:
```
http://localhost:5173
```

Backend:
```
http://localhost:5000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/resume | Retrieve all resumes |
| POST | /api/resume | Create new resume |
| GET | /api/resume/:id | Retrieve specific resume |
| PUT | /api/resume/:id | Update resume |
| DELETE | /api/resume/:id | Delete resume |
| GET | /api/resume/me | Retrieve latest resume |

---

## 🔒 Security Practices Implemented
- Password hashing using bcrypt  
- Token-based authentication (JWT)  
- User-specific document access  
- Protected backend API routes  

---

## 📌 Future Improvements
- Resume export as PDF  
- Template customization  
- Cloud storage integration  
- Resume sharing via link  

---

## 📄 License
This project is developed for educational and portfolio purposes.
