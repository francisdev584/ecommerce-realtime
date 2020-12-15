'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/**
 * Resourceful controller for interacting with images
 */
const Image = use('App/Models/Image')
const { manage_single_upload, manage_multiple_uploads } = use('App/Helpers')
const fs = use('fs')
const ImageTransformer = use('App/Transformers/Admin/ImageTransformer')

class ImageController {
  /**
   * Show a list of all images.
   * GET images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index ({ response, pagination, transform}) {
    const imagesData = await Image.query()
    .orderBy('id','DESC')
    .paginate(pagination.page, pagination.limit)

    const images = transform.paginate(imagesData, ImageTransformer)

    return response.send(images)
  }

  /**
   * Create/save a new image.
   * POST images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, transform }) {
    try {
      // captura uma imagem ou mais do request
      const fileJar = request.file('images', {
        type: ['image'],
        size: '2mb'
      })

      // retorno pro usuario
      let images = []

      // caso seja um único arquivo - manage_single_upload
      if (!fileJar.files) {
        const file = await manage_single_upload(fileJar)
        if (file.moved()) {
          const image = await Image.create({
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extension: file.subtype
          })
          const transformedImage = await transform.item(image, ImageTransformer)
          images.push(transformedImage)

          return response.status(201).send({ successes: images, errors: {} })
        }

        return response.status(400).send({
          message: 'Não foi possível processar esta imagem no momento!'
        })
      }
      // caso sejam vários arquivos - manage_multiple_uploads
      let files = await manage_multiple_uploads(fileJar)

      await Promise.all(
        files.successes.map(async file => {
          const image = await Image.create({
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extension: file.subtype
          })
          const transformedImage = await transform.item(image, ImageTransformer)
          images.push(transformedImage)
        })
      )

      return response.status(201).send({
        successes:images,
        errors: files.errors
      })
    } catch (error) {
      return response.status(400).send({
        message: 'Não foi possível processar sua solicitação'
      })
    }
  }

  /**
   * Display a single image.
   * GET images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params:{id}, response, transform }) {
    const image = await Image.findOrFail(id)
    const transformedImage = transform.item(image, ImageTransformer)
    return response.send(transformedImage)
  }

  /**
   * Update image details.
   * PUT or PATCH images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: {id}, request, response, transform }) {
    const image = await Image.findOrFail(id)

    try {
      image.merge(request.only(['original_name']))
      await image.save()
      const transformedImage = await transform.item(image, ImageTransformer)
      return response.status(200).send(transformedImage)
    } catch (error) {
      return response.status(400).send({
        message: 'Não foi possível atualizar esta imagem no momento!'
      })
    }
  }

  /**
   * Delete a image with id.
   * DELETE images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params:{id}, response }) {
    const image = await Image.findOrFail(id)
    try {
      let filePath = Helpers.publicPath(`uploads/${image.path}`)

      fs.unlinkSync(filePath)
      await image.delete()


      return response.status(204).send()
    } catch (error) {
      return response.status(400).send({
        message: 'Não foi possível apagar a imagem no momento!'
      })
    }
  }
}

module.exports = ImageController
