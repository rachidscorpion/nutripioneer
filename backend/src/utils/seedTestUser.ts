import { auth } from '@/lib/auth';
import prisma from '@/db/client';

export async function seedTestUser() {
    try {
        const testEmail = 'test@nutripioneer.com';
        const testPassword = 'test@123';
        const testName = 'Test User';

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: testEmail },
        });

        if (!existingUser) {
            console.log(`・✿ Seeding test account: ${testEmail}`);
            // Use better auth's server-side API to create a user properly
            await auth.api.signUpEmail({
                body: {
                    email: testEmail,
                    password: testPassword,
                    name: testName,
                },
            });
            // Mark email as verified so test account can login without OTP
            await prisma.user.update({
                where: { email: testEmail },
                data: { emailVerified: true },
            });
            console.log(`・✿ Test account created and verified!`);
        } else if (!existingUser.emailVerified) {
            // If test user exists but not verified, verify them
            await prisma.user.update({
                where: { email: testEmail },
                data: { emailVerified: true },
            });
            console.log(`・✿ Test account verified.`);
        } else {
            console.log(`・✿ Test account already exists.`);
        }
    } catch (error) {
        console.error('Failed to seed test user:', error);
    }
}
