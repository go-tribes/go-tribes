import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { destination, profileIntro } = req.body;

  try {
    const prompt = `Suggest 3 interesting travel activities in ${destination} for someone who wrote: "${profileIntro}". Keep it short and simple.`;

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const suggestions = response.data.choices[0].message?.content || "";
    res.status(200).json({ suggestions });

  } catch (error: any) {
    console.error("OpenAI Error:", error.message);
    res.status(500).json({ error: "AI failed" });
  }
}
