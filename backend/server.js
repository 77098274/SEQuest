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

app.use(cors());
app.use(express.json());

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

app.post("/api/simulations", (req, res) => {
    const { user_id, scenario_id } = req.body;

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
            return res.status(500).json({
                error: "Failed to create simulation"
            });
        }

        res.json({
            message: "Simulation started!",
            session_id: result.insertId
        });
    });
});

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
        JOIN decisions d
        ON e.id = d.event_id
        WHERE e.scenario_id = ?
        AND e.stage = ?
    `;

    db.query(sql, [scenarioId, stage], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: "Failed to fetch events"
            });
        }

        res.json(results);
    });
});

app.post("/api/decisions/:sessionId/:decisionId", (req, res) => {
    const sessionId = req.params.sessionId;
    const decisionId = req.params.decisionId;

    const getSql = `
        SELECT s.*, d.*
        FROM simulation_sessions s
        JOIN decisions d
        ON d.id = ?
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

        const nextStage = getNextStage(
            currentState.current_stage
        );

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

app.put("/api/simulations/:sessionId/stage", (req, res) => {
    const sessionId = req.params.sessionId;
    const { stage } = req.body;

    db.query(
        "UPDATE simulation_sessions SET current_stage = ? WHERE id = ?",
        [stage, sessionId],
        (err) => {
            if (err) {
                return res.status(500).json({
                    error: "Failed to update simulation stage"
                });
            }

            res.json({
                message: "Simulation stage updated!",
                stage: stage
            });
        }
    );
});

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
        JOIN scenarios sc
        ON s.scenario_id = sc.id
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
                    (simulation.budget /
                        simulation.initial_budget) *
                        100
                )
            )
        );

        const schedulePerformance = Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    (simulation.remaining_weeks /
                        simulation.initial_duration) *
                        100
                )
            )
        );

        const qualityScore = simulation.quality;

        const riskManagement = Math.max(
            0,
            Math.min(
                100,
                100 - simulation.risk
            )
        );

        const customerSatisfaction =
            simulation.customer_satisfaction;

        const technicalDebtScore = Math.max(
            0,
            Math.min(
                100,
                100 -
                    simulation.technical_debt * 5
            )
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
                                budget_performance:
                                    budgetPerformance,
                                schedule_performance:
                                    schedulePerformance,
                                quality_score:
                                    qualityScore,
                                risk_management:
                                    riskManagement,
                                customer_satisfaction:
                                    customerSatisfaction,
                                technical_debt_score:
                                    technicalDebtScore
                            }
                        });
                    }
                );
            }
        );
    });
});

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

const PORT = 5001;

app.listen(PORT, () => {
    console.log(
        `SEQuest backend running on http://localhost:${PORT}`
    );
});