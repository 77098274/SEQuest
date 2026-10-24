# SEQuest – Software Engineering Project Simulation Platform

SEQuest is a web-based platform that helps users learn software project management through interactive simulations. Users make decisions in different project scenarios and review the outcomes. Administrators can manage users, scenarios, events, and decisions.

## Technology Stack

- Frontend: React and Vite
- Backend: Node.js and Express.js
- Database: MySQL
- Authentication: JWT and bcryptjs
- API Communication: REST APIs

## Prerequisites

Install the following before running the project:

- Node.js and npm
- MySQL Server
- Git

## Setup Instructions

### 1. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/77098274/SEQuest.git
cd SEQuest
```

### 2. Set Up the Database

Start your MySQL server and create the database required by the application.

```sql
CREATE DATABASE your_database_name;
```

Replace `your_database_name` with the database name you intend to use. Ensure the required tables are created before running the application.

### 3. Configure the Backend

Navigate to the backend directory and install the dependencies:

```bash
cd backend
npm install
```

Create a file named `.env` inside the `backend` directory. Add the environment variables required by `server.js`.

Example configuration:

```env
PORT=5001
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=replace_with_a_strong_random_secret
```

**Note:** These variable names are examples. Check `backend/server.js` and use the exact names expected by your application. Replace the placeholder values with your own local configuration. Do not upload the `.env` file or any real passwords, tokens, or secret keys to GitHub.

Start the backend:

```bash
npm run dev
```

The backend will run on the configured port, which is commonly `5001` in the current project setup.

### 4. Configure and Run the Frontend

Open a second terminal window from the project root and run:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local development URL in the terminal, usually:

`http://localhost:5173`

Open this URL in your browser. Make sure the frontend API configuration points to the correct backend URL.

## Running the Complete Application

1. Start the MySQL server.
2. Start the backend from the `backend` directory using `npm run dev`.
3. Start the frontend from the `frontend` directory using `npm run dev` in a separate terminal.
4. Open the local frontend URL displayed by Vite.
5. Log in and access the available SEQuest features.

## Environment Variable Security

- Keep `backend/.env` private and do not commit it to GitHub.
- Use placeholder values in documentation.
- Keep database credentials and JWT secrets out of source code.
- Share an `.env.example` file containing variable names and placeholder values if needed.

## GitHub Repository

https://github.com/77098274/SEQuest