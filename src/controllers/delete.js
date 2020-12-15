import utils from './utils';

const del = {
  deleteOne: async (req, res, next) => {
    const info = req.assetInfo;
    const asset = req.asset;

    // Only superuser can delete breeders
    if (info.noun === 'breeder' && req.user.superuser !== true) {
      return res.status(403).send('Cannot delete breeder');
    }

    // Hold info of other items that were deleted
    const deletedAssociations = {};
    // Handle side effects of deleted assets
    // If deleting a dog, remove it from the litter
    if (info.noun === 'dog' && asset.litterId !== '') {
      const litter = await req.context.models.Litter.findByPk(asset.litterId);
      // litterId should be validated elsewhere, so assume it's good
      await litter
        .update({ pups: litter.pups.filter((p) => p !== asset.id) })
        .catch(next);
    }
    // If deleting a litter with pups, remove litterId from those dogs
    else if (info.noun === 'litter' && asset.pups.length > 0) {
      await req.context.models.Dog.update(
        { litterId: '' },
        { where: { id: asset.pups } }
      ).catch(next);
    }
    // If deleting a breeder, delete associated dogs and litters
    else if (info.noun === 'breeder') {
      [
        deletedAssociations.dogs,
        deletedAssociations.litters,
      ] = await asyncDeleteBreederAssociations(asset, req).catch(next);
    }

    // By the time we get here, all side effects should have been handled
    await asset.destroy().catch(next);
    // Will return different values based on noun of deleted asset
    const retObj =
      info.noun === 'breeder'
        ? {
            breeder: utils.sanitizeBreederObj(asset),
            dogs: deletedAssociations.dogs,
            litters: deletedAssociations.litters,
          }
        : asset;
    return res.send(retObj);
  },
};

const asyncDeleteBreederAssociations = async (breeder, req) => {
  // Deletes dogs and litters, returns deleted
  const byeDogs = await breeder.getDogs();
  if (byeDogs.length > 0) {
    req.context.models.Dog.destroy({
      where: { id: byeDogs.map((d) => d.id) },
    });
  }

  const byeLitters = await breeder.getLitters();
  if (byeLitters.length > 0) {
    req.context.models.Litter.destroy({
      where: { id: byeLitters.map((l) => l.id) },
    });
  }

  return [byeDogs, byeLitters];
};

export default del;
