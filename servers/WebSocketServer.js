const WebSocket = require("ws");
const IncomingMessage = require("http").IncomingMessage;

class WebSocketServer {
  static __instance;
  static PORT_WS = process.env.PORT_WS || 8083;

  /**
   * @type {WebSocket.Server}
   */
  wss;

  /**
   * START WEBSOCKET SERVER
   *
   * Start at port specified in PORT_WS of .env
   * Defaults to 8083
   */
  static start() {
    if (!WebSocketServer.__instance) {
      WebSocketServer.__instance = new WebSocketServer();
    }
  }

  constructor() {
    this.wss = new WebSocket.Server({
      port: WebSocketServer.PORT_WS,
    });

    this.wss.on("connection", this.__onConnection.bind(this));
    this.wss.on("close", this.__onClose.bind(this));

    console.log("Web socket server started at " + WebSocketServer.PORT_WS);
  }

  __generateSocketID() {
    return Date.now();
  }

  /**
   *
   * @param {WebSocket} ws
   * @param {IncomingMessage} req
   */
  __onConnection(ws, req) {
    const ms = this;

    console.log("client connected");

    ws.id = this.__generateSocketID();

    /**
     * If older clients are previously connected
     * already, request for their state to sync
     * initial state of player
     */
    if (this.wss.clients.size - 1) {
      Array.from(this.wss.clients)[0].send(
        JSON.stringify({
          event: "wsRequestState",
          data: {
            clientId: ws.id,
          },
        })
      );
    }

    ws.send(
      JSON.stringify({
        event: "wsConnected",
        data: {
          clientId: ws.id,
        },
      })
    );

    ws.on("message", function (res) {
      ms.__onMessage(this, res);
    });
  }

  __onClose() {}

  /**
   * @param {WebSocket} ws
   * @param {WebSocket.Data} data
   */
  __onMessage(ws, res) {
    const { event, data } = JSON.parse(res);

    switch (event) {
      case "changeState":
        this.wss.clients.forEach(
          ((_ws) => {
            if (_ws.id == ws.id) return;

            _ws.send(
              JSON.stringify({
                event: "wsChangeState",
                data: data,
              })
            );
          }).bind(this)
        );
        break;

      case "requestState":
        console.log(data);
        const requestWs = Array.from(this.wss.clients).find(
          (_ws) => _ws.id == data.params.clientId
        );

        requestWs &&
          requestWs.send(
            JSON.stringify({
              event: "wsChangeState",
              data: data,
            })
          );
        break;
    }
  }

  __onPlayerStateChange(data) {}
}

module.exports = WebSocketServer;
