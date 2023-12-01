const { Telegraf, Markup } = require("telegraf");
const moment = require("moment-timezone");
const express = require("express");

// const botToken = '6784050286:AAERYE8oUO-E8IOQR6TnOdkbliPpPI_bqyg';
const botToken = process.env.TOKEN;
const bot = new Telegraf(botToken);

let selectedChannelId = null;
let lastPhotoSentTime = null;
let isGroup = false;
let sign;
let photoQueue = [];

async function startBot() {
  try {
    await bot.telegram.deleteWebhook();
    await bot
      .launch(
        {
        webhook: {
          domain: 'https://telegram-app-2b8p.onrender.com',
          port: process.env.PORT,
        },
      })
      // .launch();
  } catch (error) {
    console.error("Error starting bot:", error.message);
  }
}

bot.start((ctx) => {
  const chatId = ctx.message.chat.id;
  ctx.reply("Бот запущено. Виберіть канал за допомогою /setchannel");
});

bot.command("setchannel", (ctx) => {
  selectedChannelId = ctx.message.forward_from_chat.id;
  ctx.reply(`Канал встановлено: ${selectedChannelId}`);
  
  ctx.reply(
    "Виберіть команду:",
    Markup.keyboard([
      ["Змінити тип постингу"],
      ["Усього фотографій", "Дата останнього посту"],
    ]).resize()
  );
  
});

bot.hears("Змінити тип постингу", (ctx) => {
  isGroup = !isGroup;
  ctx.reply(`Змінено групування фотографій: ${isGroup}`);
});

bot.hears("Усього фотографій", (ctx) => {
  ctx.reply(`Кількість фото у черзі: ${photoQueue.length}`);
});

bot.hears("Дата останнього посту", (ctx) => {
  let currentTime = moment().tz("Europe/Kiev");
  let isGroupPhoto;
  let photoGroupId = null;

  console.log(currentTime, "1");

  photoQueue.forEach((photo) => {
    if (!isGroupPhoto || photo.media_group_id !== photoGroupId) {
      isGroupPhoto = photo.isGroup;
      photoGroupId =
        photo.media_group_id === undefined ? null : photo.media_group_id;
      const isNightTime = currentTime.hour() >= 0 && currentTime.hour() < 12;

      if (isNightTime) {
        currentTime.set("hours", currentTime.hours() + 1);
      } else {
        currentTime.add(30, "minutes");
      }

      console.log(currentTime);
      console.log(isGroupPhoto);
      console.log(photoGroupId);
    }
  });

  const isNightTime = currentTime.hour() >= 0 && currentTime.hour() < 12;

  if (isNightTime) {
    if (currentTime.minute() !== 0) {
      currentTime.set("minutes", 0);
    }
  } else {
    if (currentTime.minute() % 30 !== 0) {
      if (currentTime.minute() > 30) {
        currentTime.set("minutes", 30);
      } else {
        currentTime.set("minutes", 0);
      }
    }
  }

  currentTime.set("seconds", 0);

  ctx.reply(`Дата останньої публікації: ${currentTime}`);
});

bot.command("setSign", (ctx) => {
  console.log(ctx.message.text);
  console.log(ctx.message.entities);
  const text = ctx.message.text
    .split(" ")
    .slice(1)
    .join(" ")
    .split("")
    .map((ch, idx) => {
      if (
        idx ===
        ctx.message.entities[1].offset - ctx.message.entities[0].length - 1
      ) {
        return "[" + ch;
      }

      if (
        idx ===
        ctx.message.entities[1].offset +
          ctx.message.entities[1].length -
          ctx.message.entities[0].length -
          2
      ) {
        return ch + "](" + ctx.message.entities[1].url + ")";
      }

      return ch;
    })
    .join("");

  //= "[text](https://www.google.com/)";

  sign = text;

  ctx.reply(`Підпис змінено!: ${sign}`);
});

bot.on("text", (ctx) => {
  console.log(ctx.message);
});

bot.on("photo", (ctx) => {
  const chatId = ctx.message.chat.id;
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const file_id = photo.file_id;
  const file_unique_id = photo.file_unique_id;
  const media_group_id = ctx.message.media_group_id;

  console.log(media_group_id);

  if (photoQueue.some((el) => el.file_unique_id === file_unique_id)) {
    photoQueue = photoQueue.filter(
      (el) => el.file_unique_id !== file_unique_id
    );
    return;
  }

  if (!selectedChannelId) {
    ctx.reply("Спочатку виберіть канал за допомогою /setchannel");
    return;
  }

  const currentTime = moment().tz("Europe/Kiev");

  const sendTime = calculateSendTime(currentTime, lastPhotoSentTime);

  lastPhotoSentTime = currentTime;

  photoQueue.push({
    chatId,
    file_id,
    sendTime,
    file_unique_id,
    media_group_id,
    isGroup,
  });
});

// bot.launch()

startBot(); // Запуск бота

console.log("Бот запущено...");

setInterval(() => {
  sendScheduledPhotos();
}, 20000);
// }, 10000);

function calculateSendTime(currentTime, lastPhotoSentTime) {
  const isNightTime = currentTime.hour() >= 0 && currentTime.hour() < 12;

  if (lastPhotoSentTime) {
    const nextSendTime = lastPhotoSentTime
      .clone()
      .add(isNightTime ? 1 : 0.5, "hours");
    return nextSendTime;
  } else {
    return currentTime.clone().add(isNightTime ? 1 : 0.5, "hours");
  }
}

function sendScheduledPhotos() {
  const currentTime = moment().tz("Europe/Kiev");
  const isNightTime = currentTime.hour() >= 0 && currentTime.hour() < 12;

  if (
    photoQueue.length > 0 &&
    shouldSend(currentTime, isNightTime) &&
    lastPhotoSentTime.minute() !== currentTime.minute()
  ) {
    const photo = photoQueue[0];
    sendScheduledPhoto(photo);
    console.log(`Фото відправлено о ${currentTime.format("HH:mm")}`);
    lastPhotoSentTime = moment().tz("Europe/Kiev");
  }
  console.log(photoQueue)

  console.log(`Кількість фото у черзі: ${photoQueue.length}`);
}

function shouldSend(currentTime, isNightTime) {
  if (isNightTime) {
    return currentTime.minute() === 0;
  } else {
    return currentTime.minute() % 30 === 0;
  }
  // return true;
}

async function sendScheduledPhoto(photo) {
  try {
    if (!photo.isGroup || !photo.media_group_id) {
      photoQueue.shift();
      await bot.telegram.sendMediaGroup(selectedChannelId, [
        {
          type: "photo",
          media: photo.file_id,
          caption: sign,
          parse_mode: "MarkdownV2",
        },
      ]);
    } else {
      const media = photoQueue
        .filter((el) => el.media_group_id === photo.media_group_id)
        .map((el, idx) => {
          if (idx === 0) {
            return {
              type: "photo",
              media: el.file_id,
              caption: sign,
              parse_mode: "MarkdownV2",
            };
          } else {
            return {
              type: "photo",
              media: el.file_id,
            };
          }
        });
      photoQueue.splice(0, media.length);
      await bot.telegram.sendMediaGroup(selectedChannelId, media);
    }
    console.log(`Photo successfully sent to ${photo.chatId}`);
  } catch (error) {
    console.error(`Error sending photo: ${error.message}`);
  }
}
