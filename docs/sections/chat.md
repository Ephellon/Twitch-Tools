# `chat.js` — section digests
> Generated in Phase 1 from Offser (`gemma4:31b-cloud`) digests plus facts extracted by script. Digests are summaries, not specs — verify against the code before relying on a detail.

<a id="chat-1"></a>

## /chat.js - Meant for features that can run on chat-only pages — L1–97

**Purpose**

Initializes chat-specific environment for Twitch chat pages, handles badge data loading, and provides a performance monitoring utility for asynchronous jobs.

**Runs when**

Loaded on `twitch.tv/chat/*` pages.

**Defines**

- `window.IS_A_FRAMED_CONTAINER` — boolean indicating if the window is nested in a frame.
- `top.Queue` — global object holding arrays for chat elements (balloons, bullets, emotes, etc.).
- `Chat__Initialize` — async function that sets up chat context, streamer identity, and badge mappings.
- `StopWatch` — class used to time jobs and log warnings if they exceed a specific duration.

**Depends on**

`parseURL`, `Runtime`, `$.all`, `$`, `$warn`

**Twitch coupling**

- `[href*="offline_embed"i]` (live status check)
- `img[class*="channel"i][class*="point"i][class*="icon"i]` (channel ID extraction)
- URL path patterns: `/moderator/`, `/popout/`, `/about`, `/schedule`, `/squad`, `/videos`

**Storage & messaging**

- Runtime action: `FETCH_SHARED_DATA` (read)

<a id="chat-98"></a>

## Automation › Auto-claim Channel Points — L98–290
- **Settings keys:** `auto_claim_bonuses`
- **Handlers:** `auto_claim_bonuses`
- **Unhandlers:** `auto_claim_bonuses`
- **Timers:** `auto_claim_bonuses`
- **RegisterJob:** `auto_claim_bonuses`
- **Labels:** `__AutoClaimBonuses__`

**Purpose**

Automatically clicks channel point claim buttons and adds a custom UI toggle to the top navigation to enable/disable the feature.

**Runs when**

Every 2,500ms via `Timers.auto_claim_bonuses` if `Settings.auto_claim_bonuses` is true.

**Depends on**

Settings, parseBool, $, $.all, defined, nullish, furnish, when, wait, Glyphs, Tooltip, getOffset, CHANNEL_POINTS_MULTIPLIER, ANTITHEME, StopWatch, addReport, $error, RegisterJob, Handlers, Unhandlers, Timers

**Twitch coupling**

- `[class*="bonus"i]` / `[data-test-selector*="points"i][data-test-selector*="summary"i]` (claim buttons)
- `.pulse-animation [class*="channel"i][class*="points"i]` (claim success animation)
- `.top-nav__menu > div` (UI insertion point)
- `[data-test-selector*="balance"i]` (point balance text)
- `[data-a-page-loaded-name="PopoutChatPage"i]` (page detection)

**Storage & messaging**

- `Settings.auto_claim_bonuses` (read)
- `tt-auto-claim-enabled` (DOM attribute read/write)
- `top.TWITCH_INTEGRITY_FAIL` (global write)
- `top.onintegritychange` (global event handler)

<a id="chat-291"></a>

## Chat & Messaging › Emote Searching - NOT A SETTING. This is a helper for "Convert Emotes"  — L291–403
- **Settings keys:** `bttv_emotes`, `convert_emotes`
- **Handlers:** `emote_searching`
- **Timers:** `emote_searching`
- **RegisterJob:** `emote_searching`
- **Labels:** `__EmoteSearching__`, `__onquery__`

**Purpose**

Helper for "Convert Emotes" and "BTTV Emotes" that monitors the emote picker search box and provides a mechanism to inject custom search results into the Twitch UI.

**Runs when**

Every 250ms (via `Timers.emote_searching`) if `Settings.convert_emotes` or `Settings.bttv_emotes` is enabled.

**Defines**

EmoteSearch — Helper object for tracking search queries, registering query callbacks, and appending result nodes.
EmoteDragCommand — Localized string instructing users to drag emotes to use them.
Handlers.emote_searching — Polls the emote search input for changes to trigger registered callbacks.
Timers.emote_searching — Polling interval for the search handler.

**Depends on**

Settings, parseBool, defined, wait, UUID, nullish, RegisterJob, top.LANGUAGE

**Twitch coupling**

.emote-picker [type="search"i]
[class*="emote-picker"i] [class*="emote-picker"i][class*="block"i] > *:last-child
[class*="emote-picker"i] p

<a id="chat-404"></a>

## BetterTTV Emotes — L404–884
- **Settings keys:** `auto_load_bttv_emotes`, `bttv_emotes`, `bttv_emotes_channel`, `bttv_emotes_extras`, `bttv_emotes_location`, `bttv_emotes_maximum`
- **Handlers:** `bttv_emotes`
- **Timers:** `bttv_emotes`
- **RegisterJob:** `bttv_emotes`
- **Labels:** `__BetterTTVEmotes__`

**Purpose**

Integrates BetterTTV (BTTV) emotes into Twitch chat and the emote picker, replacing chat text with BTTV images and allowing users to search and browse BTTV emotes.

**Runs when**

- Triggered by `RegisterJob('bttv_emotes')` and `Timers.bttv_emotes` (every 5s).
- On chat messages via `Chat.onmessage`.
- On emote search queries via `EmoteSearch.onquery`.
- Periodically via `BTTV_LOADER` (every 30s) for cache synchronization.

**Defines**

- `BTTV_EMOTES` — Global map of emote names to CDN URLs.
- `BTTV_OWNERS` — Global map of emote names to owner metadata.
- `CONVERT_TO_BTTV_EMOTE` — Generates the HTML element for a BTTV emote button.
- `LOAD_BTTV_EMOTES` — Async function to fetch emotes from BTTV API by keyword, user, or trend.
- `REFURBISH_BTTV_EMOTE_TOOLTIPS` — Attaches tooltips and a metadata info-card event to BTTV emotes.
- `Handlers.bttv_emotes` — Job that injects the BTTV section into the Twitch emote picker.

**Depends on**

`top`, `Cache`, `UUID`, `parseURL`, `Settings`, `furnish`, `Tooltip`, `fetchURL`, `$warn`, `STREAMER`, `Glyphs`, `getOffset`, `Card`, `Search`, `StopWatch`, `Handlers`, `Timers`, `RegisterJob`, `parseBool`, `Chat`, `Queue`, `EmoteSearch`, `encodeHTML`

**Twitch coupling**

- `[data-a-target="chat-input"i]`
- `[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *`
- `.emote-picker__content-block`
- `[data-a-target$="message"i]`
- `.chat-line__message--emote-button`
- `.chat-image__container`
- `.chat-image`

**Storage & messaging**

- `Cache.large`: `BTTV_EMOTES`, `BTTV_OWNERS`

<a id="chat-885"></a>

## Convert Emotes — L885–1245
- **Settings keys:** `convert_emotes`
- **Handlers:** `convert_emotes`
- **Timers:** `convert_emotes`
- **RegisterJob:** `convert_emotes`
- **Labels:** `__ConvertEmotes__`

**Purpose**

Captures "locked" or unknown emotes from the channel's emote picker and chat messages to allow them to be used/displayed as "captured emotes" in the UI. Includes a utility to parse rule strings into regex filter objects.

**Runs when**

- `Settings.convert_emotes` is enabled.
- Every 2,500ms (`Timers.convert_emotes`).
- On every incoming chat message (`Chat.onmessage`).
- When the emote search is queried (`EmoteSearch.onquery`).

**Defines**

- `OWNED_EMOTES` — Map of owned emote names to shortened URLs.
- `CAPTURED_EMOTES` — Map of captured emote names to shortened URLs.
- `CONVERT_TO_CAPTURED_EMOTE` — Creates a DOM element (button/image/tooltip) for a captured emote.
- `shrt` — Shortens Twitch emote URLs to a `base36id-version` format.
- `Handlers.convert_emotes` — Logic to extract locked emotes and inject the "Captured Emotes" section into the emote picker.
- `UPDATE_RULES` — Parses rule strings (channels, users, badges, emotes, text) into regex-based filter objects.

**Depends on**

`furnish`, `Tooltip`, `STREAMER`, `parseBool`, `Settings`, `RestartJob`, `RegisterJob`, `wait`, `Chat`, `BTTV_EMOTES`, `Queue`, `when`, `EmoteSearch`, `Glyphs`, `REFURBISH_BTTV_EMOTE_TOOLTIPS`, `$remark`

**Twitch coupling**

- `[data-a-target="chat-input"i]`
- `[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *`
- `[class^="emote-picker"i] img[alt="${ STREAMER.name }"i]`
- `[data-test-selector*="lock"i]`
- `[data-a-target="emote-picker-button"i]`
- `.emote-picker .simplebar-scroll-content`
- `[data-a-target="CHANNEL_EMOTES"i]`
- `.emote-button [data-test-selector*="lock"i] ~ img:not(.bttv)`

<a id="chat-1246"></a>

## Filter Messages — L1246–1331
- **Settings keys:** `filter_messages`
- **Handlers:** `filter_messages`
- **Unhandlers:** `filter_messages`
- **Timers:** `filter_messages`
- **RegisterJob:** `filter_messages`
- **Labels:** `__FilterMessages__`

**Purpose**

Filters Twitch chat messages based on user-defined rules (users, badges, emotes, or text) globally or per-channel, hiding matching messages via a custom attribute.

**Runs when**

`Settings.filter_messages` is enabled; triggered by `Chat.onmessage` and `Chat.onpinned` events, and a 2.5s one-shot timer.

**Defines**

- `Handlers.filter_messages` — initializes chat filter hooks and applies filters to existing messages.
- `Unhandlers.filter_messages` — removes the `tt-hidden-message` attribute from all elements to restore filtered messages.
- `Timers.filter_messages` — one-shot timeout (2500ms) to trigger the filter handler.

**Depends on**

`StopWatch`, `Chat`, `when`, `defined`, `UPDATE_RULES`, `parseBool`, `STREAMER`, `USERNAME`, `$log`, `Settings`, `RegisterJob`

**Twitch coupling**

- `Chat.onmessage` / `Chat.onpinned` (Internal event hooks)
- `Chat.get()` (Message retrieval)
- `STREAMER.name` (Current channel identification)
- `tt-hidden-message` (Custom attribute used for CSS-based hiding)

**Storage & messaging**

`Settings.filter_messages`

<a id="chat-1332"></a>

## Easy Filter - NOT A SETTING. This is a helper for "Message Filter" — L1332–1435
- **Settings keys:** `filter_messages`, `set`
- **Handlers:** `easy_filter`
- **Timers:** `easy_filter`
- **RegisterJob:** `easy_filter`
- **Labels:** `__EasyFilter__`

**Purpose**

Adds "Filter" buttons to Twitch viewer and emote info cards, allowing users to quickly add specific users or emotes to the message filter list and remove their existing messages from chat.

**Runs when**

Every 500ms (via `Timers.easy_filter`) if `Settings.filter_messages` is truthy.

**Defines**

- `Handlers.easy_filter` — logic to detect viewer/emote cards and inject "Filter" buttons.
- `Timers.easy_filter` — polling interval (500ms).

**Depends on**

$, $.all, nullish, defined, furnish, Settings, Glyphs

**Twitch coupling**

- `[data-a-target="viewer-card"i]`
- `[data-a-target="emote-card"i]`
- `[data-a-target="chat-line-message"i]`
- `[data-a-user="${ username }"i]`
- `img[alt="${ emote }"i]`
- `.text-fragment`
- `h1,h2,h3,h4,h5,h6` (inside cards)

**Storage & messaging**

- `Settings.filter_rules` (read/write)

<a id="chat-1436"></a>

## Filter Bulletins — L1436–1486
- **Settings keys:** `filter_messages__bullets_coin`, `filter_messages__bullets_note`, `filter_messages__bullets_paid`, `filter_messages__bullets_raid`, `filter_messages__bullets_subs`
- **Handlers:** `filter_bulletins`
- **Unhandlers:** `filter_bulletins`
- **Timers:** `filter_bulletins`
- **RegisterJob:** `filter_bulletins`
- **Labels:** `__FilterBulletins__`

**Purpose**

Hides specific types of Twitch chat bulletins (coins, raids, subscriptions, notes, and pinned messages) based on user settings.

**Runs when**

Triggered by `RegisterJob('filter_bulletins')` (which is called if any relevant `Settings` are enabled) and executed as a one-shot timeout after 2,500ms.

**Defines**

- `BULLETIN_FILTERS` — Map linking setting keys to the `data-type` values they should filter.
- `PINNED_FILTER` — Timer ID for the pinned messages removal interval.
- `Handlers.filter_bulletins` — Main logic to apply CSS filters or start the pinned message removal loop.
- `Unhandlers.filter_bulletins` — Cleanup function to remove CSS blocks and clear the interval.

**Depends on**

`StopWatch`, `parseBool`, `Settings`, `$`, `AddCustomCSSBlock`, `RemoveCustomCSSBlock`, `RegisterJob`, `$remark`

**Twitch coupling**

- `[class*="pinned"i]:is([class*="by"i], [class*="card"i])`
- `[class*="happening"i][class*="notification"i]`
- `[class*="chat"] > div:not([class])`
- `[data-uuid][data-type="..."]` (types: coin, raid, dues, gift, keep, note)

**Storage & messaging**

Reads `Settings.filter_messages__bullets_coin`, `Settings.filter_messages__bullets_raid`, `Settings.filter_messages__bullets_subs`, `Settings.filter_messages__bullets_note`, `Settings.filter_messages__bullets_paid`.

<a id="chat-1487"></a>

## Highlight Phrases — L1487–1572
- **Settings keys:** `highlight_phrases`
- **Handlers:** `highlight_phrases`
- **Unhandlers:** `highlight_phrases`
- **Timers:** `highlight_phrases`
- **RegisterJob:** `highlight_phrases`
- **Labels:** `__HighlightPhrases__`

**Purpose**

Highlights chat messages with a colored border if they match user-defined rules (phrases, users, badges, or emotes), either globally or per-channel.

**Runs when**

Enabled via `Settings.highlight_phrases`; initialized by `RegisterJob` (with a 2.5s one-shot timeout); triggers on every new chat message via `Chat.onmessage`.

**Defines**

- `Handlers.highlight_phrases` — Initializes the message interceptor and applies highlighting to existing messages.
- `Unhandlers.highlight_phrases` — Removes the `tt-light` attribute from all highlighted chat elements.
- `Timers.highlight_phrases` — 2500ms one-shot timeout for job registration.

**Depends on**

`StopWatch`, `Chat`, `when`, `defined`, `UPDATE_RULES`, `parseBool`, `STREAMER`, `nullish`, `Color`, `$.all`, `Settings`, `RegisterJob`, `$log`, `$remark`

**Twitch coupling**

- `Chat.onmessage` (API hook)
- `Chat.get()` (API hook)
- `STREAMER.name` (Channel identity)

**Storage & messaging**

- `Settings.highlight_phrases` (Read)

<a id="chat-1573"></a>

## Easy Highlighter - NOT A SETTING. This is a helper for "Highlight Phrases" — L1573–1676
- **Settings keys:** `highlight_phrases`, `set`
- **Handlers:** `easy_highlighter`
- **Timers:** `easy_highlighter`
- **RegisterJob:** `easy_highlighter`
- **Labels:** `__EasyHighlighter__`

**Purpose**

Adds "Highlight" buttons to Twitch viewer and emote cards, allowing users to quickly add specific usernames or emotes to the phrase highlighting list.

**Runs when**

Polling every 500ms if `Settings.highlight_phrases` is enabled.

**Defines**

- `Handlers.easy_highlighter` — Logic to inject and handle highlight buttons in viewer/emote cards.
- `Timers.easy_highlighter` — Polling interval (500ms).

**Depends on**

`Settings`, `furnish`, `Glyphs`, `RegisterJob`, `parseBool`, `nullish`, `defined`

**Twitch coupling**

- `[data-a-target="viewer-card"i]`
- `[data-a-target="emote-card"i]`
- `[data-a-target="chat-line-message"i]`
- `[data-a-user="..."]`
- `img[alt="..."]`
- `.text-fragment`
- `h1,h2,h3,h4,h5,h6` (within cards)

**Storage & messaging**

`Settings.phrase_rules`

<a id="chat-1677"></a>

## Easy Helper Card Resizer - NOT A SETTING. This is a helper for "Filter Messages" and "High — L1677–1748
- **Settings keys:** `filter_messages`, `highlight_mentions`, `highlight_mentions_extra`, `highlight_phrases`
- **Handlers:** `easy_helper_card_resizer`, `highlight_mentions`
- **Timers:** `easy_helper_card_resizer`, `highlight_mentions`
- **RegisterJob:** `easy_helper_card_resizer`, `highlight_mentions`
- **Labels:** `__EasyHelperCardResizer__`, `__HighlightMentions__`

**Purpose**

- Adjusts height of viewer/emote cards to accommodate hidden children when filtering/highlighting is active.
- Visually highlights chat messages that mention the current user or specific group keywords.

**Runs when**

- `easy_helper_card_resizer`: Every 250ms if `Settings.filter_messages` or `Settings.highlight_phrases` is enabled.
- `highlight_mentions`: One-shot timeout after 500ms if `Settings.highlight_mentions` is enabled; thereafter on every new chat message.

**Defines**

- `Handlers.easy_helper_card_resizer` — adjusts height of viewer/emote card headers based on child count.
- `Handlers.highlight_mentions` — applies background and border styles to messages mentioning the user.

**Depends on**

$, nullish, modStyle, parseBool, Settings, RegisterJob, Handlers, Timers, USERNAME, Queue, when, defined, Color, Chat

**Twitch coupling**

- `[data-a-target="viewer-card"i]`
- `[data-a-target="emote-card"i]`
- `h1,h2,h3,h4,h5,h6` (within viewer/emote cards)

**Storage & messaging**

- `Settings.filter_messages` (read)
- `Settings.highlight_phrases` (read)
- `Settings.highlight_mentions` (read)
- `Settings.highlight_mentions_extra` (read)

<a id="chat-1749"></a>

## Message Highlighter - Popup — L1749–1803
- **Settings keys:** `highlight_mentions_popup`
- **Handlers:** `highlight_mentions_popup`
- **Timers:** `highlight_mentions_popup`
- **RegisterJob:** `highlight_mentions_popup`
- **Labels:** `__HighlightMentionsPopup__`

**Purpose**

Shows a notification footer when the user is mentioned in chat, providing a shortcut to focus the chat input and trigger the reply action for that specific message.

**Runs when**

Triggered by `RegisterJob` if `Settings.highlight_mentions_popup` is enabled; executes for every chat message via `Chat.onmessage`.

**Defines**

- `Handlers.highlight_mentions_popup` — processes chat messages to detect mentions and display the reply footer.
- `Timers.highlight_mentions_popup` — one-shot timeout for the handler.

**Depends on**

`Chat`, `Queue`, `when`, `defined`, `ChatFooter`, `$`, `$log`, `parseBool`, `Settings`, `RegisterJob`, `USERNAME`

**Twitch coupling**

- `[class*="chat-input"i] textarea` — chat input field.
- `button[data-test-selector*="reply"i]` — message reply button.

**Storage & messaging**

`Settings.highlight_mentions_popup`

<a id="chat-1804"></a>

## Native Twitch Reply — L1804–1970
- **Settings keys:** `native_twitch_reply`
- **Handlers:** `native_twitch_reply`
- **Timers:** `native_twitch_reply`
- **RegisterJob:** `native_twitch_reply`
- **Labels:** `__NativeTwitchReply__`

**Purpose**

Adds "Reply" buttons to chat messages; clicking one creates a visual "replying to" bubble above the chat input and modifies the input placeholder.

**Runs when**

- `Settings.native_twitch_reply` is true.
- Every 1000ms (via `Timers.native_twitch_reply`).
- On existing chat messages via `Chat.get()`.
- On new chat messages via `Chat.onmessage`.

**Defines**

- `Handlers.native_twitch_reply` — initializes the reply polyfill, sets up the "Enter" key listener, and triggers button injection.
- `NATIVE_REPLY_POLYFILL` — object containing logic for creating the reply button (`NewReplyButton`) and injecting it into lines (`AddNativeReplyButton`).

**Depends on**

`StopWatch`, `GLOBAL_EVENT_LISTENERS`, `Settings`, `RegisterJob`, `furnish`, `Glyphs`, `Chat`, `USERNAME`, `when`, `parseBool`, `$remark`

**Twitch coupling**

- `[data-a-target="chat-input"i]`
- `.chat-line__reply-icon`
- `.chat-input > :last-child > :first-child > :not(:first-child)`
- `.chat-line__message-container`
- `.chat-line__message`

**Storage & messaging**

- `Settings.native_twitch_reply` (read)

<a id="chat-1971"></a>

## Link maker — L1971–2201
- **Settings keys:** `link_maker__chat`
- **Handlers:** `link_maker__chat`
- **Unhandlers:** `link_maker__chat`
- **Timers:** `link_maker__chat`
- **RegisterJob:** `link_maker__chat`
- **Labels:** `__LinkMaker__`

**Purpose**

Converts links in Twitch chat and reward notifications into visual preview cards. Specifically handles "Blerp" soundbite links by adding embedded audio players and metadata.

**Runs when**

- User setting `Settings.link_maker__chat` is enabled.
- Initialized via `RegisterJob('link_maker__chat')` with a 500ms delay.
- Every chat message received (via `Chat.onmessage`).
- Every 1 second (via `REWARDS_CARDIFIER` interval) to scan reward notifications.

**Defines**

- `Handlers.link_maker__chat` — Main setup function for chat and reward link cardification.
- `Unhandlers.link_maker__chat` — Cleanup function to stop intervals and remove cards.
- `Timers.link_maker__chat` — Delay timer for job registration.
- `LINK_MAKER_ENABLED` — State flag for the feature.
- `CHAT_CARDIFIED` — Cache mapping URLs to their generated card elements.
- `CHAT_CARDIFYING_TIMERS` — Map tracking the start time of URL fetches for latency logging.
- `REWARDS_CARDIFIER` — Interval ID for the Blerp reward scanner.
- `REWARDS_CARDIFIED` — Map tracking cardified rewards.
- `LINK_PARSER` — Instance of `DOMParser` used for processing fetched HTML.

**Depends on**

`Handlers`, `Unhandlers`, `Timers`, `RegisterJob`, `Settings`, `parseBool`, `furnish`, `$`, `$.all`, `nullish`, `defined`, `parseURL`, `fetchURL`, `DOMParser`, `$log`, `$warn`, `$error`, `$remark`, `encodeHTML`, `Chat`, `UUID`, `STREAMER`, `location`

**Twitch coupling**

- `[class*="reward"i][class*="center"i][class*="body"i]` (Reward notification body)
- `[class*="reward"i][class*="center"i][class*="content"i]` (Reward notification content)
- `[id*="reward"i][id*="center"i][id*="header"i]` (Reward notification header)
- `.chat-line__message[@aTarget=chat-line-message]` (Chat message container)
- `.chat-line__message-container` (Chat line wrapper)
- `[class*="chat-paused"i]` (Chat pause state detection)

<a id="chat-2202"></a>

## Auto-chat (VIP) · @dskw1 — L2202–2325
- **Settings keys:** `auto_chat__mentions`, `auto_chat__vip`, `auto_chat__wait_time`, `set`
- **Handlers:** `auto_chat__vip`
- **Timers:** `auto_chat__vip`
- **RegisterJob:** `auto_chat__vip`
- **Labels:** `__AutoChat_VIP__`

**Purpose**

Automatically sends a "lurking" message after a delay based on channel, badge, or permission rules; provides automated AFK replies to mentions.

**Runs when**

One-shot timer (5s delay) after page load, provided `Settings.auto_chat__vip` is enabled.

**Defines**

- `Handlers.auto_chat__vip` — coordinates the lurking message cooldown/selection logic and initializes the AFK mention listener.
- `Timers.auto_chat__vip` — 5-second one-shot timeout to trigger the handler.

**Depends on**

Settings, STREAMER, when, Cache, parseTime, UPDATE_RULES, Chat, USERNAME, parseBool, nullish, defined, $notice, RegisterJob

**Twitch coupling**

- `STREAMER.sole`
- `STREAMER.name`
- `STREAMER.perm`

**Storage & messaging**

- Cache: `auto-chat/${STREAMER.sole}`

<a id="chat-2326"></a>

## Prevent spam — L2326–2401
- **Settings keys:** `prevent_spam`, `prevent_spam_ignore_under`, `prevent_spam_look_back`, `prevent_spam_minimum_length`
- **Handlers:** `prevent_spam`
- **Timers:** `prevent_spam`
- **RegisterJob:** `prevent_spam`
- **Labels:** `__PreventSpam__`

**Purpose**

Detects and hides spam in Twitch chat (exact duplicates within a look-back window or repetitive phrases), replacing the message with a "marked as spam" notice and a tooltip.

**Runs when**

`Settings.prevent_spam` is true; triggered by `RegisterJob('prevent_spam')` after a 1000ms delay (defined in `Timers.prevent_spam`).

**Defines**

- `Handlers.prevent_spam` — Main logic for spam detection and message replacement.
- `Timers.prevent_spam` — One-shot timeout (1000ms) to initialize the handler.

**Depends on**

StopWatch, furnish, $.all, $, Tooltip, USERNAME, Chat, Settings, parseBool, RegisterJob, $remark

**Twitch coupling**

- `[data-test-selector="chat-message-separator"i]`
- `[class*="username-container"i]`
- `.chat-line__message--deleted-notice`

**Storage & messaging**

- `Settings.prevent_spam`
- `Settings.prevent_spam_look_back`
- `Settings.prevent_spam_minimum_length`
- `Settings.prevent_spam_ignore_under`

<a id="chat-2402"></a>

## Simplify Chat — L2402–2498
- **Settings keys:** `simplify_chat`, `simplify_chat_font`, `simplify_chat_monotone_usernames`, `simplify_page_font`
- **Handlers:** `simplify_chat`
- **Unhandlers:** `simplify_chat`
- **Timers:** `simplify_chat`
- **RegisterJob:** `simplify_chat`
- **Labels:** `__SimplifyChat__`

**Purpose**

Simplifies chat appearance by allowing monotone usernames, custom fonts, alternating message background colors, and normalizing text characters to NFKD.

**Runs when**

Triggered by `RegisterJob('simplify_chat')` (always enabled), which executes after a 250ms timeout.

**Defines**

- `Handlers.simplify_chat` — applies chat styling and text normalization to incoming messages.
- `Unhandlers.simplify_chat` — removes custom CSS blocks associated with chat simplification.
- `Timers.simplify_chat` — set to -250 (one-shot timeout).
- `SimplifyChatIndexToggle` — toggles parity for alternating message CSS classes.

**Depends on**

`Settings`, `parseBool`, `AddCustomCSSBlock`, `RemoveCustomCSSBlock`, `Runtime`, `Chat`, `$remark`, `RegisterJob`

**Twitch coupling**

- `[data-a-target="chat-message-username"i]` (CSS)
- `[data-a-target*="chat"i][data-a-target*="message"i]` (CSS)
- `data-plagiarism` (attribute)
- `data-repetitive` (attribute)
- `tt-hidden-message` (attribute)

**Storage & messaging**

- Settings read: `simplify_chat_monotone_usernames`, `simplify_chat_font`, `simplify_page_font`, `simplify_chat`.

<a id="chat-2499"></a>

## Currencies › Convert Bits — L2499–2602
- **Settings keys:** `convert_bits`
- **Handlers:** `convert_bits`
- **Timers:** `convert_bits`
- **RegisterJob:** `convert_bits`
- **Labels:** `__ConvertBits__`

**Purpose**

Displays the USD equivalent (1 bit = $0.01) next to bit amounts in the purchase menu, bit counters, cheers, and hype trains.

**Runs when**

Every 1000ms via `Timers.convert_bits` if `Settings.convert_bits` is enabled.

**Defines**

- `Handlers.convert_bits` — scans page for bit amounts and appends calculated USD values.
- `Timers.convert_bits` — interval set to 1000ms.

**Depends on**

`StopWatch`, `$`, `$.all`, `defined`, `furnish`, `comify`, `parseBool`, `Settings`, `$remark`, `RegisterJob`

**Twitch coupling**

- `[class*="bits-buy"i]`
- `[class*="bits-count"i]`
- `[class*="cheer-amount"i]`
- `[class*="community-highlight-stack"i] p`
- `h5` (within `bits-buy` dropdown)

**Storage & messaging**

`Settings.convert_bits`

<a id="chat-2603"></a>

## Rewards Calculator — L2603–3093
- **Settings keys:** `auto_claim_bonuses`, `rewards_calculator`
- **Handlers:** `rewards_calculator`
- **Timers:** `rewards_calculator`
- **RegisterJob:** `rewards_calculator`
- **Labels:** `__GetMultiplierAmount__`, `__RewardsCalculator__`

**Purpose**

Calculates the time remaining to afford a channel reward based on current balance, broadcast habits, and point multipliers. It adds a visual progress bar to the reward button and injects a localized time estimate via CSS.

**Runs when**

Every 250ms (via `Timers.rewards_calculator`) if `Settings.rewards_calculator` is enabled.

**Defines**

- `Handlers.rewards_calculator` — Main logic for calculating point deficits and updating the UI.
- `CHANNEL_POINTS_MULTIPLIER` — Global cache for the user's current channel points multiplier.
- `REWARDS_CALCULATOR_TEXT` — Global cache for the localized estimation string.

**Depends on**

`StopWatch`, `Settings`, `STREAMER`, `parseBool`, `nullish`, `defined`, `$, $.last`, `parseCoin`, `comify`, `fetchURL`, `AddCustomCSSBlock`, `RemoveCustomCSSBlock`, `top.LANGUAGE`

**Twitch coupling**

- `[data-test-selector*="points"i][data-test-selector*="summary"i] button` — Points summary button.
- `.reward-center-body [href*="//help.twitch.tv/"i]` — Help link used to navigate reward center.
- `[class*="rewards"i][class*="popover"i]` — Points popover container.
- `img[class*="channel"i][class*="points"i], svg` — Multiplier icon/element.
- `[data-test-selector*="required"i][data-test-selector*="points"i]` — Reward cost element.
- `[data-test-selector*="balance-string"i]` — User's current point balance string.

**Storage & messaging**

- `Settings.rewards_calculator` (read)
- `Settings.auto_claim_bonuses` (read)

<a id="chat-3094"></a>

## Customization › Points Receipt (Helper) - NOT A SETTING. This is a hlper for "Points Recei — L3094–3134
- **Settings keys:** `points_receipt_placement`
- **Handlers:** `points_receipt_placement_framed_helper`
- **Timers:** `points_receipt_placement_framed_helper`
- **RegisterJob:** `points_receipt_placement_framed_helper`
- **Labels:** `__PointsReceiptPlacement__`

**Purpose**

Scrapes channel point balance, coin imagery, and prediction debt/change amounts from the chat frame and transmits them to the top window via `postMessage`.

**Runs when**

* Every 1000ms (interval) if `Settings.points_receipt_placement` is truthy.

**Defines**

* `Handlers.points_receipt_placement_framed_helper` — extracts points data from the DOM and posts it to the main window.

**Depends on**

`Settings`, `$.last`, `$`, `parseBool`, `RegisterJob`, `Handlers`, `Timers`

**Twitch coupling**

* `[data-test-selector*="balance-string"i]`
* `[data-test-selector^="prediction-checkout"i]`
* `[data-test-selector*="user-prediction"i]`
* `[class*="points"i][class*="summary"i][class*="add-text"i]`
* `img[alt]` (within balance button)

**Storage & messaging**

* `Settings.points_receipt_placement` (read)
* `top.postMessage` (action: `jump`)

<a id="chat-3135"></a>

## Video Recovery › Recover Chat — L3135–3188
- **Settings keys:** `recover_chat`
- **Handlers:** `recover_chat`
- **Timers:** `recover_chat`
- **RegisterJob:** `recover_chat`
- **Labels:** `__RecoverChat__`

**Purpose**

Restores missing or errored Twitch chat by replacing the chat shell with an iframe loading the popout chat version.

**Runs when**

Every 500ms via `Timers.recover_chat` if `Settings.recover_chat` is enabled.

**Defines**

- `Handlers.recover_chat` — detects chat failure and injects a popout chat iframe.
- `Timers.recover_chat` — interval duration (500ms).

**Depends on**

`$.all`, `$`, `defined`, `nullish`, `furnish`, `parseBool`, `Settings`, `RegisterJob`, `STREAMER`, `StopWatch`

**Twitch coupling**

- `[role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]` (chat detection)
- `[class*="chat"i][class*="content"] .core-error` (error detection)
- `[data-a-target*="welcome"i]` (error reporting target)
- `.chat-shell` (replacement target)
- `./popout/${name}/chat` (popout URL)

**Storage & messaging**

`Settings.recover_chat`

<a id="chat-3189"></a>

## Reocver Messages — L3189–3383
- **Settings keys:** `recover_messages`
- **Handlers:** `recover_messages`
- **Timers:** `recover_messages`
- **RegisterJob:** `recover_messages`
- **Labels:** `__RecoverChat__`

**Purpose**

Restores deleted chat messages by detecting their absence in the DOM and reconstructing their HTML structure using cached message data and emotes.

**Runs when**

* `Settings.recover_messages` is enabled.
* Periodically via `Timers.recover_messages` (default 5000ms).
* Dynamic timer adjustment runs every 1000ms based on the viewer count.

**Defines**

* `RESTORED_MESSAGES` — Set tracking UUIDs of messages already recovered to avoid duplicates.
* `Handlers.recover_messages` — Async function that iterates through cached messages and restores deleted ones to the DOM.
* `Timers.recover_messages` — Interval (ms) for the recovery job.
* `Chat__Initialize_Safe_Mode` — Initialization function that fetches shared data and sets up chat environment globals.

**Depends on**

`StopWatch`, `Chat`, `$, $.all`, `defined`, `parseBool`, `USERNAME`, `furnish`, `nullish`, `TTV_BADGES`, `$notice`, `Settings`, `RegisterJob`, `RestartJob`, `Runtime`, `parseURL`, `floorToNearest`, `clamp`, `suffix`

**Twitch coupling**

* `[data-test-selector*="chat"i][data-test-selector*="message"i][data-test-selector*="container"i]` (message container)
* `[data-a-target^="chat"i] [data-a-target*="deleted"i]` (deleted message indicator)
* `[data-test-selector$="message-placeholder"i]` (message text area)
* `[data-a-target$="viewers-count"i], [class*="stream-info-card"i] [data-test-selector$="description"i]` (viewer count for timer scaling)
* `//static-cdn.jtvnw.net/badges/v1/` (badge image CDN)
* `.chat-line__message`, `.chat-line__username`, `.chat-line__username-container` (CSS classes)

**Storage & messaging**

* `Runtime.sendMessage({ action: 'FETCH_SHARED_DATA' })`

<a id="chat-3384"></a>

## Automation › Greedy Raiding — L3384–3443
- **Settings keys:** `greedy_raiding`
- **Handlers:** `greedy_raiding`
- **Unhandlers:** `greedy_raiding`
- **Timers:** `greedy_raiding`
- **RegisterJob:** `greedy_raiding`
- **Labels:** `__GreedyRaiding__`

**Purpose**

Detects raid banners in iframes to track and log raid events from one channel to another.

**Runs when**

Every 5000ms (via timer) if `Settings.greedy_raiding` is enabled.

**Defines**

- `RAID_LOGGED` — State flag to prevent duplicate logging of the same raid.
- `Handlers.greedy_raiding` — Logic to detect raid banners, extract channel names, and report the event.
- `Timers.greedy_raiding` — Interval for the raiding handler (5000ms).
- `Unhandlers.greedy_raiding` — Empty undo function.

**Depends on**

`$.defined`, `$.all`, `parseBool`, `parseURL`, `$warn`, `Runtime`, `Settings`, `RegisterJob`

**Twitch coupling**

- `[data-test-selector="raid-banner"i]`
- `[data-test-selector*="balance-string"i]`
- `location.pathname` (used to parse the raiding channel name)

**Storage & messaging**

- `Runtime.sendMessage` (action: `LOG_RAID_EVENT`)
- `top.postMessage` (action: `raid`)

<a id="chat-3444"></a>

## Customization › Point Watcher (Helper) — L3444–3533
- **Settings keys:** `point_watcher_placement`
- **Handlers:** `point_watcher_helper`
- **Unhandlers:** `point_watcher_helper`
- **Timers:** `point_watcher_helper`
- **RegisterJob:** `point_watcher_helper`
- **Labels:** `__PointWatcherHelper__`

**Purpose**

Monitors user channel point balance and reward costs, calculating affordability metrics and caching the results for use by other components.

**Runs when**

- Every 15 seconds via `Timers.point_watcher_helper`.
- Once on page load if `Settings.point_watcher_placement` is enabled and the balance button is detected.

**Defines**

- `Handlers.point_watcher_helper` — Updates point balance, calculates rewards not earned, and determines points needed for the next reward.
- `Unhandlers.point_watcher_helper` — Removes `.tt-point-amount` elements from the DOM.
- `Timers.point_watcher_helper` — Sets the helper execution interval to 15,000ms.

**Depends on**

`Cache`, `STREAMER`, `$`, `defined`, `parseBool`, `Settings`, `when`, `RegisterJob`, `parseCoin`, `wait`

**Twitch coupling**

- `[data-test-selector*="balance-string"i]`
- `[data-test-selector="cost"i]`

**Storage & messaging**

- `ChannelPoints` (Cache)

<a id="chat-3534"></a>

## Video Recovery › Soft Unban | tmarenko @ GitHub | https://github.com/tmarenko/twitch_chat_ — L3534–4083
- **Settings keys:** `get`, `soft_unban`, `soft_unban_fade_old_messages`, `soft_unban_keep_bots`, `soft_unban_prevent_clipping`
- **Handlers:** `soft_unban`
- **Unhandlers:** `soft_unban`
- **Timers:** `soft_unban`
- **RegisterJob:** `soft_unban`
- **Labels:** `__SoftUnban__`, `__Static_Helpers__`

**Purpose**

Implements a "Soft Unban" feature that replaces the banned chat UI with a nightdev.com proxy iframe and establishes a custom IRC WebSocket relay to synchronize Twitch chat events (messages, bullets, commands) with the DOM.

**Runs when**

- `Settings.soft_unban` is enabled (via `RegisterJob`).
- `Chat__PAGE_CHECKER` interval (polls for ban status or page readiness on load).
- IRC WebSocket `onmessage` events (triggers specific handlers for `PRIVMSG`, `USERNOTICE`, etc.).

**Defines**

- `Handlers.soft_unban` — Injects the nightdev proxy chat iframe into the Twitch chat layout.
- `Unhandlers.soft_unban` — Removes the proxy iframe and restores a default flex container.
- `Timers.soft_unban` — One-shot timeout (2500ms) for starting the soft unban process.
- `Chat__PAGE_CHECKER` — Interval that monitors page state to trigger initialization or safe mode.
- `Chat__WAIT_FOR_PAGE` — Logic for determining if the Twitch page is fully loaded and ready.

**Depends on**

`STREAMER`, `Settings`, `furnish`, `parseURL`, `parseBool`, `wait`, `when`, `TTV_IRC`, `Search`, `UUID`, `Chat`, `IS_A_FRAMED_CONTAINER`, `PATHNAME`, `NORMALIZED_PATHNAME`, `PAGE_IS_READY`, `THEME`

**Twitch coupling**

- `.chat-room__content > .tt-flex` — Old chat content container.
- `.chat-input` — Chat input area for banner injection.
- `[data-a-target="follow-button"i], [data-a-target="unfollow-button"i]` — Readiness check.
- `[data-test-selector*="sad"i][data-test-selector*="overlay"i]` — Ad detection.
- `[data-test-selector$="message-container"i]` — Chat message container.
- `[data-a-user="${ author }"i]` — User-specific message identification.
- `[data-test-selector$="message-body"i], [class*="message-container"i]` — Message text source.

**Storage & messaging**

- Settings: `soft_unban`, `soft_unban_fade_old_messages`, `soft_unban_keep_bots`, `soft_unban_prevent_clipping`.
- Custom Events: `locationchange`.
- API: `Settings.get()`.

<a id="chat-4084"></a>

## Video Recovery › Soft Unban | tmarenko @ GitHub | https://github.com/tmarenko/twitch_chat_ (cont.) — L4084–4451
- **Settings keys:** `keep_popout`, `onInstalledReason`, `recover_chat`, `set`

**Purpose**

Synchronizes chat state by processing WebSocket messages/whispers, scraping the DOM for missed messages ("catch-up"), parsing pinned messages, and managing the lifecycle of background jobs.

**Runs when**

- WebSocket events (`onmessage`, `onerror`, `onclose`).
- `top.onlocationchange` event.
- `when` polling for specific DOM elements (chat containers, pinned message markers).
- `Chat__SETTING_RELOADER` and `Chat__PAGE_CHECKER` intervals.
- Extension installation (`Settings.onInstalledReason === INSTALL`).

**Defines**

- `window.RegisterJob` — Registers/starts a job from `Handlers` using `Timers` (supports intervals or one-shot timeouts).
- `PinnedMessageHandler` — Extracts data from pinned chat messages and dispatches them to `Chat.__onpinned__`.
- `Chat__SETTING_RELOADER` — Global interval that polls `top.REFRESH_ON_CHILD` to restart specific jobs.

**Depends on**

`when`, `parseBool`, `Settings`, `wait`, `TTV_IRC`, `CHANNEL`, `CHAT_SELF_REFLECTOR`, `UUID`, `Chat`, `PAGE_IS_READY`, `Jobs`, `Timers`, `Handlers`, `RestartJob`, `AddCustomCSSBlock`, `parseURL`, `top`, `AsteriskFn`, `NORMAL_MODE`, `Chat__WAIT_FOR_PAGE`, `INSTALL`

**Twitch coupling**

- `[data-test-selector$="message-container"i]`
- `[data-a-target="chat-line-message"i]`
- `[data-a-target*="delete"i]`
- `[class*="pinned"i][class*="chat"i][class*="area"i]`
- `[data-a-user]`
- `[class*="username"i][class*="container"i] [data-a-target*="badge"i] img`
- `[class*="message"i][class*="container"i]`

**Storage & messaging**

- `Settings.recover_chat`, `Settings.keep_popout`, `Settings.onInstalledReason` (read/write).
- `top.REFRESH_ON_CHILD` (read/pop).
- `top.VOLATILE` (read).
