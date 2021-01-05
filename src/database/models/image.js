const image = (sequelize, DataTypes) => {
  const Image = sequelize.define('image', {
    id: {
      primaryKey: true,
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    type: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    alt: {
      type: DataTypes.STRING,
    },
    path: {
      type: DataTypes.STRING, // to where image is stored on server
    },
  });

  // Just associate with dog, for now.
  // TODO add litter association
  Image.associate = (models) => {
    Image.belongsTo(models.Dog);
  };

  return Image;
};

export default image;
