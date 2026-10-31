# SEQuest – Software Engineering Learning Simulator

SEQuest is an interactive Software Engineering Learning Simulator designed to help students understand software engineering and project management through practical decision-making.

Instead of learning Software Development Life Cycle (SDLC) concepts only through theory, users can simulate software projects, make decisions at different development stages, and observe how those decisions affect project performance.

The system tracks factors such as budget, schedule, quality, risk, bugs, technical debt, team morale, and customer satisfaction.

---

## Features

- User registration and login
- User and Admin roles
- Multiple software project scenarios
- Different difficulty levels
- Interactive SDLC simulation
- Six simulation stages:
  - Requirements
  - Design
  - Development
  - Testing
  - Deployment
  - Maintenance
- Decision-based project simulation
- Dynamic project metrics
- Budget and schedule tracking
- Risk and quality tracking
- Bug and technical debt tracking
- Team morale and customer satisfaction tracking
- Final project performance analysis
- AI-based risk and performance analysis
- MySQL database integration
- REST API based backend
- Modular React frontend

---

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- MySQL

### Other Components
- Simulation Engine
- Decision Engine
- AI-based Risk and Performance Analysis

---

## System Architecture

SEQuest follows a three-layer architecture:

```text
+---------------------------+
|       React Frontend      |
|                           |
| Login / Dashboard         |
| Scenario Selection        |
| Simulation Interface      |
| Results & Analysis        |
+-------------+-------------+
              |
              | REST API
              |
+-------------v-------------+
|     Node.js + Express     |
|                           |
| Authentication            |
| Simulation Logic          |
| Decision Processing       |
| Result Calculation        |
| AI Analysis               |
+-------------+-------------+
              |
              | MySQL Queries
              |
+-------------v-------------+
|        MySQL Database     |
|                           |
| Users                     |
| Scenarios                 |
| Sessions                  |
| Events                    |
| Decisions                 |
| Results                   |
+---------------------------+
```

---

## Project Structure

```text
SEQuest/
│
├── ai/
│   └── AI analysis and risk evaluation
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── docs/
│   └── Project documentation
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── ...
│
├── simulation/
│   └── Simulation and decision engine
│
├── tests/
│   └── Testing files
│
└── README.md
```

---

# Requirements

Before running SEQuest locally, install the following:

- Node.js (v18 or later recommended)
- npm
- MySQL Server
- Git

Check your installations:

```bash
node --version
npm --version
mysql --version
```

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/77098274/SEQuest.git
```

Move into the project directory:

```bash
cd SEQuest
```

---

# 2. Database Setup

SEQuest uses MySQL as its database.

Start your MySQL server and open MySQL:

```bash
mysql -u root -p
```

Create the database and tables using the provided schema:

```sql
SOURCE database/schema.sql;
```

Then load the initial data:

```sql
SOURCE database/seed.sql;
```

Alternatively, you can run the SQL files from MySQL Workbench.

Verify the database:

```sql
USE sequest;
SHOW TABLES;
```

The database contains tables for:

```text
users
scenarios
simulation_sessions
events
decisions
simulation_results
```

---

# 3. Backend Setup

Open a terminal and move to the backend directory:

```bash
cd backend
```

Install the backend dependencies:

```bash
npm install
```

Configure the database connection before starting the backend.

Create a `.env` file inside the `backend` directory:

```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=sequest
```

Replace:

```text
YOUR_MYSQL_PASSWORD
```

with your local MySQL password.

**Do not commit the `.env` file to GitHub.**

Add `.env` to `.gitignore`:

```text
.env
```

If your local MySQL configuration uses different credentials, update the database configuration accordingly.

---

# 4. Start the Backend

From the `backend` directory:

```bash
node server.js
```

The backend should start on:

```text
http://localhost:5001
```

You can test the backend by opening:

```text
http://localhost:5001/
```

You can also test the database connection using:

```text
http://localhost:5001/api/test-db
```

---

# 5. Frontend Setup

Open another terminal.

From the project root:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Vite will provide a local URL similar to:

```text
http://localhost:5173
```

Open that URL in your browser.

---

# Environment Variables

The project should use environment variables for configuration values that may differ between machines.

Example backend `.env`:

```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=sequest
```

Do not add real passwords, API keys, tokens, or other sensitive credentials to GitHub.

A sample configuration can be maintained using a file such as:

```text
.env.example
```

Example:

```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sequest
```

---

# Running the Complete Project

Two terminals are recommended.

### Terminal 1 – Backend

```bash
cd SEQuest/backend
npm install
node server.js
```

### Terminal 2 – Frontend

```bash
cd SEQuest/frontend
npm install
npm run dev
```

Then open the frontend URL provided by Vite, usually:

```text
http://localhost:5173
```

---

# Application Workflow

The general workflow of SEQuest is:

```text
Login / Register
       |
       v
Scenario Selection
       |
       v
Create Simulation
       |
       v
Requirements
       |
       v
Design
       |
       v
Development
       |
       v
Testing
       |
       v
Deployment
       |
       v
Maintenance
       |
       v
Final Results
       |
       v
AI Analysis
```

At each stage, the user receives a project situation and selects a decision.

The selected decision changes the project metrics and can influence the final outcome.

---

# Simulation Metrics

The simulation tracks multiple project parameters:

| Metric | Description |
|---|---|
| Budget | Remaining project budget |
| Schedule | Remaining project time |
| Quality | Overall software quality |
| Risk | Project risk level |
| Bugs | Number of project defects |
| Technical Debt | Accumulated technical compromises |
| Team Morale | Team motivation and productivity |
| Customer Satisfaction | Customer perception of the project |

Different decisions produce different changes in these metrics.

---

# AI-Based Analysis

After completing a simulation, SEQuest analyzes the final project performance.

The analysis considers factors such as:

- Budget performance
- Schedule performance
- Quality
- Risk
- Bugs
- Technical debt
- Team morale
- Customer satisfaction

The system identifies important project risks and weaknesses and provides feedback to help the user understand the consequences of their decisions.

The current implementation uses an internal AI/risk-analysis component rather than requiring an external OpenAI or Gemini API key.

---

# REST API

The backend exposes REST APIs that connect the React frontend with the simulation engine and MySQL database.

Important API endpoints include:

```text
GET    /api/scenarios
POST   /api/simulations
GET    /api/simulations/:sessionId
GET    /api/events/:scenarioId/:stage
POST   /api/decisions/:sessionId/:decisionId
PUT    /api/simulations/:sessionId/stage
POST   /api/simulations/:sessionId/complete
GET    /api/results/:sessionId
GET    /api/ai-analysis/:sessionId
```

Authentication endpoints include:

```text
POST   /api/register
POST   /api/login
```

---

# Database

The main database tables are:

### users

Stores user account information and roles.

### scenarios

Stores available software project scenarios.

### simulation_sessions

Stores individual simulation sessions created by users.

### events

Stores project situations associated with different SDLC stages.

### decisions

Stores decision options and their effects on project metrics.

### simulation_results

Stores the final results of completed simulations.

---

# Example Scenarios

The system supports different types of software projects with different difficulty levels.

Current scenarios include:

- E-Commerce Website Development
- Hospital Management System
- Banking Application

Each scenario has its own:

- Budget
- Duration
- Team size
- Difficulty
- Events
- Decision options

---

# Testing

The project can be tested by verifying:

- User registration
- User login
- Scenario retrieval
- Simulation creation
- Event retrieval
- Decision submission
- Metric updates
- Stage progression
- Simulation completion
- Result calculation
- AI analysis
- Database connectivity
- Frontend-backend communication

---

# Security Notes

Sensitive configuration values should never be committed to GitHub.

Do not commit:

```text
.env
```

or files containing:

```text
Database passwords
API keys
Authentication tokens
Private credentials
```

Use environment variables for sensitive configuration.

---

# Troubleshooting

### Backend does not start

Make sure MySQL is running and the database credentials are correct.

Check:

```text
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
```

Also make sure port `5001` is available.

---

### Database connection fails

Verify that the database exists:

```sql
SHOW DATABASES;
```

Then:

```sql
USE sequest;
SHOW TABLES;
```

If the database has not been created, run:

```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

---

### Frontend cannot connect to backend

Make sure the backend is running:

```bash
node server.js
```

and that it is available at:

```text
http://localhost:5001
```

Then start the frontend:

```bash
npm run dev
```

---

# Future Scope

Possible future improvements include:

- Integration with external generative AI services
- More software project scenarios
- Advanced analytics and performance dashboards
- Leaderboards and scoring
- Multiplayer/team simulations
- Improved admin controls
- More advanced authentication and authorization
- Cloud deployment
- Automated testing and CI/CD integration
- Personalized learning recommendations

---

# Authors

**SEQuest – Software Engineering Learning Simulator**

Developed as a Software Engineering project for practical learning and simulation of software project management concepts.

---

# License

This project is developed for educational and academic purposes.
