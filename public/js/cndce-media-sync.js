/**
 * Available events
 *
 * wsOpen
 * wsMessage
 * wsConnected
 *
 * wsChangeState
 * wsRequestState
 */
class MediaSyncPlayer {
  player;
  /**
   * @type {WebSocket}
   */
  socket;

  /**
   * @type {Array<Array>}
   */
  events = [];

  testMode;

  constructor({ jwPlayer, wsUrl, testMode = false }) {
    this.player = jwPlayer;
    this.testMode = testMode;

    this.__initPlayer();
    this.__initWebSocket(wsUrl);
  }

  __initWebSocket(wsUrl) {
    this.socket = new WebSocket(wsUrl);
    const ms = this;

    /**
     * Native Events
     */
    this.socket.addEventListener("open", function (e) {
      ms.trigger("wsOpen", e, this);
    });

    this.socket.addEventListener("message", function (msgEvent) {
      const res = JSON.parse(msgEvent.data);

      ms.trigger(res.event, res.data, this);
    });

    this.socket.addEventListener("close", function (closeEvent) {
      ms.trigger("wsMessage", closeEvent, this);
    });

    /**
     * Custom events
     */
    this.on("wsChangeState", this.__onWSChangeState);

    this.on("wsRequestState", this.__onWSRequestState);
  }

  __initPlayer() {
    this.player.on("play", this.__onPlayerPlay.bind(this));

    this.player.on("pause", this.__onPlayerPause.bind(this));
  }

  __onPlayerPlay(state) {
    console.log("play", state);
    if (state.playReason == "interaction") {
      this.wsSendStateChange(state);
    }
  }

  __onPlayerPause(state) {
    if (state.pauseReason == "interaction") {
      this.wsSendStateChange(state);
    }
  }

  __onWSChangeState(ws, { params, ...msgEvent }) {
    this.testMode && console.log("change", ws, params, msgEvent);

    this.player.seek(msgEvent.position);

    if (this.player.getPlaylistIndex() != msgEvent.playlistIndex) {
      this.player.playlistItem(msgEvent.playlistIndex);
    }

    switch (params.type) {
      case "play":
      case "playing":
        this.player.play();
        break;
      case "pause":
        this.player.pause();
        break;
    }
  }

  __onWSRequestState(ws, msgEvent) {
    this.testMode && console.log("request state", msgEvent, ws);
    this.wsSendStateChange(
      {
        state: this.player.getState(),
        ...msgEvent,
      },
      "requestState"
    );
  }

  wsSendStateChange(params = {}, eventName = "changeState") {
    this.socket.send(
      JSON.stringify({
        event: eventName,
        data: {
          params: params,
          position: this.player.getPosition(),
          playlistIndex: this.player.getPlaylistIndex(),
        },
      })
    );
  }

  // Event handlers
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];

    this.events[event].push(callback);
  }

  trigger(event, params, ws) {
    this.events[event] &&
      this.events[event].forEach((e) => {
        e.bind(this)(ws, params);
      });
  }
}
