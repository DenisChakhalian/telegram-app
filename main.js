const { Telegraf, Markup } = require("telegraf");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const fsPromises = require("fs/promises");
const moment = require("moment-timezone");
const { default: axios } = require("axios");
const sharp = require("sharp");
require("dotenv").config();

const botService = require("./src/services/bot.service");
const settingsService = require("./src/services/settings.service");
const { connect } = require("./src/utils/db");
const { toFixText, toMarkdownLink, toFixLink } = require("./src/utils/text");

const botToken = process.env.TOKEN;
const bot = new Telegraf(botToken);

const selectedChannelId = +process.env.CHANEL;
const userId = +process.env.USER;
let lastPhotoSentTime = null;
let sign = process.env.CHANEL_SIGN;
let count = 0;
let settings = null;

async function startBot() {
  try {
    await connect();

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
    });

    count = await botService.getCountAll();
    settings = await settingsService.getSettings();

    await bot.telegram.deleteWebhook();

    await bot.launch({
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

bot.use(userValidator);

bot.start(start);

bot.command("setSign", setSign);

bot.command("delete", deleteAll);

bot.hears("Змінити тип постингу", togglePostingType);

bot.hears("Корзина", getBin);

bot.hears("Усього постів", getCount);

bot.hears("Усього фотографій", getPicturesCount);

bot.hears("Дата останнього посту", getLastDate);

bot.hears("Ув./вим. рандом", toggleRandom);

bot.hears("Ув./вим. постинг", togglePosting);

bot.on("photo", createPhoto);

bot.on("text", (ctx) => {
  console.log(ctx.message);
});

startBot();

console.log("Бот запущено...");

setInterval(() => {
  sendScheduledPhotos();
}, 20000);
// }, 5000);
// }, 1000);

function userValidator(ctx, next) {
  if (ctx.message.from && ctx.message.from.id !== userId) {
    ctx.reply("ти хто");
    return;
  } else if (!ctx.message.from || !ctx.message || !ctx) {
    return;
  } else {
    return next();
  }
}

async function start(ctx) {
  ctx.reply("Бот запущено.");
  ctx.reply(
    "Виберіть команду:",
    Markup.keyboard([
      ["Ув./вим. постинг", "Корзина"],
      ["Змінити тип постингу", "Ув./вим. рандом"],
      ["Усього постів", "Усього фотографій", "Дата останнього посту"],
    ]).resize()
  );
}

async function togglePostingType(ctx) {
  await settingsService.updateSettings({
    ...settings,
    isGroup: !settings.isGroup,
  });

  settings = await settingsService.getSettings();

  ctx.reply(`Змінено групування фотографій: ${settings.isGroup}`);
}

async function getBin(ctx) {
  const photosBin = await botService.getBin();

  if (!photosBin.length) {
    ctx.reply("Корзина пуста");
    return;
  }

  let accIdx = 0;

  const medias = photosBin.reduce(
    (acc, el) => {
      if (acc[accIdx] && acc[accIdx].length === 10) {
        accIdx++;
        acc[accIdx] = [];
      }

      acc[accIdx].push({
        type: "photo",
        media: el.file_id,
        caption: toFixText(el.will_delete_date.toString()),
        parse_mode: "MarkdownV2",
      });

      return acc;
    },
    [[]]
  );

  medias.forEach(async (media) => {
    await bot.telegram.sendMediaGroup(ctx.message.chat.id, media);
  });
}

async function getCount(ctx) {
  let countPosts = 0;
  const postsIds = [];

  const photos = await botService.getAll();

  photos.forEach((photo) => {
    if (photo.isGroup) {
      if (
        !postsIds.includes(photo.media_group_id) ||
        photo.media_group_id === null
      ) {
        countPosts++;
        postsIds.push(photo.media_group_id);
      }
    } else {
      countPosts++;
    }
  });

  ctx.reply(`Кількість постів у черзі: ${countPosts}`);
}

async function getPicturesCount(ctx) {
  ctx.reply(`Кількість фото у черзі: ${count}`);
}

async function getLastDate(ctx) {
  let currentTime = moment().tz("Europe/Kiev");
  let isGroupPhoto;
  let photoGroupId = undefined;

  const photos = await botService.getAll();

  if (!photos.length) {
    ctx.reply("Черга пуста");

    return;
  }

  photos.forEach((photo) => {
    if (!isGroupPhoto || photo.media_group_id !== photoGroupId) {
      isGroupPhoto = photo.isGroup;
      photoGroupId =
        photo.media_group_id === null ? undefined : photo.media_group_id;
      const isNightTime = currentTime.hour() >= 0 && currentTime.hour() < 19;

      if (
        isNightTime &&
        currentTime?.hours() > 0 &&
        currentTime?.hours() < 10
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

  const isNightTime = currentTime.hour() >= 0 && currentTime.hour() < 19;

  if (isNightTime && currentTime?.hours() > 0 && currentTime.hours() < 10) {
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
}

async function toggleRandom(ctx) {
  await settingsService.updateSettings({
    ...settings,
    isRandom: !settings.isRandom,
  });

  settings = await settingsService.getSettings();

  ctx.reply(`Рандом: ${settings.isRandom}`);
}

async function togglePosting(ctx) {
  await settingsService.updateSettings({
    ...settings,
    isPosting: !settings.isPosting,
  });

  settings = await settingsService.getSettings();

  ctx.reply(`Постинг: ${settings.isPosting ? "увімкнено" : "вимкнено"}`);
}

async function setSign(ctx) {
  const text = toMarkdownLink(ctx.message.text, ctx.message.entities, true);

  sign = text;

  ctx.reply(`Підпис змінено!: ${sign}`);
}

async function deleteAll() {
  await botService.deleteAll();

  count = await botService.getCountAll();
}

async function createPhoto(ctx) {
  const photo = ctx.message.photo[ctx.message.photo.length - 1];

  const currentTime = moment().tz("Europe/Kiev");

  const chatId = ctx.message.chat.id;
  const file_id = photo.file_id;
  const file_unique_id = photo.file_unique_id;
  const media_group_id = ctx.message.media_group_id;

  let description = "";

  if (
    !("forward_from" in ctx.message) &&
    !("forward_origin" in ctx.message) &&
    !("forward_from_chat" in ctx.message)
  ) {
    if (ctx.message.caption && ctx.message.caption_entities) {
      description =
        toMarkdownLink(
          ctx.message.caption,
          ctx.message.caption_entities,
          false
        ) + "\n\n";
    } else if (!ctx.message.caption_entities) {
      description = toFixText(ctx.message.caption) + "\n\n";
    }
  }

  const samePhoto = await botService.getOneByFUI(file_unique_id);

  if (samePhoto) {
    await botService.addToBinByFUI(file_unique_id);

    count = await botService.getCountAll();

    return;
  }

  lastPhotoSentTime = currentTime;

  settings = await settingsService.getSettings();

  await botService.create({
    chatId,
    file_id,
    file_unique_id,
    media_group_id,
    isGroup: settings.isGroup,
    description,
    messageId: ctx.message.message_id,
  });

  const file_info = await ctx.telegram.getFile(file_id);
  const file_url = await ctx.telegram.getFileLink(file_id);
  const file_href = file_url.href;

  // const watermarkName = "dh";
  const watermarkName = "bg";
  // const watermarkName = "np";

  const response = await axios({
    method: "get",
    url: file_href,
    responseType: "stream",
  });

  const file_path = `${file_id}.${file_info.file_path.split(".").pop()}`;

  const file_stream = fs.createWriteStream(file_path);

  response.data.pipe(file_stream);

  const watermarkPath = "watermark/" + `${watermarkName}.png`;

  const id = Date.now();

  const newWatermarkPath = `${watermarkName}${id}.png`;

  file_stream.on("finish", async () => {
    try {
      const imageBuffer = await fsPromises.readFile(file_path);
      const watermarkBuffer = await fsPromises.readFile(watermarkPath);

      const mainImageMetadata = await sharp(imageBuffer).metadata();

      const mainImageWidth = mainImageMetadata.width;
      const mainImageHeight = mainImageMetadata.height;

      const reduceSize = 20;

      let dep;

      if (mainImageWidth < mainImageHeight) {
        dep = mainImageWidth;
      } else if (mainImageWidth > mainImageHeight) {
        dep = mainImageHeight;
      } else {
        dep = Math.round(mainImageWidth / 1.2);
      }

      const watermarkNewWidth = Math.round((reduceSize * dep) / 100);

      const resizedWatermarkBuffer = await sharp(watermarkBuffer)
        .resize(watermarkNewWidth)
        .toBuffer();

      await fsPromises.writeFile(newWatermarkPath, resizedWatermarkBuffer);

      const watermarkNewBuffer = await fsPromises.readFile(newWatermarkPath);

      const resultBuffer = await sharp(imageBuffer)
        .composite([
          {
            input: watermarkNewBuffer,
            // gravity: "southeast",
            gravity: "northeast", // bg
          },
        ])
        .toBuffer();

      await fsPromises.writeFile(file_path, resultBuffer);
    } catch (error) {
      console.error("Помилка під час додавання водяного знаку:", error.message);
    }

    try {
      const cloudinaryUploadResponse = await cloudinary.uploader.upload(
        file_path,
        {
          quality: "auto:best",
        }
      );

      const imageUrl = cloudinaryUploadResponse.secure_url;
      console.log(imageUrl);

      fs.unlink(file_path, (error) => {
        if (error) {
          console.error(
            `Помилка при видаленні файлу ${file_path}:`,
            error.message
          );
        }
      });

      fs.unlink(newWatermarkPath, (error) => {
        if (error) {
          console.error(
            `Помилка при видаленні файлу ${file_path}:`,
            error.message
          );
        }
      });

      await botService.updateImageUrlByFUI(imageUrl, file_unique_id);

      count = await botService.getCountAll();
    } catch (error) {
      console.error("Помилка під час виконання запиту до cloudinary:", error);
    }
  });
}

async function sendScheduledPhotos() {
  const currentTime = moment().tz("Europe/Kiev");
  const isNightTime = currentTime.hour() >= 0 && currentTime.hour() < 19;

  if (
    settings.isPosting &&
    count > 0 &&
    shouldSend(currentTime, isNightTime) &&
    (lastPhotoSentTime?.hours() !== currentTime?.hours() ||
      lastPhotoSentTime?.minute() !== currentTime?.minute())
  ) {
    const photo = await botService.getNextPost();

    await deleteFromBin(currentTime);

    if (settings.isRandom && photo.isGroup) {
      const firstPhoto = await botService.getFirstPhotoMediaGroup(
        photo.media_group_id
      );

      sendScheduledPhoto(firstPhoto);
    } else {
      sendScheduledPhoto(photo);
    }

    console.log(`Фото відправлено о ${currentTime.format("HH:mm")}`);
    lastPhotoSentTime = moment().tz("Europe/Kiev");
  }

  console.log(`Кількість фото у черзі: ${count}`);
}

function shouldSend(currentTime, isNightTime) {
  if (isNightTime) {
    if (currentTime?.hours() > 0 && currentTime.hours() < 10) {
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
          media: photo.imageUrl,
          caption:
            toFixLink(photo.description) + (sign ? toFixLink(sign) : sign),
          parse_mode: "MarkdownV2",
        },
      ]);

      await botService.deleteById(photo.id);
    } else {
      const photosByGroupId = await botService.getAllByMediaGroup(
        photo.media_group_id
      );

      const media = photosByGroupId.map((el, idx) => {
        if (idx === 0) {
          return {
            type: "photo",
            media: el.imageUrl,
            caption:
              toFixLink(photo.description) + (sign ? toFixLink(sign) : sign),
            parse_mode: "MarkdownV2",
          };
        } else {
          return {
            type: "photo",
            media: el.imageUrl,
          };
        }
      });
      await bot.telegram.sendMediaGroup(selectedChannelId, media);

      await botService.deleteByIds(photosByGroupId.map((el) => el.id));
    }

    count = await botService.getCountAll();

    console.log(`Photo successfully sent to ${photo.chatId}`);
  } catch (error) {
    console.error(`Error sending photo: ${error}`);
  }
}

async function deleteFromBin(currentTime) {
  const photoBin = await botService.getLastFromBin();

  if (
    photoBin &&
    moment(photoBin.will_delete_date).tz("Europe/Kiev") <= currentTime
  ) {
    await botService.deleteFromBinById(photoBin.id);
  }
}
