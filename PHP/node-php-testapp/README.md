This is a quick example to test NodeJS -> PHP context propagation reporting to public Satellites.

### Setup

* Run the mysql server `docker-compose up -d`
* Set the environment variable `LIGHTSTEP_ACCESS_TOKEN` to your access token obtained from Lightstep project settings. 


### Run NodeJS server

```bash 
$ cd nodejs
$ npm install
$ node server.js
```

### Run PHP Server

```bash
$ cd php
$ composer install
$ php -S 0.0.0.0:3001 api.php
```

### Test
* Visit `localhost:3000` 
* Verify that the spans arrive at `app.lightstep.com`

You should have a connected trace from `nodejs-server` to `php-server`
