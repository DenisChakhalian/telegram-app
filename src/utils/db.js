const { Sequelize } = require("sequelize");
require("dotenv").config();

const URI = process.env.DB_URL || "";

const sequelize = new Sequelize(URI, {
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

async function connect() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

module.exports = {
  sequelize,
  connect,
};
