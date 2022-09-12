const models = require('../models');
const User = models.User;
const Chat = models.Chat;
const ChatUser = models.ChatUser;
const Message = models.Message;
const { sequelize } = require('../models')
// Op being an helper from sequelize library to help defining affined contraints in our queries (helps then adding conditionals!)
const {Op} = require('sequelize')

exports.index = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { id: req.user.id },
            /*  to get elements coming from the table relationships 
                as a reminder, all relationships are defined in the Models/ + database/migrations
                here below, we will get all chats, and within each of those chats, 
                    all users except me belonging to each of those chats,
                    +
                    all last 20 messages from each of those chats
                THE TRICK HERE BELOW: OP USE   +   'INCLUDE' IN 'INCLUDE'
            */
            include: [
                {
                    model: Chat,
                    include: [
                        {model: User, where: {[Op.not] : {id: req.user.id}}}, // return all Users except me!
                        {model: Message, include:[{model: User, }],limit: 20, order: [['id', 'DESC']]}
                    ]
                }
            ]
        });
        return res.json(user.Chats)
    } catch (err) {
        res.status(500).json({error: err.message})
    }
};

exports.create = async (req, res) => {
    const { partnerId } = req.body
    /* transactions are very handy to manage potential errors if multiples tasks/transactions occurs, 
        indeed, here below, we will be creating multiple thnings at the same time
        sequelize.transaction allows us to 
        rollback any changes in case any errors occurs during the multiple tasks led in the globale create transaction process
        const { sequelize } = require('../models')
        const t = await sequelize.transaction()
        then we add {transaction: t} in each coming request
        if err, in catch error we do an await t.rollback()
        otherwise we do a t.commit() before returning the res.send(...)or res.json(...)
    */
    const t = await sequelize.transaction()
    try {
        // to check if in my chats (by joining user to chat) ... 
        // ...the user we want to speak to (partnerId) already has an opened chat with me or not. 
        const user = await User.findOne({
            where: {id: req.user.id},
            include: [{
                model: Chat,where: {type: 'dual'},
                include: [{model: ChatUser, where: {userId: partnerId}}]
            }]
        })
        if (user && user.Chats.length > 0) return res.status(403).json({ status: 'Error', message: 'Chat with this user already exists!' })

        const chat = await Chat.create({ type: 'dual' }, { transaction: t })
        //feeding the ChatUser relational table that links everything.
        // other option, not managed here, would have been to create a DB TRIGGER before insert
        await ChatUser.bulkCreate([
            {chatId: chat.id, userId: req.user.id},
            {chatId: chat.id,userId: partnerId}
        ], { transaction: t })


        // // we commit before requesting chatNew cause an issue will be done with chat.id otherwise...!        
        // await t.commit
        // const chatNew = await Chat.findOne({
        //     where: {id: chat.id},
        //     include: [
        //         {model: User,where: {[Op.not]: {id: parseInt(req.user.id,10)}}},
        //         {model: Message}
        //     ]
        // })

        // return res.json(chatNew)

        const creator = await User.findOne({where: {id: req.user.id}}, {transaction: t}) //to get the person that created the chat (user)
        const partner = await User.findOne({where: {id: partnerId}}, {transaction: t}) // to get the person that has been invited to the chat 
        await t.commit()

        const forCreator = {id: chat.id, type: 'dual', Users: [partner], Messages: []}
        const forReceiver = {id: chat.id, type: 'dual', Users: [creator], Messages: []}
        return res.json([forCreator, forReceiver])

    } catch (e) {
        await t.rollback()
        return res.status(500).json({ status: 'Error', message: e.message })
    }
}

exports.messages = async(req, res) => {
    const page = req.query.page || 1;
    const limit = 10;
    const offset = page > 1 ? page * limit : 0;
    const t = await sequelize.transaction()
    try {
        const messages = await  Message.findAndCountAll({
            where: {chatId: req.query.id},
            include:[{model: User, }],
            offset,
            limit,
            order:[['id', 'DESC']]
        }, { transaction: t })
        // to check, before accessing messages, if at least the req.user.id is indeed related to such req.query.id chatId
        const partOf = await ChatUser.findAndCountAll({where: {chatId: req.query.id, userId : req.user.id}}, { transaction: t })
        await t.commit()  

        if (!partOf || partOf === null || partOf.count < 1) return res.json({data: {messages:[]}})
        // messages.count directly coming from sequelize findAndCountAll() method
        const totalPages = Math.ceil(messages.count / limit) 
        if (page > totalPages) return res.json({data: {messages:[]}})
        
        const result = {messages: messages.rows, pagination: {page, totalPages}}
        return res.json(result)
    } catch (e){
        await t.rollback()
        return res.status(500).json({ status: 'Error', message: e.message })
    }
};

exports.imageUpload = (req, res) => {
    if (req.file) {
        return res.json({ url: req.file.filename })
    }
    return res.status(500).json('No image uploaded')
}

exports.addUserToGroup = async (req, res) => {
    // various actions here but not necessary to handle transations cause one result depending from another one. equiv await
    // we first need to find the chat, because if we add a member to the chat, that means that the chat already exists
    // .. and once this is done, we have to check if this user is already part of this chat, 'cause if already in, we will not add him again!
    // .. and then we will have to bring all users of this chat, and some older messages:
    //      .. those old chatters (all existing users of this chat), already have this chat in their state, so we will have to udptate the corresponding users inside it with the new user invited!
    //      .. and for the new user, we will have to return him this hole new chat instance to him, because he does not have it yet 
    // .. and we will have to update this chat to be a group chat now and not a dual chat anymore
    try {
        const { chatId, userId } = req.body;
        const chat = await Chat.findOne({
            where: {id: chatId},
            include: [
                {model: User},
                {model: Message, include: [{model: User}], limit: 20, order: [['id', 'DESC']]}
            ]
        })

        chat?.Messages?.reverse()
        // check if already in the group, based on the chat instance that we got in the first query here above (we loop through UserModel, returning Users)
        chat.Users.forEach(user => {
            if (user.id === userId) {
                return res.status(403).json({ message: 'User already in the group!' })
            }
        })

        await ChatUser.create({ chatId, userId })

        const newChatter = await User.findOne({where: {id: userId}})

        if (chat.type === 'dual') {
            chat.type = 'group'
            chat.save() // to save chat instance
        }
        return res.json({ chat, newChatter })
    } catch (e) {
        return res.status(500).json({ status: 'Error', message: e.message })
    }
}

exports.leaveCurrentChat = async (req, res) => {

    try {
        const { chatId } = req.body
        // get chat from the DB, including user model (inner join), to be able then to do chat.Users
        const chat = await Chat.findOne({where: {id: chatId},include: [{model: User}]})

        if (chat.Users.length === 2) return res.status(403).json({ status: 'Error', message: 'You cannot leave this chat' }) // no leaving if only two => delete chat instead

        if (chat.Users.length === 3) { // we will end up from 3 to 2, so we first update chat status to dual, as once the user will be left, only two remaining
            chat.type = 'dual'
            chat.save()
        }

        await ChatUser.destroy({where: {chatId,userId: req.user.id}})
        await Message.destroy({where: {chatId,fromUserId: req.user.id}}) // delete associated messages from the leaving user
        const notifyUsers = chat.Users.map(user => user.id) // generate an array of user's id, to then loop through and send notif to them
        return res.json({ chatId: chat.id, userId: req.user.id, currentUserId: req.user.id, notifyUsers })

    } catch (e) {
        return res.status(500).json({ status: 'Error', message: e.message })
    }
}

exports.deleteChat = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const checkIfMember = await ChatUser.findOne({where: {chatId: req.params.id, userId: req.user.id}}, {transation: t}) 
        const chat = await Chat.findOne({where: {id: req.params.id},include: [{model: User}]}, {transation: t})
        await t.commit()
        if (!checkIfMember) return res.status(401).json({ status: 'Error', message: 'Not allowed to delete a chat where you do not belong to!' }) 
        // as route will look like chats/:id   it means that we need to use req.params and not req.body(post with Json body) neither req.query (in url like ?id=)
        
        const notifyUsers = chat.Users.map(user => user.id)
        //await Chat.destroy({where: {id: req.params.id}, include: [{model: ChatUser}]})
        await chat.destroy()
        res.json({status: 'Success', message: `Chat number ${req.params.id} deleted successfully`, chatId: req.params.id, notifyUsers})
    } catch(e) {
        await t.rollback();
        return res.status(500).json({ status: 'Error', message: e.message })
    }
}