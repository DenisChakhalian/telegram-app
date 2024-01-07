const { DataTypes } = require("sequelize");
const { sequelize } = require("../src/utils/db");

const Settings2 = sequelize.define(
  "Settings2",
  {
    user: DataTypes.INTEGER,
    isGroup: DataTypes.BOOLEAN,
    isRandom: DataTypes.BOOLEAN,
    isPosting: DataTypes.BOOLEAN,
  },
  {
    tableName: "settings2s",
    timestamps: false,
  }
);

module.exports = {
  Settings2,
};
