require('dotenv').config();
const fs = require('fs');
const path = require('path');

const DB_URI = process.env.DB_URL;

const settings = {
  url: DB_URI,
  dialectOptions: {
    ssl: {
      require: false,
      rejectUnauthorized: false
    }
  }
};

module.exports = {
  development: { ...settings },
  test: { ...settings },
  production: { ...settings },
};
