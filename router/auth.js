/**
 * such file directly included into router/index.js
 */

const router = require("express").Router();
const {login, register} = require('../controllers/authController')
const {body} = require('express-validator')
const {validate} = require('../validators')
const {rules: registrationRules} = require('../validators/auth/register')

router.post("/login", 
    //providing specific rules thanks to express-validator library
    [
        body('email').isEmail(),
        body('password').isLength({min: 4}),
        validate, // coming  from /validators/index.js
    ],
    //providing dedicated controller method 
    login
);

router.post("/register", 
    //providing specific rules thanks to express-validator library
    [
        registrationRules, // coming from /validators/auth/register.js renaming the exported rules method as registrationRules method when importing it
        validate, // coming from /validators/index.js
    ], 
    //providing dedicated controller method 
    register
);

module.exports = router;
