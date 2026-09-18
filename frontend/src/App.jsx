import { useEffect, useState } from "react";

function App() {
  const [scenarios, setScenarios] = useState([]);
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [result, setResult] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const stages = [
    "Requirements",
    "Design",
    "Development",
    "Testing",
    "Deployment",
    "Maintenance"
  ];

  useEffect(() => {
    fetch("http://localhost:5001/api/scenarios")
      .then((response) => response.json())
      .then((data) => setScenarios(data))
      .catch(() => {
        setMessage("Failed to load scenarios");
      });
  }, []);

  const startSimulation = (scenarioId) => {
    setResult(null);
    setAiAnalysis(null);
    setEvent(null);

    fetch("http://localhost:5001/api/simulations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: 1,
        scenario_id: scenarioId
      })
    })
      .then((response) => response.json())
      .then((data) => {
        setSessionId(data.session_id);
        setMessage(
          `Simulation started! Session ID: ${data.session_id}`
        );

        return fetch(
          `http://localhost:5001/api/simulations/${data.session_id}`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        setSimulation(data);

        return fetch(
          `http://localhost:5001/api/events/${data.scenario_id}/Requirements`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        setEvent(data);
      })
      .catch(() => {
        setMessage("Failed to start simulation");
      });
  };

  const makeDecision = (decisionId) => {
    fetch(
      `http://localhost:5001/api/decisions/${sessionId}/${decisionId}`,
      {
        method: "POST"
      }
    )
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);

        return fetch(
          `http://localhost:5001/api/simulations/${sessionId}`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        setSimulation(data);

        const currentIndex = stages.indexOf(
          data.current_stage
        );

        if (currentIndex < stages.length - 1) {
          const nextStage =
            stages[currentIndex + 1];

          return fetch(
            `http://localhost:5001/api/events/${sessionId ? data.scenario_id : ""}/${nextStage}`
          )
            .then((response) => response.json())
            .then((nextEvent) => {
              setEvent(nextEvent);
            });
        }

        return completeSimulation();
      })
      .catch(() => {
        setMessage("Failed to apply decision");
      });
  };

  const completeSimulation = () => {
    return fetch(
      `http://localhost:5001/api/simulations/${sessionId}/complete`,
      {
        method: "POST"
      }
    )
      .then((response) => response.json())
      .then((data) => {
        setResult(data.result);
        setEvent(null);
        setMessage(data.message);

        return fetch(
          `http://localhost:5001/api/ai-analysis/${sessionId}`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        setAiAnalysis(data);
      })
      .catch(() => {
        setMessage("Simulation completed but AI analysis failed");
      });
  };

  return (
    <div>
      <h1>SEQuest</h1>
      <h2>Software Engineering Learning Simulator</h2>

      {!event && !result && (
        <>
          <h3>Select a Scenario</h3>

          {scenarios.map((scenario) => (
            <div key={scenario.id}>
              <h3>{scenario.name}</h3>

              <p>{scenario.description}</p>

              <p>
                Difficulty: {scenario.difficulty}
              </p>

              <p>
                Budget: ₹{scenario.budget}
              </p>

              <p>
                Duration: {scenario.duration_weeks} weeks
              </p>

              <p>
                Team Size: {scenario.team_size}
              </p>

              <button
                onClick={() =>
                  startSimulation(scenario.id)
                }
              >
                Start Simulation
              </button>

              <hr />
            </div>
          ))}
        </>
      )}

      {event && (
        <div>
          {simulation && (
            <div>
              <h2>Current Project State</h2>

              <p>
                📌 Stage: {simulation.current_stage}
              </p>

              <p>
                💰 Budget: ₹{simulation.budget}
              </p>

              <p>
                ⏳ Remaining Weeks:{" "}
                {simulation.remaining_weeks}
              </p>

              <p>
                ⭐ Quality: {simulation.quality}
              </p>

              <p>
                ⚠️ Risk: {simulation.risk}
              </p>

              <p>
                🐛 Bugs: {simulation.bugs}
              </p>

              <p>
                🔧 Technical Debt:{" "}
                {simulation.technical_debt}
              </p>

              <p>
                👥 Team Morale:{" "}
                {simulation.team_morale}
              </p>

              <p>
                😊 Customer Satisfaction:{" "}
                {simulation.customer_satisfaction}
              </p>

              <hr />
            </div>
          )}

          <h2>{event[0]?.title}</h2>

          <p>{event[0]?.description}</p>

          <h3>Make Your Decision</h3>

          {event.map((decision) => (
            <div key={decision.decision_id}>
              <button
                onClick={() =>
                  makeDecision(decision.decision_id)
                }
              >
                {decision.option_text}
              </button>

              <hr />
            </div>
          ))}
        </div>
      )}

      {result && (
        <div>
          <h2>🎉 Simulation Completed!</h2>

          <h3>Final Project Performance</h3>

          <p>
            💰 Budget Performance:{" "}
            {result.budget_performance}/100
          </p>

          <p>
            ⏳ Schedule Performance:{" "}
            {result.schedule_performance}/100
          </p>

          <p>
            ⭐ Quality Score:{" "}
            {result.quality_score}/100
          </p>

          <p>
            ⚠️ Risk Management:{" "}
            {result.risk_management}/100
          </p>

          <p>
            😊 Customer Satisfaction:{" "}
            {result.customer_satisfaction}/100
          </p>

          <p>
            🔧 Technical Debt Score:{" "}
            {result.technical_debt_score}/100
          </p>

          {aiAnalysis && (
            <div>
              <hr />

              <h2>🤖 AI Project Analysis</h2>

              <p>
                <strong>Risk Level:</strong>{" "}
                {aiAnalysis.risk_level}
              </p>

              <p>
                <strong>Predicted Risk:</strong>{" "}
                {aiAnalysis.predicted_risk}
              </p>

              <h3>AI Recommendations</h3>

              <ul>
                {aiAnalysis.recommendations.map(
                  (recommendation, index) => (
                    <li key={index}>
                      {recommendation}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <h3>{message}</h3>
    </div>
  );
}

export default App;