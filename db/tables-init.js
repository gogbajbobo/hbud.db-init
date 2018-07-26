const
    config = require('./internal/config'),
    mysqlConfig = config.get('mysql'),
    log = require('./internal/logger')(module),
    knex = require('knex')({
        client: 'mysql',
        connection: mysqlConfig,
        debug: true
    });

for (arg of process.argv) log.info(arg);

if (!process.argv[2]) {

    log.warn(`specify tables you want to init, for example "node ./db/tables-init.js all"`);

    delayExit();

} else {

    const tablesNames = process.argv.slice(2);

    let dropTableQueries = [];
    let createTableQueries = [];

    if (tablesNames.includes('all')) {

        dropTableQueries = dropTableQuery('all');
        createTableQueries = createTableQuery('all');

    } else {

        dropTableQueries = tablesNames.map(tableName => dropTableQuery(tableName));
        createTableQueries = tablesNames.map(tableName => createTableQuery(tableName)).filter(query => query !== null);

    }

    let queriesPromise = new Promise(res => res());

    const queryChaining = query => queriesPromise = queriesPromise.then(() => query);

    dropTableQueries.forEach(queryChaining);
    createTableQueries.forEach(queryChaining);

    if (tablesNames.includes('roles'))
        queriesPromise = queriesPromise.then(() => fillRolesTableQuery());

    if (tablesNames.includes('accounttypes'))
        queriesPromise = queriesPromise.then(() => fillAccountTypesTableQuery());

    if (tablesNames.includes('currencies'))
        queriesPromise = queriesPromise.then(() => fillCurrenciesTableQuery());

    queriesPromise
        .then(() => log.info('tables created'))
        .catch(err => log.error(err.message))
        .then(delayExit())

}

// functions

function dropTableQuery(tableName) {

    const tables = [
        'users_roles',
        'roles',
        'users',
        'accounttypes',
        'accounts',
        'subaccounts',
        'currencies',
        'transactions'
    ];

    if (tableName === 'all')
        return tables.map(table => knex.schema.dropTableIfExists(table));

    return knex.schema.dropTableIfExists(tableName)

}

function createTableQuery(tableName) {

    const queries = {
        users: createUsersTableQuery,
        roles: createRolesTableQuery,
        users_roles: createUsersRolesTableQuery,
        accounttypes: createAccountTypesTableQuery,
        accounts: createAccountsTableQuery,
        subaccounts: createSubaccountTableQuery,
        currencies: createCurrenciesTableQuery,
        transactions: createTransactionsTableQuery
    };

    if (tableName === 'all')
        return Object.values(queries).map(value => value());

    if (Object.keys(queries).includes(tableName))
        return queries[tableName]();

    return null

}

function createUsersTableQuery() {

    return knex.schema.createTable('users', table => {

        table.increments('id');
        table.string('username').unique();
        table.string('hash');
        table.boolean('reauth').defaultTo(true);

        polishTable(table);

    })

}

function createRolesTableQuery() {

    return knex.schema.createTable('roles', table => {

        table.increments('id');
        table.string('rolename').unique();

        polishTable(table);

    })

}

function fillRolesTableQuery() {

    const roles = ['admin', 'user', 'visitor'];
    return knex('roles').insert(roles.map(rolename => ({ rolename }) ))

}

function createUsersRolesTableQuery() {

    return knex.schema.createTable('users_roles', table => {

        table.increments('id');

        table.integer('roles_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
        table.integer('users_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');

        polishTable(table);

    })

}

function createAccountTypesTableQuery() {

    return knex.schema.createTable('accounttypes', table => {

        table.increments('id');
        table.string('name').unique();

        polishTable(table);

    });

}

function fillAccountTypesTableQuery() {

    const types = ['income', 'current', 'expense'];
    return knex('accounttypes').insert(types.map(name => ({ name }) ))

}

function createAccountsTableQuery() {

    return knex.schema.createTable('accounts', table => {

        table.increments('id');
        table.string('name');

        table.integer('type_id').unsigned().notNullable().references('id').inTable('accounttypes').onDelete('CASCADE');
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');

        table.unique(['name', 'type_id', 'user_id']);

        polishTable(table)

    })

}

function createSubaccountTableQuery() {

    return knex.schema.createTable('subaccounts', table => {

        table.increments('id');
        table.string('name');

        table.integer('account_id').unsigned().notNullable().references('id').inTable('accounts').onDelete('CASCADE');
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');

        table.unique(['name', 'account_id', 'user_id']);

        polishTable(table)

    })

}

function createCurrenciesTableQuery() {

    return knex.schema.createTable('currencies', table => {

        table.increments('id');
        table.string('name').unique();
        table.boolean('base');

        polishTable(table)

    });

}

function fillCurrenciesTableQuery() {

    const currencies = ['RUB', 'EUR', 'USD'];
    return knex('currencies').insert(currencies.map(name => ({ name, base: name === 'RUB' }) ))

}

function createTransactionsTableQuery() {

    return knex.schema.createTable('transactions', table => {

        table.increments('id');

        table.date('date').index();

        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('from_id').unsigned().notNullable().references('id').inTable('accounts').onDelete('CASCADE');
        table.integer('to_id').unsigned().notNullable().references('id').inTable('accounts').onDelete('CASCADE');
        table.integer('from_sub_id').unsigned().references('id').inTable('subaccounts').onDelete('SET NULL');
        table.integer('to_sub_id').unsigned().references('id').inTable('subaccounts').onDelete('SET NULL');
        table.integer('from_curr_id').unsigned().notNullable().references('id').inTable('currencies').onDelete('NO ACTION');
        table.integer('to_curr_id').unsigned().notNullable().references('id').inTable('currencies').onDelete('NO ACTION');

        table.decimal('from_value', 19, 4);
        table.decimal('to_value', 19, 4);

        polishTable(table)

    })

}

function polishTable(table) {

    table.timestamps(false, true);
    table.charset('utf8');
    table.collate('utf8_unicode_ci')

}

function delayExit() {
    setTimeout(() => { process.exit() }, 2000)
}