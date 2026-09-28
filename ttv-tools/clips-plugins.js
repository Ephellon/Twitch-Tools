globalThis.SETTINGS_DEFAULTS ??= Object.freeze({"auto_accept_mature":false,"auto_claim_bonuses":true,"claim_drops":true,"claim_drops__interval":"10","claim_loot":false,"away_mode":true,"away_mode__hide_chat":false,"away_mode__volume_control":false,"away_mode__volume":0.25,"first_in_line_none":true,"first_in_line_now":false,"first_in_line":false,"first_in_line_time_minutes":"15","first_in_line_plus":false,"first_in_line_plus_time_minutes":"15","first_in_line_all":false,"first_in_line_all_time_minutes":"15","up_next__one_instance":false,"live_reminders":true,"keep_live_reminders":false,"auto_follow_none":true,"auto_follow_raids":false,"auto_follow_time":false,"auto_follow_time_minutes":"15","auto_follow_all":false,"kill_extensions":false,"next_channel_preference":"random","parse_commands":false,"parse_commands__create_links":true,"prevent_raiding":"none","greedy_raiding":false,"claim_prime":false,"claim_prime__max_claims":"3","stay_live":true,"stay_live__ignore_channel_reruns":false,"time_zones":false,"view_mode":"null","bttv_emotes":false,"auto_load_bttv_emotes":false,"bttv_emotes_channel":false,"bttv_emotes_location":"emotes/shared/trending","bttv_emotes_extras":"","bttv_emotes_maximum":"150","filter_messages":true,"filter_messages__bullets_raid":false,"filter_messages__bullets_coin":false,"filter_messages__bullets_subs":false,"filter_messages__bullets_note":false,"filter_messages__bullets_paid":false,"highlight_mentions":true,"highlight_phrases":false,"link_maker__chat":false,"auto_chat__mentions":"null","auto_chat__wait_time":"5","native_twitch_reply":false,"mention_audio":false,"phrase_audio":false,"whisper_audio":false,"whisper_audio_sound":"goes-without-saying-608","prevent_spam":true,"prevent_spam_look_back":"15","prevent_spam_minimum_length":"5","prevent_spam_ignore_under":"5","recover_chat":false,"recover_messages":false,"highlight_mentions_popup":true,"convert_bits":true,"channelpoints_receipt_display":"null","rewards_calculator":false,"accent_color":"twitch-purple/12","block_banners":false,"context_menu_override":false,"away_mode_placement":"null","hide_blank_ads":false,"points_receipt_placement":"null","point_watcher_placement":"null","stream_preview":false,"stream_preview_position":"3","stream_preview_scale":"1","stream_preview_sound":false,"watch_time_placement":"null","sync-token":"TTV-TOOL","store_integration":true,"store_integration__steam":true,"store_integration__playstation":true,"store_integration__xbox":true,"store_integration__nintendo":true,"store_integration__epic":true,"video_clips__file_type":"x-matroska","video_clips__quality":"auto","video_clips__length":"60","video_clips__dvr":false,"video_clips__trophy":false,"video_clips__trophy_length":"60","record_foreign_rewards":false,"keep_popout":false,"recover_ads":false,"recover_frames":true,"recover_frames__allow_embed":false,"recover_pages":false,"recover_stream":false,"recover_video":true,"display_in_console":false,"display_in_console__log":true,"display_in_console__warn":true,"display_in_console__error":true,"display_in_console__remark":true,"display_in_console__notice":true,"display_in_console__ignore":true,"show_stats":false,"experimental_mode":false,"extra_keyboard_shortcuts":true,"low_data_mode":false,"fine_details":false,"auto_tab_reloads":true,"auto_focus":false,"convert_emotes":false,"soft_unban":false,"soft_unban_fade_old_messages":false,"soft_unban_keep_bots":false,"soft_unban_prevent_clipping":false,"user_language_preference":"en"});
(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // src/lib/plugins.js
  var PLUGINS = globalThis.__TTV_PLUGINS__ ??= /* @__PURE__ */ new Map();
  function plugin(definition) {
    const { id } = definition;
    if (PLUGINS.has(id))
      throw new Error(`Plugin "${id}" is already registered`);
    const job = definition.job ?? id;
    PLUGINS.set(id, {
      frames: ["main"],
      /**
       * Determines if the feature is enabled based on the provided settings.
       * @param {Object} settings - The current configuration settings
       * @returns {boolean} True if the feature is enabled
       */
      enabled: /* @__PURE__ */ __name((settings) => parseBool(settings[job]), "enabled"),
      ...definition,
      job
    });
  }
  __name(plugin, "plugin");
  async function start(frame, context = {}) {
    for (const [id, feature] of PLUGINS)
      if (feature.frames.includes(frame) && !feature.started)
        await run(id, context);
  }
  __name(start, "start");
  async function run(id, context = {}) {
    var _a, _b;
    const feature = PLUGINS.get(id);
    if (!feature)
      throw new Error(`No plugin "${id}"`);
    feature.started = true;
    if (feature.install)
      return await feature.install(context);
    const { job } = feature;
    await ((_a = feature.init) == null ? void 0 : _a.call(feature, context));
    Handlers[job] = (...args) => feature.handler(context, ...args);
    if ("timer" in feature)
      Timers[job] = feature.timer;
    if (feature.unhandler)
      Unhandlers[job] = (...args) => feature.unhandler(context, ...args);
    if (await feature.enabled(Settings, context)) {
      await ((_b = feature.setup) == null ? void 0 : _b.call(feature, context));
      if (feature.register !== false)
        RegisterJob(job);
    }
  }
  __name(run, "run");

  // src/plugins/clips/save-ttv-clips.js
  plugin({
    id: "clips.save_ttv_clips",
    job: "save_ttv_clips",
    timer: -500,
    /**
     * Extracts clip data and inserts a direct download link into the Twitch clip page or editor.
     */
    handler: /* @__PURE__ */ __name(() => {
      var _a, _b, _c;
      const EDITOR_MODE = location.pathname.equals("/create");
      const { src } = $("video");
      let title, author, original, textContainer, placeBefore, carryQuery;
      if (EDITOR_MODE) {
        title = new ClipName(2);
        author = window.USERNAME ?? ((_a = $('[data-a-target="user-display-name"i]')) == null ? void 0 : _a.textContent) ?? "";
        original = (_b = $(carryQuery = '[data-a-target*="label"i][data-a-target*="text"i]')) == null ? void 0 : _b.closest("[style]");
        placeBefore = original;
        if (nullish(original))
          return;
        $notice("Clip editor mode.");
      } else {
        const [streamerInfo, , clipInfo] = $.all('[class*="clip"i][class*="info"i]');
        let [views, meta] = clipInfo.children;
        const [clipTitle, data] = meta.children;
        let [timestamp, clipAuthor] = $.queryBy("span, a", data);
        views = parseInt(views.textContent.replace(/\D+/g, ""));
        title = clipTitle.innerText;
        timestamp = -parseTime(timestamp.innerText);
        author = clipAuthor.innerText;
        original = $('[class*="social"i][class*="button"i]:is([class*="copy"i], [class*="clip"i])').closest('[class*="social"i]:not(button, [class*="icon"i])').parentElement;
        placeBefore = original.parentElement.lastElementChild;
        carryQuery = ".tw-tooltip";
        $notice("Clip data!", { src, views, title, timestamp, author });
      }
      const { filename } = parseURL(src);
      let [ext, ...name] = filename.split(".").reverse();
      name = name.join(".");
      const parent = original.parentElement;
      const container = original.cloneNode(true);
      const button = $("button", container);
      const id = "tt_download_link";
      for (const child of $.all('[class*="clip"i]', container))
        for (const key of child.classList)
          child.classList.replace(key, key.replaceAll("clip", "download"));
      textContainer ??= $(carryQuery, container);
      button.parentElement.setAttribute("aria-describedby", textContainer.id = id);
      textContainer.innerText = `Download this clip`;
      if (EDITOR_MODE)
        textContainer.innerHTML = furnish(`a#tt-download__${author.replace(/\W+/g, "")}__${title.replace(/\W+/g, "_")}`, { href: src, download: title, style: `color:inherit!important` }, "Download").outerHTML;
      else
        (_c = $("figure", button)) == null ? void 0 : _c.replaceWith(furnish(`a#tt-download__${author.replace(/\W+/g, "")}__${title.replace(/\W+/g, "_")}`, { href: src, download: title }, Glyphs.utf8.download));
      parent.insertBefore(container, placeBefore);
    }, "handler"),
    /**
     * Checks if the clip saving feature is enabled.
     * @returns {boolean} Whether the feature should be active
     */
    enabled() {
      return true;
    }
  });

  // src/plugins/clips/index.js
  globalThis.TTV ??= { plugin, plugins: PLUGINS, run, start };
})();
