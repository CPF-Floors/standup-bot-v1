"use strict"; // since I hate not using semicolons

/**
 * Required Imports
 *  - dotenv: .env support
 *  - fs: file system support (for reading ./commands)
 *  - mongoose: mongoDB client
 *  - discord.js: discord (duh)
 *  - schedule: for running the cron jobs
 *  - standup.model: the model for the standup stored in mongo
 */
require("dotenv").config();
const fs = require("fs");
const mongoose = require("mongoose");
const { Client, MessageEmbed, Collection } = require("discord.js");
const schedule = require("node-schedule");
const standupModel = require("./models/standup.model");
const { channel } = require("diagnostics_channel");

const PREFIX = "!";

const standupIntroMessage = new MessageEmbed()
  .setColor("#ff9900")
  .setTitle("Standup Bot!")
  .setDescription(
    "Soy un botsito para hacer reportes diarios! :tada:"
  )
  .addFields(
    {
      name: "Introduction",
      value: `Epa! Soy Stan D. Upbot y voy a estar ayudándolos para administrar los dailies que necesiten diariamente. Para ayuda, intenten usar: \`${PREFIX}help\`.`,
    },
    {
      name: "¿Cómo funciono?",
      value: `A cualquier hora antes del standup \`10:00 AM\`, los miembros me podrán enviar un DM con el comando \`${PREFIX}daily\` o \`${PREFIX}weekly\`, donde les mostraré el standup correspondiente y podrán responderlo con el comando \`${PREFIX}reply @<optional_serverId> [your-message-here]\`. Guardaré sus respuestas en mi  *maravitupenda base de datos*, y durante el tiempo designado, le presentaré a todo el mundo sus respuestas en el canal: \`#daily-standups\`.`,
    },
    {
      name: "Empecemos!",
      value: `*Ahora mismo*, no hay miembros añadidos al standup! Para añadir un nuevo miembro utiliza el comando: \`${PREFIX}am <User>\`.`,
    }
  )
  .setTimestamp();

const dailyStandupSummary = new MessageEmbed()
  .setColor("#ff9900")
  .setTitle("Daily Standup")
  .setTimestamp();

const weeklyStandupSummary = new MessageEmbed()
  .setColor("#ff9900")
  .setTitle("Weekly Standup")
  .setTimestamp();

const presalidaStandupSummary = new MessageEmbed()
  .setColor("#ff9900")
  .setTitle("Presalida Standup")
  .setTimestamp();

// lists .js files in commands dir
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

// init bot client with a collection of commands
const bot = new Client();
bot.commands = new Collection();

// Imports the command file + adds the command to the bot commands collection
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  bot.commands.set(command.name, command);
}

// mongodb setup with mongoose
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .catch((e) => console.error(e));

mongoose.connection.once("open", () => console.log("mongoDB connected"));

bot.once("ready", () => console.log("Discord Bot Ready"));

// when a user enters a command
bot.on("message", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (!bot.commands.has(commandName)) return;

  if (message.mentions.users.has(bot.user.id))
    return message.channel.send(":robot:");

  const command = bot.commands.get(commandName);

  if (command.guildOnly && message.channel.type === "dm") {
    return message.channel.send("Hmm, ese comando no va aquí en DMs!");
  }

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.channel.send(`Error 8008135: Something went wrong!`);
  }
});

bot.on("guildCreate", async (guild) => {
  // creates the text channel
  const channel = await guild.channels.create("bot-standups", {
    type: "text",
    topic: "Scrum Standup Meeting Channel",
  });

  // creates the database model
  const newStandup = new standupModel({
    _id: guild.id,
    channelId: channel.id,
    members: [],
    dailyResponses: new Map(),
    weeklyResponses: new Map(),
    presalidaResponses: new Map(),
  });

  newStandup
    .save()
    .then(() => console.log("Vayalo!"))
    .catch((err) => console.error(err));

  await channel.send(standupIntroMessage);
});

// delete the mongodb entry
bot.on("guildDelete", (guild) => {
  standupModel
    .findByIdAndDelete(guild.id)
    .then(() => console.log("No' vemo!"))
    .catch((err) => console.error(err));
});

/**
 * Cron Job: 10:30:00 AM EST - Go through each standup and output the responses to the channel
 */
let cronDailySummary = schedule.scheduleJob(
  { hour: 10, minute: 0, second: 30, dayOfWeek: new schedule.Range(2, 5), tz: "America/Caracas" },
  (time) => {
    console.log(`[${time}] - CRON JOB START - DAILY SUMMARY`);
    standupModel
      .find()
      .then((standups) => {
        standups.forEach((standup) => {
          let memberResponses = [];
          let missingMembers = [];
          standup.members.forEach((id) => {
            if (standup.dailyResponses.has(id)) {
              memberResponses.push({
                name: `-`,
                value: `<@${id}>\n${standup.dailyResponses.get(id)}`,
              });
              standup.dailyResponses.delete(id);
            } else {
              missingMembers.push(id);
            }
          });
          let missingString = "**No envió: **";
          if (!missingMembers.length) missingString += ":man_shrugging:";
          else missingMembers.forEach((id) => (missingString += `<@${id}> `));
          bot.channels.cache
            .get(standup.channelId)
            .send(
              new MessageEmbed(dailyStandupSummary)
                .setDescription(missingString)
                .addFields(memberResponses)
            );
          standup
            .save()
            .then(() =>
              console.log(`[${new Date()}] - ${standup._id} RESPONSES CLEARED`)
            )
            .catch((err) => console.error(err));
        });
      })
      .catch((err) => console.error(err));
  }
);
// Summary Weekly
let cronWeeklySummary = schedule.scheduleJob(
  { hour: 9, minute: 0, second: 30, dayOfWeek: new schedule.Range(1), tz: "America/Caracas" },
  (time) => {
    console.log(`[${time}] - CRON JOB START - WEEKLY SUMMARY`);
    standupModel
      .find()
      .then((standups) => {
        standups.forEach((standup) => {
          let memberResponses = [];
          let missingMembers = [];
          standup.members.forEach((id) => {
            if (standup.weeklyResponses.has(id)) {
              memberResponses.push({
                name: `-`,
                value: `<@${id}>\n${standup.weeklyResponses.get(id)}`,
              });
              standup.weeklyResponses.delete(id);
            } else {
              missingMembers.push(id);
            }
          });
          let missingString = "**No envió: **";
          if (!missingMembers.length) missingString += ":man_shrugging:";
          else missingMembers.forEach((id) => (missingString += `<@${id}> `));
          bot.channels.cache
            .get(standup.channelId)
            .send(
              new MessageEmbed(weeklyStandupSummary)
                .setDescription(missingString)
                .addFields(memberResponses)
            );
          standup
            .save()
            .then(() =>
              console.log(`[${new Date()}] - ${standup._id} RESPONSES CLEARED`)
            )
            .catch((err) => console.error(err));
        });
      })
      .catch((err) => console.error(err));
  }
);
let cronPresalidaSummary = schedule.scheduleJob(
  { hour: 18, minute: 0, second: 30, dayOfWeek: new schedule.Range(1, 5), tz: "America/Caracas" },
  (time) => {
    console.log(`[${time}] - CRON JOB START - PRESALIDA SUMMARY`);
    standupModel
      .find()
      .then((standups) => {
        standups.forEach((standup) => {
          let memberResponses = [];
          let missingMembers = [];
          standup.members.forEach((id) => {
            if (standup.presalidaResponses.has(id)) {
              memberResponses.push({
                name: `-`,
                value: `<@${id}>\n${standup.presalidaResponses.get(id)}`,
              });
              standup.presalidaResponses.delete(id);
            } else {
              missingMembers.push(id);
            }
          });
          let missingString = "**No envió: **";
          if (!missingMembers.length) missingString += ":man_shrugging:";
          else missingMembers.forEach((id) => (missingString += `<@${id}> `));
          bot.channels.cache
            .get(standup.channelId)
            .send(
              new MessageEmbed(presalidaStandupSummary)
                .setDescription(missingString)
                .addFields(memberResponses)
            );
          standup
            .save()
            .then(() =>
              console.log(`[${new Date()}] - ${standup._id} RESPONSES CLEARED`)
            )
            .catch((err) => console.error(err));
        });
      })
      .catch((err) => console.error(err));
  }
);
// Recordatorio - Daily
let cronDailyReminder = schedule.scheduleJob(
  { hour: 8, minute: 30, dayOfWeek: new schedule.Range(2, 5), tz: "America/Caracas" },
  async (time) => {
    console.log(`[${time}] - CRON JOB START - DAILY REMINDER`);
    const reminder = new MessageEmbed()
      .setColor("#ff9900")
      .setTitle("¡Atento!")
      .setDescription(
        "¡Ya va siendo la hora! :tada:"
      )
      .addFields(
        {
          name: "Daily Standup",
          value: `Recuerda enviar el Daily! Utiliza el comando: \`${PREFIX}daily\`. para ver las preguntas.`,
        },
        {
          name: "¡ADVERTENCIA!",
          value: `Procura llenar el Daily antes de las 10:00 AM, ya que de lo contrario no estará reflejado dentro del resumen diario.`,
        },
      )
      .setTimestamp();

      const standup = await standupModel.find()

      await bot.channels.cache
      .get(standup[0].channelId)
      .send(reminder);
  }
);
// Recordatorio - Weekly
let cronWeeklyReminder = schedule.scheduleJob(
  { hour: 8, minute: 30, dayOfWeek: new schedule.Range(1), tz: "America/Caracas" },
  async (time) => {
    console.log(`[${time}] - CRON JOB START - WEEKLY REMINDER`);
    const reminder = new MessageEmbed()
      .setColor("#ff9900")
      .setTitle("¡Atento!")
      .setDescription(
        "¡Ya va siendo la hora! :tada:"
      )
      .addFields(
        {
          name: "Weekly Standup",
          value: `Recuerda enviar el Weekly! Utiliza el comando: \`${PREFIX}weekly\`. para ver las preguntas.`,
        },
        {
          name: "¡ADVERTENCIA!",
          value: `Procura llenar el Weekly antes de las 09:00 AM, ya que de lo contrario no estará reflejado dentro del resumen del mismo.`,
        },
      )
      .setTimestamp();

      const standup = await standupModel.find()

      await bot.channels.cache
      .get(standup[0].channelId)
      .send(reminder);
  }
);
// Recordatorio - Presalida
let cronPresalidaReminder = schedule.scheduleJob(
  { hour: 5, minute: 30, dayOfWeek: new schedule.Range(1, 5), tz: "America/Caracas" },
  async (time) => {
    console.log(`[${time}] - CRON JOB START - PRESALIDA REMINDER`);
    const reminder = new MessageEmbed()
      .setColor("#ff9900")
      .setTitle("¡Atento!")
      .setDescription(
        "¡Ya va siendo la hora! :tada:"
      )
      .addFields(
        {
          name: "Presalida Standup",
          value: `Recuerda enviar el reporte pre-salida! Utiliza el comando: \`${PREFIX}weekly\`. para ver las preguntas.`,
        },
        {
          name: "¡ADVERTENCIA!",
          value: `Procura llenar el Presalida antes de las 06:00 PM, ya que de lo contrario no estará reflejado dentro del resumen diario.`,
        },
      )
      .setTimestamp();

      const standup = await standupModel.find()

      await bot.channels.cache
      .get(standup[0].channelId)
      .send(reminder);
  }
);

console.log(cronDailyReminder, cronPresalidaReminder, cronWeeklyReminder)

bot.login(process.env.DISCORD_TOKEN);
