```javascript
'use strict'

const CHANNEL_USERNAME = '@uzchesara';

async function isSubscribed(bot, telegramId) {
  try {
    const member = await bot.getChatMember(
      CHANNEL_USERNAME,
      telegramId
    );

    return [
      'creator',
      'administrator',
      'member'
    ].includes(member.status);

  } catch (error) {
    console.error(
      '❌ Kanal obunasini tekshirish xatosi:',
      error.message
    );

    return false;
  }
}

async function requireSubscription(bot, msg) {
  const chatId = msg.chat.id;

  const subscribed = await isSubscribed(
    bot,
    chatId
  );

  if (subscribed) {
    return true;
  }

  await bot.sendMessage(
    chatId,
    `♟️ CHESARA

CHESARA'dan foydalanish uchun avval
rasmiy kanalimizga obuna bo‘ling.

📢 @uzchesara

Obuna bo‘lgach, quyidagi tugmani bosing:`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📢 Kanalga obuna bo‘lish',
              url: 'https://t.me/uzchesara'
            }
          ],
          [
            {
              text: '✅ Obunani tekshirish',
              callback_data: 'check_subscription'
            }
          ]
        ]
      }
    }
  );

  return false;
}

module.exports = {
  CHANNEL_USERNAME,
  isSubscribed,
  requireSubscription
};
```
