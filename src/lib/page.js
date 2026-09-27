/*** /lib/page.js
 * Page state: user activity, language, reloads.
 * Moved verbatim from tools.js in Phase 3; see src/lib/index.js for how it reaches the page.
 */

// Get the current user activity
    // GetActivity() → Promise<string | null>
/**
 * Retrieves the user's current activity status from the page.
 * @returns {Promise<string>} The activity text
 */
async function GetActivity() {
    return when.defined(() => {
        const open = $.defined('[data-a-target="user-display-name"i], [class*="dropdown-menu-header"i]');

        if(open) {
            ACTIVITY = window.ACTIVITY = $('[data-a-target="presence-text"i]')?.textContent
        } else {
            UserMenuToggleButton?.click();
            ACTIVITY = window.ACTIVITY = $('[data-a-target="presence-text"i]')?.textContent;
            UserMenuToggleButton?.click();
        }

        return ACTIVITY;
    });
}

// Get the current page's language
    // GetLanguage() → Promise<string | null>
/**
 * Retrieves the current user interface language from the page settings.
 * @returns {Promise<string>} The language code
 */
async function GetLanguage() {
    return when.defined(() => {
        const open = $.defined('[data-a-target="user-display-name"i], [class*="dropdown-menu-header"i]');

        if(open) {
            LITERATURE = window.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language
        } else {
            UserMenuToggleButton?.click();
            $('[data-a-target^="language"i]')?.click();
            LITERATURE = window.LITERATURE = $('[data-language] svg')?.closest('button')?.dataset?.language;
            UserMenuToggleButton?.click();
        }

        return LITERATURE;
    });
}

// Reloads the webpage
    // ReloadPage(onlineOnly:boolean?) → undefined
/**
 * Reloads the current page, with options to skip if offline or defer if the tab is hidden.
 * @param {boolean} [onlineOnly=true] - Only reload if the browser is online
 * @returns {Promise<void>}
 */
async function ReloadPage(onlineOnly = true) {
    // Navigaotr is offline, do not reload
    if(true
        && onlineOnly
        && (false
            || navigator.connection?.type?.equals('none')
            || navigator.onLine === false
        )
    )
        return;

    // A hidden tab may never finish loading, so wait until it's visible (#40)
    if(document.visibilityState == 'hidden') {
        if(!ReloadPage.deferred) {
            ReloadPage.deferred = true;

            document.addEventListener('visibilitychange', () => {
                ReloadPage.deferred = false;
                ReloadPage(onlineOnly);
            }, { once: true });
        }

        return;
    }

    await top.beforeleaving?.(new CustomEvent('locationchange', { from: location.pathname, to: location.pathname, persisted: document.readyState.unlike('unloading') }));

    location.reload();
}

export { GetActivity, GetLanguage, ReloadPage };
