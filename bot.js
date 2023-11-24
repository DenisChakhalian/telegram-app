const { Telegraf } = require('telegraf');
const schedule = require('node-schedule');

const botToken = process.env.TOKEN;
const bot = new Telegraf(botToken);

let selectedChannelId = null;
let scheduledPhotos = [];

bot.start((ctx) => {
  const chatId = ctx.message.chat.id;
  ctx.reply('Бот запущено. Виберіть канал за допомогою /setchannel');
  console.log(`start`);
});

bot.command('setchannel', (ctx) => {
  selectedChannelId = ctx.message.forward_from_chat.id;
  ctx.reply(`Канал встановлено: ${selectedChannelId}`);
  console.log(`setchannel`, selectedChannelId);
});

bot.on('text', (ctx) => {
  // Обробка текстових повідомлень, які пересилаються в бота
  const chatId = ctx.message.chat.id;
  const messageId = ctx.message.message_id;

  // Видалення тексту та автора повідомлення
  ctx.deleteMessage(chatId, messageId);
});

bot.on('photo', (ctx) => {
  const chatId = ctx.message.chat.id;
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const file_id = photo.file_id;

  console.log(`photo`);

  // Розбиття картинок поштучно
  scheduledPhotos.push({ chatId, file_id });

  ctx.reply('Фото додано до розкладу відправлення');
});

bot.launch();
console.log('Бот запущено...');

// Регулярний інтервал для перевірки та відправлення відкладених фотографій
schedule.scheduleJob('*/1 * * * *', () => {
  const currentTime = new Date().getTime();
  const filteredPhotos = scheduledPhotos.filter((photo) => photo.sendTime <= currentTime);

  for (const photo of filteredPhotos) {
    sendScheduledPhoto(photo.chatId, photo.file_id);
    scheduledPhotos = scheduledPhotos.filter((p) => p !== photo);
  }

  // Виведення кількості постів у відкладеному розкладі у консоль
  console.log(`Кількість постів у відкладеному розкладі: ${scheduledPhotos.length}`);
});

function sendScheduledPhoto(chatId, file_id) {
  // Запланований час відправлення
  const sendTime = getNextSendTime();

  // Виведення в консоль планування
  console.log(`Заплановано відправлення фото на ${new Date(sendTime)} до ${chatId}`);

  scheduledPhotos.push({ chatId, file_id, sendTime });
}

function getNextSendTime() {
  const currentTime = new Date();
  const startOfDay = new Date(currentTime);
  startOfDay.setHours(0, 0, 0, 0);

  // Визначення кількості фото, які мають бути відправлені до обіду та після
  const photosBeforeNoon = 12;
  const photosAfterNoon = 24;

  // Визначення кількості фото, які вже були відправлені сьогодні
  const sentBeforeNoon = scheduledPhotos.filter(
    (photo) => photo.sendTime < startOfDay + 12 * 60 * 60 * 1000
  ).length;

  const sentAfterNoon = scheduledPhotos.filter(
    (photo) => photo.sendTime >= startOfDay + 12 * 60 * 60 * 1000
  ).length;

  // Визначення наступного інтервалу відправлення відповідно до графіка
  let nextInterval;
  if (sentBeforeNoon < photosBeforeNoon) {
    // Якщо ще не всі фото до обіду відправлені, використовуємо інтервал у 1 годину
    nextInterval = 5 * 60 * 1000;
  } else if (sentAfterNoon < photosAfterNoon) {
    // Якщо ще не всі фото після обіду відправлені, використовуємо інтервал у 30 хвилин
    nextInterval = 15 * 60 * 1000
  } else {
    // Графік завершено, перейти до наступного дня
    nextInterval = startOfDay + 24 * 60 * 60 * 1000 - currentTime + 60 * 60 * 1000;
  }

  // Повертаємо час в майбутньому для відправлення наступного фото
  return currentTime.getTime() + nextInterval;
}
