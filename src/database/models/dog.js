const dog = (sequelize, DataTypes) => {
  const Dog = sequelize.define(
    'dog',
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
      breed: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      color: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      weight: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      paranoid: true,
    }
  );

  Dog.associate = (models) => {
    Dog.belongsTo(models.Breeder);
    Dog.belongsTo(models.Litter);
  };

  return Dog;
};

export default dog;
