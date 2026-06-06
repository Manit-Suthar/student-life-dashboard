# Student Life Dashboard

A web-based application that helps students manage academic tasks, study resources, personal inventory, and productivity metrics from a unified dashboard. The platform provides secure user authentication, task management tools, resource organization, and progress tracking features.

---

## Overview

Student Life Dashboard is designed to centralize essential student activities into a single interface. Each user has a private workspace for managing assignments, organizing study materials, tracking inventory, and monitoring productivity habits.

---

## Key Features

### Authentication & User Management

* JWT-based authentication system
* Secure user registration and login
* Individualized dashboards for each user
* Protected routes and user-specific data access

### Assignment Management

* Create, update, and delete assignments
* Organize tasks by priority level
* Track deadlines and due dates
* Store related reference links
* Automatic overdue assignment detection

### Study Materials Repository

* Centralized storage for study resources
* Categorization of learning materials
* Quick access to important links and references
* Organized resource management

### Inventory Tracking

* Maintain records of personal belongings
* Track textbooks, electronics, and room supplies
* Monitor item condition and storage location
* Simple inventory management interface

### Productivity Tracking

* Daily habit and streak monitoring
* Productivity completion statistics
* Visual performance analytics
* Historical trend tracking

### Theme Support

* Light and dark mode support
* Consistent design system
* Accessibility-focused color contrast
* Responsive user interface

---

## Technology Stack

### Frontend

* React
* Vite
* React Router
* Recharts
* Lucide React
* CSS Variables and Custom Styling

### Backend

* Node.js
* Express.js
* Prisma ORM
* SQLite

### Authentication & Security

* JSON Web Tokens (JWT)
* bcryptjs

---

## Installation

### Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the backend directory:

```env
JWT_SECRET=your_secure_secret_key
```

Generate Prisma client and synchronize the database:

```bash
npx prisma generate
npx prisma db push
```

Start the backend server:

```bash
node index.js
```

The backend server will run on:

```text
http://localhost:5000
```

---

### Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at the URL provided by Vite, typically:

```text
http://localhost:5173
```

---

## Project Structure

```text
student-life-dashboard/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── prisma/
│   ├── routes/
│   ├── middleware/
│   ├── index.js
│   └── package.json
│
└── README.md
```

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for additional details.

---


