function Navbar({ user, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <h1>SEQuest</h1>
        <span>Software Engineering Simulator</span>
      </div>

      <div className="user-section">
        <span>👋 {user.name}</span>

        <button
          className="logout-button"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;