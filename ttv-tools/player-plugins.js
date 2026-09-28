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

  // src/plugins/player/auto-accept-mature.js
  plugin({
    id: "player.auto_accept_mature",
    job: "auto_accept_mature",
    timer: -1e3,
    /**
     * Runs every tick: Automatically clicks confirmation buttons for mature content overlays or similar dismissible notices.
     */
    handler: /* @__PURE__ */ __name(() => {
      $.all(':is([data-a-target*="overlay"i], [data-a-target*="watchparty"i]) button, .home [data-a-target^="home"i], [data-test-selector*="mute"i][data-test-selector*="dismiss"i]').map((button) => button.click());
    }, "handler")
  });

  // src/plugins/player/recover-video.js
  var RECOVERING_VIDEO;
  plugin({
    id: "player.recover_video",
    job: "recover_video",
    timer: 5e3,
    /**
     * Initializes the video recovery state.
     */
    init() {
      RECOVERING_VIDEO = false;
    },
    /**
     * Runs every tick: Detects player errors and recovers by moving to the next streamer for restricted content or clicking the error button.
     * @param {Object} context - Contains the StopWatch utility
     */
    handler: /* @__PURE__ */ __name(async ({ StopWatch }) => {
      var _a, _b;
      new StopWatch("recover_video");
      const errorMessage = $('[data-a-target*="player"i]:is([data-a-target*="content"i], [data-a-target*="gate"i]) [data-a-target*="text"i]');
      if (nullish(errorMessage))
        return StopWatch.stop("recover_video");
      if (RECOVERING_VIDEO)
        return StopWatch.stop("recover_video");
      RECOVERING_VIDEO = true;
      $error("The stream ran into an error:", errorMessage.textContent, /* @__PURE__ */ new Date());
      if (/\b(subscribe|mature)\b/i.test(errorMessage.textContent)) {
        const next = await ((_a = window.GetNextStreamer) == null ? void 0 : _a.call(window));
        if (defined(next))
          goto(parseURL(next.href).addSearch({ tool: "video-recovery--non-subscriber" }).href);
      } else {
        (_b = $("button", errorMessage) ?? errorMessage.closest("button")) == null ? void 0 : _b.click();
        addToSearch({ "tt-err-vid": "video-recovery--player-error" });
        RECOVERING_VIDEO = false;
      }
      StopWatch.stop("recover_video");
    }, "handler")
  });

  // src/plugins/player/hide-blank-ads.js
  var BLANK_AD_PRESENCE;
  plugin({
    id: "player.hide_blank_ads",
    job: "hide_blank_ads",
    timer: 500,
    /**
     * Initializes the blank ad detection state.
     */
    init() {
      BLANK_AD_PRESENCE = false;
    },
    /**
     * Runs every tick: Detects blank advertisements by comparing the current video frame against a known blank-ad banner.
     */
    handler: /* @__PURE__ */ __name(() => {
      if ($.defined('[data-a-target*="ad-countdown"i]'))
        return window.postMessage({ action: "report-blank-ad", from: "player.js", purple: true }, "*");
      const video = $("video");
      if (nullish(video))
        return;
      const capture = video.captureFrame(), banner = Runtime.getURL("twitch-banner.png");
      resemble(capture).compareTo(banner).ignoreColors().scaleToSameSize().onComplete(async (data) => {
        let { analysisTime, misMatchPercentage } = data;
        analysisTime = parseInt(analysisTime);
        misMatchPercentage = parseFloat(misMatchPercentage);
        const matchPercentage = 100 - misMatchPercentage, isBlankAd = matchPercentage > 80;
        if (BLANK_AD_PRESENCE == isBlankAd)
          return;
        BLANK_AD_PRESENCE = isBlankAd;
        window.postMessage({ action: "report-blank-ad", from: "player.js", purple: isBlankAd }, "*");
      });
    }, "handler")
  });

  // src/plugins/player/auto-dvr.js
  plugin({
    id: "player.auto_dvr",
    job: "auto_dvr",
    timer: 500,
    /**
     * Runs every tick: Automatically records a live stream if requested via URL and downloads the recording once the stream ends.
     */
    handler: /* @__PURE__ */ __name(() => {
      const { action = "", channel, autosave, controls, filetype, quality, slug, volume } = parseURL(window.location).searchParameters;
      if (action.unlike("dvr"))
        return;
      const video = $("video");
      const live = $.nullish('[class*="channel-status"i][class*="offline"i]');
      if (nullish(video) || !live)
        return parseBool(autosave) ? video == null ? void 0 : video.stopRecording() : null;
      if (defined(video.__recorder__))
        return;
      video.startRecording(Infinity, { mimeType: `video/${filetype}` }).then((chunks) => {
        const blob = new Blob(chunks, { type: chunks.type });
        const link = furnish(`a#${slug}`, { href: URL.createObjectURL(blob), download: `${slug}.${window.MIME_Types.find(video.mimeType)}`, hidden: true }, slug);
        $.head.append(link);
        link.click();
      }).catch($warn).finally(() => {
        const link = $(`#${slug}`);
        URL.revokeObjectURL(link == null ? void 0 : link.href);
        link == null ? void 0 : link.remove();
        window.postMessage({ action: "report-offline-dvr", from: "player.js", slug }, "*");
      });
    }, "handler"),
    /**
     * Determines if the auto-DVR feature should be enabled based on settings.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return true;
    }
  });

  // src/plugins/player/miscellaneous.js
  plugin({
    id: "player.miscellaneous",
    /**
     * Sets up miscellaneous player enhancements, including automatic unmuting for embeds and adding navigation links for private viewing.
     */
    async install() {
      var _a;
      Miscellaneous: {
        __UnmuteEmbed__: {
          let { channel, controls, muted, parent, quality } = parseURL(window.location).searchParameters;
          controls = parseBool(controls);
          muted = parseBool(muted);
          if (!controls && !muted)
            (_a = $('figure[tt-svg-label~="unmute"i]')) == null ? void 0 : _a.click();
          if (muted) {
            let viewerTouched = false;
            const silence = /* @__PURE__ */ __name((video) => {
              video.muted = true;
              video.addEventListener("volumechange", () => viewerTouched || (video.muted = true));
            }, "silence");
            $.on("pointerdown", ({ isTrusted }) => viewerTouched ||= isTrusted);
            $.on("keydown", ({ isTrusted }) => viewerTouched ||= isTrusted);
            when.defined(() => $("video")).then(silence);
          }
        }
        __PopinButton__: {
          let { channel, controls, muted, parent, quality, private: isPrivate = false } = parseURL(window.location).searchParameters;
          controls = parseBool(controls);
          muted = parseBool(muted);
          isPrivate = parseBool(isPrivate);
          if (isPrivate) {
            $('[data-test-selector*="video-player"i][data-test-selector*="container"]').append(
              furnish("a#player-to-top", {
                href: `//www.twitch.tv/${channel}`,
                target: "_top",
                style: `z-index:9;position:absolute;bottom:-100%;left:50%;transform:translate(-50%);text-shadow:0 0 4px #8888;transition:all 0.5s;background-color:var(--color-background-button-primary-default);padding:.25rem .5rem;border-radius:3px;color:white;text-decoration:none;`,
                innerHTML: `&swarr; Go to ${channel}`
              })
            );
            AddCustomCSSBlock("player-to-top", `[data-test-selector*="video-player"i][data-test-selector*="container"]:hover #player-to-top{bottom:0!important} #player-to-top:hover{background-color:var(--color-background-button-primary-hover)!important}`);
          }
        }
      }
    }
  });

  // src/plugins/player/index.js
  globalThis.TTV ??= { plugin, plugins: PLUGINS, run, start };
})();
