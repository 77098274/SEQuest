
CREATE DATABASE IF NOT EXISTS sequest;
USE sequest;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER'
);

CREATE TABLE IF NOT EXISTS scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20),
    budget DECIMAL(12,2),
    duration_weeks INT,
    team_size INT,
    initial_risk INT,
    initial_quality INT,
    initial_customer_satisfaction INT
);

CREATE TABLE IF NOT EXISTS simulation_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scenario_id INT NOT NULL,
    current_stage VARCHAR(50) DEFAULT 'Requirements',
    budget DECIMAL(12,2),
    remaining_weeks INT,
    quality INT,
    risk INT,
    bugs INT DEFAULT 0,
    technical_debt INT DEFAULT 0,
    team_morale INT,
    customer_satisfaction INT,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
);

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scenario_id INT NOT NULL,
    stage VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
);

CREATE TABLE IF NOT EXISTS decisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    budget_change DECIMAL(12,2) DEFAULT 0,
    time_change INT DEFAULT 0,
    quality_change INT DEFAULT 0,
    risk_change INT DEFAULT 0,
    bugs_change INT DEFAULT 0,
    technical_debt_change INT DEFAULT 0,
    morale_change INT DEFAULT 0,
    customer_change INT DEFAULT 0,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS simulation_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    budget_performance INT,
    schedule_performance INT,
    quality_score INT,
    risk_management INT,
    customer_satisfaction INT,
    technical_debt_score INT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES simulation_sessions(id)
);

-- Seed scenarios
INSERT INTO scenarios
(name, description, difficulty, budget, duration_weeks, team_size,
 initial_risk, initial_quality, initial_customer_satisfaction)
SELECT 'E-Commerce Website Development',
       'Develop an online shopping website with limited budget and time.',
       'Easy', 100000, 12, 5, 30, 70, 75
WHERE NOT EXISTS (
    SELECT 1 FROM scenarios
    WHERE name = 'E-Commerce Website Development'
);

INSERT INTO scenarios
(name, description, difficulty, budget, duration_weeks, team_size,
 initial_risk, initial_quality, initial_customer_satisfaction)
SELECT 'Hospital Management System',
       'Develop a hospital management system with patient records and appointment management.',
       'Medium', 200000, 16, 7, 45, 65, 70
WHERE NOT EXISTS (
    SELECT 1 FROM scenarios
    WHERE name = 'Hospital Management System'
);

INSERT INTO scenarios
(name, description, difficulty, budget, duration_weeks, team_size,
 initial_risk, initial_quality, initial_customer_satisfaction)
SELECT 'Banking Application',
       'Develop a secure banking application with high security and reliability requirements.',
       'Hard', 300000, 20, 10, 60, 60, 65
WHERE NOT EXISTS (
    SELECT 1 FROM scenarios
    WHERE name = 'Banking Application'
);

-- Seed hospital events using scenario IDs looked up by name
INSERT INTO events (scenario_id, stage, title, description)
SELECT s.id, e.stage, e.title, e.description
FROM scenarios s
JOIN (
    SELECT 'Requirements' AS stage, 'Changing Requirements' AS title,
           'The hospital management team requests additional features for patient appointment management.' AS description
    UNION ALL
    SELECT 'Design', 'System Architecture Decision',
           'The development team must choose between a simple monolithic architecture and a modular architecture for the hospital management system.'
    UNION ALL
    SELECT 'Development', 'Developer Availability Problem',
           'Two developers become unavailable during development, creating a risk of schedule delay.'
    UNION ALL
    SELECT 'Testing', 'Critical Bugs Discovered',
           'Testing reveals several critical bugs in patient records and appointment management.'
    UNION ALL
    SELECT 'Deployment', 'Deployment Failure',
           'The first deployment attempt fails because of configuration and environment issues.'
    UNION ALL
    SELECT 'Maintenance', 'Customer Change Request',
           'After deployment, the hospital requests an additional reporting feature.'
) e
WHERE s.name = 'Hospital Management System'
AND NOT EXISTS (
    SELECT 1 FROM events existing
    WHERE existing.scenario_id = s.id
      AND existing.stage = e.stage
      AND existing.title = e.title
);

-- Seed decisions by matching event titles, not hardcoded event IDs
INSERT INTO decisions
(event_id, option_text, budget_change, time_change, quality_change,
 risk_change, bugs_change, technical_debt_change, morale_change, customer_change)
SELECT e.id, d.option_text, d.budget_change, d.time_change, d.quality_change,
       d.risk_change, d.bugs_change, d.technical_debt_change,
       d.morale_change, d.customer_change
FROM events e
JOIN (
    SELECT 'Changing Requirements' AS event_title,
           'Accept the new requirements and extend the timeline' AS option_text,
           -10000 AS budget_change, -2 AS time_change, 5 AS quality_change,
           -5 AS risk_change, 0 AS bugs_change, 0 AS technical_debt_change,
           5 AS morale_change, 10 AS customer_change
    UNION ALL
    SELECT 'Changing Requirements', 'Reject the new requirements to protect the original schedule',
           0, 0, -5, 5, 2, 5, -5, -10
    UNION ALL
    SELECT 'System Architecture Decision', 'Choose modular architecture for better maintainability',
           -15000, -1, 8, -8, 0, -3, 3, 5
    UNION ALL
    SELECT 'System Architecture Decision', 'Choose simple architecture to save time and budget',
           5000, 1, -5, 6, 1, 5, 2, -3
    UNION ALL
    SELECT 'Developer Availability Problem', 'Redistribute tasks among the remaining developers',
           0, -2, -3, 5, 2, 3, -8, -5
    UNION ALL
    SELECT 'Developer Availability Problem', 'Hire temporary developers to maintain the schedule',
           -20000, 0, 5, -5, 0, 0, 5, 5
    UNION ALL
    SELECT 'Critical Bugs Discovered', 'Fix all critical bugs before continuing',
           -12000, -2, 10, -10, -5, -3, 3, 8
    UNION ALL
    SELECT 'Critical Bugs Discovered', 'Fix only the most urgent bugs and continue',
           -5000, 0, -3, 8, -2, 5, 0, -5
    UNION ALL
    SELECT 'Deployment Failure', 'Investigate and fix the deployment configuration',
           -8000, -1, 5, -8, 0, -2, 2, 5
    UNION ALL
    SELECT 'Deployment Failure', 'Rollback and deploy the previous stable version',
           -3000, -2, 3, -5, 0, 1, -2, 2
    UNION ALL
    SELECT 'Customer Change Request', 'Accept the reporting feature request',
           -10000, -2, 5, -3, 0, 2, 3, 10
    UNION ALL
    SELECT 'Customer Change Request', 'Reject the request and keep the current system',
           0, 0, -3, 4, 1, 1, -3, -8
) d ON e.title = d.event_title
JOIN scenarios s ON e.scenario_id = s.id
WHERE s.name = 'Hospital Management System'
AND NOT EXISTS (
    SELECT 1 FROM decisions existing
    WHERE existing.event_id = e.id
      AND existing.option_text = d.option_text
);
