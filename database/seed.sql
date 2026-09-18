USE sequest;

INSERT INTO users (name, email, password, role)
VALUES
('Test User', 'test@sequest.com', '123456', 'USER');

INSERT INTO scenarios
(name, description, difficulty, budget, duration_weeks, team_size, initial_risk, initial_quality, initial_customer_satisfaction)
VALUES
(
    'E-Commerce Website Development',
    'Develop an online shopping website with limited budget and time.',
    'Easy',
    100000,
    12,
    5,
    30,
    70,
    75
),
(
    'Hospital Management System',
    'Develop a hospital management system with patient records and appointment management.',
    'Medium',
    200000,
    16,
    7,
    45,
    65,
    70
),
(
    'Banking Application',
    'Develop a secure banking application with high security and reliability requirements.',
    'Hard',
    300000,
    20,
    10,
    60,
    60,
    65
);

INSERT INTO events
(scenario_id, stage, title, description)
VALUES
(
    2,
    'Requirements',
    'Changing Requirements',
    'The hospital management team requests additional features for patient appointment management.'
),
(
    2,
    'Design',
    'System Architecture Decision',
    'The development team must choose between a simple monolithic architecture and a modular architecture for the hospital management system.'
),
(
    2,
    'Development',
    'Developer Availability Problem',
    'Two developers become unavailable during development, creating a risk of schedule delay.'
),
(
    2,
    'Testing',
    'Critical Bugs Discovered',
    'Testing reveals several critical bugs in patient records and appointment management.'
),
(
    2,
    'Deployment',
    'Deployment Failure',
    'The first deployment attempt fails because of configuration and environment issues.'
),
(
    2,
    'Maintenance',
    'Customer Change Request',
    'After deployment, the hospital requests an additional reporting feature.'
);

INSERT INTO decisions
(event_id, option_text, budget_change, time_change, quality_change, risk_change, bugs_change, technical_debt_change, morale_change, customer_change)
VALUES

(1, 'Accept the new requirements and extend the timeline',
 -10000, -2, 5, -5, 0, 0, 5, 10),

(1, 'Reject the new requirements to protect the original schedule',
 0, 0, -5, 5, 2, 5, -5, -10),

(2, 'Choose modular architecture for better maintainability',
 -15000, -1, 8, -8, 0, -3, 3, 5),

(2, 'Choose simple architecture to save time and budget',
 5000, 1, -5, 6, 1, 5, 2, -3),

(3, 'Redistribute tasks among the remaining developers',
 0, -2, -3, 5, 2, 3, -8, -5),

(3, 'Hire temporary developers to maintain the schedule',
 -20000, 0, 5, -5, 0, 0, 5, 5),

(4, 'Fix all critical bugs before continuing',
 -12000, -2, 10, -10, -5, -3, 3, 8),

(4, 'Fix only the most urgent bugs and continue',
 -5000, 0, -3, 8, -2, 5, 0, -5),

(5, 'Investigate and fix the deployment configuration',
 -8000, -1, 5, -8, 0, -2, 2, 5),

(5, 'Rollback and deploy the previous stable version',
 -3000, -2, 3, -5, 0, 1, -2, 2),

(6, 'Accept the reporting feature request',
 -10000, -2, 5, -3, 0, 2, 3, 10),

(6, 'Reject the request and keep the current system',
 0, 0, -3, 4, 1, 1, -3, -8);