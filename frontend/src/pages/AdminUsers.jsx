
import { useCallback, useEffect, useState } from "react";
import "./AdminUsers.css";

const API = "http://localhost:5001";

function AdminUsers({ token, currentUser, onBack }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load users");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected user data received from server");
      }

      setUsers(data);
    } catch (err) {
      setError(err.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId, newRole) => {
    const selectedUser = users.find(
      (item) => Number(item.id) === Number(userId)
    );

    if (!selectedUser || selectedUser.role === newRole) {
      return;
    }

    const confirmed = window.confirm(
      `Change ${selectedUser.name}'s role from ${selectedUser.role} to ${newRole}?`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingId(userId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/admin/users/${userId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user role");
      }

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          Number(item.id) === Number(userId)
            ? { ...item, role: data.role || newRole }
            : item
        )
      );

      setMessage(`${selectedUser.name}'s role was updated to ${newRole}.`);
    } catch (err) {
      setError(err.message || "Could not update user role");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((item) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      String(item.name || "").toLowerCase().includes(query) ||
      String(item.email || "").toLowerCase().includes(query) ||
      String(item.id).includes(query);

    const matchesRole =
      roleFilter === "ALL" || item.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter(
    (item) => item.role === "ADMIN"
  ).length;

  const regularCount = users.filter(
    (item) => item.role === "USER"
  ).length;

  return (
    <section className="admin-users-page">
      <div className="admin-users-heading">
        <div>
          <p className="admin-users-eyebrow">ADMINISTRATION</p>
          <h2>User Management</h2>
          <p>View registered users and manage their access roles.</p>
        </div>

        <button
          type="button"
          className="admin-users-back"
          onClick={onBack}
        >
          ← Back to Admin Dashboard
        </button>
      </div>

      <div className="admin-users-stats">
        <article className="admin-users-stat">
          <span>Total Users</span>
          <strong>{users.length}</strong>
        </article>

        <article className="admin-users-stat">
          <span>Administrators</span>
          <strong>{adminCount}</strong>
        </article>

        <article className="admin-users-stat">
          <span>Regular Users</span>
          <strong>{regularCount}</strong>
        </article>
      </div>

      {error && (
        <div className="admin-users-alert error" role="alert">
          {error}
          <button type="button" onClick={loadUsers}>
            Retry
          </button>
        </div>
      )}

      {message && (
        <div className="admin-users-alert success" role="status">
          {message}
        </div>
      )}

      <div className="admin-users-panel">
        <div className="admin-users-toolbar">
          <div>
            <h3>Registered Accounts</h3>
            <p>Search users or filter by role.</p>
          </div>

          <button
            type="button"
            className="admin-users-refresh"
            onClick={loadUsers}
            disabled={loading || updatingId !== null}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        <div className="admin-users-filters">
          <input
            type="search"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="ALL">All roles</option>
            <option value="ADMIN">Administrators</option>
            <option value="USER">Regular users</option>
          </select>
        </div>

        {loading ? (
          <div className="admin-users-empty">Loading registered users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-users-empty">
            No users match your search.
          </div>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>User ID</th>
                  <th>Simulations</th>
                  <th>Current Role</th>
                  <th>Change Role</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((item) => {
                  const isCurrentUser =
                    Number(item.id) === Number(currentUser?.id);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="admin-users-identity">
                          <div className="admin-users-avatar">
                            {String(item.name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.email}</span>
                            {isCurrentUser && (
                              <small>You</small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>#{item.id}</td>

                      <td>{Number(item.total_simulations) || 0}</td>

                      <td>
                        <span
                          className={`admin-users-role ${
                            item.role === "ADMIN" ? "admin" : "user"
                          }`}
                        >
                          {item.role}
                        </span>
                      </td>

                      <td>
                        <select
                          value={item.role}
                          disabled={
                            updatingId !== null || isCurrentUser
                          }
                          onChange={(e) =>
                            handleRoleChange(item.id, e.target.value)
                          }
                          aria-label={`Change role for ${item.name}`}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>

                        {isCurrentUser && (
                          <small className="admin-users-note">
                            Your own role is protected
                          </small>
                        )}

                        {updatingId === item.id && (
                          <small className="admin-users-note">
                            Updating...
                          </small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-users-footer">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </section>
  );
}

export default AdminUsers;
