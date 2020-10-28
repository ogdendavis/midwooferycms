const dog = (sequelize, DataTypes) => {
  const Dog = sequelize.define('dog', {
    id: {
      primaryKey: true,
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  });

  return Dog;
};

export default dog;
