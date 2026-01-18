import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '@/db/client';

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'sqlite',
    }),

    // Email & Password authentication
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        minPasswordLength: 8,
    },

    // OAuth Providers
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        },
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        },
    },

    // Base URL for callbacks
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

    // Secret for signing tokens
    secret: process.env.BETTER_AUTH_SECRET,

    // Trust host header
    trustedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.BETTER_AUTH_URL || '',
    ].filter(Boolean),
});

// Export auth types
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
