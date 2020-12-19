'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Product extends Model {
  image() {
    return this.belongsTo('App/Models/Image')
  }

  // relaciomento entre produto e imagens.
  // Galeria de Imagens
  images() {
    return this.belongsToMany('App/Models/Image')
  }

  categories() {
    return this.belongsToMany('App/Models/Category')
  }

  // relac. entre produtos e coupons
  coupons() {
    return this.belongsToMany('App/Models/Coupon')
  }
}

module.exports = Product
