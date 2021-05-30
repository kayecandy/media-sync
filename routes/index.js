var express = require("express");

var indexRouter = express.Router();

indexRouter.get("/", function (req, res, next) {
  res.render("index", {
    wsUrl: process.env.URL_WS + ":" + process.env.PORT_WS,
  });
  next();
});

module.exports = indexRouter;
