const router = require("express").Router();

router.get("/home", (req, res, next) => {
  return res.send("Home Screen");
});

/**
 * '/home' has been defined first. App will now use the auth.js file for routes starting with '/'
 *       >> '/login' & '/register' being available routes from auth.js 
 */  
router.use('/', require('./auth'));
router.use('/users', require('../router/user'));
router.use('/chats', require('../router/chat'));

module.exports = router;
