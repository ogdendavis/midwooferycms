import { breeders, dogs } from './data';

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
  randomBreeder() {
    return this.dataize(this.randomFromArray(breeders));
  },
  randomBreederWithDogs() {
    const breederId = this.randomDog().breederId;
    const breeder = breeders.filter((b) => b.id === breederId)[0];
    return this.dataize(breeder);
  },
  allBreeders() {
    return breeders.map((b) => this.dataize(b));
  },
  randomDog() {
    return this.dataize(this.randomFromArray(dogs));
  },
  allDogs() {
    return dogs.map((d) => this.dataize(d));
  },
  allDogsFromBreeder(bid) {
    return dogs
      .filter((d) => d.breederId === bid)
      .map((bd) => this.dataize(bd));
  },
};

export default utils;
