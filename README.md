# Auction Game
Auction game built on node.js and angular.js

* [Docker](#docker)
* [Tests](#tests)

## Docker

To build docker image:
```
$ docker build -t auction .
```

Or pull auto-built image from docker hub:
```
$ docker pull alexeyernest/auction-game
```

Run Postgres container, for example:
```
docker run -d --name postgres -p 5432:5432 -e POSTGRES_DB=auction -e POSTGRES_USER=auction -e POSTGRES_PASSWORD=auction postgres:9.4
```

And create db schema using [schema.sql](database/schema.sql).

Then run a container with parameters, for example:
```
docker run -d --name auction -p 8080:8080 -e POSTGRES_CONNECTION=postgres://auction:auction@192.168.99.100:5432/auction -e SESSION_SECRET=secret -e DEBUG=auction-game:* auction
```


## Tests
To run tests you have to install [mocha.js](http://npmjs.com/package/mocha):
```
$ npm install -g mocha
```

Navigate to project folder and type:
```
$ mocha test/* --recursive
```