
import { useEffect, useState } from 'react'
import './Analytics.css'

const API_URL = 'http://localhost:5001'

const metrics = [
  { key: 'budget_performance', label: 'Budget Performance' },
  { key: 'schedule_performance', label: 'Schedule Performance' },
  { key: 'quality_score', label: 'Quality Score' },
  { key: 'risk_management', label: 'Risk Management' },
  { key: 'customer_satisfaction', label: 'Customer Satisfaction' },
  { key: 'technical_debt_score', label: 'Technical Debt Score' },
]

function getScore(value) {
  const score = Number(value)
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0
}

function Analytics({ user, onBack }) {
  const [simulations, setSimulations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reportMode, setReportMode] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadAnalytics() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_URL}/api/users/${user.id}/analytics`
        )

        if (!response.ok) {
          throw new Error('Unable to load analytics. Please try again.')
        }

        const data = await response.json()

        if (!Array.isArray(data)) {
          throw new Error('The server returned an unexpected analytics response.')
        }

        if (!cancelled) {
          setSimulations(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Something went wrong while loading analytics.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (user?.id) {
      loadAnalytics()
    } else {
      setError('User information is unavailable. Please log in again.')
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!reportMode) return

    const previousTitle = document.title
    document.title = 'SEQuest-Simulation-Report'

    window.print()

    setReportMode(false)
    document.title = previousTitle
  }, [reportMode])

  const averageFor = (key) => {
    if (simulations.length === 0) return 0

    const total = simulations.reduce(
      (sum, simulation) => sum + getScore(simulation[key]),
      0
    )

    return total / simulations.length
  }

  const overallAverage =
    metrics.reduce((sum, metric) => sum + averageFor(metric.key), 0) /
    metrics.length

  const downloadReport = () => {
    if (simulations.length === 0) {
      window.alert('Complete at least one simulation before downloading a report.')
      return
    }

    setReportMode(true)
  }

  if (loading) {
    return (
      <main className="analytics-page">
        <button className="analytics-back" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div className="analytics-state">Loading your analytics...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="analytics-page">
        <button className="analytics-back" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div className="analytics-state analytics-error">{error}</div>
      </main>
    )
  }

  if (reportMode) {
    return (
      <main className="analytics-page analytics-report-page">
        <header className="analytics-report-header">
          <p>SEQUEST · SOFTWARE PROJECT SIMULATION</p>
          <h1>Simulation Performance Report</h1>
          <p>Prepared for: {user?.name || user?.email || 'SEQuest User'}</p>
          <p>Generated on: {new Date().toLocaleDateString()}</p>
        </header>

        <section className="analytics-report-summary">
          <div>
            <span>Completed Simulations</span>
            <strong>{simulations.length}</strong>
          </div>
          <div>
            <span>Overall Average</span>
            <strong>{overallAverage.toFixed(1)}%</strong>
          </div>
        </section>

        <section className="analytics-report-section">
          <h2>Average Performance by Metric</h2>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Performance Metric</th>
                <th>Average Score</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.key}>
                  <td>{metric.label}</td>
                  <td>{averageFor(metric.key).toFixed(1)} / 100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="analytics-report-section">
          <h2>Individual Simulation Results</h2>
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Scenario</th>
                  {metrics.map((metric) => (
                    <th key={metric.key}>{metric.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {simulations.map((simulation) => (
                  <tr key={simulation.session_id}>
                    <td>{simulation.session_id}</td>
                    <td>{simulation.scenario_name || 'Scenario'}</td>
                    {metrics.map((metric) => (
                      <td key={metric.key}>
                        {getScore(simulation[metric.key]).toFixed(1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="analytics-report-footer">
          <p>
            This report summarizes completed simulations recorded in SEQuest.
            Scores are presented on a scale of 0 to 100.
          </p>
        </footer>
      </main>
    )
  }

  return (
    <main className="analytics-page">
      <header className="analytics-header">
        <div>
          <p className="analytics-eyebrow">SEQUEST PERFORMANCE CENTER</p>
          <h1>Simulation Analytics</h1>
          <p className="analytics-subtitle">
            Understand your project management performance across completed
            simulations.
          </p>
        </div>

        <div className="analytics-header-actions">
          <button
            className="analytics-download"
            onClick={downloadReport}
            disabled={simulations.length === 0}
          >
            ↓ Download Report
          </button>
          <button className="analytics-back" onClick={onBack}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <section className="analytics-summary">
        <article className="analytics-summary-card">
          <span className="analytics-card-label">Completed Simulations</span>
          <strong>{simulations.length}</strong>
          <span className="analytics-card-note">Total completed sessions</span>
        </article>

        <article className="analytics-summary-card">
          <span className="analytics-card-label">Overall Average</span>
          <strong>
            {simulations.length ? `${overallAverage.toFixed(1)}%` : '—'}
          </strong>
          <span className="analytics-card-note">Average across six metrics</span>
        </article>

        <article className="analytics-summary-card">
          <span className="analytics-card-label">Best Metric</span>
          <strong className="analytics-best-metric">
            {simulations.length
              ? metrics.reduce((best, metric) =>
                  averageFor(metric.key) > averageFor(best.key) ? metric : best
                ).label
              : '—'}
          </strong>
          <span className="analytics-card-note">Your highest average score</span>
        </article>
      </section>

      {simulations.length === 0 ? (
        <section className="analytics-empty">
          <h2>No completed simulations yet</h2>
          <p>
            Complete a simulation to see your performance charts and score
            comparisons here.
          </p>
        </section>
      ) : (
        <>
          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <h2>Performance by Metric</h2>
                <p>Average scores across all completed simulations</p>
              </div>
              <span className="analytics-unit">Score out of 100</span>
            </div>

            <div className="analytics-bar-chart">
              <div className="analytics-chart-axis">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              <div className="analytics-bars">
                {metrics.map((metric) => {
                  const score = averageFor(metric.key)

                  return (
                    <div className="analytics-bar-item" key={metric.key}>
                      <div className="analytics-bar-value">{score.toFixed(1)}</div>
                      <div className="analytics-bar-track">
                        <div
                          className="analytics-bar-fill"
                          style={{ height: `${score}%` }}
                          title={`${metric.label}: ${score.toFixed(1)}%`}
                        />
                      </div>
                      <span className="analytics-bar-label">{metric.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <h2>Performance Trend</h2>
                <p>Overall average score for each completed simulation</p>
              </div>
            </div>

            <div className="analytics-trend-chart">
              <div className="analytics-trend-axis">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              <div className="analytics-trend-content">
                <svg
                  className="analytics-trend-svg"
                  viewBox="0 0 600 220"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Overall average score across completed simulations"
                >
                  {[10, 60, 110, 160, 210].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="600"
                      y2={y}
                      className="analytics-grid-line"
                    />
                  ))}

                  {simulations.length > 1 && (
                    <polyline
                      points={simulations
                        .map((simulation, index) => {
                          const x =
                            10 + (index * 580) / (simulations.length - 1)
                          const score =
                            metrics.reduce(
                              (sum, metric) =>
                                sum + getScore(simulation[metric.key]),
                              0
                            ) / metrics.length
                          return `${x},${210 - (score / 100) * 200}`
                        })
                        .join(' ')}
                      className="analytics-trend-line"
                    />
                  )}

                  {simulations.map((simulation, index) => {
                    const x =
                      simulations.length === 1
                        ? 300
                        : 10 + (index * 580) / (simulations.length - 1)
                    const score =
                      metrics.reduce(
                        (sum, metric) =>
                          sum + getScore(simulation[metric.key]),
                        0
                      ) / metrics.length

                    return (
                      <circle
                        key={simulation.session_id}
                        cx={x}
                        cy={210 - (score / 100) * 200}
                        r="5"
                        className="analytics-trend-point"
                      >
                        <title>
                          Simulation {index + 1}: {score.toFixed(1)}%
                        </title>
                      </circle>
                    )
                  })}
                </svg>

                <div className="analytics-trend-labels">
                  {simulations.map((simulation, index) => (
                    <span key={simulation.session_id}>Sim {index + 1}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <h2>Simulation Score Details</h2>
                <p>Compare scores from each completed session</p>
              </div>
            </div>

            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Simulation</th>
                    <th>Scenario</th>
                    {metrics.map((metric) => (
                      <th key={metric.key}>{metric.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {simulations.map((simulation) => (
                    <tr key={simulation.session_id}>
                      <td>#{simulation.session_id}</td>
                      <td>{simulation.scenario_name || 'Scenario'}</td>
                      {metrics.map((metric) => (
                        <td key={metric.key}>
                          {getScore(simulation[metric.key]).toFixed(1)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default Analytics
