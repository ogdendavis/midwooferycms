import utils from './utils';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const post = {
  create: async (req, res, next) => {
    const info = utils.getAssetInfo(req);
    // Check for required args first
    const missingArgs = isMissingRequiredArgs(req, info.noun);
    if (missingArgs) {
      return res
        .status(400)
        .send(
          `(Status code 400) ${
            info.noun
          } not created. Missing required field(s): ${missingArgs.join(' ')}`
        );
    }
    // If ID is provided in request, make sure it's unique
    if (
      req.body.hasOwnProperty('id') &&
      (await utils.asyncDoesAssetExist(req.body.id, info.model).catch(next))
    ) {
      return res
        .status(400)
        .send(
          `(Status code 400) A ${info.noun} already exists with id ${req.body.id}`
        );
    }
    // Create the new asset's ID before checks, since we might need it to update associated items in the database
    const assetId = req.body.id || uuidv4();
    // Check that breederId provided is valid for litter & dog creation
    if (
      ['litter', 'dog'].includes(info.noun) &&
      !(await asyncIsBreederIdValid(req).catch(next))
    ) {
      return res
        .status(400)
        .send(`(Status code 400) Invalid breederId: ${req.body.breederId}`);
    }
    // Check that dam & pup info are correct for litter creation
    if (info.noun === 'litter') {
      // damCheck returns an object with keys isValid, errorCode, and errorMessage
      const damCheck = await asyncIsDamValid(req).catch(next);
      if (!damCheck.isValid) {
        return res.status(damCheck.errorCode).send(damCheck.errorMessage);
      }
      // pupCheck has same structure as damCheck, plus added hasPups property to indicate if there are pups in the request that need to be updated with their new litterId, and pups property with array of Dog objects pulled from pups in asyncIsPupsValid
      const pupCheck = await asyncIsPupsValid(req).catch(next);
      if (!pupCheck.isValid) {
        return res.status(pupCheck.errorCode).send(pupCheck.errorMessage);
      }
      // If pupCheck passes and we have pups, we need to update them with the new litter ID manually
      if (pupCheck.isValid && pupCheck.hasPups) {
        await asyncUpdatePups(assetId, pupCheck.pups).catch(next);
      }
    }
    // For breeder creation, check that email provided is unique and password is right length
    if (info.noun === 'breeder') {
      if (!(await utils.asyncIsBreederEmailUnique(req))) {
        return res.status(400).send('Breeder email must be unique');
      }
      if (!utils.isPasswordValid(req.body.password)) {
        return res
          .status(400)
          .send('Invalid password: must be between 5-30 characters');
      }
    }
    // For dog creation, insert a default image as primaryImage if none is provided
    if (info.noun === 'dog') {
      // Check if primaryImage exists, or if it's a blank string
      if (
        !req.body.hasOwnProperty('primaryImage') ||
        req.body.primaryImage === ''
      ) {
        // Get list of files in default dog image folder. Path is relative from project root
        const defaultImageFolder = '/assets/defaultImages/dogs';
        const imageOptions = fs.readdirSync(`.${defaultImageFolder}`);
        // Select random file from the options, build path to it
        const fileName =
          imageOptions[Math.floor(Math.random() * imageOptions.length)];
        const fullPath = `${defaultImageFolder}/${fileName}`;
        // Save the path in the req body, to be used for asset creation
        req.body.primaryImage = fullPath;
      }
    }

    // If we've gotten this far, should be able to make the thing!
    const newAsset = await info.model
      .create({
        ...req.body,
        id: assetId,
      })
      .catch(next);
    const retObj =
      info.noun === 'breeder' ? utils.sanitizeBreederObj(newAsset) : newAsset;
    return res.status(201).send(retObj);
  },

  restore: async (req, res, next) => {
    const info = req.assetInfo;
    const assetInDB = req.asset;

    // Check if the thing has been deleted!
    if (assetInDB.deletedAt === null) {
      return res
        .status(405)
        .send(
          `(Status code 405) ${utils.capitalize(info.noun)} with ID ${
            info.id
          } is already active`
        );
    }

    // Now try to restore the asset
    await assetInDB.restore().catch(next);
    // And its associations
    const associatedRestored = await asyncRestoreAssociations(
      info.noun,
      req.context.models,
      assetInDB.dataValues
    ).catch(next);

    // When restoring, return value from Sequelize will include password and salt. Get rid of them!
    let returnAsset = { ...assetInDB.dataValues };
    if (returnAsset.hasOwnProperty('password')) {
      delete returnAsset.password;
    }
    if (returnAsset.hasOwnProperty('salt')) {
      delete returnAsset.salt;
    }

    // Construct the return object -- will vary by noun restored
    const retObj =
      info.noun === 'breeder'
        ? {
            breeder: utils.sanitizeBreederObj(returnAsset),
            dogs: associatedRestored.dogs,
            litters: associatedRestored.litters,
          }
        : returnAsset;

    return res.status(201).send(retObj);
  },
};

/*
 * HELPER FUNCTIONS
 * These are only used in POST requests, so they're here instead of in utils
 */

// Checks for required fields
const isMissingRequiredArgs = (req, noun) => {
  // Dictionary of required arguments to create asset types
  const argDict = {
    dog: ['name', 'breederId'],
    breeder: ['firstname', 'lastname', 'password', 'email'],
    litter: ['breederId', 'dam'],
  };
  // Check dictionary entry and make sure all required arguments are in req
  const missing = [];
  for (const arg of argDict[noun]) {
    if (!req.body.hasOwnProperty(arg)) {
      missing.push(arg);
    }
  }
  return missing.length > 0 ? missing : false;
};

// Checks breederId is valid, if provided
const asyncIsBreederIdValid = async (req) => {
  return (await utils.asyncDoesAssetExist(
    req.body.breederId,
    req.context.models.Breeder
  ))
    ? true
    : false;
};

// Check that dam info for litter creation is valid
const asyncIsDamValid = async (req) => {
  // Check that dam id is valid, if provided
  if (req.body.dam.hasOwnProperty('id')) {
    // Try to pull dam from database using given ID
    const damInDB = await req.context.models.Dog.findByPk(req.body.dam.id);
    if (!damInDB) {
      return {
        isValid: false,
        errorCode: 400,
        errorMessage: `(Status code 400) Litter not created. Invalid dam id: No dog found with ID ${req.body.dam.id}`,
      };
    } else if (damInDB.sex === 'm') {
      return {
        isValid: false,
        errorCode: 400,
        errorMessage: `(Status code 400) Litter not created. Dog with ID ${req.body.dam.id} is male, so cannot be dam of litter`,
      };
    }
  } else {
    // If ID is not provided, damn object must have a name
    if (
      !req.body.dam.name ||
      typeof req.body.dam.name !== 'string' ||
      req.body.dam.name.length < 2
    ) {
      return {
        isValid: false,
        errorCode: 400,
        errorMessage: `(Status code 400) Litter not created. Please provide valid dam information. Dam information should be an object containing at least one of a valid dog id or the name of a dog`,
      };
    }
  }
  // If we get here, dam is valid!
  return {
    isValid: true,
  };
};

const asyncIsPupsValid = async (req) => {
  // If no pups provided, nothing to check, so we're good!
  if (!req.body.hasOwnProperty('pups') || req.body.pups.length === 0) {
    return {
      isValid: true,
      hasPups: false,
    };
  }
  // Array to hold pups fetched from database -- used by asyncUpdatePups to update the dogs, if the pups provided in the req pass all tests
  const pupsInDB = [];
  // If we have pups, check them!
  for (const pupId of req.body.pups) {
    const pup = await req.context.models.Dog.findByPk(pupId);
    // Only returns first invalid ID, but I'm ok with that for now
    if (!pup) {
      return {
        isValid: false,
        errorCode: 400,
        errorMessage: `(Status code 400) Litter not created. Invalid Dog ID ${pupId} in pups array`,
      };
    }
    if (pup.litterId !== '') {
      // Assume litterId is valid, as we have checks for that elsewhere
      return {
        isValid: false,
        errorCode: 400,
        errorMessage: `(Status code 400) Litter not created. Dog with ID ${pupId} already belongs to another litter`,
      };
    }
    // If we get here, the pup is valid, so we save it to update with litterId later
    pupsInDB.push(pup);
  }
  // If we get here, we have valid pups to update with their new litterId
  return {
    isValid: true,
    hasPups: true,
    pups: pupsInDB,
  };
};

const asyncUpdatePups = async (litterId, pups) => {
  // This is only called if pups exists and has valid entries
  // Is passed the litterId and an array of dog objects already pulled during pup check in asyncIsPupsValid
  for (const pup of pups) {
    await pup.update({ litterId });
  }
  return true;
};

// Manually restore associated data when an asset is restored from deletion
const asyncRestoreAssociations = async (noun, models, asset) => {
  // Just do cases for each noun
  // If it's a dog with a litterId, we re-add it to the litter's pups list
  if (noun === 'dog' && asset.litterId !== '') {
    const litter = await models.Litter.findByPk(asset.litterId);
    await litter.update({ pups: litter.pups.concat([asset.id]) });
    return true;
  }
  // If breeder, restore dogs and litters that were deleted when breeder was deleted
  else if (noun === 'breeder') {
    const dogs = await models.Dog.findAll({
      where: { breederId: asset.id },
      paranoid: false,
    });
    for (const d of dogs) {
      await d.restore();
    }
    const litters = await models.Litter.findAll({
      where: { breederId: asset.id },
      paranoid: false,
    });
    for (const l of litters) {
      await l.restore();
    }
    return { dogs, litters };
  }
  // If litter, add litterId back to pups
  else if (noun === 'litter') {
    if (asset.pups.length > 0) {
      await models.Dog.update(
        { litterId: asset.id },
        { where: { id: asset.pups } }
      );
    }
    return true;
  }
  return false;
};

export default post;
