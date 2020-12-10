'use strict'

class OrderService {
  constructor(model, transaction = false) {
    this.model = model
    this.transaction = transaction
  }

  async syncItems(items) {
    if(!Array.isArray(items)) {
      return false
    }
    await this.model.items().delete(this.transaction)
    await this.model.items().createMany( [ items, this.transaction ] )
  }

  async updateItems(items) {
    let currentItems = await this.model
    .items()
    .whereIn('id', items.map(item => item.id))
    .fetch()
    // deleta os items que o user não quer mais
    await this.model
    .items()
    .whereNotIn('id', items.map(item => item.id))
    .delete(this.transaction)

    // Atualiza os valores e quantidades
    await Promise.all(
      currentItems.rows.map(async item => {
        item.fill(items.find(n => n.id === item.id))

        await item.save(this.transaction)
      })
    )
  }

  async
}
