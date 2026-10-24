
import { useCallback, useEffect, useState } from "react";
import "./AdminEvents.css";
import { stages } from "../data/scenarios";

const API = "http://localhost:5001";

const emptyEvent = {
  stage: "Requirements",
  title: "",
  description: "",
};

const emptyDecision = {
  option_text: "",
  budget_change: 0,
  time_change: 0,
  quality_change: 0,
  risk_change: 0,
  bugs_change: 0,
  technical_debt_change: 0,
  morale_change: 0,
  customer_change: 0,
};

const consequenceFields = [
  ["budget_change", "Budget change"],
  ["time_change", "Time change"],
  ["quality_change", "Quality change"],
  ["risk_change", "Risk change"],
  ["bugs_change", "Bugs change"],
  ["technical_debt_change", "Technical debt change"],
  ["morale_change", "Team morale change"],
  ["customer_change", "Customer satisfaction change"],
];

function AdminEvents({ token, onBack }) {
  const [scenarios, setScenarios] = useState([]);
  const [scenarioId, setScenarioId] = useState("");
  const [events, setEvents] = useState([]);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [editingEventId, setEditingEventId] = useState(null);
  const [decisionForms, setDecisionForms] = useState({});
  const [editingDecisionId, setEditingDecisionId] = useState(null);
  const [decisionForm, setDecisionForm] = useState(emptyDecision);
  const [decisionEventId, setDecisionEventId] = useState(null);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Request failed (${response.status})`
      );
    }

    return data;
  }, [token]);

  const loadScenarios = useCallback(async () => {
    setLoadingScenarios(true);
    setError("");

    try {
      const data = await request("/api/admin/scenarios");
      const list = Array.isArray(data)
        ? data
        : data.scenarios || data.data || [];

      setScenarios(list);

      if (list.length > 0) {
        setScenarioId((current) => {
          const exists = list.some(
            (scenario) => String(scenario.id) === String(current)
          );
          return exists ? current : String(list[0].id);
        });
      } else {
        setScenarioId("");
      }
    } catch (err) {
      setError(err.message || "Could not load scenarios.");
    } finally {
      setLoadingScenarios(false);
    }
  }, [request]);

  const loadEvents = useCallback(async () => {
    if (!scenarioId) {
      setEvents([]);
      return;
    }

    setLoadingEvents(true);
    setError("");

    try {
      const data = await request(
        `/api/admin/scenarios/${encodeURIComponent(scenarioId)}/events`
      );
      const rows = Array.isArray(data)
        ? data
        : data.events || data.data || [];

      const grouped = new Map();

      rows.forEach((row) => {
        const id = row.event_id ?? row.id;
        if (id == null) return;

        if (!grouped.has(String(id))) {
          grouped.set(String(id), {
            id,
            scenario_id: row.scenario_id,
            stage: row.stage,
            title: row.title,
            description: row.description,
            decisions: [],
          });
        }

        if (row.decision_id != null) {
          grouped.get(String(id)).decisions.push({
            id: row.decision_id,
            option_text: row.option_text,
            budget_change: row.budget_change ?? 0,
            time_change: row.time_change ?? 0,
            quality_change: row.quality_change ?? 0,
            risk_change: row.risk_change ?? 0,
            bugs_change: row.bugs_change ?? 0,
            technical_debt_change: row.technical_debt_change ?? 0,
            morale_change: row.morale_change ?? 0,
            customer_change: row.customer_change ?? 0,
          });
        }
      });

      setEvents(Array.from(grouped.values()));
    } catch (err) {
      setError(err.message || "Could not load events.");
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [scenarioId, request]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function resetEventForm() {
    setEventForm(emptyEvent);
    setEditingEventId(null);
  }

  function resetDecisionForm() {
    setDecisionForm(emptyDecision);
    setEditingDecisionId(null);
    setDecisionEventId(null);
  }

  async function saveEvent(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        scenario_id: Number(scenarioId),
        stage: eventForm.stage,
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
      };

      if (editingEventId != null) {
        await request(`/api/admin/events/${editingEventId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Event updated successfully.");
      } else {
        await request("/api/admin/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Event created. Add at least one decision option.");
      }

      resetEventForm();
      await loadEvents();
    } catch (err) {
      setError(err.message || "Could not save event.");
    } finally {
      setSaving(false);
    }
  }

  function startEditEvent(event) {
    setEditingEventId(event.id);
    setEventForm({
      stage: event.stage,
      title: event.title || "",
      description: event.description || "",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteEvent(event) {
    if (
      !window.confirm(
        `Delete "${event.title}" and all its decision options?`
      )
    ) return;

    setError("");
    setMessage("");

    try {
      // Delete decisions first to avoid foreign-key errors.
      for (const decision of event.decisions) {
        await request(`/api/admin/decisions/${decision.id}`, {
          method: "DELETE",
        });
      }

      await request(`/api/admin/events/${event.id}`, {
        method: "DELETE",
      });

      if (String(editingEventId) === String(event.id)) resetEventForm();
      if (String(decisionEventId) === String(event.id)) resetDecisionForm();

      setMessage("Event deleted.");
      await loadEvents();
    } catch (err) {
      setError(err.message || "Could not delete event.");
      await loadEvents();
    }
  }

  function startAddDecision(eventId) {
    resetDecisionForm();
    setDecisionEventId(eventId);
    setMessage("");
    setError("");
  }

  function startEditDecision(eventId, decision) {
    setDecisionEventId(eventId);
    setEditingDecisionId(decision.id);
    setDecisionForm({
      option_text: decision.option_text || "",
      budget_change: decision.budget_change ?? 0,
      time_change: decision.time_change ?? 0,
      quality_change: decision.quality_change ?? 0,
      risk_change: decision.risk_change ?? 0,
      bugs_change: decision.bugs_change ?? 0,
      technical_debt_change: decision.technical_debt_change ?? 0,
      morale_change: decision.morale_change ?? 0,
      customer_change: decision.customer_change ?? 0,
    });
    setMessage("");
    setError("");
  }

  async function saveDecision(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        option_text: decisionForm.option_text.trim(),
        ...Object.fromEntries(
          consequenceFields.map(([key]) => [key, Number(decisionForm[key]) || 0])
        ),
      };

      if (editingDecisionId != null) {
        await request(`/api/admin/decisions/${editingDecisionId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Decision updated successfully.");
      } else {
        await request(
          `/api/admin/events/${decisionEventId}/decisions`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
        setMessage("Decision added successfully.");
      }

      resetDecisionForm();
      await loadEvents();
    } catch (err) {
      setError(err.message || "Could not save decision.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDecision(eventId, decision) {
    if (!window.confirm(`Delete decision "${decision.option_text}"?`)) return;

    setError("");
    setMessage("");

    try {
      await request(`/api/admin/decisions/${decision.id}`, {
        method: "DELETE",
      });

      setMessage("Decision deleted.");
      await loadEvents();
    } catch (err) {
      setError(err.message || "Could not delete decision.");
    }
  }

  const selectedScenario = scenarios.find(
    (scenario) => String(scenario.id) === String(scenarioId)
  );

  return (
    <div className="admin-events-page">
      <div className="ae-heading">
        <div>
          <p className="ae-eyebrow">SCENARIO CONTENT</p>
          <h2>Manage Events &amp; Decisions</h2>
          <p>Create the situations and choices users encounter during simulations.</p>
        </div>
        <button className="ae-secondary" onClick={onBack}>← Dashboard</button>
      </div>

      {error && <div className="ae-alert ae-alert-error">{error}</div>}
      {message && <div className="ae-alert ae-alert-success">{message}</div>}

      <section className="ae-panel">
        <label htmlFor="ae-scenario">Select scenario</label>
        {loadingScenarios ? (
          <p>Loading scenarios...</p>
        ) : scenarios.length === 0 ? (
          <p>No scenarios found. Create a scenario first.</p>
        ) : (
          <select
            id="ae-scenario"
            value={scenarioId}
            onChange={(e) => {
              setScenarioId(e.target.value);
              resetEventForm();
              resetDecisionForm();
              setMessage("");
              setError("");
            }}
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        )}
        {selectedScenario && (
          <p className="ae-muted">
            Managing content for <strong>{selectedScenario.name}</strong>
          </p>
        )}
      </section>

      {scenarioId && (
        <>
          <section className="ae-panel">
            <div className="ae-panel-heading">
              <div>
                <h3>{editingEventId != null ? "Edit event" : "Create an event"}</h3>
                <p>Choose the exact stage where this situation should appear.</p>
              </div>
            </div>

            <form onSubmit={saveEvent} className="ae-form">
              <label>
                Simulation stage
                <select
                  value={eventForm.stage}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, stage: e.target.value })
                  }
                  required
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </label>

              <label>
                Event title
                <input
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, title: e.target.value })
                  }
                  placeholder="e.g. Customer requirements keep changing"
                  required
                  maxLength={200}
                />
              </label>

              <label>
                Event description
                <textarea
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, description: e.target.value })
                  }
                  placeholder="Describe the situation the project team faces..."
                  rows={4}
                />
              </label>

              <div className="ae-form-actions">
                <button className="ae-primary" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingEventId != null
                      ? "Save event changes"
                      : "Create event"}
                </button>
                {editingEventId != null && (
                  <button
                    type="button"
                    className="ae-secondary"
                    onClick={resetEventForm}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="ae-events-section">
            <div className="ae-list-heading">
              <div>
                <h3>Events for this scenario</h3>
                <p>
                  {events.length} event{events.length === 1 ? "" : "s"} ·
                  Each event needs at least one decision.
                </p>
              </div>
              <button className="ae-secondary" onClick={loadEvents} disabled={loadingEvents}>
                {loadingEvents ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            {loadingEvents ? (
              <div className="ae-empty">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="ae-empty">
                <span>🗂️</span>
                <h4>No events yet</h4>
                <p>Create an event above, then add its decision options.</p>
              </div>
            ) : (
              <div className="ae-event-list">
                {events.map((event) => (
                  <article className="ae-event-card" key={event.id}>
                    <div className="ae-event-top">
                      <div>
                        <span className="ae-stage">{event.stage}</span>
                        <h4>{event.title}</h4>
                        <p>{event.description || "No description provided."}</p>
                      </div>
                      <div className="ae-event-actions">
                        <button className="ae-secondary" onClick={() => startEditEvent(event)}>
                          Edit
                        </button>
                        <button className="ae-danger" onClick={() => deleteEvent(event)}>
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="ae-decision-heading">
                      <h5>Decision options ({event.decisions.length})</h5>
                      <button
                        className="ae-small-primary"
                        onClick={() => startAddDecision(event.id)}
                      >
                        + Add decision
                      </button>
                    </div>

                    {event.decisions.length === 0 ? (
                      <p className="ae-warning">
                        ⚠️ No decisions yet. This event will not appear in the simulator until you add one.
                      </p>
                    ) : (
                      <div className="ae-decision-list">
                        {event.decisions.map((decision) => (
                          <div className="ae-decision-card" key={decision.id}>
                            <div className="ae-decision-top">
                              <strong>{decision.option_text}</strong>
                              <div>
                                <button
                                  className="ae-text-button"
                                  onClick={() => startEditDecision(event.id, decision)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="ae-text-button ae-text-danger"
                                  onClick={() => deleteDecision(event.id, decision)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="ae-consequence-summary">
                              {consequenceFields.map(([key, label]) => (
                                <span key={key}>
                                  {label}: <strong>{Number(decision[key]) || 0}</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {decisionEventId != null &&
                      String(decisionEventId) === String(event.id) && (
                        <form className="ae-decision-form" onSubmit={saveDecision}>
                          <h5>
                            {editingDecisionId != null ? "Edit decision" : "New decision option"}
                          </h5>
                          <label>
                            Option text
                            <textarea
                              rows={2}
                              value={decisionForm.option_text}
                              onChange={(e) =>
                                setDecisionForm({
                                  ...decisionForm,
                                  option_text: e.target.value,
                                })
                              }
                              placeholder="Describe the action the project manager can take..."
                              required
                            />
                          </label>

                          <p className="ae-muted">
                            Enter positive or negative changes. For example, -10 budget means the budget decreases by 10.
                          </p>

                          <div className="ae-consequence-grid">
                            {consequenceFields.map(([key, label]) => (
                              <label key={key}>
                                {label}
                                <input
                                  type="number"
                                  step="any"
                                  value={decisionForm[key]}
                                  onChange={(e) =>
                                    setDecisionForm({
                                      ...decisionForm,
                                      [key]: e.target.value,
                                    })
                                  }
                                />
                              </label>
                            ))}
                          </div>

                          <div className="ae-form-actions">
                            <button className="ae-primary" disabled={saving}>
                              {saving ? "Saving..." : editingDecisionId != null ? "Save decision" : "Add decision"}
                            </button>
                            <button
                              type="button"
                              className="ae-secondary"
                              onClick={resetDecisionForm}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default AdminEvents;
