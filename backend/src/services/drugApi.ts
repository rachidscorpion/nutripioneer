
const RXNORM_BASE = "https://rxnav.nlm.nih.gov/REST";
const OPENFDA_BASE = "https://api.fda.gov/drug/label.json";

export interface DrugSearchResult {
    name: string;
    rxcui?: string;
}

export interface DrugDetails {
    openfda_rxcui: string[];
    rxnorm_rxcui: string;
    name: string;
    ingredients: string[];
    interactions: string;
    pharm_class: string[];

    // New fields
    warnings?: string[];
    purpose?: string[];
    pregnancy_or_breast_feeding?: string[];
    substance_name?: string[];

    // OpenFDA fields
    spl_product_data_elements?: string[];
    spl_unclassified_section?: string[];
    active_ingredient?: string[];
    indications_and_usage?: string[];
    do_not_use?: string[];
    ask_doctor?: string[];
    ask_doctor_or_pharmacist?: string[];
    when_using?: string[];
    stop_use?: string[];
    keep_out_of_reach_of_children?: string[];
    dosage_and_administration?: string[];
    dosage_and_administration_table?: string[];
    inactive_ingredient?: string[];
    recent_major_changes?: string[];
    package_label_principal_display_panel?: string[];
    set_id?: string;
    id?: string;
    effective_time?: string;
    version?: string;
    openfda?: any;

    [key: string]: any;
}

interface RxNormDisplayResponse {
    displayTermsList?: {
        term?: string[];
    };
}

interface RxNormCuiResponse {
    idGroup?: {
        rxnormId?: string[];
    };
}

interface OpenFDAResponse {
    results?: Array<{
        openfda?: {
            substance_name?: string[];
            pharm_class_epc?: string[];
            rxcui?: string[];
        };
        active_ingredient?: string[];
        drug_interactions?: string[];
        [key: string]: any;
    }>;
}

interface RxNormApproximateResponse {
    approximateGroup?: {
        candidate?: Array<{
            rxcui: string;
            rxaui: string;
            score: string;
            rank: string;
            name?: string;
            source: string;
        }>;
    };
}

export async function searchDrugs(query: string): Promise<DrugSearchResult[]> {
    try {
        const res = await fetch(`${RXNORM_BASE}/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=10`);
        if (!res.ok) {
            throw new Error(`RxNorm API error: ${res.statusText}`);
        }
        const data = (await res.json()) as RxNormApproximateResponse;

        const candidates = data.approximateGroup?.candidate || [];

        const uniqueDrugs = new Map<string, DrugSearchResult>();

        for (const c of candidates) {
            if (c.name) {
                if (c.name.length > 80) continue;

                const lowerName = c.name.toLowerCase();
                if (!uniqueDrugs.has(lowerName)) {
                    uniqueDrugs.set(lowerName, { name: c.name, rxcui: c.rxcui });
                }
            }
        }

        return Array.from(uniqueDrugs.values());
    } catch (error) {
        console.error("Error searching drugs:", error);
        return [];
    }
}

function cleanSearchTerm(name: string): string {
    if (!name) return "";
    const firstWord = name.split(' ')[0]?.replace(/[^a-zA-Z0-9]/g, "");
    return firstWord || (name.replace(/[^a-zA-Z0-9 ]/g, "").split(' ')[0] || "");
}

async function getIngredientRxcui(specificRxcui: string): Promise<string | null> {
    try {
        const res = await fetch(`${RXNORM_BASE}/rxcui/${specificRxcui}/related.json?tty=IN`);
        if (!res.ok) return null;

        const data = (await res.json()) as any;
        const relatedGroup = data.relatedGroup;

        if (relatedGroup?.conceptGroup) {
            for (const group of relatedGroup.conceptGroup) {
                if (group.tty === "IN" && group.conceptProperties?.length > 0) {
                    return group.conceptProperties[0].rxcui;
                }
            }
        }
        return null;
    } catch (e) {
        console.warn("Failed to resolve ingredient RxCUI", e);
        return null;
    }
}

function extractFoodWarnings(label: any): string {
    const fields = [
        label?.drug_interactions?.[0],
        label?.precautions?.[0],
        label?.food_safety_warning?.[0]
    ];

    const combined = fields.filter(Boolean).join(" ");

    if (combined && /food|alcohol|grapefruit|meal/i.test(combined)) {
        return fields.find(f => /food|alcohol|grapefruit|meal/i.test(f)) || combined.substring(0, 200) + "...";
    }

    return "Consult a doctor for food interactions.";
}

export async function getDrugEnrichment(drugName: string, userRxcui: string): Promise<DrugDetails | null> {
    const apiKey = process.env.OPENFDA_API_KEY || "";

    try {
        // OPTIMIZATION: You already have the userRxcui, so we don't need to fetch it again by name.
        // We can go straight to finding the "Ingredient RxCUI" to help find the FDA label.

        let ingredientRxcui: string | null = null;

        // Try to get the generic ingredient ID (often helps find the label better than brand ID)
        try {
            ingredientRxcui = await getIngredientRxcui(userRxcui);
        } catch (e) {
            console.warn("Could not resolve ingredient RxCUI, using Brand ID only.");
        }

        // 1. Build Query: Search FDA by specific ID OR Ingredient ID
        const rxcuiQuery = ingredientRxcui
            ? `openfda.rxcui:("${userRxcui}"+"${ingredientRxcui}")`
            : `openfda.rxcui:"${userRxcui}"`;

        let fdaUrl = `${OPENFDA_BASE}?api_key=${apiKey}&search=${rxcuiQuery}&limit=1`;
        let fdaRes = await fetch(fdaUrl);
        let fdaData: OpenFDAResponse | null = null;

        // 2. Fetch from OpenFDA
        if (fdaRes.ok) {
            fdaData = (await fdaRes.json()) as OpenFDAResponse;
        }

        // 3. Fallback: If ID search fails, search by Name
        if (!fdaData || !fdaData.results || fdaData.results.length === 0) {
            console.warn(`RxCUI search failed for ${drugName} (ID: ${userRxcui}). Switching to Name Search.`);
            const cleanName = cleanSearchTerm(drugName);
            const nameQuery = `(openfda.brand_name:"${cleanName}"+openfda.generic_name:"${cleanName}")`;

            fdaUrl = `${OPENFDA_BASE}?api_key=${apiKey}&search=${nameQuery}&limit=1`;
            fdaRes = await fetch(fdaUrl);

            if (fdaRes.ok) {
                fdaData = (await fdaRes.json()) as OpenFDAResponse;
            }
        }

        // 4. Handle "No Data Found"
        if (!fdaData || !fdaData.results?.[0]) {
            return {
                rxnorm_rxcui: userRxcui, // KEEP THE USER ID
                openfda_rxcui: [],
                name: drugName,
                ingredients: [],
                interactions: "No specific details found in OpenFDA.",
                pharm_class: []
            };
        }

        const label = fdaData.results[0];

        // 5. Return the Merged Object
        return {
            ...label,
            // PRIMARY KEY: The specific ID the user selected
            rxnorm_rxcui: userRxcui,
            openfda_rxcui: label.openfda?.rxcui || [],
            // METADATA: The list of IDs this label "covers" (Good for debugging)

            name: drugName,
            ingredients: label?.openfda?.substance_name || label?.active_ingredient || [],
            interactions: extractFoodWarnings(label),
            pharm_class: label?.openfda?.pharm_class_epc || [],

            // Standardize Fields for your AI
            warnings: label?.warnings || [],
            purpose: label?.purpose || [],
            pregnancy_or_breast_feeding: label?.pregnancy_or_breast_feeding || [],
            substance_name: label?.openfda?.substance_name || []
        };

    } catch (error) {
        console.error("Error enrichment:", error);
        return null;
    }
}
