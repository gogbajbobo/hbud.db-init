const config = require('nconf');

config
    .argv()
    .env()
    .file({ file: '../../../hbud.config.json' });

config.get('env') && (process.env.NODE_ENV = config.get('env'));

process.env.appname = 'db-init';

module.exports = config;