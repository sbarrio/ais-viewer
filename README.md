## AIS Viewer

## Intro

This piece of software is an implementation of the coding challenge propsed [here](https://github.com/orca-io/orca-challenges/tree/master/challenge-ais-viewer). The aim of this exercise is to build an end to end system that ingests AIS data from [aistream.io](https://aisstream.io), processes and stores it and then is able to provide said information to client apps that want to obtain status and position info of vessels contained inside a specific coordinate bounding box. Said apps will then expose this info on a map on which the end user can navigate freely, while the content presented gets updated periodically and presented in semi-real time.

## Tech stack

The proposed solution has been implemented on the following tech stack:

### Backend

- [PostgreSQL](https://www.postgresql.org/) Database with [PostGIS](https://www.postgis.net/) extension installed to allow easier use and performance when dealing with geolocation data
- [node.js](https://nodejs.org/en) running on an [express server](https://expressjs.com/)
  - express json module to manage json requests/responses
  - [node postgres](https://node-postgres.com/e) module to manage postgres connection and querying
  - [uuid](https://www.npmjs.com/package/uuid) module to generate unique session ids
  - [ws](https://www.npmjs.com/package/ws) to manage connection to web sockets

### Frontend

- [React Native](https://reactnative.dev/) 0.74.2
- [Maplibre-react-native](https://github.com/maplibre/maplibre-react-native) for Map rendering

## Implementation considerations

The main goal for this solution is to allow several clients to be connected to the backend at the same time, each one of them consulting a specific area of the map, and the backend providing the updated ship information of vessels contained in that area to each one of them.

Since the aistream API allows us to subscribe to a websocket and provide an array of bounding boxes from which to obtain ship data, we can easily limit our querying to the active clients querying for info instead of querying the API for the whole ship list.

### Ingestion

First, when the server is started, it opens up a webscoket connection with the aistream.io API and (initially provides an empty list of bounding boxes for which to obtain info). Once a bounding box is provided (via subscription), the socket will start providing information about that area. This information is parsed and processed, and stored into a ship database wihch holds the ship's name, MMSI, heading and position, as well as a last updated DATE that will get updated every time the ship entry gets inserted or updated. Ships are identified by their MMSI as primaary keys, and their locations are stored as GEOGRAPHY Points (provided by PostGIS) and then indexed for faster querying.

While the bounding box subscription is kept, the backend will continue to obtain ship information and update it on the ship table.

Ships on the ship table are persisted and not deleted, so if the server is taken down that information is still available (although not up to date until the socket is requested for information inside that area again).

### Subscriptions

In order for the backend to allow and support for different clients querying the system, I've set up a subscription table, which holds a session ID in the form of a generated UUID and a bounding box stored as a GEOMETRY(LINESTRING, 4326), as well as a creation date and a last updated date. When a client performs a get requests to the /ships endpoint it provides a bounding box and a sessionId value as part of the request header. If the session id is missing or does not exist, the backend creates a new one and inserts a ubscription entry on the table. Then, a periodic task that runs every X seconds reads the subscription table, obtains a list of bounding boxes and updates the web socket subscription to the aistream.io API with them. That way the ingestion system will start populating the ship table with ships located inside the required areas.

Also, part of this process also checks for stale subscriptions that have been unqueried for a specific amount of time (15 seconds with the current config). Stale subscriptions get deleted from the subscription table, and then, when the socket subsription update takes place, their bounding boxes are removed from the array, ending our ingestion of ship info for that area.

### Client

With the backend set up, the client app is fairly straightforward. On startup the app renders the map with the initial set of coordinates provided by the config and then attempts to GET the /ships endpoint with the current bounding box if the zoom level is between 12 and 20 (otherwise it requests nothing). Since that query initially does not hold a session id, once the first request succeedes the app takes the sesssion id from the header and stores it locally, making sure to send it from now on as part of the next request headers.

When the user scrolls through the map the viewport bounding box changes, and that's sent as part of the GET ships/ request, which in turn triggers the subcription to be updated on the backend and the ingestion system to start getting information about that area accordingly.

### Benefits

Since the ingestion system is only concerned by populating the database with data coming from the socket at any time and the querying system only reads data from the ship table (instead of chaining requests from end to end) we make sure there are no possible concurrency and interlocking issues. Moreover, thanks to the subscription system we allow the system to only fetch the information it needs and to support several users concurrently.

### Future improvements

Due to time considerations there have been many areas that should be considered for immediate improvement were us to continue with the development of the system.

- Optimization of bounding box querying towards the websocket. If a bounding box contains another one we should only subscribe for the larger one.
- Security - Filtering wrongful requests, managing parallel connection abuse, setting up request throtlling.
- Better error handling.
- Introduce proper tests for endppint and database access logic.
- Manage high latency scenarios on the app, allowing for request cancelling schemes.
- Introducing a local database to be able to provide information when app goes offline.
- Better UI, introduce react navigation to allow for a fully functional app.

## Setup and running

- Clone the repository whrever you like. You'll see the folder contains 3 folders: `db`, `server` and `client`.

### Backend

- Download [Postgres app](https://postgresapp.com/), create a new database by running `/db/create.sql` script. Set up credentials as seen fit. You can jsut do the same on your existing PostgreSQL installation, be it via console or Visual GUI app.
- Navigate to `/server` and run `npm install`.
- Set up database configuration on `/server/constants.js` under the `DB Config` section.
- Run `node app.js` to launch the server.
- If everything worked fine you should see the server listening the configured port and a message stating the current bounding box subscriptions being sent via the socket every few seconds.

### Client

- Navigate to `/client` and run `yarn install`
- navigate to `/client/ios` folder and run `pod install`
- Go to `/client/src/api/constants.ts` and fill in the `API_HOST` constant with the url and port on which you have started the server.
- Run `yarn start` to start the metro server (if running on debug mode). Make sure you have at least one simulator/real device connected available.
- Run `yarn ios` or `yarn android` to launch the app. Alternatively you can launch the app as well from XCode or Android Studio.
