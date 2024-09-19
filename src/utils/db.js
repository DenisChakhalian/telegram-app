const { Sequelize } = require("sequelize");
require("dotenv").config();

const URI = process.env.DB_URL || "";

const sequelize = new Sequelize(URI, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,  // Используйте true, если сервер требует подтверждения сертификата
    },
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
