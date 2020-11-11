const breeder = (sequelize, DataTypes) => {
  const Breeder = sequelize.define(
    'breeder',
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
        defaultValue: '',
      },
    },
    {
      paranoid: true,
    }
  );

  Breeder.associate = (models) => {
    Breeder.hasMany(models.Dog);
  };

  return Breeder;
};

export default breeder;
