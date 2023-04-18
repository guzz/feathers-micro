import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('todo', (table) => {
    table.integer('userId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('todo', (table) => {
    table.dropColumn('userId')
  })
}
