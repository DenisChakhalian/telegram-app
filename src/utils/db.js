const { Sequelize } = require("sequelize");
require("dotenv").config();

const URI = process.env.DB_URL || "";

const sequelize = new Sequelize(URI, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: false // Отключаем SSL
  },
});

async function connect() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
  }
}

module.exports = {
  sequelize,
  connect,
};
