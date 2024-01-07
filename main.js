const { Telegraf } = require("telegraf");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const botService = require("./src/services/bot.service");
const botController = require("./src/controllers/bot.controller");
const { connect } = require("./src/utils/db");
const { addBotEndpoints } = require("./src/routes/bot.route");

const botToken = process.env.TOKEN;
global.bot = new Telegraf(botToken);

global.selectedChannelId = +process.env.CHANEL;
global.userId = +process.env.USER;
global.lastPhotoSentTime = null;
global.isGroup = false;
global.isRandom = false;
global.isPosting = true;
global.sign = process.env.CHANEL_SIGN;
global.count = 0;

async function startBot() {
  try {
    await connect();

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
    });

    global.count = await botService.getCountAll();

    await bot.telegram.deleteWebhook();

    await bot
			.launch({
				webhook: {
					domain: process.env.DOMAIN_LINK,
					port: process.env.PORT,
				},
    });
    // .launch();
  } catch (error) {
    console.error("Error starting bot:", error.message);
  }
}

addBotEndpoints();

startBot();

console.log("Бот запущено...");

setInterval(() => {
  botController.sendScheduledPhotos();
}, 20000);
// }, 5000);
// }, 1000);

module.exports = {
  startBot,
};
