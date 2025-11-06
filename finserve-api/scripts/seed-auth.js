/* Seed base roles and an initial admin user */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const db = require('../app/models');

async function ensureRoles() {
  const ROLE_PERMISSIONS = {
    USER: [],
    TRADER: ['PLACE_ORDERS', 'VIEW_MARKET_DATA'],
    MODERATOR: ['VIEW_USERS'],
    ADMIN: ['VIEW_USERS', 'MANAGE_USERS', 'MANAGE_ROLES', 'VIEW_AUDIT_LOGS'],
  };

  for (const role_name of Object.keys(ROLE_PERMISSIONS)) {
    const [role, created] = await db.roles.findOrCreate({
      where: { role_name },
      defaults: { role_name, permissions: ROLE_PERMISSIONS[role_name] },
    });
    // Si le rôle existait déjà, on met à jour les permissions pour refléter la configuration actuelle
    if (!created) {
      await role.update({ permissions: ROLE_PERMISSIONS[role_name] });
    }
  }
}

async function ensureAdminUser() {
  const adminDefaults = {
    username: 'admin',
    email: 'admin@example.com',
    password_hash: 'Admin@12345', // will be hashed by model hook
    first_name: 'System',
    last_name: 'Administrator',
    user_type: 'ADMIN',
    is_active: true,
  };

  const [user] = await db.users.findOrCreate({
    where: { email: adminDefaults.email },
    defaults: adminDefaults,
  });

  const adminRole = await db.roles.findOne({ where: { role_name: 'ADMIN' } });
  if (adminRole) {
    // attach ADMIN role if not already
    const existing = await db.user_roles.findOne({ where: { user_id: user.user_id, role_id: adminRole.role_id } });
    if (!existing) {
      await db.user_roles.create({ user_id: user.user_id, role_id: adminRole.role_id });
    }
  }
}

async function main() {
  try {
    await db.sequelize.authenticate();
    // Ensure models are in sync (non-destructive if schema already applied elsewhere)
    await db.sequelize.sync();

    await ensureRoles();
    await ensureAdminUser();

    console.log('Seed completed: roles and admin user ensured.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();
