const jwt = require('jsonwebtoken')
const config = require('../config/app')


// here below = directly linked to chat-backend/router/user.js when calling router.post("/update", [auth], update);

// ... because the auth 'validator', passed in the array just above as 2nd param, is indeed the here below middleware call!
        // ...so at the end, it is executed in the chat-backend/router/index.js as such file does router.use('/users', require('./user'))
                // ... so at the end it is executed in the chat-backend/index.js as such file does const router = require("./router") AND app.use(router);
exports.auth= (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];
    
    if(!token){
        return res.status(401).json({error:'Missing Token from connection. are you connected?'})
    }
    // to verify user token validity (exists ? still valid? ...)
    jwt.verify(token, config.appKey, (err, user) => {
        if (err) {console.log('error while verifying token'); return res.status(401).json({error: err})}
        // console.log('auth user', user)
        req.user = user // if user found and token OK, then we append the complete user to the req object to continue through the next method
    })
    next()
}