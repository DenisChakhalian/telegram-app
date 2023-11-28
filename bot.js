const { Telegraf } = require('telegraf');
const moment = require('moment-timezone');

const botToken = '6784050286:AAERYE8oUO-E8IOQR6TnOdkbliPpPI_bqyg';
const bot = new Telegraf(botToken);

let selectedChannelId = null;
let lastPhotoSentTime = null;
let photoQueue = [];

async function startBot() {
  try {
    await bot.telegram.deleteWebhook();
    await bot.launch({
      webhook: {
        domain: 'https://telegram-app-2b8p.onrender.com',
        port: 443,
      },
    });
  } catch (error) {
    console.error('Error starting bot:', error.message);
  }
}



bot.start((ctx) => {
  const chatId = ctx.message.chat.id;
  ctx.reply('Бот запущено. Виберіть канал за допомогою /setchannel');
});

bot.command('setchannel', (ctx) => {
  selectedChannelId = ctx.message.forward_from_chat.id;
  ctx.reply(`Канал встановлено: ${selectedChannelId}`);
});

bot.command('lastphoto', (ctx) => {
  ctx.reply(`Канал встановлено: ${photoQueue[0].sendTime}`);
});

bot.on('text', (ctx) => {
  if (ctx.message.forward_from) {
    ctx.deleteMessage(ctx.message.chat.id, ctx.message.message_id);
  }
});

bot.command('triggerBot', (ctx) => {
  console.log('reacted!')
  ctx.reply('Бот відреагував на команду "triggerBot"!');
});

bot.on('photo', (ctx) => {
  const chatId = ctx.message.chat.id;
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const file_id = photo.file_id;

  if (!selectedChannelId) {
    ctx.reply('Спочатку виберіть канал за допомогою /setchannel');
    return;
  }

  const currentTime = moment().tz('Europe/Kiev');
  
  const sendTime = calculateSendTime(currentTime, lastPhotoSentTime);

  lastPhotoSentTime = currentTime;

  photoQueue.push({ chatId, file_id, sendTime });
});

// bot.launch()

startBot(); // Запуск бота



console.log('Бот запущено...');

setInterval(() => {
  sendScheduledPhotos();
}, 20000);

setInterval(() => {
  bot.telegram.sendMessage('6784050286', '/triggerBot');
}, 600000); 

function calculateSendTime(currentTime, lastPhotoSentTime) {
  const isNightTime = currentTime.hour() >= 0 && currentTime.hour() < 12;

  if (lastPhotoSentTime) {
    const nextSendTime = lastPhotoSentTime.clone().add(isNightTime ? 1 : 0.5, 'hours');
    return nextSendTime;
  } else {
    return currentTime.clone().add(isNightTime ? 1 : 0.5, 'hours');
  }
}

function sendScheduledPhotos() {
  const currentTime = moment().tz('Europe/Kiev');
  const isNightTime = currentTime.hour() >= 0 && currentTime.hour() < 12;

  if (photoQueue.length > 0 && shouldSend(currentTime, isNightTime) && lastPhotoSentTime.minute() !== currentTime.minute()) {
    const photo = photoQueue.shift();
    sendScheduledPhoto(photo.chatId, photo.file_id);
    console.log(`Фото відправлено о ${currentTime.format('HH:mm')}`);
    lastPhotoSentTime = moment().tz('Europe/Kiev');
  }

  console.log(`Кількість фото у черзі: ${photoQueue.length}`);
}

function shouldSend(currentTime, isNightTime) {
  if (isNightTime) {
    return currentTime.minute() === 0;
  } else {
    return currentTime.minute() % 30 === 0;
  }
}


async function sendScheduledPhoto(chatId, file_id) {
  try {
    await bot.telegram.sendPhoto(selectedChannelId, file_id);
    console.log(`Photo successfully sent to ${chatId}`);
  } catch (error) {
    console.error(`Error sending photo: ${error.message}`);
  }
}
