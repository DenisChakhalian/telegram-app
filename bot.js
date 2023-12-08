const { Telegraf, Markup } = require("telegraf");
const moment = require("moment-timezone");
const { Bot3 } = require("./models/bot3");
const { connect } = require("./utils/db");
require("dotenv").config();

const botToken = process.env.TOKEN;
const bot = new Telegraf(botToken);

let selectedChannelId = +process.env.CHANEL;
let userId = +process.env.USER;
let lastPhotoSentTime = null;
let isGroup = false;
let sign;
let count = 0;

async function startBot() {
  try {
    await connect();
    count = await Bot3.count();
    await bot.telegram.deleteWebhook();
    await bot.launch({
      webhook: {
        domain: "https://telegram-app-2b8p.onrender.com",
        port: process.env.PORT,
      },
    });
    // .launch();
  } catch (error) {
    console.error("Error starting bot:", error.message);
  }
}

bot.start((ctx) => {
  if (ctx.message.from.id !== userId) {
    ctx.reply("ти хто");
    return;
  }

  const chatId = ctx.message.chat.id;
  ctx.reply("Бот запущено.");
  ctx.reply(
    "Виберіть команду:",
    Markup.keyboard([
      ["Змінити тип постингу"],
      ["Усього фотографій", "Дата останнього посту"],
    ]).resize()
  );
});

bot.command("setchannel", (ctx) => {
  if (ctx.message.from.id !== userId) {
    ctx.reply("ти хто");
    return;
  }

  selectedChannelId = ctx.message.forward_from_chat.id;
  ctx.reply(`Канал встановлено: ${selectedChannelId}`);
});

bot.hears("Змінити тип постингу", (ctx) => {
  isGroup = !isGroup;
  ctx.reply(`Змінено групування фотографій: ${isGroup}`);
});

bot.hears("Усього фотографій", (ctx) => {
  if (ctx.message.from.id !== userId) {
    ctx.reply("ти хто");
    return;
  }

  ctx.reply(`Кількість фото у черзі: ${count}`);
});

bot.hears("Дата останнього посту", async (ctx) => {
  if (ctx.message.from.id !== userId) {
    ctx.reply("ти хто");
    return;
  }

  let currentTime = moment().tz("Europe/Kiev");
  let isGroupPhoto;
  let photoGroupId = undefined;

  const photos = await Bot3.findAll();

  photos.forEach((photo) => {
    if (!isGroupPhoto || photo.media_group_id !== photoGroupId) {
      isGroupPhoto = photo.isGroup;
      photoGroupId =
        photo.media_group_id === null ? undefined : photo.media_group_id;
      const isNightTime = currentTime.hour() >= 24 && currentTime.hour() < 19;

      if (
        isNightTime &&
        currentTime?.hours() > 24 &&
        currentTime.hours() < 10
      ) {
        currentTime.set("hours", 10);
      } else {
        if (isNightTime) {
          currentTime.set("hours", currentTime.hours() + 1);
        } else {
          currentTime.add(30, "minutes");
        }
      }
    }
  });

  const isNightTime = currentTime.hour() >= 24 && currentTime.hour() < 19;

  if (isNightTime && currentTime?.hours() > 24 && currentTime.hours() < 10) {
    currentTime.set("hours", 10);
    currentTime.set("minutes", 0);
  } else {
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
  }

  currentTime.set("seconds", 0);

  ctx.reply(`Дата останньої публікації: ${currentTime}`);
});

bot.command("setSign", (ctx) => {
  if (ctx.message.from.id !== userId) {
    ctx.reply("ти хто");
    return;
  }

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

bot.command("delete", async (ctx) => {
  if (ctx.message.from.id !== userId) {
    ctx.reply("ти хто");
    return;
  }

  await Bot3.destroy({
    where: {},
    truncate: true,
  });
  count = await Bot3.count();
});

bot.on("text", (ctx) => {
  console.log(ctx.message);
});

bot.on("photo", async (ctx) => {
  const chatId = ctx.message.chat.id;
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const file_id = photo.file_id;
  const file_unique_id = photo.file_unique_id;
  const media_group_id = ctx.message.media_group_id;

  if (ctx.message.from.id !== userId) {
    ctx.reply("ти хто");
    return;
  }

  const samePhoto = await Bot3.findOne({
    where: {
      file_unique_id: file_unique_id,
    },
  });

  if (samePhoto) {
    await Bot3.destroy({
      where: {
        file_unique_id: file_unique_id,
      },
    });
    count = await Bot3.count();
    return;
  }

  const currentTime = moment().tz("Europe/Kiev");

  const sendTime = calculateSendTime(currentTime, lastPhotoSentTime);

  lastPhotoSentTime = currentTime;

  await Bot3.create({
    chatId,
    file_id,
    sendTime,
    file_unique_id,
    media_group_id,
    isGroup,
  });

  count = await Bot3.count();
});

// bot.launch()

startBot(); // Запуск бота

console.log("Бот запущено...");

setInterval(() => {
  sendScheduledPhotos();
}, 20000);
// }, 1000);

function calculateSendTime(currentTime, lastPhotoSentTime) {
  const isNightTime = currentTime.hour() >= 24 && currentTime.hour() < 19;

  if (lastPhotoSentTime) {
    const nextSendTime = lastPhotoSentTime
      .clone()
      .add(isNightTime ? 1 : 0.5, "hours");
    return nextSendTime;
  } else {
    return currentTime.clone().add(isNightTime ? 1 : 0.5, "hours");
  }
}

async function sendScheduledPhotos() {
  const currentTime = moment().tz("Europe/Kiev");
  const isNightTime = currentTime.hour() >= 24 && currentTime.hour() < 19;

  if (
    count > 0 &&
    shouldSend(currentTime, isNightTime) &&
    (lastPhotoSentTime?.hours() !== currentTime?.hours() ||
      lastPhotoSentTime?.minute() !== currentTime?.minute())
  ) {
    const photo = await Bot3.findOne({
      order: [["createdAt", "ASC"]],
    });
    sendScheduledPhoto(photo);
    console.log(`Фото відправлено о ${currentTime.format("HH:mm")}`);
    lastPhotoSentTime = moment().tz("Europe/Kiev");
  }

  console.log(`Кількість фото у черзі: ${count}`);
}

function shouldSend(currentTime, isNightTime) {
  if (isNightTime) {
    if (currentTime?.hours() > 24 && currentTime.hours() < 10) {
      return false;
    }

    return currentTime.minute() === 0;
  } else {
    return currentTime.minute() % 30 === 0;
  }
  // return true;
}

async function sendScheduledPhoto(photo) {
  try {
    if (!photo.isGroup || !photo.media_group_id) {
      await bot.telegram.sendMediaGroup(selectedChannelId, [
        {
          type: "photo",
          media: photo.file_id,
          caption: sign,
          parse_mode: "MarkdownV2",
        },
      ]);
      await Bot3.destroy({
        where: {
          id: photo.id,
        },
      });
    } else {
      const photosByGroupId = await Bot3.findAll({
        where: {
          media_group_id: photo.media_group_id,
        },
      });

      const media = photosByGroupId.map((el, idx) => {
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
      await bot.telegram.sendMediaGroup(selectedChannelId, media);

      await Bot3.destroy({
        where: {
          id: photosByGroupId.map((el) => el.id),
        },
      });
    }
    count = await Bot3.count();
    console.log(`Photo successfully sent to ${photo.chatId}`);
  } catch (error) {
    console.error(`Error sending photo: ${error.message}`);
  }
}
