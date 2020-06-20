import express from 'express'
import multer from 'multer'
import filesystem from '../util/filesystem'
import nbt from '../util/nbt'
import { v4 as uuidv4 } from 'uuid'
import config from '../config'

export default (database) => {
  const router = express.Router() 
  
  const storage = multer.diskStorage({
    destination: __dirname + `/../../${config.storage_folder}`,
    filename(req, file, cb) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, unique + config.file_extension)
    }
  })

  const upload = multer({ storage })

  /**
   * Uploads a valid NBT-formatted file to arkitektonika.
   * The request must come via POST and as multipart/form-data.
   * Returns:
   * - HTTP 500: the file could not be read or the accounting table could not be updated
   * - HTTP 400: the file is not valid NBT
   * - HTTP 200: the file was valid NBT and was accepted by arkitektonika; the response body contains a download_key and delete_key which are self-explanatory.
   */
  router.post('/upload', upload.single(config.multipart_param), async (req, res, next) => {
    const filename = req.file.filename
    const file = await filesystem.openReadClose(filename)
    if (!file) {
      next(new Error("File could not be read"))
      return
    }

    const parsed = await nbt.read(file)
    if (!parsed) {
      await filesystem.deleteSchemata(filename)
      next({
        status: 400,
        message: "File is not valid NBT, upload rejected"
      })
      return
    }

    const download_key = uuidv4().replace(/-/g, "")
    const delete_key = uuidv4().replace(/-/g, "")
    
    const inserted = await database.insertRecord(filename, download_key, delete_key)
    if (!inserted) {
      await filesystem.deleteSchemata(filename)
      next(new Error("Failed to update accounting table"))
      return
    }

    res.json({ download_key, delete_key })
  });

  return router
}
