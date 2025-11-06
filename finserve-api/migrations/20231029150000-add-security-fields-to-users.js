'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Vérifier si la colonne existe déjà pour éviter les erreurs
    const tableInfo = await queryInterface.describeTable('users');
    
    // Ajouter les colonnes manquantes si elles n'existent pas
    const columnsToAdd = [
      { name: 'login_attempts', type: 'INTEGER', defaultValue: 0, allowNull: false },
      { name: 'email_verified', type: 'BOOLEAN', defaultValue: false, allowNull: false },
      { name: 'two_factor_enabled', type: 'BOOLEAN', defaultValue: false, allowNull: false },
      { name: 'two_factor_secret', type: 'STRING(255)', allowNull: true },
      { name: 'last_login_date', type: 'DATETIME', allowNull: true }
    ];

    for (const column of columnsToAdd) {
      if (!tableInfo[column.name]) {
        await queryInterface.addColumn('users', column.name, {
          type: Sequelize[column.type.split('(')[0]], // Enlève la longueur si présente
          allowNull: column.allowNull,
          defaultValue: column.defaultValue
        });
        console.log(`Colonne ${column.name} ajoutée avec succès.`);
      } else {
        console.log(`La colonne ${column.name} existe déjà.`);
      }
    }

    // Mettre à jour le champ is_locked s'il existe déjà sous un autre nom
    if (tableInfo.isLocked && !tableInfo.is_locked) {
      await queryInterface.renameColumn('users', 'isLocked', 'is_locked');
      console.log('Colonne isLocked renommée en is_locked avec succès.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Ne pas supprimer les colonnes pour éviter la perte de données
    // Cette migration est considérée comme irréversible pour des raisons de sécurité
    console.log('Cette migration ne peut pas être annulée pour des raisons de sécurité.');
  }
};
