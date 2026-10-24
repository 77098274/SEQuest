
import MetricCard from "../components/MetricCard";
import DecisionCard from "../components/DecisionCard";
import { stages } from "../data/scenarios";
import "./Simulation.css";
import PdfReportButton from "../components/PdfReportButton";

function getScore(value) {
  const score = Number(value);
  return Number.isFinite(score)
    ? Math.max(0, Math.min(100, score))
    : 0;
}

function getPerformance(score) {
  if (score >= 85) {
    return {
      rating: "Excellent",
      icon: "🏆",
      description:
        "Outstanding project management! Your decisions helped maintain strong project performance.",
    };
  }

  if (score >= 70) {
    return {
      rating: "Good",
      icon: "🎉",
      description:
        "Good work! Your project performed well, with a few areas that could be improved.",
    };
  }

  if (score >= 50) {
    return {
      rating: "Average",
      icon: "📈",
      description:
        "You made some effective decisions, but there are opportunities to improve project outcomes.",
    };
  }

  return {
    rating: "Needs Improvement",
    icon: "💡",
    description:
      "Every simulation is a learning opportunity. Review your decisions and focus on improving your weakest project areas.",
  };
}

function getFeedback(metrics) {
  const weakest = [...metrics].sort(
    (a, b) => a.score - b.score
  )[0];

  const feedback = {
    "Budget Performance":
      "Review spending regularly, estimate costs carefully, and keep a reserve for unexpected expenses.",

    "Schedule Performance":
      "Improve task planning, track deadlines, and identify delays before they affect the entire project.",

    "Quality Score":
      "Strengthen code reviews, testing, and quality checks throughout development.",

    "Risk Management":
      "Identify risks early, assess their impact, and prepare mitigation plans before problems occur.",

    "Customer Satisfaction":
      "Communicate regularly with customers and validate requirements before implementing changes.",

    "Technical Debt Score":
      "Review the technical debt calculation used by your simulation and prioritize maintainability improvements.",
  };

  return {
    weakest,
    suggestion:
      feedback[weakest.label] ||
      "Review your project decisions and identify areas for improvement.",
  };
}

function Simulation({
  simulation,
  event,
  sessionId,
  result,
  aiAnalysis,
  user,
  onDecision,
  onRestart,
}) {
  if (result) {
    const metrics = [
      {
        label: "Budget Performance",
        value: result.budget_performance,
        icon: "💰",
      },
      {
        label: "Schedule Performance",
        value: result.schedule_performance,
        icon: "⏳",
      },
      {
        label: "Quality Score",
        value: result.quality_score,
        icon: "⭐",
      },
      {
        label: "Risk Management",
        value: result.risk_management,
        icon: "⚠️",
      },
      {
        label: "Customer Satisfaction",
        value: result.customer_satisfaction,
        icon: "😊",
      },
      {
        label: "Technical Debt Score",
        value: result.technical_debt_score,
        icon: "🔧",
      },
    ].map((metric) => ({
      ...metric,
      score: getScore(metric.value),
    }));

    const overallScore = Math.round(
      metrics.reduce(
        (total, metric) => total + metric.score,
        0
      ) / metrics.length
    );

    const performance = getPerformance(overallScore);
    const feedback = getFeedback(metrics);

    const recommendations = Array.isArray(
      aiAnalysis?.recommendations
    )
      ? aiAnalysis.recommendations
      : [];

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
            Great work{user?.name ? `, ${user.name}` : ""}!
            Here is how your project performed.
          </p>
        </section>

        <section className="overall-score-card">
          <div className="overall-score-icon">
            {performance.icon}
          </div>

          <p className="eyebrow">
            OVERALL PROJECT SCORE
          </p>

          <div className="overall-score-number">
            {overallScore}
            <span>/100</span>
          </div>

          <div className="overall-score-progress">
            <div
              style={{
                width: `${overallScore}%`,
              }}
            />
          </div>

          <h2>{performance.rating}</h2>

          <p>{performance.description}</p>
        </section>

        <section className="results-section">
          <div className="results-section-heading">
            <p className="eyebrow">
              PERFORMANCE BREAKDOWN
            </p>

            <h2>Your Project Metrics</h2>

            <p>
              Review how your decisions affected each
              project performance area.
            </p>
          </div>

          <div className="results-grid">
            {metrics.map((metric) => (
              <Result
                key={metric.label}
                label={metric.label}
                value={metric.score}
                icon={metric.icon}
              />
            ))}
          </div>
        </section>

        <section className="feedback-card">
          <p className="eyebrow">
            PERSONALIZED FEEDBACK
          </p>

          <h2>
            {overallScore >= 70
              ? "Keep up the good work!"
              : "Here is where to focus next"}
          </h2>

          <p>
            Your strongest next step is to improve{" "}
            <strong>{feedback.weakest.label}</strong>,
            currently scored at{" "}
            <strong>{feedback.weakest.score}/100</strong>.
          </p>

          <div className="improvement-tip">
            <span>💡</span>

            <div>
              <strong>Suggested improvement</strong>

              <p>{feedback.suggestion}</p>
            </div>
          </div>
        </section>

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

                <h2>Project Risk Assessment</h2>
              </div>
            </div>

            <div className="risk-box">
              <span>Risk Level</span>

              <strong>
                {aiAnalysis.risk_level ?? "Not available"}
              </strong>

              <small>
                Predicted Risk:{" "}
                {aiAnalysis.predicted_risk ?? "Not available"}
              </small>
            </div>

            <h3>AI Recommendations</h3>

            {recommendations.length > 0 ? (
              <div className="recommendations">
                {recommendations.map(
                  (recommendation, index) => (
                    <div
                      className="recommendation"
                      key={index}
                    >
                      <span>✓</span>

                      <p>{recommendation}</p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p>
                No AI recommendations are available for
                this simulation.
              </p>
            )}
          </section>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "24px",
          }}
        >
          <PdfReportButton
            user={user}
            sessionId={sessionId}
            result={result}
            overallScore={overallScore}
            performance={performance}
            metrics={metrics}
            feedback={feedback}
            aiAnalysis={aiAnalysis}
            recommendations={recommendations}
          />

          <button
            className="primary-button restart-button"
            onClick={onRestart}
          >
            ← Back to Scenarios
          </button>
        </div>
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
  const score = getScore(value);

  return (
    <div className="result-card">
      <span className="result-icon">
        {icon}
      </span>

      <span>{label}</span>

      <strong>{score}/100</strong>

      <div className="progress">
        <div
          style={{
            width: `${score}%`,
          }}
        />
      </div>
    </div>
  );
}

export default Simulation;
