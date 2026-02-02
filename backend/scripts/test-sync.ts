import prisma from '@/db/client';
import { Polar } from "@polar-sh/sdk";

/**
 * Test script to manually sync subscription status
 * Run with: bun run scripts/test-sync.ts
 */
async function testSync() {
    const userEmail = 'tahaharbour@gmail.com'; // Change this to test user

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: userEmail }
    });

    if (!user) {
        console.error('User not found:', userEmail);
        return;
    }

    console.log('Found user:', user.email);
    console.log('Current status:', user.subscriptionStatus);
    console.log('Polar Customer ID:', user.polarCustomerId);

    // 1. Get all potential customer IDs for this user
    const customerIds = new Set<string>();
    if (user.polarCustomerId) {
        customerIds.add(user.polarCustomerId);
    }

    console.log('Looking up customers by email...');

    try {
        const polar = new Polar({
            accessToken: process.env.POLAR_ACCESS_TOKEN!,
            server: process.env.POLAR_ENV === 'production' ? 'production' : 'sandbox',
        });

        // Search for customer by email
        const customersResponse: any = await polar.customers.list({ email: user.email });

        if (customersResponse) {
            for await (const page of customersResponse) {
                const items = (page as any).result?.items || (page as any).items || [];
                for (const customer of items) {
                    if ((customer as any).email === user.email) {
                        const cid = (customer as any).id;
                        console.log('Found customer ID:', cid);
                        customerIds.add(cid);
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error finding customer:', e);
    }

    if (customerIds.size === 0) {
        console.log('No customer IDs found');
        return;
    }

    // Now check for subscriptions across all found customers
    console.log(`Checking for active subscriptions across ${customerIds.size} customers...`);

    try {
        const polar = new Polar({
            accessToken: process.env.POLAR_ACCESS_TOKEN!,
            server: process.env.POLAR_ENV === 'production' ? 'production' : 'sandbox',
        });

        let activeSub = null;
        let activeCustomerId = null;

        for (const customerId of customerIds) {
            console.log(`Checking customer ${customerId}...`);
            const subsResponse: any = await polar.subscriptions.list({ customerId });

            if (subsResponse) {
                for await (const page of subsResponse) {
                    const items = (page as any).result?.items || (page as any).items || [];

                    for (const sub of items) {
                        const subStatus = (sub as any).status;
                        console.log('  Subscription found:', {
                            id: (sub as any).id,
                            status: subStatus,
                            productId: (sub as any).productId,
                        });

                        // Consider both 'active' and 'trialing' as active subscriptions
                        if (subStatus === 'active' || subStatus === 'trialing') {
                            console.log(`  ✅ Found ${subStatus} subscription!`);
                            activeSub = sub;
                            activeCustomerId = customerId;
                            break;
                        }
                    }
                    if (activeSub) break;
                }
            }
            if (activeSub) break;
        }

        if (activeSub && activeCustomerId) {
            console.log(`Updating user to active subscription with customer ${activeCustomerId}...`);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    polarCustomerId: activeCustomerId,
                    polarSubscriptionId: (activeSub as any).id,
                    subscriptionStatus: 'active'
                }
            });

            console.log('✅ User updated to active subscription!');
        } else {
            console.log('No active subscriptions found across any customer record');

            // Update to inactive if was previously active
            if (user.subscriptionStatus === 'active') {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { subscriptionStatus: 'inactive' }
                });
                console.log('Updated user to inactive');
            }
        }

    } catch (e) {
        console.error('Error checking subscriptions:', e);
    }
}

testSync()
    .then(() => {
        console.log('Done');
        process.exit(0);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
