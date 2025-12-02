module.exports = (sequelize, Sequelize) => {
  const Stream = sequelize.define('stream', {
    stream_id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    streamer_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT
    },
    thumbnail_url: {
      type: Sequelize.STRING(500)
    },
    status: {
      type: Sequelize.ENUM('LIVE', 'ENDED', 'SCHEDULED'),
      defaultValue: 'LIVE'
    },
    viewer_count: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    peak_viewers: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    started_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    ended_at: {
      type: Sequelize.DATE
    },
    duration_seconds: {
      type: Sequelize.INTEGER
    },
    category: {
      type: Sequelize.STRING(100),
      defaultValue: 'trading'
    },
    is_recording: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    recording_url: {
      type: Sequelize.STRING(500)
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'streams',
    indexes: [
      { fields: ['streamer_id'] },
      { fields: ['status'] },
      { fields: ['started_at'] }
    ]
  });

  return Stream;
};
