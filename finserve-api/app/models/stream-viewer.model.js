module.exports = (sequelize, Sequelize) => {
  const StreamViewer = sequelize.define('stream_viewer', {
    viewer_id: {
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
    joined_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    left_at: {
      type: Sequelize.DATE
    },
    watch_duration_seconds: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: false,
    underscored: true,
    tableName: 'stream_viewers',
    indexes: [
      { fields: ['stream_id'] },
      { fields: ['user_id'] }
    ]
  });

  return StreamViewer;
};
