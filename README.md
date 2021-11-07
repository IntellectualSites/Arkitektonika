# Arkitektonika

Arkitektonika is a REST repository for NBT data. It accepts uploads of valid NBT data and stores them in a local folder
while accounting for its metadata in a local sqlite database. Optionally, uploaded files can be expired based on the
configurable age by running the prune script. Files can always be deleted via their deletion key.

Example Instances:

| Address                           | Expiry     |
|-----------------------------------|------------|
| https://ark.jacobandersen.dev     | 30 minutes |
| https://arkitektonika.pschwang.eu | 4 hours    |

## To Run

1. `git clone https://github.com/IntellectualSites/Arkitektonika.git`
2. `cd Arkitektonika`
3. `yarn install`

#### without Typescript transpiling

4. `yarn start`

#### with Typescript transpiling (recommended)

4. `yarn start:prod`

## With Docker

---

### prebuilt images

Prebuilt image available at https://hub.docker.com/r/pierreschwang/arkitektonika

### built image locally

Clone the entire repository and run the following commands:

```
docker build -t intellectualsites/arkitektonika:custom .
```

---

Example docker compose:

````yaml
version: '3.8'

services:
  arkitektonika:
    container_name: Arkitektonika
    image: pierreschwang/arkitektonika:dev
    restart: unless-stopped
    volumes:
      - ./data:/app/data
    environment:
      - LOG_LEVEL=DEBUG   # if debug logs should be printed to the console 
    networks:
      web:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.arkitektonika.entrypoints=web"
      - "traefik.http.routers.arkitektonika.rule=Host(`arkitektonika.pschwang.eu`)"
      - "traefik.http.middlewares.arkitektonika-https-redirect.redirectscheme.scheme=https"
      - "traefik.http.routers.arkitektonika.middlewares=arkitektonika-https-redirect"
      - "traefik.http.routers.arkitektonika-secure.entrypoints=websecure"
      - "traefik.http.routers.arkitektonika-secure.rule=Host(`arkitektonika.pschwang.eu`)"
      - "traefik.http.routers.arkitektonika-secure.tls=true"
      - "traefik.http.routers.arkitektonika-secure.tls.certresolver=cloudflare"
      - "traefik.http.routers.arkitektonika-secure.service=arkitektonika"
      - "traefik.http.services.arkitektonika.loadbalancer.server.port=3000"
      - "traefik.docker.network=web"

networks:
  web:
    external: true
````

`/app/data` is mounted to the host at `/data` as that folder contains persistent data.

## Prune data
Execute the start command with the prune flag to execute the prune routine:
``yarn start:prod --prune``

## Set up Expiration

Create a cron job that runs at whatever frequency you desire. As an example, this will run the pruning script every 12
hours:

```
0 */12 * * * cd /srv/arkitektonika && /usr/bin/yarn start:prod --prune
```

Or with a docker-compose configuration:
````
0 */12 * * * cd /srv/arkitektonika && docker-compose run arkitektonika node app/launch.js --prune
````

## Configuration

````json
{
  // on which port should the application bind
  "port": 3000,
  // defines how old records must be to be deleted by the prune script (in ms)
  "prune": 1800000,
  // maximum amount of iterations to obtain a unique download and deletion token
  "maxIterations": 20
}
````

## File structure:

````
data
├── config.json
├── database.db
└── schemata
    ├── 3319b_VhnQPbcFYx4WSAjakburVh19Dy
    └── YzXYIQCH63AUSWQOxF0MJoPhg0NXGpO6
````

`config.json` holds the user configuration data <br>
`database.db` holds the required data for each schematic <br>
`schemata`    holds all schematic file data

## Routes

`PUBLIC_URL` will stand for the configured public url in the config file.

### Upload a file

**POST `PUBLIC_URL/upload`**: send your file as multipart/form-data; example:

```bash
curl --location --request POST 'http://localhost:3000/upload' \
--form 'schematic=@/path/to/plot.schem'
```

response:
| code | meaning                                                              |
|------|----------------------------------------------------------------------|
| 500  | file could not be found on disk after being uploaded (upload failed) |
| 400  | file was not of valid NBT format                                     |
| 200  | file was of valid NBT format and was accepted                        |

success body:

```json
{
  "download_key": "3319b_VhnQPbcFYx4WSAjakburVh19Dy",
  "delete_key": "YzXYIQCH63AUSWQOxF0MJoPhg0NXGpO6"
}
```

The download key allows you to download the file, and the delete key lets you delete it. Share the `download_key`, but
not the `delete_key`.

### Download a file

**GET `PUBLIC_URL/download/:download_key`**: download a file with the given `download_key`; example:

```bash
curl --location --request GET 'http://localhost:3000/download/db6186c8795740379d26fc61ecba1a24'
```

response:
see **Check download headers** above.

On success, the file is sent as an attachment for download to the browser / requestor.

### Delete a file

**DELETE `PUBLIC_URL/delete/:delete_key`**: delete a file with the given `delete_key`; example:

```bash
curl --location --request DELETE 'http://localhost:3000/delete/11561161dffe4a1298992ce063be5ff9'
```

response:
see **Check deletion headers** above.

On success, the file is deleted and the record is marked as expired in the database. 
