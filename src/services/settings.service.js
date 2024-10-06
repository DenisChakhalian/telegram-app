const { Settings1: Settings } = require("../../models/settings1");
require("dotenv").config();


async function getSettings() {
  return Settings.findOne({
    where: {
      user: +process.env.ID,
    },
  });
}

async function updateSettings(newSettings) {
  return Settings.update(newSettings, {
    where: {
      user: +process.env.ID,
    },
  });
}

module.exports = {
  updateSettings,
  getSettings,
};
