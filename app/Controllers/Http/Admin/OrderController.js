'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with orders
 */
const Order = use('App/Models/Order')
const Database = use('Database')
const OrderService = use('App/Services/Order/OrderService')
const Coupon = use('App/Models/Coupon')
const Discount = use('App/Models/Discount')

class OrderController {
  /**
   * Show a list of all orders.
   * GET orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, pagination }) {
    const { status, id } = request.only(['status', 'id'])
    const query = Order.query()

    if(status && id) {
      query.where('status', status).orWhere('id','LIKE', `%${id}%`)
    } else if(status) {
      query.where('status', status)
    } else if(id) {
      query.where('id','LIKE', `%${id}%`)
    }

    const orders = await query.paginate(pagination.page, pagination.limit)

    return response.send(orders)
  }

  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    const transaction = await Database.beginTransaction()

    try {
      const { user_id, items, status } = request.all()
      const order = await Order.create({ user_id, status }, transaction)

      const orderService = new OrderService(order, transaction)

      if (items && items.length > 0 ) {
        await orderService.syncItems(items)
      }

      await transaction.commit()

      return response.status(201).send()
    } catch (error) {
      await transaction.rollback()

      return response.status(400).send({
        message: 'Não foi possível criar o pedido no momento!'
      })
    }
  }

  /**
   * Display a single order.
   * GET orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params: {id}, request, response, view }) {
    const order = await Order.findOrFail(id)
    return response.send(order)
  }

  /**
   * Update order details.
   * PUT or PATCH orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: {id}, request, response }) {
    const order = await Order.findOrFail(id)
    const transaction = await Database.beginTransaction()

    try {
      const { user_id, items, status } = request.all()
      order.merge({user_id, status})

      const orderService = new OrderService(order, transaction)

      await orderService.updateItems(items)
      await order.save(transaction)
      await transaction.commit()

      return response.send(order)
    } catch (error) {
      await transaction.rollback()

      return response.status(400).send({
        message: 'Não foi possível atualizar este pedido no momento!'
      })
    }
  }

  /**
   * Delete a order with id.
   * DELETE orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: {id}, request, response }) {
    const order = await Order.findOrFail(id)
    const transaction = await Database.beginTransaction()

    try {
      await order.items().delete(transaction)
      await order.coupons().delete(transaction)
      await order.delete(transaction)
      await transaction.commit()

      return response.status(204).send()
    } catch (error) {
      await transaction.rollback()
      return response.status(400).send({
        message: 'Erro ao apagar esse pedido!'
      })
    }
  }

  async applyDiscount({ params: {id}, request, response }) {
    const { code } = request.all()
    const coupon = await Coupon.findByOrFail('code', code.toUpperCase())
    const order = await Order.findOrFail(id)
    let discount, info = {}

    try {
      const orderService = new OrderService(order)
      const canAddDiscount = await orderService.canApplyDiscount(coupon)
      const orderDiscounts = await order.coupons().getCount()

      const canApplyToOrder = orderDiscounts < 1 || (orderDiscounts >= 1 && coupon.recursive)

      if (canAddDiscount && canApplyToOrder) {
        discount = await Discount.findOrCreate({
          order_id: order.id,
          coupon_id: coupon.id
        })

        info.message = 'Cupom aplicado com sucesso!'
        info.success = true
      }else {
        info.message = 'Não foi possível aplicar este cupom!'
        info.success = false
      }

      return response.send({order, info})
    } catch (error) {
      return response.status(400).send({ message: 'Erro ao aplicar o cupom!'})
    }
  }

  async removeDiscount({request, response}) {
    const { discount_id } = request.all()
    const discount = await Discount.findOrFail(discount_id)
    await discount.delete()
    return response.status(204).send()
  }
}

module.exports = OrderController
