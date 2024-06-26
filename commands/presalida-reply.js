const standupModel = require("../models/standup.model");

module.exports = {
  name: "presalida-reply",
  usage: "@<optional_serverId> [your-message-here]",
  description: "Responde a tu Pre-Salida Standup",
  execute(message, args) {
    if (message.channel.type === "dm") {
      if (!args.length || (args.length == 1 && args[0].startsWith("@")))
        return message.reply(
          "Oh oh! Debes proveer un mensaje válido como respuesta. A nadie le gusta un :ghost: como un miembro del equipo :exclamation: :anger:"
        );

      if (args[0].startsWith("@")) {
        standupModel
          .findById(args[0].slice(1))
          .then((standup) => {
            if (standup.members.indexOf(message.author.id) !== -1) {
              standup.presalidaResponses.set(
                message.author.id,
                args.splice(1).join(" ")
              );

              standup
                .save()
                .then(() => message.channel.send("Respuesta actualizada :tada:"))
                .catch((err) => {
                  console.error(err);
                  message.channel.send(
                    "Oh no :scream:! Ocurrió un error en la Matrix!"
                  );
                });
            } else {
              message.channel.send(
                "Oh oh! Debes ser un miembro del standup para responder!"
              );
            }
          })
          .catch((err) => {
            console.error(err);
            message.channel.send(
              "Oh no :scream:! Ocurrió un error en la Matrix!"
            );
          });
      } else {
        standupModel
          .find()
          .then((standups) => {
            const userStandupList = standups.filter(
              (standup) => standup.members.indexOf(message.author.id) !== -1
            );

            if (!userStandupList.length) {
              message.channel.send(
                "Oh oh! Debes ser un miembro del standup para responder!"
              );
            } else if (userStandupList.length > 1) {
              message.channel.send(
                "Ruh Roh! Looks like you're a member in multiple standup servers!\nTry `!reply @<serverId> [your-message-here]` if you would like to reply to a *specific* standup server.\n**_Crunchy Hint:_** To get the serverId for *any* server, right-click the server icon and press `Copy ID`.\nNote that you may need Developer options turned on. But like, what kinda developer uses a standup bot **_AND DOESN'T TURN ON DEVELOPPER SETTINGS_** :man_facepalming:"
              );
            } else {
              let [standup] = userStandupList;
              standup.presalidaResponses.set(
                message.author.id,
                args.join(" ")
              );
              standup
                .save()
                .then(() => message.channel.send("Respuesta actualizada :tada:"))
                .catch((err) => {
                  console.error(err);
                  message.channel.send(
                    "Oh no :scream:! Ocurrió un error en la Matrix!"
                  );
                });
            }
          })
          .catch((err) => {
            console.error(err);
            message.channel.send(
              "Oh no :scream:! Ocurrió un error en la Matrix!"
            );
          });
      }
    } else {
      return message.reply("Envíame un DM con el comando `!presalida-reply` :bomb:");
    }
  },
};
