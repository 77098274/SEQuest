function createProjectState(scenario) {
    return {
        budget: Number(scenario.budget),
        remaining_weeks: Number(scenario.duration_weeks),
        quality: Number(scenario.initial_quality),
        risk: Number(scenario.initial_risk),
        bugs: 0,
        technical_debt: 0,
        team_morale: 70,
        customer_satisfaction: Number(
            scenario.initial_customer_satisfaction
        ),
        current_stage: "Requirements",
        status: "ACTIVE"
    };
}

function applyDecision(state, decision) {
    return {
        ...state,
        budget: Math.max(
            0,
            state.budget + Number(decision.budget_change || 0)
        ),

        remaining_weeks: Math.max(
            0,
            state.remaining_weeks + Number(decision.time_change || 0)
        ),

        quality: Math.min(
            100,
            Math.max(
                0,
                state.quality + Number(decision.quality_change || 0)
            )
        ),

        risk: Math.min(
            100,
            Math.max(
                0,
                state.risk + Number(decision.risk_change || 0)
            )
        ),

        bugs: Math.max(
            0,
            state.bugs + Number(decision.bugs_change || 0)
        ),

        technical_debt: Math.max(
            0,
            state.technical_debt +
                Number(decision.technical_debt_change || 0)
        ),

        team_morale: Math.min(
            100,
            Math.max(
                0,
                state.team_morale +
                    Number(decision.morale_change || 0)
            )
        ),

        customer_satisfaction: Math.min(
            100,
            Math.max(
                0,
                state.customer_satisfaction +
                    Number(decision.customer_change || 0)
            )
        )
    };
}

module.exports = {
    createProjectState,
    applyDecision
};