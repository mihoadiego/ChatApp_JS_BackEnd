/**
 * such file directly included into router/index.js
 */

const router = require("express").Router();
const {update, search} = require('../controllers/userController');
const {validate} = require('../validators');
const {auth} = require('../middleware/auth');
const {rules: updateProfileRules} = require('../validators/user/update');
const {userFile} = require('../middleware/fileUpload');

router.post('/update', [auth, userFile, updateProfileRules, validate], update);
router.get('/search-users', auth, search ) 
module.exports = router;
 