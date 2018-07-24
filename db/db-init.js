const
    config = require('./internal/config'),
    mysqlInitConfig = config.get('mysql-init'),
    mysqlConfig = config.get('mysql'),
    dbName = mysqlConfig.database,
    knex = require('knex')({ client: 'mysql', connection: mysqlInitConfig}),
    log = require('./internal/logger')(module);

for (arg of process.argv) log.info(arg);

log.debug('mysqlInitConfig', mysqlInitConfig);
log.debug('mysqlConfig', mysqlConfig);

const query = `SHOW DATABASES LIKE '${ dbName }'`;

knex.raw(query)
    .then(result => {

        if (result[0].length) {

            log.info(`already have ${ dbName } database, have to drop it and create it back`);
            return dropDb()
                .then(() => createDb())

        } else  {

            log.info(`have no ${ dbName } database, have to create it`);
            return createDb()

        }

    })
    .catch(err =>  log.error(err))
    .then(() => exit());

function dropDb() {

    const action = 'DROP DATABASE';
    const query = `${ action } IF EXISTS ${ dbName }`;
    log.debug(query);

    return knex.raw(query)
        .then(() => log.info(`${ action.toLowerCase() } success`));

}

function createDb() {

    const action = 'CREATE DATABASE';
    const query = `${ action } IF NOT EXISTS ${ dbName }`;
    log.debug(query);

    return knex.raw(query)
        .then(() => log.info(`${ action.toLowerCase() } success`));

}

function exit() {
    setTimeout(() => { process.exit() }, 2000)
}