# Midwoofery CMS

A CMS designed specifically for dog breeders.

Version 0.0.1

**This README is for developers.** Customer-facing documentation to come once development has progressed to a live release (0.1.0 or greater)

Currently runs on Node 12.18.1. It may or may not work with other versions.

## Contents

1. [Dev installation](#1)
2. [Running locally](#2)
3. [Routes](#3)

## <a id="1"></a>Dev installation

Requirements:

- [Node](https://nodejs.dev/learn/how-to-install-nodejs) (^12.18.0)
- [PostgreSQL](https://www.postgresql.org/docs/13/tutorial-install.html) (^13.0)

To install:

1. Git clone this repo
2. npm install

Use env.example as a model for creating your own .env (You can copy env.example, to start). Variable names should be sufficiently self-explanatory.

It is strongly recommended to create separate databases for test, dev, and prod environments. If you're not familiar with setting up PostgreSQL databases locally, [here's a great guide](https://www.robinwieruch.de/postgres-sql-macos-setup). Test database is populated on test run via tests/databaseSetup.js -- modify the data there, if you want to change the info you're testing against.

## <a id="2"></a>Running locally

Local run command is `npm run dev`.

Note that when you stop the process from the command line (ctrl+c), the
postdev cleanup script doesn't run. Best practice when shutting down for the day is to run `pg_ctl -D /usr/local/var/postgres stop -m smart` after stopping the dev process. This will shut down the PostgreSQL server.

The dev script resets the contents of the database on each restart. If you want to change the default data that the server starts with, make changes in the `populateDevDatabase` method of src/index.js.

Run tests with `npm run test`. Make sure the database server is running -- can be running via dev, or run it alone as `pg_ctl -D /usr/local/var/postgres start`.

Can run tests on watch mode with `npm run test:watch`. Use with `npm run dev` for test-driven development.

## <a id="3"></a>Routes

### GET

No body needed for GET requests -- all info is sent via the path

- **`/dogs`** - Returns an array of all dogs
- **`/dogs/[id]`** - Returns an object of the dog with the provided ID
- **`/dogs/[id]/breeder`** - Returns an object of the breeder associated with the dog with the provided ID
- **`/breeders`** - Returns an array of all breeders
- **`/breeders/[id]`** - Returns an object of the breeder with the indicated ID
- **`/breeders/[id]/dogs`** - Returns an array of all dogs associated with the breeder with the provided ID

### POST

Send a JSON object in the request body. Required and optional arguments included in descriptions below.

- **`/dogs`** - Creates a new dog. Arguments: name (required), breed, color, weight. Returns the object of the newly created dog
- **`/breeders`** - Creates a new breeder. Arguments: firstname (required), lastname (required), city, state

### PUT

Send a JSON object in the request body. Required and optional arguments included in descriptions below.

- **`/dogs/[id]`** - Updates the dog with indicated ID. Arguments: name, breed, color, weight, breederId. Returns object of updated dog
- **`/breeders/[id]`** - Updates the breeder with the indicated ID. Arguments: firstname, lastname, city, state

### DELETE

No body needed for DELETE requests -- all info is sent via the path.

**DELETE requests delete the indicated row from the database entirely. USE WITH CAUTION.**

- **`/dogs/[id]`** - Deletes the dog with indicated ID. Returns an object with the deleted dog. It might be smart to check this object to make sure you deleted the right one -- if not, you can use the object to re-add the dog to the database
- **`/breeders/[id]`** - Deletes the breeder with indicated ID. Does **not** delete the dogs associated with the breeder, but instead changes the breederId for those dogs to null. Returns an object with the deleted breeder. It might be smart to check this object to make sure you deleted the right one -- if not, you can use the object to re-add the breeder to the database