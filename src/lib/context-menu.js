/*** /lib/context-menu.js
 * Twitch-style context menus.
 * Moved verbatim from tools.js in Phase 3; see src/lib/index.js for how it reaches the page.
 */

// Creates a Twitch-style context menu
    // new ContextMenu({ options:array, fineTuning:object? }) → Element<ContextMenu>
    // options = { text:string, icon:string, shortcut:string, favicon:string<HTML|SVG> }
class ContextMenu {
    static #RootCloseOnComplete = when.defined(() => $('#root'))
        .then(root => root
            .addEventListener('mouseup', event => {
                let { path, button = -1 } = event
                    , menu = $('.tt-context-menu');

                if(defined(menu))
                    menu.remove();
            })
        );

    constructor({ inherit = {}, options = [], fineTuning = {} }) {
        fineTuning.top ??= '5rem';
        fineTuning.left ??= '5rem';
        fineTuning.cursor ??= 'auto';

        let styling = [];

        for(const key in fineTuning) {
            let [value, unit] = (fineTuning[key] ?? '').toString().split(/([\-\+]?[\d\.]+)([^\d\.]+)/).filter(string => string.length);

            if(nullish(value))
                continue;

            if(parseFloat(value) >= -Infinity)
                unit ??= 'px';
            else
                unit ??= '';

            styling.push(`${ key }:${ value }${ unit }`);
        }

        styling = styling.join(';');

        const f = furnish;

        const container = $('#root')
            , menu = f(`.tt-context-menu.tt-absolute`, { style: styling })
            , uuid = UUID.from(options.map(Object.values).join('\n')).value;

        menu.id = uuid;

        // Remove current menus. Only one allowed at a time
        $.all('.tt-context-menu').forEach(menu => menu.remove());

        menu.append(
            f('.tt-border-radius-large', { style: 'background:var(--color-background-alt-2); position:absolute; z-index:9999', direction: 'top-right' },
                // The options...
                f('div', { style: 'display:inline-block; min-width:16rem; max-width:48rem; width:max-content', role: 'dialog' },
                    f('div', { style: 'padding:0.25rem;' },
                        ...options.map(({ text = '', icon = '', shortcut = '', favicon = '', action = () => {} }) => {
                            if(icon?.length)
                                icon = f('div', { style: 'display:inline-block; float:left; margin-left:calc(-1rem - 16px); margin-right:1rem', innerHTML: Glyphs.modify(icon, { height: '16px', width: '16px', style: 'vertical-align:-3px' }) });
                            if(text?.length)
                                text = f('.tt-hide-text-overflow').html(text);
                            if(shortcut?.length)
                                shortcut = f.pre(f.code(GetMacro(shortcut)));
                            if(favicon?.length)
                                favicon = f.pre(f.code().html(favicon)).css(`margin-top:-2.5rem; transform:translate(0,25%)`);

                            if(icon || text || shortcut || favicon)
                                return f('button.tt-context-menu-option', { onmouseup: event => action({ ...event, inheritance: inherit }), style: 'border-radius:0.6rem; display:inline-block; padding:0.5rem 0 0.5rem 3rem; width:-webkit-fill-available;width:-moz-available' }, icon, shortcut, text, favicon);
                            return f('hr', { style: 'border-top:1px solid var(--channel-color); margin:0.25rem 0;' });
                        })
                    )
                )
            )
        );

        container.append(menu);

        const offset = getOffset(menu.firstElementChild);

        if(offset.screenOverflow) {
            if(offset.screenOverflowX)
                menu.modStyle(`left:${ getOffset(menu).left + offset.screenCorrectX }px`);
            if(offset.screenOverflowY)
                menu.modStyle(`top:${ getOffset(menu).top + offset.screenCorrectY }px`);
        }
    }
}

export { ContextMenu };
