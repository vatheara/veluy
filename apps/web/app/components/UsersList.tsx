"use client";

import { useState, useEffect } from "react";

type User = {
    id: string;
    name: string;
    email: string;
};

export function UsersList() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newUser, setNewUser] = useState({ name: "", email: "" });
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch all users or filtered users based on search term
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = searchTerm
                ? `/api/users?search=${encodeURIComponent(searchTerm)}`
                : "/api/users";

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Create a new user
    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate input
        if (!newUser.name || !newUser.email) {
            setError("Name and email are required");
            return;
        }

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newUser),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create user");
            }

            // Reset form and fetch updated users
            setNewUser({ name: "", email: "" });
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        }
    };

    // Delete a user
    const deleteUser = async (id: string) => {
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete user");
            }

            // Fetch updated users
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        }
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers();
    };

    return (
        <div className="users-container">
            <h2>Users</h2>

            {/* Search form */}
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="search-input"
                />
                <button type="submit" className="search-button">
                    Search
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setSearchTerm("");
                        fetchUsers();
                    }}
                    className="reset-button"
                >
                    Reset
                </button>
            </form>

            {/* Error message */}
            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            {/* New user form */}
            <form onSubmit={createUser} className="new-user-form">
                <h3>Add New User</h3>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Name"
                        value={newUser.name}
                        onChange={(e) =>
                            setNewUser({ ...newUser, name: e.target.value })
                        }
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <input
                        type="email"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) =>
                            setNewUser({ ...newUser, email: e.target.value })
                        }
                        className="form-input"
                    />
                </div>
                <button type="submit" className="submit-button">
                    Add User
                </button>
            </form>

            {/* Users list */}
            {loading ? (
                <p>Loading users...</p>
            ) : users.length === 0 ? (
                <p>No users found.</p>
            ) : (
                <ul className="users-list">
                    {users.map((user) => (
                        <li key={user.id} className="user-item">
                            <div className="user-info">
                                <h3>{user.name}</h3>
                                <p>{user.email}</p>
                                <p>ID: {user.id}</p>
                            </div>
                            <div className="user-actions">
                                <button
                                    onClick={() => deleteUser(user.id)}
                                    className="delete-button"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <style jsx>{`
                .users-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .search-form {
                    display: flex;
                    margin-bottom: 20px;
                }

                .search-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px 0 0 4px;
                }

                .search-button,
                .reset-button {
                    padding: 8px 16px;
                    background-color: #0070f3;
                    color: white;
                    border: none;
                    cursor: pointer;
                }

                .search-button {
                    border-radius: 0 4px 4px 0;
                }

                .reset-button {
                    margin-left: 8px;
                    border-radius: 4px;
                    background-color: #6b7280;
                }

                .error-message {
                    background-color: #fee2e2;
                    color: #ef4444;
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .error-message button {
                    background-color: #ef4444;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .new-user-form {
                    background-color: #f3f4f6;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 24px;
                }

                .form-group {
                    margin-bottom: 12px;
                }

                .form-input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }

                .submit-button {
                    background-color: #10b981;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .users-list {
                    list-style: none;
                    padding: 0;
                }

                .user-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background-color: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .user-info h3 {
                    margin: 0 0 8px 0;
                    color: #111827;
                }

                .user-info p {
                    margin: 4px 0;
                    color: #4b5563;
                }

                .delete-button {
                    background-color: #ef4444;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
