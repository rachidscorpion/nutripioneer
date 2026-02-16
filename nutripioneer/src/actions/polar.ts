'use server';

import { Polar } from "@polar-sh/sdk";
import { redirect } from "next/navigation";

export async function createCustomerPortalSession(customerId: string) {
    const accessToken = process.env.NEXT_PUBLIC_POLAR_ENV === 'development' ? process.env.POLAR_SANDBOX_ACCESS_TOKEN : process.env.POLAR_ACCESS_TOKEN;

    if (!accessToken) {
        throw new Error("POLAR_ACCESS_TOKEN is not configured");
    }

    const polar = new Polar({
        accessToken,
        server: process.env.NODE_ENV === 'development' ? 'sandbox' : 'production'
    });

    try {
        const result = await polar.customerSessions.create({
            customerId,
        });

        if (result && result.customerPortalUrl) {
            redirect(result.customerPortalUrl);
        } else {
            throw new Error("Failed to create customer portal session: No URL returned");
        }

    } catch (error) {
        // rethrow redirect
        if ((error as any).message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error("Failed to create customer portal session:", error);
        throw new Error("Failed to access customer portal");
    }
}
