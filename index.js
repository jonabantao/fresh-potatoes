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
  timestamps: false,
});

sequelize
  .authenticate()
  .then(() => Film.findAll())
  .then(users => console.log(JSON.stringify(users[0].dataValues)))
  .then(() => Genre.findById(1))
  .then(genre => console.log(JSON.stringify(genre)))
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  console.log(req.params.id);
  res.status(200).send({
    recommendations: [],
    meta: {},
  }).json();
}
// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);


module.exports = app;
