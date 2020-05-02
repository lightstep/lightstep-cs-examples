This is a quick example to test NodeJS -> PHP context propagation reporting to public Satellites.

### Setup

* Run the mysql server `docker-compose up -d`
* Update your "access-token" in both `nodejs/server.js` and `php/api.php`

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
* Verify that the traces show up at `app.lightstep.com`

You should have a connected trace from `nodejs-server` to `php-server`
