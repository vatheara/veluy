# Veluy

A utility library for building Next.js API routes with the App Router.

## Installation

```bash
# If using npm
npm install veluy

# If using yarn
yarn add veluy

# If using pnpm
pnpm add veluy
```

## Usage

Veluy provides utilities for creating Next.js API routes with method-based routing.

### Basic Example

```typescript
// app/api/users/route.ts
import { createRouteHandler, json, errorResponse } from "veluy";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const GET = createRouteHandler({
    // Get all users
    GET: async (req: NextRequest) => {
        const users = await db.user.findMany();
        return json(users);
    },

    // Create a new user
    POST: async (req: NextRequest) => {
        try {
            const body = await req.json();

            if (!body.name || !body.email) {
                return errorResponse("Name and email are required", 400);
            }

            const user = await db.user.create({
                data: {
                    name: body.name,
                    email: body.email,
                },
            });

            return json(user, 201);
        } catch (error) {
            return errorResponse("Invalid request body", 400);
        }
    },
});
```

### Route with Dynamic Parameters

```typescript
// app/api/users/[id]/route.ts
import { createRouteHandler, json, errorResponse } from "veluy";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export const GET = createRouteHandler({
    // Get user by ID
    GET: async (req: NextRequest, { params }) => {
        const user = await db.user.findUnique({
            where: { id: params.id },
        });

        if (!user) {
            return errorResponse("User not found", 404);
        }

        return json(user);
    },

    // Update user
    PUT: async (req: NextRequest, { params }) => {
        try {
            const body = await req.json();

            const user = await db.user.update({
                where: { id: params.id },
                data: body,
            });

            return json(user);
        } catch (error) {
            return errorResponse("Failed to update user", 400);
        }
    },

    // Delete user
    DELETE: async (req: NextRequest, { params }) => {
        try {
            await db.user.delete({
                where: { id: params.id },
            });

            return json({ message: "User deleted successfully" });
        } catch (error) {
            return errorResponse("Failed to delete user", 400);
        }
    },
});
```

## API Reference

### `createRouteHandler(handlers)`

Creates a Next.js App Router compatible route handler with method-based routing.

```typescript
import { createRouteHandler } from "veluy";

const handler = createRouteHandler({
    GET: async (req, { params }) => {
        // Handle GET request
    },
    POST: async (req, { params }) => {
        // Handle POST request
    },
    // ... other HTTP methods
});
```

### `json(data, status?, headers?)`

Creates a JSON response with the provided data.

```typescript
import { json } from "veluy";

// Return data with 200 status code
return json({ success: true });

// Return data with 201 status code
return json({ id: 123, name: "New Item" }, 201);

// With custom headers
return json(data, 200, { "X-Custom-Header": "value" });
```

### `errorResponse(message, status?, headers?)`

Creates an error response.

```typescript
import { errorResponse } from "veluy";

// Return 400 error
return errorResponse("Bad request");

// Return 404 error
return errorResponse("Resource not found", 404);

// With custom headers
return errorResponse("Unauthorized", 401, { "WWW-Authenticate": "Bearer" });
```

## License

ISC
