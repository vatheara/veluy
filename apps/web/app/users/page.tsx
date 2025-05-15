"use client";

import { UsersList } from "../components/UsersList";

export default function UsersPage() {
    return (
        <div className="container">
            <header>
                <h1>User Management</h1>
                <p>Manage users with our API powered by Veluy</p>
            </header>

            <main>
                <UsersList />
            </main>

            <footer>
                <a href="/">Back to home</a>
            </footer>

            <style jsx>{`
                .container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    padding: 2rem;
                }

                header {
                    margin-bottom: 2rem;
                    text-align: center;
                }

                h1 {
                    margin-bottom: 0.5rem;
                    font-size: 2.5rem;
                    color: #111827;
                }

                p {
                    color: #6b7280;
                    font-size: 1.2rem;
                }

                main {
                    flex: 1;
                }

                footer {
                    margin-top: 2rem;
                    text-align: center;
                    padding: 1rem 0;
                }

                footer a {
                    color: #0070f3;
                    text-decoration: none;
                }

                footer a:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
