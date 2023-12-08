const { DataTypes } = require("sequelize");
const { sequelize } = require("../utils/db");

const Bot2 = sequelize.define(
  "Bot2",
  {
    chatId: DataTypes.STRING,
    file_id: DataTypes.STRING,
    sendTime: DataTypes.DATE,
    file_unique_id: DataTypes.STRING,
    media_group_id: DataTypes.STRING,
    isGroup: DataTypes.BOOLEAN,
  },
  {
    tableName: "bot2s",
  }
);

module.exports = {
  Bot2,
};
