import utils from './utils';

const put = {
  updateOne: async (req, res, next) => {
    const info = req.assetInfo;
    // Surface asset.dataVales for easy use
    const assetValues = req.asset.dataValues;
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
    // Breeder-only checks
    if (info.noun === 'breeder') {
      if (
        req.body.hasOwnProperty('password') &&
        !utils.isPasswordValid(req.body.password)
      ) {
        return res
          .status(400)
          .send('Invalid password: must be 5-30 characters long');
      }
      if (
        req.body.hasOwnProperty('email') &&
        !(await utils.asyncIsBreederEmailUnique(req))
      ) {
        return res.status(400).send('Breeder email must be unique');
      }
    }
    // Dog-only checks
    if (info.noun === 'dog') {
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
    }
    // Litter-only checks
    if (info.noun === 'litter') {
      // If sire id or dam id are provided, make sure they're valid!
      const parentCheck = await asyncCheckLitterParents(req);
      if (!parentCheck.isValid) {
        return res
          .status(400)
          .send(`(Status code 400) Bad ${parentCheck.error} info sent`);
      }
      // Finally, check pups array, if it's there!
      if (
        req.body.hasOwnProperty('pups') &&
        !(await asyncCheckLitterPups(req))
      ) {
        return res.status(400).send(`(Status code 400) Bad pups info sent`);
      }
    }
    // If a breederId is provided to update a dog or litter, make sure the new value is good
    // Also make sure that it's a superuser -- normal breeders shouldn't be able to reassign dogs/litters
    if (req.body.hasOwnProperty('breederId')) {
      if (
        !req.user.hasOwnProperty('superuser') ||
        req.user.superuser !== true
      ) {
        return res
          .status(403)
          .send(
            `(Status code 403) You don't have permission to change breederId`
          );
      } else if (
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
    }
    // If we get here, we can attempt the update -- only failures from here should be data validation from rules defined in database models
    return await info.model
      .update(req.body, {
        where: { id: info.id },
        returning: true,
      })
      .then((updatedAsset) => {
        return res.status(200).send({
          updated: goodKeys,
          result:
            info.noun === 'breeder'
              ? utils.sanitizeBreederObj(updatedAsset[1][0])
              : updatedAsset[1][0],
        });
      })
      .catch((err) => {
        next(err);
      });
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

const asyncCheckLitterParents = async (req) => {
  // Only called if we are processing a litter
  if (req.body.hasOwnProperty('dam')) {
    if (
      req.body.dam.hasOwnProperty('id') &&
      !(await utils.asyncDoesAssetExist(
        req.body.dam.id,
        req.context.models.Dog
      ))
    ) {
      return { isValid: false, error: 'dam id' };
    } else if (
      req.body.dam.hasOwnProperty('id') &&
      req.body.dam.hasOwnProperty('name')
    ) {
      const damInDB = await req.context.models.Dog.findByPk(req.body.dam.id);
      if (damInDB.name !== req.body.dam.name) {
        return { isValid: false, error: 'dam id or name' };
      }
    }
  }
  if (
    req.body.hasOwnProperty('sire') &&
    req.body.sire.hasOwnProperty('id') &&
    !(await utils.asyncDoesAssetExist(req.body.sire.id, req.context.models.Dog))
  ) {
    return { isValid: false, error: 'sire id' };
  }
  return { isValid: true };
};

const asyncCheckLitterPups = async (req) => {
  // Only called if req.body.pups exists
  if (Array.isArray(req.body.pups) && req.body.pups.length > 0) {
    for (const pup of req.body.pups) {
      if (!(await utils.asyncDoesAssetExist(pup, req.context.models.Dog))) {
        return false;
      }
    }
    return true;
  }
};

export default put;
