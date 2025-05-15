import { NextRequest } from "next/server";
import { createRouteHandler, json, errorResponse } from "veluy";

// Example user data (shared with the users endpoint)
const users = [
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
];

// Define user type
type User = {
    id: string;
    name: string;
    email: string;
};

export const GET = createRouteHandler<
    User | { error: string } | { message: string }
>({
    // Get user by ID
    GET: async (
        req: NextRequest,
        { params }: { params: Record<string, string> }
    ) => {
        const user = users.find((user) => user.id === params.id);

        if (!user) {
            return errorResponse("User not found", 404);
        }

        return json(user);
    },

    // Delete user
    DELETE: async (
        req: NextRequest,
        { params }: { params: Record<string, string> }
    ) => {
        const userIndex = users.findIndex((user) => user.id === params.id);

        if (userIndex === -1) {
            return errorResponse("User not found", 404);
        }

        users.splice(userIndex, 1);

        return json({ message: "User deleted successfully" });
    },
});
