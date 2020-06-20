import fs from 'fs'

const schemataPath = __dirname + '/../../schemata/'

export default {
    /**
     * Wraps fs#open in a promise
     * @param {string} filename the filename to open at schemataPath
     */
    openHandle(filename) {
        return new Promise((resolve, reject) => {
            fs.open(schemataPath + filename, (err, fd) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(fd)
                }
            })
        })
    },

    /**
     * Wraps fs#close in a promise
     * @param {integer} descriptor the file descriptor to close
     */
    closeHandle(descriptor) {
        return new Promise((resolve, reject) => {
            fs.close(descriptor, (err) => {
                if (err) {
                    reject(err)
                }

                resolve()
            })
        })
    },

    /**
     * Wraps fs#read in a promise
     * @param {integer} descriptor the file descriptor to read
     */
    readSchemata(descriptor) {
        return new Promise((resolve, reject) => {
            const buffer = Buffer.alloc(16384)
            fs.read(descriptor, buffer, 0, buffer.length, null, (err, bytesRead, buffer) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(buffer)
                }
            })
        })
    },

    /**
     * Wraps fs#unlink in a promise
     * @param {string} filename the filename to unlink (delete)
     */
    deleteSchemata(filename) {
        return new Promise((resolve, reject) => {
            fs.unlink(schemataPath + filename, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    },

    /**
     * Calls openHandle, readSchemta, and closeHandle in one fell swoop, then returns the buffer
     * @param {string} filename the filename to open, read, and close at schemataPath
     */
    async openReadClose(filename) {
        let file
      
        try {
          const descriptor = await this.openHandle(filename)
          file = await this.readSchemata(descriptor)
          await this.closeHandle(descriptor)
        } catch {
          return undefined
        }
      
        return file
      }
}