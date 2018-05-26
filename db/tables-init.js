const
    config = require('./internal/config'),
    mysqlConfig = config.get('mysql'),
    knex = require('knex')({ client: 'mysql', connection: mysqlConfig}),
    log = require('./internal/logger')(module);

for (arg of process.argv) log.info(arg);

if (!process.argv[2]) {

    log.warn(`specify tables you want to init, for example "node ./db/tables-init.js all"`);

    exit();

} else {

    const tablesNames = process.argv.slice(2);

    let createTableQuerys = [];

    if (tablesNames.includes('all')) {
        createTableQuerys = createTableQuery('all');
    } else {
        createTableQuerys = tablesNames.map(tableName => createTableQuery(tableName)).filter(query => query !== null);
    }

    Promise.all(createTableQuerys)
        .then(log.info('tables created'))
        .catch(err => { log.error(err) })
        .then(exit());

}

// functions

function createTableQuery(tableName) {

    const queries = {
        users: createUsersTableQuery
    };

    if (tableName === 'all')
        return Object.values(queries).map(value => value());

    if (Object.keys(queries).includes(tableName))
        return queries[tableName]();

    return null;

}

function createUsersTableQuery() {

    const createUsersTableQuery =  knex.schema.createTable('users', table => {

        table.increments('id');
        table.string('username').unique();
        table.string('hash');
        table.string('role', 15);
        table.boolean('reauth').defaultTo(true);

        polishTable(table);

    });

    log.debug(createUsersTableQuery.toSQL());

    return createUsersTableQuery;

}

function polishTable(table) {

    table.timestamps(false, true);
    table.charset('utf8');
    table.collate('utf8_unicode_ci');

}

function exit() {
    setTimeout(() => { process.exit() }, 2000)
}