const { mensagemModel } = require("../models/mensagemModel");
const { usuarioModel } = require("../models/usuarioModel");
const { body, validationResult } = require("express-validator");

const mensagemController = {

    // Validação do formulário de envio
    regrasValidacaoMensagem: [
        body("destinatario_id")
            .isInt().withMessage("Destinatário inválido"),
        body("conteudo")
            .isLength({ min: 1, max: 500 })
            .withMessage("Mensagem deve ter entre 1 e 500 caracteres"),
    ],

    // Exibe página de chat com lista de usuários
    mostrarChat: async (req, res) => {
        try {
            const usuarios = await usuarioModel.findAll(); // lista todos usuários
            const mensagens = await mensagemModel.findConversas(req.session.autenticado.id);
            res.render("pages/chat", {
                usuarios,
                mensagens,
                listaErros: null,
                dadosNotificacao: null,
                usuarioLogado: req.session.autenticado
            });
        } catch (error) {
            console.log(error);
            res.render("pages/chat", {
                usuarios: [],
                mensagens: [],
                listaErros: null,
                dadosNotificacao: { titulo: "Erro!", mensagem: "Falha ao carregar chat.", tipo: "error" },
                usuarioLogado: req.session.autenticado
            });
        }
    },

    mostrarConversas: async (req, res) => {
        try {
            const userId = req.session.autenticado.id;
            const destinatarioId = req.params.id;
            const usuarios = await usuarioModel.findAll(); // lista todos usuários
            // Pega todas as mensagens entre userId e destinatarioId
            const mensagens = await mensagemModel.findConversas(userId, destinatarioId);
            // Se a requisição foi feita via fetch (esperando JSON)
            if (req.headers["accept"] && req.headers["accept"].includes("application/json")) {
                return res.json(mensagens);
            }
            // Caso contrário, renderiza a página EJS
            res.render("pages/chat", {
                usuarioLogado: req.session.autenticado,
                usuarios,
                mensagens,
            });
        } catch (error) {
            console.log("Erro ao carregar conversas:", error);
            res.status(500).send("Erro ao carregar conversas");
        }
    },

    // Envia mensagem (mesmo se destinatário não estiver online)
    enviarMensagem: async (req, res) => {
        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            const usuarios = await usuarioModel.findAll();
            return res.render("pages/chat", {
                usuarios,
                mensagens: [],
                listaErros: erros,
                dadosNotificacao: null,
                usuarioLogado: req.session.autenticado
            });
        }
        const { destinatario_id, conteudo } = req.body;
        try {
            const novaMensagem = {
                remetente_id: req.session.autenticado.id,
                destinatario_id,
                conteudo,
                data_envio: new Date()
            };
            let result = await mensagemModel.create(novaMensagem);
            console.log(result);
            res.redirect("/chat");
        } catch (error) {
            console.log(error);
            res.render("pages/chat", {
                usuarios: [],
                mensagens: [],
                listaErros: null,
                dadosNotificacao: {
                    titulo: "Erro!",
                    mensagem: "Falha ao enviar mensagem.", tipo: "error"
                },
                usuarioLogado: req.session.autenticado
            });
        }
    },


    salvarMensagemViaSocket: async (data) => {
        const novaMensagem = {
            remetente_id: data.remetenteId,
            destinatario_id: data.destinatarioId,
            conteudo: data.conteudo,
            data_envio: new Date(),
        };

        return await mensagemModel.create(novaMensagem);
    },
}

module.exports = { mensagemController };
