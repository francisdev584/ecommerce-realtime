'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

// retorna o usuário logado atualmente
Route.get('v1/me', 'UserController.me').as('me').middleware('auth')

// import auth routes
require('./auth')

//import admin routes
require('./admin')

//import client routes
require('./client')
