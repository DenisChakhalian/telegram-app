const { DataTypes } = require("sequelize");
const { sequelize } = require("../src/utils/db");

const Bot4 = sequelize.define(
  "Bot4",
  {
    chatId: DataTypes.STRING,
    file_id: DataTypes.STRING,
    file_unique_id: DataTypes.STRING,
    media_group_id: DataTypes.STRING,
    isGroup: DataTypes.BOOLEAN,
    description: DataTypes.STRING,
    will_delete_date: DataTypes.DATE,
    imageUrl: DataTypes.STRING,
    sendedAt: DataTypes.DATE,
  },
  {
    tableName: "bot4s",
  }
);

module.exports = {
  Bot4,
};
