const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const configurate = require('../config/app')

/**
 * ========================================================================================================================================
 * ALL REQ VALIDATION FORM (EX: ISEMAIL?, NOTEMPTY...) PROCESSED DIRECTLY INTO THE ROUTER/AUTH.JS FILE. THE ROUTER/AUTH.JS FILE INDEED
 * IMPORTS THE /VALIDATOR/INDEX.JS FILE, IN WHICH WE HANDLE ALL THE REQ FORMS THANKS TO THE EXPRESS VALIDATOR LIBRARY 
 * AND ITS VALIDATIONRESULT ASSOCIATED METHOD
 * ========================================================================================================================================
 */



/**
 * ========================================================================================================================================
 * FUNCTION to generate a token and return a detailed but filtered object excluding password
 * ========================================================================================================================================
 */

const generateToken = (user) => {
  if (user.password) delete user.password;
  const token = jwt.sign(user, configurate.appKey, { expiresIn: 84600 }); // #details:user     #secret:appKey(.env)   #expire : 1 week
  //destructuring properly token to add it into our returned object, and also adding 'requested' key with the currentdate 
  return { ...{user}, ...{ token }, requested: new Date() };
};

/**
 * ========================================================================================================================================
 * METHOD 1  : USING MODELS METHODS LIKE FINDONE... FROM SEQUELIZE ORM
 * ========================================================================================================================================
 */

const User = require("../models").User;
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // find User
    const user = await User.findOne({
      where: { email: email },
    });
    // check if User exists
    if (!user)
      return res
        .status(404)
        .json({ status: "bad request", message: "User not found" });
    // check if password matches
    if (!bcrypt.compareSync(password, user?.password))
      return res
        .status(401)
        .json({ status: "forbidden request", message: "incorrect password" });
    // generate auth Token using get({raw:true}) utility => because user, when coming from a model, is much more than a simple JSON object as it is a sequelize instance for now
    //using user.get({raw:true}) converts it into a JSON proper object
    const userWithToken = generateToken(user.get({ raw: true }));
    // the User.findOne added to user.get({raw:true}) returns a sequelized instance of our model User, and it cannot execute the 
    // getters set in the model (/models/user.js) => confere for example the getter set in the user.init({avatar{get()}})
    // that is why we write the below line to execute them after having generated its mentionned instance, to call the guetter from the User instance
    userWithToken.user.avatar = user.avatar 
    res.send(userWithToken);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "KO", message: error.message });
  }
};

exports.register = async (req, res) => {
    try {
        // we can pass clear password, directly passing req.body, cause User model has a hook (conf /models/user.js)
        const user = await User.create(req.body)
        const userWithToken = generateToken(user.get({ raw: true }));
        res.send(userWithToken);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: "KO", message: error.message });
    }

};



/**
 * =======================================================================================================================================
 * METHOD 2 : USING sequelize RAW Queries for login
 * below section is commented, as it is an alternative to method 1 login
 * =======================================================================================================================================
 */

/*
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}
exports.login = async (req, res) => {
    const {email, password} = req.body;
    try {
        // find User
        const user = await sequelize.query(`SELECT * FROM public."Users" u WHERE u.email = :email`, 
            {
                // model: User,
                replacements: {email: email},
                type: Sequelize.QueryTypes.SELECT,

            }
        );
        // check if user exists => Sequelize.query returning an array (empty array if no results)
        if (!user.length) return res.status(404).json({status: 'bad request', message: 'User not found'})
        // check if password matches
        if (!bcrypt.compareSync(password, user[0]?.password)) return res.status(401).json({status: 'forbidden request', message: 'incorrect password'})
        // generate auth Token
        const userWithToken = generateToken(user[0])
        res.send(userWithToken)
    } catch (error) {
        console.log(error)
        return res.status(500).json({status: 'KO', message: error.message})
    }
};
*/