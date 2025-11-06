module.exports = (sequelize, Sequelize) => {
  const GameRoom = sequelize.define(
    'game_rooms',
    {
      room_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      room_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      creator_id: {
        type: Sequelize.UUID,
      },
      participants: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      scenario: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      start_date: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('WAITING', 'ACTIVE', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'WAITING',
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
    },
    {
      tableName: 'game_rooms',
      underscored: true,
      timestamps: true,
    }
  );

  return GameRoom;
};
