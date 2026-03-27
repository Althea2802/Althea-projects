export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const prompt = body.prompt || '';
    const maxTokens = body.max_tokens || 1800;

    const geminiBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.9 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${context.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    const data = await response.json();

    if (data.error) {
      return Response.json({ error: data.error.message }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason || 'unknown';
      const blocked = data?.promptFeedback?.blockReason || '';
      return Response.json(
        { error: `empty response. finishReason: ${reason}. blocked: ${blocked}` },
        { headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return Response.json({ text }, { headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
