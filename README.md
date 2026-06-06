# 🎓 Student Life Dashboard

A comprehensive, professional-grade web application designed to help students manage their entire academic and personal life from a single dashboard. Built with a sleek, high-contrast enterprise design system.

## 🌟 Features

*   **Secure Authentication**: Fully functional JWT-based user authentication. Every user gets a private, individualized dashboard.
*   **Assignments Tracker**: Manage tasks by priority (High, Medium, Low), track deadlines, and attach essential reference links. Automatically flags overdue assignments.
*   **Study Materials Hub**: A centralized resource library to store and categorize study links and reference materials.
*   **Inventory Management**: Track your dorm room supplies, textbooks, and electronics, including their condition and location.
*   **Productivity & Habits (Local)**: Maintain daily streaks, track completion success rates, and view beautiful charts visualizing your productivity trends over time.
*   **Dark/Light Mode**: Flawless, accessible color contrast that flips beautifully between professional light and slate dark modes.

## 🛠 Tech Stack

**Frontend:**
*   React (Vite)
*   React Router (SPA Navigation)
*   Recharts (Analytics Visualizations)
*   Lucide-React (Icons)
*   Pure CSS (Enterprise-grade UI tokens, Glassmorphism, CSS Variables)

**Backend:**
*   Node.js & Express
*   Prisma ORM
*   SQLite Database
*   `jsonwebtoken` & `bcryptjs` (Auth & Security)

## 🚀 Getting Started

Follow these steps to run the application locally.

### 1. Backend Setup

Open a terminal and navigate to the backend folder:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Set up your Environment Variables:
Create a `.env` file in the `backend` folder and add a secure secret:
```env
JWT_SECRET=your_super_secret_string_here
```

Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

Start the server:
```bash
node index.js
```
*(The backend will run on `http://localhost:5000`)*

### 2. Frontend Setup

Open a **new** terminal window and navigate to the frontend folder:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`). Create an account and start managing your student life!

## 📸 Screenshots
*(Add screenshots of your application here!)*

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
