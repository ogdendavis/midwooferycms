import utils from './utils';

const get = {
  all: async (req, res, next) => {
    // Just return a count of how many of that noun we have, for now
    const info = utils.getAssetInfo(req);
    const count = await info.model.count().catch(next);
    return res.send({
      noun: info.noun,
      count,
    });
  },

  byId: async (req, res, next) => {
    // Get asset noun, id, and associated model
    const info = utils.getAssetInfo(req);
    // Grab and return the asset
    const asset = await info.model.findByPk(info.id).catch(next);
    if (asset) {
      return res.send(asset);
    }
    // Send error if asset not found
    return res
      .status(404)
      .send(`(Status code 404) No ${info.noun} with ID ${info.id}`);
  },

  associated: async (req, res, next) => {
    const info = utils.getAssetInfo(req);
    const asset = await info.model.findByPk(info.id).catch(next);
    if (asset) {
      // targetNoun will be either breeder, litters, dogs, or pups
      const targetNoun = req.url.split('/').pop();
      const targetAsset =
        targetNoun === 'breeder'
          ? await asset.getBreeder().catch(next)
          : targetNoun === 'dogs'
          ? await asset.getDogs().catch(next)
          : targetNoun === 'litters'
          ? await asset.getLitters().catch(next)
          : targetNoun === 'pups'
          ? await req.context.models.Dog.findAll({
              where: { litterId: req.params.litterId },
            }).catch(next)
          : false;
      // If targetNoun is plural, check to make sure the returned list isn't empty
      if (targetNoun.slice(-1) === 's' && targetAsset.length === 0) {
        return res
          .status(204)
          .send(
            `(Status code ${res.statusCode}) No ${targetNoun} listed for ${info.noun} ${asset.id}`
          );
      }
      // If we get here, make sure the asset is truthy, and return it!
      return targetAsset
        ? res.send(targetAsset)
        : res
            .status(404)
            .send(
              `(Status code ${res.statusCode}) No ${targetNoun} listed for this ${asset.noun}`
            );
    }
    return res
      .status(404)
      .send(`(Status code 404) No ${info.noun} with ID ${info.id}`);
  },
};

export default get;
