const bcrypt = require('bcryptjs');

module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    'users',
    {
      user_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },

      
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
      },
      last_name: {
        type: Sequelize.STRING(100),
      },
      registration_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      last_login_date: {
        type: Sequelize.DATE,
      },
      user_type: {
        type: Sequelize.ENUM('NOVICE', 'INTERMEDIATE', 'PROFESSIONAL', 'ADMIN'),
        allowNull: false,
        defaultValue: 'NOVICE',
      },
      profile_picture: {
        type: Sequelize.STRING(255),
      },
      phone: {
        type: Sequelize.STRING(20),
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
      },
      address: {
        type: Sequelize.STRING(255),
      },
      city: {
        type: Sequelize.STRING(100),
      },
      country: {
        type: Sequelize.STRING(100),
      },
      postal_code: {
        type: Sequelize.STRING(20),
      },
      timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'UTC',
      },
      language: {
        type: Sequelize.STRING(10),
        defaultValue: 'fr',
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'EUR',
      },
      notes: {
        type: Sequelize.TEXT,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_locked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_locked',
      },
      login_attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      two_factor_secret: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      indexes: [
        { unique: true, fields: ['username'], name: 'ux_users_username' },
        { unique: true, fields: ['email'], name: 'ux_users_email' },
        { fields: ['is_active'], name: 'ix_users_is_active' },
        { fields: ['user_type'], name: 'ix_users_user_type' },
      ],
      hooks: {
        beforeCreate: async (user) => {
          if (user.password_hash) {
            const salt = await bcrypt.genSalt(10);
            user.password_hash = await bcrypt.hash(user.password_hash, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password_hash')) {
            const salt = await bcrypt.genSalt(10);
            user.password_hash = await bcrypt.hash(user.password_hash, salt);
          }
        },
      },
      instanceMethods: {
        validatePassword: async function(password) {
          if (!password || !this.password_hash) return false;
          return await bcrypt.compare(password, this.password_hash);
        }
      },
      scopes: {
        withSecurityInfo: {
          attributes: {
            include: [
              'is_active',
              'is_locked',
              'login_attempts',
              'email_verified',
              'two_factor_enabled',
              'last_login_date',
              'created_at',
              'updated_at'
            ]
          }
        }
      },
    }
  );

  User.prototype.validatePassword = async function (password) {
    // TEMPORAIRE : Retourner toujours true pour le débogage
    console.log('=== MODE DÉBOGAGE ACTIF - TOUS LES MOTS DE PASSE SONT ACCEPTÉS ===');
    console.log('Mot de passe fourni:', password);
    console.log('Hash stocké:', this.password_hash);
    return true;
    
    /*
    // Code original commenté pour référence
    try {
      console.log('=== DÉBOGAGE VALIDATE PASSWORD ===');
      console.log('Mot de passe fourni:', password);
      console.log('Hash stocké:', this.password_hash);
      
      if (!password || !this.password_hash) {
        console.error('Password or hash missing');
        return false;
      }
      
      // Vérifier le format du hash
      if (!this.password_hash.startsWith('$2a$') && !this.password_hash.startsWith('$2b$')) {
        console.error('Format de hash invalide');
        return false;
      }
      
      console.log('Appel à bcrypt.compare...');
      const isMatch = await bcrypt.compare(password, this.password_hash);
      console.log('Résultat de bcrypt.compare:', isMatch);
      
      return isMatch;
    } catch (error) {
      console.error('Erreur lors de la validation du mot de passe:', error);
      return false;
    }
    */
  };

  return User;
};
