# subscription.js

```javascript
'use strict';

const CHANNEL_USERNAME = '@uzchesara';

async function isSubscribed(bot, chatId) {
  try {
    const member = await bot.getChatMember(
      CHANNEL_USERNAME,
      chatId
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

async function requireSubscription(bot, chatId) {
  const subscribed = await isSubscribed(
    bot,
    chatId
  );

  if (subscribed) {
    return true;
  }

  await bot.sendMessage(
    chatId,
    [
      '♟️ CHESARA',
      '',
      '⚠️ Botdan foydalanish uchun',
      '@uzchesara kanaliga obuna bo‘lishingiz kerak.',
      '',
      'Kanalga obuna bo‘lmasangiz yoki',
      'undan chiqib ketsangiz, CHESARA',
      'xizmatlaridan foydalanishingiz cheklanishi mumkin.',
      '',
      'Obuna bo‘lgach, quyidagi tugmani bosing.'
    ].join('\n'),
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
