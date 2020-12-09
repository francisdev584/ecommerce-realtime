'use strict'

class CouponService {
  constructor(model, transaction = null) {
    this.model = model
    this.transaction = transaction
  }

  async syncUsers(users) {
    if (!Array.isArray(users)) {
      return false
    }

    await this.model.users().sync(users, null, this.transaction)
  }

  async syncOrders(orders) {
    if(!Array.isArray(orders)) {
      return false
    }

    await this.model.orders().sync(orders, null, this.transaction)
  }

  async syncProducts(products) {
    if(!Array.isArray(products)) {
      return false
    }

    await this.model.products().sync(products, null, this.transaction)
  }
}

module.exports = CouponService
