'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with categories
 */
const Category = use('App/Models/Category')
const categoryTransformer = use('App/Transformers/Admin/CategoryTransformer')

class CategoryController {
  /**
   * Show a list of all categories.
   * GET categories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   * @param {object} ctx.pagination
   */
  async index ({ request, response, transform, pagination }) {
    const title = request.input('title')
    const query = Category.query()

    if (title) {
      query.where('title', 'LIKE',`%${title}%`)
    }

    const categoriesData = await query.paginate(pagination.page, pagination.limit)

    const categories = await transform.paginate(categoriesData, categoryTransformer)

    return response.send(categories)
  }

  /**
   * Create/save a new category.
   * POST categories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response,transform }) {
    try {
      const { title, description, image_id } = request.all()

      const categoryData = await Category.create({title, description, image_id})

      const category = await transform.item(categoryData, categoryTransformer)

      return response.status(201).send(category)
    } catch (error) {
      return response.status(400).send({
        message: 'Erro ao processar a sua solicitação'
      })
    }

  }

  /**
   * Display a single category.
   * GET categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params: {id}, transform, response }) {
    const categoryData = await Category.findOrFail(id)

    const category = await transform.item(categoryData, categoryTransformer)

    return response.send(category)
  }

  /**
   * Update category details.
   * PUT or PATCH categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: {id}, request, response }) {
    const category = await Category.findOrFail(id)

    const {title, description, image_id} = request.all()

    category.merge({title, description, image_id})

    await category.save()

    return response.send(category)
  }

  /**
   * Delete a category with id.
   * DELETE categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: {id}, request, response }) {
    const category = await Category.findOrFail(id)

    await category.delete()

    return response.status(204).send()
  }
}

module.exports = CategoryController
