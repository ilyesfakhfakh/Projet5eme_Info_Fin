module.exports = (sequelize, Sequelize) => {
  const PredictionModel = sequelize.define(
    'prediction_models',
    {
      model_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      model_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      model_type: {
        type: Sequelize.ENUM('LSTM', 'ARIMA', 'RANDOM_FOREST'),
        allowNull: false,
      },
      asset_id: {
        type: Sequelize.UUID,
      },
      accuracy: {
        type: Sequelize.DECIMAL(6, 3),
        defaultValue: 0,
      },
      predictions: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      features: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
    },
    {
      tableName: 'prediction_models',
      underscored: true,
      timestamps: true,
    }
  );

  return PredictionModel;
};
