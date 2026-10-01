/*** /settings/site-access.js
 * The "Site Access" button: asks the browser for the manifest's `optional_host_permissions` (a user gesture is
 * required), or gives them back. With them, the background worker reads those sites and no CORS proxy is used
 * (`fetchURL` in core.js, `FETCH_URL` in background.js).
 */

/**
 * Draws the status and the Allow / Remove button into `#site-access-manager`.
 * @returns {Promise<void>}
 */
/**
 * The site a host belongs to, as a reader would name it.
 * @param {string} host - e.g. `store.steampowered.com`
 * @returns {string} e.g. `Steam`
 */
function siteName(host) {
    return ({
        'www.twitchmetrics.net': 'TwitchMetrics',
        'twitchstats.net': 'TwitchStats',
        'twitchtracker.com': 'TwitchTracker',
        'tinyurl.com': 'TinyURL',
        'preview.tinyurl.com': 'TinyURL',
        'store.steampowered.com': 'Steam',
        'store.playstation.com': 'PlayStation',
        'store.epicgames.com': 'Epic Games',
        'www.microsoft.com': 'Microsoft',
        'u3b6gr4ua3-dsn.algolia.net': 'Nintendo',
        'www.nintendo.com': 'Nintendo',
    })[host] ?? host;
}

export async function renderSiteAccess() {
    const container = document.getElementById('site-access-manager');
    const api = globalThis.browser ?? globalThis.chrome;
    const origins = api?.runtime?.getManifest?.().optional_host_permissions ?? [];

    if(!container || !api?.permissions || !origins.length)
        return;

    const draw = async() => {
        const granted = await api.permissions.contains({ origins });
        const hosts = origins.map(origin => origin.replace(/^https:\/\/|\/\*$/g, ''));
        const sites = [...new Set(hosts.map(siteName))].join(', ');

        // Friendly names wrap in the narrow (pop-up) Settings; the raw hosts stay in the tooltip
        container.innerHTML = `
            <p class='site-access--status' granted='${ granted }' title='${ hosts.join(', ') }'>${ granted ? "Allowed" : "Not allowed (using the proxy)" }: ${ sites }</p>
            <button class='site-access--toggle' type='button'>${ granted ? "Remove access" : "Allow access" }</button>
        `;

        container.querySelector('.site-access--toggle').onclick = async() => {
            try {
                if(granted)
                    await api.permissions.remove({ origins });
                else
                    await api.permissions.request({ origins });
            } catch(error) {
                console.warn("Site Access:", error);
            }

            draw();
        };
    };

    await draw();
}
