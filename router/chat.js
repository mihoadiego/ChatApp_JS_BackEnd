/**
 * such file directly included into router/index.js
 */

const router = require("express").Router();
const {index, create, messages, deleteChat, imageUpload, addUserToGroup, leaveCurrentChat} = require('../controllers/chatController');
const {auth} = require('../middleware/auth');
 const {chatFile} = require('../middleware/fileUpload')
router.get('/', [auth], index);
router.get('/messages', [auth], messages);
router.post('/create', [auth], create);
router.post('/add-user-to-group', [auth], addUserToGroup)
router.post('/leave-current-chat', auth, leaveCurrentChat)
router.post('/upload-image', [auth, chatFile], imageUpload);
router.delete('/:id', [auth], deleteChat)
module.exports = router;
  