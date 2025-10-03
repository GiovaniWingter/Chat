const express = require("express");
const app = express();
const env = require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);
const { mensagemController } = require("./app/controllers/mensagemController"); 
// Mapa para relacionar usuário e socket.id
const usuariosConectados = {};

io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);

  // Quando o cliente informar qual usuário é (login)
  socket.on("login", (userId) => {
    usuariosConectados[userId] = socket.id;
    console.log("Usuário logado no socket:", userId);
  });

  // Escutar mensagem privada
  socket.on("privateMessage", async (data) => {
    // data = { remetenteId, destinatarioId, conteudo }

    try {
      // Usar o controller para salvar no banco (adaptar para chamar só salvar)
      await mensagemController.salvarMensagemViaSocket(data);

      // Enviar a mensagem para o destinatário, se conectado
      const destinatarioSocketId = usuariosConectados[data.destinatarioId];
      if (destinatarioSocketId) {
        io.to(destinatarioSocketId).emit("privateMessage", {
          remetenteId: data.remetenteId,
          conteudo: data.conteudo,
          data_envio: data.data_envio,
          remetenteNome: data.remetenteNome
        });
      }
    } catch (error) {
      console.error("Erro ao processar mensagem via socket:", error);
    }
  });

  socket.on("disconnect", () => {
    // Remover usuário do mapa ao desconectar
    for (const [userId, socketId] of Object.entries(usuariosConectados)) {
      if (socketId === socket.id) {
        delete usuariosConectados[userId];
        console.log(`Usuário ${userId} desconectado`);
        break;
      }
    }
  });
});

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