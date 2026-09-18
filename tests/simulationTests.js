const {
    createProjectState,
    applyDecision
} = require("../simulation/projectState");

const {
    getNextStage,
    isSimulationComplete
} = require("../simulation/simulationEngine");

const scenario = {
    budget: 200000,
    duration_weeks: 16,
    initial_quality: 65,
    initial_risk: 45,
    initial_customer_satisfaction: 70
};

const decision = {
    budget_change: -10000,
    time_change: -2,
    quality_change: 5,
    risk_change: -5,
    bugs_change: 0,
    technical_debt_change: 0,
    morale_change: 5,
    customer_change: 10
};

const state = createProjectState(scenario);
const updatedState = applyDecision(state, decision);

console.assert(
    state.budget === 200000,
    "Initial budget test failed"
);

console.assert(
    updatedState.budget === 190000,
    "Decision budget test failed"
);

console.assert(
    updatedState.quality === 70,
    "Decision quality test failed"
);

console.assert(
    getNextStage("Requirements") === "Design",
    "Next stage test failed"
);

console.assert(
    getNextStage("Testing") === "Deployment",
    "Stage progression test failed"
);

console.assert(
    isSimulationComplete("Maintenance") === true,
    "Completion test failed"
);

console.log("All simulation tests passed!");