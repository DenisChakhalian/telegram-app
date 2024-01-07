const botController = require("../controllers/bot.controller");
const botMiddleware = require("../middlewares/bot.middleware");

async function addBotEndpoints() {
  bot.use(botMiddleware.userValidator);

  bot.start(botController.start);

  bot.command("setChannel", botController.setChannel);

  bot.command("setSign", botController.setSign);

  bot.command("delete", botController.deleteAll);

  bot.hears("Змінити тип постингу", botController.togglePostingType);

  bot.hears("Корзина", botController.getBin);

  bot.hears("Усього постів", botController.getCount);

  bot.hears("Усього фотографій", botController.getPicturesCount);

  bot.hears("Дата останнього посту", botController.getLastDate);

  bot.hears("Ув./вим. рандом", botController.toggleRandom);

  bot.hears("Ув./вим. постинг", botController.togglePosting);

  bot.on("photo", botController.createPhoto);

  bot.on("document", botController.createDocument);

  bot.on("text", (ctx) => {
    console.log(ctx.message);
  });
}

module.exports = {
  addBotEndpoints,
};
