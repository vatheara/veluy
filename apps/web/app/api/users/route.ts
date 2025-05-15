import { NextRequest } from "next/server";
import { createRouteHandler, json, errorResponse } from "veluy";

// Example user data
const users = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
];

type User = {
    id: string;
    name: string;
    email: string;
};

export const GET = createRouteHandler<
    User | User[] | { error: string } | { message: string }
>({
    // Get all users
    GET: async (req: NextRequest) => {
        // Demonstrate URL query params
        const url = new URL(req.url);
        const search = url.searchParams.get("search");

        if (search) {
            const filteredUsers = users.filter(
                (user) =>
                    user.name.toLowerCase().includes(search.toLowerCase()) ||
                    user.email.toLowerCase().includes(search.toLowerCase())
            );
            return json(filteredUsers);
        }

        return json(users);
    },

    // Create new user
    POST: async (req: NextRequest) => {
        try {
            const body = (await req.json()) as {
                name?: string;
                email?: string;
            };

            if (!body.name || !body.email) {
                return errorResponse("Name and email are required", 400);
            }

            const newUser = {
                id: (users.length + 1).toString(),
                name: body.name,
                email: body.email,
            };

            users.push(newUser);

            return json(newUser, 201);
        } catch (error) {
            return errorResponse("Invalid request body", 400);
        }
    },
});
