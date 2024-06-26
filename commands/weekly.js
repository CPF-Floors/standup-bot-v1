const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "weekly",
    description: "Conoce las preguntas del Weekly Standup",
    async execute(message, args) {
        const messageEmbed = new MessageEmbed()
        .setColor("#ff9935")
        .setTitle("Weekly Standup")
        .setDescription(
            "¿Buen fin de semana? Espero que sí, ¡comencemos!"
        )
        .addFields(
            {
            name: "Preguntas:",
            value: `
                ** 1. ¿Cuáles son tus tareas para esta semana? **
                ** 2. ¿Cuáles serán tus principales logros en los próximos días? ** 
                ** 3. ¿Qué vas a hacer hoy? ** 
                ** 4. ¿Hay algo que bloquee tu progreso? ** 

                Cuando estés listo para responder, simplemente envíame un DM y utiliza el comando: , \`!weekly-reply ...\` donde \`...\` representa tu respuesta. :stuck_out_tongue:
            `,
            },
        )
        .setTimestamp();

        message.channel.send(messageEmbed);
    },
  };
  