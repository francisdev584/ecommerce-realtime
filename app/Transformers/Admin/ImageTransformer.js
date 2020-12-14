'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')

/**
 * ImageTransformer class
 *
 * @class ImageTransformer
 * @constructor
 */
class ImageTransformer extends BumblebeeTransformer {
  /**
   * This method is used to transform the data.
   */
  transform (image) {
    let imageData = image.toJSON()
    return {
     // add your transformation object here
     id: imageData.id,
     url: imageData.url
    }
  }
}

module.exports = ImageTransformer
