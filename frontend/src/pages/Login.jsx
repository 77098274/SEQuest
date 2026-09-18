function Login({
  authMode,
  setAuthMode,
  authForm,
  handleAuthChange,
  handleAuth,
  authMessage
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-circle">S</div>

        <h1>SEQuest</h1>

        <p className="auth-subtitle">
          Software Engineering Learning Simulator
        </p>

        <div className="auth-tabs">
          <button
            className={
              authMode === "login"
                ? "auth-tab active"
                : "auth-tab"
            }
            onClick={() => {
              setAuthMode("login");
            }}
          >
            Login
          </button>

          <button
            className={
              authMode === "register"
                ? "auth-tab active"
                : "auth-tab"
            }
            onClick={() => {
              setAuthMode("register");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth}>
          {authMode === "register" && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={authForm.name}
              onChange={handleAuthChange}
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={authForm.email}
            onChange={handleAuthChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={authForm.password}
            onChange={handleAuthChange}
            required
          />

          <button
            className="primary-button"
            type="submit"
          >
            {authMode === "login"
              ? "Login to SEQuest"
              : "Create Account"}
          </button>
        </form>

        {authMessage && (
          <p className="auth-message">
            {authMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;