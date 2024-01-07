const { DataTypes } = require("sequelize");
const { sequelize } = require("../src/utils/db");

const Settings1 = sequelize.define(
  "Settings1",
  {
    user: DataTypes.INTEGER,
    isGroup: DataTypes.BOOLEAN,
    isRandom: DataTypes.BOOLEAN,
    isPosting: DataTypes.BOOLEAN,
  },
  {
    tableName: "settings1s",
    timestamps: false,
  }
);

module.exports = {
  Settings1,
};
