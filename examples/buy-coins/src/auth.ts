import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/lib/db";

export const auth = betterAuth({
    database: drizzleAdapter(getDb(), {
        provider: 'sqlite'
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true // Users are automatically signed in after successful sign up
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24 // Update session every 24 hours
    }
})

