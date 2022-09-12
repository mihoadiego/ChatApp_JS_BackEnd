'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [
      {
        firstName: 'Michael',
        lastName: 'Mihoadie',
        gender: 'male',
        password: bcrypt.hashSync('mihoadie',10),
        email: 'mihoadie@mihoadie.fr'
      }, 
      {      
        firstName: 'Sam',
        lastName: 'Enerve',
        gender: 'male',
        password: bcrypt.hashSync('samenerve',10),
        email: 'samenerve@samenerve.fr'
      }, 
      {      
        firstName: 'Sam',
        lastName: 'Agace',
        gender: 'female',
        password:  bcrypt.hashSync('samagace',10),
        email: 'samagace@samagace.fr'
      }
    ])
  },
  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     await queryInterface.bulkDelete('Users', null, {});
  }
};
