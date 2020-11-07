const breeders = [
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
  {
    id: 'b3',
    firstname: 'Monty',
    lastname: 'Python',
    city: 'London',
    state: 'HI',
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
  },
  {
    id: 'd2',
    name: 'Freyja',
    breed: 'doxie-poo',
    color: 'merle',
    weight: 14,
    breederId: 'b2',
  },
  {
    id: 'd3',
    name: 'Sylive',
    breed: 'cat',
    color: 'stabby',
    weight: 8,
    breederId: 'b2',
  },
  {
    id: 'd4',
    name: 'Figgy',
    breed: 'goldendoodle',
    color: 'parti',
    weight: 23,
    breederId: 'b2',
  },
  {
    id: 'd5',
    name: 'Cedric',
    breed: 'goldendoodle',
    color: 'apricot',
    weight: 29,
    breederId: 'b1',
  },
];

export { breeders, dogs };
