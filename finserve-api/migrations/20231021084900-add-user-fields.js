'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Vérifier si les colonnes existent déjà
      const tableInfo = await queryInterface.describeTable('users');
      
      // Liste des champs à ajouter
      const fieldsToAdd = [
        { name: 'phone', type: Sequelize.STRING(20) },
        { name: 'date_of_birth', type: Sequelize.DATEONLY },
        { name: 'address', type: Sequelize.STRING(255) },
        { name: 'city', type: Sequelize.STRING(100) },
        { name: 'country', type: Sequelize.STRING(100) },
        { name: 'postal_code', type: Sequelize.STRING(20) },
        { name: 'timezone', type: Sequelize.STRING(50), defaultValue: 'UTC' },
        { name: 'language', type: Sequelize.STRING(10), defaultValue: 'fr' },
        { name: 'currency', type: Sequelize.STRING(3), defaultValue: 'EUR' },
        { name: 'notes', type: Sequelize.TEXT },
        { name: 'is_locked', type: Sequelize.BOOLEAN, defaultValue: false },
        { name: 'is_email_verified', type: Sequelize.BOOLEAN, defaultValue: true }
      ];

      // Ajouter chaque champ s'il n'existe pas déjà
      for (const field of fieldsToAdd) {
        if (!tableInfo[field.name]) {
          await queryInterface.addColumn('users', field.name, {
            type: field.type,
            allowNull: field.allowNull !== undefined ? field.allowNull : true,
            defaultValue: field.defaultValue
          });
          console.log(`Colonne ${field.name} ajoutée avec succès`);
        } else {
          console.log(`La colonne ${field.name} existe déjà`);
        }
      }

      // Mettre à jour le type de l'énumération user_type s'il existe déjà
      if (tableInfo.user_type) {
        await queryInterface.sequelize.query(
          "ALTER TABLE users MODIFY COLUMN user_type ENUM('NOVICE', 'INTERMEDIATE', 'PROFESSIONAL', 'ADMIN') NOT NULL DEFAULT 'NOVICE'"
        );
        console.log('Type ENUM de user_type mis à jour avec succès');
      }

    } catch (error) {
      console.error('Erreur lors de l\'ajout des champs utilisateur:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer les colonnes ajoutées
      const fieldsToRemove = [
        'phone',
        'date_of_birth',
        'address',
        'city',
        'country',
        'postal_code',
        'timezone',
        'language',
        'currency',
        'notes',
        'is_locked'
      ];

      for (const field of fieldsToRemove) {
        await queryInterface.removeColumn('users', field);
        console.log(`Colonne ${field} supprimée avec succès`);
      }

      // Remettre le type d'origine de user_type si nécessaire
      await queryInterface.sequelize.query(
        "ALTER TABLE users MODIFY COLUMN user_type ENUM('NOVICE', 'INTERMEDIATE', 'PROFESSIONAL', 'ADMIN') NOT NULL DEFAULT 'NOVICE'"
      );
      console.log('Type ENUM de user_type réinitialisé avec succès');

    } catch (error) {
      console.error('Erreur lors de la suppression des champs utilisateur:', error);
      throw error;
    }
  }
};
