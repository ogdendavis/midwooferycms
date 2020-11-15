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
    // When getter functions are created under the hood, the default pluralization of litter is litter. In the context of litters of puppies, this is incorrect. Fix it so that the getter function is the logical getLitters instead of the confusing getLitter
    Breeder.hasMany(models.Litter, {
      as: { plural: 'Litters', singular: 'Litter' },
    });
  };

  return Breeder;
};

export default breeder;
