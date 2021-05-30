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
   * @type {HTMLElement}
   */
  domPlayer;
  /**
   * @type {HTMLElement}
   */
  domJoinContainer;

  /**
   * @type {WebSocket}
   */
  socket;

  /**
   * @type {Array<Array>}
   */
  events = [];

  wsUrl;

  testMode;

  constructor({ jwPlayer, wsUrl, testMode = false }) {
    this.testMode = testMode;
    this.wsUrl = wsUrl;

    this.testMode && (window.msPlayer = this);

    this.__initPlayer(jwPlayer);
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
    this.on("wsConnected", this.__onWSConnected);

    this.on("wsChangeState", this.__onWSChangeState);

    this.on("wsRequestState", this.__onWSRequestState);
  }

  __initPlayer(jwPlayer) {
    this.player = jwPlayer;

    this.player.on("ready", this.__onPlayerReady.bind(this));

    this.player.on("play", this.__onPlayerPlay.bind(this));

    this.player.on("pause", this.__onPlayerPause.bind(this));
  }

  __initPlayerJoin() {
    this.domJoinContainer = document.querySelector(
      '.msplayer-join-container[data-player="' + this.domPlayer.id + '"]'
    );

    this.domPlayer.append(this.domJoinContainer);

    this.domJoinContainer
      .querySelector(".msplayer-join")
      .addEventListener("click", this.__onPlayerJoin.bind(this));
  }

  __onPlayerReady() {
    this.domPlayer = this.player.getContainer();

    // Pause player in case of autostart
    this.player.pause();

    this.__initPlayerJoin();
  }

  __onPlayerJoin() {
    this.__initWebSocket(this.wsUrl);

    // this.domJoinContainer.remove();
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

  __onWSConnected(ws, data) {
    const { clientSize } = data;

    this.testMode && console.log("Connecte to WS: ", data);

    if (clientSize == 1) {
      this.player.play();
    }

    this.testMode && console.log(data);

    this.domJoinContainer.remove();
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
