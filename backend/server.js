require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const db = require("./db");

const { processDecision } = require("../simulation/decisionEngine");

const {
    getNextStage,
    isSimulationComplete
} = require("../simulation/simulationEngine");

const {
    analyzeProjectState
} = require("../ai/aiAnalysis");

const {
    predictProjectRisk
} = require("../ai/model");

const app = express();
app.get("/api/health", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      return res.status(503).json({
        status: "error",
        server: "running",
        database: "disconnected"
      });
    }

    res.json({
      status: "ok",
      server: "running",
      database: "connected"
    });
  });
});

app.use(cors());
app.use(express.json());
// ==================== AUTHENTICATION MIDDLEWARE ====================

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Authentication token required"
        });
    }

    try {
        const token = authHeader.split(" ")[1];

        req.user = jwt.verify(token, process.env.JWT_SECRET);

        next();
    } catch (error) {
        return res.status(401).json({
            error: "Invalid or expired token"
        });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            error: "Admin access required"
        });
    }

    next();
}

/* ==================== REGISTER ==================== */

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, 'USER')
        `;

        const [result] = await db.promise().query(sql, [
            name,
            email.trim(),
            hashedPassword
        ]);

        res.status(201).json({
            message: "Registration successful!",
            user_id: result.insertId
        });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "Email already registered"
            });
        }

        console.error("Registration failed:", err);

        res.status(500).json({
            error: "Registration failed"
        });
    }
});

/* ==================== LOGIN ==================== */

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const [users] = await db.promise().query(
            `SELECT id, name, email, password, role
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [email.trim()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const account = users[0];
        const storedPassword = account.password;

        let passwordMatches = false;

        if (typeof storedPassword === "string" &&
            storedPassword.startsWith("$2")) {
            passwordMatches = await bcrypt.compare(
                password,
                storedPassword
            );
        } else {
            // Temporary compatibility for existing plaintext passwords.
            passwordMatches = password === storedPassword;
        }

        if (!passwordMatches) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Upgrade a legacy plaintext password after successful login.
        if (!storedPassword.startsWith("$2")) {
            const hashedPassword = await bcrypt.hash(password, 10);

            await db.promise().query(
                "UPDATE users SET password = ? WHERE id = ?",
                [hashedPassword, account.id]
            );
        }

        const user = {
            id: account.id,
            name: account.name,
            email: account.email,
            role: account.role
        };

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from .env");

            return res.status(500).json({
                error: "Authentication configuration error"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({
            message: "Login successful!",
            user,
            token
        });
    } catch (err) {
        console.error("Login failed:", err);

        res.status(500).json({
            error: "Login failed"
        });
    }
});

// ==================== BASIC ROUTES ====================

app.get("/", (req, res) => {
    res.json({
        message: "SEQuest Backend is running!"
    });
});

app.get("/api/test-db", (req, res) => {
    db.query("SELECT 1 AS result", (err, results) => {
        if (err) {
            return res.status(500).json({
                error: "Database query failed"
            });
        }

        res.json({
            message: "Database query successful!",
            data: results
        });
    });
});

// ==================== SCENARIOS ====================

app.get("/api/scenarios", (req, res) => {
    db.query("SELECT * FROM scenarios", (err, results) => {
        if (err) {
            return res.status(500).json({
                error: "Failed to fetch scenarios"
            });
        }

        res.json(results);
    });
});

// ==================== START SIMULATION ====================

app.post("/api/simulations", (req, res) => {
    const { user_id, scenario_id } = req.body;

    if (!user_id || !scenario_id) {
        return res.status(400).json({
            error: "User ID and scenario ID are required"
        });
    }

    const sql = `
        INSERT INTO simulation_sessions
        (
            user_id,
            scenario_id,
            current_stage,
            budget,
            remaining_weeks,
            quality,
            risk,
            bugs,
            technical_debt,
            team_morale,
            customer_satisfaction
        )
        SELECT
            ?,
            id,
            'Requirements',
            budget,
            duration_weeks,
            initial_quality,
            initial_risk,
            0,
            0,
            70,
            initial_customer_satisfaction
        FROM scenarios
        WHERE id = ?
    `;

    db.query(sql, [user_id, scenario_id], (err, result) => {
        if (err) {
            console.error("Create simulation failed:", err);

            return res.status(500).json({
                error: "Failed to create simulation"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Scenario not found"
            });
        }

        res.json({
            message: "Simulation started!",
            session_id: result.insertId
        });
    });
});

// ==================== GET SIMULATION ====================

app.get("/api/simulations/:sessionId", (req, res) => {
    const sessionId = req.params.sessionId;

    db.query(
        "SELECT * FROM simulation_sessions WHERE id = ?",
        [sessionId],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    error: "Failed to fetch simulation"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error: "Simulation not found"
                });
            }

            res.json(results[0]);
        }
    );
});

// ==================== GET EVENTS ====================

app.get("/api/events/:scenarioId/:stage", (req, res) => {
    const scenarioId = req.params.scenarioId;
    const stage = req.params.stage;

    const sql = `
        SELECT
            e.id AS event_id,
            e.stage,
            e.title,
            e.description,
            d.id AS decision_id,
            d.option_text,
            d.budget_change,
            d.time_change,
            d.quality_change,
            d.risk_change,
            d.bugs_change,
            d.technical_debt_change,
            d.morale_change,
            d.customer_change
        FROM events e
        JOIN decisions d ON e.id = d.event_id
        WHERE e.scenario_id = ?
          AND e.stage = ?
    `;

    db.query(sql, [scenarioId, stage], (err, results) => {
        if (err) {
            console.error("Fetch events failed:", err);

            return res.status(500).json({
                error: "Failed to fetch events"
            });
        }

        res.json(results);
    });
});

// ==================== PROCESS DECISION ====================

app.post("/api/decisions/:sessionId/:decisionId", (req, res) => {
    const sessionId = req.params.sessionId;
    const decisionId = req.params.decisionId;

    const getSql = `
        SELECT s.*, d.*
        FROM simulation_sessions s
        JOIN decisions d ON d.id = ?
        WHERE s.id = ?
    `;

    db.query(getSql, [decisionId, sessionId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: "Failed to fetch decision"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Simulation or decision not found"
            });
        }

        const row = results[0];

        const currentState = {
            budget: Number(row.budget),
            remaining_weeks: Number(row.remaining_weeks),
            quality: Number(row.quality),
            risk: Number(row.risk),
            bugs: Number(row.bugs),
            technical_debt: Number(row.technical_debt),
            team_morale: Number(row.team_morale),
            customer_satisfaction: Number(row.customer_satisfaction),
            current_stage: row.current_stage,
            status: row.status
        };

        const decision = {
            option_text: row.option_text,
            budget_change: row.budget_change,
            time_change: row.time_change,
            quality_change: row.quality_change,
            risk_change: row.risk_change,
            bugs_change: row.bugs_change,
            technical_debt_change: row.technical_debt_change,
            morale_change: row.morale_change,
            customer_change: row.customer_change
        };

        const decisionResult = processDecision(
            currentState,
            decision
        );

        const updatedState = decisionResult.updatedState;

        const nextStage = getNextStage(currentState.current_stage);

        const complete = isSimulationComplete(
            currentState.current_stage
        );

        const newStage = complete
            ? currentState.current_stage
            : nextStage;

        const updateSql = `
            UPDATE simulation_sessions
            SET
                budget = ?,
                remaining_weeks = ?,
                quality = ?,
                risk = ?,
                bugs = ?,
                technical_debt = ?,
                team_morale = ?,
                customer_satisfaction = ?,
                current_stage = ?
            WHERE id = ?
        `;

        db.query(
            updateSql,
            [
                updatedState.budget,
                updatedState.remaining_weeks,
                updatedState.quality,
                updatedState.risk,
                updatedState.bugs,
                updatedState.technical_debt,
                updatedState.team_morale,
                updatedState.customer_satisfaction,
                newStage,
                sessionId
            ],
            (updateErr) => {
                if (updateErr) {
                    console.error("Update simulation failed:", updateErr);

                    return res.status(500).json({
                        error: "Failed to update simulation"
                    });
                }

                res.json({
                    message: "Decision processed successfully!",
                    decision: decisionResult.decision,
                    updatedState: updatedState,
                    nextStage: newStage
                });
            }
        );
    });
});

// ==================== UPDATE STAGE ====================

app.put("/api/simulations/:sessionId/stage", (req, res) => {
    const sessionId = req.params.sessionId;
    const { stage } = req.body;

    if (!stage) {
        return res.status(400).json({
            error: "Stage is required"
        });
    }

    db.query(
        "UPDATE simulation_sessions SET current_stage = ? WHERE id = ?",
        [stage, sessionId],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: "Failed to update simulation stage"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Simulation not found"
                });
            }

            res.json({
                message: "Simulation stage updated!",
                stage: stage
            });
        }
    );
});

// ==================== COMPLETE SIMULATION ====================

app.post("/api/simulations/:sessionId/complete", (req, res) => {
    const sessionId = req.params.sessionId;

    const getSql = `
        SELECT
            s.budget,
            s.remaining_weeks,
            s.quality,
            s.risk,
            s.customer_satisfaction,
            s.technical_debt,
            sc.budget AS initial_budget,
            sc.duration_weeks AS initial_duration
        FROM simulation_sessions s
        JOIN scenarios sc ON s.scenario_id = sc.id
        WHERE s.id = ?
    `;

    db.query(getSql, [sessionId], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: "Failed to fetch simulation"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Simulation not found"
            });
        }

        const simulation = results[0];

        const budgetPerformance = Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    (simulation.budget / simulation.initial_budget) * 100
                )
            )
        );

        const schedulePerformance = Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    (simulation.remaining_weeks / simulation.initial_duration) * 100
                )
            )
        );

        const qualityScore = simulation.quality;

        const riskManagement = Math.max(
            0,
            Math.min(100, 100 - simulation.risk)
        );

        const customerSatisfaction = simulation.customer_satisfaction;

        const technicalDebtScore = Math.max(
            0,
            Math.min(100, 100 - simulation.technical_debt * 5)
        );

        const insertSql = `
            INSERT INTO simulation_results
            (
                session_id,
                budget_performance,
                schedule_performance,
                quality_score,
                risk_management,
                customer_satisfaction,
                technical_debt_score
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            insertSql,
            [
                sessionId,
                budgetPerformance,
                schedulePerformance,
                qualityScore,
                riskManagement,
                customerSatisfaction,
                technicalDebtScore
            ],
            (insertErr) => {
                if (insertErr) {
                    console.error("Save result failed:", insertErr);

                    return res.status(500).json({
                        error: "Failed to save simulation result"
                    });
                }

                db.query(
                    "UPDATE simulation_sessions SET status = 'COMPLETED' WHERE id = ?",
                    [sessionId],
                    (updateErr) => {
                        if (updateErr) {
                            return res.status(500).json({
                                error: "Failed to complete simulation"
                            });
                        }

                        res.json({
                            message: "Simulation completed!",
                            result: {
                                budget_performance: budgetPerformance,
                                schedule_performance: schedulePerformance,
                                quality_score: qualityScore,
                                risk_management: riskManagement,
                                customer_satisfaction: customerSatisfaction,
                                technical_debt_score: technicalDebtScore
                            }
                        });
                    }
                );
            }
        );
    });
});

// ==================== GET RESULTS ====================

app.get("/api/results/:sessionId", (req, res) => {
    const sessionId = req.params.sessionId;

    db.query(
        "SELECT * FROM simulation_results WHERE session_id = ? ORDER BY id DESC LIMIT 1",
        [sessionId],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    error: "Failed to fetch result"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error: "Result not found"
                });
            }

            res.json(results[0]);
        }
    );
});

// ==================== AI ANALYSIS ====================

app.get("/api/ai-analysis/:sessionId", (req, res) => {
    const sessionId = req.params.sessionId;

    db.query(
        "SELECT * FROM simulation_sessions WHERE id = ?",
        [sessionId],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    error: "Failed to fetch project state"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error: "Simulation not found"
                });
            }

            const state = results[0];

            const analysis = analyzeProjectState(state);
            const predictedRisk = predictProjectRisk(state);

            res.json({
                risk_level: analysis.riskLevel,
                predicted_risk: predictedRisk,
                recommendations: analysis.recommendations
            });
        }
    );
});

// ==================== SIMULATION HISTORY ====================

app.get("/api/users/:userId/simulations", (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            error: "Invalid user ID"
        });
    }

    const sql = `
        SELECT
            s.id AS session_id,
            s.scenario_id,
            sc.name AS scenario_name,
            s.current_stage,
            s.status,
            s.created_at,
            s.budget,
            s.remaining_weeks,
            s.quality,
            s.risk,
            s.customer_satisfaction,
            r.budget_performance,
            r.schedule_performance,
            r.quality_score,
            r.risk_management,
            r.technical_debt_score
        FROM simulation_sessions s
        JOIN scenarios sc ON sc.id = s.scenario_id
        LEFT JOIN simulation_results r ON r.session_id = s.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("History query failed:", err);

            return res.status(500).json({
                error: "Failed to fetch simulation history"
            });
        }

        res.json(results);
    });
});

// ==================== ANALYTICS ====================

app.get("/api/users/:userId/analytics", (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            error: "Invalid user ID"
        });
    }

    const sql = `
        SELECT
            s.id AS session_id,
            s.scenario_id,
            sc.name AS scenario_name,
            s.created_at,
            r.budget_performance,
            r.schedule_performance,
            r.quality_score,
            r.risk_management,
            r.customer_satisfaction,
            r.technical_debt_score
        FROM simulation_sessions s
        JOIN scenarios sc
            ON sc.id = s.scenario_id
        JOIN simulation_results r
            ON r.session_id = s.id
        WHERE s.user_id = ?
          AND UPPER(s.status) = 'COMPLETED'
        ORDER BY s.created_at ASC, s.id ASC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Analytics query failed:", err);

            return res.status(500).json({
                error: "Failed to fetch analytics"
            });
        }

        res.json(results);
    });
});

/* =====================================================
   ADMIN DASHBOARD AND MANAGEMENT APIs
   All routes below require a valid ADMIN token.
===================================================== */

// ==================== DASHBOARD STATISTICS ====================

app.get(
    "/api/admin/dashboard",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const [userCount] = await db.promise().query(
                "SELECT COUNT(*) AS total FROM users"
            );

            const [scenarioCount] = await db.promise().query(
                "SELECT COUNT(*) AS total FROM scenarios"
            );

            const [simulationCount] = await db.promise().query(
                "SELECT COUNT(*) AS total FROM simulation_sessions"
            );

            const [completedCount] = await db.promise().query(
                `SELECT COUNT(*) AS total
                 FROM simulation_sessions
                 WHERE UPPER(status) = 'COMPLETED'`
            );

            const [recentActivity] = await db.promise().query(
                `SELECT
                    ss.id AS session_id,
                    u.name AS user_name,
                    u.email,
                    sc.name AS scenario_name,
                    ss.status,
                    ss.current_stage,
                    ss.created_at
                 FROM simulation_sessions ss
                 JOIN users u ON u.id = ss.user_id
                 JOIN scenarios sc ON sc.id = ss.scenario_id
                 ORDER BY ss.created_at DESC
                 LIMIT 10`
            );

            res.json({
                totalUsers: userCount[0].total,
                totalScenarios: scenarioCount[0].total,
                totalSimulations: simulationCount[0].total,
                completedSimulations: completedCount[0].total,
                recentActivity
            });
        } catch (error) {
            console.error("Admin dashboard error:", error);

            res.status(500).json({
                error: "Failed to load admin dashboard"
            });
        }
    }
);

// ==================== USER MANAGEMENT ====================

app.get(
    "/api/admin/users",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const [users] = await db.promise().query(
                `SELECT
                    u.id,
                    u.name,
                    u.email,
                    u.role,
                    COUNT(ss.id) AS total_simulations
                 FROM users u
                 LEFT JOIN simulation_sessions ss
                    ON ss.user_id = u.id
                 GROUP BY u.id, u.name, u.email, u.role
                 ORDER BY u.id DESC`
            );

            res.json(users);
        } catch (error) {
            console.error("Fetch users error:", error);

            res.status(500).json({
                error: "Failed to fetch users"
            });
        }
    }
);

// Update a user's role
app.put(
    "/api/admin/users/:id/role",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const userId = Number(req.params.id);
            const { role } = req.body;

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({
                    error: "Invalid user ID"
                });
            }

            if (!["USER", "ADMIN"].includes(role)) {
                return res.status(400).json({
                    error: "Role must be USER or ADMIN"
                });
            }

            if (userId === req.user.id && role !== "ADMIN") {
                return res.status(400).json({
                    error: "You cannot remove your own admin role"
                });
            }

            const [result] = await db.promise().query(
                "UPDATE users SET role = ? WHERE id = ?",
                [role, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            res.json({
                message: "User role updated successfully",
                userId,
                role
            });
        } catch (error) {
            console.error("Update role error:", error);

            res.status(500).json({
                error: "Failed to update user role"
            });
        }
    }
);

// ==================== SCENARIO MANAGEMENT ====================

// List all scenarios for admin
app.get(
    "/api/admin/scenarios",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const [scenarios] = await db.promise().query(
                "SELECT * FROM scenarios ORDER BY id DESC"
            );

            res.json(scenarios);
        } catch (error) {
            console.error("Admin scenarios error:", error);

            res.status(500).json({
                error: "Failed to fetch scenarios"
            });
        }
    }
);

// Create scenario
app.post(
    "/api/admin/scenarios",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const {
                name,
                description,
                difficulty,
                budget,
                duration_weeks,
                team_size,
                initial_risk,
                initial_quality,
                initial_customer_satisfaction
            } = req.body;

            if (
                !name ||
                !difficulty ||
                budget == null ||
                duration_weeks == null ||
                team_size == null ||
                initial_risk == null ||
                initial_quality == null ||
                initial_customer_satisfaction == null
            ) {
                return res.status(400).json({
                    error: "Please provide all required scenario fields"
                });
            }

            const [result] = await db.promise().query(
                `INSERT INTO scenarios (
                    name, description, difficulty, budget,
                    duration_weeks, team_size, initial_risk,
                    initial_quality, initial_customer_satisfaction
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name,
                    description || "",
                    difficulty,
                    budget,
                    duration_weeks,
                    team_size,
                    initial_risk,
                    initial_quality,
                    initial_customer_satisfaction
                ]
            );

            res.status(201).json({
                message: "Scenario created successfully",
                scenarioId: result.insertId
            });
        } catch (error) {
            console.error("Create scenario error:", error);

            res.status(500).json({
                error: "Failed to create scenario"
            });
        }
    }
);

// Update scenario
app.put(
    "/api/admin/scenarios/:id",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const scenarioId = Number(req.params.id);

            if (!Number.isInteger(scenarioId) || scenarioId <= 0) {
                return res.status(400).json({
                    error: "Invalid scenario ID"
                });
            }

            const fields = [
                "name",
                "description",
                "difficulty",
                "budget",
                "duration_weeks",
                "team_size",
                "initial_risk",
                "initial_quality",
                "initial_customer_satisfaction"
            ];

            const updates = [];
            const values = [];

            for (const field of fields) {
                if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                    updates.push(`${field} = ?`);
                    values.push(req.body[field]);
                }
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    error: "No scenario fields provided"
                });
            }

            values.push(scenarioId);

            const [result] = await db.promise().query(
                `UPDATE scenarios
                 SET ${updates.join(", ")}
                 WHERE id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                const [existing] = await db.promise().query(
                    "SELECT id FROM scenarios WHERE id = ?",
                    [scenarioId]
                );

                if (existing.length === 0) {
                    return res.status(404).json({
                        error: "Scenario not found"
                    });
                }
            }

            res.json({
                message: "Scenario updated successfully"
            });
        } catch (error) {
            console.error("Update scenario error:", error);

            res.status(500).json({
                error: "Failed to update scenario"
            });
        }
    }
);

// Delete scenario
app.delete(
    "/api/admin/scenarios/:id",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const scenarioId = Number(req.params.id);

            if (!Number.isInteger(scenarioId) || scenarioId <= 0) {
                return res.status(400).json({
                    error: "Invalid scenario ID"
                });
            }

            const [result] = await db.promise().query(
                "DELETE FROM scenarios WHERE id = ?",
                [scenarioId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Scenario not found"
                });
            }

            res.json({
                message: "Scenario deleted successfully"
            });
        } catch (error) {
            console.error("Delete scenario error:", error);

            res.status(409).json({
                error: "Scenario could not be deleted. It may be linked to existing events or simulations."
            });
        }
    }
);

// ==================== EVENT MANAGEMENT ====================

// List events and their decisions for a scenario
app.get(
    "/api/admin/scenarios/:scenarioId/events",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const scenarioId = Number(req.params.scenarioId);

            if (!Number.isInteger(scenarioId) || scenarioId <= 0) {
                return res.status(400).json({
                    error: "Invalid scenario ID"
                });
            }

            const [events] = await db.promise().query(
                `SELECT
                    e.id AS event_id,
                    e.scenario_id,
                    e.stage,
                    e.title,
                    e.description,
                    d.id AS decision_id,
                    d.option_text,
                    d.budget_change,
                    d.time_change,
                    d.quality_change,
                    d.risk_change,
                    d.bugs_change,
                    d.technical_debt_change,
                    d.morale_change,
                    d.customer_change
                 FROM events e
                 LEFT JOIN decisions d ON d.event_id = e.id
                 WHERE e.scenario_id = ?
                 ORDER BY e.id, d.id`,
                [scenarioId]
            );

            res.json(events);
        } catch (error) {
            console.error("Admin events error:", error);

            res.status(500).json({
                error: "Failed to fetch events"
            });
        }
    }
);

// Create event
app.post(
    "/api/admin/events",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const {
                scenario_id,
                stage,
                title,
                description
            } = req.body;

            if (!scenario_id || !stage || !title) {
                return res.status(400).json({
                    error: "Scenario, stage and title are required"
                });
            }

            const [result] = await db.promise().query(
                `INSERT INTO events
                    (scenario_id, stage, title, description)
                 VALUES (?, ?, ?, ?)`,
                [
                    scenario_id,
                    stage,
                    title,
                    description || ""
                ]
            );

            res.status(201).json({
                message: "Event created successfully",
                eventId: result.insertId
            });
        } catch (error) {
            console.error("Create event error:", error);

            res.status(500).json({
                error: "Failed to create event"
            });
        }
    }
);

// Update event
app.put(
    "/api/admin/events/:id",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const eventId = Number(req.params.id);
            const fields = ["stage", "title", "description"];
            const updates = [];
            const values = [];

            if (!Number.isInteger(eventId) || eventId <= 0) {
                return res.status(400).json({
                    error: "Invalid event ID"
                });
            }

            for (const field of fields) {
                if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                    updates.push(`${field} = ?`);
                    values.push(req.body[field]);
                }
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    error: "No event fields provided"
                });
            }

            values.push(eventId);

            const [result] = await db.promise().query(
                `UPDATE events SET ${updates.join(", ")} WHERE id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                const [existing] = await db.promise().query(
                    "SELECT id FROM events WHERE id = ?",
                    [eventId]
                );

                if (existing.length === 0) {
                    return res.status(404).json({
                        error: "Event not found"
                    });
                }
            }

            res.json({
                message: "Event updated successfully"
            });
        } catch (error) {
            console.error("Update event error:", error);

            res.status(500).json({
                error: "Failed to update event"
            });
        }
    }
);

// Delete event
app.delete(
    "/api/admin/events/:id",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const eventId = Number(req.params.id);

            if (!Number.isInteger(eventId) || eventId <= 0) {
                return res.status(400).json({
                    error: "Invalid event ID"
                });
            }

            const [result] = await db.promise().query(
                "DELETE FROM events WHERE id = ?",
                [eventId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Event not found"
                });
            }

            res.json({
                message: "Event deleted successfully"
            });
        } catch (error) {
            console.error("Delete event error:", error);

            res.status(409).json({
                error: "Event could not be deleted. It may have linked decisions."
            });
        }
    }
);

// ==================== DECISION MANAGEMENT ====================

// Create a decision option for an event
app.post(
    "/api/admin/events/:eventId/decisions",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const eventId = Number(req.params.eventId);

            const {
                option_text,
                budget_change = 0,
                time_change = 0,
                quality_change = 0,
                risk_change = 0,
                bugs_change = 0,
                technical_debt_change = 0,
                morale_change = 0,
                customer_change = 0
            } = req.body;

            if (!Number.isInteger(eventId) || eventId <= 0) {
                return res.status(400).json({
                    error: "Invalid event ID"
                });
            }

            if (!option_text) {
                return res.status(400).json({
                    error: "Decision option text is required"
                });
            }

            const [result] = await db.promise().query(
                `INSERT INTO decisions (
                    event_id, option_text, budget_change, time_change,
                    quality_change, risk_change, bugs_change,
                    technical_debt_change, morale_change, customer_change
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    eventId,
                    option_text,
                    budget_change,
                    time_change,
                    quality_change,
                    risk_change,
                    bugs_change,
                    technical_debt_change,
                    morale_change,
                    customer_change
                ]
            );

            res.status(201).json({
                message: "Decision created successfully",
                decisionId: result.insertId
            });
        } catch (error) {
            console.error("Create decision error:", error);

            res.status(500).json({
                error: "Failed to create decision"
            });
        }
    }
);

// Update a decision and its consequences
app.put(
    "/api/admin/decisions/:id",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const decisionId = Number(req.params.id);

            const fields = [
                "option_text",
                "budget_change",
                "time_change",
                "quality_change",
                "risk_change",
                "bugs_change",
                "technical_debt_change",
                "morale_change",
                "customer_change"
            ];

            const updates = [];
            const values = [];

            if (!Number.isInteger(decisionId) || decisionId <= 0) {
                return res.status(400).json({
                    error: "Invalid decision ID"
                });
            }

            for (const field of fields) {
                if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                    updates.push(`${field} = ?`);
                    values.push(req.body[field]);
                }
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    error: "No decision fields provided"
                });
            }

            values.push(decisionId);

            const [result] = await db.promise().query(
                `UPDATE decisions SET ${updates.join(", ")} WHERE id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                const [existing] = await db.promise().query(
                    "SELECT id FROM decisions WHERE id = ?",
                    [decisionId]
                );

                if (existing.length === 0) {
                    return res.status(404).json({
                        error: "Decision not found"
                    });
                }
            }

            res.json({
                message: "Decision updated successfully"
            });
        } catch (error) {
            console.error("Update decision error:", error);

            res.status(500).json({
                error: "Failed to update decision"
            });
        }
    }
);

// Delete a decision
app.delete(
    "/api/admin/decisions/:id",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const decisionId = Number(req.params.id);

            if (!Number.isInteger(decisionId) || decisionId <= 0) {
                return res.status(400).json({
                    error: "Invalid decision ID"
                });
            }

            const [result] = await db.promise().query(
                "DELETE FROM decisions WHERE id = ?",
                [decisionId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Decision not found"
                });
            }

            res.json({
                message: "Decision deleted successfully"
            });
        } catch (error) {
            console.error("Delete decision error:", error);

            res.status(500).json({
                error: "Failed to delete decision"
            });
        }
    }
);

// ==================== ALL SIMULATION RESULTS ====================

app.get(
    "/api/admin/results",
    verifyToken,
    requireAdmin,
    async (req, res) => {
        try {
            const [results] = await db.promise().query(
                `SELECT
                    ss.id AS session_id,
                    ss.status,
                    ss.current_stage,
                    ss.created_at,
                    u.id AS user_id,
                    u.name AS user_name,
                    u.email,
                    sc.id AS scenario_id,
                    sc.name AS scenario_name,
                    sr.budget_performance,
                    sr.schedule_performance,
                    sr.quality_score,
                    sr.risk_management,
                    sr.customer_satisfaction,
                    sr.technical_debt_score,
                    sr.completed_at
                 FROM simulation_sessions ss
                 JOIN users u ON u.id = ss.user_id
                 JOIN scenarios sc ON sc.id = ss.scenario_id
                 LEFT JOIN simulation_results sr
                    ON sr.session_id = ss.id
                 ORDER BY ss.created_at DESC`
            );

            res.json(results);
        } catch (error) {
            console.error("Admin results error:", error);

            res.status(500).json({
                error: "Failed to fetch simulation results"
            });
        }
    }
);

// ==================== START SERVER ====================

const PORT = 5001;

app.listen(PORT, () => {
    console.log(
        `SEQuest backend running on http://localhost:${PORT}`
    );
});
