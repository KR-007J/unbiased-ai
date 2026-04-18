
const GEMINI_API_KEY = "YOUR_API_KEY_HERE"; // I'll use the env var in the script

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No API key provided in env");
        return;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(` - ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.log("No models found or error:", JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}

listModels();
