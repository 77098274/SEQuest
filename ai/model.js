function predictProjectRisk(state) {
    let score = 0;

    if (state.risk >= 60) {
        score += 3;
    } else if (state.risk >= 40) {
        score += 2;
    } else {
        score += 1;
    }

    if (state.bugs >= 3) {
        score += 2;
    }

    if (state.technical_debt >= 5) {
        score += 2;
    }

    if (state.quality < 60) {
        score += 2;
    }

    if (state.customer_satisfaction < 60) {
        score += 1;
    }

    if (score >= 7) {
        return "High Risk";
    }

    if (score >= 4) {
        return "Medium Risk";
    }

    return "Low Risk";
}

module.exports = {
    predictProjectRisk
};