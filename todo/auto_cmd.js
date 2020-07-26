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
    let container = $('[data-test-selector="chat-input-tray"]');

    if(!defined(container))
        return;

    let header = $('span', false, container),
        message = $('p', false, container);

    if(!defined(header) || !defined(message))
        return;

    let readables = {
        // Commands
        '/clip': 'Clipping',
        '/view': 'Changing viewing mode',

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
            case '/clip':
                let clip = $('[data-a-target="player-clip-button"i]');

                clip.click();
                break;

            case '/mode':
                let modes = {
                        ':theatre': $('[data-a-target="player-theatre-mode-button"i]'),
                        ':fullscreen': $('[data-a-target="player-fullscreen-button"i]'),
                    };

                if(subin in modes)
                    modes[subin].click();
                break;

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
                    let existing = COMMAND_JOB[com];

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

        header.innerText = `${ (readables[instr] || instr) } ${ (readables[subin] || subin || '') }`;
        message.innerText = command;

        let existing = COMMAND_JOB[com];

        if(existing)
            clearInterval(existing);
        COMMAND_JOB[com] = setInterval(JOB, 100);

        PARSING.push(command);
    }
}, 100);
