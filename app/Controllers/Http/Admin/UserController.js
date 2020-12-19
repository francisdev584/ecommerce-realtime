'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with users
 */

 const User = use('App/Models/User')
const UserTransformer = use('App/Transformers/Admin/UserTransformer')
class UserController {
  /**
   * Show a list of all users.
   * GET users
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {object} ctx.pagination
   */
  async index ({ request, response, pagination, transform }) {
    const name = request.input('name')
    const query = User.query()

    if (name) {
      query.where('name', 'LIKE', `%${name}%`)
      query.orWhere('surname', 'LIKE', `%${name}%`)
      query.orWhere('email', 'LIKE', `%${name}%`)
    }

    const users = await query.paginate(pagination.page, pagination.limit)
    const transformedUsers = await transform.paginate(users, UserTransformer)
    return response.send(transformedUsers)
  }

  /**
   * Create/save a new user.
   * POST users
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, transform }) {

    try {
      const userData = request.only(['name', 'surname', 'email', 'password', 'image_id'])

      const user = await User.create(userData)
      const transformedUser = await transform.item(user, UserTransformer)
      return response.status(201).send(transformedUser)
    } catch (error) {
      return response
      .status(400)
      .send({ message: 'Não foi possível criar este usuário no momento!'})
    }

  }

  /**
   * Display a single user.
   * GET users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params: {id}, response, transform }) {
    const user = await User.findOrFail(id)
    const transformedUser = await transform.item(user, UserTransformer)
    return response.send(transformedUser)
  }

  /**
   * Update user details.
   * PUT or PATCH users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: {id}, request, response, transform }) {
    const user = await User.findOrFail(id)

    const userData = request.only(['name','surname','email','password','image_id'])

    user.merge(userData)

    await user.save()
    const transformedUser = await transform.item(user, UserTransformer)
    return response.send(transformedUser)
  }

  /**
   * Delete a user with id.
   * DELETE users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params:{id}, request, response }) {
    const user = await User.findOrFail(id)

    try {
      await user.delete()

      return response.status(204).send()
    } catch (error) {
      return response.status(500).send({
        message: 'Não foi possível apagar esse usuário!'
      })
    }

  }
}

module.exports = UserController
