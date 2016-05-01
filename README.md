# Auction Game
Auction game built on node.js and angular.js

* [Technologies](#technologies)
* [UI](#ui)
* [How to Run](#how-to-run)
* [Tests](#tests)
* [Example](#example)

## Technologies
* Postgres for persistency
* Node.js + Express.js for HTTP server and API
* Socket.io for efficient client-server event-based communication
* Passport.js for JWT tokens
* Angular.js for UI
* Angular Material for Material design
* Jade for templating
* Stylus for CSS
* Font Awesome and Flaticon icons
* Gulp for compiling UI
* Mocha.js for testing
* Docker for running and deploying the application everywhere


## UI
Web UI is built on Angular.js

* Angular Material design standards by [Angular Material](https://material.angularjs.org/latest/) framework
* Mobile friendly
* Pure static (can be served using Nginx as a separate application)

<img src="assets/auction-design.png" width="400">


## How to Run
The easies way to run it inside Docker container.

To build docker image, type:
```
$ docker build -t auction .
```

Or pull auto-built image from docker hub:
```
$ docker pull alexeyernest/auction-game
```

If you don't have Postgres running, run postgres container, for example:
```
$ docker run -d --name postgres -p 5432:5432 -e POSTGRES_DB=auction -e POSTGRES_USER=auction -e POSTGRES_PASSWORD=auction postgres:9.4
```

And create db schema using [schema.sql](database/schema.sql):
```
-- Players

CREATE SEQUENCE players_serial;

CREATE TABLE players (
    id integer PRIMARY KEY DEFAULT nextval('players_serial'),
    name varchar(50),
    coins integer NOT NULL,
    CONSTRAINT player UNIQUE(name)
);

ALTER SEQUENCE players_serial owned by players.id;


-- Session

CREATE TABLE player_sessions (
    player_id integer NOT NULL PRIMARY KEY REFERENCES players ON DELETE CASCADE,
    session_id varchar NOT NULL
);


-- Inventory

CREATE SEQUENCE inventory_serial;

CREATE TABLE inventory (
    id integer PRIMARY KEY DEFAULT nextval('inventory_serial'),
    player_id integer NOT NULL REFERENCES players ON DELETE CASCADE,
    item varchar(100) NOT NULL,
    quantity integer NOT NULL
);

ALTER SEQUENCE inventory_serial owned by inventory.id;

CREATE UNIQUE INDEX player_items ON inventory (player_id, item);


-- Auction

CREATE SEQUENCE auction_serial;

CREATE TABLE auctions (
    id integer PRIMARY KEY DEFAULT nextval('auction_serial'),
    created timestamp without time zone NOT NULL,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    seller integer NOT NULL REFERENCES players ON DELETE CASCADE,
    seller_name varchar(50) NOT NULL,
    item varchar(100) NOT NULL,
    quantity integer NOT NULL,
    min_bid integer NOT NULL,
    bid integer,
    winner integer,
    winner_name varchar(50),
    done boolean DEFAULT FALSE
);

ALTER SEQUENCE auction_serial owned by auctions.id;

CREATE INDEX auction_queue ON auctions (start_time, created);
CREATE INDEX auction_latest ON auctions (end_time);
CREATE INDEX auction_current ON auctions (start_time, end_time);
```

Then run auction container with parameters.

| Parameter | Description |
|------------|-----------|
| POSTGRES_CONNECTION | Postgres connection string |
| TOKEN_SECRET | Secret string for encryping JWT tokens |
| DEBUG | Turn on debugging information, should be `auction-game:*` |

For example:
```
$ docker run -d --name auction -p 8080:8080 -e POSTGRES_CONNECTION=postgres://auction:auction@192.168.99.100:5432/auction -e TOKEN_SECRET=secret -e DEBUG=auction-game:* auction
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

## Example
Latest build is deployed to AWS EC2 Container Service. You can try it by IP address: http://52.58.101.233/
