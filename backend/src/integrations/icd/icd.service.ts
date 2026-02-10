/**
 * WHO ICD-11 API Integration Service
 * Provides OAuth2 authenticated access to the ICD-11 medical classification database
 */

export interface ICDTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export interface ICDDiseaseResult {
    id: string;
    title: string;
    code: string;
    uri: string;
    description?: string;
}

export interface ICDSearchResponse {
    destinationEntities?: ICDDiseaseResult[];
    totalResults?: number;
}

class ICDService {
    private token: string | null = null;
    private tokenExpiry: number | null = null;

    private readonly baseUrl = 'https://id.who.int';
    private readonly tokenUrl = 'https://icdaccessmanagement.who.int/connect/token';

    private get clientId(): string {
        return process.env.ICD_CLIENT_ID || '';
    }

    private get clientSecret(): string {
        return process.env.ICD_CLIENT_SECRET || '';
    }

    /**
     * Get OAuth2 access token, refreshing if needed
     * Tokens are valid for ~1 hour
     */
    async getToken(): Promise<string> {
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        if (!this.clientId || !this.clientSecret) {
            console.warn('[ICD-11] Missing credentials (ICD_CLIENT_ID/ICD_CLIENT_SECRET)');
            throw new Error('ICD-11 credentials not configured');
        }

        try {
            const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

            const response = await fetch(this.tokenUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'grant_type=client_credentials&scope=icdapi_access',
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[ICD-11] Token request failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                    clientIdLength: this.clientId.length,
                    clientIdPrefix: this.clientId.substring(0, 10) + '...',
                });
                throw new Error(`ICD-11 token request failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as ICDTokenResponse;
            this.token = data.access_token;
            this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;

            return this.token;
        } catch (error) {
            console.error('[ICD-11] Failed to get token:', error);
            throw new Error('Failed to authenticate with ICD-11 API');
        }
    }

    /**
     * Search for medical conditions in ICD-11 database
     * @param query Search term
     * @returns List of matching conditions
     */
    async searchConditions(query: string): Promise<ICDDiseaseResult[]> {
        try {
            const token = await this.getToken();

            const url = new URL(`${this.baseUrl}/icd/release/11/2024-01/mms/search`);
            url.searchParams.set('q', query);
            url.searchParams.set('useFlexisearch', 'true');
            url.searchParams.set('includeKeywordResult', 'true');

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'API-Version': 'v2',
                    'Accept-Language': 'en',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[ICD-11] Search API failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                    query,
                });
                throw new Error(`ICD-11 search failed: ${response.status}`);
            }

            const data = await response.json() as ICDSearchResponse;

            if (!data.destinationEntities || data.destinationEntities.length === 0) {
                return [];
            }

            const results = data.destinationEntities.map((entity: any) => ({
                id: entity.id,
                title: entity.title.replace(/<[^>]*>?/gm, ''), // Strip HTML tags immediately
                code: entity.code || entity.theCode || '',
                uri: entity.uri || entity.id,
                description: entity.description,
            }));

            // Sort results: move "unspecified" to the bottom
            return results.sort((a, b) => {
                const aUnspecified = a.title.toLowerCase().includes('unspecified');
                const bUnspecified = b.title.toLowerCase().includes('unspecified');

                if (aUnspecified && !bUnspecified) return 1;
                if (!aUnspecified && bUnspecified) return -1;
                return 0;
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[ICD-11] Search failed for "${query}":`, errorMessage);

            // Return empty array instead of throwing - graceful degradation
            // This allows the app to continue functioning even if ICD API is down
            return [];
        }
    }

    /**
     * Get detailed information about a specific condition by URI
     * @param uri The Foundation URI from ICD-11
     */
    async getConditionByUri(uri: string): Promise<Record<string, unknown> | null> {
        try {
            const token = await this.getToken();

            const response = await fetch(uri, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'API-Version': 'v2',
                    'Accept-Language': 'en',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`ICD-11 get condition failed: ${response.status}`);
            }

            return await response.json() as Record<string, unknown>;
        } catch (error) {
            console.error(`[ICD-11] Get condition failed for URI "${uri}":`, error);
            return null;
        }
    }
}

export const icdService = new ICDService();
