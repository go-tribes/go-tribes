import type { NextApiRequest, NextApiResponse } from 'next';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID!;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET!;

// Get OAuth2 token from Amadeus
async function getAccessToken() {
  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
  });
  const data = await res.json();
  return data.access_token;
}

// Resolve a city or airport name to IATA code
async function resolveToIATA(term: string, accessToken: string) {
  if (term.length === 3 && /^[A-Z]+$/.test(term)) return term.toUpperCase();
  // Query Amadeus Locations API
  const res = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT,CITY&keyword=${encodeURIComponent(term)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json();
  console.log(`Lookup term "${term}":`, JSON.stringify(data));
  return data.data?.[0]?.iataCode || null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { from, to, date } = req.query;
  if (!from || !to || !date) return res.status(400).json({ error: "Missing params" });

  try {
    const accessToken = await getAccessToken();
    const fromIATA = await resolveToIATA(from.toString(), accessToken);
    const toIATA = await resolveToIATA(to.toString(), accessToken);
    console.log(`From "${from}" resolved to:`, fromIATA);
    console.log(`To "${to}" resolved to:`, toIATA);
    if (!fromIATA || !toIATA) return res.status(400).json({ error: "City/IATA code not found" });

    const apiRes = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${fromIATA}&destinationLocationCode=${toIATA}&departureDate=${date}&adults=1&currencyCode=USD&max=1`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await apiRes.json();
    console.log(`Flight offers for ${fromIATA}->${toIATA}:`, JSON.stringify(data));
    const offer = data.data?.[0];
    if (!offer) return res.status(200).json({ price: null, currency: "USD" });

    const price = offer.price.total;
    return res.status(200).json({ price, currency: "USD" });
  } catch (e) {
    console.error("API error", e);
    return res.status(500).json({ error: "API error" });
  }
}
