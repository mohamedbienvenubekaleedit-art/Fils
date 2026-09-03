export default async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, message: "Méthode non autorisée" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { key } = await req.json();

    if (!key) {
      return new Response(
        JSON.stringify({ success: false, message: "Digite uma key" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Clés de démonstration
    const keys = {
      "SIELZADA-TEST-2026": "2026-12-31T23:59:59Z"
    };

    const expiresAt = keys[key.trim()];

    if (!expiresAt) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid license key" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (new Date(expiresAt) <= new Date()) {
      return new Response(
        JSON.stringify({ success: false, message: "Expired" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        token: key.trim(),
        expiresAt
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch {
    return new Response(
      JSON.stringify({ success: false, message: "Requête invalide" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
};
