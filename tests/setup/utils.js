import { breeders, litters, dogs } from './data';

const utils = {
  randomFromArray(ar) {
    return ar[Math.floor(Math.random() * ar.length)];
  },
  dataize(o) {
    return {
      ...o,
      createdAt: expect.anything(),
      updatedAt: expect.anything(),
      deletedAt: expect.notUndefined(),
    };
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

  randomLitter(args = { hasPups: null }) {
    if (args.hasPups) {
      let testId = this.randomDog().litterId;
      // If dog has no litter listed, litterId will be empty string
      while (testId === '') {
        testId = this.randomDog().litterId;
      }
      const litter = litters.filter((l) => l.id === testId)[0];
      return this.dataize(litter);
    }
    if (args.hasPups === false) {
      return this.dataize(
        this.randomFromArray(litters.filter((l) => l.pups.length === 0))
      );
    }
    return this.dataize(this.randomFromArray(litters));
  },
  allLitters(args = { breederId: false }) {
    if (args.breederId) {
      return litters
        .filter((l) => l.breederId === args.breederId)
        .map((fl) => this.dataize(fl));
    }
    return litters.map((l) => this.dataize(l));
  },

  randomDog(args = { sex: false }) {
    if (args.sex) {
      return this.randomFromArray(dogs.filter((d) => d.sex === args.sex));
    }
    return this.dataize(this.randomFromArray(dogs));
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
