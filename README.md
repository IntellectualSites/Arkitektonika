# Arkitektonika
Arkitektonika is a REST repository for NBT data. It accepts uploads of valid NBT data and stores them in a local folder while accounting for its metadata in a local sqlite database. Optionally, uploaded files can be expired based on the configurable age by running the prune script. Files can always be deleted via their deletion key.

**exemplary instance only**: https://ark.jacobandersen.dev

*This instance expires 30-minute old entries. It is not meant for production usage.*

## To Run
1. `git clone https://github.com/IntellectualSites/Arkitektonika.git`
2. `cd Arkitektonika`
3. `yarn install`
4. `yarn start`

## With Docker
Clone the entire repository or just grab the Dockerfile and put it in its own folder, then:
```
docker build -t intellectualsites/arkitektonika:custom .
docker run --name arkitektonika -p 3000:3000 \
	-v ./arkitektonika/schemata/:/app/schemata/ \
	-v ./arkitektonika/config.js:/app/app/config.js \
	-d intellectualsites/arkitektonika:custom
```

- If you use a different port in config.js (why?), the `-p` argument should be as so `-p [YOUR DESIRED EXT PORT]:[PORT IN CONFIG]`.
- If you use a different storage directory name (why?) (i.e., not `schemata`), then update the first `-v` argument to point to the correct folder name.

## As a Service
### SystemD
* Update the User, Group, and Working Directory for your scenario
```
[Unit]
Description=arkitektonika
After=network.target

[Service]
User=auser
Group=agroup
Restart=always
WorkingDirectory=/srv/arkitektonika
ExecStart=/usr/bin/yarn start

[Install]
WantedBy=multi-user.target
```

## Set up Expiration
Create a cron job that runs at whatever frequency you desire. As an example, this will run the pruning script every 12 hours:
```
0 */12 * * * cd /srv/arkitektonika && /usr/bin/yarn run app:prune
```

## Configuration
* `public_url`: the public facing URL that this arkitektonika instance is available on, required by the pruning script; **default: http://localhost:3000**.
* `multipart_param`: the name of the parameter that this arkitektonika instance accepts for file uploads; **default: schematic**.
* `storage_folder`: the name of the folder where files will be stored; **default: schemata**.
* `file_extension`: the file extension files uploaded will use; **default .schematic**.
* `pruning.older_than_ms`: how long since in milliseconds since last access until a file will be eligible for expiration (if using the pruning script); **default 604800000** (7 days).

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
    "download_key": "046e277eea874410b5a69d69101892f2",
    "delete_key": "1e125a08fa7041fe9de1078f4cc9fe2a"
}
```

The download key allows you to download the file, and the delete key lets you delete it. Share the `download_key`, but not the `delete_key`.

### Check download headers
**HEAD `PUBLIC_URL/download/:download_key`**: check what headers you'd get if you sent a download (GET) request for a file with the given `download_key`; example:
```bash
curl --location --head 'http://localhost:3000/download/d9f980a9ce0d4d8893f5a160a5b391ae'
```
The response for this is in the form of status codes only.
| code | meaning                                                       |
|------|---------------------------------------------------------------|
| 404  | file was not found in the accounting table                    |
| 410  | file metadata is in accounting table, but file is not on disk |
| 200  | file was found, prospective download would succeed            |

### Download a file
**GET `PUBLIC_URL/download/:download_key`**: download a file with the given `download_key`; example:
```bash
curl --location --request GET 'http://localhost:3000/download/db6186c8795740379d26fc61ecba1a24'
```
response:
see **Check download headers** above.

On success, the file is sent as an attachment for download to the browser / requestor.

### Check deletion headers
**HEAD `PUBLIC_URL/delete/:delete_key`**: check what headers you'd get if you sent a delete (DELETE) request for a file with the given `delete_key`; example:
```bash
curl --location --head 'http://localhost:3000/delete/11561161dffe4a1298992ce063be5ff9'
```
The response for this is in the form of status codes only.
| code | meaning                                                       |
|------|---------------------------------------------------------------|
| 404  | file was not found in the accounting table                    |
| 410  | file metadata is in accounting table, but file is not on disk |
| 200  | file was found, prospective deletion would succeed            |

### Delete a file
**DELETE `PUBLIC_URL/delete/:delete_key`**: delete a file with the given `delete_key`; example:
```bash
curl --location --request DELETE 'http://localhost:3000/delete/11561161dffe4a1298992ce063be5ff9'
```
response:
see **Check deletion headers** above.

On success, the file is deleted and the record is marked as expired in the database. 
