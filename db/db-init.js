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

const query = `show databases like '${ dbName }'`;

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

    const action = 'drop database';
    const query = `${ action } if exists ${ dbName }`;
    log.debug(query);

    return knex.raw(query)
        .then(() => log.info(`${ action } success`));

}

function createDb() {

    const action = 'create database';
    const query = `${ action } if not exists ${ dbName }`;
    log.debug(query);

    return knex.raw(query)
        .then(() => log.info(`${ action } success`));

}

function exit() {
    setTimeout(() => { process.exit() }, 2000)
}