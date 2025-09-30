require('dotenv').config();
const mongoose = require('mongoose');
const { Movie } = require('../models.js');

function textForEmbedding(m) {
  return [
    m.title,
    m.description,
    m?.genre?.name && `Genre: ${m.genre.name}`,
    m?.director?.name && `Director: ${m.director.name}`,
  ].filter(Boolean).join('\n');
}

(async () => {
  try {
    // dynamic import of ESM module
    const { embedText } = await import('../utils/embed.mjs');

    await mongoose.connect(process.env.CONNECTION_URI);
    console.log('Connected to MongoDB');

    const movies = await Movie.find({});
    for (const m of movies) {
      const input = textForEmbedding(m);
      m.embedding = await embedText(input);
      await m.save();
      console.log('✅ Embedded:', m.title);
    }

    console.log('All movies embedded!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
