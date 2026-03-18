import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailOTP } from 'better-auth/plugins';
import { polar, checkout, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { importPKCS8, SignJWT } from 'jose';
import { resend } from '@/lib/resend';
import prisma from '@/db/client';

// Generate Apple client secret JWT dynamically
async function generateAppleClientSecret(): Promise<string> {
    const privateKeyStr = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!privateKeyStr) {
        throw new Error('APPLE_PRIVATE_KEY is not set');
    }

    const privateKey = await importPKCS8(privateKeyStr, 'ES256');

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

// Pre-generate Apple client secret since `jose` requires async operations
const appleClientSecret = await generateAppleClientSecret().catch(err => {
    console.warn('Failed to generate Apple client secret:', err.message);
    return '';
});

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
        }),
        emailOTP({
            otpLength: 6,
            expiresIn: 300, // 5 minutes
            sendVerificationOnSignUp: true,
            async sendVerificationOTP({ email, otp, type }) {
                // Always log OTP in development for testing convenience
                console.log(`\n🔐 OTP for ${email} (${type}): ${otp}\n`);

                const subject = type === 'email-verification'
                    ? 'Verify your NutriPioneer email'
                    : type === 'sign-in'
                        ? 'Your NutriPioneer sign-in code'
                        : 'Reset your NutriPioneer password';

                try {
                    const result = await resend.emails.send({
                        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                        to: email,
                        subject,
                        html: `
                            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px;">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <h1 style="color: #1e293b; font-size: 24px; margin: 0;">NutriPioneer</h1>
                                </div>
                                <p style="color: #475569; font-size: 16px; line-height: 1.5;">
                                    ${type === 'email-verification' ? 'Welcome! Please verify your email address.' : type === 'sign-in' ? 'Use this code to sign in.' : 'Use this code to reset your password.'}
                                </p>
                                <div style="text-align: center; margin: 32px 0;">
                                    <span style="display: inline-block; background: #f1f5f9; color: #0f172a; font-size: 36px; font-weight: 700; letter-spacing: 8px; padding: 16px 32px; border-radius: 12px; border: 2px dashed #61d588;">
                                        ${otp}
                                    </span>
                                </div>
                                <p style="color: #94a3b8; font-size: 14px; text-align: center;">
                                    This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.
                                </p>
                            </div>
                        `,
                    });
                    if (result.error) {
                        console.warn('Resend email warning:', result.error.message);
                        console.log('📋 Use the OTP from the console log above to verify.');
                    } else {
                        console.log(`OTP email sent to ${email} (type: ${type})`);
                    }
                } catch (err) {
                    console.error('Failed to send OTP email:', err);
                    console.log('📋 Use the OTP from the console log above to verify.');
                }
            },
        }),
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
            clientSecret: appleClientSecret,
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
