// https://dev.twitch.tv/docs/irc/example-parser

// Parses an IRC message and returns a JSON object with the message's
// component parts (tags, source (nick and host), command, parameters).
// Expects the caller to pass a single message. (Remember, the Twitch
// IRC server may send one or more IRC messages in a single message.)

window.TTV_IRC ??= {
    sockets: {},

    parseMessage(message) {
        // Contains the component parts.
        let parsedMessage = {
            tags: null,
            source: null,
            command: null,
            parameters: null,
        };

        // The start index. Increments as we parse the IRC message.
        let index = 0;

        // The raw components of the IRC message.
        let rawTagsComponent,
            rawSourceComponent,
            rawCommandComponent,
            rawParametersComponent;

        // If the message includes tags, get the tags component of the IRC message.
        // The message includes tags.
        if(message[index] === '@') {
            let exdex = message.indexOf(' ');

            rawTagsComponent = message.slice(1, exdex);

            // Should now point to source colon (:).
            index = exdex + 1;
        }

        // Get the source component (nick and host) of the IRC message.
        // The index should point to the source part; otherwise, it's a PING command.
        if(message[index] === ':') {
            let exdex = message.indexOf(' ', ++index);

            rawSourceComponent = message.slice(index, exdex);

            // Should point to the command part of the message.
            index = exdex + 1;
        }

        // Get the command component of the IRC message.
        // Looking for the parameters part of the message.
        let exdex = message.indexOf(':', index);

        // But not all messages include the parameters part.
        if(-1 == exdex)
            exdex = message.length;

        rawCommandComponent = message.slice(index, exdex).trim();

        // Get the parameters component of the IRC message.
        // Check if the IRC message contains a parameters component.
        if(exdex != message.length) {
            // Should point to the parameters part of the message.
            index = exdex + 1;
            rawParametersComponent = message.slice(index);
        }

        // Parse the command component of the IRC message.
        parsedMessage.command = TTV_IRC.parseCommand(rawCommandComponent);

        // Only parse the rest of the components if it's a command
        // we care about; we ignore some messages.

        // Is null if it's a message we don't care about.
        if(nullish(parsedMessage.command)) {
            return null;
        } else {
            // The IRC message contains tags.
            if(defined(rawTagsComponent))
                parsedMessage.tags = TTV_IRC.parseTags(rawTagsComponent);

            parsedMessage.source = TTV_IRC.parseSource(rawSourceComponent);
            parsedMessage.parameters = rawParametersComponent;

            // The user entered a bot command in the chat window.
            if(rawParametersComponent?.startsWith?.('!'))
                parsedMessage.command = TTV_IRC.parseParameters(rawParametersComponent, parsedMessage.command);
        }

        return parsedMessage;
    },

    // Parses the tags component of the IRC message.
        // badge-info=;badges=broadcaster/1;color=#0000FF;...
    parseTags(tags) {
        // List of tags to ignore.
        const tagsToIgnore = {
            'client-nonce': null,
            'flags': null,
        };

        // Holds the parsed list of tags.
        // The key is the tag's name (e.g., color).
        let dictParsedTags = {};
        let parsedTags = tags.split(';');

        parsedTags.forEach(tag => {
            // Tags are key/value pairs.
            let [key, val] = tag.split('=');

            val = (val === '')? null: val;

            // Switch on tag name
            switch(key) {
                case 'badges':
                case 'badge-info':
                    // badges=staff/1,broadcaster/1,turbo/1;

                    if(val) {
                        // Holds the list of badge objects.
                        // The key is the badge's name (e.g., subscriber).
                        let dict = {};
                        let badges = val.split(',');

                        badges.forEach(pair => {
                            let [key, val] = pair.split('/');

                            dict[key] = val;
                        });

                        dictParsedTags[key] = dict;
                    } else {
                        dictParsedTags[key] = null;
                    }
                    break;

                case 'emotes':
                    // emotes=25:0-4,12-16/1902:6-10

                    if(val) {
                        // Holds a list of emote objects.
                        // The key is the emote's ID.
                        let dictEmotes = {};
                        let emotes = val.split('/');

                        emotes.forEach(emote => {
                            let [key, val] = emote.split(':');

                            // The list of position objects that identify
                            // the location of the emote in the chat message.
                            let textPositions = [];
                            let positions = val.split(',');

                            positions.forEach(position => {
                                let [startPosition, endPosition] = position.split('-');

                                textPositions.push({ startPosition, endPosition });
                            });

                            dictEmotes[key] = textPositions;
                        });

                        dictParsedTags[key] = dictEmotes;
                    } else {
                        dictParsedTags[key] = null;
                    }

                    break;

                case 'emote-sets':
                    // emote-sets=0,33,50,237

                    // Array of emote set IDs.
                    let emoteSetIds = val.split(',');
                    dictParsedTags[key] = emoteSetIds;
                    break;

                default:
                    // If the tag is in the list of tags to ignore, ignore
                    // it; otherwise, add it.

                    if(tagsToIgnore.hasOwnProperty(key))
                        /* Ignore the tag */;
                    else
                        dictParsedTags[key] = val;
            }
        });

        let convertedParsedTags = {};

        for(let key in dictParsedTags)
            convertedParsedTags[key.replace(/\W+/g, '_')] = dictParsedTags[key];

        return convertedParsedTags;
    },

    // Parses the command component of the IRC message.
    parseCommand(rawCommandComponent) {
        let [command, channel, request] = rawCommandComponent.trim().split(' ', 3);

        switch(command?.toUpperCase()) {
            case 'JOIN':
            case 'PART':
            case 'NOTICE':
            case 'PRIVMSG':
            case 'WHISPER':
            case 'CLEARMSG':
            case 'CLEARCHAT':
            case 'USERNOTICE':
            case 'HOSTTARGET': {
                return { command, channel };
            } break;

            case 'PING': {
                return { command };
            } break;

            case 'CAP': {
                return {
                    command,
                    enabledCapabilities: channel,
                    isCapRequestEnabled: (request === 'ACK'),
                };
            } break;

            // Included only if you request the /commands capability.
            // But it has no meaning without also including the /tags capability.
            case 'GLOBALUSERSTATE': {
                return { command };
            } break;

            // Included only if you request the /commands capability.
            case 'USERSTATE':
            // But it has no meaning without also including the /tags capabilities.
            case 'ROOMSTATE': {
                return { command, channel };
            } break;

            // The Twitch IRC server is about to terminate the connection for maintenance.
            case 'RECONNECT': {
                return { command };
            } break;

            // Unsupported IRC command: `request`
            case '421': {
                return null;
            } break;

            // Logged in (successfully authenticated).
            case '001': {
                return { command, channel };
            } break;

            // Ignoring all other numeric messages.
            case '002': // "Your host is tmi.twitch.tv"
            case '003': // "This server is rather new"
            case '004':
            case '353': // Tells you who else is in the chat room you're joining
            case '366':
            case '372':
            case '375':
            case '376': {
                // Numeric message: `command`
                return null;
            } break;

            default:
                // Unexpected command: `command`
        }

        return null;
    },

    // Parses the source (nick and host) components of the IRC message.
    parseSource(rawSourceComponent) {
        // Not all messages contain a source
        if(nullish(rawSourceComponent)) {
            return null;
        } else {
            let [nick, host] = rawSourceComponent.split('!');

            return {
                nick: (nick && host)? nick: null,
                host: (nick && host)? host: nick,
            }
        }
    },

    // Parsing the IRC parameters component if it contains a command (e.g., !dice).
    parseParameters(rawParametersComponent, command) {
        let index = 0;
        let commandParts = rawParametersComponent.slice(index + 1).trim();
        let parametersIndex = commandParts.indexOf(' ');

        // No parameters were given
        if(-1 == parametersIndex) {
            command.botCommand = commandParts.slice(0);
        } else {
            command.botCommand = commandParts.slice(0, parametersIndex);
            command.botCommandParams = commandParts.slice(parametersIndex).trim();
        }

        return command;
    },
};
