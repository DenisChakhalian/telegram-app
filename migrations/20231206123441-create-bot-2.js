'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bot2s', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      chatId: {
        type: Sequelize.STRING
      },
      file_id: {
        type: Sequelize.STRING
      },
      sendTime: {
        type: Sequelize.DATE
      },
      file_unique_id: {
        type: Sequelize.STRING
      },
      media_group_id: {
        type: Sequelize.STRING
      },
      isGroup: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bot2s');
  }
};