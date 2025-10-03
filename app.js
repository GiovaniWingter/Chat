const express = require("express");
const app = express();
const env = require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

const { configurarSocketIo } = require("./app/util/socket");
// Configura o Socket.IO com o servidor HTTP
configurarSocketIo(io);

var session = require("express-session");
app.use(
  session({
    secret: "HELLo nODE",
    resave: false,
    saveUninitialized: false,
}));

app.use(express.static("./app/public"));

app.set("view engine", "ejs");
app.set("views", "./app/views");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var rotas = require("./app/routes/router");
app.use("/", rotas);


server.listen(process.env.APP_PORT, () => {
  console.log(`Servidor online...
\nhttp://localhost:${process.env.APP_PORT}`);
}); 