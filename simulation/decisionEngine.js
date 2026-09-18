const { applyDecision } = require("./projectState");

function processDecision(currentState, decision) {
    const updatedState = applyDecision(
        currentState,
        decision
    );

    return {
        previousState: currentState,
        decision: decision.option_text,
        updatedState: updatedState
    };
}

module.exports = {
    processDecision
};