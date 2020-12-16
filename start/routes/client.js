'use strict'

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.group(() => {
  // Product Resource Routes
  Route.get('products','ProductController.index')
  Route.get('products/:id','ProductController.show')


  // Order resource routes
  Route.get('orders','OrderController.index').middleware(['auth'])
  Route.get('orders/:id','OrderController.show').middleware(['auth'])
  Route.post('orders','OrderController.store').middleware(['auth'])
  Route.put('orders/:id','OrderController.update').middleware(['auth'])
})
  .prefix('v1')
  .namespace('Client')
