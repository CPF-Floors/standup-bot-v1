const { MessageEmbed } = require("discord.js");


module.exports = {
    name: "presalida",
    description: "Conoce las preguntas del standup de Presalida",
    async execute(message, args) {
        const messageEmbed = new MessageEmbed()
        .setColor("#ff9900")
        .setTitle("Pre-salida Standup")
        .setDescription(
            "No te vayas sin responder esto!"
        )
        .addFields(
            {
            name: "Preguntas:",
            value: `
                ** 1. ¿Que tal estuvo tu dia en el trabajo? **
                ** 2. ¿De tus tareas que mencionaste en la mañana, cuales pudiste completar? **
                ** 3. ¿Existe algo que te moleste o te este bloqueando de alguna forma? **

                Cuando estés listo para responder, simplemente envíame un DM y utiliza el comando: , \`!presalida-reply ...\` donde \`...\` representa tu respuesta. :stuck_out_tongue:
            `,
            },
        )
        .setTimestamp();
      message.channel.send(messageEmbed);
    },
  };
  