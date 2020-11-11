const litter = (sequelize, DataTypes) => {
  const Litter = sequelize.define(
    'litter',
    {
      id: {
        primaryKey: true,
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      dam: {
        type: DataTypes.JSON,
        defaultValue: '{}',
      },
      sire: {
        type: DataTypes.JSON,
        defaultValue: '{}',
      },
      pups: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
    },
    {
      paranoid: true,
    }
  );

  Litter.associate = (models) => {
    Litter.belongsTo(models.Breeder);
  };

  return Litter;
};

export default litter;
