const User = require('../models').User;
const { request } = require('express');
const sequelize = require('sequelize')

exports.update = async (req, res, next) => {
    
    if (req.file) {
        req.body.avatar = req.file.filename // req.file.filename is directly generated and created by multer 
        //because do not forget that multer execution comes from the previous executed middleware, 
        //such previous executed middleware named userFileUpload, (called in the /router/user.js file before this current controller), generated a file key to the req, such key having as value an object with a filename sub-key
        // just before calling and executing the present controller  
    }

    if(typeof req.body.avatar !== 'undefined' && !req.body.avatar.length) delete req.body.avatar

    try {

        const [rows, result] = await User.update(req.body, 
            {
                where: {
                // req.user is now available thanks to chat-backend/middleware/auth.js => auth.
                    // indeed, such function is executed as a middleware validator, when managing the chat-backend/router/user.js file ... 
                    // as ...[auth]... in such mentionned file is called before the update controller (when declaring router.post("/update", [auth], update) )
                    id: req.user.id,
                }, 
                returning: true,
                individualHooks: true
            }
        )
        const user = result[0].get({raw: true});
        user.avatar = result[0].avatar;
        delete user.password
        return res.send(user);

    }catch (err) {
        res.status(500).json({error: err.message})
    }
};

exports.search = async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                [sequelize.Op.or]: { // to be able to search both on names and emails, we are going to manage the sequelize.where with a custom function
                    namesConcated: sequelize.where(
                        // 1 - define a custom function, with sequelize.fn, to render firstname and lastname
                        sequelize.fn('concat', sequelize.col('firstName'), ' ', sequelize.col('lastName')),
                        // 2 - define which criteria are going to be executed for this custom function
                        {
                            [sequelize.Op.iLike]: `%${req.query.term}%` // iLike here cause Postgres, but should be like if MySQL
                        }
                    ),
                    email: {
                        [sequelize.Op.iLike]: `%${req.query.term}%`
                    }
                },
                // and of course excluding ourselves from the search!
                [sequelize.Op.not]: {
                    id: req.user.id
                }
            },
            limit: 10
        })

        return res.json(users)

    } catch (e) {
        return res.status(500).json({ error: e.message })
    }
}
