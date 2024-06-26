const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "daily",
  description: "Conoce las preguntas del Daily",
  async execute(message, args) {

    const messageEmbed = new MessageEmbed()
    .setColor("#ff9920")
    .setTitle("Daily Standup")
    .setDescription(
        "Empecemos!"
    )
    .addFields(
        {
        name: "Preguntas:",
        value: `
            **  1. ¿Qué tareas estarás realizando el día de hoy? **
            ** 2. ¿Existe algo que puede ayudarte a completarlas de forma más eficiente? ¿Qué puedo hacer por ti? **

            Cuando estés listo para responder, simplemente envíame un DM y utiliza el comando: , \`!daily-reply ...\` donde \`...\` representa tu respuesta. :stuck_out_tongue:
        `,
        },
    )
    .setTimestamp();

    message.channel.send(messageEmbed);
  },
};
