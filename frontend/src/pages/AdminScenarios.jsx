
import { useCallback, useEffect, useState } from "react";
import "./AdminScenarios.css";

const API = "http://localhost:5001";

const emptyScenario = {
  name: "",
  description: "",
  difficulty: "Medium",
  budget: 100000,
  duration_weeks: 12,
  team_size: 5,
  initial_risk: 30,
  initial_quality: 70,
  initial_customer_satisfaction: 70,
};

function AdminScenarios({ token, onBack }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyScenario);
  const [saving, setSaving] = useState(false);

  const loadScenarios = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/admin/scenarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load scenarios.");
      }

      setScenarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyScenario });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(scenario) {
    setEditingId(scenario.id);

    setForm({
      name: scenario.name || "",
      description: scenario.description || "",
      difficulty: scenario.difficulty || "Medium",
      budget: scenario.budget ?? 100000,
      duration_weeks: scenario.duration_weeks ?? 12,
      team_size: scenario.team_size ?? 5,
      initial_risk: scenario.initial_risk ?? 30,
      initial_quality: scenario.initial_quality ?? 70,
      initial_customer_satisfaction:
        scenario.initial_customer_satisfaction ?? 70,
    });

    setError("");
    setMessage("");
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveScenario(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const numericFields = [
      "budget",
      "duration_weeks",
      "team_size",
      "initial_risk",
      "initial_quality",
      "initial_customer_satisfaction",
    ];

    const payload = { ...form };

    for (const field of numericFields) {
      payload[field] = Number(payload[field]);
    }

    if (!payload.name.trim()) {
      setError("Scenario name is required.");
      return;
    }

    if (
      numericFields.some(
        (field) =>
          !Number.isFinite(payload[field]) ||
          payload[field] < 0
      )
    ) {
      setError("Please enter valid non-negative numbers.");
      return;
    }

    if (
      payload.budget <= 0 ||
      payload.duration_weeks <= 0 ||
      payload.team_size <= 0
    ) {
      setError("Budget, duration and team size must be greater than zero.");
      return;
    }

    for (const field of [
      "initial_risk",
      "initial_quality",
      "initial_customer_satisfaction",
    ]) {
      if (payload[field] > 100) {
        setError("Risk, quality and customer satisfaction must be between 0 and 100.");
        return;
      }
    }

    setSaving(true);

    try {
      const url = editingId
        ? `${API}/api/admin/scenarios/${editingId}`
        : `${API}/api/admin/scenarios`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save scenario.");
      }

      setShowForm(false);
      setMessage(
        editingId
          ? "Scenario updated successfully."
          : "Scenario created successfully."
      );

      await loadScenarios();
    } catch (err) {
      setError(err.message || "Could not save scenario.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteScenario(scenario) {
    const confirmed = window.confirm(
      `Delete "${scenario.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/admin/scenarios/${scenario.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete scenario.");
      }

      setMessage("Scenario deleted successfully.");
      await loadScenarios();
    } catch (err) {
      setError(err.message || "Could not delete scenario.");
    }
  }

  const filteredScenarios = scenarios.filter((scenario) => {
    const query = search.toLowerCase();

    const matchesSearch =
      String(scenario.name || "").toLowerCase().includes(query) ||
      String(scenario.description || "").toLowerCase().includes(query) ||
      String(scenario.id).includes(query);

    const matchesDifficulty =
      difficultyFilter === "All" ||
      String(scenario.difficulty).toLowerCase() ===
        difficultyFilter.toLowerCase();

    return matchesSearch && matchesDifficulty;
  });

  return (
    <main className="scenario-admin">
      <header className="scenario-header">
        <div>
          <p className="scenario-eyebrow">ADMINISTRATION</p>
          <h1>Scenario Management</h1>
          <p className="scenario-subtitle">
            Create, update and manage software engineering simulation scenarios.
          </p>
        </div>

        <button className="scenario-back-btn" onClick={onBack}>
          ← Back to Admin Dashboard
        </button>
      </header>

      <section className="scenario-stats">
        <article className="scenario-stat-card">
          <span>Total Scenarios</span>
          <strong>{scenarios.length}</strong>
        </article>
        <article className="scenario-stat-card">
          <span>Easy</span>
          <strong>
            {scenarios.filter(
              (s) => String(s.difficulty).toLowerCase() === "easy"
            ).length}
          </strong>
        </article>
        <article className="scenario-stat-card">
          <span>Medium</span>
          <strong>
            {scenarios.filter(
              (s) => String(s.difficulty).toLowerCase() === "medium"
            ).length}
          </strong>
        </article>
        <article className="scenario-stat-card">
          <span>Hard</span>
          <strong>
            {scenarios.filter(
              (s) => String(s.difficulty).toLowerCase() === "hard"
            ).length}
          </strong>
        </article>
      </section>

      {message && <div className="scenario-success">{message}</div>}
      {error && <div className="scenario-error">{error}</div>}

      <section className="scenario-panel">
        <div className="scenario-panel-heading">
          <div>
            <h2>Registered Scenarios</h2>
            <p>Search existing scenarios or add a new one.</p>
          </div>

          <button className="scenario-primary-btn" onClick={openAddForm}>
            + Add Scenario
          </button>
        </div>

        <div className="scenario-filters">
          <input
            type="search"
            placeholder="Search by name, description or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="All">All difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <button
            className="scenario-refresh-btn"
            onClick={loadScenarios}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p className="scenario-empty">Loading scenarios...</p>
        ) : filteredScenarios.length === 0 ? (
          <p className="scenario-empty">No matching scenarios found.</p>
        ) : (
          <div className="scenario-table-wrap">
            <table className="scenario-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Scenario</th>
                  <th>Difficulty</th>
                  <th>Budget</th>
                  <th>Duration</th>
                  <th>Team Size</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredScenarios.map((scenario) => (
                  <tr key={scenario.id}>
                    <td>#{scenario.id}</td>
                    <td>
                      <strong>{scenario.name}</strong>
                      <p className="scenario-description">
                        {scenario.description || "No description"}
                      </p>
                    </td>
                    <td>
                      <span
                        className={`scenario-difficulty ${String(
                          scenario.difficulty || "medium"
                        ).toLowerCase()}`}
                      >
                        {scenario.difficulty}
                      </span>
                    </td>
                    <td>
                      {Number(scenario.budget).toLocaleString()}
                    </td>
                    <td>{scenario.duration_weeks} weeks</td>
                    <td>{scenario.team_size}</td>
                    <td>
                      <div className="scenario-row-actions">
                        <button
                          className="scenario-edit-btn"
                          onClick={() => openEditForm(scenario)}
                        >
                          Edit
                        </button>
                        <button
                          className="scenario-delete-btn"
                          onClick={() => deleteScenario(scenario)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div className="scenario-modal-overlay">
          <section className="scenario-modal">
            <div className="scenario-modal-heading">
              <div>
                <p className="scenario-eyebrow">
                  {editingId ? "UPDATE SCENARIO" : "NEW SCENARIO"}
                </p>
                <h2>{editingId ? "Edit Scenario" : "Add Scenario"}</h2>
              </div>

              <button
                type="button"
                className="scenario-close-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveScenario}>
              <label>
                Scenario Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  required
                  maxLength={150}
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={3}
                />
              </label>

              <label>
                Difficulty *
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={updateField}
                  required
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </label>

              <div className="scenario-form-grid">
                <label>
                  Budget *
                  <input
                    type="number"
                    name="budget"
                    min="1"
                    value={form.budget}
                    onChange={updateField}
                    required
                  />
                </label>

                <label>
                  Duration (weeks) *
                  <input
                    type="number"
                    name="duration_weeks"
                    min="1"
                    value={form.duration_weeks}
                    onChange={updateField}
                    required
                  />
                </label>

                <label>
                  Team Size *
                  <input
                    type="number"
                    name="team_size"
                    min="1"
                    value={form.team_size}
                    onChange={updateField}
                    required
                  />
                </label>

                <label>
                  Initial Risk (0–100) *
                  <input
                    type="number"
                    name="initial_risk"
                    min="0"
                    max="100"
                    value={form.initial_risk}
                    onChange={updateField}
                    required
                  />
                </label>

                <label>
                  Initial Quality (0–100) *
                  <input
                    type="number"
                    name="initial_quality"
                    min="0"
                    max="100"
                    value={form.initial_quality}
                    onChange={updateField}
                    required
                  />
                </label>

                <label>
                  Customer Satisfaction (0–100) *
                  <input
                    type="number"
                    name="initial_customer_satisfaction"
                    min="0"
                    max="100"
                    value={form.initial_customer_satisfaction}
                    onChange={updateField}
                    required
                  />
                </label>
              </div>

              {error && <div className="scenario-error">{error}</div>}

              <div className="scenario-form-actions">
                <button
                  type="button"
                  className="scenario-cancel-btn"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="scenario-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Create Scenario"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default AdminScenarios;
