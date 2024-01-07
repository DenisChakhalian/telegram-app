const { DataTypes } = require("sequelize");
const { sequelize } = require("../src/utils/db");

const Settings3 = sequelize.define(
  "Settings3",
  {
    user: DataTypes.INTEGER,
    isGroup: DataTypes.BOOLEAN,
    isRandom: DataTypes.BOOLEAN,
    isPosting: DataTypes.BOOLEAN,
  },
  {
    tableName: "settings3s",
    timestamps: false,
  }
);

module.exports = {
  Settings3,
};
