const http = require("http");
const app = require("../app");

class ClientServer {
  static __instance;
  static PORT = process.env.PORT || 8080;

  /**
   * START CLIENT SERVER
   *
   * Start at port specified in PORT of .env
   * Defaults to 8080
   */
  static start() {
    if (!ClientServer.__instance) {
      ClientServer.__instance = new ClientServer();
    }
  }

  constructor() {
    app.set("port", ClientServer.PORT);

    http.createServer(app).listen(ClientServer.PORT);

    console.log("Client server started at " + ClientServer.PORT);
  }
}

module.exports = ClientServer;
