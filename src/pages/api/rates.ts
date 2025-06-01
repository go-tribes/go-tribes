// pages/api/rates.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = "https://open.er-api.com/v6/latest/USD";
  console.log("Fetching from:", url);

  try {
    const resp = await fetch(url);
    console.log("Status:", resp.status);
    const data = await resp.json();

    if (!resp.ok || data.result !== "success") {
      res.status(500).json({ error: "Failed to fetch rates", ...data });
      return;
    }
    // Only return rates for frontend
    res.status(200).json({
      rates: data.rates,
      base: data.base_code,
      time_last_update_utc: data.time_last_update_utc
    });
  } catch (e) {
    console.error("Error fetching rates:", e);
    res.status(500).json({ error: "Failed to fetch rates" });
  }
}
