/*** /settings/site-access.js
 * The "Site Access" button: asks the browser for the manifest's `optional_host_permissions` (a user gesture is
 * required), or gives them back. With them, the background worker reads those sites and no CORS proxy is used
 * (`fetchURL` in core.js, `FETCH_URL` in background.js).
 */

/**
 * Draws the status and the Allow / Remove button into `#site-access-manager`.
 * @returns {Promise<void>}
 */
export async function renderSiteAccess() {
    const container = document.getElementById('site-access-manager');
    const api = globalThis.browser ?? globalThis.chrome;
    const origins = api?.runtime?.getManifest?.().optional_host_permissions ?? [];

    if(!container || !api?.permissions || !origins.length)
        return;

    const draw = async() => {
        const granted = await api.permissions.contains({ origins });
        const sites = origins.map(origin => origin.replace(/^https:\/\/|\/\*$/g, '')).join(', ');

        container.innerHTML = `
            <p class='site-access--status' granted='${ granted }'>${ granted ? "Allowed" : "Not allowed (using the proxy)" }: <code>${ sites }</code></p>
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
