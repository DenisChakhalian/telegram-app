require('dotenv').config();

const DB_URI = process.env.DB_URL;

const settings = {
  url: DB_URI,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true
    }
  }
};

module.exports = {
  development: { ...settings },
  test: { ...settings },
  production: { ...settings },
};
