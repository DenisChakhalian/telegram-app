const { DataTypes } = require("sequelize");
const { sequelize } = require("../src/utils/db");

const Settings4 = sequelize.define(
  "Settings4",
  {
    user: DataTypes.INTEGER,
    isGroup: DataTypes.BOOLEAN,
    isRandom: DataTypes.BOOLEAN,
    isPosting: DataTypes.BOOLEAN,
  },
  {
    tableName: "settings4s",
    timestamps: false,
  }
);

module.exports = {
  Settings4,
};
