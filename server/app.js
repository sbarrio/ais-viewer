const express = require('express')
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const {listShips, listSubscriptions, addShip, addSubscription, deleteStaleSubscriptions} = require("./db");
const { 
    AIS_WSS_SOCKET, 
    AIS_API_KEY, 
    API_PORT, 
    UPDATE_SUBSCRIPTIONS_INTERVAL, 
    MAX_AGE_MINUTES, 
    MAX_STALE_SUBSCRIPTION_SECONDS
} = require('./constants');

const app = express()
app.use(express.json());

const socket = new WebSocket(AIS_WSS_SOCKET);

// AIS service web socket
subscribeToAIS = (boxes) => {
    console.log("Current subscriptions:", boxes);
    let subscriptionMessage = {
        Apikey: AIS_API_KEY,
        BoundingBoxes: boxes,
        FilterMessageTypes: ["PositionReport"]
    }
    socket.send(JSON.stringify(subscriptionMessage));
}

onAISSocketMessage = (event) => {
    let aisMessage = JSON.parse(event.data);
    const { TrueHeading: heading, Latitude: latitude, Longitude: longitude} = aisMessage.Message.PositionReport;
    const { MMSI: id, ShipName:name } = aisMessage.MetaData;
    addShip(id, name, latitude, longitude, heading);
}

socket.onopen = function (_) {
    subscribeToAIS([]);
};

socket.onmessage = function (event) {
    onAISSocketMessage(event);
};

// Endpoints

// Returns a list of ships contained inside a specific bounding box
// It also creates/updates a subscription for said boundbing box
app.get("/ships", async (req, res) => {
    let sessionId = req.headers['session_id'];
    if (!sessionId) {
        sessionId =  uuidv4();
    }

    const { lat1, lon1, lat2, lon2 } = req.query;
    if (!lat1 || !lon1 || !lat2 || !lon2) {
        return res.status(400).json("Missing query parameters: lat1, lon1, lat2, lon2");
    }

    const boundingBox = [
        [parseFloat(lat1), parseFloat(lon1)],
        [parseFloat(lat2), parseFloat(lon2)]
    ];

    // We refresh the subscription to keep it alive
    addSubscription(sessionId, boundingBox);

    const ships = await listShips(boundingBox, MAX_AGE_MINUTES);
    res.set('session_id', sessionId);
    res.status(200).json(ships);
});

// Creates a subscription for a specific bounding box and returns a sessionId linked to it
app.post("/subscribe", (req, res) => {
    const boundingBox = req.body.boundingBox;
    if (!boundingBox || !boundingBox[0] || !boundingBox[1]) {
        return res.status(400).json("Bounding box is missing or incomplete");
    }

    const sessionId =  uuidv4();
    const success = addSubscription(sessionId, boundingBox);
    if (success) {
        res.set('session_id', sessionId);
        res.status(200).json({ sessionId: sessionId });
    } else {
        res.status(400).json("Error creating subscription");
    }
})

app.listen(API_PORT, () => {
    console.log(`App listening on port ${API_PORT}`);
});

// Subscription update
// We check subscription requests held inside the subscriptions table and regenerate
// the bounding box array sent to the AIS socket periodically
// Also, if a subscription hasn't been queried for some time the subscription is deleted and 
// its bounding box removed from the subscription list sent to the socket.
updateSubscriptions = async () => {
    await deleteStaleSubscriptions(MAX_STALE_SUBSCRIPTION_SECONDS);
    const subscriptions = await listSubscriptions();
    const boundingBoxes = subscriptions.map(subscription => subscription.bounding_box);
    subscribeToAIS(boundingBoxes);
}

// Init subscribe task
setInterval(updateSubscriptions, UPDATE_SUBSCRIPTIONS_INTERVAL)