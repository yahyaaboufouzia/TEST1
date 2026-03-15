/**
 * api/recommend.js — Fonction serverless Vercel
 *
 * Ce fichier tourne côté SERVEUR sur Vercel.
 * La clé API est stockée dans les variables d'environnement Vercel,
 * elle n'est JAMAIS visible dans le navigateur.
 *
 * Dataset de référence : Kaggle crops-npk data set (20 000 records)
 * Source : https://www.kaggle.com/datasets/javakhan/crops-npk-data-set
 */

const SYSTEM_PROMPT = `Tu es un agronome expert spécialisé en analyse de sol et recommandation agricole.
Tu as été entraîné sur le dataset Kaggle "crops-npk data set" contenant 20 000 enregistrements réels.

DATASET DE RÉFÉRENCE (valeurs optimales par culture, extraites du dataset) :
Culture           | N (mg/kg) | P (mg/kg) | K (mg/kg) | pH       | Sol         | Variété
------------------|-----------|-----------|-----------|----------|-------------|----------
Riz               | 60–110    | 30–60     | 25–55     | 5.5–7.0  | Argileux    | Basmati
Blé               | 80–140    | 40–80     | 30–65     | 6.0–7.5  | Limoneux    | Durum
Maïs              | 75–125    | 35–70     | 30–65     | 5.8–7.2  | Limoneux    | Hybride
Orge              | 50–100    | 25–55     | 20–50     | 6.0–8.0  | Sableux     | Standard
Sorgho            | 40–85     | 20–50     | 15–45     | 5.5–8.5  | Argileux    | Standard
Millet            | 30–70     | 15–45     | 15–40     | 5.5–8.0  | Sableux     | Perlé
Avoine            | 60–110    | 30–65     | 25–55     | 5.5–7.0  | Limoneux    | Standard
Tournesol         | 55–110    | 30–70     | 28–65     | 6.0–7.8  | Limoneux    | Oléagineux
Coton             | 80–145    | 40–85     | 40–85     | 5.8–7.2  | Argileux    | Long fibres
Arachide          | 10–40     | 25–65     | 20–55     | 5.5–7.0  | Sableux     | Runner
Canne à sucre     | 100–180   | 50–100    | 55–110    | 6.0–7.5  | Limoneux    | Standard
Betterave         | 80–140    | 40–85     | 50–110    | 6.5–7.5  | Limoneux    | Sucrière
Lentille          | 10–40     | 30–70     | 20–60     | 6.0–8.0  | Limoneux    | Verte
Pois chiche       | 10–40     | 25–65     | 15–55     | 5.5–8.5  | Sableux     | Desi
Haricot           | 10–50     | 30–70     | 20–60     | 6.0–7.5  | Limoneux    | Commun
Soja              | 10–45     | 35–80     | 30–75     | 6.0–7.0  | Limoneux    | Standard
Fève              | 10–40     | 25–65     | 20–60     | 6.0–8.0  | Argileux    | Standard
Tomate            | 80–145    | 40–95     | 55–120    | 5.5–7.0  | Limoneux    | Roma
Pomme de terre    | 80–145    | 40–90     | 65–130    | 5.0–6.5  | Sableux     | Rouge
Oignon            | 50–100    | 25–65     | 30–70     | 6.0–7.5  | Sableux     | Standard
Piment            | 60–120    | 30–75     | 40–90     | 6.0–7.0  | Limoneux    | Cayenne
Pastèque          | 60–110    | 30–70     | 40–90     | 6.0–7.0  | Sableux     | Sans pépins
Melon             | 50–100    | 25–65     | 35–85     | 6.0–7.5  | Sableux     | Charentais
Concombre         | 70–130    | 35–80     | 45–100    | 6.0–7.0  | Limoneux    | Standard
Carotte           | 40–90     | 25–65     | 50–110    | 6.0–7.0  | Sableux     | Nantaise
Banane            | 80–155    | 30–80     | 65–145    | 5.5–7.0  | Limoneux    | Cavendish
Mangue            | 40–90     | 20–60     | 25–75     | 5.5–7.5  | Sableux     | Alphonso
Orange            | 60–125    | 25–70     | 45–105    | 5.5–7.0  | Limoneux    | Navel
Raisin            | 40–90     | 20–60     | 30–80     | 5.5–7.5  | Argileux    | Vinifera
Olive             | 20–60     | 10–40     | 15–55     | 6.5–8.5  | Calcaire    | Picholine
Café              | 60–115    | 30–70     | 30–75     | 5.0–6.5  | Volcanique  | Arabica
Fraise            | 50–100    | 30–70     | 40–90     | 5.5–6.5  | Sableux     | Gariguette
Lavande           | 10–40     | 10–35     | 10–35     | 6.5–8.5  | Calcaire    | Fine

TYPES D'AGRICULTURE :
- Agriculture intensive    : N>70, P>35, K>30, pH 5.8–7.5 — rendements maximaux
- Agriculture raisonnée    : N>40, P>20, K>20, pH 5.5–8.0 — équilibre rendement/environnement
- Agriculture biologique   : N 10–120, P 15–120, K 10–100, pH 5.5–7.8 — sans intrants chimiques
- Maraîchage               : N>60, P>30, K>40, pH 5.5–7.5 — légumes et fruits
- Agriculture extensive    : N<100, P<80, K<80, pH 5.0–8.5 — grandes surfaces, peu d'intrants
- Arboriculture            : N 20–140, P 10–100, K 15–120, pH 5.0–8.5 — arbres fruitiers
- Culture sous serre       : N>60, P>30, K>45, pH 5.5–7.0 — contrôle total du climat
- Agriculture en zone sèche: N<90, P<70, K<60, pH 5.5–8.5 — variétés résistantes à la sécheresse
- Agriculture irriguée     : N>50, P>25, K>30, pH 5.5–7.8 — fort besoin en eau

RÈGLES :
- pH < 5.5 : chaulage obligatoire
- pH > 8.0 : apport de soufre recommandé
- N < 40   : azote insuffisant — amendement organique
- P < 20   : phosphore faible — superphosphate
- K < 20   : potassium faible — sulfate de potasse

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après :
{
  "profil": {
    "titre": "string",
    "description": "string",
    "niveau": "excellent|bon|moyen|pauvre"
  },
  "cultures": [
    {
      "nom": "string",
      "variete": "string",
      "sol": "string",
      "compatibilite": 0-100,
      "raison": "string (1 phrase)"
    }
  ],
  "types_agriculture": [
    {
      "nom": "string",
      "recommande": true|false,
      "raison": "string (1 phrase)"
    }
  ],
  "corrections": ["string"],
  "conseil_global": "string (2-3 phrases de conseil d'agronome)"
}`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { N, P, K, pH } = req.body;

  if ([N, P, K, pH].some(v => v === undefined || isNaN(v))) {
    return res.status(400).json({ error: 'Paramètres manquants ou invalides' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API non configurée dans Vercel' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Analyse de sol :
- Azote    (N)  : ${N} mg/kg
- Phosphore(P)  : ${P} mg/kg
- Potassium(K)  : ${K} mg/kg
- pH            : ${pH}

Donne-moi les 8 meilleures cultures, tous les types d'agriculture, les corrections nécessaires et un conseil global. JSON uniquement.`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Erreur API Claude: ' + err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Nettoyer et parser le JSON
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Erreur:', err);
    return res.status(500).json({ error: 'Erreur interne: ' + err.message });
  }
}
