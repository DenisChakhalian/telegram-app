"use strict";
require("dotenv").config();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("settings4s", [
      {
        user: +process.env.ID,
        isGroup: false,
        isRandom: false,
        isPosting: true,
      },
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("settings4s", null, {});
  },
};
