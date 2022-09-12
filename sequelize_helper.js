/**
 * installing sequelize and sequelize cli and mandatory pg package
 *      npm i --save sequelize
 *      npm i --save sequelize-cli
 *      npm install -g sequelize-cli
 *      npm i --save pg 
 * 
 * 
 * 
 * 
 * 
 * understanding sequelize
 *      all config done into .sequelizerc
 * 
 * 
 * 
 * 
 * 
 * 
 * main command used after setting the config from .sequelizerc:
 *      // to initialize sequelize. It automatically created the folder /models and also 2 subfolder within database folder (migrations/seeders)
 *      sequelize init   
 * 
 *      // to create a model. Such command generates a file into /database/migrations that we have been modifying adding defaultValue and unique keys     
 *      sequelize model:create --name User --attributes firstName:string,lastName:string,email:string,password:string,gender:string,avatar:string 
 *      other examples:     sequelize model:create --name Chat --attributes type:string
 *                          sequelize model:create --name ChatUser --attributes chatId:integer,userId:integer
 *                          sequelize model:create --name Message --attributes type:string,message:text,chatId:integer,fromUserId:integer
 *                          
 *      // to define relationships between table, we can then take benefits of the models/ auto generated files, 
 *          in which we can find , a static associate(model) method. here below the associations led into the models/chat.js
 *                      //chat table is linked to user through an intermediate table chatUser! directly linked to chatUser and indirectly linked to User
 *                       static associate(models) {
 *                          this.belongsToMany(models.User, {through: 'ChatUser', foreignKey:'chatId'})
 *                          this.hasMany(models.ChatUser, {foreignKey: 'chatId'})
 *                       }
 *         WITHOUT FORGETTING TO ALSO UPDATE MIGRATIONS FILES GENERATED BELOW, by adding for example in the database/migrations/...create-chat-user.js
 *          the below properties
 *                       chatId: {
 *                           type: Sequelize.INTEGER,
 *                           allowNull: false,
 *                           references: {
 *                               model: 'Chats',
 *                               key: 'id'
 *                           },
 *                           onDelete: 'CASCADE'
 *                       },
 *                       userId: {
 *                           type: Sequelize.INTEGER,
 *                           allowNull: false,
 *                           references: {
 *                              model: 'Users',
 *                              key: 'id'
 *                           },
 *                           onDelete: 'CASCADE'
 *                       }, 
 * 
 *      // to lauch migrations
 *      sequelize db:migrate      
 *      sequelize db:migrate:undo if we want to avoid the last migration launched 
 * 
 *      // to create seeder and populate database with some data. Such command generates a file into /database/seeders that we have been modifying a bit
 *      sequelize seed:create --name users
 *      sequelize db:seed:all if we want to run the associated population of data
 *      sequelize db:seed:undo if we want to avoid the last seeding launched
 *
 *      
 * 
 * 
 * main package installed afterwards:
 *      // to check content sent from the front end, thanks to express validator library (a bit working like yup, but for express request content) 
 *              npm i --save express-validator
 *         and we can then declare 
 *              const {body} = require('express-validator') in our .router/auth.js for example 
 *         and put our associated rules BY
 *              + creating a folder(/validators/index.js) in which we define a validate method to be executed (thanks to validationResult() coming from express validator
 *              + create a general method named 'rules', into the /validators/auth/register.js file, exporting it with its imediate execution
 *                please note that in login route, we directly declared the express validator rules, where in register route, we isolated it 
 *                into a dedicated file and then import it as  const {rules:registrationRules} = require('../validators/auth/register')
 *                BOTH METHOD BEING OK
 * 
 *         complete example in /router/auth.js with the 3 params passed to the router.post(ROUTE ,  VALIDATORRULES,   CONTROLLER METHOD TO BE EXECUTED) 
 *              router.post('/register', [registrationRules, validate], register);
 *          and 
 *              router.post('/login', 
 *                          [
 *                              body('email').isEmail(), 
 *                              validate,
 *                          ],
 *                          login 
 *              )
 
 * 
 * 
 * 
 * understanding Models
 *          models are very helpful to set what we exactly expect / send to the database.
 *          confere /models/user.js   that can both be used through ORM, but also through sequlize raw queries
 *          in such model, we initiate a model by importing the "Model" class from 'sequelize
 *          then we define a class User that extends this "Model" class 
 *          then we define the init values of the class, for each instance, and it is precisely there that we can also set hooks (like hashpassword)
 *          and also guetters method (like the avatar init value of the User =>   user.avatar  to define default image)
 * 
 * 
 * understanding middlewares combined to personalized validators
 *          we created a auth.js file into a chat-backend/middleware/ folder.
 *          such file exports a function, that checks wether the token exists + is valid or not (thanks to jwtwebtoken library)
 *          so such middleware helps us verifying ,before processing an update of profile, if the user is still connected (with valid /not expired token)
 *          using the next () then guaranee that the other verifications will be executed (like the validators ...)
 *          because at the end, every verif is managed into the chat-backend/router folder, where in the index we use all the router files
 *          ... in which we find for example a serie of verification passed into an array =>   example:
 *          router.post('/update', [auth, updateProfileRules, validate], update);
 *                      /update being the path
 *                      [...]  being the array containing both middlewares like auth and validators like updateProfileRules +validate
 *                      update being the final controller being executed/called and then directly making sequelize actions
 *          the next(), in chat-backend/middleware/auth.js, means if we stick to here above example, that after auth, in the array, updateProfileRules 
 *          will be called/execteud correctly. otherwise, it would have stopped at auth.
 *          
 * 
 * 
 * READ FILES ... understanding middleares that helps us check file upload directly from the backend, thanks to the multer library
 *          to do so, we first installed multer in our backend project
 *              npm i --save multer
 *          we then created a middleware in chat-backend/middleware/fileUpload.js 
 *              in which we imported multer and handle the multer
 *              please not that we export the userFileUpload in such fileUpload.js file, by adding () at the end, 
 *              why () at the end?  =>   to directly execute it once importing it! 
 *          and then, once the file chat-backend/middleware/fileUpload.js has been written using multer.diskSotrage...
 *          ... we can import it in our user router and put it in the  dedicated 2nd param array => 
 *                  through router.post("/update", [auth, USERFILEUPLOAD, updateProfileRules, validate], update)
 *          ... but it is not finished, as we also needed to define our userController to be executed as third param of our 
 *              /router/user.js  route. router.post("/update", [auth, userFileUpload, updateProfileRules, validate], UPDATE)
 *          the UPDATE controller is then called, coming from the chat-backend/controllers/userController.js 
 *                      in which we take advantage of the actions led by the previous middleware executed (fileUpload...) 
 *                      to then check if there is a req.file object generated from mulder and then catch the saved file if so.
 *          
 * 
 *          but when doing all this to handle files... it is important not to forget to update our chat-backend/models/user.js file
 *          as avatar can then be defined
 * 
 * 
 * understanding SEQUELIZE.TRANSACTION()
 *          confere chat-backend/controllers/chatController.js  =>  create(req, res) controller
 *          indeed, transactions are very handy to manage potential errors if multiples tasks/transactions occurs
 *          when processing multiple task in one or various methods, grouping it in a transaction 
 *          guarantees that a rollback of all  changes is processed in case any errors during global execution 
 *          logic:
 *          in a method with multiple task, like create, we first declare transaction from sequelize models, then add it to all tasks, and then commit. in case of error, we roolback 
 *               const { sequelize } = require('../models')
 *               const t = await sequelize.transaction()
 *               then we add {transaction: t} in each coming request
 *               if err, in catch error we do an await t.rollback()
 *               otherwise we do a t.commit() before returning the res.send(...)or res.json(...)
 * 
 * 
 * 
 * 
 * 
 * understanding connection to socket
 *          to manage that, we use the config/database.js file by adding to each exports (developpement, test and production) the "logging": false key value pair
 *                      
 *              
 *  
 */



/**
 * =============================================================================================================================================
 * SOCKET IO IMPLEMENTATION
 * 
 * 
 * 1) INSTALL PACKAGES:
 *      nmp i socket.io  (IN CHAT-BACKEND REPO)
 *      npm i socket.io-client (IN CHAT-FRONTEND REPO)
 *      
 * 1 BIS) in the .env, create a new variable to tell from where the APcalls are coming from      APP_FRONTURL=http://127.0.0.1:3001
 * 
 * 
 * 2) create a socket folder (at the same tree level as the /config one, ie top tree level) with a index.js file in it
 *           const { Server } = require("socket.io");
 *           require('dotenv').config();
 *           const SocketServer = server => {
 *               const io = new Server(server, {
 *                   cors: {
 *                   origin: process.env.APP_FRONTURL,
 *                   allowedHeaders: ["my-personal-chat-handling-cors"],
 *                   credentials: true
 *                   }
 *                   // allowRequest: (req, callback) => {
 *                   //     const noOriginHeader = req.headers.origin === undefined;
 *                   //     callback(null, noOriginHeader);
 *                   //   }
 *               });
 *               io.on('connection', (socket) => {
 *                   socket.on('join', async (user) => {
 *                      console.log('new user joined', user.firstName)
 *                      io.to(socket.id).emit('typing', 'User typing...') // to send an event to the front end as a reply
 *                   })
 *               })
 *           }
 *           module.exports = SocketServer;
 * ---------------------------
 * WITHOUT FORGETTING TO SET OUR SOCKET IN OUR MAIN INDEX.JS FILE (/INDEX.JS) 
 * 
 *          const http = require('http')
 *          ... 
 *          app.use(....)
 *          ....
 *          const server = http.createServer(app)
 *          const SocketServer = require('./socket')
 *          SocketServer(server)
 * ---------------------------
 * WITHOUT FORGETTING NEITHER, AT THE very END OF THE INDEX.JS MAIN FILE, TO CONVERT app.listen(port, ()=>console.log(`server listening on port ${port}))  TO
 *          server.listen(port, () => console.log(`server listening on port ${port}`));
 * ---------------------------- 
 * 
 * 
 */



/**
 * 
 * MISCELLANEOUS
 *  
 */
/*
HANDLE REQUEST THAT RETURNS A CUSTOMED RESPONSE INCLUDING OR , LIKE, WHERE ...
CONFERE chat-backend/src/controllers/userController.js, with the search controller! 
WE WILL READ THIS CONTROLLER FROM THE HEART TO THE GLOBAL
NAMECONCATED...?  
HERE, WE RECEIVE AS QUERY TERMS A FIRST NAME AND A LAST NAME BOTH CONCATENATED IN ONE STRING, COMING FROM THE FRONT
SO WE WILL FIRST CREATE A CUSTOM FUNCTION THAT WILL CONCAT COLUMNS FIRSTNAME WITH LASTNAME
AND THEN, THE 'WHERE' CLAUSE WILL APPLY BY COMPARING THE RESULT OF SUCH CUSTOM CONCAT WITH THE QUERY TERMS
THE ILIKE HELPS US FOR THAT
AND AS THE QUERY TERM CAN BE OR A CONCAT FIRSTNAME LASTNAME.... OR AN EMAIL, THE GLOBAL SEQUELIZE.OP.OR HELPS US MANAGING IT
(OR EMAIL, OR NAMESCONCATED-IE CUSTOM COMPARISON)
AND OF COURSE A LAST GLOBAL CONDITION THOURGH OP TO GET ALL EXCEPT ME AS USERS
            exports.search = async (req, res) => {
                try {
                    const users = await User.findAll({
                        where: {
                            // to be able to search both on names and emails, we are going to manage the sequelize.where with a custom function
                            [sequelize.Op.or]: { 
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
                } catch (e) {return res.status(500).json({ error: e.message })}
            }
*/