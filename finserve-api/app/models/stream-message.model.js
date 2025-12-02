module.exports = (sequelize, Sequelize) => {
  const StreamMessage = sequelize.define('stream_message', {
    message_id: {
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
    user_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    username: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    message_type: {
      type: Sequelize.ENUM('TEXT', 'EMOJI', 'TIP', 'ALERT'),
      defaultValue: 'TEXT'
    },
    tip_amount: {
      type: Sequelize.DECIMAL(10, 2)
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'stream_messages',
    indexes: [
      { fields: ['stream_id'] },
      { fields: ['created_at'] }
    ]
  });

  return StreamMessage;
};
