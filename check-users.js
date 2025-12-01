// Check users in database
require('dotenv').config({ path: './finserve-api/.env' });
const db = require('./finserve-api/app/models');

async function checkUsers() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database');

    const users = await db.users.findAll({
      attributes: ['user_id', 'username', 'email']
    });

    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(`- ${user.user_id}: ${user.username} (${user.email})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
  }
}

checkUsers();