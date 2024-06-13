const pg = require('pg');
const { Pool } = pg
const { DB_CONFIG } = require('./constants');
const pool = new Pool(DB_CONFIG);
const { parseLineString } = require('./helpers');

const listShips = async (boundingBox, minutes) => {
    const client = await pool.connect();

    const query = `
        SELECT id, name, ARRAY[ST_X(position::geometry), ST_Y(position::geometry)] AS position, heading
        FROM ship
        WHERE 
            position && ST_MakeEnvelope($1, $2, $3, $4, 4326)::geography
            AND last_updated >= NOW() - INTERVAL '${minutes} minutes';
    `;

    
    const values = [boundingBox[0][1], boundingBox[0][0], boundingBox[1][1], boundingBox[1][0]];

    try {
        const res = await client.query(query, values);
        return res.rows;
      } catch (err) {
        console.error('Error retrieving ships in bounding box ', err);
      } finally {
        client.release();
      }
}

const addShip = async (id, name, latitude, longitude, heading) => {
    const client = await pool.connect();
  
    const query = `
      INSERT INTO ship (id, name, position, heading)
      VALUES ($1, $2, ST_GeogFromText($3), $4)
      ON CONFLICT (id) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        position = EXCLUDED.position,
        heading = EXCLUDED.heading,
        last_updated = NOW();
    `;
  
    const values = [id, name, `SRID=4326;POINT(${longitude} ${latitude})`, heading];
  
    try {
      await client.query(query, values);
    } catch (err) {
      console.error('Error during ship upsert: ', err);
    } finally {
      client.release();
    }
};

const listSubscriptions = async () => {
    const client = await pool.connect();
    try {
      const query = `
      SELECT session_id, ST_AsText(bounding_box) AS bounding_box, created_at, last_updated
      FROM subscription
    `;
    const result = await client.query(query);

    const subscriptions = result.rows.map(subscription => {
        return {
            session_id: subscription.session_id,
            bounding_box: parseLineString(subscription.bounding_box),
            created_at: subscription.created_at,
            last_updated: subscription.last_updated
          };
    });

    return subscriptions;
    } catch (err) {
      console.error('Error retrieving subscriptions: ', err);
      throw err;
    } finally {
      client.release();
    }
}

const addSubscription = async(sessionId, boundingBox) => {
    let added = false;
    const client = await pool.connect();
    try {
        const lineString = `LINESTRING(${boundingBox.map(coord => `${coord[1]} ${coord[0]}`).join(', ')})`;
        const query = `
          INSERT INTO subscription (session_id, bounding_box, created_at, last_updated)
          VALUES ($1, ST_GeomFromText($2, 4326), NOW(), NOW())
          ON CONFLICT (session_id)
          DO UPDATE SET
            bounding_box = EXCLUDED.bounding_box,
            last_updated = NOW();
        `;
    
        const values = [sessionId, lineString];

        await client.query(query, values);
        added = true;
    } catch (err) {
        console.error('Error during subscription: upsert: ', err);
    } finally {
        client.release();
        return added;
    }
}

const deleteStaleSubscriptions = async (maxStaleSeconds) => {
    const client = await pool.connect();

    try {
      const query = `
        DELETE FROM subscription
        WHERE last_updated < NOW() - INTERVAL '${maxStaleSeconds} seconds';
      `;

      const result = await client.query(query);

      if (result.rowCount > 0) {
        console.log(`${result.rowCount} subscription(s) deleted due to inactivity`);
      }
    } catch (err) {
      console.error('Error deleting stale subscriptions: ', err);
    } finally {
      client.release();
    }
  };

  module.exports = {
    listShips,
    addShip,
    listSubscriptions,
    addSubscription,
    deleteStaleSubscriptions,
  };