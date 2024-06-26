const standupModel = require("../models/standup.model");

/**
 * !list - list all participating members
 */
module.exports = {
  name: "list",
  guildOnly: true,
  description: "Lista de los miembros añadidos al standup :white_check_mark:",
  execute(message, args) {
    standupModel.findById(message.guild.id).then(standup => {
      let res = "Acá tienes a todos los miembros participantes::\n";
      if(!standup.members.length) {
        message.reply("No parece que hayas añadido a alguien. Intenta `!am @<user> @<optional_user> ...` para añadirlos.")
      } else {
        standup.members.forEach(member => {
          res += `<@${member}>\t`;
        });
        message.channel.send(res);
      }
    }).catch(err => {
      console.error(err);
      message.channel.send(
        "Oh no :scream:! Ocurrió un error en la Matrix!"
      );
    })
  },
};
