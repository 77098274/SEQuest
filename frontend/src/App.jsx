
import { useEffect, useState } from "react";
import "./App.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Simulation from "./pages/Simulation";
import Analytics from "./pages/Analytics";
import Navbar from "./components/Navbar";
import AdminDashboard from "./pages/AdminDashboard";
import { stages } from "./data/scenarios";

const API = "http://localhost:5001";

const comparisonMetrics = [
  { key: "budget_performance", label: "Budget Performance" },
  { key: "schedule_performance", label: "Schedule Performance" },
  { key: "quality_score", label: "Quality Score" },
  { key: "risk_management", label: "Risk Management" },
  { key: "customer_satisfaction", label: "Customer Satisfaction" },
  { key: "technical_debt_score", label: "Technical Debt Score" },
];

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [authMessage, setAuthMessage] = useState("");
  const [scenarios, setScenarios] = useState([]);
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [result, setResult] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedAttempts, setSelectedAttempts] = useState([]);

  const isAdmin =
    String(user?.role || "").toUpperCase() === "ADMIN";

  // Restore the logged-in user and authentication token.
  useEffect(() => {
    const savedUser = localStorage.getItem("sequest_user");
    const savedToken = localStorage.getItem("sequest_token");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        localStorage.removeItem("sequest_user");
        localStorage.removeItem("sequest_token");
      }
    }
  }, []);

  // Load scenarios for regular users only.
  useEffect(() => {
    if (!user || isAdmin) return;

    fetch(`${API}/api/scenarios`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load scenarios");
        }

        return response.json();
      })
      .then((data) => setScenarios(data))
      .catch(() => {
        setMessage("Failed to load scenarios");
      });
  }, [user, isAdmin]);

  const handleAuthChange = (e) => {
    setAuthForm({
      ...authForm,
      [e.target.name]: e.target.value,
    });
  };

  // Login and registration.
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthMessage("");

    try {
      const endpoint =
        authMode === "login" ? "/api/login" : "/api/register";

      const body =
        authMode === "login"
          ? {
              email: authForm.email,
              password: authForm.password,
            }
          : authForm;

      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthMessage(
          data.error || data.message || "Authentication failed"
        );
        return;
      }

      if (authMode === "register") {
        setAuthMessage("Registration successful! Please login.");
        setAuthMode("login");

        setAuthForm({
          name: "",
          email: authForm.email,
          password: "",
        });

        return;
      }

      if (!data.user) {
        setAuthMessage("Login response did not contain user details.");
        return;
      }

      localStorage.setItem("sequest_user", JSON.stringify(data.user));

      if (data.token) {
        localStorage.setItem("sequest_token", data.token);
        setToken(data.token);
      } else {
        localStorage.removeItem("sequest_token");
        setToken(null);
      }

      setUser(data.user);
      setAuthMessage("");
      setMessage("");
    } catch {
      setAuthMessage("Cannot connect to SEQuest server");
    }
  };

  // Logout.
  const logout = () => {
    localStorage.removeItem("sequest_user");
    localStorage.removeItem("sequest_token");

    setUser(null);
    setToken(null);
    setSessionId(null);
    setSimulation(null);
    setEvent(null);
    setResult(null);
    setAiAnalysis(null);
    setHistory([]);
    setSelectedAttempts([]);
    setShowHistory(false);
    setShowAnalytics(false);
    setHistoryError("");
    setMessage("");
    setAuthMessage("");
  };

  // Start a new simulation.
  const startSimulation = async (scenarioId) => {
    setShowHistory(false);
    setShowAnalytics(false);
    setHistoryError("");
    setSelectedAttempts([]);
    setResult(null);
    setAiAnalysis(null);
    setEvent(null);
    setSimulation(null);
    setSessionId(null);
    setMessage("");

    try {
      const response = await fetch(`${API}/api/simulations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          scenario_id: scenarioId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.session_id) {
        throw new Error(
          data.error || "Simulation could not start"
        );
      }

      const newSessionId = data.session_id;
      setSessionId(newSessionId);

      setMessage(
        `Simulation started! Session ID: ${newSessionId}`
      );

      const simulationResponse = await fetch(
        `${API}/api/simulations/${newSessionId}`
      );

      const simulationData = await simulationResponse.json();

      if (!simulationResponse.ok) {
        throw new Error("Failed to load the simulation");
      }

      setSimulation(simulationData);

      const eventResponse = await fetch(
        `${API}/api/events/${simulationData.scenario_id}/Requirements`
      );

      const eventData = await eventResponse.json();

      if (
        !eventResponse.ok ||
        !Array.isArray(eventData) ||
        !eventData.length
      ) {
        throw new Error("No events found for Requirements");
      }

      setEvent(eventData);
    } catch (error) {
      setMessage(error.message || "Failed to start simulation");
    }
  };

  // Apply a decision and move to the next stage.
  const makeDecision = async (decisionId) => {
    const previousStage = simulation?.current_stage;

    try {
      const decisionResponse = await fetch(
        `${API}/api/decisions/${sessionId}/${decisionId}`,
        {
          method: "POST",
        }
      );

      const decisionData = await decisionResponse.json();

      if (!decisionResponse.ok) {
        throw new Error(
          decisionData.error || "Failed to apply decision"
        );
      }

      setMessage(decisionData.message || "");

      const simulationResponse = await fetch(
        `${API}/api/simulations/${sessionId}`
      );

      const updatedSimulation = await simulationResponse.json();

      if (!simulationResponse.ok) {
        throw new Error("Failed to fetch updated simulation");
      }

      setSimulation(updatedSimulation);

      if (previousStage === "Maintenance") {
        await completeSimulation();
        return;
      }

      const eventResponse = await fetch(
        `${API}/api/events/${updatedSimulation.scenario_id}/${updatedSimulation.current_stage}`
      );

      const nextEvent = await eventResponse.json();

      if (!eventResponse.ok) {
        throw new Error("Failed to load the next stage event");
      }

      if (!Array.isArray(nextEvent) || nextEvent.length === 0) {
        throw new Error(
          `No events found for ${updatedSimulation.current_stage}`
        );
      }

      setEvent(nextEvent);
    } catch (error) {
      setMessage(error.message || "Failed to apply decision");
    }
  };

  // Complete the simulation and load results and AI analysis.
  const completeSimulation = async () => {
    try {
      const response = await fetch(
        `${API}/api/simulations/${sessionId}/complete`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to complete simulation"
        );
      }

      setResult(data.result);
      setEvent(null);
      setMessage(data.message || "Simulation completed!");

      try {
        const analysisResponse = await fetch(
          `${API}/api/ai-analysis/${sessionId}`
        );

        const analysisData = await analysisResponse.json();

        if (!analysisResponse.ok) {
          throw new Error("AI analysis could not be loaded");
        }

        setAiAnalysis(analysisData);
      } catch {
        setAiAnalysis(null);
        setMessage(
          "Simulation completed, but AI analysis failed to load."
        );
      }
    } catch (error) {
      setMessage(error.message || "Failed to complete simulation");
    }
  };

  // Return to the scenario dashboard.
  const restartSimulation = () => {
    setResult(null);
    setAiAnalysis(null);
    setSimulation(null);
    setSessionId(null);
    setEvent(null);
    setMessage("");
    setShowHistory(false);
    setShowAnalytics(false);
  };

  // Load simulation history.
  const openHistory = async () => {
    setShowHistory(true);
    setShowAnalytics(false);
    setHistoryLoading(true);
    setHistoryError("");
    setSelectedAttempts([]);
    setMessage("");
    setEvent(null);
    setResult(null);

    try {
      const response = await fetch(
        `${API}/api/users/${user.id}/simulations`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not load simulation history"
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected history response from server");
      }

      setHistory(data);
    } catch (error) {
      setHistoryError(
        error.message || "Failed to load simulation history"
      );
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open Analytics.
  const openAnalytics = () => {
    setShowAnalytics(true);
    setShowHistory(false);
    setHistoryError("");
    setSelectedAttempts([]);
    setMessage("");
    setEvent(null);
    setResult(null);
  };

  // Return to dashboard from History or Analytics.
  const backToDashboard = () => {
    setShowHistory(false);
    setShowAnalytics(false);
    setHistoryError("");
    setSelectedAttempts([]);
    setMessage("");
  };

  const isCompleted = (item) =>
    String(item.status || "").toUpperCase() === "COMPLETED";

  const completedHistory = history.filter(isCompleted);
  const completedCount = completedHistory.length;
  const inProgressCount = history.length - completedCount;

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString();
  };

  const formatScore = (score) => {
    if (score === null || score === undefined || score === "") {
      return "—";
    }

    const number = Number(score);

    return Number.isFinite(number) ? number : score;
  };

  // Select or deselect an attempt for comparison.
  const toggleAttempt = (sessionIdToToggle) => {
    setSelectedAttempts((previous) => {
      if (previous.includes(sessionIdToToggle)) {
        return previous.filter(
          (id) => id !== sessionIdToToggle
        );
      }

      if (previous.length >= 2) {
        return [previous[1], sessionIdToToggle];
      }

      return [...previous, sessionIdToToggle];
    });
  };

  const attemptA = completedHistory.find(
    (item) => item.session_id === selectedAttempts[0]
  );

  const attemptB = completedHistory.find(
    (item) => item.session_id === selectedAttempts[1]
  );

  const getScoreDifference = (first, second, key) => {
    const firstValue = first?.[key];
    const secondValue = second?.[key];

    if (
      firstValue === null ||
      firstValue === undefined ||
      firstValue === "" ||
      secondValue === null ||
      secondValue === undefined ||
      secondValue === ""
    ) {
      return null;
    }

    const a = Number(firstValue);
    const b = Number(secondValue);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return null;
    }

    return a - b;
  };

  if (!user) {
    return (
      <Login
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        handleAuthChange={handleAuthChange}
        handleAuth={handleAuth}
        authMessage={authMessage}
      />
    );
  }

  // Show the separate Admin Dashboard for administrator accounts.
  if (isAdmin) {
    return (
      <AdminDashboard
        user={user}
        token={token}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={logout} />

      <main className="container">
        {!event && !result && !showHistory && !showAnalytics && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "22px",
              }}
            >
              <button
                type="button"
                className="history-button"
                onClick={openHistory}
              >
                View Simulation History →
              </button>

              <button
                type="button"
                className="history-button"
                onClick={openAnalytics}
              >
                View Analytics →
              </button>
            </div>

            <Dashboard
              scenarios={scenarios}
              onStartSimulation={startSimulation}
            />
          </>
        )}

        {showAnalytics && (
          <Analytics
            user={user}
            onBack={backToDashboard}
          />
        )}

        {showHistory && (
          <section className="history-section">
            <div className="history-header">
              <div>
                <p className="eyebrow">YOUR PROJECT JOURNEY</p>
                <h2>Simulation History</h2>
                <p className="history-subtitle">
                  Review your previous projects and compare your performance.
                </p>
              </div>

              <button
                type="button"
                className="history-button"
                onClick={backToDashboard}
              >
                ← Back to Dashboard
              </button>
            </div>

            {!historyLoading && !historyError && (
              <div className="history-summary">
                <div className="history-summary-card">
                  <span>Total Simulations</span>
                  <strong>{history.length}</strong>
                </div>

                <div className="history-summary-card">
                  <span>Completed Projects</span>
                  <strong>{completedCount}</strong>
                </div>

                <div className="history-summary-card">
                  <span>Other Simulations</span>
                  <strong>{inProgressCount}</strong>
                </div>
              </div>
            )}

            {/* Attempt comparison panel */}
            {!historyLoading &&
              !historyError &&
              completedCount >= 2 && (
                <section
                  style={{
                    margin: "24px 0",
                    padding: "20px",
                    border: "1px solid #dbe2ea",
                    borderRadius: "14px",
                    background: "var(--card-bg, transparent)",
                  }}
                >
                  <h3>Compare Attempts</h3>

                  <p>
                    Select two completed attempts using the checkboxes
                    on their history cards.
                  </p>

                  <p>
                    Selected: {selectedAttempts.length} / 2
                  </p>

                  {attemptA && attemptB && (
                    <div
                      style={{
                        overflowX: "auto",
                        marginTop: "18px",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          textAlign: "left",
                        }}
                      >
                        <thead>
                          <tr>
                            <th style={{ padding: "10px" }}>Metric</th>
                            <th style={{ padding: "10px" }}>
                              Attempt #{attemptA.session_id}
                            </th>
                            <th style={{ padding: "10px" }}>
                              Attempt #{attemptB.session_id}
                            </th>
                            <th style={{ padding: "10px" }}>
                              Difference (A − B)
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {comparisonMetrics.map((metric) => {
                            const difference = getScoreDifference(
                              attemptA,
                              attemptB,
                              metric.key
                            );

                            return (
                              <tr key={metric.key}>
                                <td style={{ padding: "10px" }}>
                                  {metric.label}
                                </td>

                                <td style={{ padding: "10px" }}>
                                  {formatScore(attemptA[metric.key])}
                                </td>

                                <td style={{ padding: "10px" }}>
                                  {formatScore(attemptB[metric.key])}
                                </td>

                                <td style={{ padding: "10px" }}>
                                  {difference === null
                                    ? "Unavailable"
                                    : `${
                                        difference > 0 ? "+" : ""
                                      }${difference}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <p style={{ marginTop: "12px" }}>
                        A positive difference means Attempt A scored
                        higher. A negative difference means Attempt B
                        scored higher.
                      </p>
                    </div>
                  )}

                  {selectedAttempts.length < 2 && (
                    <p>
                      Select {2 - selectedAttempts.length} more
                      completed attempt
                      {selectedAttempts.length === 1 ? "" : "s"} below.
                    </p>
                  )}

                  {selectedAttempts.length > 0 && (
                    <button
                      type="button"
                      className="history-button"
                      onClick={() => setSelectedAttempts([])}
                      style={{ marginTop: "10px" }}
                    >
                      Clear Selection
                    </button>
                  )}
                </section>
              )}

            {historyLoading && (
              <div className="history-empty">
                <h3>Loading your projects...</h3>
                <p>
                  Please wait while we retrieve your simulation history.
                </p>
              </div>
            )}

            {historyError && (
              <div className="history-error">
                {historyError}

                <div style={{ marginTop: "12px" }}>
                  <button
                    type="button"
                    className="history-button"
                    onClick={openHistory}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!historyLoading &&
              !historyError &&
              history.length === 0 && (
                <div className="history-empty">
                  <h3>No simulations yet</h3>
                  <p>
                    Your project history will appear here after you start
                    a simulation.
                  </p>

                  <button
                    type="button"
                    className="history-button"
                    onClick={backToDashboard}
                  >
                    Explore Scenarios →
                  </button>
                </div>
              )}

            {!historyLoading &&
              !historyError &&
              history.length > 0 && (
                <div className="history-list">
                  {history.map((item) => {
                    const completed = isCompleted(item);

                    return (
                      <article
                        className="history-card"
                        key={item.session_id}
                      >
                        <div className="history-card-top">
                          <div>
                            <h3>
                              {item.scenario_name ||
                                `Scenario ${item.scenario_id}`}
                            </h3>

                            <span className="history-session">
                              Session #{item.session_id}
                            </span>

                            {completed && (
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginTop: "10px",
                                  cursor: "pointer",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedAttempts.includes(
                                    item.session_id
                                  )}
                                  onChange={() =>
                                    toggleAttempt(item.session_id)
                                  }
                                />

                                Compare this attempt
                              </label>
                            )}
                          </div>

                          <span
                            className={`history-status ${
                              completed ? "" : "in-progress"
                            }`}
                          >
                            {completed ? "Completed" : "In Progress"}
                          </span>
                        </div>

                        <div className="history-details">
                          <div className="history-detail">
                            <span>Current Stage</span>
                            <strong>
                              {item.current_stage || "Not available"}
                            </strong>
                          </div>

                          <div className="history-detail">
                            <span>Budget Performance</span>
                            <strong>
                              {formatScore(item.budget_performance)}
                              {item.budget_performance != null
                                ? " / 100"
                                : ""}
                            </strong>
                          </div>

                          <div className="history-detail">
                            <span>Quality Score</span>
                            <strong>
                              {formatScore(item.quality_score)}
                              {item.quality_score != null
                                ? " / 100"
                                : ""}
                            </strong>
                          </div>

                          <div className="history-detail">
                            <span>Risk Management</span>
                            <strong>
                              {formatScore(item.risk_management)}
                              {item.risk_management != null
                                ? " / 100"
                                : ""}
                            </strong>
                          </div>
                        </div>

                        <p className="history-date">
                          Created: {formatDate(item.created_at)}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
          </section>
        )}

        {(event || result) && (
          <Simulation
            simulation={simulation}
            event={event}
            sessionId={sessionId}
            result={result}
            aiAnalysis={aiAnalysis}
            user={user}
            onDecision={makeDecision}
            onRestart={restartSimulation}
          />
        )}

        {message && (
          <div className="status-message">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
