export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, systemInstruction, isJson, apiKey } = req.body;

    const finalApiKey = apiKey || process.env.MISTRAL_API_KEY;

    if (!finalApiKey) {
        return res.status(400).json({ 
            error: 'API Key tidak ditemukan. Silakan konfigurasikan MISTRAL_API_KEY di environment variables Vercel Anda.' 
        });
    }

    try {
        const payload = {
            model: "mistral-small-latest",
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            temperature: 0.1
        };

        if (isJson) {
            payload.response_format = { type: "json_object" };
        }

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalApiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Mistral API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Respons kosong dari Mistral API');
        }

        return res.status(200).json({ content });

    } catch (error) {
        console.error('Serverless function error:', error);
        return res.status(500).json({ error: error.message });
    }
}
