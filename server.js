var express = require("express"),
    bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    jwt = require("jsonwebtoken"),
    jwtExp = require("express-jwt"),
    tokenSecret = process.env.GT_GROUP_SECRET || require("./tokensecret.js"),
    cookieParser = require("cookie-parser");


var app = express();
var PORT = process.env.PORT || 8080;

// Requiring our models for syncing
var db = require("./models");

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("./public"));

// Body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

// Cookie-parser
app.use(cookieParser(tokenSecret));

// Override with POST having ?_method=DELETE
app.use(methodOverride("_method"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

// Import routes and give the server access to them.
var htmlRoutes = require("./controllers/html-routes.js");
var playersRoutes = require("./controllers/players-api-routes.js");
var mainRoutes = require("./controllers/main-controller.js");

app.use("/", htmlRoutes);

// Securing /api/ routes...
app.use("/api", function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    res.redirect("/");
  }
});

app.use("/api", jwtExp({
  secret: tokenSecret
}));

app.use("/api", playersRoutes);

// Securing /user/ routes...
app.use("/main", function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    res.redirect("/");
  }
});

app.use("/main", jwtExp({
  secret: tokenSecret,
  getToken: function fromCookie(req) {
    if (req.signedCookies) {
      return req.signedCookies.jwtAuthToken;
    }
  }
}));

app.use("/main", mainRoutes);

db.sequelize.sync().then(function () {
    app.listen(PORT, function () {
        console.log("Node app is running on port " + PORT);
    });
});