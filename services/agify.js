const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

async function fetchAge(name) {
  const res = await fetch(`https://api.agify.io/?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw upstreamError("Agify");

  const data = await res.json();
  if (data.age === null || data.age === undefined) throw upstreamError("Agify");

  return { age: data.age };
}

function upstreamError(api) {
  const err = new Error(`${api} returned an invalid response`);
  err.status = 502;
  return err;
}

module.exports = { fetchAge };