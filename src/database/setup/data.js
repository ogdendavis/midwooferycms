/*
 * Set up a starter database with a superuser and a test breeder
 */

import { v4 as uuidv4 } from 'uuid';

const superuser = {
  id: uuidv4(),
  firstname: 'Super',
  lastname: 'User',
  email: 'super@user.com',
  password: 'superuserpassword',
  superuser: true,
};

const breederId = uuidv4();

const breeder = {
  id: breederId,
  firstname: 'Test',
  lastname: 'Breeder',
  email: 'test@breeder.com',
  password: 'testbreederpassword',
};

const damId = uuidv4();
const sireId = uuidv4();
const pupId = uuidv4();

const dogs = [
  {
    id: damId,
    name: 'Test Dam',
    breed: 'testdog',
    sex: 'f',
    breederId,
  },
  {
    id: sireId,
    name: 'Test Sire',
    breed: 'testdog',
    sex: 'm',
    breederId,
  },
  {
    id: pupId,
    name: 'Test Puppy',
    breed: 'testdog',
    sex: 'f',
    breederId,
  },
];

const litter = {
  id: uuidv4(),
  dam: { id: damId },
  sire: { id: sireId },
  pups: [pupId],
};

export { superuser, breeder, dogs, litter };
