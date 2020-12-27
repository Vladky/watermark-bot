require('dotenv').config();
import request from 'request';
import TelegramBot from 'node-telegram-bot-api';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const watermarkBuffer = fs.readFileSync(
  path.resolve(__dirname, '../resources/watermark.png'),
);

const setWatermark = async (photo: Buffer, watermarkBuffer: Buffer) => {
  const target = sharp(photo).jpeg({ quality: 90 });
  const targetWidth = (await target.metadata()).width;
  const watermark = await sharp(watermarkBuffer)
    .resize({
      width: Math.round(targetWidth * 0.05),
    })
    .toBuffer();
  return (
    target
      .jpeg({ quality: 90 })
      .composite([{ input: watermark, gravity: 'southeast' }])
      .toBuffer()
  );
};
const photoHandler = async (msg: TelegramBot.Message) => {
  let photoLink;
  if (msg.document) {
    photoLink = await bot.getFileLink(msg.document.file_id);
  } else {
    photoLink = await bot.getFileLink(msg.photo[msg.photo.length - 1].file_id);
  }
  const photoResponse = await axios.get(photoLink, {
    responseType: 'arraybuffer',
  });
  const photoBuffer = Buffer.from(photoResponse.data, 'utf-8');

  const watermarkedPhotoBuffer = await setWatermark(
    photoBuffer,
    watermarkBuffer,
  );
  bot.sendDocument(msg.from.id, watermarkedPhotoBuffer);
};
bot.on('photo', photoHandler);
bot.on('document', photoHandler);

console.log('Bot is started');
