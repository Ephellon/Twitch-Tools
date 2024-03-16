/*** /glyphs.js - All SVGs that need to be stored locally
 *       _____ _             _           _
 *      / ____| |           | |         (_)
 *     | |  __| |_   _ _ __ | |__  ___   _ ___
 *     | | |_ | | | | | '_ \| '_ \/ __| | / __|
 *     | |__| | | |_| | |_) | | | \__ \_| \__ \
 *      \_____|_|\__, | .__/|_| |_|___(_) |___/
 *                __/ | |              _/ |
 *               |___/|_|             |__/
 */

/** @file Defines all of the Glyphs (SVGs) used within the extension.
 * <style>[\.pill]{font-weight:bold;white-space:nowrap;border-radius:1rem;padding:.25rem .75rem}[\.good]{background:#e8f0fe66;color:#174ea6}[\.bad]{background:#fce8e666;color:#9f0e0e;}</style>
 * @author Ephellon Grey (GitHub {@link https://github.io/ephellon @ephellon})
 * @module
 */

;

/** All glyphs used within the extension.
 * @prop {string<SVG>} exit_picture_in_picture - The "exit picture in picture" glyph
 * @prop {string<SVG>} secondary_mouse_button - The "secondary mouse button" glyph
 * @prop {string<SVG>} primary_mouse_button - The "primary mouse button" glyph
 * @prop {string<SVG>} bonuschannelpoints - The "bonuschannelpoints" glyph
 * @prop {string<SVG>} picture_in_picture - The "picture in picture" glyph
 * @prop {string<SVG>} add_to_calendar - The "add to calendar" glyph
 * @prop {string<SVG>} more_horizontal - The "more horizontal" glyph
 * @prop {string<SVG>} more_vertical - The "more vertical" glyph
 * @prop {string<SVG>} channelpoints - The "channelpoints" glyph
 * @prop {string<SVG>} extensions - The "extensions" glyph
 * @prop {string<SVG>} navigation - The "navigation" glyph
 * @prop {string<SVG>} checkmark - The "checkmark" glyph
 * @prop {string<SVG>} translate - The "translate" glyph
 * @prop {string<SVG>} incognito - The "incognito" glyph
 * @prop {string<SVG>} highlight - The "highlight" glyph
 * @prop {string<SVG>} calendar - The "calendar" glyph
 * @prop {string<SVG>} collapse - The "collapse" glyph
 * @prop {string<SVG>} download - The "download" glyph
 * @prop {string<SVG>} favorite - The "favorite" glyph
 * @prop {string<SVG>} ne_arrow - The "ne arrow" glyph
 * @prop {string<SVG>} streamer - The "streamer" glyph
 * @prop {string<SVG>} verified - The "verified" glyph
 * @prop {string<SVG>} battery - The "battery" glyph
 * @prop {string<SVG>} compass - The "compass" glyph
 * @prop {string<SVG>} dislike - The "dislike" glyph
 * @prop {string<SVG>} dropper - The "dropper" glyph
 * @prop {string<SVG>} predict - The "predict" glyph
 * @prop {string<SVG>} refresh - The "refresh" glyph
 * @prop {string<SVG>} station - The "station" glyph
 * @prop {string<SVG>} emotes - The "emotes" glyph
 * @prop {string<SVG>} expand - The "expand" glyph
 * @prop {string<SVG>} export - The "export" glyph
 * @prop {string<SVG>} ignore - The "ignore" glyph
 * @prop {string<SVG>} inform - The "inform" glyph
 * @prop {string<SVG>} latest - The "latest" glyph
 * @prop {string<SVG>} notify - The "notify" glyph
 * @prop {string<SVG>} people - The "people" glyph
 * @prop {string<SVG>} pinned - The "pinned" glyph
 * @prop {string<SVG>} popout - The "popout" glyph
 * @prop {string<SVG>} rewind - The "rewind" glyph
 * @prop {string<SVG>} search - The "search" glyph
 * @prop {string<SVG>} stream - The "stream" glyph
 * @prop {string<SVG>} thread - The "thread" glyph
 * @prop {string<SVG>} trophy - The "trophy" glyph
 * @prop {string<SVG>} twitch - The "twitch" glyph
 * @prop {string<SVG>} unmute - The "unmute" glyph
 * @prop {string<SVG>} unread - The "unread" glyph
 * @prop {string<SVG>} upload - The "upload" glyph
 * @prop {string<SVG>} wallet - The "wallet" glyph
 * @prop {string<SVG>} mouse - The "mouse" glyph
 * @prop {string<SVG>} audio - The "audio" glyph
 * @prop {string<SVG>} alert - The "alert" glyph
 * @prop {string<SVG>} close - The "close" glyph
 * @prop {string<SVG>} crown - The "crown" glyph
 * @prop {string<SVG>} globe - The "globe" glyph
 * @prop {string<SVG>} ghost - The "ghost" glyph
 * @prop {string<SVG>} intro - The "intro" glyph
 * @prop {string<SVG>} leave - The "leave" glyph
 * @prop {string<SVG>} music - The "music" glyph
 * @prop {string<SVG>} party - The "party" glyph
 * @prop {string<SVG>} pause - The "pause" glyph
 * @prop {string<SVG>} reply - The "reply" glyph
 * @prop {string<SVG>} rerun - The "rerun" glyph
 * @prop {string<SVG>} stats - The "stats" glyph
 * @prop {string<SVG>} sword - The "sword" glyph
 * @prop {string<SVG>} trash - The "trash" glyph
 * @prop {string<SVG>} unfav - The "unfav" glyph
 * @prop {string<SVG>} video - The "video" glyph
 * @prop {string<SVG>} bits - The "bits" glyph
 * @prop {string<SVG>} bolt - The "bolt" glyph
 * @prop {string<SVG>} cake - The "cake" glyph
 * @prop {string<SVG>} clip - The "clip" glyph
 * @prop {string<SVG>} chat - The "chat" glyph
 * @prop {string<SVG>} flag - The "flag" glyph
 * @prop {string<SVG>} game - The "game" glyph
 * @prop {string<SVG>} gift - The "gift" glyph
 * @prop {string<SVG>} help - The "help" glyph
 * @prop {string<SVG>} hide - The "hide" glyph
 * @prop {string<SVG>} home - The "home" glyph
 * @prop {string<SVG>} host - The "host" glyph
 * @prop {string<SVG>} info - The "info" glyph
 * @prop {string<SVG>} lock - The "lock" glyph
 * @prop {string<SVG>} loot - The "loot" glyph
 * @prop {string<SVG>} moon - The "moon" glyph
 * @prop {string<SVG>} play - The "play" glyph
 * @prop {string<SVG>} plus - The "plus" glyph
 * @prop {string<SVG>} poll - The "poll" glyph
 * @prop {string<SVG>} raid - The "raid" glyph
 * @prop {string<SVG>} show - The "show" glyph
 * @prop {string<SVG>} star - The "star" glyph
 * @prop {string<SVG>} warn - The "warn" glyph
 * @prop {string<SVG>} fav - The "fav" glyph
 * @prop {string<SVG>} map - The "map" glyph
 * @prop {string<SVG>} mod - The "mod" glyph
 * @prop {string<SVG>} cog - The "cog" glyph
 * @prop {string<SVG>} vip - The "vip" glyph
 * @prop {string<SVG>} at - The "at" glyph
 * @prop {string<SVG>} x - The "x" glyph
 *
 * @prop {function} modify          <div class="signature">(glyph:string, attributes:object<span class="signature-attributes">opt, nullable</span>, element:string<span class="signature-attributes">opt, nullable</span>) → {string}</div>
 *                                  <br>Modifies the specified Glyph
 *                                  <br><ul>
 *                                  <li><code class=prettyprint>glyph</code> &mdash; The Glyph to modify</li>
 *                                  <li><code class=prettyprint>attributes</code> &mdash; Attributes to overwrite on the glyph</li>
 *                                  <li><code class=prettyprint>element <i>&rArr; "svg"</i></code> &mdash; The element tag-name that should be returned</li>
 *                                  <li><code class=prettyprint>return <i>{string}</i></code> &mdash; The modified HTML or SVG (XML)</li>
 *                                  </ul>
 * @prop {function} utf8            <div class="signature"><span class="signature-attributes">getter</span>() → {object}</div>
 *                                  <br>Returns the UTF-8 encoding (emoji) of the glyphs
 *                                  <br><ul>
 *                                  <li><code class=prettyprint>return <i>{object}</i></code> &mdash; An object (<code class=prettyprint>{ name: string&lt;utf8&gt; }</code>) of all glyphs encoded as UTF-8 strings</li>
 *                                  </ul>
 * @prop {function} base64          <div class="signature"><span class="signature-attributes">getter</span>() → {object}</div>
 *                                  <br>Returns the Base64 encoding of the glyphs
 *                                  <br><ul>
 *                                  <li><code class=prettyprint>return <i>{object}</i></code> &mdash; An object (<code class=prettyprint>{ name: string&lt;base64&gt; }</code>) of all glyphs encoded as Base64 strings</li>
 *                                  </ul>
 * @prop {function} dataURI         <div class="signature"><span class="signature-attributes">getter</span>() → {object}</div>
 *                                  <br>Returns the {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs data URI} string of the glyphs
 *                                  <br><ul>
 *                                  <li><code class=prettyprint>return <i>{object}</i></code> &mdash; An object (<code class=prettyprint>{ name: string&lt;dataURI&gt; }</code>) encoded as data URI strings</li>
 *                                  </ul>
 * @prop {function} dataURI         <div class="signature"><span class="signature-attributes">getter</span>() → {object}</div>
 *                                  <br>Returns the {@link https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths path data} of the glyphs
 *                                  <br><ul>
 *                                  <li><code class=prettyprint>return <i>{object}</i></code> &mdash; An object (<code class=prettyprint>{ name: string&lt;pathData&gt; }</code>) encoded as path data</li>
 *                                  </ul>
 */
window.Glyphs ??= {
    /** @license
     * Valve Corp. (c) 2022. All rights reserved.
     *
     * @see https://store.steampowered.com/legal
     *
     * 2022-09-16 11:18 CST
     * Nothing that notes use of the Steam logo is restricted. The logo is ONLY used as a placeholder to redirect to Steam's site.
     *
     * @prop {string<SVG>} store_steam
     */
    store_steam: `<svg fill="#000000" width="34px" height="34px" version="1.1" viewBox="0 25 90 40" x="0px" y="0px"><g><path d="M41.8,0C19.7,0,1.7,17,0,38.5l22.5,9.3c1.9-1.3,4.2-2.1,6.7-2.1c0.2,0,0.4,0,0.7,0l10-14.5c0-0.1,0-0.1,0-0.2    c0-8.7,7.1-15.8,15.8-15.8c8.7,0,15.8,7.1,15.8,15.8c0,8.7-7.1,15.8-15.8,15.8c-0.1,0-0.2,0-0.4,0L41,57.1c0,0.2,0,0.4,0,0.6    c0,6.5-5.3,11.9-11.9,11.9c-5.7,0-10.5-4.1-11.6-9.5L1.4,53.3c5,17.6,21.1,30.5,40.3,30.5c23.1,0,41.9-18.8,41.9-41.9    C83.7,18.8,64.9,0,41.8,0z"/><path d="M26.3,63.6l-5.1-2.1c0.9,1.9,2.5,3.5,4.6,4.4c4.5,1.9,9.8-0.3,11.6-4.8c0.9-2.2,0.9-4.6,0-6.8    c-0.9-2.2-2.6-3.9-4.8-4.8c-2.2-0.9-4.5-0.9-6.6-0.1l5.3,2.2c3.3,1.4,4.9,5.2,3.5,8.6C33.4,63.4,29.6,65,26.3,63.6z"/><path d="M66.1,31.1c0-5.8-4.7-10.5-10.5-10.5s-10.5,4.7-10.5,10.5s4.7,10.5,10.5,10.5S66.1,36.9,66.1,31.1z     M47.7,31.1c0-4.4,3.5-7.9,7.9-7.9c4.4,0,7.9,3.5,7.9,7.9c0,4.4-3.5,7.9-7.9,7.9C51.2,39,47.7,35.5,47.7,31.1z"/></g></svg>`,

    /** @license
     * Sony Interactive Entertainment LLC (c) 2022. All rights reserved.
     *
     * @see https://www.playstation.com/en-us/legal/copyright-and-trademark-notice/
     *
     * 2022-09-16 11:12 CST
     * Nothing that notes use of the PlayStation logo is restricted. The logo is ONLY used as a placeholder to redirect to PlayStation's site.
     *
     * @prop {string<SVG>} store_playstation
     */
    store_playstation: `<svg fill="#0072ce" width="15px" height="15px" viewBox="0 0 50 39" x="0px" y="0px"><path d="M49.555339,29.8491161 C48.578647,31.094408 46.1857531,31.9827541 46.1857531,31.9827541 C46.1857531,31.9827541 28.3849726,38.4444956 28.3849726,38.4444956 C28.3849726,38.4444956 28.3849726,33.6791056 28.3849726,33.6791056 C28.3849726,33.6791056 41.4851369,28.9619184 41.4851369,28.9619184 C42.971753,28.4236327 43.2000258,27.6626842 41.9916545,27.2632726 C40.7855535,26.8627126 38.6016267,26.9774879 37.1138742,27.5180705 C37.1138742,27.5180705 28.3849726,30.6249863 28.3849726,30.6249863 C28.3849726,30.6249863 28.3849726,25.6793995 28.3849726,25.6793995 C28.3849726,25.6793995 28.8880837,25.5072391 28.8880837,25.5072391 C28.8880837,25.5072391 31.4104473,24.6051207 34.9572024,24.2080049 C38.5039575,23.8131842 42.8468263,24.2619483 46.2561647,25.5680695 C50.0981976,26.7949969 50.5308945,28.6038269 49.555339,29.8491161 Z M30.0794221,21.7346381 C30.0794221,21.7346381 30.0794221,9.54799915 30.0794221,9.54799915 C30.0794221,8.11677538 29.8182125,6.79917671 28.4894574,6.42616286 C27.4718816,6.09676281 26.8404372,7.05167726 26.8404372,8.48175338 C26.8404372,8.48175338 26.8404372,39 26.8404372,39 C26.8404372,39 18.6964184,36.3877582 18.6964184,36.3877582 C18.6964184,36.3877582 18.6964184,0 18.6964184,0 C22.1591313,0.649618385 27.2038564,2.18528604 29.9158817,3.10921264 C36.8129171,5.50223626 39.1512984,8.48060726 39.1512984,15.1914074 C39.1512984,21.7323428 35.1559474,24.2114479 30.0794221,21.7346381 L30.0794221,21.7346381 Z M3.75303136,33.1809889 C-0.191213964,32.0585062 -0.847641772,29.7194242 0.950152718,28.3719845 C2.61166493,27.1278411 5.43725714,26.1912896 5.43725714,26.1912896 C5.43725714,26.1912896 17.1144032,21.9951737 17.1144032,21.9951737 C17.1144032,21.9951737 17.1144032,26.7789292 17.1144032,26.7789292 C17.1144032,26.7789292 8.71144632,29.8181293 8.71144632,29.8181293 C7.22710186,30.3564151 6.99882837,31.1185119 8.20492939,31.5179235 C9.41216602,31.9173326 11.5972304,31.8037083 13.0838464,31.2642741 C13.0838464,31.2642741 17.1144032,29.7859915 17.1144032,29.7859915 C17.1144032,29.7859915 17.1144032,34.0658923 17.1144032,34.0658923 C16.8588747,34.1118009 16.5738164,34.1577095 16.3103366,34.2024722 C12.2786433,34.8681582 7.98460591,34.5904073 3.75303136,33.1809889 L3.75303136,33.1809889 Z"></path></svg>`,

    /** @license
     * Microsoft (c) 2022. All rights reserved.
     *
     * @see https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks
     *
     * 2022-09-16 11:07 CST
     * <blockquote>
     * Without a license arrangement with Microsoft, everything about your app (including developer name, app name, logo, description,
     * screenshots, and other app collateral) must be unique to you and free of Microsoft’s Brand Assets. The only exception is that
     * you may truthfully state whether your app is compatible or interoperable with a Microsoft product or service within the text
     * description about your app. If your app is integrated with a Microsoft technology, follow the guidelines for partner-led marketing
     * under the Resources section below.
     *
     * You may not use Microsoft’s Brand Assets in a manner that implies Microsoft published, developed, endorsed, is affiliated with,
     * or is otherwise connected with your app. Furthermore, Microsoft’s logos, designs, and icons can never be used as your app icon
     * and can only be used in your app advertisements with a license agreement in place.
     * </blockquote>
     *
     * @prop {string<SVG>} store_xbox
     */
    store_xbox: `<svg fill="#107c10" width="15px" height="15px" viewBox="0 0 20 20" x="0px" y="0px"><path d="M9.0027791,19.9588749 C7.4621998,19.8114068 5.90246041,19.2584485 4.56258274,18.3847375 C3.43980533,17.6525944 3.18625685,17.3516223 3.18625685,16.7509849 C3.18625685,15.5444964 4.51354057,13.4313578 6.7844422,11.0223951 C8.074158,9.65427004 9.87064637,8.05062645 10.0649315,8.09405204 C10.442563,8.17845865 13.4621321,11.1222134 14.5925223,12.5079651 C16.3800416,14.6992941 17.2018184,16.4935136 16.7843311,17.2934361 C16.4669732,17.9015068 14.4977644,19.0899655 13.0510508,19.5465485 C11.8586913,19.9228567 10.2927393,20.0823525 9.0027791,19.9588749 L9.0027791,19.9588749 Z M1.66981709,15.4965825 C0.736813763,14.0660144 0.265429819,12.6576379 0.0378427367,10.6206529 C-0.0373070687,9.94803274 -0.0103772732,9.56330204 0.208488334,8.18273216 C0.481273171,6.46204625 1.46171072,4.47143718 2.63979832,3.24637542 C3.14155487,2.7246126 3.18636696,2.7119004 3.79797498,2.91782316 C4.54069984,3.16789165 5.33387053,3.71538307 6.56396633,4.82706661 L7.28167204,5.47568469 L6.88975351,5.95689584 C5.07045494,8.19069412 3.14992454,11.3570266 2.42613509,13.315957 C2.03265416,14.3809096 1.87394836,15.4499189 2.04325173,15.8949766 C2.15755687,16.1954559 2.05256456,16.0834461 1.66981709,15.4965825 Z M18.0469082,15.7398933 C18.1390778,15.2901993 18.0225023,14.4643 17.7492835,13.6313112 C17.1575751,11.8273159 15.1798033,8.47128837 13.3636881,6.18951535 L12.7919788,5.47121735 L13.4104988,4.90359188 C14.2181031,4.16244082 14.7788228,3.71865116 15.3838277,3.34177567 C15.8612481,3.04437576 16.5434911,2.78110363 16.8367513,2.78110363 C17.017554,2.78110363 17.6540729,3.44130886 18.167918,4.16180616 C18.9637566,5.27770674 19.5492292,6.63042298 19.8458511,8.03861539 C20.0375071,8.94849392 20.0534789,10.8961111 19.876727,11.8037505 C19.7316728,12.5486154 19.4253921,13.5148169 19.126604,14.1701041 C18.9027272,14.6610991 18.3459139,15.6146776 18.1019033,15.9249686 C17.9764527,16.0844945 17.9763496,16.0841466 18.0469077,15.7398933 L18.0469082,15.7398933 Z M9.16772657,2.4404507 C8.32976735,2.01515552 7.03706147,1.55862769 6.32296567,1.43580364 C6.07262367,1.392745 5.64557543,1.3687309 5.37396955,1.38243882 C4.78478865,1.41217476 4.81110404,1.38138131 5.75627016,0.935081155 C6.54206384,0.564035241 7.19752416,0.345843529 8.08731971,0.159113747 C9.0882751,-0.0509437592 10.9697133,-0.053408942 11.9547318,0.154046281 C13.0186345,0.378115503 14.2714154,0.84406362 14.9773435,1.27824996 L15.1871536,1.40729464 L14.7057768,1.38299957 C13.7491958,1.3347209 12.3551064,1.72096728 10.8583654,2.4489635 C10.4069102,2.66854598 10.0141538,2.84392045 9.98557347,2.83868437 C9.95699367,2.83344835 9.58896282,2.65424311 9.16772657,2.44045053 L9.16772657,2.4404507 Z"></path></svg>`,

    /** @license
     * Nintendo (r) 2022. All rights reserved.
     *
     * @see https://www.nintendo.com/terms-of-use/
     *
     * 2022-11-22 11:26 CST
     *<blockquote>
     * 6. Acceptable Use of the Services
     * You agree that your use of the Services, including the posting of User Content, will not violate any law, contract,
     * intellectual property or other third-party right or constitute a criminal action or tort, and that you are solely responsible
     * for your conduct while on the Services. You further agree not to:
     * ...
     * Use any robot, iframe, spider, crawler, scraper or other automated means or interface not provided by us to access the Services,
     * including, without limitation, for the purpose of copying, extracting, aggregating, displaying, publishing or distributing any
     * content or data made available via Services.
     * </blockquote>
     *
     * @prop {string<SVG>} store_nintendo
     */
    store_nintendo: `<svg fill="#ffffff" viewBox="0 0 20 20" width="15px" height="15px" x="0px" y="0px"><g transform="matrix(1 0 0 -1 0 20)"><path d="M4.28175649,19.9337446 C2.28954389,19.5776216 0.686661816,18.1034382 0.181360487,16.1654667 C-0.000879336242,15.4656437 -0.0133047787,15.0556882 0.0074042921,9.62688343 C0.0198297346,4.64116196 0.0239715487,4.52521494 0.106807832,4.14010522 C0.566549204,2.06548191 2.04103504,0.58715751 4.13679302,0.0985236743 C4.41015273,0.0364092037 4.75806514,0.0239863096 6.99878661,0.0115634156 C9.31820253,-0.00500044322 9.55842776,-0.000859478543 9.62055498,0.0612549918 C9.68268216,0.123369462 9.686824,0.922575649 9.686824,9.98300641 C9.686824,16.6996511 9.67439853,19.8633482 9.64540584,19.9213217 C9.60398771,19.995859 9.53357686,20 7.10647376,19.995859 C5.13497024,19.9917181 4.54269082,19.9792952 4.28175649,19.9337446 Z M8.03009833,9.99542931 L8.03009833,1.60583482 L6.34437996,1.62653964 C4.79119963,1.64310351 4.6255271,1.65138544 4.31489102,1.73006376 C2.98122686,2.07376383 1.99133328,3.10072308 1.71383173,4.43825469 C1.62271182,4.85649212 1.62271182,15.1592123 1.70968991,15.5691678 C1.95819876,16.7327789 2.76585252,17.6976236 3.85514965,18.1324249 C4.4018691,18.351896 4.6545198,18.3767418 6.42721624,18.3808828 L8.03009833,18.3850238 L8.03009833,9.99542931 Z"></path><path d="M4.63795253 15.8548943C4.37701824 15.8052028 3.97940407 15.6064364 3.76817155 15.4200931 3.33328107 15.0432653 3.11790673 14.5090808 3.15104124 13.8796542 3.1676085 13.552518 3.18831757 13.4655577 3.32085562 13.200536 3.51552089 12.7988624 3.80958969 12.5048539 4.21134567 12.3060876 4.48884722 12.1694358 4.55925804 12.1528719 4.91959588 12.140449 5.24679922 12.1280261 5.36277 12.140449 5.58228616 12.2149864 6.48105984 12.5172768 7.02363747 13.3910203 6.87039037 14.2854687 6.69229237 15.3496967 5.68168971 16.0619426 4.63795253 15.8548943zM11.7038875 19.9710133C11.6873202 19.9585904 11.6748948 15.4697846 11.6748948 9.99542931 11.6748948.963985294 11.6790366.048832098 11.7411638.0239863096 11.8529928-.0174233373 15.0670406-.000859478533 15.4646547.0405501684 17.1462313.231034544 18.6290008 1.25385282 19.4366545 2.77358687 19.5401999 2.96821221 19.6768798 3.29534842 19.7472906 3.49825569 20.0082249 4.27675706 20 4.06970882 20 10.0202751 20 14.7699616 19.9916576 15.4780666 19.9336722 15.780357 19.5236326 17.9377996 17.8793324 19.5651987 15.7173054 19.9378855 15.4273784 19.9875771 14.9800625 20 13.5387111 20 12.5446758 20 11.7163129 19.9875771 11.7038875 19.9710133zM16.127345 10.9519921C16.773468 10.7822126 17.3036202 10.2894378 17.5189946 9.66001114 17.6556744 9.27076049 17.6515326 8.69930735 17.5148527 8.34318437 17.2622021 7.68891196 16.7651844 7.2292649 16.127345 7.05948535 15.0918915 6.79032261 13.9901689 7.41560829 13.6878164 8.44256755 13.5966966 8.75728086 13.6008384 9.28732433 13.7043837 9.61031959 14.0150198 10.6248559 15.0918915 11.2211549 16.127345 10.9519921z"></path></g></svg>`,

    /** @license
     * The Chromium Authors (c) 2015. All rights reserved.
     * "Exit Picture in Picture," and "Picture in Picture" by The Chromium Authors
     *
     * @prop {string<SVG>} exit_picture_in_picture
     * @prop {string<SVG>} picture_in_picture
     */
    exit_picture_in_picture: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 22 18" x="0px" y="0px"><g fill="none" fill-rule="evenodd" opacity=".87"><path d="M18 4H4v10h14V4zm4 12V1.98C22 .88 21.1 0 20 0H2C.9 0 0 .88 0 1.98V16c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H2V1.97h18v14.05z" fill="currentcolor" fill-rule="nonzero"/><path d="M-1-3h24v24H-1z"/></g></svg>`,
    picture_in_picture:      `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 24 24" x="0px" y="0px"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/><path fill="none" d="M0 0h24v24H0V0z"/></svg>`,

    /** @license
     * Licensed under the Creative Commons license
     * "Mouse Left Click," "Mouse Right Click," and "Mouse" by Icon Solid from the Noun Project
     *
     * @prop {string<SVG>} primary_mouse_button
     * @prop {string<SVG>} secondary_mouse_button
     * @prop {string<SVG>} mouse
     */
    primary_mouse_button:   `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 16 16" x="0px" y="0px"><g><path d="M7.5,14.5L7.5,14.5   c-2.209,0-4-1.791-4-4V4c0-1.381,1.119-2.5,2.5-2.5h3c1.381,0,2.5,1.119,2.5,2.5v6.5C11.5,12.709,9.709,14.5,7.5,14.5z" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></path><line x1="7.5" y1="5.5" x2="3.5" y2="5.5" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></line><line x1="7.5" y1="1.5" x2="7.5" y2="5.5" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></line></g></svg>`,
    secondary_mouse_button: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 16 16" x="0px" y="0px"><g><path d="M7.5,14.5L7.5,14.5   c2.209,0,4-1.791,4-4V4c0-1.381-1.119-2.5-2.5-2.5H6C4.619,1.5,3.5,2.619,3.5,4v6.5C3.5,12.709,5.291,14.5,7.5,14.5z" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></path><line x1="11.5" y1="5.5" x2="7.5" y2="5.5" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></line><line x1="7.5" y1="1.5" x2="7.5" y2="5.5" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></line></g></svg>`,
    mouse:                  `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 16 16" x="0px" y="0px"><g><path d="M7.5,14.5L7.5,14.5   c-2.209,0-4-1.791-4-4V4c0-1.381,1.119-2.5,2.5-2.5h3c1.381,0,2.5,1.119,2.5,2.5v6.5C11.5,12.709,9.709,14.5,7.5,14.5z" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></path><line x1="3.5" y1="5.5" x2="11.5" y2="5.5" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></line><line x1="7.5" y1="1.5" x2="7.5" y2="5.5" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"></line></g></svg>`,

    bonuschannelpoints: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16.503 3.257L18 7v11H2V7l1.497-3.743A2 2 0 015.354 2h9.292a2 2 0 011.857 1.257zM5.354 4h9.292l1.2 3H4.154l1.2-3zM4 9v7h12V9h-3v4H7V9H4zm7 0v2H9V9h2z" clip-rule="evenodd"></path></g></svg>`,

    add_to_calendar: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M11 8H9v2H7v2h2v2h2v-2h2v-2h-2V8z"></path><path fill-rule="evenodd" d="M5 2h2v1h6V2h2v1h1a2 2 0 012 2v11a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h1V2zM4 6v10h12V6H4z" clip-rule="evenodd"></path></g></svg>`,
    more_horizontal: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M2 10a2 2 0 114 0 2 2 0 01-4 0zM8 10a2 2 0 114 0 2 2 0 01-4 0zM16 8a2 2 0 100 4 2 2 0 000-4z"></path></g></svg>`,

    more_vertical: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 18a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM8 4a2 2 0 104 0 2 2 0 00-4 0z"></path></g></svg>`,
    channelpoints: `<svg fill="#9147ff"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>`,

    button_2to1_transparent: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M2 15V5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2zm2 0V5h7v10H4zm9 0h3V5h-3v10z" fill-rule="evenodd" clip-rule="evenodd"></path></g></svg>`,
    button_2to1_opaque: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h7V3H4zM16 3h-3v14h3a2 2 0 002-2V5a2 2 0 00-2-2z"></path></g></svg>`,

    add_person: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M15 7V5h-2V3h2V1h2v2h2v2h-2v2h-2Z"></path><path d="M10 2c.339 0 .672.021 1 .062v2.021A6 6 0 1 0 15.917 9h2.021A8 8 0 1 1 10 2Z"></path><path d="M12 10a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm-5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm5 1a2 2 0 1 1-4 0h4Z"></path></svg>`,
    extensions: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M4 16h11a1 1 0 001-1V7h-5V5.5a1.5 1.5 0 00-3 0V7H4v1.035a3.5 3.5 0 010 6.93V16zM2 5v5h1.5a1.5 1.5 0 010 3H2v5h13c1.5 0 3-1.5 3-3V5h-5a3 3 0 00-3-3H9a3 3 0 00-3 3H2z" clip-rule="evenodd"></path></g></svg>`,
    navigation: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M17 7H3V5h14v2zM17 11H3V9h14v2zM3 15h14v-2H3v2z"></path></g></svg>`,

    checkmark: `<svg fill="#22fa7c"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 10l5 5 8-8-1.5-1.5L9 12 5.5 8.5 4 10z"></path></g></svg>`,
    translate: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 27 26" x="0px" y="0px"><path d="M20.859 9.2L26.787 26h-3.822l-1.214-3.983h-6.1L14.439 26h-3.822l5.905-16.8h4.338zm-2.152 2.598c-.252.975-.973 3.39-2.163 7.244h4.36L19.01 12.92c-.14-.474-.242-.847-.303-1.122zM9.622 0a5.153 5.153 0 00-.1 1.021v1.021h3.987c.81.01 1.621-.03 2.428-.117v3.029c-.737-.067-1.39-.1-2.376-.1a13.167 13.167 0 01-1.145 3.232c-.497.98-1.121 1.891-1.857 2.707a14.381 14.381 0 003.14 1.387l-1.062 3.022a19.389 19.389 0 01-4.37-2.351 21.456 21.456 0 01-6.661 3.079A9.699 9.699 0 000 12.968a18.235 18.235 0 005.94-2.191 14.565 14.565 0 01-2.158-3.062c-.484-.911-.871-1.87-1.155-2.862-.988 0-1.556.034-2.393.1V1.926c.806.087 1.616.126 2.426.117H6.36V1.038A5.08 5.08 0 006.259 0zm.652 4.853H5.84a9.543 9.543 0 002.342 4.049 9.434 9.434 0 002.092-4.049z" fill-rule="nonzero"></path></svg>`,
    incognito: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 120 120" x="0px" y="0px"><g fill="none" fill-rule="evenodd"><path d="M0 0h120v120H0z"/><path fill="#dadce0" d="M60 0c33.137 0 60 26.863 60 60s-26.863 60-60 60S0 93.137 0 60 26.863 0 60 0zm17.5 64.837c-6.456 0-11.822 4.502-13.222 10.516-3.267-1.397-6.3-1.009-8.556-.039C54.283 69.3 48.917 64.837 42.5 64.837c-7.506 0-13.611 6.092-13.611 13.582C28.889 85.908 34.994 92 42.5 92c7.156 0 12.95-5.51 13.494-12.495 1.167-.815 4.24-2.328 8.012.078C64.628 86.529 70.383 92 77.5 92c7.506 0 13.611-6.092 13.611-13.581 0-7.49-6.105-13.582-13.611-13.582zm-35 3.88c5.367 0 9.722 4.347 9.722 9.702 0 5.355-4.355 9.7-9.722 9.7-5.367 0-9.722-4.345-9.722-9.7 0-5.355 4.355-9.701 9.722-9.701zm35 0c5.367 0 9.722 4.347 9.722 9.702 0 5.355-4.355 9.7-9.722 9.7-5.367 0-9.722-4.345-9.722-9.7 0-5.355 4.355-9.701 9.722-9.701zM95 57H25v4h70v-4zM72.874 29.34c-.8-1.82-2.866-2.78-4.785-2.143L60 29.914l-8.128-2.717-.192-.058c-1.928-.533-3.954.51-4.669 2.387L38.144 53h43.712L72.95 29.526z"/></g></svg>`,
    highlight: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 2V4H16V2H18V6.28078L17.0299 6.52331C15.2492 6.96848 14 8.56841 14 10.4039V15.7808L6 17.7808V10.4039C6 8.56841 4.75081 6.96848 2.97014 6.52331L2 6.28078V2H4ZM8 12V15.2192L12 14.2192V12H8ZM6.07534 6H13.9247C12.823 7.02027 12.118 8.44067 12.0135 10H7.98651C7.88205 8.44067 7.17701 7.02027 6.07534 6Z"></path></svg>`,

    calendar: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8 9v2H6V9h2z"></path><path fill-rule="evenodd" d="M5 2h2v1h6V2h2v1h1a2 2 0 012 2v11a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h1V2zm11 5H4v9h12V7z" clip-rule="evenodd"></path></g></svg>`,
    collapse: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M14 7h-2v6h2V7z"></path><path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 0h12v10H4V5z" clip-rule="evenodd"></path></g></svg>`,
    download: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9 10L6.5 7.5 5 9l5 5 5-5-1.5-1.5L11 10V2H9v8zM2 18v-2h16v2H2z"></path></g></svg>`,
    favorite: `<svg fill="#bb1411"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9.171 4.171A4 4 0 006.343 3H6a4 4 0 00-4 4v.343a4 4 0 001.172 2.829L10 17l6.828-6.828A4 4 0 0018 7.343V7a4 4 0 00-4-4h-.343a4 4 0 00-2.829 1.172L10 5l-.829-.829z" fill-rule="evenodd" clip-rule="evenodd"></path></g></svg>`,
    ne_arrow: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M6 8h5.293L5 14.293l1.414 1.414 6.293-6.293V15h2V6H6v2z"></path></g></svg>`,
    streamer: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M7 2a4 4 0 00-1.015 7.87c-.098.64-.651 1.13-1.318 1.13A2.667 2.667 0 002 13.667V18h2v-4.333c0-.368.298-.667.667-.667.908 0 1.732-.363 2.333-.953.601.59 1.425.953 2.333.953.369 0 .667.299.667.667V18h2v-4.333A2.667 2.667 0 009.333 11c-.667 0-1.22-.49-1.318-1.13A4.002 4.002 0 007 2zM5 6a2 2 0 104 0 2 2 0 00-4 0z" clip-rule="evenodd"></path><path d="M12 8h4v1.51V9l2-1v4l-2-1v1h-4V8z"></path></g></svg>`,
    verified: `<svg fill="#9147ff"      width="100%" height="100%" version="1.1" viewBox="0 0 16 16" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.5 3.5L8 2L3.5 3.5L2 8L3.5 12.5L8 14L12.5 12.5L14 8L12.5 3.5ZM7.00008 11L11.5 6.5L10 5L7.00008 8L5.5 6.5L4 8L7.00008 11Z"></path></svg>`,

    battery: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M10.114 9.622 11 7 7.175 9.323a.382.382 0 0 0 .013.65l.698.405L7 13l3.825-2.323a.382.382 0 0 0-.012-.65l-.699-.405z"></path><path fill-rule="evenodd" d="M18 7h-2V4H2v12h14v-3h2V7zm-4-1v3h2v2h-2v3H4V6h10z" clip-rule="evenodd"></path></svg>`,
    compass: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M8.949 7.684L14 6l-1.684 5.051a2 2 0 01-1.265 1.265L6 14l1.684-5.051a2 2 0 011.265-1.265zM11 10a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>`,
    dislike: `<svg fill="#bb1411"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9.188 4.188L9.17 4.17A4 4 0 006.343 3H6a4 4 0 00-4 4v.343a4 4 0 001.172 2.829l5.367 5.367L10.484 11H6.538l2.65-6.812z"></path><path d="M10.154 16.846l6.674-6.674A4 4 0 0018 7.343V7a4 4 0 00-4-4h-.343a4 4 0 00-2.091.59L9.462 9h4.055l-3.363 7.846z"></path></g></svg>`,
    dropper: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" d="M16.908 8.364 14.272 11l-.636-.636L9 15l-4 3-3-3 3-4 4.636-4.636L9 5.728l2.636-2.636a3.728 3.728 0 0 1 5.272 5.272zm-5.858-.586-4.535 4.536-1.874 2.498.547.547 2.498-1.874 4.536-4.535-1.172-1.172z" clip-rule="evenodd"></path></svg>`,
    predict: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M3 9c0-.621.08-1.223.233-1.796l1.122.441.654 1.663a5 5 0 105.3-5.299l-1.664-.654-.441-1.122a7 7 0 015.014 12.985L14 16a2 2 0 012 2H4a2 2 0 012-2l.782-.782A7 7 0 013 9z"></path><path d="M7.489 4.511L10 5.5l-2.511.989L6.5 9l-.989-2.511L3 5.5l2.511-.989L6.5 2l.989 2.511zM12 9l-1.435-.565L10 7l-.565 1.435L8 9l1.435.565L10 11l.565-1.435L12 9z"></path></g></svg>`,
    refresh: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 10a6 6 0 0110.472-4H13v2h5V3h-2v1.708A8 8 0 002 10h2zM7 14H5.528A6 6 0 0016 10h2a8 8 0 01-14 5.292V17H2v-5h5v2z"></path></g></svg>`,
    station: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M15 9a4.977 4.977 0 01-1 3l.722 2.167a7 7 0 10-9.445 0L6 12a5 5 0 119-3z"></path><path d="M13 9c0 .981-.471 1.853-1.2 2.4L14 18h-2l-2-6-2 6H6l2.2-6.6A3 3 0 1113 9z"></path></svg>`,

    emotes: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 11a1 1 0 100-2 1 1 0 000 2zM14 10a1 1 0 11-2 0 1 1 0 012 0zM10 14a2 2 0 002-2H8a2 2 0 002 2z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></g></svg>`,
    expand: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M14 7h-4v6h4V7z"></path><path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 0h12v10H4V5z" clip-rule="evenodd"></path></g></svg>`,
    export: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M2 16v-3h2v3h12v-3h2v3a2 2 0 01-2 2H4a2 2 0 01-2-2zM15 7l-1.5 1.5L11 6v7H9V6L6.5 8.5 5 7l5-5 5 5z"></path></g></svg>`,
    ignore: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M16.5 18l1.5-1.5-2.5-2.5H17v-2c-1-.5-1.75-1-2-2-.095-.38-.154-.905-.221-1.506C14.49 5.936 14.048 2 10 2 7.832 2 6.698 3.128 6.068 4.568L3.5 2 2 3.5 16.5 18zm-3-6h.268a4.262 4.262 0 01-.708-1.515c-.131-.524-.212-1.25-.282-1.875-.018-.164-.035-.32-.053-.465-.098-.819-.222-1.599-.442-2.283-.22-.686-.493-1.132-.796-1.402C11.23 4.228 10.813 4 10 4c-.813 0-1.229.228-1.487.46-.303.27-.576.716-.796 1.402-.03.09-.056.18-.082.273L13.5 12z" fill-rule="evenodd" clip-rule="evenodd"></path><path d="M6.697 11.197c-.13.298-.289.564-.465.803H7.5l2 2H3v-2c1-.5 1.75-1 2-2 .031-.124.058-.264.083-.417l1.614 1.614zM11.5 16H7.997a2 2 0 003.95.448l-.449-.449z"></path></g></svg>`,
    inform: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M17 14v-2c-1-.5-1.75-1-2-2-.095-.38-.154-.905-.221-1.506C14.49 5.936 14.049 2 10 2 5.95 2 5.509 5.936 5.221 8.494 5.154 9.095 5.095 9.62 5 10c-.25 1-1 1.5-2 2v2h14zm-9.002 2h4-4zm4 0v.012V16zm-5.766-4h7.536a4.262 4.262 0 01-.708-1.515c-.129-.513-.2-1.154-.26-1.684a32.48 32.48 0 00-.009-.083c-.152-1.355-.314-2.606-.78-3.535-.21-.423-.447-.692-.703-.862C11.063 4.158 10.673 4 10 4s-1.063.158-1.308.32c-.256.171-.492.44-.704.863-.465.929-.627 2.18-.78 3.535L7.2 8.8c-.06.53-.131 1.171-.26 1.684-.15.603-.402 1.1-.708 1.515zm1.766 4a2.001 2.001 0 004 .012" clip-rule="evenodd"></path></g></svg>`,
    latest: `<svg fill="#e6cb00"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M13.39 4.305L12 5l1.404.702a2 2 0 01.894.894L15 8l.702-1.404a2 2 0 01.894-.894L18 5l-1.418-.709a2 2 0 01-.881-.869L14.964 2l-.668 1.385a2 2 0 01-.907.92z"></path><path fill-rule="evenodd" d="M5.404 9.298a2 2 0 00.894-.894L8 5h1l1.702 3.404a2 2 0 00.894.894L15 11v1l-3.404 1.702a2 2 0 00-.894.894L9 18H8l-1.702-3.404a2 2 0 00-.894-.894L2 12v-1l3.404-1.702zm2.683 0l.413-.826.413.826a4 4 0 001.789 1.789l.826.413-.826.413a4 4 0 00-1.789 1.789l-.413.826-.413-.826a4 4 0 00-1.789-1.789l-.826-.413.826-.413a4 4 0 001.789-1.789z" clip-rule="evenodd"></path></g></svg>`,
    notify: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M3 14v-2c1-.5 1.75-1 2-2 .095-.38.154-.905.221-1.506C5.51 5.936 5.951 2 10 2c4.05 0 4.491 3.936 4.779 6.494.067.601.126 1.126.221 1.506.25 1 1 1.5 2 2v2H3zM9.998 18a2 2 0 01-2-2h4v.012a2 2 0 01-2 1.988z"></path></g></svg>`,
    people: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M7 2a4 4 0 00-1.015 7.87c-.098.64-.651 1.13-1.318 1.13A2.667 2.667 0 002 13.667V18h2v-4.333c0-.368.298-.667.667-.667.908 0 1.732-.363 2.333-.953.601.59 1.425.953 2.333.953.369 0 .667.299.667.667V18h2v-4.333A2.667 2.667 0 009.333 11c-.667 0-1.22-.49-1.318-1.13A4.002 4.002 0 007 2zM5 6a2 2 0 104 0 2 2 0 00-4 0z" clip-rule="evenodd"></path><path d="M14 11.83V18h4v-3.75c0-.69-.56-1.25-1.25-1.25a.75.75 0 01-.75-.75v-.42a3.001 3.001 0 10-2 0z"></path></g></svg>`,
    pinned: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M4.941 2h10v2H13v3a3 3 0 013 3v3H4v-3a3 3 0 013-3V4H4.941V2zM9 9H7a1 1 0 00-1 1v1h8v-1a1 1 0 00-1-1h-2V4H9v5z" clip-rule="evenodd"></path><path d="M10.999 15h-2v3h2v-3z"></path></g></svg>`,
    popout: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 4h2.586L9.293 9.293l1.414 1.414L16 5.414V8h2V2h-6v2z"></path><path d="M4 4h6v2H4v10h10v-6h2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"></path></g></svg>`,
    rewind: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M5.757 14.243A6 6 0 105.527 6H7v2H2V3h2v1.708a8 8 0 11.343 10.949l1.414-1.414z"></path><path d="M11 10.414l1.707-1.707-1.414-1.414L9 9.586V14h2v-3.586z"></path></g></svg>`,
    ribbon: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="m3 8 3-6h8l3 6-3.355 4.194L18 18h-7l-1-1.25L9 18H2l4.355-5.806L3 8Zm4.236-4-1 2h7.528l-1-2H7.236ZM8 8l.75 1-1.156 1.541L5.561 8H8Zm3.28 7.15.681.85H14l-1.645-2.194-1.074 1.343ZM6 16l6-8h2.439l-6.4 8H6Z" clip-rule="evenodd"></path></g></svg>`,
    rocket: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M13 6a1 1 0 100 2 1 1 0 000-2z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6 8l3.657-3.657A8 8 0 0115.314 2H18v2.686a8 8 0 01-2.343 5.657L12 14v2a2 2 0 01-2 2H9v-3l-4-4H2v-1a2 2 0 012-2h2zm4 5.172l4.243-4.243A6 6 0 0016 4.686V4h-.686a6 6 0 00-4.243 1.757L6.828 10 10 13.172z"></path><path d="M4 18a2 2 0 10-2-2v2h2z"></path></g></svg>`,
    search: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M13.192 14.606a7 7 0 111.414-1.414l3.101 3.1-1.414 1.415-3.1-3.1zM14 9A5 5 0 114 9a5 5 0 0110 0z" clip-rule="evenodd"></path></g></svg>`,
    stream: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9 8l3 2-3 2V8z"></path><path fill-rule="evenodd" d="M4 2H2v16h2v-2h12v2h2V2h-2v2H4V2zm12 4H4v8h12V6z" clip-rule="evenodd"></path></g></svg>`,
    thread: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M5 6H7V8H5V6Z"></path><path d="M9 6H11V8H9V6Z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M8 14L10 12H13C13.5523 12 14 11.5523 14 11V3C14 2.44772 13.5523 2 13 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H6L8 14ZM6.82843 10H4V4H12V10H9.17157L8 11.1716L6.82843 10Z"></path></g></svg>`,
    trophy: `<svg fill="#ff9147"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M5 10h.1A5.006 5.006 0 009 13.9V16H7v2h6v-2h-2v-2.1a5.006 5.006 0 003.9-3.9h.1a3 3 0 003-3V4h-3V2H5v2H2v3a3 3 0 003 3zm2-6h6v5a3 3 0 11-6 0V4zm8 2v2a1 1 0 001-1V6h-1zM4 6h1v2a1 1 0 01-1-1V6z"></path></g></svg>`,
    twitch: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 30 34" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M27.4994 15.3919L22.5006 20.1262H17.4994L13.1233 24.2708V20.1262H7.49939V2.36833H27.4994V15.3919ZM6.24909 0L0 5.91853V27.2289H7.49939V33.1475L13.7485 27.2289H18.7497L30 16.5737V0H6.24909ZM23.7509 6.69873H21.2502V13.8008H23.7509V6.69873ZM14.3766 6.6709H16.8773V13.7739H14.3766V6.6709Z"></path></svg>`,
    unmute: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M5 7l4.146-4.146a.5.5 0 01.854.353v13.586a.5.5 0 01-.854.353L5 13H4a2 2 0 01-2-2V9a2 2 0 012-2h1zM12 8.414L13.414 7l1.623 1.623L16.66 7l1.414 1.414-1.623 1.623 1.623 1.623-1.414 1.414-1.623-1.623-1.623 1.623L12 11.66l1.623-1.623L12 8.414z"></path></svg>`,
    unread: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M18 7v9a2 2 0 01-2 2H4a2 2 0 01-2-2V7l8-5 8 5zM4 9.943V16h12V9.943l-4.256 3.04a3 3 0 01-3.488 0L4 9.943zm6-5.584L4.465 7.818l4.954 3.538a1 1 0 001.162 0l4.954-3.538L10 4.358z" clip-rule="evenodd"></path></g></svg>`,
    upload: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M2 16h16v2H2v-2zM9 14V6L6.5 8.5 5 7l5-5 5 5-1.5 1.5L11 6v8H9z"></path></g></svg>`,
    wallet: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 11h2v2h-2v-2z"></path><path fill-rule="evenodd" d="M13.45 2.078L2 6v12h14a2 2 0 002-2V8a2 2 0 00-2-2V4.001a2 2 0 00-2.55-1.923zM14 6V4.004L8.172 6H14zM4 8v8h12V8H4z" clip-rule="evenodd"></path></g></svg>`,

    audio: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 40 40" x="0px" y="0px"><path d="M24.7176 14.7667L22.1946 22.0049L22.2541 7.00546L19.3848 7L15.6102 19.5662V14.7503L12.9566 14.7325L8.58734 19.5034H5V22.4951H9.6644L12.3166 19.6563L12.318 28.0511L15.3988 27.9951L19.0854 17.3679V32L22.037 31.9959L24.6041 23.1737L24.5729 23.1765V27.9514L27.2279 27.9692L31.3318 23.1997H35V20.3828H30.4165L27.682 23.2611V14.7503L24.7219 14.7708L24.7176 14.7667Z"/></svg>`,
    alert: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M11 14l7 4V2l-7 4H4a2 2 0 00-2 2v4a2 2 0 002 2h2v4h2v-4h3zm1-6.268l4-2.286v9.108l-4-2.286V7.732zM10 12H4V8h6v4z"></path></svg>`,
    cheer: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px" preserveAspectRatio="xMidYMid meet"><path fill-rule="evenodd" d="M8 2h4c3.314 0 6 3.582 6 8s-2.686 8-6 8H8c-3.314 0-6-3.582-6-8s2.686-8 6-8zm0 14c-.886 0-1.841-.474-2.643-1.543S4 11.818 4 10s.555-3.387 1.357-4.457S7.114 4 8 4s1.841.474 2.643 1.543S12 8.182 12 10s-.555 3.387-1.357 4.457S8.886 16 8 16zm3.969 0c.259-.305.499-.64.715-1h1.489c-.691.688-1.454 1-2.173 1-.01 0-.021 0-.031 0zm1.595-3h1.883a7.88 7.88 0 0 0 .496-2h-1.989a10.15 10.15 0 0 1-.39 2zm.39-4h1.989c-.084-.726-.257-1.399-.496-2h-1.883a10.15 10.15 0 0 1 .39 2zm-1.27-4h1.489c-.691-.688-1.454-1-2.173-1h-.031c.259.305.499.64.715 1z"></path></svg>`,
    close: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M4 16V4H2v12h2zM13 15l-1.5-1.5L14 11H6V9h8l-2.5-2.5L13 5l5 5-5 5z"></path></g></svg>`,
    crown: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M13.798 10.456L10 6.657l-3.798 3.799L4 8.805V13h12V8.805l-2.202 1.65zM18 5v8a2 2 0 0 1-2 2H4a2.002 2.002 0 0 1-2-2V5l4 3 4-4 4 4 4-3z"></path></g></svg>`,
    error: `<svg fill="#bb1411"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M2 10a8 8 0 1016 0 8 8 0 00-16 0zm12 1V9H6v2h8z" clip-rule="evenodd"></path></g></svg>`,
    globe: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M10 2c4.415 0 8 3.585 8 8s-3.585 8-8 8-8-3.585-8-8 3.585-8 8-8zm5.917 9a6.015 6.015 0 01-3.584 4.529A10 10 0 0013.95 11h1.967zm0-2a6.015 6.015 0 00-3.584-4.529A10 10 0 0113.95 9h1.967zm-3.98 0A8.002 8.002 0 0010 4.708 8.002 8.002 0 008.063 9h3.874zm-3.874 2A8.002 8.002 0 0010 15.292 8.002 8.002 0 0011.937 11H8.063zM6.05 11a10 10 0 001.617 4.529A6.014 6.014 0 014.083 11H6.05zm0-2a10 10 0 011.617-4.529A6.014 6.014 0 004.083 9H6.05z" clip-rule="evenodd"></path></g></svg>`,
    ghost: `<svg fill="#53535F"      width="100%" height="100%" version="1.1" viewBox="0 0 30 30" x="0px" y="0px"><g><path fill-rule="nonzero" d="M18.923 13.077a1.923 1.923 0 1 1 3.846 0 1.923 1.923 0 0 1-3.846 0zm-5.385-1.923a1.923 1.923 0 1 1 0 3.846 1.923 1.923 0 0 1 0-3.846zM24.2 24.98l-.758-.621c-.404-.356-.904-.513-1.442-.513-.538 0-1.068.157-1.472.513l-.996.912a3.542 3.542 0 0 1-4.68 0l-1.025-.944c-.405-.356-.905-.48-1.443-.48-.537 0-1.037.124-1.442.48l-.758.653a4.713 4.713 0 0 1-3.108 1.174h-1.23V11.4c0-6.296 5.08-11.4 11.346-11.4 6.267 0 11.346 5.104 11.346 11.4v14.754h-1.23a4.7 4.7 0 0 1-1.462-.234l-.311-.114a4.719 4.719 0 0 1-1.335-.826zm.978-2.68l.668.548V11.4c0-4.823-3.884-8.708-8.654-8.708-4.769 0-8.654 3.885-8.654 8.708v11.443l.639-.55c1.048-.914 2.26-1.14 3.208-1.14.951 0 2.169.228 3.22 1.152l.022.02 1.019.937a.85.85 0 0 0 1.094-.002l1.01-.923c1-.88 2.211-1.183 3.25-1.183 1.062 0 2.211.316 3.178 1.146z"></path></g></svg>`,
    intro: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M18 2v5.646a3 3 0 0 1-1.886 2.785L13 11.677V18h-2v-5.557L5.649 14.45a1 1 0 0 0-.649.936V18H3v-2.614a3 3 0 0 1 1.947-2.809L7 11.807V9.874A4.002 4.002 0 0 1 8 2a4 4 0 0 1 1 7.874v1.183l2.639-.99 3.732-1.493A1 1 0 0 0 16 7.646V2h2ZM8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"></path></svg>`,
    leave: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M16 18h-4a2 2 0 01-2-2v-2h2v2h4V4h-4v2h-2V4a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2z"></path><path d="M7 5l1.5 1.5L6 9h8v2H6l2.5 2.5L7 15l-5-5 5-5z"></path></g></svg>`,
    music: `<svg fill="#9147ff"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M18 4.331a2 2 0 00-2.304-1.977l-9 1.385A2 2 0 005 5.716v7.334A2.5 2.5 0 106.95 16H7V9.692l9-1.385v2.743A2.5 2.5 0 1017.95 14H18V4.33zm-2 0L7 5.716v1.953l9-1.385V4.33z" clip-rule="evenodd"></path></g></svg>`,
    party: `<svg fill="#9147ff"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 4a2 2 0 113.999.071L18 8c-.232.62-.5 1.235-.806 1.836-1.006 1.983-2.403 3.81-4.146 5.128-1.743 1.318-3.88 2.264-6.063 2.738-.661.144-1.326.244-1.985.298L4.189 5.829A2 2 0 013 4zm3.846 11.624l.004.057c.78-.186 1.55-.441 2.288-.758l2.373-7.117-1.84-.657-2.825 8.475zm.941-9.148L6.198 5.91l.297 4.445 1.292-3.878zm5.608 2.003l-1.656 4.966.103-.076c1.396-1.057 2.571-2.544 3.452-4.212l-1.9-.678z"></path></svg>`,
    pause: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8 3H4v14h4V3zM16 3h-4v14h4V3z"></path></g></svg>`,
    reply: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8.5 5.5L7 4L2 9L7 14L8.5 12.5L6 10H10C12.2091 10 14 11.7909 14 14V16H16V14C16 10.6863 13.3137 8 10 8H6L8.5 5.5Z"></path></g></svg>`,
    rerun: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 16a5.98 5.98 0 004.243-1.757l1.414 1.414A8 8 0 1116 4.708V2h2v6h-6V6h2.472A6 6 0 1010 16z"></path></g></svg>`,
    stats: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M7 10h2v4H7v-4zM13 6h-2v8h2V6z"></path><path fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm12 2H4v12h12V4z" clip-rule="evenodd"></path></g></svg>`,
    sword: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M7.812 12.397L16 6.022V4h-2.022l-6.375 8.188.209.21zm-2.27.56l-2.249-2.25 1.414-1.414 1.47 1.47L13 2h5v5l-8.763 6.822 1.47 1.471-1.414 1.414-2.25-2.25L3.5 18 2 16.5l3.543-3.543z"></path></g></svg>`,
    trash: `<svg fill="#bb1411"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M12 2H8v1H3v2h14V3h-5V2zM4 7v9a2 2 0 002 2h8a2 2 0 002-2V7h-2v9H6V7H4z"></path><path d="M11 7H9v7h2V7z"></path></g></svg>`,
    unfav: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.456 8.255L10 5.125l-1.456 3.13-3.49.485 2.552 2.516-.616 3.485L10 13.064l3.01 1.677-.616-3.485 2.553-2.516-3.491-.485zM7.19 6.424l-4.2.583c-.932.13-1.318 1.209-.664 1.853l3.128 3.083-.755 4.272c-.163.92.876 1.603 1.722 1.132L10 15.354l3.579 1.993c.846.47 1.885-.212 1.722-1.132l-.755-4.272 3.128-3.083c.654-.644.268-1.723-.664-1.853l-4.2-.583-1.754-3.77c-.406-.872-1.706-.872-2.112 0L7.19 6.424z"></path></svg>`,
    video: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M12.002 3.999a2 2 0 012 2v2L18 6v8l-3.998-2v2a2 2 0 01-2 1.999h-8a2 2 0 01-2-2V6a2 2 0 012-2h8zM12 6H4v8h8V6z" clip-rule="evenodd"></path></g></svg>`,

    bits: `<svg fill="#9147ff"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M3 12l7-10 7 10-7 6-7-6zm2.678-.338L10 5.487l4.322 6.173-.85.728L10 11l-3.473 1.39-.849-.729z"></path></g></svg>`,
    bolt: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M14.91 2.073L13 9l1.88 1.071a1 1 0 01.036 1.717l-9.825 6.14L7 11 5.12 9.929a1 1 0 01-.035-1.717l9.824-6.14zm-6.784 11.6L9 10 7 9l4.874-2.672L11 10l2 1-4.874 2.673z" clip-rule="evenodd"></path></g></svg>`,
    cake: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M11 2H9v3H4a2 2 0 00-2 2v11h16V7a2 2 0 00-2-2h-5V2zM4 16h12v-3.586l-1-1a1.414 1.414 0 00-2 0l-.586.586a3.414 3.414 0 01-4.828 0L7 11.414a1.414 1.414 0 00-2 0l-1 1V16zm10-7c.723 0 1.422.23 2 .647V7H4v2.647A3.414 3.414 0 018.414 10l.586.586a1.414 1.414 0 002 0l.586-.586c.64-.64 1.509-1 2.414-1z" clip-rule="evenodd"></path></g></svg>`,
    cast: `<svg fill="currentColor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M3 17a1 1 0 0 1-1-1v-1a2 2 0 0 1 2 2H3z"></path><path d="M2 12.5a.5.5 0 0 1 .5-.5A4.5 4.5 0 0 1 7 16.5a.5.5 0 0 1-1 0A3.5 3.5 0 0 0 2.5 13a.5.5 0 0 1-.5-.5z"></path><path d="M2 9.5a.5.5 0 0 1 .5-.5 7.5 7.5 0 0 1 7.5 7.5.5.5 0 0 1-1 0A6.5 6.5 0 0 0 2.5 10a.5.5 0 0 1-.5-.5z"></path><path d="M2 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3.5a1 1 0 1 1 0-2H16V5H4v1.5a1 1 0 0 1-2 0V5z"></path></svg>`,
    clip: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M14.594 4.495l-.585-1.91L15.922 2l.585 1.91-1.913.585zM11.14 3.46l.585 1.911 1.913-.584-.585-1.91-1.913.583zM8.856 6.247l-.584-1.91 1.912-.584.585 1.91-1.913.584zM5.403 5.213l.584 1.91L7.9 6.54l-.585-1.911-1.912.584zM2.534 6.09L3.118 8l1.913-.584-.585-1.91-1.912.583zM5 9H3v7a2 2 0 002 2h10a2 2 0 002-2V9h-2v7H5V9z"></path><path d="M8 9H6v2h2V9zM9 9h2v2H9V9zM14 9h-2v2h2V9z"></path></g></svg>`,
    chat: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M7.828 13L10 15.172 12.172 13H15V5H5v8h2.828zM10 18l-3-3H5a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2l-3 3z" clip-rule="evenodd"></path></g></svg>`,
    flag: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M18 2l-4 6 4 6H4v4H2V2h16zM4 12h10.263l-2.667-4 2.667-4H4v8z" clip-rule="evenodd"></path></g></svg>`,
    game: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M6 8h2v1h1v2H8v1H6v-1H5V9h1V8zM15 10h-2V8h-2v2h2v2h2v-2z"></path><path fill-rule="evenodd" d="M9 2h2v2h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h5V2zm7 4H4v8h12V6z" clip-rule="evenodd"></path></g></svg>`,
    gift: `<svg fill="#9147ff"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16 6h2v6h-1v6H3v-6H2V6h2V4.793c0-2.507 3.03-3.762 4.803-1.99.131.131.249.275.352.429L10 4.5l.845-1.268a2.81 2.81 0 01.352-.429C12.969 1.031 16 2.286 16 4.793V6zM6 4.793V6h2.596L7.49 4.341A.814.814 0 006 4.793zm8 0V6h-2.596l1.106-1.659a.814.814 0 011.49.451zM16 8v2h-5V8h5zm-1 8v-4h-4v4h4zM9 8v2H4V8h5zm0 4H5v4h4v-4z" clip-rule="evenodd"></path></g></svg>`,
    help: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M9 8a1 1 0 011-1h.146a.87.87 0 01.854.871c0 .313-.179.6-.447.735A2.81 2.81 0 009 11.118V12h2v-.882a.81.81 0 01.447-.724A2.825 2.825 0 0013 7.871C13 6.307 11.734 5 10.146 5H10a3 3 0 00-3 3h2zM9 14a1 1 0 112 0 1 1 0 01-2 0z"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8 6a6 6 0 110-12 6 6 0 010 12z"></path></g></svg>`,
    hide: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M16.5 18l1.5-1.5-2.876-2.876a9.99 9.99 0 001.051-1.191L18 10l-1.825-2.433a9.992 9.992 0 00-2.855-2.575 35.993 35.993 0 01-.232-.14 6 6 0 00-6.175 0 35.993 35.993 0 01-.35.211L3.5 2 2 3.5 16.5 18zm-2.79-5.79a8 8 0 00.865-.977L15.5 10l-.924-1.233a7.996 7.996 0 00-2.281-2.058 37.22 37.22 0 01-.24-.144 4 4 0 00-4.034-.044l1.53 1.53a2 2 0 012.397 2.397l1.762 1.762z" clip-rule="evenodd"></path><path d="M11.35 15.85l-1.883-1.883a3.996 3.996 0 01-1.522-.532 38.552 38.552 0 00-.239-.144 7.994 7.994 0 01-2.28-2.058L4.5 10l.428-.571L3.5 8 2 10l1.825 2.433a9.992 9.992 0 002.855 2.575c.077.045.155.092.233.14a6 6 0 004.437.702z"></path></g></svg>`,
    home: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M17 8l-7-6-7 6v10h14V8zm-7-3.366l5 4.286V16h-4v-3H9v3H5V8.92l5-4.286z" clip-rule="evenodd"></path></g></svg>`,
    host: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M2 7a2 2 0 012-2h3L5.5 3.5 7 2l3 3 3-3 1.5 1.5L13 5h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm2 0v9h12V7H4z" clip-rule="evenodd"></path></g></svg>`,
    info: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 8V6h2v2H9zm0 6V9h2v5H9z" clip-rule="evenodd"></path></g></svg>`,
    lock: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M14.001 5.99A3.992 3.992 0 0010.01 2h-.018a3.992 3.992 0 00-3.991 3.99V8H3.999v8c0 1.105.896 2 2 2h8c1.104 0 2-.895 2-2V8h-1.998V5.99zm-2 2.01V5.995A1.996 1.996 0 0010.006 4h-.01a1.996 1.996 0 00-1.995 1.995V8h4z" clip-rule="evenodd"></path></g></svg>`,
    loot: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M11 2H9v3h2V2z"></path><path fill-rule="evenodd" d="M18 18v-7l-1.447-2.894A2 2 0 0014.763 7H5.237a2 2 0 00-1.789 1.106L2 11v7h16zM5.236 9h9.528l1 2H4.236l1-2zM4 13v3h12v-3h-5v1H9v-1H4z" clip-rule="evenodd"></path><path d="M4 3h2v2H4V3zM14 3h2v2h-2V3z"></path></g></svg>`,
    moon: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M8.614 2.134a8.001 8.001 0 001.388 15.879 8.003 8.003 0 007.884-6.635 6.947 6.947 0 01-2.884.62 7.004 7.004 0 01-6.388-9.864zM6.017 5.529a5.989 5.989 0 00-2.015 4.484c0 3.311 2.69 6 6 6a5.99 5.99 0 004.495-2.028 9.006 9.006 0 01-8.48-8.456z" clip-rule="evenodd"></path></g></svg>`,
    play: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M5 17.066V2.934a.5.5 0 01.777-.416L17 10 5.777 17.482A.5.5 0 015 17.066z"></path></g></svg>`,
    plus: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M9 11v5h2v-5h5V9h-5V4H9v5H4v2h5z" clip-rule="evenodd"></path></g></svg>`,
    poll: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 9V3h16v6H2zm14-4h-4v2h4V5zM2 17v-6h16v6H2zm4-4h10v2H6v-2z"></path></svg>`,
    raid: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M4 10.235l-.105.002a2.936 2.936 0 00-1.66.587l-.138.103A.06.06 0 012 10.88V10a8.074 8.074 0 01.121-1.394 8.002 8.002 0 0115.809.33c.046.348.07.703.07 1.064v.879a.06.06 0 01-.097.048l-.138-.103a2.936 2.936 0 00-3.315-.147l-2.49 4.045A1 1 0 0112 15v2a1 1 0 01-1 1H9a1 1 0 01-1-1v-2a1 1 0 01.04-.278l-2.49-4.045A2.937 2.937 0 004 10.235zM10.057 14h-.114l-2.382-3.872a6.674 6.674 0 014.878 0L10.057 14zm-4.07-5.348a8.671 8.671 0 018.027 0 4.937 4.937 0 011.724-.41 6.003 6.003 0 00-11.476 0c.589.031 1.174.168 1.724.41z" clip-rule="evenodd"></path></g></svg>`,
    show: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M11.998 10a2 2 0 11-4 0 2 2 0 014 0z"></path><path fill-rule="evenodd" d="M16.175 7.567L18 10l-1.825 2.433a9.992 9.992 0 01-2.855 2.575l-.232.14a6 6 0 01-6.175 0 35.993 35.993 0 00-.233-.14 9.992 9.992 0 01-2.855-2.575L2 10l1.825-2.433A9.992 9.992 0 016.68 4.992l.233-.14a6 6 0 016.175 0l.232.14a9.992 9.992 0 012.855 2.575zm-1.6 3.666a7.99 7.99 0 01-2.28 2.058l-.24.144a4 4 0 01-4.11 0 38.552 38.552 0 00-.239-.144 7.994 7.994 0 01-2.28-2.058L4.5 10l.925-1.233a7.992 7.992 0 012.28-2.058 37.9 37.9 0 00.24-.144 4 4 0 014.11 0l.239.144a7.996 7.996 0 012.28 2.058L15.5 10l-.925 1.233z" clip-rule="evenodd"></path></g></svg>`,
    star: `<svg fill="#ff9147"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M11.456 8.255L10 5.125l-1.456 3.13-3.49.485 2.552 2.516-.616 3.485L10 13.064l3.01 1.677-.616-3.485 2.553-2.516-3.491-.485zM7.19 6.424l-4.2.583c-.932.13-1.318 1.209-.664 1.853l3.128 3.083-.755 4.272c-.163.92.876 1.603 1.722 1.132L10 15.354l3.579 1.993c.846.47 1.885-.212 1.722-1.132l-.755-4.272 3.128-3.083c.654-.644.268-1.723-.664-1.853l-4.2-.583-1.754-3.77c-.406-.872-1.706-.872-2.112 0L7.19 6.424z" clip-rule="evenodd"></path></g></svg>`,
    warn: `<svg fill="#ffb31a"      width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M10.954 3.543c-.422-.724-1.486-.724-1.908 0l-6.9 11.844c-.418.719.11 1.613.955 1.613h13.798c.844 0 1.373-.894.955-1.613l-6.9-11.844zM11 15H9v-2h2v2zm0-3H9V7h2v5z" clip-rule="evenodd"></path></g></svg>`,

    fav: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M8.944 2.654c.406-.872 1.706-.872 2.112 0l1.754 3.77 4.2.583c.932.13 1.318 1.209.664 1.853l-3.128 3.083.755 4.272c.163.92-.876 1.603-1.722 1.132L10 15.354l-3.579 1.993c-.846.47-1.885-.212-1.722-1.132l.755-4.272L2.326 8.86c-.654-.644-.268-1.723.664-1.853l4.2-.583 1.754-3.77z"></path></svg>`,
    map: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M2 3l8 2.5L18 3v12l-7 2H9l-7-2V3zm9 4.283l5-1.563v7.771l-5 1.429V7.283zm-2 0L4 5.72v7.771l5 1.429V7.283z" clip-rule="evenodd"></path></g></svg>`,
    mod: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fill-rule="evenodd" d="M5.003 3.947A10 10 0 009.519 2.32L10 2l.48.32A10 10 0 0016.029 4H17l-.494 5.641a9 9 0 01-4.044 6.751L10 18l-2.462-1.608a9 9 0 01-4.044-6.75L3 4h.972c.346 0 .69-.018 1.031-.053zm.174 1.992l.309 3.528a7 7 0 003.146 5.25l1.368.894 1.368-.893a7 7 0 003.146-5.25l.309-3.529A12 12 0 0110 4.376 12 12 0 015.177 5.94z" clip-rule="evenodd"></path></g></svg>`,
    cog: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M10 8a2 2 0 100 4 2 2 0 000-4z"></path><path fill-rule="evenodd" d="M9 2h2a2.01 2.01 0 001.235 1.855l.53.22a2.01 2.01 0 002.185-.439l1.414 1.414a2.01 2.01 0 00-.439 2.185l.22.53A2.01 2.01 0 0018 9v2a2.01 2.01 0 00-1.855 1.235l-.22.53a2.01 2.01 0 00.44 2.185l-1.415 1.414a2.01 2.01 0 00-2.184-.439l-.531.22A2.01 2.01 0 0011 18H9a2.01 2.01 0 00-1.235-1.854l-.53-.22a2.009 2.009 0 00-2.185.438L3.636 14.95a2.009 2.009 0 00.438-2.184l-.22-.531A2.01 2.01 0 002 11V9c.809 0 1.545-.487 1.854-1.235l.22-.53a2.009 2.009 0 00-.438-2.185L5.05 3.636a2.01 2.01 0 002.185.438l.53-.22A2.01 2.01 0 009 2zm-4 8l1.464 3.536L10 15l3.535-1.464L15 10l-1.465-3.536L10 5 6.464 6.464 5 10z" clip-rule="evenodd"></path></g></svg>`,
    vip: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M18 8l-4-4H6L2 8l8 8 8-8zm-4.828 2L10 13.172 6.828 10h6.344zM4.828 8l2-2h6.344l2 2H4.828z"></path></svg>`,

    at: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><path d="M12 4H8a4 4 0 00-4 4v4a4 4 0 004 4h5v2H8a6 6 0 01-6-6V8a6 6 0 016-6h4a6 6 0 015.995 5.75H18v2.75a3.5 3.5 0 01-6 2.45 3.5 3.5 0 01-6-2.45v-1a3.5 3.5 0 015-3.163V6h2v4.5a1.5 1.5 0 003 0V8a4 4 0 00-4-4zm-1 5.5a1.5 1.5 0 00-3 0v1a1.5 1.5 0 003 0v-1z"></path></svg>`,

    x: `<svg fill="currentcolor" width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path d="M8.5 10L4 5.5 5.5 4 10 8.5 14.5 4 16 5.5 11.5 10l4.5 4.5-1.5 1.5-4.5-4.5L5.5 16 4 14.5 8.5 10z"></path></g></svg>`,

    // Credit Card logos
    amex:           `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24"><g fill="none"><path fill="#000" d="M35,0 L3,0 C1.3,0 0,1.3 0,3 L0,21 C0,22.7 1.4,24 3,24 L35,24 C36.7,24 38,22.7 38,21 L38,3 C38,1.3 36.6,0 35,0 Z" opacity=".07"></path><path fill="#006FCF" d="M35,1 C36.1,1 37,1.9 37,3 L37,21 C37,22.1 36.1,23 35,23 L3,23 C1.9,23 1,22.1 1,21 L1,3 C1,1.9 1.9,1 3,1 L35,1"></path><path fill="#FFF" d="M8.971,10.268 L9.745,12.144 L8.203,12.144 L8.971,10.268 Z M25.046,10.346 L22.069,10.346 L22.069,11.173 L24.998,11.173 L24.998,12.412 L22.075,12.412 L22.075,13.334 L25.052,13.334 L25.052,14.073 L27.129,11.828 L25.052,9.488 L25.046,10.346 L25.046,10.346 Z M10.983,8.006 L14.978,8.006 L15.865,9.941 L16.687,8 L27.057,8 L28.135,9.19 L29.25,8 L34.013,8 L30.494,11.852 L33.977,15.68 L29.143,15.68 L28.065,14.49 L26.94,15.68 L10.03,15.68 L9.536,14.49 L8.406,14.49 L7.911,15.68 L4,15.68 L7.286,8 L10.716,8 L10.983,8.006 Z M19.646,9.084 L17.407,9.084 L15.907,12.62 L14.282,9.084 L12.06,9.084 L12.06,13.894 L10,9.084 L8.007,9.084 L5.625,14.596 L7.18,14.596 L7.674,13.406 L10.27,13.406 L10.764,14.596 L13.484,14.596 L13.484,10.661 L15.235,14.602 L16.425,14.602 L18.165,10.673 L18.165,14.603 L19.623,14.603 L19.647,9.083 L19.646,9.084 Z M28.986,11.852 L31.517,9.084 L29.695,9.084 L28.094,10.81 L26.546,9.084 L20.652,9.084 L20.652,14.602 L26.462,14.602 L28.076,12.864 L29.624,14.602 L31.499,14.602 L28.987,11.852 L28.986,11.852 Z"></path></g></svg>`,
    diners_club:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><path d="M12 12v3.7c0 .3-.2.3-.5.2-1.9-.8-3-3.3-2.3-5.4.4-1.1 1.2-2 2.3-2.4.4-.2.5-.1.5.2V12zm2 0V8.3c0-.3 0-.3.3-.2 2.1.8 3.2 3.3 2.4 5.4-.4 1.1-1.2 2-2.3 2.4-.4.2-.4.1-.4-.2V12zm7.2-7H13c3.8 0 6.8 3.1 6.8 7s-3 7-6.8 7h8.2c3.8 0 6.8-3.1 6.8-7s-3-7-6.8-7z" fill="#3086C8"></path></svg>`,
    discover:       `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24"><path fill="#000" opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32z" fill="#fff"></path><path d="M3.57 7.16H2v5.5h1.57c.83 0 1.43-.2 1.96-.63.63-.52 1-1.3 1-2.11-.01-1.63-1.22-2.76-2.96-2.76zm1.26 4.14c-.34.3-.77.44-1.47.44h-.29V8.1h.29c.69 0 1.11.12 1.47.44.37.33.59.84.59 1.37 0 .53-.22 1.06-.59 1.39zm2.19-4.14h1.07v5.5H7.02v-5.5zm3.69 2.11c-.64-.24-.83-.4-.83-.69 0-.35.34-.61.8-.61.32 0 .59.13.86.45l.56-.73c-.46-.4-1.01-.61-1.62-.61-.97 0-1.72.68-1.72 1.58 0 .76.35 1.15 1.35 1.51.42.15.63.25.74.31.21.14.32.34.32.57 0 .45-.35.78-.83.78-.51 0-.92-.26-1.17-.73l-.69.67c.49.73 1.09 1.05 1.9 1.05 1.11 0 1.9-.74 1.9-1.81.02-.89-.35-1.29-1.57-1.74zm1.92.65c0 1.62 1.27 2.87 2.9 2.87.46 0 .86-.09 1.34-.32v-1.26c-.43.43-.81.6-1.29.6-1.08 0-1.85-.78-1.85-1.9 0-1.06.79-1.89 1.8-1.89.51 0 .9.18 1.34.62V7.38c-.47-.24-.86-.34-1.32-.34-1.61 0-2.92 1.28-2.92 2.88zm12.76.94l-1.47-3.7h-1.17l2.33 5.64h.58l2.37-5.64h-1.16l-1.48 3.7zm3.13 1.8h3.04v-.93h-1.97v-1.48h1.9v-.93h-1.9V8.1h1.97v-.94h-3.04v5.5zm7.29-3.87c0-1.03-.71-1.62-1.95-1.62h-1.59v5.5h1.07v-2.21h.14l1.48 2.21h1.32l-1.73-2.32c.81-.17 1.26-.72 1.26-1.56zm-2.16.91h-.31V8.03h.33c.67 0 1.03.28 1.03.82 0 .55-.36.85-1.05.85z" fill="#231F20"></path><path d="M20.16 12.86a2.931 2.931 0 100-5.862 2.931 2.931 0 000 5.862z" fill="url(#pi-paint0_linear)"></path><path opacity=".65" d="M20.16 12.86a2.931 2.931 0 100-5.862 2.931 2.931 0 000 5.862z" fill="url(#pi-paint1_linear)"></path><path d="M36.57 7.506c0-.1-.07-.15-.18-.15h-.16v.48h.12v-.19l.14.19h.14l-.16-.2c.06-.01.1-.06.1-.13zm-.2.07h-.02v-.13h.02c.06 0 .09.02.09.06 0 .05-.03.07-.09.07z" fill="#231F20"></path><path d="M36.41 7.176c-.23 0-.42.19-.42.42 0 .23.19.42.42.42.23 0 .42-.19.42-.42 0-.23-.19-.42-.42-.42zm0 .77c-.18 0-.34-.15-.34-.35 0-.19.15-.35.34-.35.18 0 .33.16.33.35 0 .19-.15.35-.33.35z" fill="#231F20"></path><path d="M37 12.984S27.09 19.873 8.976 23h26.023a2 2 0 002-1.984l.024-3.02L37 12.985z" fill="#F48120"></path><defs><linearGradient x1="21.657" y1="12.275" x2="19.632" y2="9.104" gradientUnits="userSpaceOnUse"><stop stop-color="#F89F20"></stop><stop offset=".25" stop-color="#F79A20"></stop><stop offset=".533" stop-color="#F68D20"></stop><stop offset=".62" stop-color="#F58720"></stop><stop offset=".723" stop-color="#F48120"></stop><stop offset="1" stop-color="#F37521"></stop></linearGradient><linearGradient x1="21.338" y1="12.232" x2="18.378" y2="6.446" gradientUnits="userSpaceOnUse"><stop stop-color="#F58720"></stop><stop offset=".359" stop-color="#E16F27"></stop><stop offset=".703" stop-color="#D4602C"></stop><stop offset=".982" stop-color="#D05B2E"></stop></linearGradient></defs></svg>`,
    jcb:            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24"><g fill="none" fill-rule="evenodd"><g fill-rule="nonzero"><path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#000" opacity=".07"></path><path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" fill="#FFF"></path></g><path d="M11.5 5H15v11.5a2.5 2.5 0 0 1-2.5 2.5H9V7.5A2.5 2.5 0 0 1 11.5 5z" fill="#006EBC"></path><path d="M18.5 5H22v11.5a2.5 2.5 0 0 1-2.5 2.5H16V7.5A2.5 2.5 0 0 1 18.5 5z" fill="#F00036"></path><path d="M25.5 5H29v11.5a2.5 2.5 0 0 1-2.5 2.5H23V7.5A2.5 2.5 0 0 1 25.5 5z" fill="#2AB419"></path><path d="M10.755 14.5c-1.06 0-2.122-.304-2.656-.987l.78-.676c.068 1.133 3.545 1.24 3.545-.19V9.5h1.802v3.147c0 .728-.574 1.322-1.573 1.632-.466.144-1.365.221-1.898.221zm8.116 0c-.674 0-1.388-.107-1.965-.366-.948-.425-1.312-1.206-1.3-2.199.012-1.014.436-1.782 1.468-2.165 1.319-.49 3.343-.261 3.926.27v.972c-.572-.521-1.958-.898-2.919-.46-.494.226-.737.917-.744 1.448-.006.56.245 1.252.744 1.497.953.467 2.39.04 2.919-.441v1.01c-.358.255-1.253.434-2.129.434zm8.679-2.587c.37-.235.582-.567.582-1.005 0-.438-.116-.687-.348-.939-.206-.207-.58-.469-1.238-.469H23v5h3.546c.696 0 1.097-.23 1.315-.415.283-.25.426-.53.426-.96 0-.431-.155-.908-.737-1.212zm-1.906-.281h-1.428v-1.444h1.495c.956 0 .944 1.444-.067 1.444zm.288 2.157h-1.716v-1.513h1.716c.986 0 1.083 1.513 0 1.513z" fill="#FFF" fill-rule="nonzero"></path></g></svg>`,
    maestro:        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><circle fill="#EB001B" cx="15" cy="12" r="7"></circle><circle fill="#00A2E5" cx="23" cy="12" r="7"></circle><path fill="#7375CF" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"></path></svg>`,
    mastercard:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><circle fill="#EB001B" cx="15" cy="12" r="7"></circle><circle fill="#F79E1B" cx="23" cy="12" r="7"></circle><path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"></path></svg>`,
    paypal:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><path fill="#003087" d="M23.9 8.3c.2-1 0-1.7-.6-2.3-.6-.7-1.7-1-3.1-1h-4.1c-.3 0-.5.2-.6.5L14 15.6c0 .2.1.4.3.4H17l.4-3.4 1.8-2.2 4.7-2.1z"></path><path fill="#3086C8" d="M23.9 8.3l-.2.2c-.5 2.8-2.2 3.8-4.6 3.8H18c-.3 0-.5.2-.6.5l-.6 3.9-.2 1c0 .2.1.4.3.4H19c.3 0 .5-.2.5-.4v-.1l.4-2.4v-.1c0-.2.3-.4.5-.4h.3c2.1 0 3.7-.8 4.1-3.2.2-1 .1-1.8-.4-2.4-.1-.5-.3-.7-.5-.8z"></path><path fill="#012169" d="M23.3 8.1c-.1-.1-.2-.1-.3-.1-.1 0-.2 0-.3-.1-.3-.1-.7-.1-1.1-.1h-3c-.1 0-.2 0-.2.1-.2.1-.3.2-.3.4l-.7 4.4v.1c0-.3.3-.5.6-.5h1.3c2.5 0 4.1-1 4.6-3.8v-.2c-.1-.1-.3-.2-.5-.2h-.1z"></path></svg>`,
    visa:           `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 24" width="38" height="24"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z" fill="#142688"></path></svg>`,

    __exclusionList__: ["__exclusionList__", "DOMParser", "modify", "utf8", "base64", "__base64__", "dataURI", "__dataURI__", "pathData", "__pathData__"],

    modify(glyph, attributes, element = 'svg') {
        let XMLParser = window.Glyphs.DOMParser ??= new DOMParser;

        let XML = XMLParser.parseFromString((glyph in window.Glyphs? window.Glyphs[glyph]: glyph), 'text/xml'),
            ele = $(element, XML);

        for(let attribute in attributes) {
            let value = attributes[attribute];

            if(!!~[null, undefined].indexOf(value))
                ele?.removeAttribute(attribute);
            else
                ele?.setAttribute(attribute, value);
        }

        ele?.setAttribute('data-glyph-name', glyph);

        let string = new String(ele.outerHTML);

        string.asNode = ele;

        return string;
    },

    get utf8() {
        let cc = '\u{D83D}\u{DCB3}';

        return ({
            // 1st batch
            bonuschannelpoints: "\u{1F9F0}",
            more_horizontal: "\u{2026}",
            more_vertical: "\u{22EE}",
            channelpoints: "\u{1F4AF}",
            checkmark: "\u{2714}",
            favorite: "\u{1F493}",
            emotes: "\u{1F600}",
            latest: "\u{1F31F}",
            search: "\u{1F50D}",
            stream: "\u{1F39E}",
            thread: "\u{1F4AC}",
            trophy: "\u{1F3C6}",
            upload: "\u{21A5}",
            wallet: "\u{1F45B}",
            close: "\u{21A6}",
            crown: "\u{1F451}",
            globe: "\u{1F310}",
            leave: "\u{21A4}",
            music: "\u{1F3B5}",
            pause: "\u{23F8}",
            reply: "\u{2936}",
            stats: "\u{1F4CA}",
            trash: "\u{1F5D1}",
            unfav: "\u{2606}",
            bits: "\u{1F4A0}",
            chat: "\u{1F4AC}",
            gift: "\u{1F381}",
            help: "\u{2139}",
            lock: "\u{1F512}",
            loot: "\u{1FA82}",
            moon: "\u{1F319}",
            play: "\u{25B6}",
            star: "\u{2B50}",
            show: "\u{1F441}",
            fav: "\u{2605}",
            mod: "\u{1F6E1}",
            cog: "\u{2699}",
            x: "\u{274C}",

            // 2nd batch
            add_to_calendar: "\u{1F4C5}",
            navigation: "\u{1F9ED}", // burger => 3 horz-bars
            calendar: "\u{1F4C5}",
            download: "\u2B07\uFE0F",
            export: "\u{2934}",
            people: "\u{1F465}",
            video: "\uD83C\uDFA6\uFE0F",
            bolt: "\u{1F329}",
            game: "\u{1F3AE}",
            hide: "\u{1F648}",
            poll: "\u{1F4CA}",
            show: "\u{1F441}",
            map: "\u{1F5FA}",

            // 3rd batch
            compass: "\u{1F9ED}",
            twitch: "\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8\uFE0F",
            unmute: "\u{1F507}",
            audio: "\u{1F50A}",

            // 4th batch
            mouse: "\uD83D\uDDB1\uFE0F",
            primary_mouse_button: "\uD83D\uDC49\uFE0F\u200D\uD83D\uDDB1\uFE0F",
            secondary_mouse_button: "\uD83D\uDDB1\uFE0F\u200D\uD83D\uDC48\uFE0F",

            // 5th batch
            accessible: "\u267F\uFE0F",
            extensions: "\uD83E\uDDE9\uFE0F",
            verified: "\u2705\uFE0F",
            ignore: "\uD83D\uDD15\uFE0F",
            inform: "\uD83D\uDD14\uFE0F",
            notify: "\uD83D\uDD14\uFE0F",
            rewind: "\u23EE\uFE0F",
            party: "\uD83C\uDF89\uFE0F",
            rerun: "\uD83D\uDD04\uFE0F",
            raid: "\uD83E\uDE82\uFE0F",

            // 6th batch
            ne_arrow: "\u{2197}",
            dislike: "\u{1F494}",
            unread: "\u{2709}",
            intro: "\u{1F64B}",

            // 7th batch
            predict: "\uD83D\uDD2E\uFE0F",
            refresh: "\uD83D\uDD01\uFE0F",
            station: "\uD83C\uDF99\uFE0F",
            alert: "\uD83D\uDCE3\uFE0F",
            sword: "\uD83D\uDDE1\uFE0F",
            clip: "\uD83C\uDFAC\uFE0F",
            home: "\uD83C\uDFE0\uFE0F",
            host: "\uD83D\uDCFA\uFE0F",
            info: "\u2139\uFE0F",
            plus: "\u2795\uFE0F",
            warn: "\u26A0\uFE0F",

            // 8th batch
            ghost: "\uD83D\uDC7B\uFE0F",

            // 9th batch
            incognito: "\uD83D\uDD75\uFE0F",
            flag: "\uD83D\uDEA9\uFE0F",

            // 10th batch
            pinned: "\u{1F4CC}",
            rocket: "\u{1F680}",
            ribbon: "\u{1F397}",
            cheer: "\u{1F941}",
            error: "\u26D4",

            // 11th batch
            cake: '\u{D83C}\u{DF82}',
            vip: '\u{D83D}\u{DC8E}',
            at: '@',
            battery: '\u{D83D}\u{DD0B}',
            amex: cc,
            diners_club: cc,
            discover: cc,
            jcb: cc,
            maestro: cc,
            mastercard: cc,
            paypal: cc,
            visa: cc,
        });
    },

    get base64() {
        return (() => {
            let exclusions = window.Glyphs.__exclusionList__,
                __base64__ = window.Glyphs.__base64__ ?? {};

            for(let glyph in window.Glyphs)
                if(!!~exclusions.indexOf(glyph))
                    continue;
                else
                    __base64__[glyph] ??= btoa(window.Glyphs[glyph]);

            return window.Glyphs.__base64__ ??= __base64__;
        })();
    },

    get dataURI() {
        return (() => {
            let exclusions = window.Glyphs.__exclusionList__,
                __dataURI__ = window.Glyphs.__dataURI__ ?? {};

            for(let glyph in window.Glyphs)
                if(!!~exclusions.indexOf(glyph))
                    continue;
                else
                    __dataURI__[glyph] ??= window.Glyphs[glyph].toImage();

            return window.Glyphs.__dataURI__ ??= __dataURI__;
        })();
    },

    get pathData() {
        return (() => {
            let exclusions = window.Glyphs.__exclusionList__,
                __pathData__ = window.Glyphs.__pathData__ ?? {};

            for(let glyph in window.Glyphs)
                if(!!~exclusions.indexOf(glyph))
                    continue;
                else
                    __pathData__[glyph] ??= [...window.Glyphs.modify(glyph).asNode.querySelectorAll('path')].map(path => path.getAttribute('d')).join(';');

            return window.Glyphs.__pathData__ ??= __pathData__;
        })();
    },
};
