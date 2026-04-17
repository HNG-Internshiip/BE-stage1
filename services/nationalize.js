import fetch from "node-fetch";

export async function fetchNationality(name) {
  const res = await fetch(`https://api.nationalize.io/?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw upstreamError("Nationalize");

  const data = await res.json();

  if (!data.country || data.country.length === 0) throw upstreamError("Nationalize");

  // Pick highest probability country
  const top = data.country.reduce((a, b) => (a.probability >= b.probability ? a : b));

  return {
    country_id:          top.country_id,
    country_probability: top.probability,
  };
}

function upstreamError(api) {
  const err = new Error(`${api} returned an invalid response`);
  err.status = 502;
  return err;
}