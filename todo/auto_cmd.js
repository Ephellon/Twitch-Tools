/***
 *       _____                                          _   ____        _
 *      / ____|                                        | | |  _ \      | |
 *     | |     ___  _ __ ___  _ __ ___   __ _ _ __   __| | | |_) | ___ | |_
 *     | |    / _ \| '_ ` _ \| '_ ` _ \ / _` | '_ \ / _` | |  _ < / _ \| __|
 *     | |___| (_) | | | | | | | | | | | (_| | | | | (_| | | |_) | (_) | |_
 *      \_____\___/|_| |_| |_|_| |_| |_|\__,_|_| |_|\__,_| |____/ \___/ \__|
 *
 *
 */

let PARSING = [],
    COMMAND_BOT,
    COMMAND_JOB = {},
    RECORDINGS = {};

clearInterval(COMMAND_BOT);

COMMAND_BOT = setInterval(() => {
    function GetChat(lines = 30, keepEmotes = false) {
        let chat = $('[data-a-target^="chat-"i] .chat-list [data-a-target="chat-line-message"i]', true).slice(-lines),
            emotes = {},
            results = [];

        let uuid = (string, seed) => {
            let seed_val = 0,
                string_val = 1;

            seed.slice(0,64).split('').map(c => seed_val += c.charCodeAt(0));
            string.slice(0,64).split('').map(c => string_val += (c.charCodeAt(0) * seed_val));

            return string_val.toString(36);
        };

        for(let line of chat) {
            let author = $('.chat-line__username', true, line).map(element => element.innerText).toString().toLowerCase(),
                mentions = $('.mention-fragment', true, line).map(element => element.innerText.replace('@', '').toLowerCase()),
                message = $('.mention-fragment, .chat-line__username ~ .text-fragment, .chat-line__username ~ img, .chat-line__username ~ a, .chat-line__username ~ * .text-fragment, .chat-line__username ~ * img, .chat-line__username ~ * a', true, line)
                    .map(element => element.alt && keepEmotes? `:${ (e=>{emotes[e.alt]=e.src;return e})(element).alt }:`: element.innerText)
                    .filter(element => element)
                    .join(" ")
                    .trim(),
                style = $('.chat-line__username [style]', true, line).map(element => element.getAttribute('style')).join('');

            results.push({
                style,
                author,
                message,
                mentions,
                element: line,
                uuid: uuid(message, [author, ...mentions].join('/')),
                highlighted: !!line.classList.value.split(" ").filter(value => /^chat-line--/i.test(value)).length,
            });
        }

        let bullets = $('[data-a-target^="chat-"i] .tw-accent-region', true).slice(-lines);

        if(bullets.length)
            results.bullets = [];

        for(let bullet of bullets) {
            let message = bullet.textContent,
                mentions = $('.chatter-name', true, bullet).map(element => element.innerText.toLowerCase()),
                subject = (
                    /\bgift/i.test(message)? 'gift':
                    /\bsubs/i.test(message)? 'subscription':
                    null
                );

            results.bullets.push({
                subject,
                message,
                mentions,
                uuid: uuid(message, mentions.join('/')),
                element: bullet,
            });
        }

        results.emotes = emotes;

        return results;
    }

    let container = $('[data-test-selector="chat-input-tray"]');

    if(!defined(container))
        return;

    let header = $('span', false, container),
        message = $('p', false, container);

    if(!defined(header) || !defined(message))
        return;

    let readables = {
        // Instructions
        '/rec': 'Recording',
        '/del': 'Deleting',

        // Sub-instructions/Parameters
        ':gift': 'gifted subscriptions',
        ':subs': '(non-gifted) subscriptions',
        ':user': 'user',
        ':word': 'word',
    };

    let commands = /(\/[\w\-\:]+)/,
        command = message.textContent.split(commands).filter(text => commands.test(text))[0];

    if(command && !~PARSING.indexOf(command)) {
        let [instr, subin, ...params] = command.split(/([\/:,][\w\-]+)/).filter(v => v).map(v => v.toLowerCase());
        let com = instr + subin;

        console.log({ command, instr, subin, params });
        PARSING.push(command);

        let JOB;

        switch(instr) {
            case '/rec':
                if(subin == ':gift')
                    JOB = () => {
                        let chat = GetChat(10, true),
                            records = (RECORDINGS[subin] = RECORDINGS[subin] || []);

                        let { bullets } = chat;

                        if(!bullets) return;

                        for(let bullet of bullets)
                            if(bullet.subject == 'gift' && !~records.map(r=>r.uuid).indexOf(bullet.uuid))
                                records.push(bullet);
                    };
                else if(subin == ':subs')
                    JOB = () => {
                        let chat = GetChat(10, true),
                            records = (RECORDINGS[subin] = RECORDINGS[subin] || []);

                        let { bullets } = chat;

                        if(!bullets) return;

                        for(let bullet of bullets)
                            if(bullet.subject == 'subscription' && !~records.map(r=>r.uuid).indexOf(bullet.uuid))
                                records.push(bullet);
                    };
                else if(subin == ':user')
                    JOB = () => {
                        let chat = GetChat(10, true),
                            records = (RECORDINGS[subin] = RECORDINGS[subin] || []);

                        if(!params.length) return;

                        let users = params.map(u => u.replace(/^[:,]/, ''));

                        for(let line of chat)
                            if(!!~users.indexOf(line.author) && !~records.map(r=>r.uuid).indexOf(line.uuid))
                                records.push(line);
                    };
                else if(subin == ':word')
                    JOB = () => {
                        let chat = GetChat(10, true),
                            records = (RECORDINGS[subin] = RECORDINGS[subin] || []);

                        if(!params.length) return;

                        let words = params.map(w => w.replace(/^[:,]/, ''));

                        for(let line of chat)
                            for(let word of words)
                                if(!!~line.message.indexOf(word) && !~records.map(r=>r.uuid).indexOf(line.uuid))
                                    records.push(line);
                    };
                break;

            case '/del':
                if(subin == ':gift') {
                    let existing = COMMAND_JOB['/rec' + subin];

                    if(existing)
                        clearInterval(existing);
                }
                else if(subin == ':subs') {
                    let existing = COMMAND_JOB[com];

                    if(existing)
                        clearInterval(existing);
                }
                else if(subin == ':user') {
                    let existing = COMMAND_JOB[com];

                    if(existing)
                        clearInterval(existing);
                }
                else if(subin == ':word') {
                    let existing = COMMAND_JOB[com];

                    if(existing)
                        clearInterval(existing);
                }
                return;

            default: return;
        }

        header.innerText = `${ (readables[instr] || instr) } ${ (readables[subin] || subin) }`;
        message.innerText = command;

        let existing = COMMAND_JOB[com];

        if(existing)
            clearInterval(existing);
        COMMAND_JOB[com] = setInterval(JOB, 100);

        PARSING.push(command);
    }
}, 100);
