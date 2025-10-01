const moment = require("moment");
var pool = require("../../config/pool_conexoes");

const mensagemModel = {

    // Buscar todas as mensagens entre dois usuários
    findAll: async (usuarioId1, usuarioId2) => {
        try {
            const [resultados] = await pool.query(
                `SELECT m.id_mensagem, 
                        u1.nome_usuario AS remetente, 
                        u2.nome_usuario AS destinatario, 
                        m.conteudo, 
                        m.status,
                        DATE_FORMAT(m.data_envio, '%Y-%m-%d %H:%i:%s') AS data_envio
                 FROM mensagem m
                 JOIN usuario u1 ON m.remetente_id = u1.id_usuario
                 JOIN usuario u2 ON m.destinatario_id = u2.id_usuario
                 WHERE (m.remetente_id = ? AND m.destinatario_id = ?)
                    OR (m.remetente_id = ? AND m.destinatario_id = ?)
                 ORDER BY m.data_envio ASC`,
                [usuarioId1, usuarioId2, usuarioId2, usuarioId1]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Buscar mensagem por ID
    findID: async (id) => {
        try {
            const [resultados] = await pool.query(
                "SELECT * FROM mensagem WHERE id_mensagem = ?", [id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Buscar mensagens pendentes (não entregues) de um usuário
    findPendentes: async (usuarioId) => {
        try {
            const [resultados] = await pool.query(
                `SELECT m.id_mensagem, m.remetente_id, u1.nome_usuario AS remetente, 
                        m.conteudo, m.data_envio, m.status
                 FROM mensagem m
                 JOIN usuario u1 ON m.remetente_id = u1.id_usuario
                 WHERE m.destinatario_id = ? AND m.status = 'enviada'
                 ORDER BY m.data_envio ASC`,
                [usuarioId]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Criar nova mensagem
    create: async (camposJson) => {
        try {
            // Campos esperados: { remetente_id, destinatario_id, conteudo }
            camposJson.data_envio = moment().format('YYYY-MM-DD HH:mm:ss');
            camposJson.status = "enviada"; // mensagem começa como "enviada"
            const [resultados] = await pool.query(
                "INSERT INTO mensagem SET ?", camposJson
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Atualizar conteúdo da mensagem
    update: async (camposJson, id) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE mensagem SET ? WHERE id_mensagem = ?", [camposJson, id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Atualizar status da mensagem (ex: 'entregue', 'lida')
    updateStatus: async (idMensagem, novoStatus) => {
        try {
            const [resultados] = await pool.query(
                "UPDATE mensagem SET status = ? WHERE id_mensagem = ?",
                [novoStatus, idMensagem]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    // Deletar mensagem 
    delete: async (id) => {
        try {
            const [resultados] = await pool.query(
                "DELETE FROM mensagem WHERE id_mensagem = ?", [id]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },

    findConversas: async (usuarioId, destinatarioId) => {
        try {
            const [resultados] = await pool.query(
                `SELECT 
                    m.id_mensagem,
                    m.remetente_id,
                    m.destinatario_id,
                    m.conteudo,
                    m.data_envio,
                    u1.nome_usuario AS remetente_nome,
                    u2.nome_usuario AS destinatario_nome
                FROM mensagem m
                INNER JOIN usuario u1 ON u1.id_usuario = m.remetente_id
                INNER JOIN usuario u2 ON u2.id_usuario = m.destinatario_id
                WHERE 
                    (m.remetente_id = 2 AND m.destinatario_id = 1) 
                    OR 
                    (m.remetente_id = 1 AND m.destinatario_id = 2)
                ORDER BY m.data_envio DESC
                LIMIT 15;`,
                [usuarioId, destinatarioId]
            );
            return resultados;
        } catch (error) {
            console.log(error);
            return error;
        }
    },
    // findConversas: async (usuarioId) => {
    //     try {
    //         const [resultados] = await pool.query(
    //             `SELECT m1.id_mensagem,
    //                     m1.remetente_id,
    //                     m1.destinatario_id,
    //                     m1.conteudo,
    //                     m1.data_envio,
    //                     u1.nome_usuario AS remetente_nome,
    //                     u2.nome_usuario AS destinatario_nome
    //              FROM mensagem m1
    //              INNER JOIN (
    //                 SELECT 
    //                     LEAST(remetente_id, destinatario_id) AS u1,
    //                     GREATEST(remetente_id, destinatario_id) AS u2,
    //                     MAX(data_envio) AS ultima_data
    //                 FROM mensagem
    //                 WHERE remetente_id = ? OR destinatario_id = ?
    //                 GROUP BY u1, u2
    //              ) m2
    //              ON ((LEAST(m1.remetente_id, m1.destinatario_id) = m2.u1)
    //                  AND (GREATEST(m1.remetente_id, m1.destinatario_id) = m2.u2)
    //                  AND m1.data_envio = m2.ultima_data)
    //              INNER JOIN usuario u1 ON u1.id_usuario = m1.remetente_id
    //              INNER JOIN usuario u2 ON u2.id_usuario = m1.destinatario_id
    //              ORDER BY m1.data_envio DESC`,
    //             [usuarioId, usuarioId]
    //         );
    //         return resultados;
    //     } catch (error) {
    //         console.log(error);
    //         return error;
    //     }
    // },
    // Contar mensagens entre dois usuários
    countMensagens: async (usuarioId1, usuarioId2) => {
        try {
            const [resultados] = await pool.query(
                `SELECT COUNT(*) AS total 
                 FROM mensagem 
                 WHERE (remetente_id = ? AND destinatario_id = ?)
                    OR (remetente_id = ? AND destinatario_id = ?)`,
                [usuarioId1, usuarioId2, usuarioId2, usuarioId1]
            );
            return resultados[0].total;
        } catch (error) {
            console.log(error);
            return error;
        }
    }
}

module.exports = { mensagemModel };
                