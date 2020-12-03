const utils = {
  getAssetInfo(req) {
    // Pulls info from the request for use in processing
    // 'dog', 'breeder', or 'litter'
    const noun = this.getNoun(req.baseUrl);
    // actual id of the asset
    const id = req.params[`${noun}Id`];
    // model associated with the asset
    const model =
      req.context.models[noun.charAt(0).toUpperCase() + noun.slice(1)];
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
