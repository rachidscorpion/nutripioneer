import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { polar, checkout, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { SignJWT } from 'jose';
import prisma from '@/db/client';

// Generate Apple client secret JWT dynamically
function generateAppleClientSecret(): string {
    const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!privateKey) {
        throw new Error('APPLE_PRIVATE_KEY is not set');
    }

    const now = Math.floor(Date.now() / 1000);

    return new SignJWT({
        iss: process.env.APPLE_TEAM_ID,
        sub: process.env.APPLE_CLIENT_ID,
        aud: 'https://appleid.apple.com',
    })
        .setProtectedHeader({
            alg: 'ES256',
            kid: process.env.APPLE_KEY_ID!,
        })
        .setIssuedAt(now)
        .setExpirationTime(now + 15777000) // 6 months (max allowed)
        .sign(privateKey);
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'sqlite',
    }),
    plugins: [
        polar({
            client: new Polar({
                accessToken: process.env.POLAR_ENV === 'production' ? process.env.POLAR_ACCESS_TOKEN! : process.env.POLAR_SANDBOX_ACCESS_TOKEN!,
                server: process.env.POLAR_ENV === 'production' ? 'production' : 'sandbox',
            }),
            use: [
                checkout({
                    products: [
                        {
                            productId: process.env.POLAR_PRODUCT1_PRODUCT_ID!,
                            slug: 'subscription'
                        }
                    ],
                    successUrl: '/home?success=true',
                    authenticatedUsersOnly: false
                }),
                webhooks({
                    secret: process.env.POLAR_ENV === 'production' ? process.env.POLAR_WEBHOOK_SECRET! : process.env.POLAR_SANDBOX_WEBHOOK_SECRET!,
                })
            ]
        })
    ],

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
            enabled: true,
        },
        apple: {
            clientId: process.env.APPLE_CLIENT_ID || '',
            clientSecret: () => generateAppleClientSecret(),
            clientKey: process.env.APPLE_KEY_ID || '',
            teamId: process.env.APPLE_TEAM_ID || '',
            enabled: true,
        },
    },

    // Social login redirects
    socialLogin: {
        successRedirectURL: `${(process.env.FRONTEND_URL || 'https://nutripioneer.com').replace(/\/$/, '')}/home`,
    },

    // Advanced: use a callback to see what redirect is being used
    // onBeforeOAuthSuccess: async (ctx) => {
    //     return ctx;
    // },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        },
        freshAge: 60 * 5, // Consider session fresh for 5 minutes
    },

    // Base URL for callbacks
    baseURL: process.env.BETTER_AUTH_URL,

    // Trust proxy headers to dynamically determine base URL
    trustedProxyHeaders: true,

    // Advanced configuration
    advanced: {
        defaultCookieAttributes: {
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production',
        },
        cookiePrefix: 'nutripioneer',
        crossSubDomainCookies: {
            enabled: process.env.NODE_ENV === 'production',
            domain: process.env.NODE_ENV === 'production' ? '.nutripioneer.com' : undefined,
        },
    },

    // Redirect URLs after successful auth
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ['google', 'apple']
        }
    },

    // Secret for signing tokens
    secret: process.env.BETTER_AUTH_SECRET,

    // Trust host header - dynamically build from environment
    trustedOrigins: (() => {
        const origins = [];

        // Always trust localhost in development
        if (process.env.NODE_ENV !== 'production') {
            origins.push(
                'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001',
                'https://columellar-semicatalytic-rina.ngrok-free.dev'
            );
        }

        // Add the BETTER_AUTH_URL if set
        if (process.env.BETTER_AUTH_URL) {
            origins.push(process.env.BETTER_AUTH_URL);

            // Also add http variant for ngrok
            try {
                const url = new URL(process.env.BETTER_AUTH_URL);
                origins.push(`http://${url.host}`);
            } catch (e) {
                // ignore invalid URL
            }
        }

        origins.push(
            'https://api.nutripioneer.com',
            'https://nutripioneer.com',
            'https://www.nutripioneer.com',
            'https://appleid.apple.com', // Required for OAuth callback
            'https://accounts.google.com',
            'http://localhost:3000', // Added local for debugging
            'https://columellar-semicatalytic-rina.ngrok-free.dev'
        );

        return origins.filter(Boolean);
    })(),
});

// Export auth types
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
