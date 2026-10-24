
import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import AdminUsers from "./AdminUsers";
import AdminScenarios from "./AdminScenarios";
import AdminEvents from "./AdminEvents";

const API = "http://localhost:5001";

function AdminDashboard({ user, token, onLogout }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalScenarios: 0,
    totalSimulations: 0,
    completedSimulations: 0,
    recentActivity: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUsers, setShowUsers] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch(`${API}/api/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || "Failed to load dashboard");
        }

        setStats(data);
        setError("");
      } catch (err) {
        setError(err.message || "Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadDashboard();
    } else {
      setError("Admin authentication token is missing. Please log in again.");
      setLoading(false);
    }
  }, [token]);

  const metrics = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: "👥",
    },
    {
      title: "Total Scenarios",
      value: stats.totalScenarios,
      icon: "📚",
    },
    {
      title: "Total Simulations",
      value: stats.totalSimulations,
      icon: "🎮",
    },
    {
      title: "Completed Simulations",
      value: stats.completedSimulations,
      icon: "✅",
    },
  ];

  if (showUsers) {
    return (
      <div className="admin-page">
        <header className="admin-topbar">
          <div className="admin-brand">
            <div className="admin-logo">S</div>
            <div>
              <h1>SEQuest</h1>
              <p>Software Engineering Simulator</p>
            </div>
          </div>

          <div className="admin-profile">
            <div>
              <strong>{user?.name || "Administrator"}</strong>
              <span>Administrator</span>
            </div>

            <button onClick={onLogout} className="admin-logout">
              Logout
            </button>
          </div>
        </header>

        <main className="admin-content">
          <AdminUsers
            token={token}
            currentUser={user}
            onBack={() => setShowUsers(false)}
          />
        </main>
      </div>
    );
  }
  if (showScenarios) {
    return (
      <div className="admin-page">
        <header className="admin-topbar">
          <div className="admin-brand">
            <div className="admin-logo">S</div>
            <div>
              <h1>SEQuest</h1>
              <p>Software Engineering Simulator</p>
            </div>
          </div>

          <div className="admin-profile">
            <div>
              <strong>{user?.name || "Administrator"}</strong>
              <span>Administrator</span>
            </div>

            <button onClick={onLogout} className="admin-logout">
              Logout
            </button>
          </div>
        </header>

        <main className="admin-content">
          <AdminScenarios
            token={token}
            onBack={() => setShowScenarios(false)}
          />
        </main>
      </div>
    );
  }
  if (showEvents) {
    return (
      <div className="admin-page">
        <header className="admin-topbar">
          <div className="admin-brand">
            <div className="admin-logo">S</div>
            <div>
              <h1>SEQuest</h1>
              <p>Software Engineering Simulator</p>
            </div>
          </div>

          <div className="admin-profile">
            <div>
              <strong>{user?.name || "Administrator"}</strong>
              <span>Administrator</span>
            </div>

            <button onClick={onLogout} className="admin-logout">
              Logout
            </button>
          </div>
        </header>

        <main className="admin-content">
          <AdminEvents
            token={token}
            onBack={() => setShowEvents(false)}
          />
        </main>
      </div>
    );
  }
  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-logo">S</div>
          <div>
            <h1>SEQuest</h1>
            <p>Software Engineering Simulator</p>
          </div>
        </div>

        <div className="admin-profile">
          <div>
            <strong>{user?.name || "Administrator"}</strong>
            <span>Administrator</span>
          </div>

          <button onClick={onLogout} className="admin-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="admin-content">
        <section className="admin-welcome">
          <div>
            <p className="admin-eyebrow">ADMINISTRATION</p>
            <h2>Admin Dashboard</h2>
            <p>
              Monitor users, scenarios, and simulation activity across SEQuest.
            </p>
          </div>

          <div className="admin-status">
            <span className="status-dot"></span>
            Admin Panel
          </div>
        </section>

        <div className="admin-management-actions">
          <button
            type="button"
            className="admin-manage-users"
            onClick={() => setShowUsers(true)}
          >
            👥 Manage Users <span>→</span>
          </button>
          <button
            type="button"
            className="admin-manage-users"
            onClick={() => setShowScenarios(true)}
          >
              🗂️ Manage Scenarios <span>→</span>
          </button>
          <button
            type="button"
            className="admin-manage-users"
            onClick={() => setShowEvents(true)}
          >
            🎯 Manage Events &amp; Decisions <span>→</span>
          </button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <div className="admin-loading">Loading dashboard...</div>
        ) : (
          <>
            <section className="admin-metrics">
              {metrics.map((metric) => (
                <article className="admin-metric-card" key={metric.title}>
                  <div className="admin-metric-top">
                    <span>{metric.title}</span>
                    <span className="admin-metric-icon">{metric.icon}</span>
                  </div>
                  <h3>{metric.value}</h3>
                </article>
              ))}
            </section>

            <section className="admin-activity-section">
              <div className="admin-section-heading">
                <div>
                  <h2>Recent Simulation Activity</h2>
                  <p>Latest activity recorded by SEQuest</p>
                </div>

                <button
                  className="admin-refresh"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </button>
              </div>

              {stats.recentActivity?.length > 0 ? (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Scenario</th>
                        <th>Stage</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {stats.recentActivity.map((activity, index) => (
                        <tr
                          key={
                            activity.session_id ??
                            `${activity.email}-${index}`
                          }
                        >
                          <td>
                            <strong>{activity.user_name || "Unknown"}</strong>
                            <span className="admin-email">
                              {activity.email || "—"}
                            </span>
                          </td>

                          <td>{activity.scenario_name || "—"}</td>
                          <td>{activity.current_stage || "—"}</td>

                          <td>
                            <span
                              className={`admin-status-badge ${
                                activity.status === "COMPLETED"
                                  ? "completed"
                                  : "active"
                              }`}
                            >
                              {activity.status || "UNKNOWN"}
                            </span>
                          </td>

                          <td>
                            {activity.created_at
                              ? new Date(activity.created_at).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty">
                  No simulation activity available yet.
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
