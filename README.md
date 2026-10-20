# How to Test the App

## Student Information

- **Student Name:** Zaw Zaw Naing
- **Student ID:** 6711788

## Project Information

**Project Name:** Online Course Service System

**Frontend:** React with Vite

**Backend:** Next.js REST API

**Database:** MongoDB Atlas

**Authentication:** JWT with HTTP-only cookies and bcrypt password hashing

## Test Credentials

### Teacher Account

- **Username:** Test Teacher
- **Email:** teacher.exam@example.com
- **Password:** Teacher123!
- **Role:** Teacher

### Student Account

- **Username:** student1
- **Email:** student1@gmail.com
- **Password:** 123456
- **Role:** Student

## Prerequisites

- Node.js and npm installed
- MongoDB Atlas database connection
- A `.env.local` file inside `next-backend/` containing `MONGODB_URI` and `JWT_SECRET`
- A `.env.local` file inside `react-frontend/` containing `VITE_API_URL=http://localhost:3000`

## How to Run & Test

### 1. Backend Setup (`next-backend/`)

1. Open a terminal in the `next-backend` directory.
2. Run `npm install`.
3. Configure the MongoDB connection and JWT secret in `.env.local`.
4. Run `npm run dev`.
5. The backend API will run at `http://localhost:3000`.

### 2. Frontend Setup (`react-frontend/`)

1. Open a second terminal in the `react-frontend` directory.
2. Run `npm install`.
3. Set `VITE_API_URL=http://localhost:3000` in `.env.local`.
4. Run `npm run dev`.
5. Open `http://localhost:5173` in a browser.

### 3. Testing Walkthrough

**Teacher Features**

1. Open the application and log in using the Teacher credentials.
2. Create a course by entering its title, description, and maximum student capacity.
3. Verify that the new course appears under Available Courses.
4. Click Edit to update the course information.
5. Verify that the updated information appears.
6. Click Delete to remove a course.
7. Click Logout.

**Student Features**

1. Log in using the Student credentials or register a new Student account.
2. Browse the available courses.
3. Click Enroll on a course.
4. Verify that the enrollment count increases and the button changes to Withdraw.
5. Click Withdraw.
6. Verify that the enrollment count decreases and the button changes back to Enroll.
7. Click Logout.

**Additional Validation**

- Only Teachers can create, edit, and delete courses.
- Teachers can edit and delete only their own courses.
- Only Students can enroll in courses.
- Duplicate enrollments are prevented.
- Students cannot enroll when a course has reached its maximum capacity.
- Passwords are stored as bcrypt hashes.
- Authentication uses JWT cookies.

## Deployment

**Production URL:** To be added after deployment.

The application will be deployed on a virtual machine accessible through a public URL.

## Repository Structure

```text
wad-final-2026-01/
├── next-backend/
├── react-frontend/
├── INSTRUCTION.md
└── README.md
```

## Notes

Both frontend and backend must be running for local testing. Environment files containing secrets should not be committed to GitHub.
