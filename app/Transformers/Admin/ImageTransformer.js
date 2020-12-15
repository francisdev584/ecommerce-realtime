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
     url: imageData.url,
     size: imageData.size,
     original_name: imageData.original_name,
     extension: imageData.extension
    }
  }
}

module.exports = ImageTransformer
