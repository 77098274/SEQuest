import { useEffect, useState } from "react";
import "./App.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Simulation from "./pages/Simulation";
import Navbar from "./components/Navbar";
import { stages } from "./data/scenarios";

const API = "http://localhost:5001";

function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [authMessage, setAuthMessage] = useState("");

  const [scenarios, setScenarios] = useState([]);
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [result, setResult] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    const savedUser =
      localStorage.getItem("sequest_user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    fetch(`${API}/api/scenarios`)
      .then((response) => response.json())
      .then((data) => setScenarios(data))
      .catch(() => {
        setMessage("Failed to load scenarios");
      });
  }, [user]);

  const handleAuthChange = (e) => {
    setAuthForm({
      ...authForm,
      [e.target.name]: e.target.value
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthMessage("");

    try {
      const endpoint =
        authMode === "login"
          ? "/api/login"
          : "/api/register";

      const body =
        authMode === "login"
          ? {
              email: authForm.email,
              password: authForm.password
            }
          : authForm;

      const response = await fetch(
        `${API}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAuthMessage(
          data.error || "Authentication failed"
        );
        return;
      }

      if (authMode === "register") {
        setAuthMessage(
          "Registration successful! Please login."
        );

        setAuthMode("login");

        setAuthForm({
          name: "",
          email: authForm.email,
          password: ""
        });

        return;
      }

      localStorage.setItem(
        "sequest_user",
        JSON.stringify(data.user)
      );

      setUser(data.user);
      setAuthMessage("");
    } catch {
      setAuthMessage(
        "Cannot connect to SEQuest server"
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("sequest_user");

    setUser(null);
    setSessionId(null);
    setSimulation(null);
    setEvent(null);
    setResult(null);
    setAiAnalysis(null);
    setMessage("");
  };

  const startSimulation = (scenarioId) => {
    setResult(null);
    setAiAnalysis(null);
    setEvent(null);

    fetch(`${API}/api/simulations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: user.id,
        scenario_id: scenarioId
      })
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.session_id) {
          throw new Error(
            "Simulation could not start"
          );
        }

        setSessionId(data.session_id);

        setMessage(
          `Simulation started! Session ID: ${data.session_id}`
        );

        return fetch(
          `${API}/api/simulations/${data.session_id}`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        setSimulation(data);

        return fetch(
          `${API}/api/events/${data.scenario_id}/Requirements`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        setEvent(data);
      })
      .catch(() => {
        setMessage(
          "Failed to start simulation"
        );
      });
  };

  const makeDecision = (decisionId) => {
    fetch(
      `${API}/api/decisions/${sessionId}/${decisionId}`,
      {
        method: "POST"
      }
    )
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);

        return fetch(
          `${API}/api/simulations/${sessionId}`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        setSimulation(data);

        const currentIndex =
          stages.indexOf(data.current_stage);

        if (
          currentIndex <
          stages.length - 1
        ) {
          const nextStage =
            stages[currentIndex + 1];

          return fetch(
            `${API}/api/events/${data.scenario_id}/${nextStage}`
          )
            .then((response) => response.json())
            .then((nextEvent) => {
              setEvent(nextEvent);
            });
        }

        return completeSimulation();
      })
      .catch(() => {
        setMessage(
          "Failed to apply decision"
        );
      });
  };

  const completeSimulation = () => {
    return fetch(
      `${API}/api/simulations/${sessionId}/complete`,
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
          `${API}/api/ai-analysis/${sessionId}`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        setAiAnalysis(data);
      })
      .catch(() => {
        setMessage(
          "Simulation completed but AI analysis failed"
        );
      });
  };

  const restartSimulation = () => {
    setResult(null);
    setAiAnalysis(null);
    setSimulation(null);
    setSessionId(null);
    setEvent(null);
    setMessage("");
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

  return (
    <div className="app">
      <Navbar
        user={user}
        onLogout={logout}
      />

      <main className="container">
        {!event && !result && (
          <Dashboard
            scenarios={scenarios}
            onStartSimulation={startSimulation}
          />
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