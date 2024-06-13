-- Database 
CREATE DATABASE ais
    WITH
    OWNER = sbarrio
    ENCODING = 'UTF8'
    LOCALE_PROVIDER = 'libc'
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

CREATE EXTENSION IF NOT EXISTS postgis;


-- Table schema 
CREATE TABLE ship (
    id SERIAL PRIMARY KEY,
    position GEOGRAPHY(Point, 4326),
    name VARCHAR(255),
    heading INT
    last_updated TIMESTAMP NOT NULL DEFAULT NOW();
);

CREATE INDEX idx_ship_position ON ship USING GIST (position);

CREATE TABLE subscription (
    session_id UUID PRIMARY KEY,
    bounding_box GEOMETRY(LINESTRING, 4326),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Test data
INSERT INTO ship (name, position, heading) VALUES
    ('Ship A', ST_GeogFromText('SRID=4326;POINT(-74.006 40.7128)'),90),
    ('Ship B', ST_GeogFromText('SRID=4326;POINT(139.6917 35.6895)'), 131);