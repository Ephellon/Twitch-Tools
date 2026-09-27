# Feature catalog

One row per option on the Settings page, mapped to the code that reads it. Generated in Phase 1 (see `REVAMP.md`); section links go to the per-file digests in `docs/sections/`.

## Automation

| Feature | Settings | Code |
|---|---|---|
| Auto-Join | `auto_accept_mature` | [tools.js L3204](sections/tools.md#tools-3204)<br>[tools.js L5732](sections/tools.md#tools-5732)<br>[player.js L72](sections/player.md#player-72) |
| Claim Bonuses | `auto_claim_bonuses` | [tools.js L16674](sections/tools.md#tools-16674)<br>[chat.js L98](sections/chat.md#chat-98)<br>[chat.js L2603](sections/chat.md#chat-2603) |
| Claim Drops <sub>since 5.32.14</sub> | `claim_drops`, `claim_drops__interval` | [tools.js L7297](sections/tools.md#tools-7297) |
| Claim Prime Loot <sub>since 3.2</sub> | `claim_loot` | [tools.js L6421](sections/tools.md#tools-6421) |
| Easy Lurk <sub>since 4.12</sub> | `away_mode`, `away_mode__hide_chat`, `away_mode__volume_control`, `away_mode__volume` | [core.js L2125](sections/core.md#core-2125)<br>[tools.js L2685](sections/tools.md#tools-2685)<br>[tools.js L3204](sections/tools.md#tools-3204)<br>[tools.js L6086](sections/tools.md#tools-6086)<br>[tools.js L16674](sections/tools.md#tools-16674) |
| First in Line / Up Next | `first_in_line_none`, `first_in_line_now`, `first_in_line`, `first_in_line_time_minutes`, `first_in_line_plus`, `first_in_line_plus_time_minutes` … | [tools.js L2685](sections/tools.md#tools-2685)<br>[tools.js L3782](sections/tools.md#tools-3782)<br>[tools.js L8466](sections/tools.md#tools-8466)<br>[tools.js L8851](sections/tools.md#tools-8851)<br>[tools.js L16674](sections/tools.md#tools-16674) |
| Follows | `auto_follow_none`, `auto_follow_raids`, `auto_follow_time`, `auto_follow_time_minutes`, `auto_follow_all` | [tools.js L11404](sections/tools.md#tools-11404) |
| Kill Extensions | `kill_extensions` | [tools.js L11485](sections/tools.md#tools-11485) |
| Next Channel <sub>since 4.1.8</sub> | `next_channel_preference` | [tools.js L3782](sections/tools.md#tools-3782) |
| Parse Commands <sub>since 4.30</sub> | `parse_commands`, `parse_commands__create_links` | [tools.js L11485](sections/tools.md#tools-11485) |
| Prevent Hosting | `prevent_hosting` | [tools.js L12135](sections/tools.md#tools-12135) |
| Prevent Raiding <sub>since 4.12.11</sub> | `prevent_raiding`, `greedy_raiding` | [tools.js L2685](sections/tools.md#tools-2685)<br>[tools.js L12196](sections/tools.md#tools-12196)<br>[tools.js L3204](sections/tools.md#tools-3204)<br>[tools.js L12329](sections/tools.md#tools-12329)<br>[chat.js L3384](sections/chat.md#chat-3384) |
| Prime Subscription | `claim_prime`, `claim_prime__max_claims` | [tools.js L6492](sections/tools.md#tools-6492) |
| Stay Live <sub>since 4.5</sub> | `stay_live`, `stay_live__ignore_channel_reruns` | [tools.js L3782](sections/tools.md#tools-3782)<br>[tools.js L12394](sections/tools.md#tools-12394) |
| Time Zones <sub>since 4.12.14</sub> | `time_zones` | [tools.js L13033](sections/tools.md#tools-13033) |
| View Mode <sub>since 3.1.5</sub> | `view_mode` | [tools.js L3204](sections/tools.md#tools-3204)<br>[tools.js L13793](sections/tools.md#tools-13793)<br>[tools.js L16674](sections/tools.md#tools-16674) |

## Chat & Messaging

| Feature | Settings | Code |
|---|---|---|
| Accessibility <sub>since 5.32.7</sub> | `simplify_chat`, `simplify_chat_monotone_usernames`, `simplify_chat_font`, `simplify_chat_reverse_emotes`, `simplify_look_auto_marquee`, `simplify_page_font` | [chat.js L2402](sections/chat.md#chat-2402)<br>[tools.js L9726](sections/tools.md#tools-9726) |
| BetterTTV Emotes | `bttv_emotes`, `auto_load_bttv_emotes`, `bttv_emotes_channel`, `bttv_emotes_location`, `bttv_emotes_extras`, `bttv_emotes_maximum` | [tools.js L1](sections/tools.md#tools-1)<br>[tools.js L3204](sections/tools.md#tools-3204)<br>[chat.js L1](sections/chat.md#chat-1)<br>[chat.js L291](sections/chat.md#chat-291)<br>[chat.js L404](sections/chat.md#chat-404) |
| Filter Messages <sub>since 5.8</sub> | `filter_messages`, `filter_messages__bullets_raid`, `filter_messages__bullets_coin`, `filter_messages__bullets_subs`, `filter_messages__bullets_note`, `filter_messages__bullets_paid` | [tools.js L2685](sections/tools.md#tools-2685)<br>[tools.js L3204](sections/tools.md#tools-3204)<br>[chat.js L1246](sections/chat.md#chat-1246)<br>[chat.js L1332](sections/chat.md#chat-1332)<br>[chat.js L1677](sections/chat.md#chat-1677) |
| Highlight Mentions | `highlight_mentions`, `highlight_mentions_extra` | [chat.js L1677](sections/chat.md#chat-1677) |
| Highlight Phrases <sub>since 4.1</sub> | `highlight_phrases` | [tools.js L2685](sections/tools.md#tools-2685)<br>[tools.js L3204](sections/tools.md#tools-3204)<br>[chat.js L1487](sections/chat.md#chat-1487)<br>[chat.js L1573](sections/chat.md#chat-1573)<br>[chat.js L1677](sections/chat.md#chat-1677) |
| Link Maker <sub>since 5.16</sub> | `link_maker__chat` | [chat.js L1971](sections/chat.md#chat-1971) |
| Lurking Message <sub>since 5.32.5</sub> | `auto_chat__vip`, `auto_chat__mentions`, `auto_chat__wait_time` | [chat.js L2202](sections/chat.md#chat-2202) |
| Native Reply | `native_twitch_reply` | [tools.js L3204](sections/tools.md#tools-3204)<br>[chat.js L1804](sections/chat.md#chat-1804) |
| Notification Sounds <sub>since 4.1</sub> | `mention_audio`, `phrase_audio`, `whisper_audio`, `whisper_audio_sound` | [tools.js L2685](sections/tools.md#tools-2685)<br>[tools.js L13977](sections/tools.md#tools-13977)<br>[tools.js L14040](sections/tools.md#tools-14040) |
| Prevent Spam | `prevent_spam`, `prevent_spam_look_back`, `prevent_spam_minimum_length`, `prevent_spam_ignore_under` | [chat.js L2326](sections/chat.md#chat-2326) |
| Recover Chat | `recover_chat` | [tools.js L17774](sections/tools.md#tools-17774)<br>[chat.js L3135](sections/chat.md#chat-3135)<br>[chat.js L4084](sections/chat.md#chat-4084) |
| Recover Messages <sub>since 5.28</sub> | `recover_messages` | [chat.js L3189](sections/chat.md#chat-3189) |
| Show Pop-ups | `highlight_mentions_popup` | [chat.js L1749](sections/chat.md#chat-1749) |

## Currencies

| Feature | Settings | Code |
|---|---|---|
| Convert Bits | `convert_bits` | [chat.js L2499](sections/chat.md#chat-2499) |
| Channel Points Receipt | `channelpoints_receipt_display` | [tools.js L14323](sections/tools.md#tools-14323) |
| Rewards Calculator | `rewards_calculator` | [chat.js L2603](sections/chat.md#chat-2603) |

## Customization

| Feature | Settings | Code |
|---|---|---|
| Accent Color <sub>since 4.2.0</sub> | `accent_color` | [tools.js L121](sections/tools.md#tools-121)<br>[tools.js L6086](sections/tools.md#tools-6086)<br>[tools.js L7916](sections/tools.md#tools-7916)<br>[tools.js L17224](sections/tools.md#tools-17224) |
| Block Banners <sub>since 5.33.4.8</sub> | `block_banners` | [tools.js L14120](sections/tools.md#tools-14120) |
| Context Menu Override <sub>since 5.34</sub> | `context_menu_override` | [tools.js L3204](sections/tools.md#tools-3204) |
| Easy Lurk | `away_mode_placement` | [tools.js L2685](sections/tools.md#tools-2685)<br>[tools.js L6086](sections/tools.md#tools-6086) |
| Hide Blank Ads <sub>since 4.15</sub> | `hide_blank_ads` | [player.js L153](sections/player.md#player-153) |
| Points Receipt & Rank | `points_receipt_placement` | [tools.js L2685](sections/tools.md#tools-2685)<br>[tools.js L4186](sections/tools.md#tools-4186)<br>[tools.js L14323](sections/tools.md#tools-14323)<br>[tools.js L16674](sections/tools.md#tools-16674)<br>[chat.js L3094](sections/chat.md#chat-3094) |
| Point Watcher | `point_watcher_placement` | [tools.js L14660](sections/tools.md#tools-14660)<br>[chat.js L3444](sections/chat.md#chat-3444) |
| Stream Preview <sub>since 5.15</sub> | `stream_preview`, `stream_preview_position`, `stream_preview_scale`, `stream_preview_sound` | [tools.js L7366](sections/tools.md#tools-7366)<br>[tools.js L14895](sections/tools.md#tools-14895)<br>[tools.js L16674](sections/tools.md#tools-16674) |
| Watch Time | `watch_time_placement` | [tools.js L2685](sections/tools.md#tools-2685)<br>[tools.js L15096](sections/tools.md#tools-15096)<br>[tools.js L16674](sections/tools.md#tools-16674) |

## Networking

| Feature | Settings | Code |
|---|---|---|
| Export Settings <sub>since 5.32</sub> | `sync-token` | — |
| Store Integration <sub>since 5.29</sub> | `store_integration`, `store_integration__steam`, `store_integration__playstation`, `store_integration__xbox`, `store_integration__nintendo`, `store_integration__epic` | [tools.js L9726](sections/tools.md#tools-9726)<br>[tools.js L9937](sections/tools.md#tools-9937)<br>[tools.js L10174](sections/tools.md#tools-10174)<br>[tools.js L10474](sections/tools.md#tools-10474)<br>[tools.js L10838](sections/tools.md#tools-10838) |
| Video Clips <sub>since 5.32.4</sub> | `video_clips__file_type`, `video_clips__quality`, `video_clips__length`, `video_clips__dvr`, `video_clips__trophy`, `video_clips__trophy_length` … | [tools.js L3204](sections/tools.md#tools-3204)<br>[tools.js L6558](sections/tools.md#tools-6558)<br>[tools.js L7916](sections/tools.md#tools-7916)<br>[tools.js L15365](sections/tools.md#tools-15365) |

## Video Recovery

| Feature | Settings | Code |
|---|---|---|
| Keep Pop-outs | `keep_popout` | [tools.js L17224](sections/tools.md#tools-17224)<br>[chat.js L4084](sections/chat.md#chat-4084) |
| RAM Alarms <sub>since 5.35.1</sub> | `ram_low`, `ram_onlow`, `ram_medium`, `ram_onmedium`, `ram_high`, `ram_onhigh` … | [background.js L1](sections/background.md#background-1)<br>[background.js L512](sections/background.md#background-512) |
| Recover Ads | `recover_ads` | [tools.js L16069](sections/tools.md#tools-16069) |
| Recover Frames <sub>since 4.12.4</sub> | `recover_frames`, `recover_frames__allow_embed` | [tools.js L15873](sections/tools.md#tools-15873) |
| Recover Pages | `recover_pages` | [tools.js L16284](sections/tools.md#tools-16284)<br>[tools.js L16674](sections/tools.md#tools-16674) |
| Recover Stream | `recover_stream` | [tools.js L16069](sections/tools.md#tools-16069) |
| Recover Video | `recover_video` | [tools.js L16160](sections/tools.md#tools-16160)<br>[player.js L72](sections/player.md#player-72) |

## Developer Features

| Feature | Settings | Code |
|---|---|---|
| Display Console Messages | `display_in_console`, `display_in_console__log`, `display_in_console__warn`, `display_in_console__error`, `display_in_console__remark`, `display_in_console__notice` … | [tools.js L3782](sections/tools.md#tools-3782) |
| Display Statistics | `show_stats` | [tools.js L4186](sections/tools.md#tools-4186)<br>[tools.js L5774](sections/tools.md#tools-5774)<br>[tools.js L6558](sections/tools.md#tools-6558)<br>[tools.js L14323](sections/tools.md#tools-14323)<br>[tools.js L15096](sections/tools.md#tools-15096) |
| Experimental Features | `experimental_mode` | [tools.js L3782](sections/tools.md#tools-3782)<br>[tools.js L16363](sections/tools.md#tools-16363) |
| Extra Keyboard Shortcuts <sub>since 4.12.13</sub> | `extra_keyboard_shortcuts` | [tools.js L16363](sections/tools.md#tools-16363) |
| Low Data Usage <sub>since 4.30</sub> | `low_data_mode`, `est-data-usage` | [tools.js L1065](sections/tools.md#tools-1065)<br>[tools.js L6086](sections/tools.md#tools-6086) |
| Use Fine Details | `fine_details` | [core.js L2125](sections/core.md#core-2125)<br>[tools.js L3204](sections/tools.md#tools-3204)<br>[tools.js L4868](sections/tools.md#tools-4868) |
| Automatic Tab Reloads | `auto_tab_reloads` | [tools.js L17774](sections/tools.md#tools-17774) |
| Show Default Values |  | — |

## Experimental Features

| Feature | Settings | Code |
|---|---|---|
| Auto-Focus | `auto_focus`, `auto_focus_detection_threshold`, `auto_focus_poll_interval`, `auto_focus_poll_image_type` | [tools.js L3204](sections/tools.md#tools-3204)<br>[tools.js L5774](sections/tools.md#tools-5774) |
| Convert emotes | `convert_emotes` | [tools.js L3204](sections/tools.md#tools-3204)<br>[chat.js L291](sections/chat.md#chat-291)<br>[chat.js L885](sections/chat.md#chat-885) |
| Soft Unban <sub>since 3.1</sub> | `soft_unban`, `soft_unban_fade_old_messages`, `soft_unban_keep_bots`, `soft_unban_prevent_clipping` | [tools.js L3204](sections/tools.md#tools-3204)<br>[chat.js L3534](sections/chat.md#chat-3534) |

## Settings read in code with no control on the Settings page

`auto_badge`, `claim_reward`, `game_overview_card`, `phone_number`
