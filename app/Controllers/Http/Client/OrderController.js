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
const OrderTransformer = use('App/Transformers/Admin/OrderTransformer')

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
  async index ({ request, response, pagination, transform, auth }) {
    const query = Order.query()
    const client = await auth.getUser()
    query.where('user_id', client.id)

    const number = request.input('number')

    if(number) {
      query.where('id', 'LIKE',`${number}`)
    }

    const results = await query.orderBy('id','DESC').paginate(pagination.page, pagination.limit)

    const transformedOrders = await transform.paginate(results, OrderTransformer)
    return response.send(transformedOrders)
  }

  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, transform }) {
    const transaction = await Database.beginTransaction()

    try {
      const { user_id, items, status } = request.all()
      const order = await Order.create({ user_id, status }, transaction)

      const orderService = new OrderService(order, transaction)

      if (items && items.length > 0 ) {
        await orderService.syncItems(items)
      }

      await transaction.commit()
      const ordercreated = await Order.find(order.id)
      const transformedOrder = await transform.include('user,items').item(ordercreated, OrderTransformer)
      return response.status(201).send(transformedOrder)
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
  async show ({ params: {id}, response, transform, auth }) {
    const client = await auth.getUser()
    const result = await Order.query()
    .where('user_id', client.id)
    .where('id', id)
    .firstOrFail()

    const transformedOrder = await transform.item(result, OrderTransformer)

    return response.send(transformedOrder)
  }

  /**
   * Update order details.
   * PUT or PATCH orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: {id}, request, response, transform }) {
    const order = await Order.findOrFail(id)
    const transaction = await Database.beginTransaction()

    try {
      const { user_id, items, status } = request.all()
      order.merge({user_id, status})

      const orderService = new OrderService(order, transaction)

      await orderService.updateItems(items)
      await order.save(transaction)
      await transaction.commit()
      const transformedOrder = await transform.include('items,user,discounts,coupons').item(order, OrderTransformer)
      return response.send(transformedOrder)
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

  async applyDiscount({ params: {id}, request, response, transform }) {
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
      const transformedOrder = await transform.include('items,user,discounts,coupons').item(order, OrderTransformer)
      return response.send({ transformedOrder, info })
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
