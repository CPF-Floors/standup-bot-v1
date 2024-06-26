const PREFIX = "!";

/**
 * !help command - Lists out all the available commands
 */
module.exports = {
  name: "help",
  description: "Muestra todos los comandos",
  usage: "[command name]",
  execute(message, args) {
    const data = [];
    const { commands } = message.client;

    /**
     * If the user wants all the commands
     */
    if (!args.length) {
      data.push("Aquí tienes todo lo que podemos hacer:");
      let cmds = "";
      commands.forEach(command => {
        cmds += (`\`${PREFIX}${command.name}\``).padEnd(6, '\t');
        if(command.description) cmds += `\t*${command.description}*\n`
      });
      data.push(cmds);
      data.push(
        `Intenta \`${PREFIX}help [comando]\` para obtener información específica de un comando!`
      );

      return message.channel.send(data, { split: true }).catch((error) => {
          console.error(error);
          message.reply(
            "Houston, tenemos un problema!"
          );
        });
    }

    /**
     * If the user specifies a command
     */
    const name = args[0].toLowerCase();
    const command =
      commands.get(name) ||
      commands.find((c) => c.aliases && c.aliases.includes(name));

    if (!command) {
      return message.reply("Uh Oh! Comando inválido");
    }

    data.push(`**Nombre:** ${command.name}`);

    if (command.description)
      data.push(`**Descripción:** *${command.description}*`);
    if (command.usage)
      data.push(`**Uso:** \`${PREFIX}${command.name} ${command.usage}\``);

    data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

    message.channel.send(data, { split: true });

  },
};
