module.exports = (sequelize, Sequelize) => {
  const StreamTip = sequelize.define('stream_tip', {
    tip_id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    stream_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'streams',
        key: 'stream_id'
      },
      onDelete: 'CASCADE'
    },
    from_user_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    to_user_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING(3),
      defaultValue: 'USD'
    },
    message: {
      type: Sequelize.TEXT
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'stream_tips',
    indexes: [
      { fields: ['stream_id'] },
      { fields: ['to_user_id'] }
    ]
  });

  return StreamTip;
};
