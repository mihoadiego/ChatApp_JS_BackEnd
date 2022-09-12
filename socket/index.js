// const socketIo = require('socket.io')
const { Server } = require("socket.io");
require("dotenv").config();
const config = require("../config/app");

const { sequelize } = require("../models");
const Message = require('../models').Message
/**
 * MAP = JS standard collection acting like an object
 *      WHY USING IT ? to set key value pairs
 *      ADVANTAGES ? remembers original insertion order of the keys --> will always maintain this order of entries
 *      EXAMPLE : const user = new Map(); user.set('bill', 2); user.get('bill'); user.has('bill'); user.delete('bill'); user.size; user.clear; user.forEach((value, key) => {})
 */

const users = new Map();
const userSockets = new Map()



/**
 * 
 * define our server and its associated events 
 */

const SocketServer = (server) => {
    const io = new Server(server, config.socketIOConfig);

    io.on('connection', (socket) => {
        console.log('connection')
        socket.on('join', async (user) => {
            console.log('join event', users)
            let sockets = [] // list of all Sockets of the user

            if (users.has(user.id)) {
                console.log('join event HAS', users.get(user.id))
                const existingUser = users.get(user.id)
                // add socket to User' list of `sockets he is connected to`
                
                // kokob: before, code was only         existingUser.sockets = [...existingUser.sockets, ...[socket.id]] but now, code is condition below
                if(existingUser.sockets.includes(socket.id)) {// kokob added this line
                    existingUser.sockets = [...existingUser.sockets]// kokob added this line
                }else{ // kokob added this line
                    existingUser.sockets = [...existingUser.sockets, ...[socket.id]]
                }// kokob added this line
                
                // update users with an updated list of sockets we belongs to, including the current one we joined in
                users.set(user.id, existingUser)
                // socket update here because a user can be connected in different devices (phone, laptop...) so here we will manage all!
                
                

                // kokob: before, code was only         sockets = [...existingUser.sockets, ...[socket.id]] but now, code is condition below
                if(existingUser.sockets.includes(socket.id)) {// kokob added this line
                    sockets = [...existingUser.sockets]// kokob added this line
                }else{ // kokob added this line
                    sockets = [...existingUser.sockets, ...[socket.id]]
                }// kobob added this line
                userSockets.set(socket.id, user.id)
            } else {
                console.log('joinn event DOES NOT HAVE')
                users.set(user.id, { id: user.id, sockets: [socket.id] })
                sockets.push(socket.id)
                userSockets.set(socket.id, user.id)
            }

            const onlineFriends = [] // ids

            const chatters = await getChatters(user.id) // query 

            console.log(chatters);

            // notify his friends that user is now online
            for (let i = 0; i < chatters.length; i++) {
                if (users.has(chatters[i])) {
                    const chatter = users.get(chatters[i])
                    chatter.sockets.forEach(socket => {
                        try {
                            //send message to each socket where a chatter is connected
                            io.to(socket).emit('online', user)
                        } catch (e) { }
                    })
                    onlineFriends.push(chatter.id)
                }
            }

            // send to user sockets which of his friends are online
            sockets.forEach(socket => {
                try {
                    //send message to socket
                    io.to(socket).emit('friends', onlineFriends)
                } catch (e) { }
            })

            console.log('END users', users.size, users)
            console.log('END userSockets', users.size, userSockets)
            console.log('END sockets', sockets)
        })
        
        socket.on('message', async (message) => {
            let sockets = [] // LIST of sockets that we have to send the content/message  to
            // update sockets LIST here above with the complete sockets'list of the user that sends the message
            if (users.has(message.fromUser.id)) {
                sockets = users.get(message.fromUser.id).sockets
            }
            // update sockets LIST here above with, for each of users that needs to receive the message, their corresponding individual socketlist
            message.toUserId.forEach(id => {
                if (users.has(id)) {
                    sockets = [...sockets, ...users.get(id).sockets]
                }
            })

            try {
                const msg = {
                    type: message.type,
                    fromUserId: message.fromUser.id,
                    chatId: message.chatId,
                    message: message.message
                }

                const savedMessage = await Message.create(msg)

                message.User = message.fromUser
                message.fromUserId = message.fromUser.id
                message.id = savedMessage.id
                message.message = savedMessage.message
                delete message.fromUser

                sockets.forEach(socket => {
                    io.to(socket).emit('received', message)
                })

            } catch (e) { }

        })

        socket.on('typing', async(message) => {
            message.toUserId.forEach(id=>{
                if(users.has(id)){
                    users.get(id).sockets?.forEach?.(socket => {
                        io.to(socket).emit('typing', message)
                    })
                }
            })
        })

        socket.on('add-friend', (chatDetails) => {
                //chatDetails comes from <FriendList/> component in the chat-frontend repository
                // .. precisely in the addNewFriend() method
                // addNewFriend first generate the ChatController, for create route, and then 
                // the chatController returns an array like [forCreator, forReceiver] 
                // once reiving this array, an socketRef.emit('add-friend', chatDetails) is processed in the front side, still in the addNewFriendMethod
                // forCreator being the userid that created the chat  and  forReceiver the person that has been invited to the chat (ie partnerId)
                // that is how we arrive at this point below         
            try {
                let online = 'offline'
                if (users.has(chatDetails[1].Users[0].id)) { // chatDetails[1] = forReceiver, ie the user that has been invited to chat (the invited)
                    online = 'online'
                    chatDetails[0].Users[0].status = 'online' // chatDetails[0] = the inviter = forCreator ie the user that invitedthe forReceiver (forReceiver = chatDetails[1])
                    users.get(chatDetails[1].Users[0].id).sockets.forEach(socket => { // update of all sockets of the forReceiver (ie person that has been invited)
                        io.to(socket).emit('new-chat', chatDetails[0] /*the inviter*/) // by notifying that a new-chat invitation has come from another user
                    })
                }
                if (users.has(chatDetails[0].Users[0].id)) { // chatDetails[0] = forCreator, ie the user that invited the forReceiver (forReceiver = chatDetails[1])
                    chatDetails[1].Users[0].status = online
                    users.get(chatDetails[0].Users[0].id).sockets.forEach(socket => {
                        io.to(socket).emit('new-chat', chatDetails[1])
                    })
                }

            } catch (e) { }

        })

        socket.on('add-user-to-group', ({ chat, newChatter }) => {
            if (users.has(newChatter.id)) {
                newChatter.status = 'online'
            }

            // i want to update the old users of the group
            chat.Users.forEach((user, index) => {
                if (users.has(user.id)) {
                    chat.Users[index].status = 'online'
                    users.get(user.id).sockets.forEach(socket => {
                        try {
                            io.to(socket).emit('added-user-to-group', { chat, chatters: [newChatter] })
                            // such emit event will help us, on the front side, updating our store
                        } catch (e) { }
                    })
                }
            })

            // send to new chatter if he is online
            if (users.has(newChatter.id)) {
                users.get(newChatter.id).sockets.forEach(socket => {
                    try {
                        io.to(socket).emit('added-user-to-group', { chat, chatters: chat.Users })
                        // such emit event will help us, on the front side, updating our store
                    } catch (e) { }
                })
            }
        })

        socket.on('leave-current-chat', (data) => {
            // event generated by the leaveChat helper function from the frontend (chat-frontend/src/utils/helpers/index.js => leaveChat Method)
            // complete process below:
            // 1) origin chat-frontend/src/components/Chat/components/ChatHeader/ChatHeader.js => ...{showChatOptions && ... <div onClick={()=>{leaveChat(chat.id, socketRef)}}>...<p>Leave...</p></div>}
            // 2) origin chat-frontend/src/utils/helpers.index.js => leaveChat() function ...
            //      2) bis  origin chat-frontend/src/services/chatService.js => leaveCurrentChat()
            //      2) ter  origin chat-backend/router/chat.js = route '/leave-current-chat' calling first the auth middleware to generate a req.user and then a leaveCurrentChat controller 
            //      2) quar origin chat-backend/controllers/chatController.js => leaveCurrentChat() controller
            // 3) ... the leaveChat() function in the 2) step has a .then(socketReference.emit('leave-current-chat', data)
            // 4) we arrive HERE!and we do a io.to(socket).emit('remove-user-from-chat'...') for all users to be notified, for all their corresponding socketsif they are connected on multiple devices      
            const { chatId, userId, currentUserId, notifyUsers } = data
            notifyUsers.forEach(id => {
                if (users.has(id)) {
                    users.get(id).sockets.forEach(socket => {
                        try {
                            io.to(socket).emit('remove-user-from-chat', { chatId, userId, currentUserId })
                        } catch (e) { }
                    })
                }
            })
        })

        socket.on('delete-chat', (data) => {
            const { chatId, notifyUsers } = data
            notifyUsers.forEach(id => {
                if (users.has(id)) {
                    users.get(id).sockets.forEach(socket => {
                        try {
                            io.to(socket).emit('delete-chat', parseInt(chatId))
                        } catch (e) { }
                    })
                }
            })
        })

        socket.on('disconnect', async () => {
            if (userSockets.has(socket.id)) {
                const user = users.get(userSockets.get(socket.id))
                //     A - check if user has multiple sockets opened on, 
                //     B - if user still connected to other sockets, we update its user.sockets list and we update our global users MAP 
                //     C - if it was the last socket the user was connected to, we remove him from the global users list and notify his friends
                if (user.sockets.length > 1) {//A
                    user.sockets = user.sockets.filter(sock => { //B
                        if (sock !== socket.id) return true

                        userSockets.delete(sock)
                        return false
                    })
                    users.set(user.id, user)
                } else { //C
                    const chatters = await getChatters(user.id)
                    // notify his friends that user is now offline
                    for (let i = 0; i < chatters.length; i++) {
                        if (users.has(chatters[i])) {
                            users.get(chatters[i]).sockets.forEach(socket => {
                                try {
                                    //send message to each socket where a chatter is connected
                                    io.to(socket).emit('offline', user)
                                } catch (e) {console.log('error while trying to emit an offline event coming from a user, to the rest of the chatters', e) }
                            })
                        }
                    }
                    userSockets.delete(socket.id)
                    users.delete(user.id)
                }
            }
        })

    });
};

getChatters = async (userId) => {
  try {
    // [result, metadata] => directly coming from sequelize. 
    const [results, metadata]= await sequelize.query(`
        SELECT "cu"."userId" 
        FROM "ChatUsers" as cu
            INNER JOIN (
                SELECT "c"."id" 
                FROM "Chats" as c
                WHERE EXISTS (
                    SELECT "u"."id" 
                    FROM "Users" u
                    INNER JOIN "ChatUsers" on "ChatUsers"."userId" = "u"."id"
                    WHERE "u"."id" = ${parseInt(userId)} AND "c"."id" = "ChatUsers"."chatId"  
                )
            ) as cjoin on cjoin.id = "cu"."chatId"
        WHERE  "cu"."userId" != ${parseInt(userId)}
    `) // the Main inner join part renamed cjoin helps us getting all chats where the user is actually chatting someone
    console.log('chatters', results)
    return results.length ? results.map(r=>r.userId) : [] 
  } catch (e) {
    console.log('error while trying to get all chatters',e);
    return []
  }
};


module.exports = SocketServer;
