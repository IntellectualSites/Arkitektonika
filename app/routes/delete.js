import express from 'express'
import filesystem from '../util/filesystem'

export default (database) => {
  const router = express.Router()

  /**
   * Returns headers describing the result of a would-be deletion request
   * The request must come via HEAD and specify the DELETE KEY in the URL
   * Returns:
   * - HTTP 404: if the file does not exist in the accounting table
   * - HTTP 410:if the file could not be read on disk (gone (expired), db/filesystem mismatch, or corrupt file)
   * - HTTP 200: all seems good, the deletion would succeed if requested
   */
  router.head('/delete/:delete_key', async (req, res, next) => {
    const record = await database.getByDeleteKey(req.params.delete_key)
    if (!record) {
      res.status(404).json({})
      return
    }

    const file = await filesystem.openReadClose(record.filename)
    if (!file) {
      res.status(410).json({})
      return
    }

    res.status(200).json({})
  })

  /**
   * Deletes a file from the accounting table and filesystem
   * The request must come via DELETE and specify the DELETE KEY in the URL
   * Returns:
   * - HTTP 404: if the file does not exist in the accounting table
   * - HTTP 410: if the file exists in the accounting table but is deleted from disk (expired / manually deleted)
   * - HTTP 500: if the file could not be deleted
   * - HTTP 200: all seems good, the download would succeed if requested
   */
  router.delete('/delete/:delete_key', async function(req, res, next) {
    const record = await database.getByDeleteKey(req.params.delete_key)
    if (!record) {
      next({
        status: 404,
        message: "Could not find anything for given delete key"
      })
      return
    }

    const expired = !!record.expired
    if (expired || !(await filesystem.openReadClose(record.filename))) {
      if (!expired) {
        await database.expireRecord(record.id)
      }
      
      next({
        status: 410,
        message: "File once existed, but is gone"
      })
      return
    }

    try {
      await filesystem.deleteSchemata(record.filename)
      await database.expireRecord(record.id)
    } catch {
      next(new Error("File was not deleted for id = " + record.id))
      return
    }

    res.status(200).json({})
  })

  return router
}
