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
