import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

// Server-side backend URL for internal API calls
const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
    throw new Error('❌ BACKEND_URL environment variable is not set. Please check your .env file.');
}

export async function getSession() {
    try {
        const headersList = await headers();
        const cookie = headersList.get('cookie') || '';

        const res = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
            headers: {
                cookie: cookie,
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return null;
        }

        const session = await res.json();
        return session;
    } catch (e) {
        console.error("Failed to fetch session", e);
        return null;
    }
}

export async function requireAuth() {
    const session = await getSession();
    if (!session || !session.user) {
        redirect('/onboarding');
    }
    return session;
}

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const res = await fetch(`${BACKEND_URL}/api${normalizedPath}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie,
            ...options.headers,
        },
        cache: 'no-store',
    });

    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`API request failed: ${res.status}`);
    }

    return res.json();
}
