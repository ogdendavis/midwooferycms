import utils from './utils';
import { v4 as uuidv4 } from 'uuid';

const post = {
  create: async (req, res, next) => {
    const info = utils.getAssetInfo(req);
    // Check for required args first
    const missingArgs = isMissingRequiredArgs(req, info.noun);
    if (missingArgs) {
      return res
        .status(400)
        .send(
          `(Status code ${res.statusCode}) ${
            info.noun
          } not created. Missing required field(s): ${missingArgs.join(' ')}`
        );
    }
    // If ID is provided in request, make sure it's unique
    if (
      req.body.hasOwnProperty('id') &&
      (await utils.asyncDoesAssetExist(req.body.id, info.model))
    ) {
      return res
        .status(400)
        .send(
          `(Status code ${res.statusCode}) A ${info.noun} already exists with id ${req.body.id}`
        );
    }
    // Check that associated IDs provided are valid
    if (
      req.body.hasOwnProperty('breederId') &&
      !(await utils.asyncDoesAssetExist(
        req.body.breederId,
        req.context.models.Breeder
      ))
    ) {
      return res
        .status(400)
        .send(
          `(Status code ${res.statusCode}) Invalid breederId: ${req.body.breederId}`
        );
    }
    if (
      req.body.hasOwnProperty('dam') &&
      req.body.dam.hasOwnProperty('id') &&
      !(await utils.asyncDoesAssetExist(
        req.body.dam.id,
        req.context.models.Dog
      ))
    ) {
      return res
        .status(400)
        .send(
          `(Status code ${res.statusCode}) Litter not created. Invalid dam id: No dog found with ID ${req.body.dam.id}`
        );
    }

    /*
     *
     * NEED TO ADD MORE CHECKS FOR LITTER CREATION: DAM & PUPS
     *
     *
     */

    // If we've gotten this far, should be able to make the thing!
    const id = req.body.id || uuidv4();
    const newAsset = await info.model
      .create({
        ...req.body,
        id,
      })
      .catch(next);
    return res.status(201).send(newAsset);
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
    breeder: ['firstname', 'lastname'],
    litter: ['dam', 'breederId'],
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

export default post;
