'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with coupons
 */
const Coupon = use('App/Models/Coupon')
const Database = use('Database')
const CouponService = use('App/Services/Coupon/CouponService')
const CouponTransformer = use('App/Transformers/Admin/CouponTransformer')
class CouponController {
  /**
   * Show a list of all coupons.
   * GET coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {object} ctx.pagination
   */
  async index ({ request, response, pagination, transform }) {
    const code = request.input('code')
    const query = Coupon.query()

    if (code) {
      query.where('code', 'LIKE', `%${code}%`)
    }

    const coupons = await query.paginate(pagination.page, pagination.limit)
    const transformedCoupons = await transform.paginate(coupons, CouponTransformer)
    return response.send(transformedCoupons)
  }

  /**
   * Create/save a new coupon.
   * POST coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, transform }) {
    /**
     * 1 - products - pode ser utilizado apenas em produtos específicos
     * 2 - clients - pode ser utilizado apenas por clientes específicos
     * 3 - clients and products - pode ser utilizado somente em produtos e clientes específicos
     * 4 - pode ser utilizado por qualquer cliente em qualquer pedido
     */
    const transaction = Database.beginTransaction()

    let can_use_for = {
      client: false,
      product: false
    }

    try {
      const couponData = request.only([
        'code',
        'discount',
        'valid_from',
        'valid_until',
        'quantity',
        'type',
        'recursive'
      ])

      const { users, products } = request.only(['users', 'products'])

      const coupon = await Coupon.create(couponData, transaction)
      // starts service Layer
      const couponService = new CouponService(coupon, transaction)
      // insert relationships on DB
      if (users && users.length > 0) {
        await couponService.syncUsers(users)
        can_use_for.client = true
      }
      if (products && products.length > 0) {
        await couponService.syncProducts(products)
        can_use_for.product = true
      }

      if (can_use_for.product && can_use_for.client) {
        coupon.can_use_for = 'product_client'
      }else if(can_use_for.product && !can_use_for.client) {
        coupon.can_use_for = 'product'
      }else if(!can_use_for.product && can_use_for.client) {
        coupon.can_use_for = 'client'
      }else {
        coupon.can_use_for = 'all'
      }

      await coupon.save()
      await transaction.commit()

      const transformedCoupon = await transform.include('users,products').item(coupon, CouponTransformer)

      return response.status(201).send(transformedCoupon)
    } catch (error) {
      await transaction.rollback()
      return response.status(400).send({
        message: 'Não foi possível cria o cupom no momento!'
      })
    }
  }

  /**
   * Display a single coupon.
   * GET coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params: {id}, request, response, transform}) {
    const coupon = await Coupon.findOrFail(id)

    const transformedCoupon = await transform.include('products,users,orders').item(coupon, CouponTransformer)

    return response.send(transformedCoupon)
  }

  /**
   * Update coupon details.
   * PUT or PATCH coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: {id}, request, response, transform }) {
    const transaction = Database.beginTransaction()
    const coupon = await Coupon.findOrFail(id)
    let can_use_for = {
      client: false,
      product: false
    }

    try {
      const couponData = request.only([
        'code',
        'discount',
        'valid_from',
        'valid_until',
        'quantity',
        'type',
        'recursive'
      ])

      coupon.merge(couponData)


      const { users, products } = request.only(['users', 'products'])

      const couponService = new CouponService(coupon, transaction)

      if (users && users.length > 0) {
        await couponService.syncUsers(users)
        can_use_for.client = true
      }

      if (products && products.length > 0) {
        await couponService.syncProducts(products)
        can_use_for.product = true
      }

      if (can_use_for.product && can_use_for.client) {
        coupon.can_use_for = 'product_client'
      }else if(can_use_for.product && !can_use_for.client) {
        coupon.can_use_for = 'product'
      }else if(!can_use_for.product && can_use_for.client) {
        coupon.can_use_for = 'client'
      }else {
        coupon.can_use_for = 'all'
      }

      await coupon.save(transaction)
      transaction.commit()

      const transformedCoupon = await transform.item(coupon, CouponTransformer)

      return response.send(transformedCoupon)
    } catch (error) {
      await transaction.rollback()
      return response.status(400).send({
        message: 'Não foi possível atualizar este cupom no momento!'
      })
    }
  }

  /**
   * Delete a coupon with id.
   * DELETE coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: {id}, request, response }) {
    const transaction = await Database.beginTransaction()
    const coupon = await Coupon.findOrFail(id)

    try {
      await coupon.products().detach([], transaction)
      await coupon.orders().detach([], transaction)
      await coupon.users().detach([],transaction)
      await coupon.delete(transaction)
      await transaction.commit()

      return response.status(204).send()
    } catch (error) {
      await transaction.rollback()
      return response.status(400).send({
        message: 'Não foi possível apagar esse coupon no momento'
      })
    }
  }
}

module.exports = CouponController
