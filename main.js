var { client } = require("./client");
var { telegram, telegramApi } = require("tdl-lib");

var telegrambot = new telegram(client["app_id"], client["app_hash"], `./client/${client["bot_user_id"]}`);
var telegramuser = new telegram(client["app_id"], client["app_hash"], `./client/${client["phone_number"]}`);
var tg = new telegramApi(telegrambot.client);
var tg_user = new telegramApi(telegramuser.client);

var fs = require("fs/promises");

var timer = require("timers/promises");

var get_auth_state = ['authorizationStateWaitPhoneNumber', 'authorizationStateWaitCode', 'authorizationStateWaitPassword', 'authorizationStateReady'];
var set_auth_state = ['setAuthenticationPhoneNumber', 'checkAuthenticationCode', 'checkAuthenticationPassword'];
var type_auth_state = ['phone_number', 'code', 'password'];

var cur_user_id = "";
var caps_lock = true;
var state_data = {
    "phone_number": "62",
    "code": "",
    "password": ""
};

function check_admin(array, index) {
    if (array.indexOf(index) > -1) {
        return true;
    } else {
        return true;
    }
}


function acces_data(data, check_user) {
    if (data.indexOf(check_user) > -1) {
        return true;
    } else {
        return false;
    }
}

var curAuthState = {};
var curAuthData = {};

telegrambot.client.on('error', function (err) {
    console.error('Got error:', JSON.stringify(err, null, 2));
});

telegrambot.client.on('destroy', function () {
    console.log('Destroy event');
});

telegrambot.on('update', async function (update) {
    try {

        try {
            var readConfig = JSON.parse(await fs.readFile(`${process.cwd()}/./plugin/bot.json`, {
                "encoding": "utf8"
            }));
        } catch (e) {
            var readConfig = false;
        }

        if (update) {
            if (update["callback_query"]) {
                var cb = update["callback_query"];
                var cbm = cb["message"];
                var isText = cbm["text"] ?? "";
                var cbm_caption = cbm["caption"] ?? "";
                var user_id = cb["from"]["id"];
                var chat_id = cbm["chat"]["id"];
                var chat_type = String(cbm["chat"]["type"]).replace(RegExp("super", "i"), "");
                var chat_title = cbm["chat"]["title"] ?? "";
                var chat_username = (cbm["chat"]["username"]) ? `@${cbm["chat"]["username"]}` : "";
                var msg_id = cbm["message_id"];
                var text = cb["data"];
                var fromId = cb["from"]["id"];
                var fromFname = cb["from"]["first_name"];
                var fromLname = cb["from"]["last_name"] ?? "";
                var fromFullName = `${fromFname} ${fromLname}`;
                var fromUsername = (cb["from"]["username"]) ? `@${cb["from"]["username"]}` : "";
                var fromLanguagecode = cb["from"]["language_code"] ?? "id";
                var mentionFromMarkdown = `[${fromFullName}](tg://user?id=${user_id})`;
                var mentionFromHtml = `<a href='tg://user?id=${user_id}'>${fromFullName}</a>`;
                var sub_data = text.replace(/(.*:|=.*)/ig, "");
                var sub_id = text.replace(/(.*=|\-.*)/ig, "");
                var sub_sub_data = text.replace(/(.*\-)/ig, "");
                var key = { "chat": { "id": chat_id } };


                try {
                    if (text) {
                        if (RegExp("^login$", "i").exec(text)) {
                            var isClientUserStart = await startClientUser(user_id);
                            if (isClientUserStart) {
                                var data = {
                                    "chat_id": chat_id,
                                    "text": `Login User Bot`,
                                };
                                return await tg.request("sendMessage", data);
                            } else {
                                return await tg.sendMessage(chat_id, "Start Client UserBot Gagal!");
                            }
                        }


                        if (RegExp("^sign:.*", "i").exec(text)) {
                            var option = {
                                "chat_id": chat_id,
                                "text": "Menu Sign",
                                "message_id": msg_id,
                            };

                            if (RegExp("^(phone_number|code|password)_add$", "i").exec(sub_data)) {
                                if (typeof cbm["reply_markup"] == "object" && typeof cbm["reply_markup"]["inline_keyboard"] == "object") {
                                    var getTypeAdd = String(sub_data).replace(/(_add.*)/i, "").toLocaleLowerCase();
                                    if (getTypeAdd == "phone_number") {
                                        state_data["phone_number"] += sub_id;
                                        option["text"] = `Sign\nPhone Number: ${state_data["phone_number"]}`;
                                    } else if (getTypeAdd == "code") {
                                        state_data["code"] += sub_id;
                                        option["text"] = `Sign\nCode: ${state_data["code"]}`;
                                    } else if (getTypeAdd == "password") {
                                        state_data["password"] += String(text).replace(/(.*=)/i, "");
                                        option["text"] = `Sign\nPassword: ${state_data["password"]}`;
                                    } else {
                                        return await tg.request("answerCallbackQuery", {
                                            "callback_query_id": cb["id"],
                                            "show_alert": true,
                                            "text": "Oops Ada kesalahan"
                                        });
                                    }
                                    option["reply_markup"] = cbm["reply_markup"];
                                    return await tg.request("editMessageText", option);
                                } else {
                                    option["text"] = `Ops terjadi kesalahan tolong ulangin lagi dari awal ya!`;
                                    return await tg.request("editMessageText", option);
                                }
                            }


                            if (RegExp("^(phone_number|code|password)$", "i").exec(sub_data)) {
                                if (RegExp("^clear_all$", "i").exec(sub_id)) {
                                    if (state_data[sub_data].length > 0) {
                                        state_data[sub_data] = "";
                                    } else {
                                        return await tg.request("answerCallbackQuery", {
                                            "callback_query_id": cb["id"],
                                            "show_alert": true,
                                            "text": `${sub_data} sudah di delete semuanya Tolong jangan flood ya!`
                                        });
                                    }
                                } else {
                                    if (state_data[sub_data].length > 0) {
                                        state_data[sub_data] = state_data[sub_data].substring(0, state_data[sub_data].length - 1);
                                    } else {
                                        return await tg.request("answerCallbackQuery", {
                                            "callback_query_id": cb["id"],
                                            "show_alert": true,
                                            "text": `${sub_data} sudah di delete semuanya Tolong jangan flood ya!`
                                        });
                                    }
                                }
                                if (typeof cbm["reply_markup"] == "object" && typeof cbm["reply_markup"]["inline_keyboard"] == "object") {
                                    if (sub_data == "phone_number") {
                                        option["text"] = `Sign\nPhone Number: ${state_data["phone_number"]}`;
                                    } else if (sub_data == "code") {
                                        option["text"] = `Sign\nCode: ${state_data["code"]}`;
                                    } else if (sub_data == "password") {
                                        option["text"] = `Sign\nPassword: ${state_data["password"]}`;
                                    } else {
                                        return await tg.request("answerCallbackQuery", {
                                            "callback_query_id": cb["id"],
                                            "show_alert": true,
                                            "text": "Oops Ada kesalahan"
                                        });
                                    }
                                    option["reply_markup"] = cbm["reply_markup"];
                                    return await tg.request("editMessageText", option);
                                } else {
                                    option["text"] = `Ops terjadi kesalahan tolong ulangin lagi dari awal ya!`;
                                    return await tg.request("editMessageText", option);
                                }
                            }

                            if (RegExp("^request$", "i").exec(sub_data)) {
                                if (state_data[sub_id].length < 5) {
                                    return await tg.request("answerCallbackQuery", {
                                        "callback_query_id": cb["id"],
                                        "show_alert": true,
                                        "text": `Tolong masukan ${sub_id} terlebih dahulu dengan benar ya!`
                                    });
                                }
                                await timer.setTimeout(2000);
                                try {
                                    if (sub_id == "phone_number") {
                                        await tg_user.setAuthenticationPhoneNumber(state_data[sub_id]);
                                    } else if (sub_id == "code") {
                                        await tg_user.checkAuthenticationCode(state_data[sub_id]);
                                    } else if (sub_id == "password") {
                                        await tg_user.checkAuthenticationPassword(state_data[sub_id]);
                                    } else {
                                        return await tg.request("answerCallbackQuery", {
                                            "callback_query_id": cb["id"],
                                            "show_alert": true,
                                            "text": "Oops Ada kesalahan"
                                        });
                                    }
                                    return await tg.deleteMessage(chat_id, msg_id, true);
                                } catch (e) {
                                    return await tg.request("answerCallbackQuery", {
                                        "callback_query_id": cb["id"],
                                        "show_alert": true,
                                        "text": `Failed\n${e.message}`
                                    });
                                }
                            }
                        }

                    }
                } catch (e) {
                    var data = {
                        "chat_id": chat_id,
                        "text": e.message
                    };
                    return await tg.request("sendMessage", data);
                }

            }

            if (update["message"]) {
                var msg = update["message"];
                var chat_id = msg["chat"]["id"];
                var user_id = msg["from"]["id"];
                var chat_type = String(msg["chat"]["type"]).replace(/(super)/i, "");
                var text = msg["text"] ?? "";
                var is_outgoing = msg["outgoing"] ?? false;
                try {
                    if (!is_outgoing) {

                        if (text) {

                            if (RegExp("^/jsondump$", "i").exec(text)) {
                                var data = {
                                    "chat_id": chat_id,
                                    "text": JSON.stringify(msg, null, 2)
                                };
                                return await tg.request("sendMessage", data);
                            }
                            if (RegExp("/test", "i").exec(text)) {
                                var time = (Date.now() / 1000) - msg["date"];
                                return await tg.sendVoice(chat_id, "./voice.ogg")
                            }



                            if (RegExp("/ping", "i").exec(text)) {
                                var time = (Date.now() / 1000) - msg["date"];
                                var data = {
                                    "chat_id": chat_id,
                                    "text": `Pong ${time.toFixed(3)}`
                                };
                                return await tg.request("sendMessage", data);
                            }


                            if (RegExp("^private$", "i").exec(chat_type)) {
                                if (acces_data(client["admins_user_id"], user_id)) {
                                    if (RegExp("^/account$", "i").exec(text)) {
                                        var data = {
                                            "chat_id": chat_id,
                                            "text": "Account",
                                            "reply_markup": {
                                                "inline_keyboard": [
                                                    [
                                                        {
                                                            "text": "Login User Bot",
                                                            "callback_data": "login"
                                                        }
                                                    ]
                                                ]
                                            }
                                        };
                                        return await tg.request("sendMessage", data);
                                    }
                                } else {
                                    return await tg.sendMessage(chat_id, "Oops command ini khusus admin tolong kamu jangan pakai ya!");
                                }

                            }
                        }

                        if (typeof readConfig == "object") {

                            if (text && typeof readConfig["text"] == "object") {
                                var readConfigText = readConfig["text"];
                                for (var i = 0; i < readConfigText.length; i++) {
                                    var loop_data = readConfigText[i];
                                    if (typeof loop_data["trigger"] == "string") {
                                        if (typeof loop_data["respond"] != "object") {
                                            return;
                                        }
                                        if (loop_data["admin_only"]) {
                                            if (!check_admin(client["admins_user_id"], user_id)) {
                                                return;
                                            }
                                        }
                                        var respond = loop_data["respond"];
                                    }
                                }
                            }

                        }

                    }
                } catch (e) {
                    var data = {
                        "chat_id": chat_id,
                        "text": e.message
                    };
                    return await tg.request("sendMessage", data);

                }
            }

        }

    } catch (e) {
        console.log(e);
    }
})


async function sendAuthClientUser(param) {
    try {
        await telegramuser.client.invoke(param);
        return true;
    } catch (e) {
        console.log(e)
        return false
    }
}

telegramuser.client.on('error', function (err) {
    console.error('Got error:', JSON.stringify(err, null, 2));
});

telegramuser.client.on('destroy', function () {
    console.log('Destroy event');
});


telegramuser.on('update', async function (update) {
    try {

        try {
            var readConfig = JSON.parse(await fs.readFile(`${process.cwd()}/./plugin/user.json`, {
                "encoding": "utf8"
            }));
        } catch (e) {
            var readConfig = false;
        }

        if (update) {
            if (RegExp("^updateAuthorizationState$", "i").exec(update['_'])) {

                if (check_admin(client["admins_user_id"], cur_user_id)) {
                    if (RegExp(`^${get_auth_state[0]}$`, "i").exec(update["authorization_state"]['_'])) {
                        curAuthState[cur_user_id] = get_auth_state[0];
                        var inline_keyboard = [];
                        for (var i = 0, ii = 5; i < 5; i++, ii++) {
                            inline_keyboard.push(
                                [
                                    {
                                        "text": String(i),
                                        "callback_data": `sign:phone_number_add=${i}`
                                    },
                                    {
                                        "text": String(ii),
                                        "callback_data": `sign:phone_number_add=${ii}`
                                    }
                                ]
                            );
                        }
                        inline_keyboard.push(
                            [
                                {
                                    "text": "Clear All",
                                    "callback_data": "sign:phone_number=clear_all"
                                },
                                {
                                    "text": "Remove",
                                    "callback_data": "sign:phone_number=remove"
                                }
                            ],
                            [
                                {
                                    "text": "Send Code",
                                    "callback_data": "sign:request=phone_number"
                                }
                            ]
                        );
                        var option = {
                            "chat_id": cur_user_id,
                            "text": `Silahkan isi nomor ponsel anda ya!\nsign: ${state_data["phone_number"]}`,
                            "reply_markup": {
                                "inline_keyboard": inline_keyboard
                            }
                        };
                        return await tg.request("sendMessage", option);
                    }

                    if (RegExp(`^${get_auth_state[1]}$`, "i").exec(update["authorization_state"]['_'])) {
                        curAuthState[cur_user_id] = get_auth_state[1];
                        var inline_keyboard = [];
                        for (var i = 0, ii = 5; i < 5; i++, ii++) {
                            inline_keyboard.push(
                                [
                                    {
                                        "text": String(i),
                                        "callback_data": `sign:code_add=${i}`
                                    },
                                    {
                                        "text": String(ii),
                                        "callback_data": `sign:code_add=${ii}`
                                    }
                                ]
                            );
                        }
                        inline_keyboard.push(
                            [
                                {
                                    "text": "Clear All",
                                    "callback_data": "sign:code=clear_all"
                                },
                                {
                                    "text": "Remove",
                                    "callback_data": "sign:code=remove"
                                }
                            ],
                            [
                                {
                                    "text": "Send Code",
                                    "callback_data": "sign:request=code"
                                }
                            ]
                        );
                        var option = {
                            "chat_id": cur_user_id,
                            "text": `Silahkan isi code verifikasi dari telegram anda ya!\nCode: ${state_data["code"]}`,
                            "reply_markup": {
                                "inline_keyboard": inline_keyboard
                            }
                        };
                        return await tg.request("sendMessage", option);
                    }

                    if (RegExp(`^${get_auth_state[2]}$`, "i").exec(update["authorization_state"]['_'])) {
                        curAuthState[cur_user_id] = get_auth_state[2];
                        var option = {
                            "chat_id": cur_user_id,
                            "text": `Silahkan Isi Password anda\nPassword: ${state_data["password"]}`
                        };
                        return await tg.request("sendMessage", option);
                    }

                    if (RegExp(`^${get_auth_state[3]}$`, "i").exec(update.authorization_state['_'])) {
                        curAuthState[cur_user_id] = get_auth_state[3];
                        var get_active = await tg_user.invoke("getActiveSessions");
                        var pesan = "📥 Event: " + get_active["_"];
                        for (var x in get_active.sessions) {
                            pesan += '\n\n🔑 Api_Id: ' + get_active.sessions[x]["api_id"];
                            pesan += '\n📱 Model: ' + get_active.sessions[x]["device_model"];
                            pesan += '\n📲 Device: ' + get_active.sessions[x]["platform"];
                            pesan += '\n🔧 System: ' + get_active.sessions[x]["system_version"];
                            pesan += '\n💻 Ip: ' + get_active.sessions[x]["ip"];
                            pesan += '\n🚪 Location: ' + get_active.sessions[x]["country"];
                        }
                        await tg.sendMessage(cur_user_id, pesan);
                        var getME = await tg_user.getMe();
                        var pesan = "📥 Event: " + getME["_"];
                        pesan += '\n\n👤 First Name: ' + getME["first_name"];
                        if (getME["last_name"]) {
                            pesan += '\n👤 Last Name: ' + getME["last_name"];
                        }
                        if (getME["username"]) {
                            pesan += '\n🔰 Username: @' + getME["username"];
                        }
                        if (getME["phone_number"]) {
                            pesan += '\n☎️ sign: ' + getME["phone_number"];
                        }
                        pesan += "\n";
                        pesan += `\n- contact ${getME["is_contact"]}`;
                        pesan += `\n- mutual_contact ${getME["is_mutual_contact"]}`;
                        pesan += `\n- support ${getME["is_support"]}`;
                        await tg.sendMessage(cur_user_id, pesan);
                        var data = {
                            "chat_id": cur_user_id,
                            "text": "Menu bot"
                        };
                        return await tg.request("sendMessage", data);
                    }
                } else {
                    if (RegExp(`^(${get_auth_state[0]}|${get_auth_state[1]}${get_auth_state[2]}|${get_auth_state[3]})$`, "i").exec(update.authorization_state['_'])) {
                        return await tg.sendMessage(cur_user_id, 'Kamu tidak punya akses!');
                    }
                }
            }


            if (update["message"]) {
                var msg = update["message"];
                var chat_id = msg["chat"]["id"];
                var user_id = msg["from"]["id"];
                var chat_type = String(msg["chat"]["type"]).replace(/(super)/i, "");
                var text = msg["text"] ?? "";
                var is_outgoing = msg["outgoing"] ?? false;
                try {

                    if (text) {

                        if (RegExp("^/jsondump$", "i").exec(text)) {
                            var data = {
                                "chat_id": chat_id,
                                "text": JSON.stringify(msg, null, 2)
                            };
                            return await tg_user.request("sendMessage", data);
                        }

                        if (RegExp("/ping", "i").exec(text)) {
                            var time = (Date.now() / 1000) - msg["date"];
                            var data = {
                                "chat_id": chat_id,
                                "text": `Pong ${time.toFixed(3)}`
                            };
                            return await tg_user.request("sendMessage", data);
                        }

                    }
                    if (typeof readConfig == "object") {

                        if (text && typeof readConfig["text"] == "object") {
                            var readConfigText = readConfig["text"];
                            for (var i = 0; i < readConfigText.length; i++) {
                                var loop_data = readConfigText[i];
                                if (typeof loop_data["trigger"] == "string") {
                                    if (typeof loop_data["respond"] != "object") {
                                        return;
                                    }
                                    if (loop_data["admin_only"]) {
                                        if (!check_admin(client["admins_user_id"], user_id)) {
                                            return;
                                        }
                                    }
                                    var respond = loop_data["respond"];
                                }
                            }
                        }

                    }


                } catch (e) {
                    var data = {
                        "chat_id": chat_id,
                        "text": e.message
                    };
                    return await tg_user.request("sendMessage", data);

                }
            }


        }
    } catch (e) {
        console.log(e.message);
        return await tg.sendMessage(cur_user_id, e.message);
    }
})

async function startClientUser(user_id) {
    try {
        cur_user_id = user_id;
        var hasil = await telegramuser.user();
        return hasil;
    } catch (e) {
        console.log(e);
        return false;
    }
}

telegrambot.bot(client["token_bot"]);