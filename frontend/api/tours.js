const tours = require('../database');

module.exports = (req, res) => {
  res.status(200).json(tours);
};
