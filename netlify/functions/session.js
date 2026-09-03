export default async (req) => {
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ success: false, message: "Méthode non autorisée" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return new Response(
      JSON.stringify({ success: false, message: "Session invalide" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const expiresAt = "2026-12-31T23:59:59Z";

  if (new Date(expiresAt) <= new Date()) {
    return new Response(
      JSON.stringify({ success: false, message: "Expired" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      expiresAt
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
