// For writing files
import appPath from 'app-root-path';

const utils = {
  asyncDoesAssetExist: async (id, model) => {
    const asset = await model.findByPk(id);
    return asset ? true : false;
  },

  asyncIsBreederEmailUnique: async (req) => {
    const existingBreeder = await req.context.models.Breeder.findOne({
      where: { email: req.body.email },
    });
    return existingBreeder ? false : true;
  },

  capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  },

  getAssetInfo(req) {
    // Pulls info from the request for use in processing
    // 'dog', 'breeder', or 'litter'
    const noun = this.getNoun(req.baseUrl);
    // actual id of the asset
    const id = req.params[`${noun}Id`];
    // model associated with the asset
    const model = req.context.models[this.capitalize(noun)];
    return {
      noun,
      id,
      model,
    };
  },

  getNoun(baseUrl) {
    // Take the baseUrl of a req object and return the singular noun
    // e.g. baseUrl of request is '/dogs', noun is 'dog'
    const sliced = baseUrl.slice(1, -1);
    // Account for special case of /assets baseUrl for image noun
    return sliced === 'asset' ? 'image' : sliced;
  },

  isPasswordValid(pw) {
    return pw.length > 4 && pw.length < 31;
  },

  sanitizeBreederObj(bo) {
    // Early return if we get undefined or empty object
    if (!bo) {
      return bo;
    }
    const retObj = bo.hasOwnProperty('dataValues')
      ? { ...bo.dataValues }
      : { ...bo };
    // If not superuser, remove that property
    if (retObj.hasOwnProperty('superuser') && retObj.superuser !== true) {
      delete retObj.superuser;
    }
    // Remove password and salt
    delete retObj.password;
    delete retObj.salt;
    return retObj;
  },

  saveImage({ image, breederId }) {
    try {
      // Save image in breeder folder in assets -- will create folder if doesn't exist
      const imagePath = `assets/uploads/${breederId}/${image.name}`;
      image.mv(`${appPath.path}/${imagePath}`);
      return imagePath;
    } catch {
      return false;
    }
  },
};

export default utils;
