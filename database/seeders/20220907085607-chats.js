'use strict';
const models = require('../../models')
const User = models.User;
const Chat = models.Chat;
const ChatUser = models.ChatUser;
const Message = models.Message;
module.exports = {
  async up (queryInterface, Sequelize) {

    const users = await User.findAll({limit:2});
    const chat = await Chat.create();
    
    await ChatUser.bulkCreate([
      {
        chatId: chat.id,
        userId: users[0].id,

      },
      {
        chatId: chat.id,
        userId: users[1].id,
        
      }
    ]);

    await Message.bulkCreate([
      {
        type: 'text',
        fromUserId: users[0].id,
        message: `hello ${users[1].firstName || "you"}`,
        chatId: chat.id
      },
      {
        type: 'text',
        fromUserId: users[1].id,
        message: `hey, great to here from you ${users[0].firstName}, how are you doing my friend?`,
        chatId: chat.id
      },
      {
        type: 'text',
        fromUserId: users[0].id,
        message: `pretty fine ,and you ${users[1].firstName}? long time no speak!`,
        chatId: chat.id
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
