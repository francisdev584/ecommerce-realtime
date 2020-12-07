'use strict'

const Database = use('Database')
const User = use('App/Models/User')
const Role = use('Role')

class AuthController {

  async register({request, response}) {
    const transaction = await Database.beginTransaction()

    try {
      const { name, surname, email, password } = request.all();

      const user = await User.create({ name, surname, email, password }, transaction)

      const userRole = await Role.findBy('slug', 'client')

      await user.roles().attach([userRole.id], null, transaction)

      await transaction.commit()

      return response.status(201).send({ data: user })
    } catch (error) {
      await transaction.rollback()
      return response.status(400).send({ message: 'Erro ao realizar cadastro!'})
    }
  }

  async login({ request, response, auth }){
    const { email, password } = request.all()

    let data = await auth.withRefreshToken().attempt(email, password)

    return response.send({ data })
  }

  async refresh({ request, response, auth }){
    //

  }

  async logout({ request, response, auth }){
    //

  }

  async forgot({ request, response }){
    //

  }

  async remember({ request, response }){
    //

  }

  async reset({ request, response }){
    //

  }
}

module.exports = AuthController
