function ScenarioCard({ scenario, onStart }) {
  return (
    <div className="scenario-card">
      <div className="scenario-top">
        <span
          className={`difficulty ${scenario.difficulty.toLowerCase()}`}
        >
          {scenario.difficulty}
        </span>

        <span>#{scenario.id}</span>
      </div>

      <h3>{scenario.name}</h3>

      <p>{scenario.description}</p>

      <div className="scenario-info">
        <div>
          <span>Budget</span>
          <strong>
            ₹{Number(scenario.budget).toLocaleString("en-IN")}
          </strong>
        </div>

        <div>
          <span>Duration</span>
          <strong>{scenario.duration_weeks} weeks</strong>
        </div>

        <div>
          <span>Team</span>
          <strong>{scenario.team_size} members</strong>
        </div>
      </div>

      <button
        className="primary-button"
        onClick={() => onStart(scenario.id)}
      >
        Start Simulation →
      </button>
    </div>
  );
}

export default ScenarioCard;