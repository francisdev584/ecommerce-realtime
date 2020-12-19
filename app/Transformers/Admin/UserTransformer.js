'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')

/**
 * UserTransformer class
 *
 * @class UserTransformer
 * @constructor
 */
class UserTransformer extends BumblebeeTransformer {
  /**
   * This method is used to transform the data.
   */
  transform (user) {
    return {
     // add your transformation object here
     id: user.id,
     name: user.name,
     surname: user.surname,
     email: user.email,
    }
  }
}

module.exports = UserTransformer
