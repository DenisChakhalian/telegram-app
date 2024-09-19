
require('dotenv').config();

const DB_URI = process.env.DB_URL;

const settings = {
  url: DB_URI,
  dialectOptions: {
    ssl: false // Отключаем SSL
  }
};

module.exports = {
  development: { ...settings },
  test: { ...settings },
  production: { ...settings },
};
