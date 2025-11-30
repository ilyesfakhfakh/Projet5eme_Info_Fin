module.exports = (sequelize, Sequelize) => {
  const EconomicEvent = sequelize.define(
    'economic_events',
    {
      event_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      event_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      scheduled_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      importance: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH'),
        allowNull: false,
        defaultValue: 'MEDIUM',
      },
      country: {
        type: Sequelize.STRING(100),
      },
      event_category: {
        type: Sequelize.STRING(100),
      },
      previous_value: {
        type: Sequelize.DECIMAL(18, 6),
      },
      actual_value: {
        type: Sequelize.DECIMAL(18, 6),
      },
      forecast_value: {
        type: Sequelize.DECIMAL(18, 6),
      },
    },
    {
      tableName: 'economic_events',
      underscored: true,
      timestamps: true,
    }
  );

  return EconomicEvent;
};
