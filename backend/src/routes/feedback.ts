import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '@/db/client';
import { resend } from '@/lib/resend';
import { auth } from '@/lib/auth'; // Ensure this is correct

const app = new Hono();

const feedbackSchema = z.object({
    type: z.enum(['BUG', 'FEATURE', 'GENERAL', 'OTHER']),
    message: z.string().min(1, "Message is required"),
    userEmail: z.string().email(),
    userId: z.string()
});

app.post('/', zValidator('json', feedbackSchema), async (c) => {
    const data = c.req.valid('json');

    try {
        console.log("Receieved feedback:", data);

        // 1. Save to Database
        const feedback = await prisma.feedback.create({
            data: {
                userId: data.userId,
                userEmail: data.userEmail,
                type: data.type,
                message: data.message
            }
        });

        console.log("Saved feedback to DB:", feedback.id);

        // 2. Send Email
        const fromEmail = 'onboarding@resend.dev';
        const toEmail = 'admin@nutripioneer.com';

        if (process.env.RESEND_API_KEY && fromEmail && toEmail) {
            try {
                const emailResponse = await resend.emails.send({
                    from: fromEmail,
                    to: toEmail,
                    subject: `New Feedback: ${data.type}`,
                    html: `
                        <h2>New Feedback Received</h2>
                        <p><strong>Type:</strong> ${data.type}</p>
                        <p><strong>User:</strong> ${data.userEmail} (ID: ${data.userId})</p>
                        <p><strong>Message:</strong></p>
                        <blockquote style="background: #f9f9f9; padding: 10px; border-left: 5px solid #ccc;">
                            ${data.message.replace(/\n/g, '<br>')}
                        </blockquote>
                        <p><small>Sent from NutriPioneer App</small></p>
                    `
                });
                console.log("Email sent via Resend:", emailResponse);
            } catch (emailError) {
                console.error("Failed to send email via Resend:", emailError);
                // Don't fail the request if email fails, as DB save succeeded
            }
        } else {
            console.log("Resend configuration missing or incomplete. Skipping email.");
            if (!process.env.RESEND_API_KEY) console.log("- Missing RESEND_API_KEY");
            if (!fromEmail) console.log("- Missing FEEDBACK_FROM_EMAIL");
            if (!toEmail) console.log("- Missing FEEDBACK_TO_EMAIL");
        }

        return c.json({ success: true, feedback });
    } catch (e) {
        console.error("Error submitting feedback:", e);
        return c.json({ success: false, error: "Failed to submit feedback" }, 500);
    }
});

export default app;
