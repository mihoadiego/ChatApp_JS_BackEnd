const express = require("express");

/**
 * importing app's config and associated APP_ dotenv
 */
const config = require("./config/app");
const port = config.appPort;
/**
 * importing cors from npm i cors installed package
 */
const cors = require('cors')


const app = express();
/**
 * import http to create a server for sockets
 * directly linked to const server = http.createServer(app)
 */
const http = require('http')

/**
 * setting app using body-parser, to handle JSON req.body and urlencoded for 'req.body images'... Warning: must be declared before app.use(router)
 */
const bodyParser = require ('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
/**
 * telling our app to use the imported cors package, to for instance receive correctly front-end axios calls
 */
app.use(cors())
/**
 * setting app using router package
 */
const router = require("./router");
app.use(router);
/**
 * setting app to be able to serve static folder, like for example the /public/male.svg  file or the /public/female.svg file
 * much helpfull to handle for example the default avatar image (through the /models/user.js guetter defined in the model  
 *          =>  user.init(  ... avatar{get(){if (!avatar)...}}))
 */

app.use(express.static(__dirname+'/public'))
app.use(express.static(__dirname+'/uploads'))
/**
 *  set our socket server thanks to http imported library
 */
const server = http.createServer(app)
const SocketServer = require('./socket')
SocketServer(server);

// before socket set    ...  :   app.listen(port, () => console.log(`server listening on port ${port}`));
// aftter socket set:
server.listen(port, () => console.log(`server listening on port ${port}`));
