import { breeders, dogs } from './data';

const utils = {
  randomFromArray(ar) {
    return ar[Math.floor(Math.random() * ar.length)];
  },
  dataize(o) {
    return { ...o, createdAt: expect.anything(), updatedAt: expect.anything() };
  },
  randomDog() {
    return this.dataize(this.randomFromArray(dogs));
  },
  allDogs() {
    return dogs.map((d) => this.dataize(d));
  },
  randomBreeder() {
    return this.dataize(this.randomFromArray(breeders));
  },
  allBreeders() {
    return breeders.map((b) => this.dataize(b));
  },
};

export default utils;
