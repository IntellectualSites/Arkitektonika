import express from 'express'
import filesystem from '../util/filesystem'

export default (database) => {
  const router = express.Router();

  /**
   * Returns headers describing the result of a would-be download request
   * The request must come via HEAD and specify the DOWNLOAD KEY in the URL
   * Returns:
   * - HTTP 404: if the file does not exist in the accounting table
   * - HTTP 410: if the file could not be read on disk (gone (expired), db/filesystem mismatch, or corrupt file)
   * - HTTP 200: all seems good, the download would succeed if requested
   */
  router.head('/download/:download_key', async (req, res, next) => {
    const record = await database.getByDownloadKey(req.params.download_key)
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
   * Downloads the file described the given download key
   * The request must come via GET and specify the DOWNLOAD KEY in the URL
   * Returns:
   * - HTTP 404: if the file does not exist in the accounting table
   * - HTTP 410: if the file could not be read on disk (could be db/filesystem mismatch, or corrupt file)
   * - HTTP 200 + application/octet file: all is good, file delivered
   */
  router.get('/download/:download_key', async (req, res, next) => {
    const record = await database.getByDownloadKey(req.params.download_key)
    if (!record) {
      next({
        status: 404,
        message: "Could not find anything for given download key"
      })
      return
    }

    const expired = { status: 410, message: "File once existed, but is gone" }

    if (!!record.expired) {
      next(expired)
      return
    }

    const file = await filesystem.openReadClose(record.filename)
    if (!file) {
      next(expired)
      return
    }

    try {
      const stmt = await database.prepare("update accounting set last_accessed = ? where id = ?")
      await database.runStmt(stmt, [ Date.now(), record.id ])
    } catch {
      console.error("File last_accessed was not updated for id = " + record.id)
    }

    res.setHeader("Content-Disposition", `attachment; filename="${record.filename}"`)
    res.send(file)
  })

  return router
}