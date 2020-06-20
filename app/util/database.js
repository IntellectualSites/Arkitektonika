import sqlite from 'sqlite3'

const database =  new (sqlite.verbose()).cached.Database(__dirname + '/../../database.db')

export default {
    /**
     * Wraps sqlite prepare in a promise
     * @param {string} raw  the raw sql statement with inputs substituted with question marks
     */
    prepare(raw) {
        return new Promise((resolve, reject) => {
            const stmt = database.prepare(raw, (err) => {
                if (err) {
                    reject("Failed to prepare SQL statement")
                } else {
                    resolve(stmt)
                }
            })
        })
    },

    /**
     * Wraps sqlite database#run in a promise
     * @param {string} raw the raw sql statement with inputs substituted with question marks
     * @param {array} args the args that the substitute marks represent
     */
    run(raw, args) {
        return new Promise((resolve, reject) => {
            database.run(raw, args, (err) => {
                if (err) {
                    console.log(err)
                    reject("Failed to run raw SQL statement")
                } else {
                    resolve()
                }
            })
        })
    },

    /**
     * Wraps sqlite Statement#run in a promise
     * @param {Statement} stmt the Statement to run with the given args
     * @param {array} args the args that were baked into the Statement
     */
    runStmt(stmt, args) {
        return new Promise((resolve, reject) => {
            stmt.run(args, (err) => {
                if (err) {
                    reject("Failed to run prepared SQL statement")
                } else {
                    resolve()
                }
            }).finalize()
        })
    },

    /**
     * Wraps sqlite Statement#get in a promise
     * @param {Statement} stmt the Statement to get with the given args
     * @param {array} args the args that were baked into the Statement
     */
    getStmt(stmt, args) {
        return new Promise((resolve, reject) => {
            stmt.get(args, (err, row) => {
                if (err) {
                    reject("Failed to get prepared SQL statement")
                } else {
                    resolve(row)
                }
            }).finalize()
        })
    },

    /**
     * Inserts a new schematic record into the accounting table
     * @param {string} filename the filename on disk
     * @param {string} download_key the key used to download the file
     * @param {string} delete_key the key used to delete the file
     */
    async insertRecord(filename, download_key, delete_key) {
        try {
            const stmt = await this.prepare("insert into accounting (filename, download_key, delete_key, last_accessed, expired) values (?, ?, ?, ?, ?)")
            await this.runStmt(stmt, [ filename, download_key, delete_key, Date.now(), false ])
          } catch {
            return undefined
          }
          
          return true
    },

    /**
     * Expires a record in the accounting table
     * @param {integer} id the id of the record to set as expired 
     */
    async expireRecord(id) {
        try {
            const stmt = await this.prepare("update accounting set expired = 1 where id = ?")
            await this.runStmt(stmt, [ id ])
        } catch {
            return undefined
        }

        return true
    },

    /**
     * Gets a record by its download key
     * @param {string} download_key the key used to download the file 
     */
    async getByDownloadKey(download_key) {
        let record
      
        try {
          const stmt = await this.prepare("select * from accounting where download_key = ? limit 1")
          record = await this.getStmt(stmt, [ download_key ])
        } catch {
          return undefined
        }
      
        return record
    },

    /**
     * Gets a record by its delete key
     * @param {string} delete_key the key used to delete the file 
     */
    async getByDeleteKey(delete_key) {
        let record
      
        try {
          const stmt = await this.prepare("select * from accounting where delete_key = ? limit 1")
          record = await this.getStmt(stmt, [ delete_key ])
        } catch {
          return undefined
        }
      
        return record
    },

    /**
     * Initializes the table and indices
     */
    async init() {
        await this.run(
            `create table if not exists accounting (
                id integer not null,
                filename char(33) not null,
                download_key char(32) not null,
                delete_key char(32) not null,
                expired integer not null,
                constraint accounting_pk primary key (id autoincrement)
            );`
          )
          
          await this.run(`create unique index if not exists accounting_id_uindex on accounting (id);`)
          await this.run(`create unique index if not exists accounting_filename_uindex on accounting (filename);`)
          await this.run(`create unique index if not exists accounting_download_key_uindex on accounting (download_key);`)
          await this.run(`create unique index if not exists accounting_delete_key_uindex on accounting (delete_key);`)
    }
}