#!/usr/bin/env node

// import deps
import axios from 'axios'
import config from "../config"
import database from "../util/database"

// run pruning
(async () => {
    const publicUrl = config.public_url
    const pruningAge = config.pruning.older_than_ms

    console.log(`Finding schemata that haven't been accessed in the last ${pruningAge} milliseconds...`)

    const records = await database.getRecordsOlderThan(pruningAge)
    if (!records || records.length === 0) {
        console.error("No records eligible for expiration.")
        return
    }

    console.log(`Found ${records.length} records to expire. Now expiring the records...`)
    for (var record of records) {
        try {
            console.log(`Expiring record:${record.id}...`)
            await axios.delete(`${publicUrl}/delete/${record.delete_key}`)
            console.log(`Expired record:${record.id}.`)
        } catch (err) {
            const status = err.response.status
            switch (status) {
                case 404:
                    console.error(`Record not found for record:${record.id}.`)
                    break
                case 410:
                    console.error(`Record already expired for record:${record.id}.`)
                    break
                case 500:
                    console.error(`Error encountered for record:${record.id}.`)
                    break
                default:
                    console.error(`Unexpected status code ${status} for record:${record.id}.`)
                    break
            }
        }
    }

    console.log('Schemata pruned. Bye!')
})();

