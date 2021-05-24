// import ClientServer from "./ClientServer.mjs";
// import WebSocketServer from "./WebSocketServer.mjs";

const ClientServer = require("./ClientServer");
const WebSocketServer = require("./WebSocketServer");

/**
 * Start servers
 */
ClientServer.start();
WebSocketServer.start();
