require('dotenv').config();

module.exports = {
    appKey: process.env.APP_KEY,
    appUrl: process.env.APP_URL,
    appPort: process.env.APP_PORT,
    socketIOConfig: {
        cors: {
          origin: process.env.APP_FRONTURL,
          allowedHeaders: ["my-personal-chat-handling-cors"],
          credentials: true
        },
        // reconnection:false
        // allowRequest: (req, callback) => {
        //     const noOriginHeader = req.headers.origin === undefined;
        //     callback(null, noOriginHeader);
        //   }
    }
}