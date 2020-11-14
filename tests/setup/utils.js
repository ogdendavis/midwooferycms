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
  randomBreeder(args = { hasDogs: false }) {
    if (args.hasDogs) {
      const breederId = this.randomDog().breederId;
      const breeder = breeders.filter((b) => b.id === breederId)[0];
      return this.dataize(breeder);
    }
    return this.dataize(this.randomFromArray(breeders));
  },
  allBreeders() {
    return breeders.map((b) => this.dataize(b));
  },
  randomLitter(args = { hasPups: false }) {
    if (args.hasPups) {
      let testId = this.randomDog().litterId;
      // If dog has no litter listed, litterId will be empty string
      while (testId === '') {
        testId = this.randomDog().litterId;
      }
      const litter = litters.filter((l) => l.id === testId)[0];
      return this.dataize(litter);
    }
    return this.dataize(this.randomFromArray(litters));
  },
  allLitters() {
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
