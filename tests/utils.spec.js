import utils from './setup/utils';

// Make sure utilities do what they ought to...
// Only partially built out, added to as I suspect functions are misbehaving
test('randomDog respects sex argument', () => {
  const male = utils.randomDog({ sex: 'm' });
  const female = utils.randomDog({ sex: 'f' });
  expect(male.sex).toEqual('m');
  expect(female.sex).toEqual('f');
});
