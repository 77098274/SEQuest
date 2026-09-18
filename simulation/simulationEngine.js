const stages = [
    "Requirements",
    "Design",
    "Development",
    "Testing",
    "Deployment",
    "Maintenance"
];

function getNextStage(currentStage) {
    const currentIndex = stages.indexOf(currentStage);

    if (
        currentIndex === -1 ||
        currentIndex === stages.length - 1
    ) {
        return null;
    }

    return stages[currentIndex + 1];
}

function isSimulationComplete(currentStage) {
    return currentStage === "Maintenance";
}

function getStageNumber(currentStage) {
    const index = stages.indexOf(currentStage);

    if (index === -1) {
        return 0;
    }

    return index + 1;
}

module.exports = {
    stages,
    getNextStage,
    isSimulationComplete,
    getStageNumber
};