const sqlite = require('sqlite');
const Sequelize = require('sequelize');
const request = require('request');
const express = require('express');

const app = express();

const { PORT = 3000, NODE_ENV = 'development', DB_PATH = './db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// INITIALIZE SEQUELIZE
const sequelize = new Sequelize('main', 'user', 'supersecurepassword', {
  dialect: 'sqlite',
  storage: DB_PATH,
});

// SEQUELIZE MODELS
/* Film */
const Film = sequelize.define('film', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  title: Sequelize.STRING,
  release_date: Sequelize.DATEONLY,
  tagline: Sequelize.TEXT,
  revenue: Sequelize.INTEGER,
  budget: Sequelize.INTEGER,
  runtime: Sequelize.INTEGER,
  original_language: Sequelize.STRING,
  status: Sequelize.STRING,
  genre_id: {
    type: Sequelize.INTEGER,
  },
}, {
  underscored: true,
  timestamps: false,
});

/* Genre */
const Genre = sequelize.define('genre', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  name: Sequelize.STRING,
}, {
  underscored: true,
  timestamps: false,
});

/* Associations */
Film.belongsTo(Genre);
Genre.hasMany(Film);

// HELPER FUNCTIONS
function routeNotFound(_, res) {
  return res.status(404).json({ message: 'Not found' });
}

function isNotNumeric(...params) {
  return params
    .filter(param => param !== undefined)
    .some(remainder => Number.isNaN(Number(remainder)));
}

function fetchFilm(filmId) {
  return Film.findById(filmId, {
    attributes: [
      'id',
      ['release_date', 'releaseDate'],
      ['genre_id', 'genreId'],
    ],
  });
}

function filterByGenreAndYearRange(searchedFilm) {
  const { id, releaseDate, genreId } = searchedFilm;
  const searchedFilmYr = new Date(releaseDate).getFullYear();
  const lowerYr = new Date(releaseDate).getFullYear() - 15;
  const upperYr = new Date(release)
}

// ROUTE HANDLER
function getFilmRecommendations({ params, query }, res) {
  if (isNotNumeric(params.id, query.offset, query.limit)) {
    return res.status(422).json({ message: 'Invalid ID' });
  }

  const searchedFilmId = params.id;
  // Handles if user wants unconstrained limit
  const limit = query.limit === undefined ? 10 : query.limit;
  // Offset defaults to 0, therefore || operator will default to 0 if undef or 0
  const offset = query.offset || 0;

  fetchFilm(searchedFilmId)
    .then(foundFilm => filterByGenreAndYearRange(foundFilm));

  return res.status(416).json({ hey: 'wat' });
}

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);
app.get('*', routeNotFound);


module.exports = app;
