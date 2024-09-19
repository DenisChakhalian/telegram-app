const { Sequelize } = require("sequelize");
require("dotenv").config();
const fs = require('fs');
const path = require('path');

const URI = process.env.DB_URL || "";

const sequelize = new Sequelize(URI, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      ca: fs.readFileSync(path.resolve('/home/rdndzdht/ssl/certs/rdndzdht_a2hosted_com_b3779_1e9e7_1758300200_643e4daf1bf111c2b740b0486caf423d.crt')).toString(),
      key: fs.readFileSync(path.resolve('/home/rdndzdht/ssl/keys/a7cd8_893c5_5d8e75dc9b3f825b3a5d1cd24c919483.key')).toString(),
      cert: fs.readFileSync(path.resolve('/home/rdndzdht/ssl/certs/autodiscover_rdndzdht_a2hosted_com_a7cd8_893c5_1734538445_f2c483e3d4e19021a32edff80ba9f3c1.crt')).toString(),
      rejectUnauthorized: true
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
