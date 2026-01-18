'use server';

import { getSession } from '@/lib/server-auth';

export async function getServerSessionAction() {
    return await getSession();
}
