import utils from './utils';

const put = {
  update: async (req, res, next) => {
    const info = utils.getAssetInfo(req);
    const asset = await info.model.findByPk(info.id);
    // Make sure asset exists to be updated
    if (!asset) {
      return res
        .status(404)
        .send(`(Status code 404) No ${info.noun} with ID ${info.id}`);
    }
    // Surface asset.dataVales for easy use
    const assetValues = asset.dataValues;
    // Sort updates sent into valid and invalid
    const [badKeys, goodKeys] = [[], []];
    for (const key in req.body) {
      if (key === 'id' || !assetValues.hasOwnProperty(key)) {
        badKeys.push(key);
      } else {
        goodKeys.push(key);
      }
    }
    // If invalid updates are passed, reject entire request
    if (badKeys.length > 0) {
      return res
        .status(400)
        .send(
          `(Status code 400) Attempted to update inalid fields: ${badKeys.join(
            ', '
          )}`
        );
    }
    // If a breederId is provided to update, make sure the new value is good
    if (
      req.body.hasOwnProperty('breederId') &&
      !(await utils
        .asyncDoesAssetExist(req.body.breederId, req.context.models.Breeder)
        .catch(next))
    ) {
      return res
        .status(400)
        .send(
          `(Status code 400) Can't update breederId: No breeder with ID ${req.body.breederId}`
        );
    }
    // If a litterId is provided to update, try to make the update!
    if (req.body.hasOwnProperty('litterId')) {
      const updateSuccess = await asyncUpdateLitters(req, assetValues).catch(
        next
      );
      // Only failure case is if the litterId provided isn't valid
      if (!updateSuccess) {
        return res
          .status(400)
          .send(
            `(Status code 400) Can't update litterId: No litter with ID ${req.body.breederId}`
          );
      }
    }
    // If we get here, we can attempt the update
    // Catch function saves error object as updatedAsset
    const updatedAsset = await info.model
      .update(req.body, {
        where: { id: info.id },
        returning: true,
      })
      .catch((er) => er);
    // Handle errors from sequelize -- probably due to data validation
    if (updatedAsset.hasOwnProperty('errors')) {
      console.log(updatedAsset.errors[0].message);
      return res.status(400).send(updatedAsset.errors[0].message);
    } else {
      // Pull out updated asset from Sequelize's return, and return it to user
      return res.send({ updated: goodKeys, result: updatedAsset[1][0] });
    }
  },
};

const asyncUpdateLitters = async (req, dog) => {
  // Takes a req and an asset (must be a dog, if litterId is being updated), and returns boolean for whether or not update succeeded
  // Remove from old litter first
  const oldLitter = await req.context.models.Litter.findByPk(dog.litterId);
  if (oldLitter) {
    await oldLitter.update({
      pups: oldLitter.pups.filter((p) => p !== dog.id),
    });
  }
  // If the dog is being reassigned to a new litter, update that
  if (req.body.litterId !== '') {
    const newLitter = await req.context.models.Litter.findByPk(
      req.body.litterId
    );
    // Reject the update if new litterId isn't valid
    if (!newLitter) {
      return false;
    }
    // Add the dog's id to the new litter's pups array
    await newLitter.update({ pups: newLitter.pups.concat([dog.id]) });
  }
  return true;
};

export default put;
