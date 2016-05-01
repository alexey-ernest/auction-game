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

