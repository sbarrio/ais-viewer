
// AIS socket config
const AIS_WSS_SOCKET = "wss://stream.aisstream.io/v0/stream";
const AIS_API_KEY = "<YOUR API KEY>";

// API config
const API_PORT = 3000

// AIS viewer Settings
const UPDATE_SUBSCRIPTIONS_INTERVAL = 2000;
const MAX_AGE_MINUTES = 2;
const MAX_STALE_SUBSCRIPTION_SECONDS = 15;

// DB config
const DB_CONFIG = {
    user: '<USER>>',
    password: '<PASSWORD>',
    host: '<HOST>',
    port: 5432,
    database: '<DATABASE_NAME>',
};

module.exports = {
    AIS_WSS_SOCKET,
    AIS_API_KEY,
    API_PORT,
    DB_CONFIG,
    MAX_AGE_MINUTES,
    MAX_STALE_SUBSCRIPTION_SECONDS,
    UPDATE_SUBSCRIPTIONS_INTERVAL,
}