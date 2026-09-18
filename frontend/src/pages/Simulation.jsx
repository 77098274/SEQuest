import MetricCard from "../components/MetricCard";
import DecisionCard from "../components/DecisionCard";
import { stages } from "../data/scenarios";

function Simulation({
  simulation,
  event,
  sessionId,
  result,
  aiAnalysis,
  user,
  onDecision,
  onRestart
}) {
  if (result) {
    return (
      <>
        <section className="results-hero">
          <div className="success-icon">
            ✓
          </div>

          <p className="eyebrow">
            SIMULATION COMPLETE
          </p>

          <h2>Project Results</h2>

          <p>
            Great work, {user.name}! Here's how
            your project performed.
          </p>
        </section>

        <div className="results-grid">
          <Result
            label="Budget Performance"
            value={result.budget_performance}
            icon="💰"
          />

          <Result
            label="Schedule Performance"
            value={result.schedule_performance}
            icon="⏳"
          />

          <Result
            label="Quality Score"
            value={result.quality_score}
            icon="⭐"
          />

          <Result
            label="Risk Management"
            value={result.risk_management}
            icon="⚠️"
          />

          <Result
            label="Customer Satisfaction"
            value={result.customer_satisfaction}
            icon="😊"
          />

          <Result
            label="Technical Debt Score"
            value={result.technical_debt_score}
            icon="🔧"
          />
        </div>

        {aiAnalysis && (
          <section className="ai-card">
            <div className="ai-title">
              <div className="ai-icon">
                🤖
              </div>

              <div>
                <p className="eyebrow">
                  AI ANALYSIS
                </p>

                <h2>
                  Project Risk Assessment
                </h2>
              </div>
            </div>

            <div className="risk-box">
              <span>Risk Level</span>

              <strong>
                {aiAnalysis.risk_level}
              </strong>

              <small>
                Predicted Risk:{" "}
                {aiAnalysis.predicted_risk}
              </small>
            </div>

            <h3>
              AI Recommendations
            </h3>

            <div className="recommendations">
              {aiAnalysis.recommendations.map(
                (recommendation, index) => (
                  <div
                    className="recommendation"
                    key={index}
                  >
                    <span>✓</span>

                    <p>
                      {recommendation}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        <button
          className="primary-button restart-button"
          onClick={onRestart}
        >
          ← Back to Scenarios
        </button>
      </>
    );
  }

  if (!event || !simulation) {
    return null;
  }

  const currentIndex = stages.indexOf(
    simulation.current_stage
  );

  return (
    <>
      <section className="simulation-header">
        <div>
          <p className="eyebrow">
            ACTIVE SIMULATION
          </p>

          <h2>Project Dashboard</h2>
        </div>

        <div className="session-badge">
          Session #{sessionId}
        </div>
      </section>

      <div className="stage-bar">
        {stages.map((stage, index) => (
          <div
            className={
              index <= currentIndex
                ? "stage active"
                : "stage"
            }
            key={stage}
          >
            <span>{index + 1}</span>

            <small>{stage}</small>
          </div>
        ))}
      </div>

      <div className="metrics-grid">
        <MetricCard
          icon="💰"
          label="Budget"
          value={`₹${Number(
            simulation.budget
          ).toLocaleString("en-IN")}`}
        />

        <MetricCard
          icon="⏳"
          label="Weeks Left"
          value={simulation.remaining_weeks}
        />

        <MetricCard
          icon="⭐"
          label="Quality"
          value={`${simulation.quality}/100`}
        />

        <MetricCard
          icon="⚠️"
          label="Risk"
          value={`${simulation.risk}/100`}
        />

        <MetricCard
          icon="🐛"
          label="Bugs"
          value={simulation.bugs}
        />

        <MetricCard
          icon="🔧"
          label="Technical Debt"
          value={simulation.technical_debt}
        />

        <MetricCard
          icon="👥"
          label="Team Morale"
          value={`${simulation.team_morale}/100`}
        />

        <MetricCard
          icon="😊"
          label="Customer"
          value={`${simulation.customer_satisfaction}/100`}
        />
      </div>

      <section className="event-card">
        <div className="event-label">
          STAGE EVENT
        </div>

        <h2>{event[0]?.title}</h2>

        <p>{event[0]?.description}</p>

        <h3>What will you do?</h3>

        <div className="decision-grid">
          {event.map((decision) => (
            <DecisionCard
              key={decision.decision_id}
              decision={decision}
              onDecision={onDecision}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function Result({ label, value, icon }) {
  return (
    <div className="result-card">
      <span className="result-icon">
        {icon}
      </span>

      <span>{label}</span>

      <strong>{value}/100</strong>

      <div className="progress">
        <div
          style={{
            width: `${Math.max(
              0,
              Math.min(100, value)
            )}%`
          }}
        />
      </div>
    </div>
  );
}

export default Simulation;