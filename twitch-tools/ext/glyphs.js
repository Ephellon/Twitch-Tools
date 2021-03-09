/*** Available SVG glyphs
 * bonuschannelpoints
 * more_horizontal
 * more_vertical
 * channelpoints
 * checkmark
 * favorite
 * emotes
 * search
 * stream
 * trophy
 * upload
 * wallet
 * close
 * globe
 * leave
 * music
 * pause
 * reply
 * stats
 * trash
 * bits
 * chat
 * gift
 * help
 * lock
 * loot
 * moon
 * play
 * star
 * eye
 * mod
 * cog
 * x
 */

top.Glyphs ??= {
    bonuschannelpoints: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16.503 3.257L18 7v11H2V7l1.497-3.743A2 2 0 015.354 2h9.292a2 2 0 011.857 1.257zM5.354 4h9.292l1.2 3H4.154l1.2-3zM4 9v7h12V9h-3v4H7V9H4zm7 0v2H9V9h2z" clip-rule="evenodd"></path></g></svg>`,
    /*  let fill="currentcolor", width="100%", height="100%", version="1.1", viewBox="0 0 20 20", x="0px", y="0px";
        f('svg', { fill, width, height, version, viewBox, x, y },
            f('g', {},
                f('path', {
                    'clip-rule': 'evenodd',
                    'fill-rule': 'evenodd',
                    d: 'M16.503 3.257L18 7v11H2V7l1.497-3.743A2 2 0 015.354 2h9.292a2 2 0 011.857 1.257zM5.354 4h9.292l1.2 3H4.154l1.2-3zM4 9v7h12V9h-3v4H7V9H4zm7 0v2H9V9h2z',
                })
            )
        )
    */

    more_horizontal: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M2 10a2 2 0 114 0 2 2 0 01-4 0zM8 10a2 2 0 114 0 2 2 0 01-4 0zM16 8a2 2 0 100 4 2 2 0 000-4z"></path></g></svg>`,

    more_vertical: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 18a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM8 4a2 2 0 104 0 2 2 0 00-4 0z"></path></g></svg>`,
    channelpoints: `<svg fill="#9147ff"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>`,

    checkmark: `<svg fill="#22fa7c" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 10l5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z"></path></g></svg>`,

    favorite: `<svg fill="#bb1411" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9.171 4.171A4 4 0 006.343 3H6a4 4 0 00-4 4v.343a4 4 0 001.172 2.829L10 17l6.828-6.828A4 4 0 0018 7.343V7a4 4 0 00-4-4h-.343a4 4 0 00-2.829 1.172L10 5l-.829-.829z" fill-rule="evenodd" clip-rule="evenodd"></path></g></svg>`,

    emotes: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 11a1 1 0 100-2 1 1 0 000 2zM14 10a1 1 0 11-2 0 1 1 0 012 0zM10 14a2 2 0 002-2H8a2 2 0 002 2z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>`,
    latest: `<svg fill="#e6cb00"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M13.39 4.305L12 5l1.404.702a2 2 0 01.894.894L15 8l.702-1.404a2 2 0 01.894-.894L18 5l-1.418-.709a2 2 0 01-.881-.869L14.964 2l-.668 1.385a2 2 0 01-.907.92z"></path><path fill-rule="evenodd" d="M5.404 9.298a2 2 0 00.894-.894L8 5h1l1.702 3.404a2 2 0 00.894.894L15 11v1l-3.404 1.702a2 2 0 00-.894.894L9 18H8l-1.702-3.404a2 2 0 00-.894-.894L2 12v-1l3.404-1.702zm2.683 0l.413-.826.413.826a4 4 0 001.789 1.789l.826.413-.826.413a4 4 0 00-1.789 1.789l-.413.826-.413-.826a4 4 0 00-1.789-1.789l-.826-.413.826-.413a4 4 0 001.789-1.789z" clip-rule="evenodd"></path></g></svg>`,
    search: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M13.192 14.606a7 7 0 111.414-1.414l3.101 3.1-1.414 1.415-3.1-3.1zM14 9A5 5 0 114 9a5 5 0 0110 0z" clip-rule="evenodd"></path></g></svg>`,
    stream: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9 8l3 2-3 2V8z"></path><path fill-rule="evenodd" d="M4 2H2v16h2v-2h12v2h2V2h-2v2H4V2zm12 4H4v8h12V6z" clip-rule="evenodd"></path></g></svg>`,
    thread: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M5 6H7V8H5V6Z"></path><path d="M9 6H11V8H9V6Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M8 14L10 12H13C13.5523 12 14 11.5523 14 11V3C14 2.44772 13.5523 2 13 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H6L8 14ZM6.82843 10H4V4H12V10H9.17157L8 11.1716L6.82843 10Z"></path></g></svg>`,
    trophy: `<svg fill="#ff9147"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M5 10h.1A5.006 5.006 0 009 13.9V16H7v2h6v-2h-2v-2.1a5.006 5.006 0 003.9-3.9h.1a3 3 0 003-3V4h-3V2H5v2H2v3a3 3 0 003 3zm2-6h6v5a3 3 0 11-6 0V4zm8 2v2a1 1 0 001-1V6h-1zM4 6h1v2a1 1 0 01-1-1V6z"></path></g></svg>`,
    upload: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M2 16v-3h2v3h12v-3h2v3a2 2 0 01-2 2H4a2 2 0 01-2-2zM15 7l-1.5 1.5L11 6v7H9V6L6.5 8.5 5 7l5-5 5 5z"></path></g></svg>`,
    wallet: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 11h2v2h-2v-2z"></path><path fill-rule="evenodd" d="M13.45 2.078L2 6v12h14a2 2 0 002-2V8a2 2 0 00-2-2V4.001a2 2 0 00-2.55-1.923zM14 6V4.004L8.172 6H14zM4 8v8h12V8H4z" clip-rule="evenodd"></path></g></svg>`,

    close: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 16V4H2v12h2zM13 15l-1.5-1.5L14 11H6V9h8l-2.5-2.5L13 5l5 5-5 5z"></path></g></svg>`,
    globe: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M10 2c4.415 0 8 3.585 8 8s-3.585 8-8 8-8-3.585-8-8 3.585-8 8-8zm5.917 9a6.015 6.015 0 01-3.584 4.529A10 10 0 0013.95 11h1.967zm0-2a6.015 6.015 0 00-3.584-4.529A10 10 0 0113.95 9h1.967zm-3.98 0A8.002 8.002 0 0010 4.708 8.002 8.002 0 008.063 9h3.874zm-3.874 2A8.002 8.002 0 0010 15.292 8.002 8.002 0 0011.937 11H8.063zM6.05 11a10 10 0 001.617 4.529A6.014 6.014 0 014.083 11H6.05zm0-2a10 10 0 011.617-4.529A6.014 6.014 0 004.083 9H6.05z" clip-rule="evenodd"></path></g></svg>`,
    leave: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M16 18h-4a2 2 0 01-2-2v-2h2v2h4V4h-4v2h-2V4a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2z"></path><path d="M7 5l1.5 1.5L6 9h8v2H6l2.5 2.5L7 15l-5-5 5-5z"></path></g></svg>`,
    music: `<svg fill="#9147ff"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M18 4.331a2 2 0 00-2.304-1.977l-9 1.385A2 2 0 005 5.716v7.334A2.5 2.5 0 106.95 16H7V9.692l9-1.385v2.743A2.5 2.5 0 1017.95 14H18V4.33zm-2 0L7 5.716v1.953l9-1.385V4.33z" clip-rule="evenodd"></path></g></svg>`,
    pause: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8 3H4v14h4V3zM16 3h-4v14h4V3z"></path></g></svg>`,
    reply: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8.5 5.5L7 4L2 9L7 14L8.5 12.5L6 10H10C12.2091 10 14 11.7909 14 14V16H16V14C16 10.6863 13.3137 8 10 8H6L8.5 5.5Z"></path></g></svg>`,
    stats: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 10h2v4H7v-4zM13 6h-2v8h2V6z"></path><path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm12 2H4v12h12V4z" clip-rule="evenodd"></path></g></svg>`,
    trash: `<svg fill="#bb1411"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>`,

    bits: `<svg fill="#9147ff"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M3 12l7-10 7 10-7 6-7-6zm2.678-.338L10 5.487l4.322 6.173-.85.728L10 11l-3.473 1.39-.849-.729z"></path></g></svg>`,
    chat: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M7.828 13L10 15.172 12.172 13H15V5H5v8h2.828zM10 18l-3-3H5a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2l-3 3z" clip-rule="evenodd"></path></g></svg>`,
    gift: `<svg fill="#9147ff"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16 6h2v6h-1v6H3v-6H2V6h2V4.793c0-2.507 3.03-3.762 4.803-1.99.131.131.249.275.352.429L10 4.5l.845-1.268a2.81 2.81 0 01.352-.429C12.969 1.031 16 2.286 16 4.793V6zM6 4.793V6h2.596L7.49 4.341A.814.814 0 006 4.793zm8 0V6h-2.596l1.106-1.659a.814.814 0 011.49.451zM16 8v2h-5V8h5zm-1 8v-4h-4v4h4zM9 8v2H4V8h5zm0 4H5v4h4v-4z" clip-rule="evenodd"></path></g></svg>`,
    help: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9 8a1 1 0 011-1h.146a.87.87 0 01.854.871c0 .313-.179.6-.447.735A2.81 2.81 0 009 11.118V12h2v-.882a.81.81 0 01.447-.724A2.825 2.825 0 0013 7.871C13 6.307 11.734 5 10.146 5H10a3 3 0 00-3 3h2zM9 14a1 1 0 112 0 1 1 0 01-2 0z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8 6a6 6 0 110-12 6 6 0 010 12z"></path></g></svg>`,
    lock: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M14.001 5.99A3.992 3.992 0 0010.01 2h-.018a3.992 3.992 0 00-3.991 3.99V8H3.999v8c0 1.105.896 2 2 2h8c1.104 0 2-.895 2-2V8h-1.998V5.99zm-2 2.01V5.995A1.996 1.996 0 0010.006 4h-.01a1.996 1.996 0 00-1.995 1.995V8h4z" clip-rule="evenodd"></path></g></svg>`,
    loot: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M11 2H9v3h2V2z"></path><path fill-rule="evenodd" d="M18 18v-7l-1.447-2.894A2 2 0 0014.763 7H5.237a2 2 0 00-1.789 1.106L2 11v7h16zM5.236 9h9.528l1 2H4.236l1-2zM4 13v3h12v-3h-5v1H9v-1H4z" clip-rule="evenodd"></path><path d="M4 3h2v2H4V3zM14 3h2v2h-2V3z"></path></g></svg>`,
    moon: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M8.614 2.134a8.001 8.001 0 001.388 15.879 8.003 8.003 0 007.884-6.635 6.947 6.947 0 01-2.884.62 7.004 7.004 0 01-6.388-9.864zM6.017 5.529a5.989 5.989 0 00-2.015 4.484c0 3.311 2.69 6 6 6a5.99 5.99 0 004.495-2.028 9.006 9.006 0 01-8.48-8.456z" clip-rule="evenodd"></path></g></svg>`,
    play: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M5 17.066V2.934a.5.5 0 01.777-.416L17 10 5.777 17.482A.5.5 0 015 17.066z"></path></g></svg>`,
    star: `<svg fill="#ff9147"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M11.456 8.255L10 5.125l-1.456 3.13-3.49.485 2.552 2.516-.616 3.485L10 13.064l3.01 1.677-.616-3.485 2.553-2.516-3.491-.485zM7.19 6.424l-4.2.583c-.932.13-1.318 1.209-.664 1.853l3.128 3.083-.755 4.272c-.163.92.876 1.603 1.722 1.132L10 15.354l3.579 1.993c.846.47 1.885-.212 1.722-1.132l-.755-4.272 3.128-3.083c.654-.644.268-1.723-.664-1.853l-4.2-.583-1.754-3.77c-.406-.872-1.706-.872-2.112 0L7.19 6.424z" clip-rule="evenodd"></path></g></svg>`,

    eye: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M11.998 10a2 2 0 11-4 0 2 2 0 014 0z"></path><path fill-rule="evenodd" d="M16.175 7.567L18 10l-1.825 2.433a9.992 9.992 0 01-2.855 2.575l-.232.14a6 6 0 01-6.175 0 35.993 35.993 0 00-.233-.14 9.992 9.992 0 01-2.855-2.575L2 10l1.825-2.433A9.992 9.992 0 016.68 4.992l.233-.14a6 6 0 016.175 0l.232.14a9.992 9.992 0 012.855 2.575zm-1.6 3.666a7.99 7.99 0 01-2.28 2.058l-.24.144a4 4 0 01-4.11 0 38.552 38.552 0 00-.239-.144 7.994 7.994 0 01-2.28-2.058L4.5 10l.925-1.233a7.992 7.992 0 012.28-2.058 37.9 37.9 0 00.24-.144 4 4 0 014.11 0l.239.144a7.996 7.996 0 012.28 2.058L15.5 10l-.925 1.233z" clip-rule="evenodd"></path></g></svg>`,
    mod: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M5.003 3.947A10 10 0 009.519 2.32L10 2l.48.32A10 10 0 0016.029 4H17l-.494 5.641a9 9 0 01-4.044 6.751L10 18l-2.462-1.608a9 9 0 01-4.044-6.75L3 4h.972c.346 0 .69-.018 1.031-.053zm.174 1.992l.309 3.528a7 7 0 003.146 5.25l1.368.894 1.368-.893a7 7 0 003.146-5.25l.309-3.529A12 12 0 0110 4.376 12 12 0 015.177 5.94z" clip-rule="evenodd"></path></g></svg>`,
    cog: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 8a2 2 0 100 4 2 2 0 000-4z"></path><path fill-rule="evenodd" d="M9 2h2a2.01 2.01 0 001.235 1.855l.53.22a2.01 2.01 0 002.185-.439l1.414 1.414a2.01 2.01 0 00-.439 2.185l.22.53A2.01 2.01 0 0018 9v2a2.01 2.01 0 00-1.855 1.235l-.22.53a2.01 2.01 0 00.44 2.185l-1.415 1.414a2.01 2.01 0 00-2.184-.439l-.531.22A2.01 2.01 0 0011 18H9a2.01 2.01 0 00-1.235-1.854l-.53-.22a2.009 2.009 0 00-2.185.438L3.636 14.95a2.009 2.009 0 00.438-2.184l-.22-.531A2.01 2.01 0 002 11V9c.809 0 1.545-.487 1.854-1.235l.22-.53a2.009 2.009 0 00-.438-2.185L5.05 3.636a2.01 2.01 0 002.185.438l.53-.22A2.01 2.01 0 009 2zm-4 8l1.464 3.536L10 15l3.535-1.464L15 10l-1.465-3.536L10 5 6.464 6.464 5 10z" clip-rule="evenodd"></path></g></svg>`,

    x: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8.5 10L4 5.5 5.5 4 10 8.5 14.5 4 16 5.5 11.5 10l4.5 4.5-1.5 1.5-4.5-4.5L5.5 16 4 14.5 8.5 10z"></path></g></svg>`,

    modify(glyph, attributes) {
        let XMLParser = Glyphs.DOMParser ??= new DOMParser;

        let XML = XMLParser.parseFromString((glyph in Glyphs? Glyphs[glyph]: glyph), 'text/xml'),
            SVG = $('svg', false, XML);

        for(let attribute in attributes) {
            let value = attributes[attribute];

            SVG.setAttribute(attribute, value);
        }

        let string = new String(SVG.outerHTML);

        string.asNode = SVG;

        return string;
    },
};
