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

// INITIALIZE SEQUALIZE
const sequelize = new Sequelize('main', 'user', 'supersecurepassword', {
  dialect: 'sqlite',
  storage: DB_PATH,
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
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
