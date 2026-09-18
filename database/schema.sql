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