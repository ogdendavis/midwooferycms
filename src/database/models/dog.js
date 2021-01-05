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
      litterId: {
        type: DataTypes.STRING,
        defaultValue: '',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      sex: {
        type: DataTypes.STRING,
        defaultValue: '',
        validate: {
          isIn: [['m', 'f', '']],
        },
      },
      weight: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      primaryImage: {
        type: DataTypes.STRING, // path to dog profile image on server
      },
    },
    {
      paranoid: true,
    }
  );

  Dog.associate = (models) => {
    Dog.belongsTo(models.Breeder);
    Dog.hasMany(models.Image);
  };

  return Dog;
};

export default dog;
