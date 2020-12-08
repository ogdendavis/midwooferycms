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
    return baseUrl.slice(1, -1);
  },
};

export default utils;
