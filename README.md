# Getting Started with 

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.


## first of all, a postgreSql needs to be installed in your machine/server

sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
\q 
sudo -u postgres createuser --interactive
(that i named   name: mihoadie  --  with fullname   fullname: mihoadie  -- and to whom i tiped  'y' when they asked me to, to give mihoadie superuser attributations)

sudo -u postgres createdb mihoadie 
sudo -u postgres psql
(optional command :    sudo adduser mihoadie)
GRANT ALL ON mihoadie TO mihoadie;
GRANT ALL PRIVILEGIES TO mihoadie;
GRANT ALL PRIVILEGES ON DATABASE mihoadie TO mihoadie;
\q
sudo -u mihoadie psql
ALTER USER mihoadie PASSWORD 'mypassword';
\q

## then install Dbeaver by going to https://dbeaver.io/download/  and select the 'Linux Debian package (installer)' if you are on LINUX
a connection needs to be set, once dbeaver has been installed in your machine, to connect efficiently to your recent created Database (in my case named mihoadie)
to do so, simply open your dbeaver and go to connection-> new -> chosse PostgresSql, and then fullfill all requested info 
Host: localhost
port: 5432
Database: mihoadie
Authentication: Database Native
Nom utilisateur: mihoadie
Mot de Passe: mypassword (in other words the password that we provided when doing alter user mihoadie password 'mypassword' when intalling postgres)


useful link: https://www.youtube.com/watch?v=zYhv1Dj8Gmw&ab_channel=E-MultiSkillsDatabaseTutorials




### complete details of main ideas and processes in sequelize_helper.js file

### the current backEnd needs to be run first, meaning that we first do npm start from the backend folder, and once done, we can initiate the front. the front will then be redirected to port 3001 instead of port 3000


### a mandatory .env file needs to be created at the root of the backend project( the app_key variable has been generated using  in the app    const secret = require('crypto').randomBytes(64).toString('hex')); console.log(secret)) to get a random secured key and then paste it in the .env. Example here below of the .env
APP_KEY=672efc84b892a1dda305fb46cf8254e25ca29dfe6aeac81230dc3473a06e411a0937a4791149117e69f455587667bb2eaea34fd4b2a860222d9ea2f48a5dec5c
APP_URL=http://127.0.0.1
APP_PORT=3000
DB_HOST=localhost 
DB_USER=mihoadie
DB_PASSWORD=mypassword
DB_DATABASE=mihoadie
APP_FRONTURL=http://127.0.0.1:3001
