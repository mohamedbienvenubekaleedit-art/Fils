export default async (req) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Méthode non autorisée."
      }),
      {
        status: 405,
        headers
      }
    );
  }

  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "La variable API_FOOTBALL_KEY n'est pas configurée dans Netlify."
      }),
      {
        status: 500,
        headers
      }
    );
  }

  try {
    const body = await req.json();

    const home = String(body.home || "").trim();
    const away = String(body.away || "").trim();
    const date = String(body.date || "").trim();

    if (!home || !away || !date) {
      return new Response(
        JSON.stringify({
          error: "Les deux équipes et la date sont obligatoires."
        }),
        {
          status: 400,
          headers
        }
      );
    }

    const apiHeaders = {
      "x-apisports-key": apiKey,
      "Accept": "application/json"
    };

    /*
     * Recherche des matchs à la date indiquée
     */
    const fixturesURL =
      "https://v3.football.api-sports.io/fixtures?date=" +
      encodeURIComponent(date);

    const fixturesResponse = await fetch(
      fixturesURL,
      {
        method: "GET",
        headers: apiHeaders
      }
    );

    const fixturesData =
      await fixturesResponse.json();

    if (!fixturesResponse.ok) {
      throw new Error(
        "Erreur API-Football : " +
        fixturesResponse.status
      );
    }

    if (
      fixturesData.errors &&
      Object.keys(fixturesData.errors).length > 0
    ) {
      throw new Error(
        Object.values(fixturesData.errors).join(", ")
      );
    }

    /*
     * Normalisation des noms
     */
    function normalize(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    }

    const wantedHome = normalize(home);
    const wantedAway = normalize(away);

    /*
     * Recherche du match correspondant
     */
    const matches =
      fixturesData.response || [];

    const fixture = matches.find((match) => {

      const matchHome =
        normalize(match.teams?.home?.name);

      const matchAway =
        normalize(match.teams?.away?.name);

      const homeOK =
        matchHome === wantedHome ||
        matchHome.includes(wantedHome) ||
        wantedHome.includes(matchHome);

      const awayOK =
        matchAway === wantedAway ||
        matchAway.includes(wantedAway) ||
        wantedAway.includes(matchAway);

      return homeOK && awayOK;
    });

    if (!fixture) {
      return new Response(
        JSON.stringify({
          error:
            `Aucun match trouvé pour ${home} vs ${away} le ${date}.`
        }),
        {
          status: 404,
          headers
        }
      );
    }

    const fixtureId =
      fixture.fixture?.id;

    if (!fixtureId) {
      throw new Error(
        "ID du match introuvable."
      );
    }

    /*
     * Informations des équipes
     */
    const homeTeam =
      fixture.teams?.home;

    const awayTeam =
      fixture.teams?.away;

    /*
     * Logos
     */
    const homeLogo =
      homeTeam?.logo || "";

    const awayLogo =
      awayTeam?.logo || "";

    /*
     * Recherche de la prédiction
     */
    const predictionURL =
      "https://v3.football.api-sports.io/predictions?fixture=" +
      encodeURIComponent(fixtureId);

    const predictionResponse =
      await fetch(
        predictionURL,
        {
          method: "GET",
          headers: apiHeaders
        }
      );

    const predictionData =
      await predictionResponse.json();

    if (!predictionResponse.ok) {
      throw new Error(
        "Erreur lors de la récupération de la prédiction."
      );
    }

    if (
      predictionData.errors &&
      Object.keys(predictionData.errors).length > 0
    ) {
      throw new Error(
        Object.values(predictionData.errors).join(", ")
      );
    }

    const prediction =
      predictionData.response?.[0];

    if (!prediction) {
      return new Response(
        JSON.stringify({
          error:
            "Aucune prédiction disponible pour ce match."
        }),
        {
          status: 404,
          headers
        }
      );
    }

    const info =
      prediction.predictions || {};

    /*
     * Score prédit
     */
    const scoreHome =
      info.goals?.home ?? null;

    const scoreAway =
      info.goals?.away ?? null;

    /*
     * Probabilités
     */
    const probabilities = {
      home: info.percent?.home ?? null,
      draw: info.percent?.draw ?? null,
      away: info.percent?.away ?? null
    };

    /*
     * Vainqueur
     */
    let winner =
      info.winner?.name || "";

    if (
      String(winner).toLowerCase() === "draw"
    ) {
      winner = "Match nul";
    }

    /*
     * Conseil API
     */
    const advice =
      info.advice || "";

    /*
     * Forme récente
     */
    const formHome =
      prediction.teams?.home?.league?.form || "";

    const formAway =
      prediction.teams?.away?.league?.form || "";

    /*
     * Envoi des données au HTML
     */
    return new Response(
      JSON.stringify({

        home:
          homeTeam?.name || home,

        away:
          awayTeam?.name || away,

        homeLogo:
          homeLogo,

        awayLogo:
          awayLogo,

        scoreHome:
          scoreHome,

        scoreAway:
          scoreAway,

        winner:
          winner,

        probabilities:
          probabilities,

        formHome:
          formHome,

        formAway:
          formAway,

        advice:
          advice,

        confidence:
          probabilities.home !== null
            ? probabilities.home + "%"
            : ""

      }),
      {
        status: 200,
        headers
      }
    );

  } catch (error) {

    return new Response(
      JSON.stringify({
        error:
          error?.message ||
          "Une erreur est survenue."
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
