'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import styles from '@/styles/Feedback.module.css';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function FeedbackPage() {
    const router = useRouter();
    const [type, setType] = useState('GENERAL');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Fetch user profile to get ID and Email
            const profileRes = await api.user.getProfile();
            const user = profileRes.data.data;

            if (!user) {
                toast.error("User session not found. Please log in.");
                return;
            }

            await api.feedback.submit({
                type,
                message,
                userId: user.id,
                userEmail: user.email
            });

            setSubmitted(true);
            toast.success("Feedback submitted successfully");
        } catch (err) {
            console.error(err);
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className={styles.container}>
                <div className={styles.successMessage}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '50%' }}>
                            <Send size={32} color="#059669" />
                        </div>
                    </div>
                    <h2 className={styles.title}>Feedback Sent!</h2>
                    <p className={styles.subtitle}>Thank you for helping us improve NutriPioneer.</p>
                    <div style={{ marginTop: '2rem' }}>
                        <Link href="/profile" className={styles.submitButton} style={{ textDecoration: 'none', display: 'inline-flex' }}>
                            <ArrowLeft size={18} /> Back to Profile
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/profile" style={{ display: 'inline-flex', alignItems: 'center', color: '#666', marginBottom: '1rem', textDecoration: 'none' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back
                </Link>
                <h1 className={styles.title}>Send Feedback</h1>
                <p className={styles.subtitle}>Found a bug or have a suggestion? We'd love to hear from you.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="type" className={styles.label}>Feedback Type</label>
                    <select
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className={styles.select}
                    >
                        <option value="GENERAL">General Feedback</option>
                        <option value="BUG">Report a Bug</option>
                        <option value="FEATURE">Feature Request</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="message" className={styles.label}>Message</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={styles.textarea}
                        placeholder="Tell us what you think..."
                        required
                    />
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} /> Sending...
                        </>
                    ) : (
                        <>
                            Submit Feedback <Send size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
