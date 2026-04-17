import fetch from "node-fetch";

export async function fetchGender(name) {
  const res = await fetch(`https://api.genderize.io/?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw upstreamError("Genderize");

  const data = await res.json();

  if (!data.gender || !data.count) throw upstreamError("Genderize");

  return {
    gender:             data.gender,
    gender_probability: data.probability,
    sample_size:        data.count,
  };
}

function upstreamError(api) {
  const err = new Error(`${api} returned an invalid response`);
  err.status = 502;
  return err;
}