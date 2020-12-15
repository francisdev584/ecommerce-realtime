'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with products
 */
const Product = use('App/Models/Product')
const ProductTransformer = use('App/Transformers/Admin/ProductTransformer')
class ProductController {
  /**
   * Show a list of all products.
   * GET products
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ request, response, pagination, transform }) {
    const name = request.input('name')
    const query = Product.query()

    if (name) {
      query.where('name', 'LIKE', `%${name}%`)
    }

    const products = await query.paginate(pagination.page, pagination.limit)
    const transformedProducts = await transform.paginate(products, ProductTransformer)
    return response.send(transformedProducts)
  }

  /**
   * Create/save a new product.
   * POST products
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, transform}) {
    try {
      const { name, description, price, image_id } = request.all()

      const product = await Product.create({ name, description, price, image_id })
      const transformedProduct = await transform.item(product, ProductTransformer)
      return response.status(201).send(transformedProduct)
    } catch (error) {
      return response.status(400).send({
        message: 'Não foi possível criar o produto neste momento!'
      })
    }
  }

  /**
   * Display a single product.
   * GET products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params: {id}, request, response, transform }) {
    const product = await Product.findOrFail(id)
    const transformedProduct = await transform.item(product, ProductTransformer)
    return response.send(transformedProduct)
  }

  /**
   * Update product details.
   * PUT or PATCH products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: {id}, request, response, transform }) {
    const product = await Product.findOrFail(id)

    try {
      const { name, description, price, image_id } = request.all()

      product.merge({name, description, price, image_id})

      await product.save()
      const transformedProduct = await transform.item(product, ProductTransformer)
      return response.send(transformedProduct)
    } catch (error) {
      return response.status(400).send({
        message: 'Não foi possível atualizar esse produto!'
      })
    }
  }

  /**
   * Delete a product with id.
   * DELETE products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: {id}, request, response }) {
    const product = await Product.findOrFail(id)

    try {
      await product.delete()

      return response.status(204).send()
    } catch (error) {
      return response.status(500).send({
        message:'Não foi possível deletar esse produto!'
      })
    }
  }
}

module.exports = ProductController
