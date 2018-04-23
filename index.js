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
const EXTERNAL_FILM_API = 'http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=';

function routeNotFound(_, res) {
  return res.status(404).json({ message: 'Not found' });
}

function isNotNumeric(...params) {
  return params
    .filter(param => param !== undefined)
    .some(remainder => Number.isNaN(Number(remainder)));
}

function setYearRange(dateYear) {
  const lowerYr = new Date(dateYear);
  const upperYr = new Date(dateYear);

  lowerYr.setFullYear(lowerYr.getFullYear() - 15);
  upperYr.setFullYear(upperYr.getFullYear() + 15);

  return [lowerYr, upperYr];
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

function formatModelInstance(films) {
  return films.map((film) => {
    film.setDataValue('genre', film.genre.name);
    return film.toJSON();
  });
}

function fetchIdByYearRangeAndGenre(searchedFilm) {
  const { id, releaseDate, genreId } = searchedFilm.get();

  return Film.findAll({
    attributes: [
      'id',
    ],
    where: {
      genre_id: genreId,
      release_date: {
        between: setYearRange(releaseDate),
      },
      id: {
        ne: id,
      },
    },
    include: {
      model: Genre,
      required: true,
    },
    order: [
      ['id'],
    ],
  }).then(films => films.map(film => film.toJSON().id));
}

function queryExternalAPI(filmIdArray) {
  return new Promise((resolve, reject) => {
    request(`${EXTERNAL_FILM_API}${filmIdArray.toString()}`, (err, res, body) => {
      if (err) {
        reject(err);
      }

      resolve(JSON.parse(body));
    });
  });
}

function calculateReviewAverage(reviews) {
  if (!reviews.length) {
    return 0;
  }

  const totalScore = reviews.reduce((sum, review) => sum + review.rating, 0);
  return parseFloat((totalScore / reviews.length).toFixed(1), 10);
}

function isHighlyRated(film) {
  return film.reviews >= 5 && film.averageRating > 4.0;
}

function appendRatings(film) {
  return Object.assign(film, {
    reviews: film.reviews.length,
    averageRating: calculateReviewAverage(film.reviews),
  });
}

function filterByReviews(films) {
  return films
    .map(appendRatings)
    .filter(isHighlyRated);
}

function formatRecommendedPayload(recommendedFilms, limit, offset) {
  return {
    recommendations: recommendedFilms.slice(offset, limit),
    meta: {
      limit,
      offset,
    },
  };
}

// ROUTE HANDLER
function getFilmRecommendations({ params, query }, res) {
  if (isNotNumeric(params.id, query.offset, query.limit)) {
    return res.status(422).json({ message: 'Invalid ID' });
  }

  const filmId = params.id;
  // Handles if user wants unconstrained limit
  const limit = query.limit === undefined ? 10 : parseInt(query.limit, 10);
  // Offset defaults to 0, therefore || operator will default to 0 if undef or 0
  const offset = parseInt(query.offset, 10) || 0;

  return fetchFilm(filmId)
    .then(fetchIdByYearRangeAndGenre)
    .then(queryExternalAPI)
    .then(filterByReviews)
    .then(console.log);
    .then(formatModelInstance)
    .then(filterByReviews)
    .then(films => formatRecommendedPayload(films, limit, offset))
    .then(payload => res.status(200).json(payload))
    .catch(() => res.status(500).json({ message: 'Error occured' }));
}

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);
app.get('*', routeNotFound);


module.exports = app;
