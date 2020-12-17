import databaseSetup from './databaseSetup';

const prompt = require('prompt-sync')({ sigint: true });

console.warn(
  '*********\nThis script will erase your existing database and overwrite it with starter data\n*********'
);
console.log(`Your current environment is: ${process.env.NODE_ENV}`);
console.log(
  'If you continue, the database for this environment will be overwritten.'
);
let confirm = prompt('Are you sure you want to continue? (y/n) ').toLowerCase();

while (!['y', 'yes', 'n', 'no'].includes(confirm)) {
  console.log('Please answer yes or no.');
  confirm = prompt('Are you sure you want to continue? (y/n) ').toLowerCase();
}

if (confirm === 'y' || confirm === 'yes') {
  console.log('Overwriting database...');
  const data = databaseSetup().then((d) => {
    console.log('Database populated with starter data. User info below:');
    console.log(d);
  });
} else if (confirm === 'n' || confirm === 'no') {
  console.log("That's probably a wise choice.");
  console.log('Exiting');
}
