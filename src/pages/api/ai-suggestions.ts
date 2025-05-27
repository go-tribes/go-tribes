import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { destination, profileIntro } = req.body;

  try {
    const prompt = `Suggest 3 interesting travel activities in ${destination} for someone who wrote: "${profileIntro}". Keep it short and simple.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    // Note: With SDK v4, response structure is a bit different:
    const suggestions = response.choices[0]?.message?.content || "";
    res.status(200).json({ suggestions });

  } catch (error: any) {
    // OpenAI errors might be in error.message or error.error.message
    console.error("OpenAI Error:", error?.message || error?.error?.message);
    res.status(500).json({ error: "AI failed" });
  }
}
