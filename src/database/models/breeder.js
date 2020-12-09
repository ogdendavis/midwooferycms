import crypto from 'crypto';

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
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        get() {
          return () => this.getDataValue('password');
        },
        set(val) {
          const salt = crypto.randomBytes(16).toString('base64');
          const pw = crypto
            .createHash('RSA-SHA256')
            .update(val)
            .update(salt)
            .digest('hex');
          this.setDataValue('salt', salt);
          this.setDataValue('password', pw);
        },
      },
      salt: {
        type: DataTypes.STRING,
        get() {
          return () => this.getDataValue('salt');
        },
      },
    },
    {
      paranoid: true,
      instanceMethods: {
        passwordCheck: function (pw) {
          return 'hello';
        },
      },
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
