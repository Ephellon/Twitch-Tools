/*** /lib/player.js
 * Video player quality, volume and view mode.
 * Moved verbatim from tools.js in Phase 3; see src/lib/index.js for how it reaches the page.
 */

// Get the video quality
    // GetQuality() → string<{ auto:boolean, high:boolean, low:boolean, source:boolean }>
/**
 * Determines the current video playback quality and its properties.
 * @returns {Promise<String>} A string object containing the quality value and metadata (auto, high, mid, low, source)
 */
async function GetQuality() {
    const lock = { configurable: false, enumerable: true, writable: false };

    const { videoHeight } = $('[data-a-target="video-player"i] video') ?? ({ videoHeight: $('[class*="player"i][class*="controls"i]')?.getElementByText(/\d+p/i)?.textContent });

    if((parseInt(videoHeight) | 0) > 0) {
        const value = parseInt(videoHeight)
            , quality = new String(`${ value }p`);

        Object.defineProperties(quality, {
            auto:   { value: true, ...lock },
            high:   { value: (value > 720), ...lock },
            mid:    { value: (value < 721 && value > 360), ...lock },
            low:    { value: (value < 361), ...lock },
            source: { value: quality.toLowerCase().contains('source'), ...lock },
        });

        return quality;
    }

    const buttons = {
        get settings() {
            return $('[data-a-target*="player"i][data-a-target*="button"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
        },

        get quality() {
            return $('[data-a-target*="player"i][data-a-target*="item"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
        },

        get options() {
            return $.all('[data-a-target*="player"i][data-a-target*="item"i]');
        },
    };

    buttons.settings?.click();

    await when.defined(() => buttons.settings)
        .then(async() => {
            await when.defined(() => buttons.quality)
                .then(button => button.click());
        })
        .catch($error);

    /**
     * Extracts the text content or value from a given element.
     * @param {*} text - The element or value to extract text from
     * @returns {string|*} The extracted text or the original value
     */
    const textOf = text => (text?.textContent ?? text?.value ?? text);

    const qualities = $.all('[data-a-target*="quality"i]:is([data-a-target*="option"i], [data-a-target*="setting"i]) input[type="radio"i]')
        .map(input => ({ input, label: input.parentElement.querySelector(`label[for="${ input.id }"]`), uuid: input.id }))
        .map(option => ({ value: (textOf(option.label) ?? 'Unknown'), ...option }))
        .sort((a, b) => parseInt(b.value) - parseInt(a.value));

    let current = qualities.find(({ input }) => input.checked);

    if(nullish(current)) {
        let { videoHeight = 0 } = $('[data-a-target="video-player"i] video') ?? ({});

        if((videoHeight |= 0) < 1)
            return /* Is the streamer even live? */;

        // Assume ALL streams are progressive, HTML does not support interlaced video
        current = ({ label: { textContent: `${ videoHeight }p` } });
    }

    const quality = new String(current.label.textContent);

    const source = current.uuid == qualities.find(({ value }) => /source/i.test(value))?.uuid
        , auto   = current.uuid == qualities.find(({ value }) => /auto/i.test(value))?.uuid
        , high   = current.uuid == qualities.find(({ value }) => /^\d+p/i.test(value))?.uuid
        , low    = current.uuid == qualities.at(-1)?.uuid;

    Object.defineProperties(quality, {
        auto:   { value: auto, ...lock },
        high:   { value: high, ...lock },
        low:    { value: low, ...lock },
        source: { value: source, ...lock },
    });

    buttons.settings?.click();

    return quality;
}

// Change the video quality
    // SetQuality(quality:string?, backup:string?) → Object<{ oldValue:object<{ input:Element, label:Element }>, newValue:object<{ input:Element, label:Element }> }>
/**
 * Sets the video playback quality to the specified value.
 * @param {string} [quality='auto'] - The desired quality (e.g., 'auto', 'high', '1080p')
 * @param {string} [backup='source'] - The backup quality to use if the primary is unavailable
 * @returns {Promise<Object>} An object containing the old and new quality values
 */
async function SetQuality(quality = 'auto', backup = 'source') {
    const buttons = {
        get settings() {
            return $('[data-a-target*="player"i][data-a-target*="button"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
        },

        get quality() {
            return $('[data-a-target*="player"i][data-a-target*="item"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
        },

        get options() {
            return $.all('[data-a-target*="player"i][data-a-target*="item"i]');
        },
    };

    buttons.settings?.click();

    await when.defined(() => buttons.settings)
        .then(async() => {
            await when.defined(() => buttons.quality)
                .then(button => button.click());
        })
        .catch($error);

    /**
     * Extracts the text content or value from a given element.
     * @param {*} text - The element or value to extract text from
     * @returns {string|*} The extracted text or the original value
     */
    const textOf = text => (text?.textContent ?? text?.value ?? text);

    const qualities = $.all('[data-a-target*="quality"i]:is([data-a-target*="option"i], [data-a-target*="setting"i]) input[type="radio"i]')
        .map(input => ({ input, label: input.parentElement.querySelector(`label[for="${ input.id }"]`), uuid: input.id }))
        .map(option => ({ value: (textOf(option.label) ?? 'Unknown'), ...option }))
        .sort((a, b) => parseInt(b.value) - parseInt(a.value));

    qualities.source = qualities.find(({ value }) => /source/i.test(value));
    qualities.auto   = qualities.find(({ value }) => /auto/i.test(value));
    qualities.high   = qualities.find(({ value }) => /^\d+p/i.test(value));
    qualities.low    = qualities.at(-1);

    let current = qualities.find(({ input }) => input.checked)
        , desired;

    if(/(auto|high|low|source)/i.test(quality))
        desired = qualities[RegExp.$1];
    else
        desired = qualities.find(({ label }) => textOf(label).contains(quality.toLowerCase())) ?? null;

    if(nullish(desired))
        /* The desired quality does not exist */
        desired = qualities.auto;
    else if(current?.uuid === desired?.uuid)
        /* Already on desired quality */
        /* Do nothing */;
    else if(defined(current?.input?.checked) && defined(desired?.input?.checked))
        /* The desired quality is available */
        desired.input.checked = !(current.input.checked = !1);

    desired?.input?.click?.();
    buttons.settings?.click();

    return new Promise((resolve, reject) => {
        const checker = setInterval(() => {
            const video = $.all('video').pop()
                , computed = (video?.videoHeight | 0) + 'p';

            if(desired !== computed) {
                clearInterval(checker);

                resolve({ oldValue: current, newValue: desired ?? computed });
            }
        }, 2_5_0);
    });
}

// Get the video volume
    // GetVolume(fromVideoElement:boolean?) → number<Percentage>
/**
 * Gets the current volume level of the video player.
 * @param {boolean} [fromVideoElement=true] - Whether to get volume from the video element or the UI slider
 * @returns {number} The volume level as a float
 */
function GetVolume(fromVideoElement = true) {
    const video = $('[data-a-target="video-player"i] video')
        , slider = $('[data-a-target*="player"i][data-a-target*="volume"i]');

    return parseFloat(fromVideoElement ? video?.volume : slider?.value);
}

Object.defineProperties(GetVolume, {
    onchange: {
        set(callback) {
            const name = callback.name || UUID.from(callback.toString()).value;

            if(GetVolume.__onchange__.has(name))
                return GetVolume.__onchange__.get(name);

            // $remark('Adding [on change] event listener', { [name]: callback });

            return GetVolume.__onchange__.set(name, callback);
        },

        get() {
            return GetVolume.__onchange__.size;
        },
    },
    __onchange__: { value: new Map() },
});

// Change the video volume
    // SetVolume(volume:number<Percentage>) → undefined
/**
 * Sets the volume level of the video player and updates the UI.
 * @param {number|string} [volume=0.5] - The volume level to set
 */
function SetVolume(volume = 0.5) {
    const video = $('[data-a-target="video-player"i] video')
        , thumb = $('[data-a-target*="player"i][data-a-target*="volume"i]')
        , slider = $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls + * [style]');

    volume = parseFloat(volume?.toFixed?.(2) || 1);

    if(defined(video))
        video.volume = volume;

    if(defined(thumb))
        thumb.value = volume;

    if(defined(slider))
        slider.modStyle(`width: ${ 100 * volume }%`);
}

// Get the view mode
    // GetViewMode() → string<{ "fullscreen" | "fullwidth" | "theatre" | "default" }>
/**
 * Detects the current layout mode of the player.
 * @returns {string} The view mode (e.g., 'default', 'theatre', 'overview', 'fullwidth', 'fullscreen')
 */
function GetViewMode() {
    let mode = 'default'
        , theatre = false
        , overview = false
        , fullwidth = false;

    if(theatre
        ||= /theatre/i.test([...$(`[data-test-selector*="video-container"i]`).classList].join(' '))
    )
        mode = 'theatre';

    if(overview
        ||= $.defined(`.home`)
    )
        mode = 'overview';

    if(fullwidth
        ||= $.defined(`[data-a-target*="right-column"i][data-a-target*="chat-bar"i][data-a-target*="collapsed"i] button[data-a-target*="collapse"i]`)
    )
        mode = 'fullwidth';

    const container = $(`button[data-a-target*="fullscreen"i]`)?.closest('div');

    if(nullish(container))
        return mode;

    const classes = ['', ...container.classList].join('.');

    if(false
        || (true
            && theatre
            && fullwidth
            && !overview
        )
        || $.all(classes, container.parentElement).length <= 3
    )
        mode = 'fullscreen';

    return mode;
}

// Change the view mode
    // SetViewMode(mode:string<{ "fullscreen" | "fullwidth" | "theatre" | "default" }>) → undefined
/**
 * Changes the player's layout mode by simulating clicks on the corresponding UI toggles.
 * @param {string} [mode='default'] - The desired view mode
 */
function SetViewMode(mode = 'default') {
    const buttons = []
        , toggles = {
            overview: {
                off: `[class*="root"i][class*="home"i] [href]`,
                on: `[class*="root"i][class*="chat"i] [href]`,
            },
            theatre: {
                off: `[data-test-selector*="video-container"i]:not([class*="theatre"i]) button[data-a-target*="theatre-mode"i], [tt-svg-label="theatre-mode-off"i]`,
                on: `[data-test-selector*="video-container"i][class*="theatre"i] button[data-a-target*="theatre-mode"i], [tt-svg-label="theatre-mode-on"i]`,
            },
            chat: {
                off: `[data-a-target*="right-column"i][data-a-target*="chat-bar"i]:not([data-a-target*="collapsed"i]) button[data-a-target*="collapse"i]`,
                on: `[data-a-target*="right-column"i][data-a-target*="chat-bar"i][data-a-target*="collapsed"i] button[data-a-target*="collapse"i]`,
            },
        };

    switch(mode) {
        case 'fullscreen': {
            buttons.push(toggles.theatre.off, toggles.chat.off);
        } break;

        case 'fullwidth': {
            buttons.push(toggles.theatre.on, toggles.chat.off);
        } break;

        case 'overview': {
            buttons.push(toggles.overview.on);
        } break;

        case 'theatre': {
            buttons.push(toggles.theatre.off, toggles.chat.on);
        } break;

        case 'default': {
            buttons.push(toggles.theatre.on, toggles.chat.on);
        } break;
    } // switch mode

    for(let button of buttons) {
        button = $(button);

        if(nullish(button))
            continue;
        button.closest('button')?.click();
    }
}

export { GetQuality, SetQuality, GetVolume, SetVolume, GetViewMode, SetViewMode };
