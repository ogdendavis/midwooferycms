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
        validate: {
          isInt: true,
          min: 0,
        },
      },
      dam: {
        type: DataTypes.JSON,
        defaultValue: '{}',
        validate: {
          isParentObject(value) {
            if (!value.hasOwnProperty('name') && !value.hasOwnProperty('id')) {
              throw new Error(
                'Validation isParentObject on dam failed: dam must be object with either name or valid dog id'
              );
            }
          },
          hasValidName(value) {
            if (
              value.hasOwnProperty('name') &&
              (!isNaN(value.name) || value.name.length < 2)
            ) {
              throw new Error(
                'Validation hasValidName on dam failed: dam name must be at least two characters an non-numeric'
              );
            }
          },
        },
      },
      sire: {
        type: DataTypes.JSON,
        validate: {
          isParentObject(value) {
            if (!value.hasOwnProperty('name') && !value.hasOwnProperty('id')) {
              throw new Error(
                'Validation isParentObject on sire failed: sire must be object with either name or valid dog id'
              );
            }
          },
          hasValidName(value) {
            if (
              value.hasOwnProperty('name') &&
              (!isNaN(value.name) || value.name.length < 2)
            ) {
              throw new Error(
                'Validation hasValidName on sire failed: sire name must be at least two characters an non-numeric'
              );
            }
          },
        },
      },
      pups: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        validate: {
          isArray(value) {
            if (!Array.isArray(value)) {
              throw new Error('Validation isArray on pups failed');
            }
          },
        },
      },
    },
    {
      paranoid: true,
    }
  );

  Litter.associate = (models) => {
    Litter.belongsTo(models.Breeder);
    Litter.hasMany(models.Image);
  };

  return Litter;
};

export default litter;
