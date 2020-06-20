import nbt from 'nbt'

export default {
    /**
     * Wraps nbt#parse in a promise
     * @param {Buffer} file the file buffer to parse as NBT 
     */
    parse(file) {
        return new Promise((resolve, reject) => {
            try {
                nbt.parse(file, (err, data) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    resolve(data);
                })
            } catch (err) {
                reject(err)
            }
        })
    },

    /**
     * Parses a file buffer as NBT
     * @param {Buffer} file the file buffer to parse as NBT 
     */
    async read(file) {
        let parsed

        try {
          parsed = await this.parse(file)
        } catch {
          return undefined
        }

        return parsed
    }
}