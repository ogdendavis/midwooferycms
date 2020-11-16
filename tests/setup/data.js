const breeders = [
  // b1 and b2 have both litters and dogs
  {
    id: 'b1',
    firstname: 'Fred',
    lastname: 'Astaire',
    city: 'Marshall',
    state: 'TX',
  },
  {
    id: 'b2',
    firstname: 'Ginger',
    lastname: 'Rogers',
    city: 'Kingston',
    state: 'RI',
  },
  // b3 has a litter, but no dogs
  {
    id: 'b3',
    firstname: 'Monty',
    lastname: 'Python',
    city: 'London',
    state: 'HI',
  },
  // b4 has dogs, but no litters
  {
    id: 'b4',
    firstname: 'Mona',
    lastname: 'Lisa',
    city: 'Paris',
    state: 'TX',
  },
  // b5 has neither dogs nor litters
  {
    id: 'b5',
    firstname: 'Vincent',
    lastname: 'Van Gogh',
    city: 'Brussels',
    state: 'MA',
  },
];

const litters = [
  {
    id: 'l1',
    breederId: 'b2',
    count: 4,
    dam: { id: 'd2', name: 'Freyja' },
    sire: { id: '', name: 'Freckles' },
    pups: ['d4', 'd3'],
  },
  {
    id: 'l2',
    breederId: 'b1',
    count: 8,
    dam: { id: '', name: 'Unicornia' },
    sire: { id: 'd5', name: 'Cedric' },
    pups: [],
  },
  {
    id: 'l3',
    breederId: 'b3',
    count: 12,
    dam: { name: 'Guinevere' },
    sire: { name: 'Lancelot' },
    pups: [],
  },
];

const dogs = [
  {
    id: 'd1',
    name: 'Gypsy',
    breed: 'labrador retriever',
    color: 'black',
    weight: 60,
    breederId: 'b1',
    litterId: '',
    sex: 'f',
  },
  {
    id: 'd2',
    name: 'Freyja',
    breed: 'doxie-poo',
    color: 'merle',
    weight: 14,
    breederId: 'b2',
    litterId: '',
    sex: 'f',
  },
  {
    id: 'd3',
    name: 'Sylive',
    breed: 'cat',
    color: 'stabby',
    weight: 8,
    breederId: 'b2',
    litterId: 'l1',
    sex: 'f',
  },
  {
    id: 'd4',
    name: 'Figgy',
    breed: 'goldendoodle',
    color: 'parti',
    weight: 23,
    breederId: 'b2',
    litterId: 'l1',
    sex: 'f',
  },
  {
    id: 'd5',
    name: 'Cedric',
    breed: 'goldendoodle',
    color: 'apricot',
    weight: 29,
    breederId: 'b1',
    litterId: '',
    sex: 'm',
  },
  {
    id: 'd6',
    name: 'Drew',
    breed: 'labrador retriever',
    color: 'black',
    weight: 60,
    breederId: 'b4',
    litterId: '',
    sex: 'm',
  },
];

export { breeders, litters, dogs };
