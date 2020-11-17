import utils from './setup/utils';

// Make sure utilities do what they ought to...
// Only partially built out, added to as I suspect functions are misbehaving
test('randomDog respects sex argument', () => {
  const male = utils.randomDog({ sex: 'm' });
  const female = utils.randomDog({ sex: 'f' });
  expect(male.sex).toEqual('m');
  expect(female.sex).toEqual('f');
});

test('randomDog respects fromLitter argument', () => {
  const noLitter = utils.randomDog({ fromLitter: false });
  const yesLitter = utils.randomDog({ fromLitter: true });
  const litters = utils.allLitters();
  const pups = [];
  for (const l of litters) {
    for (const p of l.pups) {
      pups.push(p);
    }
  }
  expect(pups).toContainEqual(yesLitter.id);
  expect(pups).not.toContainEqual(noLitter.id);
});

test('randomLitter respects hasPups argument', () => {
  const noPups = utils.randomLitter({ hasPups: false });
  const yesPups = utils.randomLitter({ hasPups: true });
  expect(noPups.pups).toEqual([]);
  expect(yesPups.pups.length).toBeGreaterThan(0);
});

test('randomLitter respects pupId argument', () => {
  const dog = utils.randomDog({ fromLitter: true });
  const litter = utils.randomLitter({ pupId: dog.id });
  expect(dog.litterId).toEqual(litter.id);
});

// Lists of breeders with dogs and litters, for randomBreeder tests
// These are arrays with breederIds
const breedersWithDogs = [
  ...new Set(
    utils
      .allDogs()
      .map((d) => d.breederId)
      .filter((i) => i.length > 0)
  ),
];
const breedersWithLitters = [
  ...new Set(
    utils
      .allLitters()
      .map((l) => l.breederId)
      .filter((i) => i.length > 0)
  ),
];

test('randomBreeder respects hasDogs argument', () => {
  // Remember, all dogs have breeders, but not all breeders have dogs
  const noDogs = utils.randomBreeder({ hasDogs: false });
  const yesDogs = utils.randomBreeder({ hasDogs: true });
  // Check that breeder id is in appropriate list
  expect(breedersWithDogs).toContainEqual(yesDogs.id);
  expect(breedersWithDogs).not.toContainEqual(noDogs.id);
});

test('randomBreeder respects hasLitters argument', () => {
  const noLitters = utils.randomBreeder({ hasLitters: false });
  const yesLitters = utils.randomBreeder({ hasLitters: true });
  expect(breedersWithLitters).toContainEqual(yesLitters.id);
  expect(breedersWithLitters).not.toContainEqual(noLitters.id);
});

test('randomBreeder respects both hasDogs and hasLitters arguments', () => {
  const yesDogYesLitter = utils.randomBreeder({
    hasDogs: true,
    hasLitters: true,
  });
  expect(breedersWithLitters).toContainEqual(yesDogYesLitter.id);
  expect(breedersWithDogs).toContainEqual(yesDogYesLitter.id);
  const noDogNoLitter = utils.randomBreeder({
    hasDogs: false,
    hasLitters: false,
  });
  expect(breedersWithLitters).not.toContainEqual(noDogNoLitter.id);
  expect(breedersWithDogs).not.toContainEqual(noDogNoLitter.id);
  const yesDogNoLitter = utils.randomBreeder({
    hasDogs: true,
    hasLitters: false,
  });
  expect(breedersWithLitters).not.toContainEqual(yesDogNoLitter.id);
  expect(breedersWithDogs).toContainEqual(yesDogNoLitter.id);
  const noDogYesLitter = utils.randomBreeder({
    hasDogs: false,
    hasLitters: true,
  });
  expect(breedersWithLitters).toContainEqual(noDogYesLitter.id);
  expect(breedersWithDogs).not.toContainEqual(noDogYesLitter.id);
});

test('allLitters respects breederId argument', () => {
  const testBreederId = utils.randomLitter().breederId;
  const allLitters = utils.allLitters();
  const testLitters = utils.allLitters({ breederId: testBreederId });
  // Expect that all returned litters should have correct breeder id
  for (const l of testLitters) {
    expect(l.breederId).toEqual(testBreederId);
  }
  // Expect that all litters with a different breeder plus all litters with this breeder should equal the total number of litters
  const otherLitters = allLitters.filter((l) => l.breederId !== testBreederId);
  expect(otherLitters.length + testLitters.length).toEqual(allLitters.length);
});
