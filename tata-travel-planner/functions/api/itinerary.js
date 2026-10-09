const MODEL = "gemini-3.5-flash";

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.GEMINI_API_KEY) {
    return Response.json({ error: "Ta-Ta is not configured yet. Add GEMINI_API_KEY in Cloudflare Pages → Settings → Variables and Secrets, then redeploy." }, { status: 503 });
  }
  let input;
  try { input = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }
  const trip = input?.trip;
  if (!trip?.destination || !trip?.start || !trip?.end) {
    return Response.json({ error: "Trip destination and dates are required." }, { status: 400 });
  }
  const start = new Date(`${trip.start}T12:00:00Z`);
  const end = new Date(`${trip.end}T12:00:00Z`);
  const days = Math.max(1, Math.min(31, Math.round((end - start) / 86400000) + 1));
  const feedback = typeof input.feedback === "string" ? input.feedback.slice(0, 5000) : "";
  const current = input.base ? JSON.stringify(input.base).slice(0, 50000) : "";
  const revision = feedback ? `\nCURRENT ITINERARY TO REVISE:\n${current}\n\nUSER FEEDBACK:\n${feedback}\nApply the feedback and return a complete replacement itinerary. Preserve details that the feedback does not ask to change.` : "";
  const prompt = `You are Ta-Ta, a practical personal travel planner. Create a realistic ${days}-day itinerary.\nDestination: ${String(trip.destination).slice(0,250)}\nDates: ${trip.start} to ${trip.end}\nTravellers: ${String(trip.travelers ?? 1).slice(0,20)}\nStyle: ${String(trip.style ?? "Balanced").slice(0,100)}\nBudget: ${String(trip.budget ?? "Comfortable").slice(0,100)}\nNotes: ${String(trip.notes ?? "none").slice(0,3000)}\n${revision}\nRules: group nearby places to reduce backtracking; keep pace realistic; include useful food and transport suggestions and some free time; do not invent exact opening hours, prices, availability, ratings, phone numbers or addresses; include a Google Places search query for each real-world place so the app can verify it. Return JSON only with this shape: {"tripTitle":"","summary":"","days":[{"date":"YYYY-MM-DD","title":"","items":[{"time":"09:00","name":"","category":"attraction|food|hotel|transport|free-time","description":"","placeQuery":"","transport":"walk|metro|bus|taxi|car|train|flight|mixed"}]}]}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  let upstream;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
      })
    });
  } catch {
    return Response.json({ error: "Could not reach the Gemini API. Please try again." }, { status: 502 });
  }
  const raw = await upstream.text();
  if (!upstream.ok) {
    return Response.json({ error: `Gemini API returned ${upstream.status}. Check the server-side Gemini key and model access.` }, { status: 502 });
  }
  try {
    const data = JSON.parse(raw);
    const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("") || "";
    const itinerary = JSON.parse(text);
    if (!Array.isArray(itinerary.days) || itinerary.days.length === 0) throw new Error("Missing itinerary days");
    return Response.json({ itinerary }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Gemini returned an unexpected response. Please rebuild the itinerary." }, { status: 502 });
  }
}
