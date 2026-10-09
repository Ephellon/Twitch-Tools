/*** /settings.js
 *       _____      _   _   _                   _
 *      / ____|    | | | | (_)                 (_)
 *     | (___   ___| |_| |_ _ _ __   __ _ ___   _ ___
 *      \___ \ / _ \ __| __| | '_ \ / _` / __| | / __|
 *      ____) |  __/ |_| |_| | | | | (_| \__ \_| \__ \
 *     |_____/ \___|\__|\__|_|_| |_|\__, |___(_) |___/
 *                                   __/ |    _/ |
 *                                  |___/    |__/
 */

/** @file Defines the settings for the extension.
 * <style>[pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[good]{background:#e8f0fe;color:#174ea6}[bad]{background:#fce8e6;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.com/ephellon @ephellon})
 * @module
 */

;

/**
 * Returns an extension URL for a resource
 *
 * @param  {string} [path = ""] The (absolute) path to the resource
 * @return {string<URL>}        The modified URL to the resource
 */
function getURL(path = '') {
    const url = parseURL(top.location);

    return url.origin + path.replace(/^(?!\/)/, '/');
}

// Handle updates here
(async function(version) {
    // Handle storage change
    if(compareVersions(`${ version } ≥ 5.32.4`)) {
        const v5_32_4 = await Storage.get('v5_32_4');

        Storage_change: if(parseBool(v5_32_4) == false)
            await alert.silent(`There is a new storage system in place, please press OK to proceed. All settings will be transferred.`).then(async() => {
                const sync = await Container.storage.sync.get();

                for(const key in sync)
                    Container.storage.local.set({ [key]: sync[key] });
                Storage.set({ v5_32_4: true });
            });
    }

    // Convert settings
    if(compareVersions(`${ version } = 5.32.5`)) {
        const opt = 'auto_chat__vip';
        const val = (await Storage.get(opt))?.[opt];

        Storage.set({ [opt]: val === true ? 'vip' : val === false ? null : val });
    }

    // Convert "Lurking Message" to "Lurking Rules"
    if(compareVersions(`${ version } ≥ 5.32.10`)) {
        const opt = 'auto_chat__lurking_message';
        const nxt = 'lurking_rules';
        const val = (await Storage.get(nxt))?.[nxt] ?? (await Storage.get(opt))?.[opt];

        Storage.set({ [nxt]: val });
    }
})(Manifest.version);

const PRIVATE_OBJECT_CONFIGURATION = Object.freeze({
    writable: false,
    enumerable: false,
    configurable: false,
});

// The saved settings, declared with each plugin (src/settings/layout.js). Anything else will be removed
let usable_settings = SETTINGS_IDS;

/**
 * An over-arching date-picker schema.
 * @typedef {object} PickedDate
 *
 * @property {array<string~integer>} days   The days (0-indexed) for the schedule: <strong>0</strong> &rArr; <strong>Sunday</strong> ...  <strong>6</strong> &rArr; <strong>Saturday</strong>
 * @property {string<integer>} duration     The duration of the schedule (in hours) for the schedule
 * @property {string<boolean>} status       The state of the schedule: <strong>true</strong> &rArr; <code>ON</code>; <strong>false</strong> &rArr; <code>OFF</code>
 * @property {string<integer>} time         The hour for the schedule to begin (24-hour, 0-indexed): <strong>0</strong> to <strong>23</strong> (<em>inclusive</em>)
 */

/**
 * Creates a new Twitch-style date input for schedules.
 * @author GitHub {@link https://github.com/ephellon @ephellon}
 *
 * @simply new DatePicker(defaultDate:Date?, defaultStatus:boolean?, defaultTime:number?<hour{0...23}>, defaultDuration:number?<milliseconds>) → Promise<array[object]>
 */
class DatePicker {
    static values = [];
    static weekdays = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ');
    static months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

    /** @constructor
     *
     * @param  {Date} [defaultDate]                     The date to highlight and use
     * @param  {boolean} [defaultStatus = false]        The default state for the scheduler: <strong>true</strong> &rArr; <code>ON</code>; <strong>false</strong> &rArr; <code>OFF</code>
     * @param  {number<integer>} [defaultTime = null]   The hour to use (24-hour, 0-indexed): <strong>0</strong> to <strong>23</strong> (<em>inclusive</em>)
     * @param  {number<integer>} [defaultDuration = 1]  The default duration (in hours): <strong>1</strong> to <strong>168</strong> (<em>inclusive</em>)
     * @return {PickedDate}                             A promised array containing the user's preferred schedule options
     */
    constructor(defaultDate, defaultStatus = false, defaultTime = null, defaultDuration = 1) {
        const date = +new Date(defaultDate ?? +new Date)
            , h = 60 * 60 * 1000
            , d = 24 * h
            , f = furnish;

        const locale = SETTINGS?.user_language_preference ?? 'en';
        const preExisting = defined(defaultDate) && (defined(defaultTime) || defaultDuration > 1);

        const now = new Date(date.floorToNearest(h))
            , timezone = (now + '').replace(/[^]+\(([^]+?)\)[^]*/, '$1').replace(/(?<=^|\s)(.)[^\s]*/g, '$1').replace(/\s+/g, '')
            , timeOptions = new Array(24).fill(0).map((v, i, a) => +now + (i * h)).map(d => new Date(d).getHours())
            , [timeDefault] = [defaultTime, ...timeOptions].filter(defined)
            , [AM, PM] = [11, 23].map(h => new Date(`1970-01-01T${ h }:00:00Z`).toLocaleTimeString(locale).toLocaleUpperCase().replace(/(?:.+?)(\D*)$/, '$1').trim())
            , startingHour = now.getHours()
            , meridiem = (startingHour < 12 ? AM : PM);

        let durationOptions = new Array(23).fill(0).map((v, i, a) => i + 1);

        durationOptions = [...durationOptions, ...new Array(7).fill(0).map((v, i, a) => 24 * (i + 1))];

        const dayOptions = new Array(7).fill(0).map((v, i, a) => i)
            , dayDefault = now.getDay();

        const statusOptions = new Array(2).fill(0).map((v, i, a) => !!i);

        /**
         * Converts a 24-hour time value to a 12-hour format string.
         * @param {number} time - The hour in 24-hour format.
         * @param {string[]} [symbols=[AM, PM]] - The symbols used for AM and PM.
         * @returns {string} The formatted 12-hour time.
         */
        const to12H = (time, symbols = [AM, PM]) => [(time == 0 ? 12 : time > 12 ? time - 12 : time), symbols[+(time > 11)]].join(' ');

        const daySelect = f(`select.edit`, { type: 'days', value: dayDefault, multiple: true, selected: 1, onchange: ({ currentTarget }) => currentTarget.setAttribute('selected', currentTarget.selectedOptions.length) },
                ...dayOptions.map(value => f(`option${ (value == dayDefault ? '[selected]' : '') }`, { value, 'tr-id': 'day-of-week' }, DatePicker.weekdays[value]))
            )

            , statusSelect = f(`select.edit`, { type: 'status', value: defaultStatus, 'tr-id': 'toggle' },
                ...statusOptions.map(value => f(`option${ (value == defaultStatus ? '[selected]' : '') }`, { value }, 'off on'.split(' ')[+value]))
            )

            , timeSelect = f(`select.edit`, { type: 'time', value: timeDefault },
                ...timeOptions.map(value =>
                    f(`option${ (value == timeDefault ? '[selected]' : '') }`, { value },
                        (
                            AM.length && PM.length
                                // Uses meridiem indicators
                                ? to12H(value, (value % 12 ? [AM, PM] : [' \u{1f31a}', ' \u{1f31e}']))
                                // Uses 24H format only
                                : value + (value % 12 ? '' : [' \u{1f31a}', ' \u{1f31e}'][+(value > 11)])
                        )
                    )
                )
            )

            , durationSelect = f(`select.edit`, { type: 'duration', value: defaultDuration },
                ...durationOptions.map(value => {
                    const timeString = toTimeString(value * h)
                        , timeType = timeString.replace(/[^a-z]|s$/ig, '').replace(/ie$/i, 'y');

                    return f(`option${ (value == defaultDuration ? '[selected]' : '') }`, { value, 'tr-id': timeType }, timeString);
                })
            );

        daySelect.value = dayDefault;

        const container =
            f(`.tt-modal-wrapper.context-root`).with(
                f(`.tt-modal-body`).with(
                    f(`.tt-modal-container`).with(
                        // Header
                        f('.tt-modal-header').with(
                            f('h3', { innerHTML: Glyphs.modify('calendar', { height: 30, width: 30 }).toString() }, ' Create a new schedule')
                        ),

                        // Body
                        f('.tt-modal-content.details.context-body').with(
                            f('div', { style: 'width:-webkit-fill-available; width:-moz-available' },
                                // Frequency
                                f('div', { 'pad-bottom': true },
                                    f('.title').with('Frequency'),
                                    f('.summary').with(
                                        daySelect,

                                        f('.subtitle', {
                                            innerHTML: `Use <code>${ GetMacro('Ctrl') }</code> and/or <code>${ GetMacro('Shift') }</code> to select multiple days.`
                                        })
                                    )
                                ),

                                // Status & Functionality
                                f('div', { 'pad-bottom': true },
                                    f('.title').with('Functionality'),
                                    f('.summary').with(
                                        statusSelect,
                                        'at',
                                        timeSelect,
                                        'for',
                                        durationSelect,

                                        f('.subtitle', {
                                            innerHTML: `Times will be saved in your current timezone <span>(${ timezone })</span>.`
                                        })
                                    )
                                ),

                                // Submit / Cancel
                                f('div', { 'pad-bottom': true },
                                    // Add more
                                    f('div', { style: 'width:fit-content' },
                                        f('.checkbox.left', { onmouseup: event => $('input', event.currentTarget).click() },
                                            f('input.add-more', { type: 'checkbox', name: 'add-more-times' }),
                                            f('label', { for: 'add-more-times' }, 'Add another schedule')
                                        )
                                    ),

                                    // Continue
                                    f('button', {
                                        'tr-id': 'ok',

                                        onmousedown: event => {
                                            const { currentTarget } = event;

                                            const values = $.all('select[type]', currentTarget.closest('.context-body')).map(select => [select.getAttribute('type'), (select.multiple ? [...select.selectedOptions].map(option => option.value) : select.value)]);

                                            const object = {};

                                            for(const [key, value] of values)
                                                object[key] = value;

                                            DatePicker.values.push(object);
                                        },

                                        onmouseup: event => {
                                            let { currentTarget } = event
                                                , addNew = $('.add-more', currentTarget.closest(':not(button)')).checked;

                                            if(addNew)
                                                new DatePicker();
                                            else
                                                $('#date-picker-value').value = JSON.stringify(DatePicker.values.filter(defined));

                                            wait(100).then(() => currentTarget.closest('.context-root')?.remove());
                                        },
                                    }, ['Continue', 'Save'][+preExisting]),

                                    // Cancel
                                    f(`button.${ ['edit', 'remove'][+preExisting] }`, {
                                        'tr-id': ['nk', 'rm'][+preExisting],

                                        onmousedown: event => DatePicker.values.push(null),

                                        onmouseup: event => {
                                            const { currentTarget } = event;

                                            $('#date-picker-value').value = JSON.stringify(DatePicker.values.filter(defined));

                                            wait(100).then(() => currentTarget.closest('.context-root')?.remove());
                                        },
                                    }, ['Cancel', 'Delete'][+preExisting]),

                                    // Hidden
                                    f('input#date-picker-value', { type: 'text', style: 'display:none!important' })
                                )
                            )
                        )
                    )
                )
            );

        // Translate(locale, container);

        document.body.append(container);

        return when.defined(() => JSON.parse($('#date-picker-value')?.value || 'null')).then(values => {
            DatePicker.values = [];
            return values;
        });
    }
}

/**
 * An over-arching command-maker schema.
 * @typedef {object} Command
 *
 * @property {string<integer>} authority        The authority level that user's need to use the command
 * @property {string<array>} command            The command and aliases (comma-separated)
 * @property {string<integer~seconds>} cooldown The cooldown time (in seconds)
 * @property {string} reply                     The reply to send when the command is invoked
 * @property {string} type                      The type of command: <strong>reply</strong>, <strong>announcement</strong>, <strong>recurring</strong>
 */

/** @FIXME
 * Creates a new Twitch-style command input.
 * @author GitHub {@link https://github.com/ephellon @ephellon}
 *
 * @simply new CommandMaker(defaultName:string, defaultStatus:boolean?, defaultLevel:number?<Command-Authority>, defaultCooldown:number?<seconds>, defaultType:string?) → Promise<array[object]>
 */
class CommandMaker {
    static values = [];
    /**
     * An over-arching authority-level schema. Used by StreamElements and NightBot.
     * @typedef {enum} AuthorityLevels
     *
     * @property {number} everyone      <strong>100</strong>  &rarr; <em>Anyone</em>, <em>Everyone</em>
     * @property {number} follower      <strong>250</strong>  &rarr; <em>Follower</em>, <em>Regular</em>
     * @property {number} subscriber    <strong>300</strong>  &rarr; <em>Subscriber</em>
     * @property {number} vip           <strong>400</strong>  &rarr; <em>VIP</em>
     * @property {number} moderator     <strong>500</strong>  &rarr; <em>Moderator</em>
     * @property {number} admin         <strong>1000</strong> &rarr; <em>Administrator</em>, <em>Super Moderator</em>
     * @property {number} owner         <strong>1500</strong> &rarr; <em>Broadcaster</em>, <em>Owner</em>
     */
    static levels = [['Everyone', 100], ['Follower', 250], ['Subscriber', 300], ['VIP', 400], ['Moderator', 500], ['Administrator', 1000], ['Owner', 1500]].map(([who, authority]) => [new String(who), authority]).map(([who, authority]) =>
        CommandMaker[who.toLowerCase()] = Object.defineProperties(who, {
            find: {
                value(value) {
                    const levels = {
                        owner: 1500,
                        broadcaster: 1500,
                        administrator: 1000,
                        moderator: 500,
                        vip: 400,
                        subscriber: 300,
                        regular: 250,
                        follower: 250,
                        everyone: 100,
                        anyone: 100,
                    };

                    for(const level in levels)
                        if(level.startsWith(value?.toLowerCase?.()))
                            return levels[level];

                    return value;
                }
            },
            level: { value: authority },
            not: { value(level) { return this.level < this.find(level) } },
            is: { value(level) { return this.level >= this.find(level) } },
        })
    );

    static badges = {
        everyone: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png',
        follower: 'https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/3',
        subscriber: 'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3',
        vip: 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3',
        moderator: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3',
        admin: 'https://static-cdn.jtvnw.net/badges/v1/d97c37bd-a6f5-4c38-8f57-4e4bef88af34/3',
        owner: 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3',
    };

    /** @constructor
     *
     * @param  {string} [defaultName]                                                       The default command name
     * @param  {boolean} [defaultStatus = true]                                             The default command-enabled status
     * @param  {number<integer~AuthorityLevels>} [defaultLevel = CommandMaker.everyone]     The default authority-level for command usage
     * @param  {number<integer~seconds>} [defaultCooldown = { user: 10, global: 3 }]        The cooldown time (in seconds)
     * @param  {string} [defaultType = "reply"]                                             The command type: <strong>reply</strong>, <strong>announcement</strong>, <strong>recurring</strong>
     * @return {Promise<array~Command>}                                                     A promised array containing commands
     */
    constructor(defaultName, defaultStatus = true, defaultLevel = CommandMaker.everyone, defaultCooldown = { user: 10, global: 3 }, defaultType = 'reply') {
        const f = furnish;
        const locale = SETTINGS?.user_language_preference ?? 'en';
        const preExisting = defaultName?.length > 0;

        const who = f('select.edit#authority', {
                value: defaultLevel,
                style: `background-image:url("${ CommandMaker.badges.everyone }")`,

                onchange({ target }) {
                    const [selected] = target.selectedOptions
                        , who = selected.getAttribute('name');

                    target.modStyle(`background-image:url("${ CommandMaker.badges[who] }")`);
                },
            }).with(
            ...CommandMaker.levels.map(who =>
                f(`option[value=${ who.level }][name=${ who.toLowerCase() }]`).with(
                    who.replace(/[^aeiou]$/i, '$&s')
                        .replace(/^(admin|staff)s$/i, 'Twitch Staff & $&')
                        .replace(/^(owner)s$/i, 'Only you ($1)')
                )
            )
            )
            , type = f('select.edit#type', {
                value: defaultType,

                onchange({ target }) {
                    const [selected] = target.selectedOptions
                        , type = selected.value;
                },
            }).with(
                f('option[value=reply]').with('Individual reply'), // An individual response
                f('option[value=announcement]').with('General reply (announcement)'), // A general response
                f('option[value=recurring]').with('A recurring announcement'), // A recurring-notice
            )
            , each = f('span[fix-unit=sec]').with(f(`input#cooldown.edit`, { type: 'number', min: 0, max: 2_592_000, value: 10 }));

        const conversionTable = [3600, 28800, 86400, 6048001, 2592000].map(s => `${ toTimeString(s * 1000) } = ${ comify(s) }`).join(' • ');

        const container =
            f(`.tt-modal-wrapper.context-root`).with(
                f(`.tt-modal-body`).with(
                    f(`.tt-modal-container`).with(
                        // Header
                        f('.tt-modal-header').with(
                            f('h3', { innerHTML: Glyphs.modify('chat', { height: 30, width: 30 }).toString() }, ' Create a new command')
                        ),

                        // Body
                        f('.tt-modal-content.details.context-body').with(
                            f('div', { style: 'width:-webkit-fill-available; width:-moz-available' },
                                // Frequency
                                f('div', { 'pad-bottom': true },
                                    f('.title').with('Metadata'),
                                    f('.summary').with(
                                        f.h4('Name'),
                                        f('span[pre-unit=!]').with(f(`input#command`, { placeholder: "Command name(s)", pattern: '.{1,100}' })),
                                        f('.subtitle', {
                                            style: 'margin-bottom: .5rem',
                                            innerHTML: `This is what users type into chat to activate the command. Use a comma (<code>,</code>) to separate names.`
                                        }),

                                        f.h4('Type'),
                                        type,
                                        f('.subtitle', {
                                            style: 'margin-bottom: .5rem',
                                            innerHTML: `This determines how the command is handled.`
                                        }),

                                        f.h4('Response'),
                                        f(`input#reply`, { placeholder: "Reply...", type: 'text' }),
                                        f('.subtitle', {
                                            style: 'margin-bottom: .5rem',
                                            innerHTML: `This is what will be replied to chat.`
                                        })
                                    )
                                ),

                                // Functionality
                                f('div', { 'pad-bottom': true },
                                    f('.title').with('User(s)'),
                                    f('.summary').with(
                                        f.div(who, 'can use the command.')
                                    )
                                ),

                                f('div', { 'pad-bottom': true },
                                    f('.title').with('Cooldown'),
                                    f('.summary').with(
                                        f.div('The ', f.ins('per person'), ' cooldown is ', each),
                                        f.hr(),
                                        f('.subtitle').with(conversionTable)
                                    )
                                ),

                                // Submit / Cancel
                                f('div', { 'pad-bottom': true },
                                    // Notice...
                                    f('.subtitle', {
                                        innerHTML: `Commands will only be available while you are <b alert-text top-tooltip='Have chat open'>online</b>.`
                                    }),

                                    // Add more
                                    f('div', { style: 'width:fit-content' },
                                        f('.checkbox.left', { onmouseup: event => $('input', event.currentTarget).click() },
                                            f('input.add-more', { type: 'checkbox', name: 'add-more-commands' }),
                                            f('label', { for: 'add-more-commands' }, 'Add another command')
                                        )
                                    ),

                                    // Continue
                                    f('button', {
                                        'tr-id': 'ok',

                                        onmousedown: event => {
                                            const { currentTarget } = event;

                                            const values = $.all('[id]', currentTarget.closest('.context-body')).map(element => [element.getAttribute('id'), (element.multiple ? [...element.selectedOptions].map(option => option.value) : element.value)]);

                                            const object = {};

                                            for(const [key, value] of values)
                                                object[key] = value;

                                            CommandMaker.values.push(object);
                                        },

                                        onmouseup: event => {
                                            let { currentTarget } = event
                                                , addNew = $('.add-more', currentTarget.closest(':not(button)')).checked;

                                            // TODO - handle multiple names (,) delimeted
                                            if(addNew)
                                                new CommandMaker();
                                            else
                                                $('.command-maker-value').value = JSON.stringify(CommandMaker.values.filter(defined));

                                            wait(100).then(() => currentTarget.closest('.context-root')?.remove());
                                        },
                                    }, ['Continue', 'Save'][+preExisting]),

                                    // Cancel
                                    f(`button.${ ['edit', 'remove'][+preExisting] }`, {
                                        'tr-id': ['nk', 'rm'][+preExisting],

                                        onmousedown: event => CommandMaker.values.push(null),

                                        onmouseup: event => {
                                            const { currentTarget } = event;

                                            $('.command-maker-value').value = JSON.stringify(CommandMaker.values.filter(defined));

                                            wait(100).then(() => currentTarget.closest('.context-root')?.remove());
                                        },
                                    }, ['Cancel', 'Delete'][+preExisting]),

                                    // Hidden
                                    f('input.command-maker-value', { type: 'text', style: 'display:none!important' })
                                )
                            )
                        )
                    )
                )
            );

        // Translate(locale, container);

        document.body.append(container);

        return when.defined(() => JSON.parse($('.command-maker-value')?.value || 'null')).then(values => {
            CommandMaker.values = [];
            return values;
        });
    }
}

let Glyphs = {
    // Twitch
    ...top.Glyphs,

    // Accessibility
    accessible: '<svg fill="var(--white)" width="100%" height="100%" version="1.1" viewBox="0 0 1224 792" x="0px" y="0px" enable-background="new 0 0 1224 792" xml:space="preserve"><g><path d="M833.556,367.574c-7.753-7.955-18.586-12.155-29.656-11.549l-133.981,7.458l73.733-83.975   c10.504-11.962,13.505-27.908,9.444-42.157c-2.143-9.764-8.056-18.648-17.14-24.324c-0.279-0.199-176.247-102.423-176.247-102.423   c-14.369-8.347-32.475-6.508-44.875,4.552l-85.958,76.676c-15.837,14.126-17.224,38.416-3.097,54.254   c14.128,15.836,38.419,17.227,54.255,3.096l65.168-58.131l53.874,31.285l-95.096,108.305   c-39.433,6.431-74.913,24.602-102.765,50.801l49.66,49.66c22.449-20.412,52.256-32.871,84.918-32.871   c69.667,0,126.346,56.68,126.346,126.348c0,32.662-12.459,62.467-32.869,84.916l49.657,49.66   c33.08-35.166,53.382-82.484,53.382-134.576c0-31.035-7.205-60.384-20.016-86.482l51.861-2.889l-12.616,154.75   c-1.725,21.152,14.027,39.695,35.18,41.422c1.059,0.086,2.116,0.127,3.163,0.127c19.806,0,36.621-15.219,38.257-35.306   l16.193-198.685C845.235,386.445,841.305,375.527,833.556,367.574z"/><path d="M762.384,202.965c35.523,0,64.317-28.797,64.317-64.322c0-35.523-28.794-64.323-64.317-64.323   c-35.527,0-64.323,28.8-64.323,64.323C698.061,174.168,726.856,202.965,762.384,202.965z"/><path d="M535.794,650.926c-69.668,0-126.348-56.68-126.348-126.348c0-26.256,8.056-50.66,21.817-70.887l-50.196-50.195   c-26.155,33.377-41.791,75.393-41.791,121.082c0,108.535,87.983,196.517,196.518,196.517c45.691,0,87.703-15.636,121.079-41.792   l-50.195-50.193C586.452,642.867,562.048,650.926,535.794,650.926z"/></g></svg>',

    // Creative Commons
    cc: '<svg fill="var(--grey)" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M10.089 19.0119C15.0659 19.0119 19.1004 14.9773 19.1004 10.0005C19.1004 5.02361 15.0659 0.989075 10.089 0.989075C5.11217 0.989075 1.07764 5.02361 1.07764 10.0005C1.07764 14.9773 5.11217 19.0119 10.089 19.0119Z" fill="white"></path><path d="M9.98172 0C12.779 0 15.1606 0.976578 17.1246 2.9288C18.0647 3.86912 18.7794 4.94383 19.2675 6.15197C19.7553 7.36043 20 8.64295 20 10.0002C20 11.3692 19.7584 12.6521 19.2769 13.848C18.7947 15.0443 18.0831 16.1012 17.1431 17.0178C16.1671 17.9818 15.0599 18.7203 13.8215 19.2322C12.5836 19.7441 11.3036 20 9.98234 20C8.66107 20 7.39605 19.7475 6.1876 19.2409C4.97945 18.7353 3.896 18.0031 2.93755 17.045C1.97909 16.0868 1.25002 15.0062 0.750012 13.8037C0.250004 12.6011 0 11.3336 0 10.0002C0 8.67857 0.252816 7.40793 0.758762 6.1876C1.26471 4.96727 2.00003 3.87506 2.96411 2.91067C4.86883 0.97064 7.20793 0 9.98172 0ZM10.018 1.80378C7.73231 1.80378 5.80947 2.6016 4.24975 4.19663C3.4638 4.99445 2.85973 5.89009 2.43723 6.88417C2.01409 7.87825 1.80315 8.91701 1.80315 10.0005C1.80315 11.072 2.01409 12.1049 2.43723 13.0983C2.86004 14.093 3.4638 14.9799 4.24975 15.7596C5.03539 16.5396 5.92197 17.1343 6.91073 17.5456C7.89856 17.9562 8.93451 18.1615 10.018 18.1615C11.0892 18.1615 12.1274 17.9537 13.1346 17.5368C14.1405 17.1196 15.0474 16.519 15.8574 15.7334C17.4168 14.2096 18.1962 12.2989 18.1962 10.0008C18.1962 8.89358 17.9937 7.84606 17.589 6.85792C17.185 5.86978 16.5953 4.98914 15.8221 4.21475C14.214 2.60754 12.2799 1.80378 10.018 1.80378ZM9.89265 8.33982L8.55295 9.03639C8.40982 8.7392 8.2345 8.53045 8.02638 8.41138C7.81793 8.29263 7.62449 8.23294 7.44574 8.23294C6.55323 8.23294 6.10635 8.82201 6.10635 10.0008C6.10635 10.5364 6.21947 10.9645 6.44541 11.2861C6.67167 11.6077 7.00511 11.7686 7.44574 11.7686C8.02919 11.7686 8.43982 11.4827 8.67826 10.9114L9.91016 11.5364C9.64828 12.0249 9.28515 12.4086 8.82076 12.6883C8.35701 12.9683 7.84481 13.108 7.28511 13.108C6.39229 13.108 5.67165 12.8346 5.12414 12.2864C4.57663 11.7389 4.30288 10.977 4.30288 10.0011C4.30288 9.04858 4.57976 8.29294 5.13321 7.73325C5.68665 7.17386 6.38604 6.89386 7.23168 6.89386C8.47013 6.89323 9.35671 7.37543 9.89265 8.33982ZM15.6606 8.33982L14.339 9.03639C14.1962 8.7392 14.0202 8.53045 13.8121 8.41138C13.6033 8.29263 13.4036 8.23294 13.214 8.23294C12.3211 8.23294 11.8742 8.82201 11.8742 10.0008C11.8742 10.5364 11.9877 10.9645 12.2136 11.2861C12.4396 11.6077 12.7727 11.7686 13.214 11.7686C13.7968 11.7686 14.2077 11.4827 14.4455 10.9114L15.6956 11.5364C15.4221 12.0249 15.0527 12.4086 14.589 12.6883C14.1246 12.9683 13.6187 13.108 13.0711 13.108C12.1661 13.108 11.4433 12.8346 10.902 12.2864C10.3595 11.7389 10.0889 10.977 10.0889 10.0011C10.0889 9.04858 10.3655 8.29294 10.9195 7.73325C11.4727 7.17386 12.1721 6.89386 13.0174 6.89386C14.2555 6.89323 15.1371 7.37543 15.6606 8.33982Z"></path></svg>',

    // GitHub
    github: '<svg fill="currentColor" width="32" height="32" version="1.1" viewBox="0 0 16 16" x="0px" y="0px"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>',

    // Google Chrome
    chrome: '<svg width="100%" height="100%" version="1.1" viewbox="0 0 190 190" x="0px" y="0px"><circle fill="#FFF" cx="85.314" cy="85.713" r="83.805"/><path fill-opacity=".1" d="M138.644 100.95c0-29.454-23.877-53.331-53.33-53.331-29.454 0-53.331 23.877-53.331 53.331H47.22c0-21.039 17.055-38.094 38.093-38.094s38.093 17.055 38.093 38.094"/><circle fill-opacity=".1" cx="89.123" cy="96.379" r="28.951"/><linearGradient id="a" gradientUnits="userSpaceOnUse" x1="-149.309" y1="-72.211" x2="-149.309" y2="-71.45" gradientTransform="matrix(82 0 0 82 12328.615 5975.868)"><stop offset="0" stop-color="#81b4e0"/><stop offset="1" stop-color="#0c5a94"/></linearGradient><circle fill="url(#a)" cx="85.314" cy="85.712" r="31.236"/><linearGradient id="b" gradientUnits="userSpaceOnUse" x1="-114.66" y1="591.553" x2="-114.66" y2="660.884" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-color="#f06b59"/><stop offset="1" stop-color="#df2227"/></linearGradient><path fill="url(#b)" d="M161.5 47.619C140.525 5.419 89.312-11.788 47.111 9.186a85.315 85.315 0 0 0-32.65 28.529l34.284 59.426c-6.313-20.068 4.837-41.456 24.905-47.77a38.128 38.128 0 0 1 10.902-1.752"/><linearGradient id="c" gradientUnits="userSpaceOnUse" x1="-181.879" y1="737.534" x2="-146.834" y2="679.634" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-color="#388b41"/><stop offset="1" stop-color="#4cb749"/></linearGradient><path fill="url(#c)" d="M14.461 37.716c-26.24 39.145-15.78 92.148 23.363 118.39a85.33 85.33 0 0 0 40.633 14.175l35.809-60.948c-13.39 16.229-37.397 18.529-53.625 5.141a38.096 38.096 0 0 1-11.896-17.33"/><linearGradient id="d" gradientUnits="userSpaceOnUse" x1="-64.479" y1="743.693" x2="-101.81" y2="653.794" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-color="#e4b022"/><stop offset=".3" stop-color="#fcd209"/></linearGradient><path fill="url(#d)" d="M78.457 170.28c46.991 3.552 87.965-31.662 91.519-78.653a85.312 85.312 0 0 0-8.477-44.007H84.552c21.036.097 38.014 17.23 37.917 38.269a38.099 38.099 0 0 1-8.205 23.443"/><linearGradient id="e" gradientUnits="userSpaceOnUse" x1="-170.276" y1="686.026" x2="-170.276" y2="625.078" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-opacity=".15"/><stop offset=".3" stop-opacity=".06"/><stop offset="1" stop-opacity=".03"/></linearGradient><path fill="url(#e)" d="M14.461 37.716l34.284 59.426a38.093 38.093 0 0 1 1.523-25.904L15.984 35.43"/><linearGradient id="f" gradientUnits="userSpaceOnUse" x1="-86.149" y1="705.707" x2="-128.05" y2="748.37" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-opacity=".15"/><stop offset=".3" stop-opacity=".06"/><stop offset="1" stop-opacity=".03"/></linearGradient><path fill="url(#f)" d="M78.457 170.28l35.809-60.948a38.105 38.105 0 0 1-22.095 12.951L76.933 170.28"/><linearGradient id="chrome-logo-gradient" gradientUnits="userSpaceOnUse" x1="-86.757" y1="717.981" x2="-80.662" y2="657.797" gradientTransform="translate(202.64 -591.17)"><stop offset="0" stop-opacity=".15"/><stop offset=".3" stop-opacity=".06"/><stop offset="1" stop-opacity=".03"/></linearGradient><path fill="url(#chrome-logo-gradient)" d="M161.5 47.619H84.552a38.094 38.094 0 0 1 29.712 14.476l48.759-12.189"/></svg>',
};

let SETTINGS
    , TRANSLATED = false
    , INITIAL_LOAD = true;

let SUPPORTED_LANGUAGES = ['bg', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 'hu', 'it', 'ja', 'ko', 'nl', 'no', 'pl', 'ro', 'ru', 'sk', 'sv', 'th', 'tr', 'vi'];

/**
 * Regenerates the UI elements for a set of filtering or phrase rules.
 * @param {string} rules - A delimited string of rules.
 * @param {string} ruleType - The category of the rules.
 * @param {string} [delimeter=','] - The character used to separate rules.
 * @param {string} [scopes='all'] - The allowed scopes for rule identification.
 */
function RedoRuleElements(rules, ruleType, delimeter, scopes) {
    if(nullish(rules))
        return;

    delimeter ??= ',';
    scopes ??= 'all';

    rules = rules.split(delimeter).sort();

    if(scopes.equals('all'))
        scopes = 'channel user badge emote text regexp';
    scopes = scopes.split(' ');

    for(const rule of rules) {
        if(!rule?.length)
            continue;

        const E = document.createElement('button')
            , R = document.createElement('button');

        const ruleID = UUID.from(rule).value;

        let itemType;

        if(scopes.contains('channel') && /^\/[\w+\-]+/.test(rule)) {
            itemType = 'channel'
        } else if(scopes.contains('user') && /^@[\w+\-]+/.test(rule)) {
            itemType = 'user'
        } else if(scopes.contains('badge') && /^<[^>]+>/.test(rule)) {
            itemType = 'badge'
        } else if(scopes.contains('emote') && /^:[\w\-]+:$/.test(rule)) {
            itemType = 'emote'
        } else if(scopes.contains('text') && /^[\w]+$/.test(rule)) {
            itemType = 'text'
        } else if(scopes.contains('regexp')) {
            itemType ??= 'regexp'
        }

        itemType ??= 'text';

        if($.defined(`#${ ruleType }_rules [${ ruleType }-type="${ itemType }"i] [${ ruleType }-id="${ ruleID }"i]`))
            continue;

        // "Edit" button
        E.innerHTML = `<code fill>${ encodeHTML(rule) }</code>`;
        E.classList.add('edit');
        E.setAttribute(`${ ruleType }-id`, ruleID);

        E.onclick = event => {
            let { currentTarget } = event
                , { textContent } = currentTarget
                , input = $(`#${ ruleType }_rules-input`);

            input.value = [...input.value.split(delimeter), textContent].filter(v => v?.trim()?.length).join(delimeter);

            currentTarget.remove();
        };

        E.setAttribute('up-tooltip', `Edit rule`);
        E.setAttribute('tr-skip', true);
        E.append(R);

        // "Remove" button
        R.id = ruleID;
        R.innerHTML = Glyphs.modify('trash', { fill: 'white', height: '20px', width: '20px' });
        R.classList.add('remove');

        R.onclick = event => {
            let { currentTarget } = event
                , { id } = currentTarget;

            $(`[${ ruleType }-id="${ id }"]`)?.remove();

            event.stopPropagation();
        };

        R.setAttribute('up-tooltip', `Remove rule`);

        $(`#${ ruleType }_rules [${ ruleType }-type="${ itemType }"i]`).setAttribute('not-empty', true);
        $(`#${ ruleType }_rules [${ ruleType }-type="${ itemType }"i]`)?.append(E);
        $(`#${ ruleType }_rules-input`).value = '';
    }
}

/**
 * Regenerates the UI elements for a set of scheduled times.
 * @param {string} schedules - A JSON string containing schedule data.
 * @param {string} scheduleType - The category of the schedule.
 */
function RedoTimeElements(schedules, scheduleType) {
    if(!schedules?.length)
        return;

    schedules = JSON.parse(schedules);

    for(const schedule of schedules) {
        const { days, time, duration, status } = schedule;

        // Add buttons per day
        if(defined(days))
            for(const day of days)
                /**
                 * Creates and appends a UI element for a single scheduled time slot.
                 * @param {Object} self - The schedule details containing day, time, duration, and status.
                 * @param {string} scheduleType - The category of the schedule.
                 */
                CreateTimeElement(({ day, time, duration, status }), scheduleType);
        else
            CreateTimeElement(schedule, scheduleType);
    }
}

function CreateTimeElement(self, scheduleType) {
    let { day, time, duration, status } = self
        , scheduleID = UUID.from(self).value;

    if($.defined(`#${ scheduleType }_schedule [day="${ day }"][time="${ time }"]`))
        return;

    const E = document.createElement('button')
        , R = document.createElement('button');

    // "Edit" button
    E.innerHTML = `<code fill>${ encodeHTML(`${ ['\u{1f534}', '\u{1f7e2}'][+parseBool(status)] } ${ time }:00 + ${ toTimeString(duration * 3_600_000, '?hours_h') }`) }</code>`;
    E.classList.add('edit');
    E.setAttribute(`${ scheduleType }-id`, scheduleID);

    for(const key in self)
        E.setAttribute(key, self[key]);

    E.onclick = event => {
        const { currentTarget } = event;

        const day = parseInt(currentTarget.getAttribute('day'))
            , time = parseInt(currentTarget.getAttribute('time'))
            , duration = parseInt(currentTarget.getAttribute('duration'))
            , status = parseBool(currentTarget.getAttribute('status'));

        let date = new Date
            , dayOffset = (date.getDate() - (date.getDay() - day));

        dayOffset = (dayOffset > 0)
            ? dayOffset
            : dayOffset + 7;

        const offset = new Date([DatePicker.months[date.getMonth()], dayOffset, date.getFullYear(), time].join(' '));

        new DatePicker(offset, status, time, duration).then(schedules => RedoTimeElements(JSON.stringify(schedules), scheduleType));

        currentTarget.remove();
    };

    E.setAttribute('up-tooltip', `Edit schedule`);
    E.setAttribute('tr-skip', true);
    E.append(R);

    // "Remove" button
    R.id = scheduleID;
    R.innerHTML = Glyphs.modify('trash', { fill: 'white', height: '20px', width: '20px' });
    R.classList.add('remove');

    R.onclick = event => {
        let { currentTarget } = event
            , { id } = currentTarget;

        $(`[${ scheduleType }-id="${ id }"]`)?.remove();

        event.stopPropagation();
    };

    R.setAttribute('up-tooltip', `Remove schedule`);

    // Add to parent container
    $(`#${ scheduleType }_schedule [day-of-week="${ day }"i]`)?.setAttribute('not-empty', true);
    $(`#${ scheduleType }_schedule [day-of-week="${ day }"i]`)?.append(E);
}

/**
 * Collects values from the settings UI and saves them to the global settings object.
 * @returns {Promise<void>}
 */
async function SaveSettings() {
    const { extractValue } = SaveSettings;

    const elements = $.all(usable_settings.map(name => '#' + name + ':not(:invalid)').join(', '))
        , using = elements.map(element => element.id);

    // Edit settings before exporting them (if needed)
    for(const id of using)
        switch(id) {
            case 'filter_rules': {
                let rules = []
                    , input = extractValue($('#filter_rules-input'));

                if(parseBool(input))
                    rules = input.split(',');

                for(const rule of $.all('#filter_rules code'))
                    rules.push(rule.textContent);
                rules = rules.isolate().filter(rule => rule.length);

                SETTINGS.filter_rules = rules.sort().join(',');

                RedoRuleElements(SETTINGS.filter_rules, 'filter');
            } break;

            case 'phrase_rules': {
                let rules = []
                    , input = extractValue($('#phrase_rules-input'));

                if(parseBool(input))
                    rules = input.split(',');

                for(const rule of $.all('#phrase_rules code'))
                    rules.push(rule.textContent);
                rules = rules.isolate().filter(rule => rule.length);

                SETTINGS.phrase_rules = rules.sort().join(',');

                RedoRuleElements(SETTINGS.phrase_rules, 'phrase');
            } break;

            case 'lurking_rules': {
                let rules = []
                    , input = extractValue($('#lurking_rules-input'));

                if(parseBool(input))
                    rules = input.split(';');

                for(const rule of $.all('#lurking_rules code'))
                    rules.push(rule.textContent);
                rules = rules.isolate().filter(rule => rule.length);

                SETTINGS.lurking_rules = rules.sort().join(';');

                RedoRuleElements(SETTINGS.lurking_rules, 'lurking', ';', 'channel badge text');
            } break;

            case 'away_mode_schedule': {
                const times = [];

                for(const button of $.all('#away_mode_schedule button[duration]')) {
                    const day = parseInt(button.getAttribute('day'))
                        , time = parseInt(button.getAttribute('time'))
                        , duration = parseInt(button.getAttribute('duration'))
                        , status = parseBool(button.getAttribute('status'));

                    times.push({ day, time, duration, status });
                }

                const validTimes = [];

                for(const object of times) {
                    const { day, time, duration } = object;

                    if(false
                        || (day < 0 || day > 6)
                        || (time < 0 || time > 23)
                        || (duration < 1)
                    )
                        continue;

                    validTimes.push(object);
                }

                SETTINGS.away_mode_schedule = JSON.stringify(validTimes.isolate());

                RedoTimeElements(SETTINGS.away_mode_schedule, 'away_mode');
            } break;

            case 'away_mode__volume': {
                const volume = extractValue($('#away_mode__volume'));

                SETTINGS.away_mode__volume = parseFloat(volume) / 100;
            } break;

            case 'user_language_preference': {
                const preferred = extractValue($('#user_language_preference'));

                SETTINGS.user_language_preference = preferred.toLowerCase();
            } break;

            default:{
                SETTINGS[id] = extractValue($(`#${ id }`));
            } break;
        } // switch id

    return await Storage.set(SETTINGS);
}

Object.defineProperties(SaveSettings, {
    extractValue: {
        value: element => {
            return element[{
                'date': 'value',
                'text': "value",
                'time': 'value',
                'radio': 'checked',
                'number': 'value',
                'checkbox': 'checked',
                'select-one': 'value',
            }[element.type]];
        },

        ...PRIVATE_OBJECT_CONFIGURATION
    },
});

/**
 * Retrieves saved settings from storage and populates the settings UI.
 * @param {Object|null} [OVER_RIDE_SETTINGS=null] - Optional settings to use instead of stored ones.
 * @returns {Promise<void>}
 */
async function LoadSettings(OVER_RIDE_SETTINGS = null) {
    const assignValue = LoadSettings.assignValue;

    const elements = $.all(usable_settings.map(name => '#' + name).join(', '))
        , using = elements.map(element => element.id);

    return await Storage.get(null, settings => {
        // Anything never saved starts at its declared default
        SETTINGS = OVER_RIDE_SETTINGS ?? { ...SETTINGS_DEFAULTS, ...settings };

        loading:
        for(const id of using) {
            const element = $(`#${ id }`);

            switch(id) {
                case 'filter_rules': {
                    const rules = SETTINGS[id];

                    RedoRuleElements(rules, 'filter');
                } break;

                case 'phrase_rules': {
                    const rules = SETTINGS[id];

                    RedoRuleElements(rules, 'phrase');
                } break;

                case 'lurking_rules': {
                    const rules = SETTINGS[id];

                    RedoRuleElements(rules, 'lurking', ';', 'channel badge text');
                } break;

                case 'away_mode_schedule': {
                    const times = SETTINGS[id];

                    RedoTimeElements(times, 'away_mode');
                } break;

                case 'away_mode__volume': {
                    const volume = SETTINGS[id];

                    assignValue(element, volume * 100);
                } break;

                case 'user_language_preference': {
                    const preferred = (null
                        ?? SETTINGS[id]
                        ?? (top.navigator?.userLanguage ?? top.navigator?.language ?? 'en').toLowerCase().split('-').reverse().pop()
                    );

                    assignValue(element, preferred);

                    if(TRANSLATED)
                        continue loading;

                    // Translate(document.documentElement.lang = preferred.toLowerCase());
                } break;

                case 'simplify_chat_font': {
                    $(`#${ id }`).setAttribute('style', `font-family:${ SETTINGS[id] } !important`);

                    assignValue(element, SETTINGS[id]);
                } break;

                default: {
                    const selected = $('[selected]', element);

                    if(defined(selected))
                        selected.removeAttribute('selected');

                    assignValue(element, SETTINGS[id]);
                } break;
            } // :loading | switch id
        } // :loading
    });
}

Object.defineProperties(LoadSettings, {
    assignValue: {
        value: (element, value) => {
            if(nullish(value))
                return;

            return element[{
                'date': 'value',
                'text': "value",
                'time': 'value',
                'radio': 'checked',
                'number': 'value',
                'checkbox': 'checked',
                'select-one': 'value',
            }[element.type]] = value || '';
        },

        ...PRIVATE_OBJECT_CONFIGURATION
    },
});

/**
 * Formats a snake_case string into a human-readable name.
 * @param {string} string - The string to format.
 * @returns {string} The formatted string.
 */
function depadName(string) {
    return string.replace(/(^|_)([a-z])/g, ($0, $1, $2, $$, $_) => ['', ' '][+!!$1] + $2.toUpperCase()).replace(/_+/g, ' -');
}

/* Auto-making tooltips */
setInterval(() => {
    $.all('input[type="number"i]:is([min], [max]):not([tooled])')
        .map(input => {
            const parent = input.closest(':not(input)')
                , min = input.getAttribute('min') || input.getAttribute('value') || '0'
                , max = input.getAttribute('max') || '&infin;';

            return ({ parent, min, max });
        })
        .map(({ parent, min, max }) => parent.setAttribute('top-tooltip', `${ min } &mdash; ${ max }`));
}, 250);

/* All of the "clickables" */

$.all('#whisper_audio_sound').map(element => element.onchange = async event => wait(100).then(() => $('#whisper_audio_sound-test')?.click()));

$.all('#whisper_audio_sound-test').map(button => button.onclick = async event => {
    const [selected] = $('#whisper_audio_sound').selectedOptions;
    const pathname = (/\b(568)$/.test(selected.value) ? '/message-tones/' : '/notification-sounds/') + selected.value;

    $('#sound-href').href = parseURL($('#sound-href').href).origin + pathname;

    const test_sound = furnish('audio#tt-test-sound', {
        style: 'display:none',

        innerHTML: ['mp3', 'ogg']
            .map(type => {
                const types = { mp3: 'mpeg' }
                    , src = `${ location.origin }/aud/${ selected.value }.${ type }`;

                type = `audio/${ types[type] ?? type }`;

                return furnish('source', { src, type }).outerHTML;
            }).join('')
    });

    test_sound.play();
    test_sound.onended = event => test_sound.remove();
});

$.all('#user_language_preference').map(select => {
    const languages = SUPPORTED_LANGUAGES;

    listing:
    for(const language of languages) {
        const ISO = top.ISO_639_1[language];

        if(nullish(ISO))
            continue listing;

        let { name, code, dialect } = ISO
            , [latin, native, regional] = unescape(name).split('/', 3);

        select.append(furnish('option', { value: code, innerHTML: `${ native } (${ regional }) &mdash; ${ latin }`.replace(/\s*\(\s*(?:undefined|null)?\s*\)/i, '') }));
    }

    Storage.get({ user_language_preference: '' }, ({ user_language_preference }) => {
        const lang = user_language_preference?.toLowerCase?.();

        $('option[selected]', select)?.removeAttribute?.('selected');
        $(`option[value="${ (select.value = lang) }"i]`, select)?.setAttribute('selected', true);
    });
});

$.all('#user_language_preference').map(select => select.onchange = async event => {
    let { currentTarget } = event
        , preferred = currentTarget.value;

    // Translate(document.documentElement.lang = preferred.toLowerCase());

    await Storage.set({ ...SETTINGS, user_language_preference: preferred });
});

$.all('#save, .save').map(element => element.onclick = async event => {
    const { currentTarget } = event;

    currentTarget.classList.add('spin');

    when.defined(() => {
        const invalid = $(usable_settings.map(name => '#' + name + ':invalid').join(', '));

        if(nullish(invalid))
            return true;

        const { top, left } = getOffset(invalid)
            , valid = invalid.checkValidity();

        invalid.scrollTo({ top, left });

        return [,true][+valid];
    })
        .then(SaveSettings)
        .catch(error => {
            currentTarget.setAttribute('style', 'background-color:var(--red)');

            $warn(error);
        })
        .finally(() => {
            wait(1500).then(() => {
                currentTarget.removeAttribute('style');
                currentTarget.classList.remove('spin');
            });
        });
});

$.all('#help, .help').map(element => element.onclick = async event => {
    $('#accessibility').scrollIntoView();
});

/**
 * Displays a temporary synchronization status message in the UI.
 * @param {string} [message='\u00A0'] - The message to display.
 * @param {string} [type='alert'] - The style type of the message.
 */
function PostSyncStatus(message = '\u00A0', type = 'alert') {
    clearTimeout(clearSyncStatus.clearID);

    const syncStatus = $('#sync-status');

    syncStatus.setAttribute('style', $('#sync-status').getAttribute('style').replace(/;;[^]*$/, ';; opacity: 1'));
    syncStatus.textContent = "";
    syncStatus.append(
        furnish('span', { [`${ type }-text`]: '', textContent: message })
    );

    clearSyncStatus.clearID = setTimeout(clearSyncStatus, message?.split?.(/\s+/)?.length * 1_500);
}

Object.defineProperties(PostSyncStatus, {
    alert: { value: message => PostSyncStatus(message, 'alert'), ...PRIVATE_OBJECT_CONFIGURATION },
    error: { value: message => PostSyncStatus(message, 'error'), ...PRIVATE_OBJECT_CONFIGURATION },
    success: { value: message => PostSyncStatus(message, 'success'), ...PRIVATE_OBJECT_CONFIGURATION },
    warning: { value: message => PostSyncStatus(message, 'warning'), ...PRIVATE_OBJECT_CONFIGURATION },
});

/**
 * Hides the synchronization status message from the UI.
 */
function clearSyncStatus() {
    $('#sync-status').setAttribute('style', $('#sync-status').getAttribute('style').replace(/;;[^]*$/, ';; opacity: 0'));
}

clearSyncStatus.clearID = -1;

wait(1000).then(clearSyncStatus);

/**
 * Converts a string into a short capitalized abbreviation.
 * @param {string} [string=''] - The string to abbreviate.
 * @returns {string} The abbreviated string.
 */
function Sym(string = '') {
    return string.replace(/([a-z\-]+)?_+([a-z\-]+)/gi, ($0, $1 = '', $2, $$, $_) => ($1[0] ?? '') + $2[0].toUpperCase());
}

$('#sync-settings--upload').onmouseup = async event => {
    const extractValue = SaveSettings.extractValue;
    const syncToken = $('#sync-token')
        , { currentTarget } = event;

    await SaveSettings()
        .then(async() => {
            PostSyncStatus('Uploading...');
            currentTarget.classList.add('spin');

            const CloudExport = { ...SETTINGS };

            for(const key in CloudExport)
                if(usable_settings.missing(key))
                    delete CloudExport[key];

            CloudExport.syncDate = new Date().toJSON();

            // Export to Sync servers
            chrome.storage.sync.set(CloudExport);

            const id = parseURL(getURL('')).host;

            if(compareVersions(`${ Manifest.version } < 5.32`)) {
                await fetchURL(`https://tinyurl.com/app/api/create`, {
                    // mode: 'cors',

                    method: 'POST',
                    body: JSON.stringify({
                        domain: 'tinyurl.com',
                        url: parseURL(`json://${ id }.settings.js/`)
                            .addSearch({ json: encodeURIComponent(JSON.stringify(CloudExport)) })
                            .href,

                        alias: '',
                        busy: true,
                        errors: { errors: {} },
                        successful: false,
                        tags: [],
                    }),
                })
                    .then(response => response.text())
                    .then(token => {
                        const { pathname } = parseURL(token);

                        if(!pathname.length)
                            throw `Unable to upload`;

                        return `Uploaded. Your Upload ID is ${ (syncToken.value = pathname.slice(1)).toUpperCase() }`;
                    })
                    .then(PostSyncStatus.success)
                    .then(SaveSettings)
                    .catch(PostSyncStatus.warning)
                    .finally(() => currentTarget.classList.remove('spin'))
            } else {
                const settings = new Map;

                for(let index = 0, value, place; index < usable_settings.length; ++index) {
                    let ID = usable_settings[index], element = $(`#${ ID }`);

                    if(nullish(element))
                        continue;

                    switch(ID) {
                        case 'filter_rules': {
                            let rules = []
                                , input = extractValue($('#filter_rules-input'));

                            if(parseBool(input))
                                rules = input.split(',');

                            for(const rule of $.all('#filter_rules code'))
                                rules.push(rule.textContent);
                            rules = rules.isolate().filter(rule => rule.length);

                            value = rules.sort().join(',');
                        } break;

                        case 'phrase_rules': {
                            let rules = []
                                , input = extractValue($('#phrase_rules-input'));

                            if(parseBool(input))
                                rules = input.split(',');

                            for(const rule of $.all('#phrase_rules code'))
                                rules.push(rule.textContent);
                            rules = rules.isolate().filter(rule => rule.length);

                            value = rules.sort().join(',');
                        } break;

                        case 'lurking_rules': {
                            let rules = []
                                , input = extractValue($('#lurking_rules-input'));

                            if(parseBool(input))
                                rules = input.split(';');

                            for(const rule of $.all('#lurking_rules code'))
                                rules.push(rule.textContent);
                            rules = rules.isolate().filter(rule => rule.length);

                            value = rules.sort().join(';');
                        } break;

                        case 'away_mode_schedule': {
                            const times = [];

                            for(const button of $.all('#away_mode_schedule button[duration]')) {
                                const day = parseInt(button.getAttribute('day'))
                                    , time = parseInt(button.getAttribute('time'))
                                    , duration = parseInt(button.getAttribute('duration'))
                                    , status = parseBool(button.getAttribute('status'));

                                times.push({ day, time, duration, status });
                            }

                            const validTimes = [];

                            for(const object of times) {
                                const { day, time, duration } = object;

                                if(false
                                    || (day < 0 || day > 6)
                                    || (time < 0 || time > 23)
                                    || (duration < 1)
                                )
                                    continue;

                                validTimes.push(object);
                            }

                            value = JSON.stringify(validTimes.isolate());
                        } break;

                        case 'away_mode__volume': {
                            const volume = extractValue($('#away_mode__volume'));

                            value = parseFloat(volume) / 100;
                        } break;

                        case 'user_language_preference': {
                            const preferred = extractValue($('#user_language_preference'));

                            value = preferred.toLowerCase();
                        } break;

                        default: {
                            if(nullish(element)) {
                                settings.set(ID, 'X');

                                continue;
                            }

                            value = SaveSettings.extractValue(element);
                            place = element.options?.selectedIndex;
                        } break;
                    } // switch ID

                    const [...id] = ID;

                    ID = Sym(ID);

                    while(settings.has(ID))
                        ID += id.shift();

                    if(defined(place))
                        settings.set(ID, `!${ place }`);
                    else
                        settings.set(ID,
                            (nullish(value))
                                ? '_'
                                : (value === false)
                                    ? 'F'
                                    : (value === true)
                                        ? 'T'
                                        : (+value == value)
                                            ? value
                                            : (value.length)
                                                ? `**${ value }**`
                                                : 'X'
                        );
                }

                const json = encodeURIComponent([...settings].map(([key, value]) => `${ key }(${ value }`).join(')') + ')');

                const url = parseURL(`https://is.gd/create.php`)
                    .addSearch({
                        format: 'json',
                        url: encodeURIComponent(
                            parseURL(`https://${ id }.settings.js/v2`)
                                .addSearch({ json })
                                .href
                        )
                    });

                await fetchURL(url.href)
                    .then(response => response.json())
                    .then(({ shorturl, errorcode, errormessage }) => {
                        if(parseInt(errorcode) > 0)
                            throw `Unable to upload. ${ errormessage }`;

                        return `Uploaded. Your Upload ID is ${ (syncToken.value = parseURL(shorturl).pathname.slice(1)) }`;
                    })
                    .then(PostSyncStatus.success)
                    .then(SaveSettings)
                    .catch(PostSyncStatus.warning)
                    .finally(() => currentTarget.classList.remove('spin'));
            }
        })
        .catch(PostSyncStatus.warning);
};

$('#sync-settings--download').onmouseup = async event => {
    const assignValue = LoadSettings.assignValue;
    const syncToken = $('#sync-token').value
        , { currentTarget } = event;

    if((syncToken?.replace(/\W+/g, '')?.length | 0) < 6)
        return PostSyncStatus.warning('Please use a valid Upload ID');

    PostSyncStatus('Downloading...');
    currentTarget.classList.add('spin');

    try {
        if(compareVersions(`${ Manifest.version } < 5.32`))
            throw "ID-v2 not supported";

        await fetchURL(`https://is.gd/forward.php?format=json&shorturl=${ syncToken }`)
            .then(response => response.json())
            .catch(PostSyncStatus.warning)
            .then(({ url, errorcode, errormessage }) => {
                if(!url?.length) {
                    if(errorcode == 1)
                        throw "";
                    if(errorcode > 1)
                        throw `Invalid Upload ID "${ syncToken }"`;
                }

                const data = new Map;

                try {
                    const raw = decodeURIComponent(parseURL(url).searchParameters.json);
                    let mode = 'get-key', key = '', val = '', thread = '';

                    parsing: for(const char of raw)
                        switch(mode) {
                            case 'get-key': {
                                if(char == '(') {
                                    mode = 'get-val';

                                    thread = '';

                                    continue parsing;
                                }

                                key += char;
                            } break;

                            case 'get-val': {
                                if(char == '*')
                                    thread += char;

                                if(thread == '**') {
                                    mode = 'get-str';

                                    thread = '';

                                    continue parsing;
                                } else if(thread.length > 2) {
                                    thread = thread.substr(1, 2)
                                }

                                if(char == ')') {
                                    mode = 'get-key';

                                    const [...k] = key;

                                    while(data.has(key))
                                        key += k.shift();

                                    data.set(key, val);

                                    key = '';
                                    val = '';
                                    thread = '';

                                    continue parsing;
                                }

                                val += char;
                            } break;

                            case 'get-str': {
                                if(thread == '*' && ['*', ')'].missing(char))
                                    thread = '';
                                if(char == '*')
                                    thread += char;
                                if(char == ')')
                                    thread += char;

                                if(thread == '**)') {
                                    mode = 'get-key';

                                    const [...k] = key;

                                    while(data.has(key))
                                        key += k.shift();

                                    data.set(key, val.slice(1, -2));

                                    key = '';
                                    val = '';
                                    thread = '';

                                    continue parsing;
                                } else if(thread.length > 3) {
                                    thread = thread.substr(1, 3)
                                }

                                val += char;
                            } break;
                        } // :parsing
                    ;

                    // $log('Raw data:', { url, raw, data });

                    const parsed = {};

                    loading: for(let index = 0; index < usable_settings.length; ++index) {
                        const id = usable_settings[index]
                            , ID = Sym(id)
                            , element = $(`#${ id }:not([data-rest-id])`);

                        if(nullish(element) || !data.has(ID))
                            continue;
                        element.dataset.restId = ID;

                        let value = data.get(ID);

                        parsed[ID] = value;

                        switch(id) {
                            case 'filter_rules': {
                                RedoRuleElements(value, 'filter');
                            } break;

                            case 'phrase_rules': {
                                RedoRuleElements(value, 'phrase');
                            } break;

                            case 'lurking_rules': {
                                RedoRuleElements(value, 'lurking', ';', 'channel badge text');
                            } break;

                            case 'away_mode_schedule': {
                                RedoTimeElements(value, 'away_mode');
                            } break;

                            case 'away_mode__volume': {
                                assignValue(element, value * 100);
                            } break;

                            case 'user_language_preference': {
                                value ||= (top.navigator?.userLanguage ?? top.navigator?.language ?? 'en').toLowerCase().split('-').reverse().pop();

                                assignValue(element, value);

                                if(TRANSLATED)
                                    continue loading;

                                // Translate(document.documentElement.lang = value.toLowerCase());
                            } break;

                            case 'simplify_chat_font': {
                                $(`#${ id }`).setAttribute('style', `font-family:${ value } !important`);

                                assignValue(element, value);
                            } break;

                            default: {
                                if(/^!(\d+)/.test(value) && element.options?.length) {
                                    const selected = value.replace('!', '');

                                    assignValue(element, element.options[selected].value);
                                } else if('TF_X'.contains(value) && value?.length) {
                                    const library = { T: true, F: false, _: null, X: '' };

                                    assignValue(element, library[value]);
                                } else {
                                    assignValue(element, value)
                                }
                            } break;
                        } // :loading | switch id
                    } // :loading

                    $.all('[data-rest-id]').map(e => { delete e.dataset.restId });

                    // $log('Parsed data:', parsed);
                } catch(error) {
                    throw error;
                }

                return data;
            })
            .then(async settings => {
                await LoadSettings({ ...settings, 'sync-token': syncToken })
                    .then(() => {
                        const messages = ['Downloaded. Ready to save']
                            , uploadAge = +new Date() - +new Date(settings.syncDate);

                        if(uploadAge > 30 * 24 * 60 * 60 * 1000) {
                            messages.push(`This upload is ${ toTimeString(uploadAge, '~days days') } old`);

                            $log("These settings were uploaded at", new Date(settings.syncDate), settings);
                        }

                        PostSyncStatus.success(messages.join('. '));
                    })
                    .catch(PostSyncStatus.warning);
            })
            .catch(error => {
                if(error.length < 1)
                    throw "Non-existent";
                PostSyncStatus.warning(error);
            });
    } catch(error) {
        await fetchURL(`https://preview.tinyurl.com/${ syncToken }`/*, { mode: 'cors' } */)
            .then(response => response.text())
            .catch(PostSyncStatus.warning)
            .then(html => {
                const parser = new DOMParser;
                const doc = parser.parseFromString(html, 'text/html');

                return doc?.documentElement?.getElementByText('json://');
            })
            .then(element => {
                let url = element?.textContent
                    , data;

                if(!url?.length)
                    throw `Invalid Upload ID "${ syncToken.toUpperCase() }"`;

                try {
                    data = JSON.parse(unescape(atob(decodeURIComponent(parseURL(url).searchParameters.json))));
                } catch(error) {
                    throw error;
                }

                return data;
            })
            .then(async settings => {
                await LoadSettings({ ...settings, 'sync-token': syncToken })
                    .then(() => {
                        const messages = ['Downloaded. Ready to save']
                            , uploadAge = +new Date() - +new Date(settings.syncDate);

                        if(uploadAge > 30 * 24 * 60 * 60 * 1000) {
                            messages.push(`This upload is ${ toTimeString(uploadAge, '~days days') } old`);

                            $log("These settings were uploaded at", new Date(settings.syncDate), settings);
                        }

                        PostSyncStatus.success(messages.join('. '));
                    })
                    .catch(PostSyncStatus.warning);
            })
            .catch(PostSyncStatus.warning);
    } finally {
        currentTarget.classList.remove('spin');
    }
};

$('#sync-settings--share').onmousedown = async event => {
    const syncToken = $('#sync-token').value
        , { currentTarget } = event;

    if(!syncToken?.length)
        return PostSyncStatus.warning('Nothing to copy');

    await navigator.clipboard.writeText(syncToken)
        .then(() => PostSyncStatus.success('Copied to clipboard'))
        .catch(PostSyncStatus.warning);
};

$('#sync-settings--upload-json-input').onchange = async event => {
    const assignValue = LoadSettings.assignValue;
    const { currentTarget } = event;
    const { files } = currentTarget;

    PostSyncStatus('Reading file...');
    currentTarget.nextElementSibling.classList.add('spin');

    if(files.length != 1)
        return PostSyncStatus(`A single JSON file must be selected!`);

    const [file] = files;

    file.text().then(async json => {
        const data = JSON.parse(json);

        reading: for(let index = 0; index < usable_settings.length; ++index) {
            const ID = usable_settings[index]
                , element = $(`#${ ID }:not([data-rest-id])`);

            if(nullish(element))
                continue;
            element.dataset.restId = ID;

            let value = data[ID];

            switch(ID) {
                case 'filter_rules': {
                    RedoRuleElements(value, 'filter');
                } break;

                case 'phrase_rules': {
                    RedoRuleElements(value, 'phrase');
                } break;

                case 'lurking_rules': {
                    RedoRuleElements(value, 'lurking', ';', 'channel badge text');
                } break;

                case 'away_mode_schedule': {
                    RedoTimeElements(value, 'away_mode');
                } break;

                case 'away_mode__volume': {
                    assignValue(element, value * 100);
                } break;

                case 'user_language_preference': {
                    value ||= (top.navigator?.userLanguage ?? top.navigator?.language ?? 'en').toLowerCase().split('-').reverse().pop();

                    assignValue(element, value);

                    if(TRANSLATED)
                        continue reading;

                    // Translate(document.documentElement.lang = value.toLowerCase());
                } break;

                case 'simplify_chat_font': {
                    $(`#${ ID }`).setAttribute('style', `font-family:${ value } !important`);

                    assignValue(element, value);
                } break;

                default: {
                    if(/^!(\d+)/.test(value) && element.options?.length) {
                        const selected = value.replace('!', '');

                        assignValue(element, element.options[selected].value);
                    } else if('TF_X'.contains(value) && value?.length) {
                        const library = { T: true, F: false, _: null, X: '' };

                        assignValue(element, library[value]);
                    } else {
                        assignValue(element, value)
                    }
                } break;
            } // :reading | switch ID
        } // :reading

        $.all('[data-rest-id]').map(e => { delete e.dataset.restId });

        // Live Reminders join the ones already kept; each Twitch tab merges them in on its next load (see `Cache.load`)
        if(data.LiveReminders__backup && typeof data.LiveReminders__backup == 'object') {
            const { LiveReminders__backup = {} } = await Storage.get('LiveReminders__backup') ?? {};
            const merged = { ...LiveReminders__backup, ...data.LiveReminders__backup };

            await Storage.set({ LiveReminders__backup: merged, LIVE_REMINDERS: Object.keys(merged) });
        }

        // SaveSettings() skips fields whose value fails the field's own checks (range, step, pattern)
        const skipped = Object.keys(data).filter(id => $(`#${ id }:invalid`)).map(depadName);

        await SaveSettings();

        PostSyncStatus(`Restored and saved "${ file.name }".${ skipped.length ? ` Not saved (invalid values): ${ skipped.join(', ') }.` : '' }`);
    }).catch(e => {
        $warn(e);
        PostSyncStatus(`Failed to restore "${ file.name }": ${ e?.message ?? e }`);
    }).finally(() => {
        currentTarget.nextElementSibling.classList.remove('spin');
    });
};

$('#sync-settings--download-json').onmouseup = async event => {
    const extractValue = SaveSettings.extractValue;
    const { currentTarget } = event;

    PostSyncStatus('Capturing settings...');
    currentTarget.classList.add('spin');

    const settings = {};

    for(let index = 0, value, place; index < usable_settings.length; ++index) {
        const ID = usable_settings[index], element = $(`#${ ID }`);

        if(nullish(element))
            continue;

        switch(ID) {
            case 'filter_rules': {
                let rules = []
                    , input = extractValue($('#filter_rules-input'));

                if(parseBool(input))
                    rules = input.split(',');

                for(const rule of $.all('#filter_rules code'))
                    rules.push(rule.textContent);
                rules = rules.isolate().filter(rule => rule.length);

                value = rules.sort().join(',');
            } break;

            case 'phrase_rules': {
                let rules = []
                    , input = extractValue($('#phrase_rules-input'));

                if(parseBool(input))
                    rules = input.split(',');

                for(const rule of $.all('#phrase_rules code'))
                    rules.push(rule.textContent);
                rules = rules.isolate().filter(rule => rule.length);

                value = rules.sort().join(',');
            } break;

            case 'lurking_rules': {
                let rules = []
                    , input = extractValue($('#lurking_rules-input'));

                if(parseBool(input))
                    rules = input.split(';');

                for(const rule of $.all('#lurking_rules code'))
                    rules.push(rule.textContent);
                rules = rules.isolate().filter(rule => rule.length);

                value = rules.sort().join(';');
            } break;

            case 'away_mode_schedule': {
                const times = [];

                for(const button of $.all('#away_mode_schedule button[duration]')) {
                    const day = parseInt(button.getAttribute('day'))
                        , time = parseInt(button.getAttribute('time'))
                        , duration = parseInt(button.getAttribute('duration'))
                        , status = parseBool(button.getAttribute('status'));

                    times.push({ day, time, duration, status });
                }

                const validTimes = [];

                for(const object of times) {
                    const { day, time, duration } = object;

                    if(false
                        || (day < 0 || day > 6)
                        || (time < 0 || time > 23)
                        || (duration < 1)
                    )
                        continue;

                    validTimes.push(object);
                }

                value = JSON.stringify(validTimes.isolate());
            } break;

            case 'away_mode__volume': {
                const volume = extractValue($('#away_mode__volume'));

                value = parseFloat(volume) / 100;
            } break;

            case 'user_language_preference': {
                const preferred = extractValue($('#user_language_preference'));

                value = preferred.toLowerCase();
            } break;

            default: {
                if(nullish(element)) {
                    settings[ID] = 'X';

                    continue;
                }

                value = SaveSettings.extractValue(element);
                place = element.options?.selectedIndex;
            } break;
        } // switch ID

        settings[ID] = value;
    }

    // Live Reminders aren't a form field: their copy in the extension's storage goes along (see `Cache.save`)
    const { LiveReminders__backup } = await Storage.get('LiveReminders__backup') ?? {};

    if(LiveReminders__backup && typeof LiveReminders__backup == 'object')
        settings.LiveReminders__backup = LiveReminders__backup;

    try {
        PostSyncStatus('Making file...');

        // URI-encoded, not `btoa`: that throws on any character outside Latin-1 (e.g. a rule in another script)
        const j = JSON.stringify(settings);
        const a = furnish('a', {
            download: `TTV Settings.json`,
            href: `data:application/json;charset=utf-8,${ encodeURIComponent(j) }`,
        }, `Download Settings`);

        document.head.appendChild(a);
        a.click();
    } catch(e) {
        $warn(e);
        PostSyncStatus.error(`Failed to create JSON file. See the console for more information.`);
    } finally {
        currentTarget.classList.remove('spin');
    }
};

/* Adding new schedules */
$('#add-time').onmouseup = event => new DatePicker().then(schedules => RedoTimeElements(JSON.stringify(schedules), 'away_mode'));

$('#simplify_chat_font').onchange = event => event.target.setAttribute('style', `font-family:${ event.target.value } !important`);

// $('#version').setAttribute('version', Manifest.version);

/* Eveyting else... */
// Glyphs
$.all('[glyph]').map(element => {
    let glyph = element.getAttribute('glyph');

    glyph = Glyphs[glyph];

    element.innerHTML = glyph;

    glyph = $('svg', element);

    if(glyph)
        glyph.setAttribute('style', 'height: inherit; width: inherit; vertical-align: text-bottom');
});

// Getting the version information
let FETCHED_DATA = { wasFetched: false };

(async function(installedFromWebstore) {
    const properties = {
        context: {
            id: UUID.from(Manifest.version, true)
                .toStamp()
                .split(/(.{4})/)
                .filter(s => !!s.length)
                .join('-')
                .toUpperCase(),
        },
        origin: {
            github: !installedFromWebstore,
            chrome: installedFromWebstore,
        },
        version: {
            installed: Manifest.version,
            github: 'Learn more',
            chrome: 'Learn more',
        },
        Glyphs,
    };

    await Storage.get(['buildVersion', 'chromeVersion', 'githubVersion', 'versionRetrivalDate'], async({ buildVersion, chromeVersion, githubVersion, versionRetrivalDate }) => {
        buildVersion ??= properties.version.installed;
        versionRetrivalDate ||= 0;

        // Only refresh if the data is older than 1h
        // The data has expired →
        __FetchingUpdates__:
        if((FETCHED_DATA.wasFetched === false) && (versionRetrivalDate + 3_600_000) < +new Date) {
            const githubURL = 'https://api.github.com/repos/ephellon/twitch-tools/releases/latest';

            await fetchURL(githubURL)
                .then(response => {
                    if(FETCHED_DATA.wasFetched)
                        throw "Data was already fetched";

                    return response.json();
                })
                .then(metadata => {
                    $log({ ['GitHub']: metadata });

                    return properties.version.github = metadata.tag_name;
                })
                .then(version => Storage.set({ githubVersion: version }))
                .catch(async error => {
                    await Storage.get(['githubVersion'], ({ githubVersion }) => {
                        if(defined(githubVersion))
                            properties.version.github = githubVersion;
                    });
                })
                .finally(() => {
                    const githubUpdateAvailable = compareVersions(`${ properties.version.installed } < ${ properties.version.github }`);

                    FETCHED_DATA = { ...FETCHED_DATA, ...properties };
                    Storage.set({ githubUpdateAvailable });

                    // Only applies to versions installed from the Chrome Web Store
                    __ChromeOnly__:
                    if(installedFromWebstore)
                        Storage.set({ chromeUpdateAvailable: githubUpdateAvailable });
                });

            // GitHub-only logic - get Chrome version information

            if(FETCHED_DATA.wasFetched === false) {
                FETCHED_DATA.wasFetched = true;
                versionRetrivalDate = +new Date;

                Storage.set({ versionRetrivalDate });
            }
        }
        // The data hasn't expired yet
        else {
            properties.version.github = githubVersion ?? properties.version.github;
            properties.version.chrome = chromeVersion ?? properties.version.chrome;
        }

        // Set the build number, if applicable
        DisplayBuild: {
            let [version, build] = buildVersion.split('#');

            build |= 0;

            if(build > 0) {
                properties.version.installed += (compareVersions(`${ properties.version.installed } > ${ properties.version.github }`) ? ` build ${ build }` : '');
                properties.context.id = UUID.from(properties.version.installed, true)
                    .toStamp()
                    .split(/(.{4})/)
                    .filter(s => !!s.length)
                    .join('-')
                    .toUpperCase();
            }
        }

        // Modify all [set] elements
        $.all('[set]').map(async(element) => {
            properties.this = Object.fromEntries([...element.attributes, { name: 'innerHTML', value: element.innerHTML }, { name: 'innerText', value: element.innerText }, { name: 'textContent', value: element.textContent }].map(({ name, value }) => [name, value]));

            // Continue with the data...
            const expressions = element.getAttribute('set').split(/(?<!&#?\w+);/);
            const directProperties = ['innerHTML', 'innerText', 'textContent'];

            for(const expression of expressions) {
                // Literal (x=y) - Sets attribute to right-hand
                if(/^([\w\-]+)=/.test(expression)) {
                    let [attribute, property] = expression.split('=', 2)
                        , value;

                    property = property.split('.');

                    // Traverse the property path...
                    for(value = properties; property.length;) {
                        const [key] = property.splice(0, 1);

                        value = value[key];
                    }

                    if(directProperties.contains(attribute))
                        element[attribute] = value;
                    else
                        element.setAttribute(attribute, value);
                }
                // Metaphorical (x:y) - Sets attribute to parsed right-hand
                else if(/^([\w\-]+):/.test(expression)) {
                    const [attribute, property] = expression.split(':', 2)
                        , value = property.replace(/(\w+\.\w+(?:[\.\w])?)/g, ($0, $1, $$, $_) => {
                            let prop = $1.split('.')
                                , val;

                            // Traverse the property path...
                            for(val = properties; prop.length;) {
                                const [key] = prop.splice(0, 1);

                                val = val[key];
                            }

                            return val;
                        });

                    if(directProperties.contains(attribute))
                        element[attribute] = value;
                    else
                        element.setAttribute(attribute, value);
                }
                // Symbolic (x→y) - Sets attribute to parsed, unescaped right-hand
                else if(/^([\w\-]+)(?:->|→)/.test(expression)) {
                    const [attribute, property] = expression.split(/(?:->|→)/, 2)
                        // \object.property::type@base?pad
                        // \object.property::type@parse-base:stringify-base?pad
                        , value = property.replace(/\\(\w+\.\w+(?:[\.\w]+)?)(?:::(\w+)(?:@(\w+))?(?::(\w+))?(?:\?(\d+)))?/g, ($0, $1, $2, $3, $4, $5, $$, $_) => {
                            let prop = $1.split('.')
                                , val;

                            // Traverse the property path...
                            for(val = properties; prop.length;) {
                                const [key] = prop.splice(0, 1);

                                val = val[key];
                            }

                            // Coerce to type...
                            switch($2 = $2?.toLowerCase()) {
                                case 'short':
                                case 'ushort':
                                case 'int':
                                case 'uint':
                                case 'long':
                                case 'ulong':
                                case 'float':
                                case 'ufloat':
                                case 'double':
                                case 'udouble':
                                case 'number':
                                case 'bigint':
                                    {
                                        const u = $2.startsWith('u')
                                            , r = parseInt($3 || 10)
                                            , R = parseInt($4 || r)
                                            , t = parseInt($5 || 1);

                                        val = parseFloat(val.replace(/[^a-z\d\.]+/ig, '').split('.').map(n => parseInt(n, r)).join('.'));

                                        // 16b
                                        if($2.endsWith('short'))
                                            val = val.clamp(-(2 ** (15 * +!u)), 2 ** (15 + +!u)).ceil();

                                        // 32b
                                        if($2.endsWith('int'))
                                            if($2.startsWith('big'))
                                                val = BigInt(val.ceil());
                                            else
                                                val = val.clamp(-(2 ** (31 * +!u)), 2 ** (31 + +!u)).ceil();
                                        if($2.endsWith('float'))
                                            val = val.clamp(-(2 ** (31 * +!u)), 2 ** (31 + +!u));

                                        // 64b
                                        if($2.endsWith('long'))
                                            val = val.clamp(-(2 ** (63 * +!u)), 2 ** (63 + +!u)).ceil();
                                        if($2.endsWith('double'))
                                            val = val.clamp(-(2 ** (63 * +!u)), 2 ** (63 + +!u));

                                        val = val.toString(R).padStart(t, '0');
                                    } break;
                            } // switch $2 = $2?.toLowerCase()

                            return val;
                        });

                    if(directProperties.contains(attribute))
                        element[attribute] = value;
                    else
                        element.setAttribute(attribute, value);
                }
            }
        });
    });
})(location.host.equals('fcfodihfdbiiogppbnhabkigcdhkhdjd'));

// All anchors with the [continue-search] attribute
$.all('a[continue-search]').map(a => {
    const parameters = [];

    for(const target of [top.location, a]) {
        const { searchParameters } = parseURL(target.href);

        for(const parameter in searchParameters)
            parameters.push(`${ parameter }=${ searchParameters[parameter] }`);
    }

    if(parameters.length < 1)
        return;

    a.href = a.href.replace(/\?[^$]*$/, '?' + parameters.join('&'));
});

// All anchors without a target
$.all('a:not([target])').map(a => a.target = '_blank');

// All "new" features for this version
Cache.load(['ignoreNew'], ({ ignoreNew }) => {
    const { version } = Manifest;
    const brandNewFragments = [];

    $.all('[new]').map(element => {
        const conception = element.getAttribute('new');
        const title = $('.title', element)?.textContent?.trim();

        if(compareVersions(`${ ignoreNew } ≥ ${ conception }`))
            element.removeAttribute('new');
        else if(defined(title))
            brandNewFragments.push(
                furnish(`a[href="#${ (element.id = `new-feature__${ brandNewFragments.length + 1 }`) }"]`)
                    .text(title)
                    .html()
            );
    });

    const { length } = brandNewFragments;

    if(length > 0)
        alert.silent(`<div visible controller title="There ${ length > 1 ? "are" : "is" } ${ length } new ${ 'feature'.pluralSuffix(length) }!">${ brandNewFragments.join('<br>') }</div>`)
            .then(ok => Cache.save({ ignoreNew: version }));
});

// Any keys that need "translating"
$.all('[id^="key:"i]').map(element => element.textContent = GetMacro(element.textContent));

// Get the supported video types here...
$.all('#video_clips__file_type option').filter(o => !MediaRecorder.isTypeSupported(`video/${ o.value }`)).map(o => o.remove());

// Handle any fixable units
setInterval(() => {
    $.all('[fix-unit]').map(element => {
        const type = element.attr.fixUnit;
        let onchange;

        switch(type[0].toLowerCase()) {
            case 'd':
            case 'h':
            case 'm':
            case 's': {
                onchange = function(event) {
                    const self = event.currentTarget;
                    const [days, hours, minutes, seconds] = toTimeString(parseTime(self.value, type), '~days|~hour|~minute|~second').split('|').map(parseFloat);

                    if(days > 0) {
                        self.closest('[fix-unit]').attr.fixedValue = `${ days }d`
                    } else if(hours > 0) {
                        self.closest('[fix-unit]').attr.fixedValue = `${ hours }hr`
                    } else if(minutes > 0) {
                        self.closest('[fix-unit]').attr.fixedValue = `${ minutes }min`
                    } else if(seconds > 0) {
                        self.closest('[fix-unit]').attr.fixedValue = `${ seconds }sec`
                    }
                };
            } break;

            default: {
                onchange = function(event) {
                    const self = event.currentTarget;
                    let value = self.value;

                    if(!isNaN(parseInt(value)))
                        value = parseInt(value).suffix('', 1);
                    else if(!isNaN(parseFloat(value)))
                        value = parseFloat(value).suffix('', 1);

                    self.closest('[fix-unit]').attr.fixedValue = value;
                };
            } break;
        } // switch type[0].toLowerCase()

        $.all('input', element).map(input => {
            input.addEventListener('keyup', onchange);
            input.addEventListener('change', onchange);
            wait(1000, input).then(input => onchange({ currentTarget: input }));
        });
    });
}, 100);

// Search for a setting...
$.body.onkeydown = event => {
    if(!event.altKey && event.ctrlKey && !event.metaKey && event.key.equals('f')) {
        event.preventDefault();

        const y = $.body.scrollTop;

        $('#search').focus();

        $.body.scrollTo({ top: y, behavior: 'instant' });
    }
};

$.all('#search').map(input => {
    input.onfocus = event => {
        event.preventDefault();

        $('#search-container').dataset.focus = true;
        $('#search-results').dataset.empty = !parseBool(event.currentTarget.value.length);
    };

    input.onblur = event => {
        wait(100).then(() => {
            $('#search-results').dataset.empty = !parseBool($('#search').value.length);
        });
    };

    input.onkeydown = async event => {
        const { currentTarget, key, altKey, ctrlKey, metaKey, shiftKey } = event;

        if(altKey || ctrlKey || metaKey)
            return;

        const ignoredKeys = 'alt control meta opt+ shift +lock tab f+ arrow+ +menu ins+ page+ home end media+ audio+'.split(' ').map(AsteriskFn);

        if(ignoredKeys.find(regexp => regexp.test(key)))
            return;

        event.preventDefault();

        switch(key.toLowerCase()) {
            case 'escape': {
                currentTarget.blur();

                return $('#search-container').dataset.focus = false;
            } break;

            case 'backspace': {
                let { value, selectionStart, selectionEnd } = currentTarget;

                selectionStart += (selectionStart != selectionEnd);

                currentTarget.value = value.substring(0, --selectionStart) + value.substring(selectionEnd, value.length);

                currentTarget.selectionStart = currentTarget.selectionEnd = selectionStart;
            } break;

            case 'delete': {
                let { value, selectionStart, selectionEnd } = currentTarget;

                selectionEnd += (selectionStart != selectionEnd);

                currentTarget.value = value.substring(0, selectionStart) + value.substring(++selectionEnd, value.length);

                currentTarget.selectionStart = currentTarget.selectionEnd = selectionStart;
            } break;

            case 'enter': {
                $('#search-results [data-result="true"i]')?.dispatchEvent(new MouseEvent('mouseup'));
            } break;

            default: {
                let { value, selectionStart, selectionEnd } = currentTarget;

                currentTarget.value = value.substring(0, selectionStart) + key + value.substring(selectionEnd, value.length);

                currentTarget.selectionStart = currentTarget.selectionEnd = ++selectionStart;
            }
        } // switch key.toLowerCase()

        const query = currentTarget.value || ''
            , last = currentTarget.dataset.last = query || ''
            , output = $('#search-results');

        output.innerHTML = "";

        if(output.dataset.empty = query.length < 3)
            return;

        const exact = $.body.getAllElementsByText(query).slice(0, 10).map(result => result.closest('section, [opt]')?.querySelector('.title'));
        const partial = $.body.getAllElementsByText(RegExp(
            query.replace(/(\W)/g, '\\$1').replace(/[a-z]/g, ($0, $$, $_) => ({
                'q': '[12qwas]',
                'w': '[123qweasd]',
                'e': '[234wersdf]',
                'r': '[345ertdfg]',
                't': '[456rtyfgh]',
                'y': '[567tyughj]',
                'u': '[678yuihjk]',
                'i': '[789uiojkl]',
                'o': '[890iopkl;]',
                'p': '[90\\-op\\[kl;]',
                'a': '[qwaszx]',
                's': '[qweasdzxc]',
                'd': '[wersdfxcv]',
                'f': '[ertdfgcvb]',
                'g': '[rtyfghvbn]',
                'h': '[tyughjbnm]',
                'j': '[yuihjknm,]',
                'k': '[uiojklm,\\.]',
                'l': '[iopkl;,\\./]',
                'z': '[aszx]',
                'x': '[asdzxc]',
                'c': '[sdfxcv ]',
                'v': '[dfgcvb ]',
                'b': '[fghvbn ]',
                'n': '[ghjbnm ]',
                'm': '[hjknm, ]',
            })[$0.toLowerCase().normalize('NFKD')])
            , 'i')).slice(0, 10).map(result => result.closest('section, [opt]')?.querySelector('.title'));

        const synonymous = $.all('article')
            .map(element => [...element.childNodes].filter(node => node.nodeName.equals('#comment')))
            .flat()
            .filter(comment => comment.textContent.toLowerCase().contains(query.toLowerCase()))
            .filter(defined)
            .map(comment => comment.nextElementSibling);

        const attributions = (
            /^[\w-]{3,}$/.test(query)
                ? $.all(`[${ query }]`).map(e => ($('[tr-id]', e) ?? e)?.closest('[tr-id]')).filter(defined)
                : []
        );

        const results = [...exact, ...partial, ...synonymous, ...attributions]
            .filter(defined)
            .filter(element => !element.hasAttribute('save'))
            .isolate();

        for(const result of results)
            output.innerHTML += result.outerHTML;

        for(const child of output.children) {
            'beta dead new soon'.split(' ').map(attr => child.removeAttribute(attr));

            $.all('[id]', child).map(e => (e.dataset.id = e.id) && e.removeAttribute('id'));
            $.all('details summary ~ *', child).map(e => e.remove());

            child.dataset.id = child.id;
            child.removeAttribute('id');

            if(child.dataset.result = (child.classList.contains('title')))
                child.onmouseup = ({ currentTarget }) => {
                    $(`article :is([id="${ currentTarget.dataset.id }"i], [tr-id="${ currentTarget.getAttribute('tr-id') }"i])`)
                        .scrollIntoView();

                    $('#search-container').dataset.focus = false;
                };
            else
                for(const fauxSetting of $.all(`[data-id]`, child)) {
                    LoadSettings.assignValue(fauxSetting, SETTINGS[fauxSetting.dataset.id]);

                    fauxSetting.disabled = true;
                    fauxSetting.setAttribute('visible', true);

                    const section = $(`#search-results :is([data-id="${ fauxSetting.dataset.id }"i], [tr-id="${ fauxSetting.getAttribute('tr-id') }"i])`).closest('section');

                    section.dataset.id = fauxSetting.dataset.id;

                    section.onmouseup = ({ currentTarget }) => {
                        $(`article [id="${ currentTarget.dataset.id }"i]`)
                            .closest('section')
                            .scrollIntoView();

                        $('#search-container').dataset.focus = false;
                    };
                }
        }

        $('#search-results').dataset.empty = !parseBool((currentTarget.dataset.last = query).length);
    };
});

// Set the browser storage usage...
when.defined(() => SETTINGS)
    .then(() => {
        Storage.getBytesInUse(async BYTES_IN_USE => {
            const ESTIMATE = await navigator?.storage?.estimate?.();
            const MAX_BYTES = (Storage.QUOTA_BYTES || ESTIMATE?.quota)
                , PERC_IN_USE = (100 * ((BYTES_IN_USE || ESTIMATE?.usage) / MAX_BYTES)).toFixed(1);

            $.all('[id*="data-usage"i][id*="browser-storage"i][type="number"i]').map(input => {
                const [amount, unit] = BYTES_IN_USE.suffix('B', false).split(/(\d+)(\D+)/).filter(s => s.length);

                input.value = amount;
                input.closest('[unit]')?.setAttribute('unit', unit);
            });

            $.all('[id*="data-usage"i][id*="browser-storage"i][id*="itemized"i]').map(table => {
                let settBytes = 0
                    , miscBytes = 0
                    , liveBytes = 0
                    , dvrBytes = 0
                    , total = 0, size;

                for(const key in SETTINGS) {
                    size = JSON.stringify({ [key]: SETTINGS[key] }).length;
                    total += size;

                    if(usable_settings.contains(key))
                        settBytes += size;
                    else if(key.equals('LIVE_REMINDERS'))
                        liveBytes += size;
                    else if(key.equals('DVR_CHANNELS'))
                        dvrBytes += size;
                    else
                        miscBytes += size;
                }

                const f = furnish
                    , dD = /\.0+([kMG]?B)/;

                const tbody = f.tbody(
                    f.tr(
                        f.td(`Settings`),
                        f.td(settBytes.suffix('B', 2).replace(dD, '$1')),
                        f.td((100 * (settBytes / total)).toFixed(1) + '%')
                    ),
                    f.tr(
                        f.td(`Reminders`),
                        f.td(liveBytes.suffix('B', 2).replace(dD, '$1')),
                        f.td((100 * (liveBytes / total)).toFixed(1) + '%')
                    ),
                    f.tr(
                        f.td(`DVR`),
                        f.td(dvrBytes.suffix('B', 2).replace(dD, '$1')),
                        f.td((100 * (dvrBytes / total)).toFixed(1) + '%')
                    ),
                    f.tr(
                        f.td(`Miscellaneous`),
                        f.td(miscBytes.suffix('B', 2).replace(dD, '$1')),
                        f.td((100 * (miscBytes / total)).toFixed(1) + '%')
                    ),
                    f.tr(
                        f.td(`Total`),
                        f.td(total.suffix('B', 2)),
                        f.td(`${ PERC_IN_USE }%`)
                    )
                );

                table.append(tbody);

                const current = [settBytes, liveBytes, dvrBytes, miscBytes].map(B => PERC_IN_USE * (B / total))
                    , add = (a, b) => (a + b)
                    , colors = 'baby-blue live-red baby-gold purple igor-pink'
                        .split(' ')
                        .slice(0, current.length)
                        .map((color, index) => {
                            const td = $(`tr:nth-child(${ ++index }) td`, tbody);

                            td.modStyle(`text-decoration:2px underline var(--${ color })`);
                            td.insertAdjacentElement('afterbegin', f(`span[style="color:var(--${ color })"]`).with('@'));

                            return `var(--${ color }) 0 ${ current.slice(0, index).reduce(add, 0).toFixed(3) }%`;
                        })
                        .join(', ');

                $.all('[id*="data-usage"i][id*="browser-storage"i][id*="range"i]').map(element => {
                    element.modStyle(`
                        background: linear-gradient(90deg, ${ colors }, #fff4 0);
                        border: 0;
                        border-top-left-radius: 3px;
                        border-bottom-left-radius: 3px;
                        border-top-right-radius: 3px;
                        border-bottom-right-radius: 3px;
                    `);

                    element.addEventListener('mouseup', event => {
                        const { currentTarget } = event;

                        currentTarget.dataset.zoomed = currentTarget.dataset.zoomed.equals('false');

                        const current = [settBytes, liveBytes, dvrBytes, miscBytes].map(B => (parseBool(currentTarget.dataset.zoomed) ? 100 : PERC_IN_USE) * (B / total));
                        const colors = 'baby-blue live-red baby-gold purple igor-pink'
                            .split(' ')
                            .slice(0, current.length)
                            .map((color, index) => `var(--${ color }) 0 ${ current.slice(0, ++index).reduce(add, 0).toFixed(3) }%`)
                            .join(', ');

                        currentTarget.modStyle(`
                            background: linear-gradient(90deg, ${ colors }, #fff4 0);
                            border: 0;
                            border-top-left-radius: 3px;
                            border-bottom-left-radius: 3px;
                            border-top-right-radius: 3px;
                            border-bottom-right-radius: 3px;
                        `);
                    });
                });
            });
        });
    });

// The RAM Alarms log: what the alarms did in the last day, so a page that kept reloading can still be explained (#67)
when.defined(() => SETTINGS)
    .then(() => Storage.get(['ramAlarmLog'], ({ ramAlarmLog = [] }) => {
        const body = $('#ram-alarms--log tbody')
            , since = +new Date - 86_400_000
            , entries = ramAlarmLog.filter(({ time }) => time > since).reverse();

        if(nullish(body) || !entries.length)
            return;

        const verbs = {
            notify: 'Notice shown',
            respawn: 'Respawn offered',
            respawned: 'Respawned',
            hold: 'Respawn skipped (page too new)',
            unresponsive: 'Respawned (not responding)',
        };

        const cell = text => Object.assign(document.createElement('td'), { textContent: text });

        body.replaceChildren(...entries.map(({ time, action, url = '', ramUsed, tier, note }) => {
            const row = document.createElement('tr');

            row.append(
                cell(new Date(time).toLocaleTimeString()),
                cell(verbs[action] ?? action),
                cell(url.replace(/^https?:\/\/(www\.)?twitch\.tv/i, '') || '/'),
                cell([ramUsed && `${ Math.round(ramUsed / 1024 ** 2) }MB`, tier, note].filter(Boolean).join(' · ')),
            );

            return row;
        }));
    }));

// Deprecated: v5.32.14.3
/**
 * Fetches translation files for a specific language and applies them to elements with `tr-id` attributes.
 * @param {string} [language='en'] - The language code to use for translation
 * @param {Document|Element} [container=document] - The DOM element to search for translatable text
 * @returns {Promise<void>}
 */
async function Translate(language = 'en', container = document) {
    await fetch(`/_locales/${ language }/settings.json`)
        .catch(error => {
            $warn(`Translations to "${ language.toUpperCase() }" are not available`);

            return { json() { return null } };
        })
        .then(text => text.json?.())
        .then(json => {
            if(json?.LANG_PACK_READY !== true) {
                const ISO = ISO_639_1[language];
                const errMsg = json?.['[[ERROR]]'];

                if(nullish(ISO) || nullish(errMsg))
                    return;

                const [latin] = ISO.name.split('/');
                /**
                 * Generates an HTML anchor link to a GitHub issue template for translation help.
                 * @param {*} $0 - Unused
                 * @param {string} [$1='GitHub'] - The display text for the link
                 * @param {*} $$ - Unused
                 * @param {*} $_ - Unused
                 * @returns {string} HTML string for the link
                 */
                const link = ($0, $1 = 'GitHub', $$, $_) => `<strong><a target="_blank" href="https://github.com/Ephellon/Twitch-Tools/issues/new?assignees=Ephellon&labels=enhancement%2C+help-wanted%2C+wiki&template=lang_help.md&title=Translations%3A+${ encodeURIComponent(latin) }">${ $1 }</a></strong>`;

                alert.silent(`
                    <div style=color:yellow!important>
                        <!-- English -->
                        <div style=text-align:center;margin:1rem>This document may contain translation errors. If you would like to help correct this document, please visit ${ link() }</div>
                        <hr>
                        <!-- ${ latin } -->
                        <div style=text-align:center;margin:1rem>${
                            errMsg.replace(/(\S*GitHub\S*)/i, link)
                        }</div>
                    </div>
                `, document.body.classList.contains('popup'));
            }

            let lastTrID
                , placement = {};

            let { ELEMENT_NODE, TEXT_NODE } = document
                , PREV_NODE, SEND_BACK = 0;

            for(const element of $.all('[tr-id]', container)) {
                const translation_id = (element.getAttribute('tr-id') || lastTrID)
                    , translations = (null
                        ?? json['?']?.[translation_id]
                        ?? json[translation_id]
                        ?? []
                    );

                element.setAttribute('tr-id', translation_id);

                if(!translations?.length)
                    continue;

                const nodes = [...element.childNodes]
                    .filter(node => [ELEMENT_NODE, TEXT_NODE].contains(node.nodeType))
                    .filter(node => /^[^\s\.\!\?]/i.test((node.textContent ?? '').trim()))
                    .map(node => {
                        const { attributes, nodeType } = node;

                        if([TEXT_NODE].contains(nodeType))
                            return node;

                        if(nullish(attributes) || ('tr-id' in attributes) || ('tr-skip' in attributes))
                            return;

                        return node;
                    })
                    .filter(defined);

                for(const node of nodes) {
                    const translation = translations[placement[translation_id] |= 0];
                    const padding = {
                        start: node.textContent.replace(/^([\s\.!:?,]*)[^]*?$/, '$1'),
                        stop: node.textContent.replace(/^[^]*?((?:&#?[\w\-]+?;)?[\s\.!:?,]*)$/, '$1'),
                    };

                    let number;
                    /**
                     * Formats a translation string by applying padding and replacing numeric placeholders.
                     * @param {string} [string=''] - The translation string to format
                     * @returns {string} The formatted string
                     */
                    const pad = (string = '') =>
                        padding.start
                        + string
                            .replace(/%d\b/g, number = node.textContent.replace(/[^]*?(\d+)[^]*/, '$1'))
                            .replace(/%([^>]*)>([^\s]*)/g, parseInt(number) > 1 ? '$2' : '$1')
                            + padding.stop;

                    /**
                     * Removes unnecessary whitespace and characters from a string to make it more compact.
                     * @param {string} [string=''] - The string to minify
                     * @returns {string} The slimmed string
                     */
                    const slim = (string = '') => string
                        .replace(/\([\s]+/g, '(')
                        .replace(/[\s,:;]+\)/g, ')')
                        .replace(/\s+(-\w)/g, '$1');

                    if(/^%%$/.test(translation ?? ''))
                        continue;

                    if(SEND_BACK > 0) {
                        PREV_NODE.innerHTML = PREV_NODE.textContent.replace(node.textContent, '').replace(/%</, slim(pad(node.outerHTML)));
                        node.remove();
                        --SEND_BACK;

                        continue;
                    }

                    if(defined(translation))
                        node.textContent = pad(translation);

                    if(translation?.length < 1)
                        node.textContent = node.textContent.trim();

                    node.textContent = slim(node.textContent);

                    placement[translation_id] = (placement[translation_id] + 1 < translations.length)
                        ? placement[translation_id] + 1
                        : 0;

                    if(SEND_BACK += +(/%</.test(translation ?? '')))
                        PREV_NODE = node.parentElement;
                }

                lastTrID = translation_id;
            }
        });
}

document.body.onload = async() => {
    const url = parseURL(location.href)
        , search = url.searchParameters || {};

    /* The extension was just installed (most likely the first run) */
    await (async() => {
        return 'en';
        // TODO: enable language settings... //

        if(nullish(search.installed))
            return;

        /**
         * Adds the 'chosen' class to the element that triggered the mouse down event.
         * @param {Event} event - The mouse event
         */
        const onmousedown = event => event.currentTarget.classList.add('chosen')
            , onmouseup = event => event.currentTarget.closest('.language-select')?.remove();

        let detectedLanguage = '';

        Storage.get({ user_language_preference: '' }, ({ user_language_preference = '' }) => {
            // if(/^[A-Z]+$/.test(user_language_preference))
            detectedLanguage = user_language_preference;
        });

        return when.defined(() => {
            const languageOptions = $('.language-select');

            if(nullish(languageOptions))
                document.body.append(
                    furnish('.language-select').with(
                        furnish('button.language-option', { value: 'en', onmousedown, onmouseup }, `English (North American)`),
                        ...SUPPORTED_LANGUAGES.map(language => {
                            const ISO = top.ISO_639_1[language];

                            if(nullish(ISO))
                                return;

                            let { name, code, dialect } = ISO
                                , [latin, native, regional] = unescape(name).split('/', 3);

                            return furnish('button.language-option', { value: code, onmousedown, onmouseup }, `${ native } (${ regional || latin })`);
                        }).filter(defined)
                    )
                );

            $(`.language-option[value="${ detectedLanguage }"i]`)
                ?.setAttribute?.('style', 'background-color:var(--baby-blue); text-decoration:underline');

            return $('.language-option.chosen')?.value;
        });
    })()

        /* Things needed before loading the page... */
        .then(async language => {
            if(defined(language))
                await Storage.set({ user_language_preference: language.toLowerCase() });

            await Storage.get(['user_language_preference'], ({ user_language_preference = 'en' }) => {
                const lang = document.documentElement.lang = user_language_preference.toLowerCase();

                // if(lang.unlike('en'))
                //     Translate(lang);
            });

            TRANSLATED = true;
        })

        /* Continue loading/parsing the page */
        .then(async() => {
            /* Continue loading the page after translations have been made/skipped */

            // Add classes to the body
            for(const attribute in search)
                $('body').classList.add(attribute);

            // The viewer's scripts add their own settings (settings/user-scripts.js)
            await window.SETTINGS_EXTRA;

            // Stop or continue loading settings
            if((search['show-defaults'] + '').unlike('true'))
                await LoadSettings();

            // Overwrite settings defined in the search
            for(const key in search)
                if(usable_settings.contains(key) && $.defined(`#${ key }`))
                    LoadSettings.assignValue($(`#${ key }`), search[key]);

            // Adjust summaries
            $.all('.summary').map(element => {
                const article = element.parentElement
                    , summary = element
                    , uuid = 'uuid-' + Math.random().toString(36).replace('.', '');

                if(summary.children.length <= 2)
                    return;

                const margin = ['.5rem']
                    , getHeight = element => {
                        let style = getComputedStyle(element)
                            , attributes = ['height']
                            , height = 0;

                        for(const attribute of attributes)
                            height += parseInt(style[attribute]);

                        return height;
                    };

                // summary *
                const not = [];

                // Dynamically adjust the elements' heights
                summary.id = uuid;
                $.all('details, summary, input, img, div, h1, h2, h3, h4, h5, h6, ol, ul, p'.split(',').map(e=>`#${ uuid } > ${ e }${ not.map(n=>`:not(${ n })`).join('') }`).join(','), summary)
                    .map(element => {
                        const height = getHeight(element);

                        if(height)
                            margin.push(height + 'px');
                        else
                            element.setAttribute('style', 'display:none!important');
                    });

                summary.setAttribute('style', `${ summary.getAttribute('style')?.replace(/([^;])(?!;)$/, '$1; ') ?? '' }--padding-bottom:calc(${ margin.join(' + ') })`);
            });

            // Update links (hrefs), tooltips, and other items
            wait(1000).then(() => {
                // Adjust all audio URLs
                $.all('#whisper_audio_sound').map(element => {
                    const [selected] = element.selectedOptions;
                    const pathname = (/\b(568)$/.test(selected.value) ? '/message-tones/' : '/notification-sounds/') + selected.value;

                    $('#sound-href').href = parseURL($('#sound-href').href).origin + pathname;
                });

                // All developer features
                $.all('#est-data-usage').map(input => {
                    const estimate = async({ currentTarget }) =>
                        await Storage.get('LIVE_REMINDERS', ({ LIVE_REMINDERS }) => {
                            const output = currentTarget.closest('summary, .summary').querySelector('#est-data-usage')
                                , multiplier = currentTarget.closest('[class]').querySelector(':is([when-off], [when-on])')
                                , off = multiplier.getAttribute('when-off')
                                , on = multiplier.getAttribute('when-on');

                            const [value, unit] = ((LIVE_REMINDERS?.length | 0) * (60 / parseFloat(multiplier.checked ? on : off)) * 2 ** 20).suffix('B/h', false).split(/(\D+)/).filter(s => s.length);

                            output.value = value;
                            output.parentElement.setAttribute('unit', unit);
                        });

                    ($(input.getAttribute('controller')).onchange = estimate)({ currentTarget: input });
                });

                setInterval(() => {
                    $.all([...['up', 'down', 'left', 'right', 'top', 'bottom'].map(dir => `[${ dir }-tooltip]`), '[tooltip]'].map(s => s + ':not([tooled])').join(',')).map(element => {
                        let tooltip = [...element.attributes].map(attribute => attribute.name).find(attribute => /^(?:(up|top|down|bottom|left|right)-)?tooltip$/i.test(attribute))
                            , direction = tooltip.replace(/-?tooltip$/, '');

                        direction = ({ top: 'up', bottom: 'down' })[direction] ?? direction;

                        new Tooltip(element, element.getAttribute(tooltip), { direction });

                        element.setAttribute('tooled', true);
                    });
                }, 250);

                // All experimental features - auto-enable "Experimental Features" if a feature is turned on
                $.all('[id=":settings--experimental"i] section > .summary .toggle input').map(input => {
                    const prerequisites = (input.getAttribute('requires') ?? '').split(',').filter(string => string.length);

                    prerequisites.push('#experimental_mode');

                    input.setAttribute('requires', prerequisites.join(','));
                });

                // All "required" parents
                // Adds `top....` to the <head>
                // function keysDeep(object) {
                //     let keys = [];
                //     for(let key in object)
                //         if(object.hasOwnProperty(key)) {
                //             let value = object[key];
                //
                //             if(object === value)
                //                 continue;
                //
                //             if(defined(value) && isObj(value))
                //                 keys.push(...keysDeep(value));
                //             keys.push(key);
                //         }
                //
                //     return keys;
                // }
                //
                // document.head.append(
                //     furnish(`meta.top.${ keysDeep(top).isolate().join('.') }`)
                // );

                $.all('[requires]').map(dependent => {
                    const providers = $.all(dependent.getAttribute('requires'));

                    Observing:
                    for(const provider of providers) {
                        // Apply the false status to `dependent` when the `provider` is set to false
                            // when(provider.checked === false) → dependent.checked = false
                        // Also apply the changes to `provider` in the opposing manner when `dependent` is set to true
                            // when(dependent.checked === true) → provider.checked = true
                        const dependents = (provider.getAttribute('dependents') ?? '').split(',');

                        provider.setAttribute('dependents', [...dependents, `#${ dependent.id }`].filter(string => string.length).join(','));

                        provider.addEventListener('change', event => {
                            let { currentTarget } = event
                                , { checked } = currentTarget
                                , dependents = currentTarget.getAttribute('dependents');

                            if(!checked)
                                $.all(dependents).filter(dependent => dependent.checked).map(dependent => dependent.click());
                        });
                    }

                    // Add "requires" event listeners
                    dependent.addEventListener('change', event => {
                        let { currentTarget } = event
                            , { checked } = currentTarget
                            , providers = currentTarget.getAttribute('requires');

                        if(checked)
                            $.all(providers).filter(provider => !provider.checked).map(provider => provider.click());
                    });

                    const tooltipContainer = dependent.closest(':not(input)');

                    tooltipContainer.setAttribute('right-tooltip', new Tooltip(tooltipContainer, `Requires ${ providers.map(provider => depadName(provider.id)).join(', ') }`, { direction: 'right' }).textContent);
                });

                // All unit targets
                $.all('[unit] input').map(input => {
                    input.onfocus = ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('focus', true);
                    input.onblur = ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('focus', false);

                    if(input.disabled)
                        input.closest('[unit]').setAttribute('valid', true);
                    else
                        input.oninput = ({ currentTarget }) => currentTarget.closest('[unit]').setAttribute('valid', currentTarget.checkValidity());
                });
            });
        })

        /* Things needed after loading the page... */
        .then(() => {
            INITIAL_LOAD = false;

            // A fresh install has nothing stored, so the pages would read every option as unset
            // (not as its default); store the form's values whenever any option is missing
            Storage.get(null, stored => {
                // (values kept without a control, like the user scripts list, are written by their own code)
                if(usable_settings.some(id => !(id in stored) && $.defined(`#${ id }`)))
                    SaveSettings();
            });
        });
};
