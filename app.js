var Bot = require('slackbots');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('standups.db');

// create a bot
var settings = {
    token: 'GENERIC TOKEN',
    name: 'knowbot'
};
var bot = new Bot(settings);

bot.on('start', function() {
    // Ensure the database is here and available
    init();

    bot.postMessageToChannel('general', 'knowbot activated!');
});

var init = function() {
    // First define the updates table to store standup updates
    db.run('CREATE TABLE IF NOT EXISTS updates (date, user, message)');
};

bot.on('message', function(data) {
    if (data.type != 'message') return;

    if (data.text.indexOf('!standup ') == 0) {
        saveUpdate({
            username: data.user,
            update: data.text.replace('!standup ', '')
        });
        bot.postMessage(data.channel, 'Got it!');
    }

    if(data.text.indexOf('!today') == 0) {
        getTodaysUpdates(function(update) {
            bot.getUserById(update.username).then(function(userData) {
                var message = userData.name + ': ' + update.message;
                bot.postMessage(data.channel, message);
            });
        });
    }
});

var saveUpdate = function(message) {
    db.run('INSERT INTO updates VALUES (?, ?, ?)', [getCurrentDate(), message.username, message.update]);
};

var getCurrentDate = function() {
    var today = new Date();
    return today.getFullYear()+(today.getMonth()+1)+today.getDate();
};

var getTodaysUpdates = function(callback) {
    getUpdates(getCurrentDate(), callback);
};

var getUpdates = function(dateToGet, callback) {
    var count = 0;

    db.each('SELECT user, message FROM updates WHERE date = ' + dateToGet, function (err, row) {
        count++;
        callback({
            username: row.user,
            message: row.message
        });
    });
};