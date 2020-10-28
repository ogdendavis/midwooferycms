// Use node's build in child_process module
const { exec } = require('child_process');

const devDbServer = {
  start: function () {
    console.log('\nStarting PostgreSQL dev server');
    exec(
      'pg_ctl -D /usr/local/var/postgres start -w && echo "PostgreSQL dev server started"',
      (err, stdout, stderr) => {
        if (err) {
          console.log(err);
        }
      }
    );
  },
  stop: function (server) {
    console.log(server);
    server.close(function () {
      console.log('\nStopping PostgreSQL dev server');
      exec(
        'pg_ctl -D /usr/local/var/postgres stop && echo "PostgreSQL dev server stopped"',
        (err, stdout, stderr) => {
          if (err) {
            console.log(err);
          }
        }
      );
    });
  },
};

export default devDbServer;
