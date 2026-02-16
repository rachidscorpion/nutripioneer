
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy model to access API? No, need specific list method if available, or just try to generate with 3 and see error detailed.
        // actually the SDK doesn't have a simple "list models" exposed easily in the main class in some versions, but let's try the model directly.

        // Better: use the REST API to list models
        console.log("Listing models via REST API...");
        // We'll use a fetch here since we are in a node environment
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("Available models:");
        if (data.models) {
            data.models.forEach((m: any) => {
                console.log(`- ${m.name}`);
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
