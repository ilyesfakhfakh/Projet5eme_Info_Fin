module.exports = (sequelize, Sequelize) => {
  const YieldCurve = sequelize.define(
    'yield_curves',
    {
      yield_curve_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      curve_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
        validate: {
          isIn: [['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD']],
        },
      },
      curve_type: {
        type: Sequelize.ENUM('GOVERNMENT', 'CORPORATE', 'SWAP', 'CUSTOM'),
        allowNull: false,
        defaultValue: 'GOVERNMENT',
      },
      valuation_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      maturity_points: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array of {maturity: number, rate: number} objects',
        get() {
          const rawValue = this.getDataValue('maturity_points');
          if (typeof rawValue === 'string') {
            try {
              return JSON.parse(rawValue);
            } catch (e) {
              console.error('Error parsing maturity_points JSON:', e);
              return [];
            }
          }
          return rawValue || [];
        },
        set(value) {
          if (typeof value === 'string') {
            try {
              this.setDataValue('maturity_points', JSON.parse(value));
            } catch (e) {
              console.error('Error parsing maturity_points JSON on set:', e);
              this.setDataValue('maturity_points', []);
            }
          } else {
            this.setDataValue('maturity_points', value);
          }
        }
      },
      interpolation_method: {
        type: Sequelize.ENUM('LINEAR', 'CUBIC_SPLINE', 'NELSON_SIEGEL'),
        allowNull: false,
        defaultValue: 'LINEAR',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true, // Temporarily allow null for debugging
      },
    },
    {
      tableName: 'yield_curves',
      underscored: true,
      timestamps: true,
    }
  );

  return YieldCurve;
};