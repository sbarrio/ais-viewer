
// AIS socket config
const AIS_WSS_SOCKET = "wss://stream.aisstream.io/v0/stream";
const AIS_API_KEY = "ac0dc4798a5885a62cac51b6d2fc26b4c9896d13";

// API config
const API_PORT = 3000

// AIS viewer Settings
const UPDATE_SUBSCRIPTIONS_INTERVAL = 2000;
const MAX_AGE_MINUTES = 2;
const MAX_STALE_SUBSCRIPTION_SECONDS = 15;

// DB config
const DB_CONFIG = {
    user: 'sbarrio',
    password: '',
    host: 'localhost',
    port: 5432,
    database: 'ais',
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