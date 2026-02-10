import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { polar, checkout, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import prisma from '@/db/client';

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'sqlite',
    }),
    plugins: [
        polar({
            client: new Polar({
                accessToken: process.env.POLAR_ACCESS_TOKEN!,
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
                    secret: process.env.POLAR_WEBHOOK_SECRET!,
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
    },

    // Social login redirects
    socialLogin: {
        successRedirectURL: '/home',
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        },
        freshAge: 60 * 5, // Consider session fresh for 5 minutes
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    },

    // Base URL for callbacks
    baseURL: `${process.env.BETTER_AUTH_URL}` || 'http://localhost:3001',

    // Advanced configuration
    advanced: {
        cookiePrefix: 'nutripioneer',
        crossSubDomainCookies: {
            enabled: true,
        },
    },

    // Redirect URLs after successful auth
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ['google']
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
                'http://127.0.0.1:3001'
            );
        }

        // Add the BETTER_AUTH_URL if set
        if (process.env.BETTER_AUTH_URL) {
            origins.push(process.env.BETTER_AUTH_URL);

            // Also add www variant and both http/https variants for production
            try {
                const url = new URL(process.env.BETTER_AUTH_URL);
                const hostname = url.hostname;

                if (!hostname.startsWith('www.')) {
                    origins.push(`${url.protocol}//www.${hostname}`);
                } else {
                    origins.push(`${url.protocol}//${hostname.replace('www.', '')}`);
                }
            } catch (e) {
                console.warn('Invalid BETTER_AUTH_URL format:', process.env.BETTER_AUTH_URL);
            }
        }

        origins.push(
            'https://api.nutripioneer.com',
            'https://nutripioneer.com',
            'https://www.nutripioneer.com',
            'http://localhost:3000' // Added local for debugging 
        );

        return origins.filter(Boolean);
    })(),
});

// Export auth types
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
