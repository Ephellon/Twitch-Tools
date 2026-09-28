# TTV Tools

An extension that gives you a set of tools to control your Twitch&trade; experience.

Get for [Google Chrome](https://chrome.google.com/webstore/detail/twitch-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd)

See the [Wiki](https://github.com/Ephellon/Twitch-Tools/wiki) for more information

> [!IMPORTANT]
> **v6 is in pre-release.** It's a large update, so expect a few rough edges. Please [report anything odd](https://github.com/Ephellon/Twitch-Tools/issues) with what you were doing and, if you can, a screenshot of the console (<kbd>F12</kbd>). The stable version stays on the [Chrome Web Store](https://chrome.google.com/webstore/detail/twitch-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd).

### What's new in v6

- **User Scripts:** write your own chat automation in the TTV DSL, for example replying to commands, greeting raiders or posting on a timer. Scripts are added and edited in Settings → **User Scripts**, in an editor with highlighting, line numbers and live problem checking. A script that asks for extra permissions only runs once you approve them. See [User Scripts](https://github.com/Ephellon/Twitch-Tools/wiki/User-Scripts) and the [examples](https://github.com/Ephellon/Twitch-Tools/wiki/TTV-DSL-Examples) on the Wiki.
- **Settings:**
  - Every option now has a sensible default, including options added by an update.
  - Settings can be exported to a file and restored from one (#58).
  - Your user scripts are included in the export.
- **Firefox:** each release now includes a Firefox build (`ttv-tools-firefox.zip`). It's experimental.
- **Fixes:**
  - **Up Next:**
    - Skip actually skips (#52).
    - The channel you're already on isn't queued (#55).
    - The panel no longer flashes (#44).
    - Auto-Focus no longer undoes a manual pause (#56).
  - Stay Live lets you open offline channels (#50).
  - Lurking keeps its volume (#26).
  - "Buy when available" no longer toggles the rewards menu (#48).
  - Offline channels no longer get stuck reloading.
  - The left navigation no longer collapses (#42).
  - The start-up memory leak is fixed.
- **Removed:** Prevent Hosting, since Twitch removed hosting in 2022.
- **Under the hood:**
  - Every feature is now a self-contained plugin.
  - The styles are shared and consistent.
  - There's new developer documentation in [`docs/`](docs/).

### How to install a release (`.zip`) in Chrome or Edge

<details><summary>1. Go to the <a href="https://github.com/Ephellon/Twitch-Tools/releases/latest">latest release</a> and download the <code>ttv-tools.zip</code> file</summary>

![image](https://user-images.githubusercontent.com/8632548/182983857-19a61863-2ad7-44ca-b9c4-e188fce86b04.png) 

</details>
<details><summary>2. Extract the ZIP to a folder</summary>

![image](https://user-images.githubusercontent.com/8632548/182984280-1632674e-e876-45ff-841b-e089bbce8ffc.png)

</details>
<details><summary>3. Go to <code>chrome://extensions</code></summary>
  
  > 1. Ensure **Developer mode** is enabled (*top right*)
  > 2. Select **Load unpacked** (*top left*)

![image](https://user-images.githubusercontent.com/8632548/182984405-56506ccc-fe96-4f9a-93a2-5ebf15c457c1.png)

</details>
<details><summary>4. Select the folder you created at <em>step 2</em></summary>

![image](https://user-images.githubusercontent.com/8632548/182984463-fec55b54-de6e-41b5-a21d-8ac9ad4e4585.png)

</details>

### How to try the Firefox build

1. Download `ttv-tools-firefox.zip` from the [latest release](https://github.com/Ephellon/Twitch-Tools/releases/latest)
2. Go to `about:debugging#/runtime/this-firefox`
3. Select **Load Temporary Add-on…** and choose the ZIP (it stays loaded until Firefox restarts)
