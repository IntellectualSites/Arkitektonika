# Arkitektonika

<p>
    <img src="https://raw.githubusercontent.com/IntellectualSites/Assets/main/standalone/Arkitektonika/Arkitektonika.png" width="150">
</p>

---

Arkitektonika is a REST repository for NBT data. It accepts uploads of valid NBT data and stores them in a local folder
while accounting for its metadata in a local sqlite database. Optionally, uploaded files can be expired based on the
configurable age by running the prune script. Files can always be deleted via their deletion key.

Example Instances:

| Address                           | Expiry     |
|-----------------------------------|------------|
| https://api.schematic.cloud/      | 30 days    |

## To Run

### With Docker

```sh
docker pull intellectualsites/arkitektonika
```

Available on https://hub.docker.com/r/intellectualsites/arkitektonika

### From scratch

```sh
git clone https://github.com/IntellectualSites/Arkitektonika.git &&
cd Arkitektonika &&
yarn install
```

#### With Typescript transpiling (recommended)

```sh
yarn start:prod
```

#### Without Typescript transpiling

```sh
yarn start
```

### Build image locally

Clone the entire repository and run the following commands:

```sh
docker build -t intellectualsites/arkitektonika:<TAG> .
```

---

Example docker compose:

```yaml
version: '3.8'

services:
  arkitektonika:
    container_name: Arkitektonika
    image: intellectualsites/arkitektonika:dev
    restart: unless-stopped
    volumes:
      - /home/ark/data:/data # Mount the data folder (containing config file, database and schematic storage)
    environment:
      - LOG_LEVEL=DEBUG   # if debug logs should be printed to the console
```

`/data` is mounted to the host at `/home/ark/data` as that folder contains persistent data.

## Prune data

Execute the start command with the prune flag to execute the prune routine:
```sh
yarn start:prod --prune
```

## Set up Expiration

Create a cron job that runs at whatever frequency you desire. As an example, this will run the pruning script every 12
hours:

```sh
0 */12 * * * cd /srv/arkitektonika && /usr/bin/yarn start:prod --prune
```

Or with a docker-compose configuration:

```sh
0 */12 * * * cd /srv/arkitektonika && docker-compose run --rm arkitektonika node app/launch.js --prune
```

## Configuration

```json
{
  "port": 3000,
  "prune": 1800000,
  "maxIterations": 20,
  "maxSchematicSize": 1000000,
  "limiter": {
    "windowMs": 60000,
    "delayAfter": 30,
    "delayMs": 500
  }
}
```

| Config Key         | Description                                                                                                                |
|--------------------|----------------------------------------------------------------------------------------------------------------------------|
| port               | on which port should the application bind                                                                                  |
| prune              | defines how old records must be to be deleted by the prune script (in ms)                                                  |
| maxIterations      | maximum amount of iterations to obtain a unique download and deletion token                                                |
| maxSchematicSize   | maximum size of schematic files to be accepted (in bytes)                                                                  |
| limiter.windowMs   | the frame of the limiter (after what duration should the limit gets reset)                                                 |
| limiter.delayAfter | After how many requests during windowMs should delayMs be applied                                                          |
| limiter.delayMs    | How many ms should the request take longer. Formula: `currentRequestDelay = (currentRequestAmount - delayAfter) * delayMs` |

## File structure:

```
data
├── config.json
├── database.db
└── schemata
    ├── fe65d7edc37149c47171962dc26a039b
    └── a98f299c5cf294e6555617e83226bcdd
```

`config.json` holds the user configuration data <br>
`database.db` holds the required data for each schematic <br>
`schemata`    holds all schematic file data

### Routes

All routes will be available at the exposed port (e.g. `localhost:3000`).

### Upload a file

**POST `INSTANCE_URL/upload`**: send your file as multipart/form-data; example:

```sh
curl --location --request POST 'http://localhost:3000/upload' \
--form 'schematic=@/path/to/plot.schem'
```

response:

| code | meaning                                                              |
|------|----------------------------------------------------------------------|
| 200  | file was of valid NBT format and was accepted                        |
| 400  | file was not of valid NBT format                                     |
| 413  | file payload was too large and rejected                              |
| 500  | file could not be found on disk after being uploaded (upload failed) |

success body:

```json
{
  "download_key": "db6186c8795740379d26fc61ecba1a24",
  "delete_key": "11561161dffe4a1298992ce063be5ff9"
}
```

The download key allows you to download the file, and the delete key lets you delete it. Share the `download_key`, but
not the `delete_key`.

### Check download headers

**HEAD `INSTANCE_URL/download/:download_key`**: check what headers you'd get if you sent a POST request for a file with
the given download_key; example:

```sh
curl --location --head 'http://localhost:3000/download/db6186c8795740379d26fc61ecba1a24'
```

The response for this is in the form of status codes only.

| Status-Code | Meaning                                                                                |
|-------------|----------------------------------------------------------------------------------------|
| 200         | File was found, prospective download would succeed                                     |
| 404         | File was not found in the database                                                     |
| 410         | File metadata is in accounting table, but file is not on disk or already expired       |
| 500         | An internal server error occurred due to corrupted metadata (missing data in database) |

### Download a file

**GET `INSTANCE_URL/download/:download_key`**: download a file with the given `download_key`; example:

```sh
curl --location --request GET 'http://localhost:3000/download/db6186c8795740379d26fc61ecba1a24'
```

response:
see **Check download headers** above.

On success, the file is sent as an attachment for download to the browser / requester.

### Check deletion headers

**HEAD `INSTANCE_URL/delete/:delete_key`**: check what headers you'd get if you sent a DELETE request for a file with
the given delete_key; example:

```sh
curl --location --head 'http://localhost:3000/delete/11561161dffe4a1298992ce063be5ff9'
```

The response for this is in the form of status codes only.

| Status-Code | Meaning                                                                                |
|-------------|----------------------------------------------------------------------------------------|
| 200         | File was found, prospective deletion would succeed                                     |
| 404         | File was not found in the database                                                     |
| 410         | File metadata is in accounting table, but file is not on disk or already expired       |
| 500         | An internal server error occurred due to corrupted metadata (missing data in database) |

### Delete a file

**DELETE `PUBLIC_URL/delete/:delete_key`**: delete a file with the given `delete_key`; example:

```sh
curl --location --request DELETE 'http://localhost:3000/delete/11561161dffe4a1298992ce063be5ff9'
```

response:
see **Check deletion headers** above.

On success, the file is deleted and the record is marked as expired in the database. 
