const db = require('../models');
const NewsArticle = db.news_articles;
const Asset = db.assets;

const NEWS_TEMPLATES = [
  {
    title: 'Les marchés réagissent aux nouvelles données économiques',
    category: 'ECONOMIC',
    sentiment: 'NEUTRAL',
    impact_level: 'MEDIUM'
  },
  {
    title: 'Forte hausse attendue pour le secteur technologique',
    category: 'MARKET',
    sentiment: 'POSITIVE',
    impact_level: 'HIGH'
  },
  {
    title: 'Volatilité accrue sur les marchés des crypto-monnaies',
    category: 'MARKET',
    sentiment: 'NEGATIVE',
    impact_level: 'MEDIUM'
  },
  {
    title: 'Nouvelle réglementation en vue pour le secteur financier',
    category: 'POLITICAL',
    sentiment: 'NEUTRAL',
    impact_level: 'HIGH'
  },
  {
    title: "Les investisseurs optimistes malgré l'incertitude",
    category: 'MARKET',
    sentiment: 'POSITIVE',
    impact_level: 'LOW'
  }
];

const SOURCES = ['Financial Times', 'Bloomberg', 'Reuters', 'CNBC', 'Wall Street Journal', 'MarketWatch'];

const AUTHORS = ['Sarah Johnson', 'John Smith', 'Marie Dubois', 'Ahmed Hassan', 'Li Wei', 'Emma Thompson'];

// Générer une mise à jour de news
const generateNewsUpdate = () => {
  const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
  const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  const author = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];

  const variations = ['urgent', 'dernière minute', 'analyse', 'prévision', 'rapport'];

  const variation = variations[Math.floor(Math.random() * variations.length)];

  return {
    article_id: `temp-${Date.now()}`,
    title: `[${variation.toUpperCase()}] ${template.title}`,
    summary: generateSummary(template),
    content: generateContent(template),
    author: author,
    source: source,
    publish_date: new Date().toISOString(),
    category: template.category,
    sentiment: template.sentiment,
    impact_level: template.impact_level,
    related_assets: []
  };
};

const generateSummary = (template) => {
  const summaries = {
    ECONOMIC:
      "Les derniers indicateurs économiques montrent une tendance qui pourrait impacter les marchés financiers dans les prochains jours.",
    MARKET: "Les analystes observent des mouvements significatifs sur les marchés qui méritent l'attention des investisseurs.",
    POLITICAL: "De nouvelles décisions politiques pourraient avoir des répercussions importantes sur le secteur financier.",
    COMPANY: 'Des développements majeurs au sein de grandes entreprises attirent l\'attention du marché.'
  };

  return summaries[template.category] || 'Actualité importante du marché financier.';
};

const generateContent = (template) => {
  return `Dans un contexte de ${
    template.sentiment === 'POSITIVE'
      ? 'optimisme'
      : template.sentiment === 'NEGATIVE'
        ? 'prudence'
        : 'stabilité'
  } sur les marchés, 
les analystes surveillent de près l'évolution de la situation. Les experts estiment que l'impact pourrait être ${template.impact_level.toLowerCase()} 
sur les performances à court terme.

Les investisseurs sont invités à rester vigilants et à suivre l'évolution de cette situation qui pourrait influencer leurs décisions d'investissement. 
Les prochaines séances de trading seront cruciales pour confirmer ou infirmer les tendances actuelles.

Cette actualité s'inscrit dans un contexte plus large de ${template.category.toLowerCase()} qui continue d'évoluer rapidement. 
Les marchés devraient réagir dans les prochaines heures avec une volatilité ${
    template.impact_level === 'HIGH' ? 'importante' : 'modérée'
  }.`;
};

// Envoyer les données initiales
const sendInitialData = async (socket) => {
  try {
    const articles = await NewsArticle.findAll({
      order: [['publish_date', 'DESC']],
      limit: 20
    });

    socket.emit('initial-news-data', {
      articles
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi des données initiales:", error);
    socket.emit('error', { message: 'Erreur lors du chargement des news' });
  }
};

module.exports = {
  generateNewsUpdate,
  sendInitialData
};
