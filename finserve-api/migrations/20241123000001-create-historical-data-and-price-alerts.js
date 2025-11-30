'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Vérifier si la table historical_data existe déjà
      const tables = await queryInterface.showAllTables();
      
      // Créer la table historical_data si elle n'existe pas
      if (!tables.includes('historical_data')) {
        await queryInterface.createTable('historical_data', {
          history_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          asset_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'assets',
              key: 'asset_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            comment: 'Foreign key reference to assets table'
          },
          date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            comment: 'Trading date for this historical data point'
          },
          open_price: {
            type: Sequelize.DECIMAL(18, 6),
            allowNull: false,
            defaultValue: 0,
            comment: 'Opening price for the day'
          },
          high_price: {
            type: Sequelize.DECIMAL(18, 6),
            allowNull: false,
            defaultValue: 0,
            comment: 'Highest price during the day'
          },
          low_price: {
            type: Sequelize.DECIMAL(18, 6),
            allowNull: false,
            defaultValue: 0,
            comment: 'Lowest price during the day'
          },
          close_price: {
            type: Sequelize.DECIMAL(18, 6),
            allowNull: false,
            defaultValue: 0,
            comment: 'Closing price for the day'
          },
          adjusted_close: {
            type: Sequelize.DECIMAL(18, 6),
            allowNull: false,
            defaultValue: 0,
            comment: 'Adjusted closing price (accounts for splits, dividends)'
          },
          volume: {
            type: Sequelize.BIGINT,
            allowNull: false,
            defaultValue: 0,
            comment: 'Trading volume for the day'
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        });

        // Ajouter les index pour historical_data
        await queryInterface.addIndex('historical_data', ['asset_id', 'date'], {
          unique: true,
          name: 'unique_asset_date'
        });

        await queryInterface.addIndex('historical_data', ['date'], {
          name: 'idx_date'
        });

        console.log('✓ Table historical_data créée avec succès');
      } else {
        console.log('✓ Table historical_data existe déjà');
      }

      // Créer la table price_alerts si elle n'existe pas
      if (!tables.includes('price_alerts')) {
        await queryInterface.createTable('price_alerts', {
          alert_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'user_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          asset_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'assets',
              key: 'asset_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          alert_type: {
            type: Sequelize.ENUM('ABOVE', 'BELOW', 'PERCENTAGE_CHANGE'),
            allowNull: false,
            defaultValue: 'ABOVE'
          },
          target_price: {
            type: Sequelize.DECIMAL(18, 6),
            allowNull: false
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          is_triggered: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          triggered_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          message: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        });

        // Ajouter les index pour price_alerts
        await queryInterface.addIndex('price_alerts', ['user_id'], {
          name: 'idx_price_alerts_user_id'
        });

        await queryInterface.addIndex('price_alerts', ['asset_id'], {
          name: 'idx_price_alerts_asset_id'
        });

        await queryInterface.addIndex('price_alerts', ['is_active'], {
          name: 'idx_price_alerts_is_active'
        });

        console.log('✓ Table price_alerts créée avec succès');
      } else {
        console.log('✓ Table price_alerts existe déjà');
      }

    } catch (error) {
      console.error('Erreur lors de la création des tables:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Supprimer les index de price_alerts
      await queryInterface.removeIndex('price_alerts', 'idx_price_alerts_is_active').catch(() => {});
      await queryInterface.removeIndex('price_alerts', 'idx_price_alerts_asset_id').catch(() => {});
      await queryInterface.removeIndex('price_alerts', 'idx_price_alerts_user_id').catch(() => {});
      
      // Supprimer la table price_alerts
      await queryInterface.dropTable('price_alerts');
      console.log('✓ Table price_alerts supprimée');

      // Supprimer les index de historical_data
      await queryInterface.removeIndex('historical_data', 'idx_date').catch(() => {});
      await queryInterface.removeIndex('historical_data', 'unique_asset_date').catch(() => {});
      
      // Supprimer la table historical_data
      await queryInterface.dropTable('historical_data');
      console.log('✓ Table historical_data supprimée');

    } catch (error) {
      console.error('Erreur lors de la suppression des tables:', error);
      throw error;
    }
  }
};
