function analyzeProjectState(state) {
    const recommendations = [];
    let riskLevel = "Low";

    if (state.risk >= 70) {
        riskLevel = "High";
        recommendations.push(
            "Reduce project risk by addressing high-risk activities."
        );
    } else if (state.risk >= 40) {
        riskLevel = "Medium";
        recommendations.push(
            "Monitor project risks and prepare mitigation plans."
        );
    } else {
        recommendations.push(
            "Current project risk is under control."
        );
    }

    if (state.quality < 60) {
        recommendations.push(
            "Improve software quality through additional testing."
        );
    }

    if (state.bugs > 3) {
        recommendations.push(
            "Prioritize fixing critical bugs before continuing."
        );
    }

    if (state.technical_debt > 5) {
        recommendations.push(
            "Reduce technical debt through refactoring and code cleanup."
        );
    }

    if (state.team_morale < 50) {
        recommendations.push(
            "Consider workload balancing to improve team morale."
        );
    }

    if (state.customer_satisfaction < 60) {
        recommendations.push(
            "Review customer requirements and improve communication."
        );
    }

    return {
        riskLevel,
        recommendations
    };
}

module.exports = {
    analyzeProjectState
};