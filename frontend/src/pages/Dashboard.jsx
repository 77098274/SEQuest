import ScenarioCard from "../components/ScenarioCard";

function Dashboard({ scenarios, onStartSimulation }) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            SOFTWARE PROJECT SIMULATION
          </p>

          <h2>
            Make decisions.
            <br />
            Manage your project.
          </h2>

          <p>
            Experience the software development
            lifecycle and see how your decisions
            affect budget, quality, risk and
            customer satisfaction.
          </p>
        </div>

        <div className="hero-icon">
          🎯
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              CHOOSE YOUR CHALLENGE
            </p>

            <h2>Project Scenarios</h2>
          </div>

          <span className="scenario-count">
            {scenarios.length} scenarios
          </span>
        </div>

        <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onStart={onStartSimulation}
            />
          ))}
        </div>
      </section>
    </>
  );
}

export default Dashboard;