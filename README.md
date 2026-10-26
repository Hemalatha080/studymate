# StudyMate

<p align="center">
  <strong>A Collaborative Learning Platform for Students</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Project-StudyMate-6C5CE7?style=for-the-badge" alt="StudyMate" />
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/API-Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

StudyMate is a full-stack web application that supports students through a collaborative learning experience. It pairs a React frontend with a Node.js/Express backend and a MongoDB database, and includes user authentication and a video-room interface. The codebase is modular, with separate layers for routes, controllers, models, middleware, and configuration, giving a solid foundation for interactive learning and collaboration.

## Problem Statement

Students often struggle to keep learning engaging and organized, whether studying alone or coordinating with peers. Common challenges include:

- Limited opportunities for interactive learning
- Learning tools scattered across different places
- No structured interface for accessing learning features
- The need for secure authentication and user-specific data handling

StudyMate addresses these by bringing student-focused features into one web application.

## Features

- **User authentication:** registration and login with bcrypt password hashing and verification, plus JWT-based sessions
- **User management:** backend operations for retrieving user information, with password fields excluded from responses
- **Video room:** a dedicated frontend component with its own styling and a socket client for real-time communication
- **Modular REST API:** organized routes, controllers, models, and authentication middleware
- **Environment-based configuration:** MongoDB connection and secrets are kept out of the code

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Frontend build tool and dev server |
| JavaScript | Application development |
| Node.js | Backend runtime |
| Express.js | Backend API framework |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| bcrypt | Password hashing |
| JWT | Authentication tokens |
| Socket.IO client | Real-time communication |

## Project Structure

```text
StudyMate/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── VideoRoom.jsx
│   │   ├── VideoRoom.css
│   │   └── socket.js
│   ├── package.json
│   └── ...
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Hemalatha080/studymate.git
cd studymate
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_private_jwt_secret
```

> Never commit your `.env` file or share real credentials publicly.

### 3. Set up the frontend

In a new terminal:

```bash
cd client
npm install
```

### 4. Run the application

Start the backend and frontend in separate terminals:

```bash
# Terminal 1 - backend
cd server
npm install
npm run dev

# Terminal 2 - frontend
cd client
nom install
npm run dev
```

Then open the frontend URL shown in your terminal (Vite's default is `http://localhost:5173`).

## Security

- Sensitive values live in environment variables
- `.env` files are excluded from version control via `.gitignore`
- Passwords are hashed with bcrypt, never stored as plain text
- Routes that require authentication are protected with JWT middleware
- Never publish database credentials, JWT secrets, or private API keys

## Roadmap

- [ ] Richer collaborative learning workflows
- [ ] Improved video-room experience
- [ ] Additional student-focused features
- [ ] Better error handling and security hardening
- [ ] UI and accessibility improvements



## Author

**Hemalatha Tamma** — [@Hemalatha080](https://github.com/Hemalatha080)

---

<p align="center">
  <em>StudyMate: building a more connected learning experience.</em>
</p>
