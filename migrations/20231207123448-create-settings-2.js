"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("settings2s", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user: {
        type: Sequelize.INTEGER,
      },
      isGroup: {
        type: Sequelize.BOOLEAN,
      },
      isRandom: {
        type: Sequelize.BOOLEAN,
      },
      isPosting: {
        type: Sequelize.BOOLEAN,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("settings2s");
  },
};
