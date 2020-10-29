const breeder = (sequelize, DataTypes) => {
  const Breeder = sequelize.define('breeder', {
    id: {
      primaryKey: true,
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return Breeder;
};

export default breeder;
