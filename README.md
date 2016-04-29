# Auction Game
Auction game built on node.js and angular.js ([Angular Material](https://material.angularjs.org/latest/)).

* [Docker](#docker)
* [Tests](#tests)

## Docker

To build docker image, type:
```
$ docker build -t auction .
```

Or pull auto-built image from docker hub:
```
$ docker pull alexeyernest/auction-game
```

Run postgres container, for example:
```
docker run -d --name postgres -p 5432:5432 -e POSTGRES_DB=auction -e POSTGRES_USER=auction -e POSTGRES_PASSWORD=auction postgres:9.4
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
    created timestamp without time zone DEFAULT (now() at time zone 'utc'),
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

Then run a container with parameters.

| Parameter | Description |
|------------|-----------|
| POSTGRES_CONNECTION | Postgres connection string |
| TOKEN_SECRET | Secret string for encryping JWT tokens |
| DEBUG | Turn on debugging information, should be `auction-game:*` |

For example:
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
