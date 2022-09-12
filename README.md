# Getting Started with 

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### complete details of main ideas and processes in sequelize_helper.js file

### the current backEnd needs to be run first, meaning that we first do npm start from the backend folder, and once done, we can initiate the front. the front will then be redirected to port 3001 instead of port 3000


### a mandatory .env file needs to be created at the root of the backend project( the app_key variable has been generated using  in the app    const secret = require('crypto').randomBytes(64).toString('hex')); console.log(secret)) to get a random secured key and then paste it in the .env. Example here below of the .env
APP_KEY=672efc84b892a1dda305fb46cf8254e25ca29dfe6aeac81230dc3473a06e411a0937a4791149117e69f455587667bb2eaea34fd4b2a860222d9ea2f48a5dec5c
APP_URL=http://127.0.0.1
APP_PORT=3000
DB_HOST=localhost 
DB_USER=mihoadie
DB_PASSWORD=
DB_DATABASE=mihoadie
APP_FRONTURL=http://127.0.0.1:3001
