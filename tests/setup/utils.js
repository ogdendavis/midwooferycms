import { breeders, superuser, litters, dogs } from './data';
import createTokens from './tokens';

const utils = {
  randomFromArray(ar) {
    return ar[Math.floor(Math.random() * ar.length)];
  },
  dataize(ob) {
    // Remove password & salt from object, if sent -- return object from Sequelize won't have them!
    const o = { ...ob };
    if (o.hasOwnProperty('password')) {
      delete o.password;
    }
    if (o.hasOwnProperty('salt')) {
      delete o.salt;
    }
    return {
      ...o,
      createdAt: expect.anything(),
      updatedAt: expect.anything(),
      deletedAt: expect.notUndefined(),
    };
  },

  superuser() {
    return superuser;
  },

  randomBreeder(args = { hasDogs: null, hasLitters: null }) {
    // Start with all breeders -- dataized!
    let pool = this.allBreeders();
    // Filter pool if hasDogs has been passed
    if (args.hasOwnProperty('hasDogs') && args.hasDogs !== null) {
      const idsWithDogs = [
        ...new Set(
          this.allDogs()
            .map((d) => d.breederId)
            .filter((i) => {
              return i.length > 0;
            })
        ),
      ];
      const breedersWithDogs = pool.filter((b) => idsWithDogs.includes(b.id));
      const breedersWithoutDogs = pool.filter(
        (b) => !idsWithDogs.includes(b.id)
      );
      pool = args.hasDogs ? breedersWithDogs : breedersWithoutDogs;
    }
    // Filter pool if hasLitters has been passed
    if (args.hasOwnProperty('hasLitters') && args.hasLitters !== null) {
      const idsWithLitters = [
        ...new Set(
          this.allLitters()
            .map((l) => l.breederId)
            .filter((i) => i.length > 0)
        ),
      ];
      const breedersWithLitters = pool.filter((b) =>
        idsWithLitters.includes(b.id)
      );
      const breedersWithoutLitters = pool.filter(
        (b) => !idsWithLitters.includes(b.id)
      );
      pool = args.hasLitters ? breedersWithLitters : breedersWithoutLitters;
    }
    return this.randomFromArray(pool);
  },
  allBreeders() {
    return breeders.map((b) => this.dataize(b));
  },
  getBreeder(id) {
    return this.dataize(breeders.find((b) => b.id === id));
  },
  getPassword(breederId) {
    return breeders.find((b) => b.id === breederId).password;
  },
  getToken(breederId) {
    return this.tokens[breederId] ? this.tokens[breederId] : false;
  },
  tokens: createTokens(),

  randomLitter(args = { hasPups: null, pupId: null }) {
    let pool = this.allLitters();
    if (args.hasOwnProperty('hasPups') && args.hasPups !== null) {
      const idsWithPups = [
        ...new Set(
          this.allDogs()
            .map((d) => d.litterId)
            .filter((i) => i.length > 0)
        ),
      ];
      const littersWithPups = pool.filter((l) => idsWithPups.includes(l.id));
      const littersWithoutPups = pool.filter(
        (l) => !idsWithPups.includes(l.id)
      );
      pool = args.hasPups ? littersWithPups : littersWithoutPups;
    }
    if (args.hasOwnProperty('pupId') && args.pupId !== null) {
      // We're only looking for one litter, because dogs can only be born to one litter
      pool = pool.filter((l) => l.pups.includes(args.pupId));
    }
    return this.randomFromArray(pool);
  },
  allLitters(args = { breederId: null }) {
    if (args.hasOwnProperty('breederId') && args.breederId !== null) {
      return litters
        .filter((l) => l.breederId === args.breederId)
        .map((fl) => this.dataize(fl));
    }
    return litters.map((l) => this.dataize(l));
  },

  randomDog(args = { sex: null, fromLitter: null }) {
    let pool = this.allDogs();
    if (args.hasOwnProperty('sex') && args.sex !== null) {
      pool = pool.filter((d) => d.sex === args.sex);
    }
    if (args.hasOwnProperty('fromLitter') && args.fromLitter !== null) {
      const idsFromLitter = [
        ...new Set(
          this.allLitters()
            .map((l) => l.pups)
            .flat()
        ),
      ];
      const dogsFromLitter = pool.filter((d) => idsFromLitter.includes(d.id));
      const dogsNotFromLitter = pool.filter(
        (d) => !idsFromLitter.includes(d.id)
      );
      pool = args.fromLitter ? dogsFromLitter : dogsNotFromLitter;
    }
    return this.randomFromArray(pool);
  },
  allDogs(args = { breederId: false }) {
    if (args.breederId) {
      return dogs
        .filter((d) => d.breederId === args.breederId)
        .map((bd) => this.dataize(bd));
    }
    return dogs.map((d) => this.dataize(d));
  },
};

export default utils;
