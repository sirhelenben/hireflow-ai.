interface EvaluationResult {
  score: number;
  explanation: string;
  strengths: string[];
  weaknesses: string[];
  missingQualifications: string[];
}

export async function evaluateCandidate(jobTitle: string, jobDescription: string, resumeText: string) {
  const startTime = Date.now();

  const prompt = `You are helping a recruiter screen a job applicant. Evaluate how well this candidate's resume matches the job below.

Job title: ${jobTitle}
Job description: ${jobDescription}

Candidate's resume:
${resumeText}

Respond with ONLY a JSON object in this exact shape, no other text:
{
  "score": <number 0-100>,
  "explanation": "<2-3 sentence overall assessment>",
  "strengths": ["<point>", "<point>"],
  "weaknesses": ["<point>", "<point>"],
  "missingQualifications": ["<point>", "<point>"]
}`;

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GOOGLE_AI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );

  const data = await response.json();
  console.log('GEMINI RAW RESPONSE:', JSON.stringify(data, null, 2));

  const processingTimeMs = Date.now() - startTime;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('AI did not return a result');

  const parsed: EvaluationResult = JSON.parse(rawText);

  return {
    result: parsed,
    promptTokens: data.usageMetadata?.promptTokenCount || 0,
    completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
    totalTokens: data.usageMetadata?.totalTokenCount || 0,
    processingTimeMs,
  };
}