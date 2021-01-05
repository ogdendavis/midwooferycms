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

  byId: (req, res, next) => {
    // For breeders, strip out some data related to user auth before returning
    const retObj =
      req.assetInfo.noun === 'breeder'
        ? utils.sanitizeBreederObj(req.asset.dataValues)
        : { ...req.asset.dataValues };
    return res.send(retObj);
  },

  associated: async (req, res, next) => {
    // targetNoun will be either breeder, litters, dogs, or pups
    const targetNoun = req.url.split('/').pop();
    const targetAsset =
      targetNoun === 'breeder'
        ? await req.asset.getBreeder().catch(next)
        : targetNoun === 'dogs'
        ? await req.asset.getDogs().catch(next)
        : targetNoun === 'litters'
        ? await req.asset.getLitters().catch(next)
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
          `(Status code ${res.statusCode}) No ${targetNoun} listed for ${req.assetInfo.noun} ${req.asset.id}`
        );
    }
    // If we get here, make sure the asset is good, and sanitize if breeder
    const retObj =
      targetNoun === 'breeder'
        ? utils.sanitizeBreederObj(targetAsset)
        : targetAsset;

    // Order return objects: dogs by name, litters by ???
    if (targetNoun === 'dogs') {
      retObj.sort((a, b) => (a.name < b.name ? -1 : 1));
    }
    // TODO order litters

    return targetAsset
      ? res.send(retObj)
      : res
          .status(404)
          .send(
            `(Status code ${res.statusCode}) No ${targetNoun} listed for this ${req.asset.noun}`
          );
  },
};

export default get;
