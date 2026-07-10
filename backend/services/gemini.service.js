const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const generateGeminiText = async ({
  prompt,
  systemInstruction,
  temperature = 0.6,
  maxOutputTokens = 500,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
};

export const generateGeminiJson = async (options) => {
  const text = await generateGeminiText(options);
  if (!text) return null;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
};

export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);
