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

  // src/plugins/chat/auto-claim-bonuses.js
  plugin({
    id: "chat.auto_claim_bonuses",
    job: "auto_claim_bonuses",
    timer: 2500,
    /**
     * Automatically claims available channel point bonuses and adds a status indicator to the UI.
     * @param {Object} context - Plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
      new context.StopWatch("auto_claim_bonuses");
      const ChannelPoints = ((_a = $('[class*="bonus"i]')) == null ? void 0 : _a.closest("button")) ?? $('[data-test-selector*="points"i][data-test-selector*="summary"i] button[class*="success"i]') ?? $('[data-test-selector*="points"i][data-test-selector*="summary"i] button:is([class*="destruct"i], [class*="error"i])') ?? ((_b = $('[class*="points"i] button [class*="bonus"i]')) == null ? void 0 : _b.closest("button")), Enabled = Settings.auto_claim_bonuses && parseBool(((_c = $("#tt-auto-claim-bonuses")) == null ? void 0 : _c.getAttribute("tt-auto-claim-enabled")) ?? $('[data-a-page-loaded-name="PopoutChatPage"i]'));
      if (Enabled && defined(ChannelPoints)) {
        ChannelPoints.click();
        let playedAnimation;
        when.defined(() => $('.pulse-animation [class*="channel"i][class*="points"i]')).then((ok) => playedAnimation = ok);
        wait(1e4).then(() => top.TWITCH_INTEGRITY_FAIL = !playedAnimation);
      }
      try {
        const BonusChannelPointsSVG = Glyphs.modify("bonuschannelpoints", {
          id: "tt-auto-claim-indicator",
          height: "2rem",
          width: "2rem",
          style: `vertical-align: middle; margin-left: 0.5rem; background-color: #00ad96; fill: #000; border: 0; border-radius: .25rem;`
        });
        const parent = $('div:not(#tt-auto-claim-bonuses) > [data-test-selector*="points"i][data-test-selector*="summary"i] [role="tooltip"i]'), tooltip = $('#tt-auto-claim-bonuses [role="tooltip"i]');
        if (tooltip && parent)
          tooltip.innerText = parent.innerText;
        let button = $("#tt-auto-claim-bonuses");
        if (nullish(button)) {
          const parent2 = $('[data-test-selector*="points"i][data-test-selector*="summary"i]'), heading = $.all(".top-nav__menu > div").pop(), container = furnish("div");
          if (nullish(parent2) || nullish(heading)) {
            return context.StopWatch.stop("auto_claim_bonuses");
          }
          container.innerHTML = parent2.outerHTML;
          container.id = "tt-auto-claim-bonuses";
          container.classList.add("community-points-summary", "tt-align-items-center", "tt-flex", "tt-full-height");
          container.modStyle(`animation:1s fade-in 1;`);
          heading.insertBefore(container, heading.children[1]);
          (_d = $('#tt-auto-claim-bonuses [data-test-selector*="points"i][data-test-selector*="summary"i] > div:last-child:not(:first-child)')) == null ? void 0 : _d.remove();
          const textContainer = $('[data-test-selector*="balance"i] *:not(:empty)', container);
          if (defined(textContainer)) {
            const { parentElement } = textContainer;
            parentElement.removeAttribute("data-test-selector");
          } else {
            return context.StopWatch.stop("auto_claim_bonuses");
          }
          button = {
            container,
            enabled: true,
            text: textContainer,
            icon: $("svg, img", container),
            get offset() {
              return getOffset(container);
            },
            tooltip: new Tooltip(container, Glyphs.modify("channelpoints", { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${320 * context.CHANNEL_POINTS_MULTIPLIER | 0} / h`, { top: -10 })
          };
          button.text.innerHTML = "+" + BonusChannelPointsSVG;
          button.container.setAttribute("tt-auto-claim-enabled", true);
          button.icon ??= $("svg, img", container);
          if ($.nullish(".channel-points-icon", container)) {
            button.icon.outerHTML = Glyphs.channelpoints;
            button.icon = $("svg, img", container);
          }
          button.icon.modStyle(`height: 2rem; width: 2rem; margin-top: .25rem; margin-left: .25rem;`);
          when.defined((container2) => $('[data-test-selector*="balance"i][data-test-selector*="string"i]', container2), 30, container).then((text) => text.remove());
          when.defined((container2) => $.all("svg, img", container2).length > 2 ? container2 : null, 30, container).then((container2) => {
            var _a2;
            const oldIcon = $("svg, img", container2);
            const newIcon = $.last("svg, img, .tw-img, .tw-svg", container2);
            (_a2 = newIcon.closest("*:not(:first-of-type):not(:first-child)")) == null ? void 0 : _a2.remove();
            oldIcon.replaceWith(newIcon);
          });
        } else {
          const container = button, textContainer = $('[data-test-selector*="balance"i] *:not(:empty)', container);
          button = {
            container,
            enabled: true,
            text: textContainer,
            tooltip: Tooltip.get(container),
            icon: $("svg, img", container),
            get offset() {
              return getOffset(container);
            }
          };
        }
        button.container.onclick ??= (event) => {
          const enabled = button.container.getAttribute("tt-auto-claim-enabled").unlike("true");
          button.container.setAttribute("tt-auto-claim-enabled", enabled);
          button.text.innerHTML = ["", "+"][+enabled] + BonusChannelPointsSVG;
          button.tooltip.innerHTML = Glyphs.modify("channelpoints", { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${(120 + 200 * +enabled) * context.CHANNEL_POINTS_MULTIPLIER | 0} / h`;
        };
        top.onintegritychange = (okay) => {
          var _a2;
          return (_a2 = $("#tt-auto-claim-indicator")) == null ? void 0 : _a2.modStyle(`background-color:${["#ff4f4d", "#00ad96"][+okay]}`);
        };
        top.onintegritychange = (okay) => button.tooltip.innerHTML = Glyphs.modify("channelpoints", { style: `height: 1.5rem; width: 1.5rem; vertical-align: bottom` }) + ` ${(120 + 200 * +okay) * context.CHANNEL_POINTS_MULTIPLIER | 0} / h`;
        button.container.onmouseenter ??= (event) => {
          var _a2;
          (_a2 = button.icon) == null ? void 0 : _a2.setAttribute("hover", true);
        };
        button.container.onmouseleave ??= (event) => {
          var _a2;
          (_a2 = button.icon) == null ? void 0 : _a2.setAttribute("hover", false);
        };
        for (let max = 10; max > 0 && defined(button.container.previousElementSibling); --max)
          button.container.parentElement.insertBefore(button.container, button.container.previousElementSibling);
        (_f = (_e = button.text) == null ? void 0 : _e.classList) == null ? void 0 : _f.add("text");
        (_h = (_g = button.tooltip) == null ? void 0 : _g.classList) == null ? void 0 : _h.add("img-container");
        const junk = $(`#tt-auto-claim-bonuses ${"> :last-child".repeat(3)}`);
        junk && (junk.innerHTML = "");
        (_i = $("svg:not([id])", button.container)) == null ? void 0 : _i.modStyle(`fill:var(--channel-color-${ANTITHEME})`);
        (_k = (_j = $("svg:not([id])", button.container)) == null ? void 0 : _j.closest('div:not([class*="channel"i])')) == null ? void 0 : _k.modStyle("margin-top:0.1em");
      } catch (error) {
        $error(error);
        addReport({ "Failed-to-load-Auto-Claim-Bonuses": error });
      }
      context.StopWatch.stop("auto_claim_bonuses");
    }, "handler"),
    /**
     * Undoes the auto-claim bonuses feature by removing the UI indicator.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      var _a;
      (_a = $("#tt-auto-claim-bonuses")) == null ? void 0 : _a.remove();
    }, "unhandler")
  });

  // src/plugins/chat/emote-searching.js
  plugin({
    id: "chat.emote_searching",
    job: "emote_searching",
    timer: 250,
    /**
     * Initializes the emote search and drag command state.
     * @param {Object} context - The plugin context
     */
    init(context) {
      context.EmoteSearch = {};
      context.EmoteDragCommand = void 0;
    },
    /**
     * Monitors the emote picker search input and triggers registered query callbacks.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      var _a, _b;
      context.EmoteSearch.input = $('.emote-picker [type="search"i]');
      context.EmoteDragCommand = ((lang) => {
        switch (lang) {
          case "de": {
            return "Ziehen, um zu benutzen";
          }
          case "es": {
            return "Arrastre para usar";
          }
          case "ru": {
            return "Перетащите для использования";
          }
          case "en":
          default: {
            return "Drag to use";
          }
        }
      })(top.LANGUAGE);
      if (defined((_a = context.EmoteSearch.input) == null ? void 0 : _a.value)) {
        if (context.EmoteSearch.input.value != context.EmoteSearch.value) {
          if (((_b = context.EmoteSearch.value = context.EmoteSearch.input.value.trim()) == null ? void 0 : _b.length) >= 3)
            for (const [name, callback] of context.EmoteSearch.__onquery__)
              wait(250).then(() => {
                if (context.EmoteSearch.value == context.EmoteSearch.input.value)
                  callback(context.EmoteSearch.value);
              });
        }
      }
    }, "handler"),
    /**
     * Checks if emote conversion or BTTV emote settings are enabled.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return [Settings.convert_emotes, Settings.bttv_emotes].map(parseBool).contains(true);
    },
    /**
     * Configures the emote search functionality, including result appending and text distance calculations.
     * @param {Object} context - The plugin context
     */
    setup(context) {
      Object.defineProperties(context.EmoteSearch, {
        onquery: {
          set(callback) {
            const name = callback.name || UUID.from(callback.toString()).value;
            if (context.EmoteSearch.__onquery__.has(name))
              return context.EmoteSearch.__onquery__.get(name);
            context.EmoteSearch.__onquery__.set(name, callback);
            return callback;
          },
          get() {
            return context.EmoteSearch.__onquery__.size;
          }
        },
        __onquery__: { value: /* @__PURE__ */ new Map() },
        appendResults: {
          value: /* @__PURE__ */ __name(function appendResults(nodes, type) {
            $.all(`[tt-${type}-emote-search-result]`).forEach((node) => node.remove());
            const container = $('[class*="emote-picker"i] [class*="emote-picker"i][class*="block"i] > *:last-child');
            for (const node of nodes) {
              if (nullish(node))
                continue;
              node.setAttribute(`tt-${type}-emote-search-result`, UUID.from(node.innerHTML).value);
              container.append(node);
            }
            const title = $("p", container.previousElementSibling) ?? $('[class*="emote-picker"i] p');
            title.innerText = title.innerText.replace(/^.*("[^]+").*?$/, `${container.children.length} search results for $1`);
          }, "appendResults")
        },
        getTextDistance: {
          // Text comparison
          // Calculates the Levenshtein's distance between two strings
          value: /* @__PURE__ */ __name(function levenshtein(A = "", B = "") {
            return A.distanceFrom(B);
          }, "levenshtein")
        }
      });
    }
  });

  // src/plugins/chat/bttv-emotes.js
  var BTTV_OWNERS;
  var BTTV_LOADER;
  var BTTV_LOADED_INDEX;
  var BTTV_MAX_EMOTES;
  var NON_EMOTE_PHRASES;
  var QUEUED_EMOTES;
  var CONVERT_TO_BTTV_EMOTE;
  var LOAD_BTTV_EMOTES;
  plugin({
    id: "chat.bttv_emotes",
    job: "bttv_emotes",
    timer: 5e3,
    /**
     * Initializes BetterTTV emote data, loads cached emotes and owners, and sets up a periodic synchronization loop to save emote data.
     * @param {*} context - The plugin context object
     */
    init(context) {
      context.BTTV_EMOTES = top.BTTV_EMOTES ??= /* @__PURE__ */ new Map();
      BTTV_OWNERS = top.BTTV_OWNERS ??= /* @__PURE__ */ new Map();
      Cache.large.load(["BTTV_EMOTES", "BTTV_OWNERS"], (data) => {
        Object.entries((data == null ? void 0 : data.BTTV_EMOTES) ?? {}).map(([name, id]) => context.BTTV_EMOTES.set(name, `//cdn.betterttv.net/emote/${id}/3x`));
        Object.entries((data == null ? void 0 : data.BTTV_OWNERS) ?? {}).map(([ids, emotes]) => {
          let [name, displayName, providerId, userId] = ids.split("/");
          displayName ||= name;
          for (const emote of emotes)
            BTTV_OWNERS.set(emote, { name, displayName, providerId, userId });
        });
      });
      BTTV_LOADER = setInterval(() => {
        const emotes = {};
        const emotesUUID = UUID.from([...context.BTTV_EMOTES.keys()].sort().join(",")).value;
        if (context.BTTV_EMOTES.uuid != emotesUUID) {
          context.BTTV_EMOTES.uuid = emotesUUID;
          [...context.BTTV_EMOTES].map(([name, src]) => emotes[name] = parseURL(src).pathname.slice(1).split("/").slice(-2).shift());
          Cache.large.save({ BTTV_EMOTES: emotes });
        }
        const owners = {};
        const ownersUUID = UUID.from([...BTTV_OWNERS.keys()].sort().join(",")).value;
        if (BTTV_OWNERS.uuid != ownersUUID) {
          BTTV_OWNERS.uuid = ownersUUID;
          [...BTTV_OWNERS].map(([emote, { name = "", displayName = "", providerId = "", userId = "" }]) => (owners[[name, displayName.replace(name, ""), providerId, userId].join("/")] ??= []).push(emote));
          Cache.large.save({ BTTV_OWNERS: owners });
        }
      }, 3e4);
      BTTV_LOADED_INDEX = 0;
      BTTV_MAX_EMOTES = parseInt(Settings.bttv_emotes_maximum ??= 30);
      NON_EMOTE_PHRASES = /* @__PURE__ */ new Set();
      QUEUED_EMOTES = /* @__PURE__ */ new Set();
      CONVERT_TO_BTTV_EMOTE = /* @__PURE__ */ __name((emote, makeTooltip = true) => {
        var _a;
        let { name, src } = emote, existing = $(`img.bttv[alt="${name}"i]`);
        if (defined(existing))
          return (_a = existing.closest) == null ? void 0 : _a.call(existing, "div.tt-emote-bttv");
        const f = furnish;
        const emoteContainer = f(`#bttv_emote__${UUID.from(name).toStamp()}.tt-emote-bttv.tt-pd-x-05.tt-relative`).with(
          f(".emote-button").with(
            f(".tt-inline-flex").with(
              f(
                `button.emote-button__link.tt-align-items-center.tt-flex.tt-justify-content-center[@testSelector=emote-button-clickable][@aTarget=${name}]`,
                {
                  "aria-label": name,
                  name,
                  onclick: /* @__PURE__ */ __name((event) => {
                    const name2 = event.currentTarget.getAttribute("name"), chat = $('[data-a-target="chat-input"i]');
                  }, "onclick"),
                  ondragstart: /* @__PURE__ */ __name((event) => {
                    const { currentTarget } = event;
                    event.dataTransfer.setData("text/plain", currentTarget.getAttribute("name").trim() + " ");
                    event.dataTransfer.dropEffect = "move";
                  }, "ondragstart")
                },
                f.figure(
                  /*
                  <div class="emote-button__lock tt-absolute tt-border-radius-small tt-c-background-overlay tt-c-text-overlay tt-inline-flex tt-justify-content-center tt-z-above" data-test-selector="badge-button-lock">
                      <figure class="ScFigure-sc-1j5mt50-0 laJGEQ tt-svg">
                          <!-- badge icon -->
                      </figure>
                  </div>
                  */
                  f(".emote-button__lock.tt-absolute.tt-border-radius-small.tt-c-background-overlay.tt-c-text-overlay.tt-inline-flex.tt-justify-content-center.tt-z-above[@testSelector=badge-button-icon]").with(
                    f("figure.tt-svg", { style: "-webkit-box-align:center; -moz-box-align:center; align-items:center; display:inline-flex;", innerHTML: Glyphs.modify("emotes", { height: "10px", width: "10px" }) })
                  ),
                  f("img.bttv.emote-picker__image", { src, alt: name, style: "height:3.5rem;" })
                )
              )
            )
          )
        );
        if (makeTooltip !== false)
          new Tooltip(emoteContainer, name);
        return emoteContainer;
      }, "CONVERT_TO_BTTV_EMOTE");
      LOAD_BTTV_EMOTES = /* @__PURE__ */ __name(async (keyword = "", provider = null, ignoreCap = false) => {
        var _a;
        keyword = (keyword || "").trim();
        provider = (_a = provider == null ? void 0 : provider.toString) == null ? void 0 : _a.call(provider);
        if (/:(\w+):/.test(keyword) || keyword.length < 1)
          return;
        if (nullish(provider) || Number.isNaN(provider)) {
          if (QUEUED_EMOTES.has(keyword) || NON_EMOTE_PHRASES.has(keyword) || context.BTTV_EMOTES.has(keyword))
            return context.BTTV_EMOTES.get(keyword);
          QUEUED_EMOTES.add(keyword);
        }
        if (provider == null ? void 0 : provider.length)
          await fetchURL.fromDisk(`//api.betterttv.net/3/cached/users/twitch/${provider}`, { hoursUntilEntryExpires: 744 }).then((response) => response.json()).then((json) => {
            const { channelEmotes, sharedEmotes } = json;
            if (nullish(channelEmotes ?? sharedEmotes))
              return;
            const emotes = [...channelEmotes, ...sharedEmotes];
            for (let { emote, code, user, id, imageType, userId = null } of emotes) {
              code ??= emote == null ? void 0 : emote.code;
              user ??= (emote == null ? void 0 : emote.user) ?? { displayName: context.STREAMER.name, name: context.STREAMER.name.toLowerCase(), providerId: context.STREAMER.sole };
              if (context.BTTV_EMOTES.has(code))
                continue;
              context.BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${id}/3x`);
              BTTV_OWNERS.set(code, { ...user, userId: userId ?? user.id });
            }
          }).catch($warn);
        else if (keyword == null ? void 0 : keyword.length)
          for (let maxNumOfEmotes = BTTV_MAX_EMOTES, offset = 0, allLoaded = false, MAX_REPEAT = 15; !allLoaded && keyword.trim().normalize("NFKD").length && (ignoreCap || context.BTTV_EMOTES.size < maxNumOfEmotes) && MAX_REPEAT > 0 && !NON_EMOTE_PHRASES.has(keyword); --MAX_REPEAT > 0 ? null : NON_EMOTE_PHRASES.add(keyword))
            await fetchURL.fromDisk(`//api.betterttv.net/3/emotes/shared/search?query=${keyword}&offset=${offset}&limit=100`, { hoursUntilEntryExpires: 744 }).then((response) => response.json()).then((emotes) => {
              if (!(emotes == null ? void 0 : emotes.length))
                return;
              for (let { emote, code, user, id, userId = null } of emotes) {
                code ??= emote == null ? void 0 : emote.code;
                user ??= (emote == null ? void 0 : emote.user) ?? {};
                if (context.BTTV_EMOTES.has(code))
                  continue;
                context.BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${id}/3x`);
                BTTV_OWNERS.set(code, { ...user, userId: userId ?? user.id });
              }
              offset += emotes.length | 0;
              allLoaded ||= emotes.length > maxNumOfEmotes || emotes.length < 15;
            }).catch((error) => {
              NON_EMOTE_PHRASES.add(keyword);
              $warn(error);
            });
        else
          for (let maxNumOfEmotes = BTTV_MAX_EMOTES, offset = 0, allLoaded = false; ignoreCap || context.BTTV_EMOTES.size < maxNumOfEmotes; )
            await fetchURL.fromDisk(`//api.betterttv.net/3/${Settings.bttv_emotes_location ?? "emotes/shared/trending"}?offset=${offset}&limit=100`, { hoursUntilEntryExpires: 744 }).then((response) => response.json()).then((emotes) => {
              for (const { emote } of emotes) {
                const { code, user, id } = emote;
                if (context.BTTV_EMOTES.has(code))
                  continue;
                context.BTTV_EMOTES.set(code, `//cdn.betterttv.net/emote/${id}/3x`);
                BTTV_OWNERS.set(code, { ...user, userId: user.id });
              }
              offset += emotes.length | 0;
              allLoaded ||= emotes.length > maxNumOfEmotes || emotes.length < 15;
            }).catch($warn);
      }, "LOAD_BTTV_EMOTES");
      context.REFURBISH_BTTV_EMOTE_TOOLTIPS = (fragment) => {
        $.all("[data-bttv-emote]", fragment).forEach((emote) => {
          const { bttvEmote } = emote.dataset, tooltip = new Tooltip(emote, bttvEmote);
          emote.addEventListener("mouseup", async (event) => {
            let { currentTarget, isTrusted = false } = event, { bttvEmote: bttvEmote2, bttvOwner, bttvOwnerId } = currentTarget.dataset, { top: top2 } = getOffset(currentTarget), ownedEmotes = [];
            for (const [emote2, meta] of BTTV_OWNERS)
              if (meta.providerId == bttvOwnerId)
                ownedEmotes.push({ ...meta, emote: emote2 });
            top2 -= 150;
            const redoSearch = !isTrusted ? -1 : setTimeout(() => currentTarget.dispatchEvent(new MouseEvent("mouseup", { bubbles: false, cancelable: false, view: window })), 5e3);
            const resultCard = new Card.deferred({ top: top2 });
            new Search(bttvOwner).then(Search.convertResults).then(({ ok = false, live = false }) => {
              const count = ownedEmotes.length, owner = BTTV_OWNERS.get(bttvEmote2).userId, f = furnish;
              if (!ok)
                throw `Search failed to complete for "${bttvOwner}"`;
              const list = ownedEmotes.slice(0, 8).map(
                ({ emote: emote2, displayName, name, providerId }) => f(".chat-line__message--emote-button[@testSelector=emote-button]").with(
                  f("span[@aTarget=emote-name]").with(
                    f(".class.chat-image__container.tt-align-center.tt-inline-block").with(
                      f("img.bttv.chat-image.chat-line__message--emote", {
                        src: context.BTTV_EMOTES.get(emote2),
                        alt: emote2
                      })
                    )
                  )
                )
              ).map((div) => div.outerHTML).join("");
              resultCard.post({
                title: bttvEmote2,
                subtitle: `BetterTTV Emote (${bttvOwner})`,
                description: `Visit <a href="https://betterttv.com/users/${owner}" target="_blank">${bttvOwner} ${Glyphs.modify("ne_arrow", { height: 16, width: 16, style: "vertical-align:-3px" })}</a> to view more emotes. <!-- <p style="margin-top:1rem">${list}</p> <!-- / -->`,
                icon: {
                  src: context.BTTV_EMOTES.get(bttvEmote2),
                  alt: bttvEmote2
                },
                footer: {
                  href: `./${bttvOwner}`,
                  name: bttvOwner,
                  live
                },
                fineTuning: { top: top2 }
              });
            }).catch((error) => {
              $warn(error);
              resultCard.post({
                title: bttvEmote2,
                subtitle: `BetterTTV Emote (${bttvOwner})`,
                icon: {
                  src: context.BTTV_EMOTES.get(bttvEmote2),
                  alt: bttvEmote2
                },
                fineTuning: { top: top2 }
              });
            }).finally(() => clearTimeout(redoSearch));
          });
        });
      };
    },
    /**
     * Adds a BetterTTV emotes section to the Twitch emote picker.
     * @param {*} context - The plugin context object
     */
    handler: /* @__PURE__ */ __name((context) => {
      new context.StopWatch("bttv_emotes");
      let BTTVEmoteSection = $("#tt-bttv-emotes");
      if (defined(BTTVEmoteSection))
        return context.StopWatch.stop("bttv_emotes");
      const parent = $('[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *');
      if (nullish(parent))
        return context.StopWatch.stop("bttv_emotes");
      const BTTVEmotes = [];
      for (const [name, src] of context.BTTV_EMOTES)
        BTTVEmotes.push({ name, src });
      BTTVEmoteSection = furnish(
        "#tt-bttv-emotes.emote-picker__content-block",
        {
          ondragover: /* @__PURE__ */ __name((event) => {
            event.preventDefault();
          }, "ondragover"),
          ondrop: /* @__PURE__ */ __name(async (event) => {
            event.preventDefault();
            return event.dataTransfer.getData("text/plain");
          }, "ondrop")
        },
        furnish(".tt-pd-b-1.tt-pd-t-05.tt-pd-x-1.tt-relative").with(
          // Emote Section Header
          furnish(".emote-grid-section__header-title.tt-align-items-center.tt-flex.tt-pd-x-1.tt-pd-y-05").with(
            furnish("p.tt-align-middle.tt-c-text-alt.tt-strong", {
              innerHTML: `BetterTTV Emotes &mdash; ${context.EmoteDragCommand}`
            })
          ),
          // Emote Section Container
          furnish(
            "#tt-bttv-emotes-container.tt-flex.tt-flex-wrap",
            {
              class: "tt-scrollbar-area",
              style: "max-height: 15rem; overflow: hidden scroll; display: flex; flex-wrap: wrap;"
            },
            ...BTTVEmotes.shuffle().slice(0, 102).map(CONVERT_TO_BTTV_EMOTE)
          )
        )
      );
      parent.insertBefore(BTTVEmoteSection, parent.firstChild);
      context.StopWatch.stop("bttv_emotes");
    }, "handler"),
    /**
     * Configures BTTV emote loading limits, fetches emotes for the current streamer and custom keywords, and initializes the chat message replacement listener.
     * @param {*} context - The plugin context object
     */
    setup(context) {
      $remark("Loading BTTV emotes...");
      BTTV_MAX_EMOTES = Math.round(parseInt(Settings.bttv_emotes_maximum) * 0.85);
      if (parseBool(Settings.bttv_emotes_channel))
        LOAD_BTTV_EMOTES(context.STREAMER.name, context.STREAMER.sole);
      LOAD_BTTV_EMOTES(context.STREAMER.name).then(async () => {
        BTTV_MAX_EMOTES = parseInt(Settings.bttv_emotes_maximum);
        for (const keyword of (Settings.bttv_emotes_extras ?? "").split(",").filter((string) => string.length > 1))
          LOAD_BTTV_EMOTES(keyword);
      }).then(() => {
        const container = $("#tt-bttv-emotes-container");
        if (nullish(container))
          return;
        const BTTVEmotes = [];
        for (const [name, src] of context.BTTV_EMOTES)
          BTTVEmotes.push({ name, src });
        container.append(...BTTVEmotes.shuffle().slice(0, 102).map(CONVERT_TO_BTTV_EMOTE));
      }).then(() => {
        $remark("Adding BTTV emote event listener...");
        Chat.get().map(Chat.onmessage = async (line) => {
          if (Queue.bttv_emotes.contains(line.uuid))
            return;
          Queue.bttv_emotes.push(line.uuid);
          Queue.bttv_emotes = Queue.bttv_emotes.slice(-60);
          for (const word of line.message.split(/\s+/)) {
            if (parseBool(Settings.auto_load_bttv_emotes)) {
              if (!NON_EMOTE_PHRASES.has(word) && !QUEUED_EMOTES.has(word) && !context.BTTV_EMOTES.has(word) && word.length >= 3 && /[a-z\d][A-Z]|^[A-Z]+$/.test(word))
                await LOAD_BTTV_EMOTES(word, null, true);
            }
            if (context.BTTV_EMOTES.has(word)) {
              const regexp = RegExp(`${word.replace(/(\W)/g, "\\$1").replace(/^\w/, "\\b$&").replace(/\w$/, "$&\\b")}`, "g"), alt = word, src = context.BTTV_EMOTES.get(alt), owner = BTTV_OWNERS.get(alt), own = (owner == null ? void 0 : owner.displayName) ?? "Anonymous", pid = owner == null ? void 0 : owner.providerId, style = `visibility:hidden!important`;
              const element = await line.element, uuid = UUID.from(alt).value;
              element.innerHTML = element.innerHTML.replace(regexp, uuid);
              for (const child of $.all("*", element))
                for (const { name, value } of child.attributes)
                  if (value == uuid)
                    child.setAttribute(name, word);
              element.innerHTML = element.innerHTML.replace(RegExp(uuid, "g"), furnish("param.tt-convert-to-img", { alt, src, own, pid, style }).outerHTML);
            }
          }
        });
        setInterval(() => {
          $.all(`param.tt-convert-to-img`).map((child) => {
            const f = furnish;
            const fragment = child.closest('[data-a-target$="message"i]'), converted = (fragment.getAttribute("tt-converted-emotes") ?? "").split(" "), tte = fragment.getAttribute("data-tt-emote") ?? "";
            const alt = child.getAttribute("alt"), src = child.getAttribute("src"), own = child.getAttribute("own"), pid = child.getAttribute("pid");
            converted.push(alt);
            fragment.setAttribute("tt-converted-emotes", converted.join(" ").trim());
            fragment.dataset.ttEmote = [...tte.split(" "), alt].join(" ").trim();
            child.parentElement.replaceChild(
              f(`.chat-line__message--emote-button[@testSelector=emote-button][@bttvEmote=${alt}][@bttvOwner=${own}][@bttvOwnerId=${pid}]`).with(
                f(".chat-line__message--emote-button[@testSelector=emote-button]").with(
                  f("span[@aTarget=emote-name]").with(
                    f(".class.chat-image__container.tt-align-center.tt-inline-block").with(
                      f("img.bttv.chat-image.chat-line__message--emote", {
                        src,
                        alt: encodeHTML(alt)
                      })
                    )
                  )
                )
              ),
              child
            );
            context.REFURBISH_BTTV_EMOTE_TOOLTIPS(fragment);
          });
        }, 250);
      });
      $remark("Adding BTTV emote search listener...");
      context.EmoteSearch.onquery = async (query) => {
        await LOAD_BTTV_EMOTES(query, null, true).then(() => {
          const results = [...context.BTTV_EMOTES].filter(([key, value]) => {
            const pattern = RegExp(query.replace(/(\W)/g, "\\$1"), "i").test(key), distance = context.EmoteSearch.getTextDistance(query, key);
            return pattern || distance < query.length / 2;
          }).map(([name, src]) => CONVERT_TO_BTTV_EMOTE({ name, src }));
          context.EmoteSearch.appendResults(results, "bttv");
        });
      };
    }
  });

  // src/plugins/chat/convert-emotes.js
  plugin({
    id: "chat.convert_emotes",
    /**
     * Installs the emote conversion feature by initializing emote tracking maps and defining helper functions for creating captured emote elements.
     * @param {*} context - The plugin context object
     */
    async install(context) {
      const OWNED_EMOTES = top.OWNED_EMOTES ??= /* @__PURE__ */ new Map(), CAPTURED_EMOTES = top.CAPTURED_EMOTES ??= /* @__PURE__ */ new Map(), CONVERT_TO_CAPTURED_EMOTE = /* @__PURE__ */ __name((emote, makeTooltip = true) => {
        const { name, src } = emote;
        if (/^\W/.test(name))
          return;
        const emoteContainer = furnish(".tt-emote-captured.tt-pd-x-05.tt-relative").with(
          furnish(".emote-button").with(
            furnish(".tt-inline-flex").with(
              furnish(
                `button.emote-button__link.tt-align-items-center.tt-flex.tt-justify-content-center[@testSelector=emote-button-clickable][@aTarget=${name}]`,
                {
                  "aria-label": name,
                  name,
                  onclick: /* @__PURE__ */ __name((event) => {
                    const name2 = event.currentTarget.getAttribute("name"), chat = $('[data-a-target="chat-input"i]');
                  }, "onclick"),
                  ondragstart: /* @__PURE__ */ __name((event) => {
                    const { currentTarget } = event;
                    event.dataTransfer.setData("text/plain", currentTarget.getAttribute("name").trim() + " ");
                    event.dataTransfer.dropEffect = "move";
                  }, "ondragstart")
                },
                furnish.figure(
                  /*
                  <div class="emote-button__lock tt-absolute tt-border-radius-small tt-c-background-overlay tt-c-text-overlay tt-inline-flex tt-justify-content-center tt-z-above" data-test-selector="badge-button-lock">
                      <figure class="ScFigure-sc-1j5mt50-0 laJGEQ tt-svg">
                          <!-- badge icon -->
                      </figure>
                  </div>
                  */
                  furnish(".emote-button__lock.tt-absolute.tt-border-radius-small.tt-c-background-overlay.tt-c-text-overlay.tt-inline-flex.tt-justify-content-center.tt-z-above[@testSelector=badge-button-icon]").with(
                    furnish("figure.tt-svg", { style: "-webkit-box-align:center; -moz-box-align:center; align-items:center; display:inline-flex;", innerHTML: Glyphs.modify("emotes", { height: "10px", width: "10px" }) })
                  ),
                  furnish("img.emote-picker__image", { src, alt: name })
                )
              )
            )
          )
        );
        if (makeTooltip !== false)
          new Tooltip(emoteContainer, name);
        return emoteContainer;
      }, "CONVERT_TO_CAPTURED_EMOTE");
      const shrt = /* @__PURE__ */ __name((url) => url.replace(/https:\/\/static-cdn\.jtvnw\.net\/emoticons\/v1\/(\d+)\/([\d\.]+)/i, ($0, $1, $2, $$, $_) => {
        const id = parseInt($1).toString(36), version = $2;
        return [id, version].join("-");
      }), "shrt");
      Handlers.convert_emotes = () => {
        var _a, _b;
        let emoteSection = $("#tt-captured-emotes");
        if (defined(emoteSection))
          return;
        const parent = $('[data-test-selector^="chat-room-component"i] .emote-picker__scroll-container > *');
        if (nullish(parent))
          return RestartJob("convert_emotes", "missing:convert_emotes.parent");
        const streamersEmotes = (_b = (_a = $(`[class^="emote-picker"i] img[alt="${context.STREAMER.name}"i]`)) == null ? void 0 : _a.closest("div")) == null ? void 0 : _b.nextElementSibling;
        if (nullish(streamersEmotes))
          return RegisterJob("convert_emotes");
        for (const lock of $.all('[data-test-selector*="lock"i]', streamersEmotes)) {
          const emote = lock.nextElementSibling, { alt, src } = emote, parent2 = emote.closest('[class^="emote-picker"i]').parentElement, container = parent2.parentElement;
          container.insertBefore(CONVERT_TO_CAPTURED_EMOTE({ name: alt, src }, false), parent2);
          lock.remove();
          emote.remove();
          parent2.remove();
        }
        const caughtEmotes = [];
        for (const [name, src] of CAPTURED_EMOTES)
          caughtEmotes.push({ name, src });
        emoteSection = furnish(
          "#tt-captured-emotes.emote-picker__content-block",
          {
            ondragover: /* @__PURE__ */ __name((event) => {
              event.preventDefault();
            }, "ondragover"),
            ondrop: /* @__PURE__ */ __name(async (event) => {
              event.preventDefault();
              return event.dataTransfer.getData("text/plain");
            }, "ondrop")
          },
          furnish(".tt-pd-b-1.tt-pd-t-05.tt-pd-x-1.tt-relative").with(
            // Emote Section Header
            furnish(".emote-grid-section__header-title.tt-align-items-center.tt-flex.tt-pd-x-1.tt-pd-y-05").with(
              furnish("p.tt-align-middle.tt-c-text-alt.tt-strong", {
                innerHTML: `Captured Emotes &mdash; ${context.EmoteDragCommand}`
              })
            ),
            // Emote Section Container
            furnish(
              "#tt-captured-emotes-container.tt-flex.tt-flex-wrap",
              {
                class: "tt-scrollbar-area",
                style: "max-height: 15rem; overflow: hidden scroll;"
              },
              ...caughtEmotes.map(CONVERT_TO_CAPTURED_EMOTE)
            )
          )
        );
        parent.insertBefore(emoteSection, parent.firstChild);
      };
      Timers.convert_emotes = 2500;
      __ConvertEmotes__:
        if (parseBool(Settings.convert_emotes)) {
          let CollectEmotes = function() {
            var _a;
            chat_emote_button.click();
            const chat_emote_scroll = $(".emote-picker .simplebar-scroll-content");
            if (nullish(chat_emote_scroll)) {
              chat_emote_button.click();
              return wait(250).then(CollectEmotes);
            }
            $('.emote-picker [class*="tab-content"i]').id = "tt-hidden-emote-container";
            (_a = $('[data-a-target="CHANNEL_EMOTES"i]')) == null ? void 0 : _a.click();
            wait(250).then(() => {
              $.all('.emote-button [data-test-selector*="lock"i] ~ img:not(.bttv)').map((img) => CAPTURED_EMOTES.set(img.alt, shrt(img.src)));
              $.all(".emote-button img:not(.bttv)").filter((img) => !CAPTURED_EMOTES.has(img.alt)).map((img) => OWNED_EMOTES.set(img.alt, shrt(img.src)));
              wait(2500).then(() => {
                var _a2;
                (_a2 = $("#tt-hidden-emote-container")) == null ? void 0 : _a2.removeAttribute("id");
                chat_emote_scroll.scrollTo(0, 0);
                chat_emote_button.click();
              });
            });
          };
          __name(CollectEmotes, "CollectEmotes");
          const chat_emote_button = $('[data-a-target="emote-picker-button"i]');
          if (nullish(chat_emote_button))
            break __ConvertEmotes__;
          if (defined(chat_emote_button))
            CollectEmotes();
          else
            wait(250).then(CollectEmotes);
          $remark("Adding emote event listener...");
          Chat.get().map(Chat.onmessage = async (line) => {
            var _a, _b;
            let regexp;
            for (const emote in line.emotes)
              if (!OWNED_EMOTES.has(emote) && !CAPTURED_EMOTES.has(emote) && !context.BTTV_EMOTES.has(emote)) {
                CAPTURED_EMOTES.set(emote, line.emotes[emote]);
                const capturedEmote = CONVERT_TO_CAPTURED_EMOTE({ name: emote, src: line.emotes[emote] });
                if (defined(capturedEmote))
                  (_b = (_a = $("#tt-captured-emotes-container")) == null ? void 0 : _a.append) == null ? void 0 : _b.call(_a, capturedEmote);
              }
            if (Queue.emotes.contains(line.uuid))
              return;
            if (Queue.emotes.length >= 30)
              Queue.emotes = [];
            Queue.emotes.push(line.uuid);
            for (const [emote, url] of CAPTURED_EMOTES)
              if ((regexp = RegExp("\\b" + emote.replace(/(\W)/g, "\\$1") + "\\b", "g")).test(line.message)) {
                let alt = emote, src = "https://static-cdn.jtvnw.net/emoticons/v1/" + url.split("-").map((v, i) => i == 0 ? parseInt(v, 36) : v).join("/"), srcset;
                if (/\/https?:\/\//i.test(src))
                  src = src.replace(/[^]*\/(https?:\/\/[^]*)(?:\/https?:\/\/)?$/i, "$1");
                else
                  srcset = [1, 2, 4].map((v, i) => src.replace(/[\d\.]+$/, `${(i + 1).toFixed(1)} ${v}x`)).join(",");
                const f = furnish;
                const img = f(".chat-line__message--emote-button[@testSelector=emote-button]").with(
                  f("span[@aTarget=emote-name]").with(
                    f(".class.chat-image__container.tt-align-center.tt-inline-block").with(
                      f("img.chat-image.chat-line__message--emote", {
                        srcset,
                        alt,
                        src
                      })
                    )
                  )
                );
                when((line2) => defined(line2.element) ? line2 : false, 1e3, line).then(async (element) => {
                  alt = alt.replace(/\s+/g, "_");
                  $.all(`.text-fragment:not([tt-converted-emotes~="${alt}"i])`, element).map((fragment) => {
                    const container = furnish(`.chat-line__message--emote-button[@testSelector=emote-button][@capturedEmote=${alt}]`).html(img.innerHTML), converted = (fragment.getAttribute("tt-converted-emotes") ?? "").split(" ");
                    converted.push(alt);
                    const tte = fragment.getAttribute("data-tt-emote") ?? "";
                    fragment.setAttribute("data-tt-emote", [...tte.split(" "), alt].join(" "));
                    fragment.setAttribute("tt-converted-emotes", converted.join(" ").trim());
                    fragment.innerHTML = fragment.innerHTML.replace(regexp, container.outerHTML);
                    $.all("[data-captured-emote]", fragment).forEach((element2) => {
                      const { capturedEmote } = element2.dataset;
                    });
                    context.REFURBISH_BTTV_EMOTE_TOOLTIPS(fragment);
                  });
                });
              }
          });
          $remark("Adding emote search listener...");
          context.EmoteSearch.onquery = (query) => {
            const results = [...CAPTURED_EMOTES].filter(([key, value]) => {
              const pattern = RegExp(query.replace(/(\W)/g, "\\$1"), "i").test(key), distance = context.EmoteSearch.getTextDistance(query, key);
              return pattern || distance < query.length / 2;
            }).map(([name, src]) => CONVERT_TO_CAPTURED_EMOTE({ name, src }));
            context.EmoteSearch.appendResults(results, "captured");
          };
          RegisterJob("convert_emotes");
        }
      context.UPDATE_RULES = (ruleType, delimeter = ",") => {
        let rules = Settings[`${ruleType}_rules`];
        const channel = [], user = [], badge = [], emote = [], text = [];
        if (defined(rules == null ? void 0 : rules.length)) {
          rules = rules.split(RegExp(`\\s*${delimeter}\\s*`)).map((rule) => rule.trim()).filter((rule) => rule.length);
          Object.defineProperties(rules, {
            specific: { value: [] },
            general: { value: [] }
          });
          const R = RegExp;
          for (const rule of rules)
            if (/^\/[\w\-]+/.test(rule)) {
              const caught = /^\/(?<name>[\w\-]+) +(?:(?:<(?<badge>[^>]+)>)?(?::(?<emote>[^:]+):|@(?<user>[\w\-]+)|(?<text>[^$]*))?)$/i.exec(rule).groups;
              channel.push(caught);
              rules.specific.push(rule);
              (rules.specific.channel ??= []).push(caught);
            } else if (/^@([\w\-]+)/.test(rule) && ["@everyone", "@chat", "@all"].missing(rule.toLowerCase())) {
              const caught = /^@(?<user>[\w\-]+)(?<text>.*)/.exec(rule).groups;
              user.push(R.$1);
              rules.specific.push(rule);
              (rules.specific.user ??= []).push(caught);
            } else if (/^<([\w\- ]+)>/.test(rule)) {
              const caught = /^<(?<badge>[\w\- ]+)>(?<text>.*)/.exec(rule).groups;
              badge.push(R.$1);
              rules.specific.push(rule);
              (rules.specific.badge ??= []).push(caught);
            } else if (/^:([\w\- ]+):$/.test(rule)) {
              emote.push(R.$1);
              rules.specific.push(rule);
              (rules.specific.emote ??= []).push(R.$1);
            } else if (rule) {
              text.push(/^[\w\s]+$/.test(rule) ? `\\b${rule}\\b` : rule);
              rules.general.push(rule);
            }
        }
        const channels = RegExp(`^(${channel.length ? channel.map(({ name }) => name).join("|") : "[\\b]"})$`, "i");
        Object.defineProperties(channel, {
          test: { value: channels.test.bind(channels) },
          exec: { value: channels.exec.bind(channels) }
        });
        return {
          text: text.length ? RegExp(`(${text.join("|")})`, "i") : /^[\b]$/,
          user: user.length ? RegExp(`^(${user.join("|")})$`, "i") : /^[\b]$/,
          emote: emote.length ? RegExp(`(${emote.join("|")})`, "i") : /^[\b]$/,
          badge: badge.length ? RegExp(`(${badge.join("|")})`, "i") : /^[\b]$/,
          channel,
          rules
        };
      };
    }
  });

  // src/plugins/chat/filter-messages.js
  var MESSAGE_FILTER;
  var MatchesRule;
  plugin({
    id: "chat.filter_messages",
    job: "filter_messages",
    timer: -2500,
    /**
     * Initializes message filtering rules and the matching utility.
     */
    init() {
      MatchesRule = /* @__PURE__ */ __name(function MatchesRule2(text, message) {
        try {
          return RegExp(text, "i").test(message);
        } catch {
          return message.toLowerCase().includes(text.toLowerCase());
        }
      }, "MatchesRule");
      MESSAGE_FILTER = void 0;
    },
    /**
     * Runs every tick: Hides chat messages that match user, badge, emote, or text-based filter rules.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      new context.StopWatch("filter_messages");
      MESSAGE_FILTER ??= Chat.onmessage = Chat.onpinned = async (line) => {
        when((line2) => defined(line2.element) ? line2 : false, 1e3, line).then(async (line2) => {
          const Filter = context.UPDATE_RULES("filter");
          let { message, mentions, author, badges, emotes, element } = line2, reason, match;
          const censoring = parseBool(element.getAttribute("tt-hidden-message"));
          if (censoring)
            return;
          const censor = parseBool(
            (Filter.user.test(author) ? (match = author, reason = "user") : false) || (Filter.badge.test(badges) ? (match = badges, reason = "badge") : false) || (Filter.emote.test(emotes) ? (match = emotes, reason = "emote") : false) || (Filter.text.test(message) ? (match = message, reason = "text") : false) || Filter.channel.map(({ name, badge, emote, user, text }) => {
              var _a;
              const channel = ((_a = context.STREAMER) == null ? void 0 : _a.name) || "~Anonymous";
              return channel.replace(/^[^\/]/, "/$&").equals(name.replace(/^[^\/]/, "/$&")) && ((author.replace(/^[^@]/, "@$&").equals(user == null ? void 0 : user.replace(/^[^@]/, "@$&")) ? (match = author, reason = "channel user") : false) || (~badges.findIndex((medal) => medal.toLowerCase().contains(badge == null ? void 0 : badge.toLowerCase()) && medal.length && badge.length) ? (match = badges, reason = "channel badge") : false) || (~emotes.findIndex((glyph) => glyph.toLowerCase().contains(emote == null ? void 0 : emote.toLowerCase()) && glyph.length && emote.length) ? (match = emotes, reason = "channel emote") : false) || (MatchesRule(text, message) ? (match = text, reason = "channel text") : false));
            }).contains(true)
          );
          if (!censor)
            return;
          const hidden = parseBool(element.getAttribute("tt-hidden-message"));
          if (hidden || mentions.contains(context.USERNAME))
            return;
          $log(`Censoring message because the ${reason} matches: ${match}`, line2);
          element.setAttribute("tt-hidden-message", censor);
        });
      };
      if (defined(MESSAGE_FILTER))
        Chat.get().map(MESSAGE_FILTER);
      context.StopWatch.stop("filter_messages");
    }, "handler"),
    /**
     * Undoes message filtering by revealing all previously hidden messages.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      const hidden = $.all("[tt-hidden-message]");
      hidden.map((element) => element.removeAttribute("tt-hidden-message"));
    }, "unhandler"),
    /**
     * Sets up the message filtering system.
     */
    setup() {
      $remark("Adding message filtering...");
    }
  });

  // src/plugins/chat/easy-filter.js
  plugin({
    id: "chat.easy_filter",
    job: "easy_filter",
    timer: 500,
    /**
     * Runs every tick: Adds buttons to viewer and emote cards to allow users to quickly filter them from chat.
     */
    handler: /* @__PURE__ */ __name(() => {
      var _a;
      const card = $('[data-a-target="viewer-card"i], [data-a-target="emote-card"i]'), existing = $("#tt-filter-rule--user, #tt-filter-rule--emote");
      if (nullish(card) || defined(existing))
        return;
      let title = $("h1,h2,h3,h4,h5,h6", card), [name] = title.childNodes, type = card.getAttribute("data-a-target").equals("viewer-card") ? "user" : "emote", { filter_rules } = Settings;
      name = (_a = name == null ? void 0 : name.textContent) == null ? void 0 : _a.replace(/[^]+?\((\w+)\)/, "$1");
      if (type.equals("user")) {
        if (filter_rules && filter_rules.split(",").contains(`@${name}`))
          return;
        const filter = furnish("#tt-filter-rule--user", {
          title: `Filter all messages from @${name}`,
          style: "cursor:pointer; fill:var(--color-red); font-size:1.1rem; font-weight:normal",
          username: name,
          onclick: /* @__PURE__ */ __name((event) => {
            let { currentTarget } = event, username = currentTarget.getAttribute("username"), { filter_rules: filter_rules2 } = Settings;
            filter_rules2 = (filter_rules2 || "").split(",");
            filter_rules2.push(`@${username}`);
            filter_rules2 = filter_rules2.join(",");
            $.all(`[data-a-user="${username}"i]`).map((div) => div.closest('[data-a-target="chat-line-message"i]').remove());
            currentTarget.remove();
            Settings.set({ filter_rules: filter_rules2 });
          }, "onclick"),
          innerHTML: `${Glyphs.trash} Filter messages from @${name}`
        });
        const svg = $("svg", filter);
        svg.modStyle("vertical-align:bottom; height:20px; width:20px");
        title.append(filter);
      } else if (type.equals("emote")) {
        if (filter_rules && filter_rules.split(",").contains(`:${name}:`))
          return;
        const filter = furnish("#tt-filter-rule--emote", {
          title: "Filter this emote",
          style: "cursor:pointer; fill:var(--color-red); font-size:1.1rem; font-weight:normal; --text-decoration:line-through;",
          emote: `:${name}:`,
          onclick: /* @__PURE__ */ __name((event) => {
            let { currentTarget } = event, emote = currentTarget.getAttribute("emote"), { filter_rules: filter_rules2 } = Settings;
            filter_rules2 = (filter_rules2 || "").split(",");
            filter_rules2.push(emote);
            filter_rules2 = filter_rules2.join(",");
            [
              ...$.getAllElementsByText(emote).filter((div) => div.classList.contains("text-fragment")),
              ...$.all(`img[alt="${emote}"i]`)
            ].map((div) => div.closest('[data-a-target="chat-line-message"i]').remove());
            currentTarget.remove();
            Settings.set({ filter_rules: filter_rules2 });
          }, "onclick"),
          innerHTML: `${Glyphs.trash} Filter <strong>${name}</strong>`
        });
        const svg = $("svg", filter);
        svg.modStyle("vertical-align:bottom; height:20px; width:20px");
        title.append(filter);
      }
    }, "handler"),
    /**
     * Determines if the easy filter feature should be active based on settings.
     * @returns {boolean} True if enabled
     */
    enabled() {
      return parseBool(Settings.filter_messages);
    }
  });

  // src/plugins/chat/filter-bulletins.js
  var BULLETIN_FILTERS;
  var PINNED_FILTER;
  plugin({
    id: "chat.filter_bulletins",
    job: "filter_bulletins",
    timer: -2500,
    /**
     * Initializes the bulletin filter rules and pinned message filter state.
     */
    init() {
      BULLETIN_FILTERS = /* @__PURE__ */ new Map([
        ["filter_messages__bullets_coin", ["coin"]],
        ["filter_messages__bullets_raid", ["raid"]],
        ["filter_messages__bullets_subs", ["dues", "gift", "keep"]],
        ["filter_messages__bullets_note", ["note"]],
        ["filter_messages__bullets_paid", ["PINNED_MESSAGES"]]
      ]);
      PINNED_FILTER = -1;
    },
    /**
     * Applies filters to hide specific types of chat bulletins using CSS or removal intervals.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      new context.StopWatch("filter_bulletins");
      for (const [key, subjects] of BULLETIN_FILTERS)
        if (key.endsWith("bullets_paid") && parseBool(Settings[key]))
          PINNED_FILTER = setInterval(() => {
            var _a, _b;
            return (_b = (_a = $('[class*="pinned"i]:is([class*="by"i], [class*="card"i]), [class*="happening"i][class*="notification"i]')) == null ? void 0 : _a.closest('[class*="chat"] > div:not([class])')) == null ? void 0 : _b.remove();
          }, 100);
        else if (parseBool(Settings[key]))
          AddCustomCSSBlock(`FilterBulletType${key.slice(-5)}`, `${subjects.map((subject) => `[data-uuid][data-type="${subject}"i]`).join(",")} { display:none!important }`);
      context.StopWatch.stop("filter_bulletins");
    }, "handler"),
    /**
     * Undoes bulletin filtering by removing custom CSS blocks and clearing pinned message intervals.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      for (const [key, subjects] of BULLETIN_FILTERS)
        RemoveCustomCSSBlock(`FilterBulletType${key.slice(-5)}`);
      clearInterval(PINNED_FILTER);
    }, "unhandler"),
    /**
     * Checks if any bulletin filtering options are enabled.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return [
        Settings.filter_messages__bullets_coin,
        Settings.filter_messages__bullets_raid,
        Settings.filter_messages__bullets_subs,
        Settings.filter_messages__bullets_note,
        Settings.filter_messages__bullets_paid
      ].map(parseBool).contains(true);
    },
    /**
     * Initializes the bulletin filtering feature.
     */
    setup() {
      $remark("Adding bulletin filtering...");
    }
  });

  // src/plugins/chat/highlight-phrases.js
  var PHRASE_HIGHLIGHTER;
  plugin({
    id: "chat.highlight_phrases",
    job: "highlight_phrases",
    timer: -2500,
    /**
     * Initializes the phrase highlighter state.
     */
    init() {
      PHRASE_HIGHLIGHTER = void 0;
    },
    /**
     * Sets up a message listener to identify and highlight chat messages based on user, badge, emote, or text rules.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      new context.StopWatch("highlight_phrases");
      PHRASE_HIGHLIGHTER ??= Chat.onmessage = async (line) => {
        when((line2) => defined(line2.element) ? line2 : false, 1e3, line).then(async (line2) => {
          const Phrases = context.UPDATE_RULES("phrase");
          let { message, mentions, author, badges, emotes, style, element } = line2, reason;
          const censor = parseBool(
            (Phrases.user.test(author) ? reason = "user" : false) || (Phrases.badge.test(badges) ? reason = "badge" : false) || (Phrases.emote.test(emotes) ? reason = "emote" : false) || (Phrases.text.test(message) ? reason = "text" : false) || Phrases.channel.map(({ name, text, user, badge, emote }) => {
              var _a, _b;
              if (nullish(context.STREAMER))
                return;
              const channel = (_a = context.STREAMER.name) == null ? void 0 : _a.toLowerCase();
              return parseBool(
                channel == name.toLowerCase()
              ) && parseBool(
                ("@" + author == user ? reason = "channel user" : false) || (~badges.findIndex((medal) => medal.contains(badge) && medal.length && badge.length) ? reason = "channel badge" : false) || (~emotes.findIndex((glyph) => glyph.contains(emote) && glyph.length && emote.length) ? reason = "channel emote" : false) || (((_b = text == null ? void 0 : text.test) == null ? void 0 : _b.call(text, message)) ? reason = "channel text" : false)
              );
            }).contains(true)
          );
          if (!censor)
            return;
          $log(`Highlighting message because the ${reason} matches`, line2);
          const highlight = parseBool(element.hasAttribute("tt-light"));
          if (highlight)
            return;
          const [color] = style.split(/color:([^;]+)/i).map((s) => s.trim()).filter((s) => s.length).map(Color.destruct);
          element.setAttribute("tt-light", true);
          element.modStyle(`border:1px solid ${color}; border-radius:3px;`);
        });
      };
      if (defined(PHRASE_HIGHLIGHTER))
        Chat.get().map(PHRASE_HIGHLIGHTER);
      context.StopWatch.stop("highlight_phrases");
    }, "handler"),
    /**
     * Undoes phrase highlighting by removing the highlighting attribute from all affected elements.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      const highlight = $.all("[tt-light]");
      highlight.map((element) => element.removeAttribute("tt-light"));
    }, "unhandler"),
    /**
     * Initializes the phrase highlighting feature.
     */
    setup() {
      $remark("Adding phrase highlighting...");
    }
  });

  // src/plugins/chat/easy-highlighter.js
  plugin({
    id: "chat.easy_highlighter",
    job: "easy_highlighter",
    timer: 500,
    /**
     * Adds "Highlight" buttons to viewer and emote cards to quickly add them to the phrase highlighting rules.
     */
    handler: /* @__PURE__ */ __name(() => {
      var _a;
      const card = $('[data-a-target="viewer-card"i], [data-a-target="emote-card"i]'), existing = $("#tt-highlight-rule--user, #tt-highlight-rule--emote");
      if (nullish(card) || defined(existing))
        return;
      let title = $("h1,h2,h3,h4,h5,h6", card), [name] = title.childNodes, type = card.getAttribute("data-a-target").equals("viewer-card") ? "user" : "emote", { phrase_rules } = Settings;
      name = (_a = name == null ? void 0 : name.textContent) == null ? void 0 : _a.replace(/[^]+?\((\w+)\)/, "$1");
      if (type.equals("user")) {
        if (phrase_rules && phrase_rules.split(",").contains(`@${name}`))
          return;
        const phrase = furnish("#tt-highlight-rule--user", {
          title: `Highlight all messages from @${name}`,
          style: "cursor:pointer; fill:var(--color-green); font-size:1.1rem; font-weight:normal",
          username: name,
          onclick: /* @__PURE__ */ __name((event) => {
            let { currentTarget } = event, username = currentTarget.getAttribute("username"), { phrase_rules: phrase_rules2 } = Settings;
            phrase_rules2 = (phrase_rules2 || "").split(",");
            phrase_rules2.push(`@${username}`);
            phrase_rules2 = phrase_rules2.join(",");
            $.all(`[data-a-user="${username}"i]`).map((div) => div.closest('[data-a-target="chat-line-message"i]').setAttribute("tt-light", true));
            currentTarget.setAttribute("tt-hidden-message", true);
            Settings.set({ phrase_rules: phrase_rules2 });
          }, "onclick"),
          innerHTML: `${Glyphs.star} Highlight messages from @${name}`
        });
        const svg = $("svg", phrase);
        svg.modStyle("vertical-align:bottom; height:20px; width:20px");
        title.append(phrase);
      } else if (type.equals("emote")) {
        if (phrase_rules && phrase_rules.split(",").contains(`:${name}:`))
          return;
        const phrase = furnish("#tt-highlight-rule--emote", {
          title: "Highlight this emote",
          style: "cursor:pointer; fill:var(--color-green); font-size:1.1rem; font-weight:normal;",
          emote: `:${name}:`,
          onclick: /* @__PURE__ */ __name((event) => {
            let { currentTarget } = event, emote = currentTarget.getAttribute("emote"), { phrase_rules: phrase_rules2 } = Settings;
            phrase_rules2 = (phrase_rules2 || "").split(",");
            phrase_rules2.push(emote);
            phrase_rules2 = phrase_rules2.join(",");
            [
              ...$.getAllElementsByText(emote).filter((div) => div.classList.contains("text-fragment")),
              ...$.all(`img[alt="${emote}"i]`)
            ].map((div) => div.closest('[data-a-target="chat-line-message"i]').setAttribute("tt-light", true));
            currentTarget.remove();
            Settings.set({ phrase_rules: phrase_rules2 });
          }, "onclick"),
          innerHTML: `${Glyphs.star} Highlight <strong>${name}</strong>`
        });
        const svg = $("svg", phrase);
        svg.modStyle("vertical-align:bottom; height:20px; width:20px");
        title.append(phrase);
      }
    }, "handler"),
    /**
     * Checks if the phrase highlighting feature is enabled in settings.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return parseBool(Settings.highlight_phrases);
    }
  });

  // src/plugins/chat/easy-helper-card-resizer.js
  plugin({
    id: "chat.easy_helper_card_resizer",
    job: "easy_helper_card_resizer",
    timer: 250,
    /**
     * Adjusts the height of viewer and emote card titles to prevent content clipping.
     */
    handler: /* @__PURE__ */ __name(() => {
      const card = $('[data-a-target="viewer-card"i], [data-a-target="emote-card"i]');
      if (nullish(card))
        return;
      const title = $("h1,h2,h3,h4,h5,h6", card), { length } = title.children;
      if (length > 2)
        title.modStyle(`height: ${3 * (length - 1) + 1}rem`);
    }, "handler"),
    /**
     * Checks if the card resizer is enabled based on message filtering or highlighting settings.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return parseBool(Settings.filter_messages) || parseBool(Settings.highlight_phrases);
    }
  });

  // src/plugins/chat/highlight-mentions.js
  plugin({
    id: "chat.highlight_mentions",
    job: "highlight_mentions",
    timer: -500,
    /**
     * Highlights chat messages that mention the current user or specific group keywords.
     * @param {Object} context - Plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      Chat.get().map(Chat.onmessage = async (line) => {
        const usernames = [context.USERNAME];
        if (parseBool(Settings.highlight_mentions_extra))
          usernames.push("all", "chat", "everyone");
        if (!~line.mentions.findIndex((username) => RegExp(`^(${usernames.join("|")})$`, "i").test(username)))
          return;
        if (Queue.messages.missing(line.uuid)) {
          Queue.messages.push(line.uuid);
          when((line2) => defined(line2.element) ? line2 : false, 1e3, line).then(async (line2) => {
            const { author, message, style } = line2;
            const element = await line2.element;
            const [color] = style.split(/color:([^;]+)/i).map((s) => s.trim()).filter((s) => s.length).map(Color.destruct);
            element.modStyle(`background-color: var(--color-opac-p-8); border:1px solid ${color}; border-radius:3px;`);
          });
        }
      });
    }, "handler")
  });

  // src/plugins/chat/highlight-mentions-popup.js
  plugin({
    id: "chat.highlight_mentions_popup",
    job: "highlight_mentions_popup",
    timer: -500,
    /**
     * Runs when triggered: monitors chat for mentions of the user and displays a popup footer to facilitate quick replies.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      Chat.get().map(Chat.onmessage = async (line) => {
        if (line.message.missing(context.USERNAME))
          return;
        if (Queue.message_popups.missing(line.uuid)) {
          Queue.message_popups.push(line.uuid);
          when((line2) => defined(line2.element) ? line2 : false, 1e3, line).then(async (line2) => {
            let { author, message, element } = line2, reply = await line2.reply;
            const existing = $("#tt-chat-footer");
            if (defined(existing))
              return;
            new ChatFooter(`@${author} mentioned you.`, {
              onclick: /* @__PURE__ */ __name((event) => {
                var _a;
                const chatbox = $('[class*="chat-input"i] textarea'), existing2 = $("#tt-chat-footer");
                if (defined(chatbox))
                  chatbox.focus();
                if (defined(existing2))
                  existing2.remove();
                $log("Clicked [reply] button", { author, chatbox, existing: existing2, line: line2, message, reply });
                (_a = reply ?? $('button[data-test-selector*="reply"i]', element)) == null ? void 0 : _a.click();
              }, "onclick")
            });
          });
        }
      });
    }, "handler")
  });

  // src/plugins/chat/native-twitch-reply.js
  var NATIVE_REPLY_POLYFILL;
  plugin({
    id: "chat.native_twitch_reply",
    job: "native_twitch_reply",
    timer: 1e3,
    /**
     * Initializes the native reply polyfill state.
     */
    init() {
      NATIVE_REPLY_POLYFILL = void 0;
    },
    /**
     * Implements a polyfill to add native-style reply buttons and input behavior to the chat.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      var _a;
      new context.StopWatch("native_twitch_reply");
      if (nullish(context.GLOBAL_EVENT_LISTENERS.ENTER))
        (_a = $('[data-a-target="chat-input"i]')) == null ? void 0 : _a.addEventListener("keydown", context.GLOBAL_EVENT_LISTENERS.ENTER = ({ key, altKey, ctrlKey, metaKey, shiftKey }) => {
          var _a2;
          if (!(altKey || ctrlKey || metaKey || shiftKey) && key.equals("enter"))
            (_a2 = $("#tt-close-native-twitch-reply")) == null ? void 0 : _a2.click();
        });
      if (defined(NATIVE_REPLY_POLYFILL) || $.defined(".chat-line__reply-icon"))
        return context.StopWatch.stop("native_twitch_reply");
      NATIVE_REPLY_POLYFILL ??= {
        // Button above chat elements
        NewReplyButton: /* @__PURE__ */ __name(({ uuid, style, handle, message, mentions }) => {
          const f = furnish;
          const addedClasses = {
            bubbleContainer: ["chat-input-tray__open", "tt-block", "tt-border-b", "tt-border-l", "tt-border-r", "tt-border-radius-large", "tt-border-t", "tt-c-background-base", "tt-elevation-1", "tt-left-0", "tt-pd-05", "tt-right-0", "tt-z-below"],
            chatContainer: ["chat-input-container__open", "tt-block", "tt-border-bottom-left-radius-large", "tt-border-bottom-right-radius-large", "tt-c-background-base", "tt-pd-05"],
            chatContainerChild: ["chat-input-container__input-wrapper"]
          }, removedClasses = {
            bubbleContainer: ["tt-block", "tt-border-radius-large", "tt-elevation-0", "tt-left-0", "tt-pd-0", "tt-right-0", "tt-z-below"],
            chatContainer: ["tt-block", "tt-border-radius-large", "tt-pd-0"]
          };
          return f(".chat-line__reply-icon.tt-absolute.tt-border-radius-medium.tt-c-background-base.tt-elevation-1").with(
            f(
              "button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=chat-reply-button]",
              {
                onclick: /* @__PURE__ */ __name((event) => {
                  let { currentTarget } = event, messageElement = currentTarget.closest("div").previousElementSibling, chatInput = $('[data-a-target="chat-input"i]'), [bubbleContainer, chatContainer] = $.all(".chat-input > :last-child > :first-child > :not(:first-child)"), chatContainerChild = $("div", chatContainer);
                  const f2 = furnish;
                  AddNativeReplyBubble: {
                    bubbleContainer.classList.remove(...removedClasses.bubbleContainer);
                    bubbleContainer.classList.add(...addedClasses.bubbleContainer);
                    chatContainer.classList.remove(...removedClasses.chatContainer);
                    chatContainer.classList.add(...addedClasses.chatContainer);
                    chatContainerChild.classList.add(...addedClasses.chatContainerChild);
                    bubbleContainer.append(
                      f2(`#tt-native-twitch-reply.tt-align-items-start.tt-flex.tt-flex-row.tt-pd-0[@testSelector=chat-input-tray]`).with(
                        f2(".tt-align-center.tt-mg-05").with(
                          f2(".tt-align-items-center.tt-flex").html(Glyphs.modify("reply", { height: "24px", width: "24px" }))
                        ),
                        f2(".tt-flex-grow-1.tt-pd-l-05.tt-pd-y-05").with(
                          f2("span.tt-c-text-alt.tt-font-size-5.tt-strong.tt-word-break-word", {
                            "connected-to": uuid,
                            handle,
                            message,
                            mentions,
                            innerHTML: `Replying to <span style="${style}">@${handle}</span>`
                          })
                        ),
                        f2(".tt-right-0.tt-top-0").with(
                          f2(
                            "button#tt-close-native-twitch-reply.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative",
                            {
                              onclick: /* @__PURE__ */ __name((event2) => {
                                const chatInput2 = $('[data-a-target="chat-input"i]'), [bubbleContainer2, chatContainer2] = $.all(".chat-input > :last-child > :first-child > :not(:first-child)"), chatContainerChild2 = $("div", chatContainer2);
                                RemoveNativeReplyBubble: {
                                  bubbleContainer2.classList.remove(...addedClasses.bubbleContainer);
                                  bubbleContainer2.classList.add(...removedClasses.bubbleContainer);
                                  chatContainer2.classList.remove(...addedClasses.chatContainer);
                                  chatContainer2.classList.add(...removedClasses.chatContainer);
                                  chatContainerChild2.classList.remove(...addedClasses.chatContainerChild);
                                  $.all('[id^="tt-native-twitch-reply"i]').forEach((element) => element.remove());
                                  chatInput2.setAttribute("placeholder", "Send a message");
                                }
                              }, "onclick"),
                              innerHTML: Glyphs.modify("x", { height: "24px", width: "24px" })
                            }
                          )
                        )
                      )
                    );
                    bubbleContainer.append(
                      f2("#tt-native-twitch-reply-message.font-scale--default.tt-pd-x-1.tt-pd-y-05.chat-line__message[@aTarget=chat-line-message][@testSelector=chat-line-message]").with(
                        f2(".tt-relative").html(messageElement.outerHTML)
                      )
                    );
                    chatInput.setAttribute("placeholder", "Send a reply");
                  }
                  chatInput.focus();
                }, "onclick")
              },
              f("span.tt-button-icon__icon").with(
                f(
                  "div",
                  { style: "width: 2rem; height: 2rem;" },
                  f(".tt-icon").with(
                    f(".tt-aspect").html(Glyphs.reply)
                  )
                )
              )
            )
          );
        }, "NewReplyButton"),
        // Highlighter for chat elements
        AddNativeReplyButton: /* @__PURE__ */ __name((line) => {
          when((line2) => defined(line2.element) ? line2 : false, 1e3, line).then(async (line2) => {
            const { uuid, style, handle, message, mentions, element } = line2;
            if ($.defined(".chat-line__message-container", element))
              return;
            if (handle == context.USERNAME)
              return;
            const parent = $("div", element);
            if (nullish(parent))
              return;
            const target = $("div", parent);
            if (nullish(target))
              return;
            const highlighter = furnish(".chat-line__message-highlight.tt-absolute.tt-border-radius-medium[@testSelector=chat-message-highlight]", {});
            target.classList.add("chat-line__message-container");
            parent.insertBefore(highlighter, parent.firstElementChild);
            parent.append(NATIVE_REPLY_POLYFILL.NewReplyButton({ uuid, style, handle, message, mentions }));
          });
        }, "AddNativeReplyButton")
      };
      Chat.get().map(NATIVE_REPLY_POLYFILL.AddNativeReplyButton);
      Chat.onmessage = NATIVE_REPLY_POLYFILL.AddNativeReplyButton;
      context.StopWatch.stop("native_twitch_reply");
    }, "handler"),
    /**
     * Initializes the native reply button feature.
     */
    setup() {
      $remark("Adding native reply buttons...");
    }
  });

  // src/plugins/chat/link-maker-chat.js
  var LINK_MAKER_ENABLED;
  var CHAT_CARDIFIED;
  var CHAT_CARDIFYING_TIMERS;
  var REWARDS_CARDIFIER;
  var REWARDS_CARDIFIED;
  var LINK_PARSER;
  plugin({
    id: "chat.link_maker__chat",
    job: "link_maker__chat",
    timer: -500,
    /**
     * Initializes state and caches for the chat link maker.
     */
    init() {
      LINK_MAKER_ENABLED = void 0;
      CHAT_CARDIFIED = /* @__PURE__ */ new Map();
      CHAT_CARDIFYING_TIMERS = /* @__PURE__ */ new Map();
      REWARDS_CARDIFIER = void 0;
      REWARDS_CARDIFIED = /* @__PURE__ */ new Map();
      LINK_PARSER = new DOMParser();
    },
    /**
     * Converts Blerp links in chat and reward cards into rich cards or audio players.
     * @param {Object} context - Plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      REWARDS_CARDIFIER = setInterval(() => {
        var _a, _b;
        const f = furnish;
        const card = $('[class*="reward"i][class*="center"i][class*="body"i]');
        const timerStart = +/* @__PURE__ */ new Date();
        if (nullish(card))
          return;
        const content = card.getElementByText(/\bblerp.com\//i), alias = (_b = (_a = card.closest('[class*="reward"i][class*="center"i][class*="content"i]')) == null ? void 0 : _a.querySelector('[id*="reward"i][id*="center"i][id*="header"i]')) == null ? void 0 : _b.textContent;
        if (nullish(content))
          return;
        const { href = "", origin, protocol, scheme, host, hostname, port, pathname, search, hash } = parseURL(content.innerText);
        if (href.trim().length < 2)
          return;
        content.innerHTML = f(
          "a[target=_blank]",
          { href, style: "padding:1rem;margin:1rem" },
          f.img({ src: "https://cdn.blerp.com/Favicons/favicon-16x16.png", style: "margin-right:1rem;vertical-align:middle" }),
          f(`span[@blerp=${pathname}]`).with(`Blerp soundbite: ${alias}`)
        ).outerHTML;
        fetchURL.idempotent(href).then((response) => response.text()).then(DOMParser.stripBody).then((html) => new DOMParser().parseFromString(html, "text/html")).catch($warn).then((DOM) => {
          var _a2;
          if (!(DOM instanceof Document))
            throw TypeError(`No DOM available. Page not loaded`);
          const f2 = furnish;
          const get = /* @__PURE__ */ __name((property) => DOM.get(property), "get");
          let [title, description, image, url, audio] = ["title", "description", "image", "url", "audio"].map(get), error = (_a2 = DOM.querySelector("parsererror")) == null ? void 0 : _a2.textContent;
          $log(`Loaded page: Blerp @ ${href}`, { title, description, image, DOM, size: (DOM.documentElement.innerHTML.length * 8).suffix("B", 2, "data"), time: ((+/* @__PURE__ */ new Date() - timerStart) / 1e3).suffix("s", false) });
          if (!(title == null ? void 0 : title.length) || !(image == null ? void 0 : image.length)) {
            if (!(error == null ? void 0 : error.length))
              return;
            else
              throw error;
          }
          const aliasContainer = $(`[data-blerp="${parseURL(url).pathname}"i]`), audioContainer = f2(`audio[controls]`, { style: "margin:1rem 0; min-width:50%;" }, f2.source({ src: audio }));
          if (nullish(aliasContainer))
            return;
          description = description.split(/memes?[\.!\?]/, 2).pop();
          aliasContainer.innerHTML = encodeHTML(`Blerp soundbite: ${title}`);
          aliasContainer.title = description || title;
          aliasContainer.append(audioContainer);
        });
      }, 1e3);
      Chat.get().map(Chat.onmessage = async (line) => {
        if (!LINK_MAKER_ENABLED)
          return;
        let { message, mentions, author, element } = line;
        const parsed = parseURL.pattern.exec(message);
        if (!(parsed == null ? void 0 : parsed.length))
          return;
        let { groups } = parsed, { href = "", origin, protocol, scheme, host, hostname, port, pathname, search, hash } = groups;
        if (href.trim().length < 2)
          return;
        const unknown = /* @__PURE__ */ Symbol("UNKNOWN");
        const url = parseURL(href.replace(/^(https?:\/\/)?/i, `${location.protocol}//`).trim()), [topDom = "", secDom = "", ...subDom] = url.domainPath ?? ["tv", "twitch", "clips"];
        if (subDom.contains("clips") || (pathname == null ? void 0 : pathname.contains("/videos/", "/clip/")))
          return;
        if ("instagram twitter".split(" ").contains(secDom.toLowerCase()))
          return;
        href = url.href.replace(url.hostname, [...subDom, secDom, topDom].filter((dom) => dom.length).join("."));
        element = await element;
        if (CHAT_CARDIFIED.has(href)) {
          const card = CHAT_CARDIFIED.get(href);
          if (nullish($(`#card-${UUID.from(href).toStamp()}`, element)) && defined(card)) {
            element.insertAdjacentElement("beforeend", card);
            if ($.nullish('[class*="chat-paused"i]'))
              card.scrollIntoViewIfNeeded(true);
          }
          return;
        }
        CHAT_CARDIFIED.set(href, null);
        CHAT_CARDIFYING_TIMERS.set(href, +/* @__PURE__ */ new Date());
        fetchURL.idempotent(href).then((response) => {
          var _a;
          return ((_a = response.text) == null ? void 0 : _a.call(response)) ?? `<!doctype html><html><head></head></html>`;
        }).then(DOMParser.stripBody).then((html) => LINK_PARSER.parseFromString(html, "text/html")).then((DOM) => {
          var _a;
          if (!(DOM instanceof Document))
            throw TypeError(`No DOM available. Page not loaded`);
          const f = furnish;
          const get = /* @__PURE__ */ __name((property) => DOM.get(property), "get");
          const [title = "", description = "", image] = ["title", "description", "image"].map(get), error = (_a = DOM.querySelector("parsererror")) == null ? void 0 : _a.textContent;
          $log(`Loaded page: Card @ ${href}`, { title, description, image, DOM, size: (DOM.documentElement.innerHTML.length * 8).suffix("B", 2, "data"), time: ((+/* @__PURE__ */ new Date() - CHAT_CARDIFYING_TIMERS.get(href)) / 1e3).suffix("s", false) });
          if (!(title == null ? void 0 : title.length) || !(image == null ? void 0 : image.length)) {
            CHAT_CARDIFIED.set(href, f.span());
            if (!(error == null ? void 0 : error.length))
              return;
            else
              throw error;
          }
          const card = f(".tt-iframe-card.tt-border-radius-medium.tt-elevation-1").with(
            f(".tt-border-radius-medium.tt-c-background-base.tt-flex.tt-full-width").with(
              f(
                "a.tt-block.tt-border-radius-medium.tt-full-width.tt-interactable",
                { rel: "noopener noreferrer", target: "_blank", href },
                f(".chat-card.tt-flex.tt-flex-nowrap.tt-pd-05").with(
                  // Preview image
                  f(".chat-card__preview-img.tt-align-items-center.tt-c-background-alt-2.tt-flex.tt-flex-shrink-0.tt-justify-content-center").with(
                    f(".tt-card-image").with(
                      f(".tt-aspect").with(
                        f("div", {}),
                        f("img.tt-image", {
                          alt: title,
                          src: image.replace(/^(?!(?:https?:)?\/\/[^\/]+)\/?/i, `${location.protocol}//${host}/`),
                          height: 45,
                          style: "max-height:45px",
                          onerror({ currentTarget }) {
                            currentTarget.src = context.STREAMER.icon;
                          }
                        })
                      )
                    )
                  ),
                  // Title & Subtitle
                  f(".tt-align-items-center.tt-flex.tt-overflow-hidden").with(
                    f(".tt-full-width.tt-pd-l-1").with(
                      // Title
                      f(".chat-card__title.tt-ellipsis").with(
                        f("p.tt-strong.tt-ellipsis[@testSelector=chat-card-title]").html(title)
                      ),
                      // Subtitle
                      f(".tt-ellipsis").with(
                        f("p.tt-c-text-alt-2.tt-ellipsis[@testSelector=chat-card-description]").html(description)
                      )
                    )
                  )
                )
              )
            )
          );
          const container = f(`#card-${UUID.from(href).toStamp()}.chat-line__message[@aTarget=chat-line-message][@testSelector=chat-line-message]`).with(
            f(".tt-relative").with(
              f(".tt-relative.chat-line__message-container").with(
                f("div").with(
                  f(".chat-line__no-background.tt-inline").with(
                    card
                  )
                )
              )
            )
          );
          CHAT_CARDIFIED.set(href, container);
          element.insertAdjacentElement("beforeend", container);
          if ($.nullish('[class*="chat-paused"i]'))
            container.scrollIntoViewIfNeeded(true);
        }).catch($error);
      });
    }, "handler"),
    /**
     * Undoes the link maker feature by cleaning up intervals and removing generated cards.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      LINK_MAKER_ENABLED = false;
      clearInterval(REWARDS_CARDIFIER);
      $.all(".tt-iframe-card").map((card) => card.remove());
    }, "unhandler"),
    /**
     * Checks if the chat link maker is enabled in settings.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return LINK_MAKER_ENABLED = parseBool(Settings.link_maker__chat);
    },
    /**
     * Sets up the chat link maker and logs the action.
     */
    setup() {
      $remark("Adding link maker (chat)...");
    }
  });

  // src/plugins/chat/auto-chat-vip.js
  var AUTO_CHAT_NAME;
  plugin({
    id: "chat.auto_chat__vip",
    job: "auto_chat__vip",
    timer: -5e3,
    /**
     * Runs on initialization: defines the cache key for the auto-chat feature based on the current streamer.
     * @param {Object} context - The plugin context
     */
    init(context) {
      AUTO_CHAT_NAME = `auto-chat/${context.STREAMER.sole}`;
    },
    /**
     * Runs when triggered: automatically sends a chat message if the user is lurking and meets specific channel, badge, or VIP criteria.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      if (Settings.auto_chat__vip === true)
        Settings.set({ auto_chat__vip: "vip" });
      else if (Settings.auto_chat__vip === false)
        Settings.set({ auto_chat__vip: null });
      const goTime = +/* @__PURE__ */ new Date() + parseInt(Settings.auto_chat__wait_time) * 6e4;
      when(() => +/* @__PURE__ */ new Date() >= goTime, 5e3).then((ready) => {
        Cache.load(AUTO_CHAT_NAME, (results) => {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i;
          let old = results[AUTO_CHAT_NAME], now = /* @__PURE__ */ new Date();
          if (nullish(old))
            old = now;
          else
            old = new Date(old);
          if (now - old && now - old < parseTime("8:00:00"))
            return;
          const Rules = context.UPDATE_RULES("lurking", ";");
          const userSent = [...Chat.messages].find(([, { author }]) => author.equals(context.USERNAME));
          if (defined(userSent)) {
            const [uuid, line] = userSent;
            now = defined(line.timestamp) ? new Date(line.timestamp) : now;
            $notice(`The user already sent a message!`, line);
          } else {
            const channel = (_a = context.STREAMER.name) == null ? void 0 : _a.toLowerCase();
            const badges = ((_b = context.STREAMER.perm) == null ? void 0 : _b.all) ?? ["everyone"];
            let message, messages, reason;
            if (Rules.channel.test(channel)) {
              message = (_e = (_d = messages = (_c = Rules.rules.specific.channel) == null ? void 0 : _c.filter(({ name, badge, text }) => {
                if (nullish(context.STREAMER))
                  return;
                return parseBool(
                  name.equals(channel) && (nullish(badge) || badges.filter((medal) => medal.toLowerCase().startsWith(badge.toLowerCase())).length)
                );
              })) == null ? void 0 : _d.random()) == null ? void 0 : _e.text;
              reason = "channel";
            } else if (Rules.badge.test(badges.join(","))) {
              message = (_h = (_g = messages = (_f = Rules.rules.specific.badge) == null ? void 0 : _f.filter(({ badge, text }) => {
                return parseBool(
                  badges.filter((medal) => medal.toLowerCase().startsWith(badge.toLowerCase())).length
                );
              })) == null ? void 0 : _g.random()) == null ? void 0 : _h.text;
              reason = "badge";
            } else if ((_i = context.STREAMER.perm) == null ? void 0 : _i.has(Settings.auto_chat__vip)) {
              message = (messages = Rules.rules.general).random();
              reason = `permission (${Settings.auto_chat__vip})`;
            }
            if (nullish(message))
              return;
            $notice(`Sending lurking message because the ${reason} matches`, message, messages);
            Chat.send(message);
          }
          Cache.save({ [AUTO_CHAT_NAME]: now.toJSON() });
        });
      });
      Chat.onmessage = async ({ uuid, author, usable, message, mentions, deleted }) => {
        if (mentions.map((username) => username.toLowerCase()).missing(context.USERNAME.toLowerCase()) && message.toLowerCase().missing(context.USERNAME))
          return;
        if (await deleted)
          return;
        if (!usable)
          return;
        switch (Settings.auto_chat__mentions) {
          case "reply":
            {
              Chat.reply(uuid, "AFK. BRB");
            }
            break;
          default: {
            return;
          }
        }
      };
    }, "handler")
  });

  // src/plugins/chat/prevent-spam.js
  var SPAM;
  plugin({
    id: "chat.prevent_spam",
    job: "prevent_spam",
    timer: -1e3,
    /**
     * Initializes the spam tracking list.
     */
    init() {
      SPAM = [];
    },
    /**
     * Runs every tick: Monitors chat messages for plagiarism or repetitive patterns and marks them as spam.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      new context.StopWatch("prevent_spam");
      function markAsSpam(element, type = "spam", message, phrase = "") {
        const spam_placeholder = "chat-deleted-message-placeholder";
        const span = furnish(`span.chat-line__message--deleted-notice.tt-spam-filter-${type}[@aTarget=${spam_placeholder}][@testSelector=${spam_placeholder}]`).with(`message marked as ${type}.`);
        $.all(':is([data-test-selector="chat-message-separator"i], [class*="username-container"i] + *) ~ * > *', element).forEach((sibling) => sibling.remove());
        $('[data-test-selector="chat-message-separator"i], [class*="username-container"i] + *', element).parentElement.append(span);
        element.dataset[type] = message;
        if (phrase.length > 1) {
          element.setAttribute(`${type}-phrase`, phrase);
          message = message.replace(RegExp(phrase.replace(/\W/g, "\\$&"), "ig"), `<del>${phrase}</del>`);
        }
        new Tooltip(element, message, { direction: "up", fit: true });
      }
      __name(markAsSpam, "markAsSpam");
      async function spamChecker(element, message, author, lookBack, minLen, minOcc) {
        if (message.length < 1 || RegExp(`^${context.USERNAME}$`, "i").test(author))
          return message;
        if (SPAM.slice(-lookBack).contains(message))
          markAsSpam(await element, "plagiarism", message);
        const regexp = RegExp(`(?<phrase>[\\S]{${minLen},}?)${"(?:(?:[^]+)?\\1)".repeat(minOcc - 1)}`, "i");
        if (regexp.test(message))
          markAsSpam(await element, "repetitive", message, regexp.exec(message).groups.phrase);
        return message;
      }
      __name(spamChecker, "spamChecker");
      Chat.get().map(Chat.onmessage = async (line) => {
        SPAM = [
          ...SPAM,
          await spamChecker(
            line.element,
            line.message,
            line.author,
            parseInt(Settings.prevent_spam_look_back ?? 15),
            parseInt(Settings.prevent_spam_minimum_length ?? 3),
            parseInt(Settings.prevent_spam_ignore_under ?? 5)
          )
        ].isolate();
      });
      context.StopWatch.stop("prevent_spam");
    }, "handler"),
    /**
     * Sets up the spam filter event listener.
     */
    setup() {
      $remark("Adding spam event listener...");
    }
  });

  // src/plugins/chat/simplify-chat.js
  var SimplifyChatIndexToggle;
  plugin({
    id: "chat.simplify_chat",
    job: "simplify_chat",
    timer: -250,
    /**
     * Initializes the chat simplification toggle index.
     */
    init() {
      SimplifyChatIndexToggle = 0;
    },
    /**
     * Applies visual simplifications to the chat, including custom fonts, monotone usernames, and text normalization.
     */
    handler: /* @__PURE__ */ __name(() => {
      if (parseBool(Settings.simplify_chat_monotone_usernames))
        AddCustomCSSBlock("Simplify Chat Monotone Usernames", `[data-a-target="chat-message-username"i] { color: var(--color-text-base) !important }`);
      if (parseBool(Settings.simplify_chat_font) || parseBool(Settings.simplify_page_font)) {
        const src = Runtime.getURL("/font");
        AddCustomCSSBlock("Simplify Page Font", `body { font-family: ${Settings.simplify_page_font}, Sans-Serif !important }`);
        AddCustomCSSBlock("Simplify Chat Font", `[data-a-target*="chat"i][data-a-target*="message"i] { font-family: ${Settings.simplify_chat_font}, Sans-Serif !important }`);
        AddCustomCSSBlock("Simplify Font (Head)", `
            @font-face {
                font-family: Roobert;
                font-weight: normal;
                src: url("${src}/Roobert.woff2") format("woff2");
            }

            @font-face {
                font-family: Roobert;
                font-weight: bold;
                src: url("${src}/Roobert-Bold.woff2") format("woff2");
            }

            @font-face {
                font-family: Dyslexie;
                font-weight: 100 400;
                src: url("${src}/Dyslexie-Regular.woff") format("woff");
            }

            @font-face {
                font-family: Dyslexie;
                font-weight: 500 900;
                src: url("${src}/Dyslexie-Bold.woff") format("woff");
            }

            @font-face {
                font-family: "04b03";
                font-weight: normal;
                src: url("${src}/04b03.woff2") format("woff2");
            }

            @font-face {
                font-family: Inter;
                font-style: normal;
                font-weight: normal;
                src: url("${src}/Inter.woff") format("woff");
                unicode-range:
                    U+00??, U+0131, U+0152-0153, U+02bb-02bc, U+02c6, U+02da, U+02dc, U+2000-206f,
                    U+2074, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd;
            }
            `);
      }
      if (parseBool(Settings.simplify_chat))
        AddCustomCSSBlock("Simplify Chat", `.tt-visible-message-even { background-color: #8882 }`);
      Chat.get().map(Chat.defer.onmessage = async (line) => {
        const allNodes = /* @__PURE__ */ __name((node) => (node.childNodes.length ? [...node.childNodes].map(allNodes) : [node]).flat(), "allNodes");
        const element = await line.element;
        const keep = !(element.hasAttribute("data-plagiarism") || element.hasAttribute("data-repetitive") || element.hasAttribute("tt-hidden-message"));
        if (keep) {
          element.classList.add(`tt-visible-message-${["even", "odd"][SimplifyChatIndexToggle ^= 1]}`);
          allNodes(element).filter((node) => node.nodeName.equals("text")).map((text) => text.nodeValue = text.nodeValue.normalize("NFKD"));
        }
      });
    }, "handler"),
    /**
     * Undoes the chat simplification by removing applied custom CSS blocks.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      ["Simplify Chat", "Simplify Chat Monotone Usernames", "Simplify Chat Font", "Simplify Page Font", "Simplify Font (Head)"].map((block) => RemoveCustomCSSBlock(block));
    }, "unhandler"),
    /**
     * Checks if the chat simplification feature is enabled.
     * @returns {boolean} Always returns true
     */
    enabled() {
      return true;
    },
    /**
     * Sets up the chat simplification feature and logs the action.
     */
    setup() {
      $remark("Applying readability settings...");
    }
  });

  // src/plugins/chat/convert-bits.js
  plugin({
    id: "chat.convert_bits",
    job: "convert_bits",
    timer: 1e3,
    /**
     * Runs every tick: Converts bit amounts to USD values in the UI for buy menus, counters, cheers, and hype trains.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      new context.StopWatch("convert_bits");
      const dropdown = $('[class*="bits-buy"i]'), bits_counter = $.all('[class*="bits-count"i]:not([tt-tusda])'), bits_cheer = $.all('[class*="cheer-amount"i]:not([tt-tusda])'), hype_trains = $.all('[class*="community-highlight-stack"i] p:not([tt-tusda])');
      const bits_num_regexp = /([\d,]+)(?: +bits)?/i, bits_alp_regexp = /([\d,]+) +bits/i;
      const _0 = /(\D\d)$/;
      if (defined(dropdown))
        $.all("h5:not([tt-tusda])", dropdown).map((header) => {
          let bits = parseInt(header.textContent.replace(/\D+/g, "")), usd;
          usd = (bits * 0.01).toFixed(2);
          header.append(furnish.var(` ($${comify(usd).replace(_0, "$10")})`));
          header.setAttribute("tt-tusda", usd);
        });
      for (const counter of bits_counter) {
        const { innerHTML } = counter;
        if (bits_alp_regexp.test(innerHTML))
          counter.innerHTML = innerHTML.replace(bits_alp_regexp, ($0, $1, $$, $_) => {
            let bits = parseInt($1.replace(/\D+/g, "")), usd;
            usd = (bits * 0.01).toFixed(2);
            counter.setAttribute("tt-tusda", usd);
            return `${$0} ${furnish.var(`($${comify(usd).replace(_0, "$10")})`).outerHTML}`;
          });
      }
      for (const cheer of bits_cheer) {
        const { innerHTML } = cheer;
        if (bits_num_regexp.test(innerHTML))
          cheer.innerHTML = innerHTML.replace(bits_num_regexp, ($0, $1, $$, $_) => {
            let bits = parseInt($1.replace(/\D+/g, "")), usd;
            usd = (bits * 0.01).toFixed(2);
            cheer.setAttribute("tt-tusda", usd);
            return `${$0} ${furnish.var(`($${comify(usd).replace(_0, "$10")})`).outerHTML}`;
          });
      }
      for (const train of hype_trains) {
        const { innerHTML } = train;
        if (bits_alp_regexp.test(innerHTML))
          train.innerHTML = innerHTML.replace(bits_alp_regexp, ($0, $1, $$, $_) => {
            let bits = parseInt($1.replace(/\D+/g, "")), usd;
            usd = (bits * 0.01).toFixed(2);
            train.setAttribute("tt-tusda", usd);
            return `${$0} ${furnish.var(`($${comify(usd).replace(_0, "$10")})`).outerHTML}`;
          });
      }
      context.StopWatch.stop("convert_bits");
    }, "handler"),
    /**
     * Sets up the bit converter feature.
     */
    setup() {
      $remark("Adding Bit converter...");
    }
  });

  // src/plugins/chat/rewards-calculator.js
  var REWARDS_CALCULATOR_TEXT;
  plugin({
    id: "chat.rewards_calculator",
    job: "rewards_calculator",
    timer: 250,
    /**
     * Initializes reward calculation variables in the context.
     * @param {Object} context - The plugin context
     */
    init(context) {
      context.CHANNEL_POINTS_MULTIPLIER = void 0;
      REWARDS_CALCULATOR_TEXT = void 0;
    },
    /**
     * Runs every tick: Calculates and displays the estimated time and streams needed to afford a channel reward.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
      new context.StopWatch("rewards_calculator");
      __GetMultiplierAmount__:
        if (nullish(context.CHANNEL_POINTS_MULTIPLIER)) {
          const button = $('[data-test-selector*="points"i][data-test-selector*="summary"i] button');
          if (defined(button)) {
            button.click();
            (_c = (_b = (_a = $('.reward-center-body [href*="//help.twitch.tv/"i]')) == null ? void 0 : _a.closest(".reward-center-body")) == null ? void 0 : _b.querySelector("button")) == null ? void 0 : _c.click();
            const pop = $('[class*="rewards"i][class*="popover"i]');
            const btn = (_d = $('img[class*="channel"i][class*="points"i], svg', pop)) == null ? void 0 : _d.closest("button");
            if (nullish(btn)) {
              context.CHANNEL_POINTS_MULTIPLIER = 1;
              break __GetMultiplierAmount__;
            }
            const mux = btn.textContent.replace(/.*\((.+)\).*/, ($0, $1, $$, $_) => parseFloat($1));
            const bal = ((_e = btn.ariaLabel) == null ? void 0 : _e.replace(/.*([\d\.,]).*/, "$1")) ?? 0;
            context.CHANNEL_POINTS_MULTIPLIER = mux | 0 ? mux : 1;
            button.click();
          } else {
            context.CHANNEL_POINTS_MULTIPLIER = 1;
          }
        }
      const container = (_g = (_f = $('[data-test-selector*="required"i][data-test-selector*="points"i]:not(:empty)')) == null ? void 0 : _f.closest) == null ? void 0 : _g.call(_f, "button");
      if (nullish(container)) {
        context.StopWatch.stop("rewards_calculator");
        RemoveCustomCSSBlock("tt-rewards-calc");
      }
      const averageBroadcastTime = ((((_h = context.STREAMER.data) == null ? void 0 : _h.dailyBroadcastTime) ?? 162e5) / 36e5).clamp(0, 24), activeDaysPerWeek = (((_i = context.STREAMER.data) == null ? void 0 : _i.activeDaysPerWeek) ?? 5).clamp(1, 7), pointsEarnedPerHour = 120 + 200 * +Settings.auto_claim_bonuses;
      const timeLeftInBroadcast = averageBroadcastTime - context.STREAMER.time / 36e5;
      const have = parseFloat(parseCoin((_j = $.last('[data-test-selector*="balance-string"i]')) == null ? void 0 : _j.innerText) | 0), este = parseFloat(timeLeftInBroadcast * pointsEarnedPerHour * context.CHANNEL_POINTS_MULTIPLIER), goal = parseFloat(((_m = (_l = (_k = $('[data-test-selector*="required"i][data-test-selector*="points"i]')) == null ? void 0 : _k.previousSibling) == null ? void 0 : _l.textContent) == null ? void 0 : _m.replace(/\D+/g, "")) | 0), need = goal - have;
      container == null ? void 0 : container.modStyle(`background:linear-gradient(to right,var(--color-background-button-primary-default) 0 ${(100 * (have / goal)).toFixed(3)}%,var(--color-opac-p-8) 0 ${(100 * ((have + este) / goal)).toFixed(3)}%,var(--color-background-button-disabled) 0 0); color:var(--color-text-base)!important; text-shadow:0 0 1px var(--color-background-alt);`);
      const { ceil, floor, round } = Math;
      const hours = need / (pointsEarnedPerHour * context.CHANNEL_POINTS_MULTIPLIER), days = hours / 24 * (24 / averageBroadcastTime), weeks = days / 7 * (7 / (activeDaysPerWeek || averageBroadcastTime / 24)), months = weeks / 4, years = months / 12;
      let streams = ceil(hours / averageBroadcastTime), estimated = "minute", timeEstimated = 60 * (ceil(hours * 4) / 4);
      if (hours < 0) {
        return;
      }
      if (hours > 1) {
        estimated = "hour";
        timeEstimated = hours;
      }
      if (hours > averageBroadcastTime) {
        estimated = "day";
        timeEstimated = days;
      }
      if (days > activeDaysPerWeek) {
        estimated = "week";
        timeEstimated = weeks;
      }
      if (days > 30) {
        estimated = "month";
        timeEstimated = months;
      }
      if (months > 12) {
        estimated = "year";
        timeEstimated = years;
      }
      if (years > 100) {
        estimated = "century";
        timeEstimated = years / 100;
      }
      timeEstimated = ceil(timeEstimated);
      function estimates(language) {
        return fetchURL(`get:ext/times.json`).then((response) => response.json()).then((json) => json[language]);
      }
      __name(estimates, "estimates");
      function correct(string, number) {
        number ??= parseInt(string.replace(/[^]*?(\d+)[^]*/, "$1"));
        return string.replace(/%d\b/g, comify(number)).replace(/%([^>]*)>([^\s]*)/g, number > 1 ? "$2" : "$1");
      }
      __name(correct, "correct");
      const T_L = top.LANGUAGE;
      switch (T_L) {
        case "bg":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `${streams < 1 || hours < timeLeftInBroadcast ? "Достъпно по време на този" : `Предлага се в още ${comify(streams)}`} ${"поток" + ["и", "а"][+(streams > 1)]} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "cs":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `${streams < 1 || hours < timeLeftInBroadcast ? "Dostupné během tohoto" : `K dispozici v dalších ${comify(streams)}`} ${"stream" + ["u", "ech"][+(streams > 1)]} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "da":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Tilgængelig ${streams < 1 || hours < timeLeftInBroadcast ? "under denne" : `i ${comify(streams)} flere`} ${"stream".pluralSuffix(streams, "s")} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "de":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `${streams < 1 || hours < timeLeftInBroadcast ? "In diesem Strom" : `Erhältlich in ${comify(streams)} mehr`} ${"Stream".pluralSuffix(streams, "s")} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "fi":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Saatavilla ${streams < 1 || hours < timeLeftInBroadcast ? "tämän streamin aikana" : `vielä ${comify(streams)} suorana`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "hu":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `${streams < 1 || hours < timeLeftInBroadcast ? "Elérhető a stream alatt" : `${comify(streams)} további adatfolyamban elérhető`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "no":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Tilgjengelig ${streams < 1 || hours < timeLeftInBroadcast ? "under denne strømmen" : `i ${comify(streams)} strømmer til`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "pl":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Dostępne ${streams < 1 || hours < timeLeftInBroadcast ? "podczas tej transmisji" : `w ${comify(streams)} kolejnych strumieniach`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "sk":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Dostupné ${streams < 1 || hours < timeLeftInBroadcast ? "počas tohto" : `v ${comify(streams)}`} ${"stream" + ["u", "och"][+(streams > 1)]} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "tr":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `${streams < 1 || hours < timeLeftInBroadcast ? "Bu yayın sırasında kullanılabilir" : `${comify(streams)} akışta daha mevcuttur`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "el":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Διαθέσιμο ${streams < 1 || hours < timeLeftInBroadcast ? "κατά τη διάρκεια αυτής της" : `σε ${comify(streams)} ακόμη`} ${"ρο" + ["ής", "ές"][+(streams > 1)]} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "fr":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Disponible ${streams < 1 || hours < timeLeftInBroadcast ? "pendant ce stream" : `dans ${comify(streams)} flux supplémentaires`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "nl":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Beschikbaar ${streams < 1 || hours < timeLeftInBroadcast ? "tijdens deze" : `in nog ${comify(streams)}`} ${"stream".pluralSuffix(streams, "s")} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "it":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Disponibile ${streams < 1 || hours < timeLeftInBroadcast ? "durante questo" : `in altri ${comify(streams)}`} ${"stream" + ["ing", ""][+(streams > 1)]} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "ro":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Disponibil în ${streams < 1 || hours < timeLeftInBroadcast ? "timpul acestui" : `încă  ${comify(streams)} de`} ${"flux" + ["", "uri"][+(streams > 1)]} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "ja":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `${streams < 1 || hours < timeLeftInBroadcast ? "このストリーム中に" : `さらに${comify(streams)}のストリームで`} ${"利用可能" + ["_", "s"][+(streams > 1)]} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "zh-ch":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `${streams < 1 || hours < timeLeftInBroadcast ? "在此直播期间可用" : `在另外 ${comify(streams)} 个流中可用`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "zh-tw":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `${streams < 1 || hours < timeLeftInBroadcast ? "在此直播期間可用" : `在另外 ${comify(streams)} 個流中可用`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "ko":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `${streams < 1 || hours < timeLeftInBroadcast ? "이 스트림 동안" : `${comify(streams)}개 이상의 스트림에서`} 사용 가능 (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "sv":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Tillgänglig ${streams < 1 || hours < timeLeftInBroadcast ? "under denna" : `i ytterligare ${comify(streams)}`} ${"stream".pluralSuffix(streams, "s")} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "th":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `${streams < 1 || hours < timeLeftInBroadcast ? "ได้ในสตรีมนี้" : `พร้อมให้บริการในอีก ${comify(streams)} สตรีม`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "vi":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Có sẵn trong ${streams < 1 || hours < timeLeftInBroadcast ? "" : comify(streams)} ${"luồng " + ["này", "khác"][+(streams > 1)]} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "es":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Disponible ${streams < 1 || hours < timeLeftInBroadcast ? "durante este arroyo" : `en ${comify(streams)} arroyos más`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "ru":
          {
            estimates(T_L).then((estimates2) => {
              estimated = estimates2[estimated].pop();
              REWARDS_CALCULATOR_TEXT = `Доступно ${streams < 1 || hours < timeLeftInBroadcast ? "во время этого потока" : `в ${comify(streams)} ручьях`} (${correct(estimated, timeEstimated)})`;
            });
          }
          break;
        case "en":
        default:
          {
            REWARDS_CALCULATOR_TEXT = `Available ${streams < 1 || hours < timeLeftInBroadcast ? "during this" : `in ${comify(streams)} more`} ${"stream".pluralSuffix(streams, "s")} (${comify(timeEstimated)} ${estimated.pluralSuffix(timeEstimated)})`;
          }
          break;
      }
      AddCustomCSSBlock("tt-rewards-calc", `
            [tt-rewards-calc="before"i]::before {
                content: "${REWARDS_CALCULATOR_TEXT}";
            }

            [tt-rewards-calc="after"i]::after {
                content: "${REWARDS_CALCULATOR_TEXT}";
            }
        `);
      context.StopWatch.stop("rewards_calculator");
    }, "handler"),
    /**
     * Sets up the rewards calculator feature.
     */
    setup() {
      $remark("Adding Rewards Calculator...");
    }
  });

  // src/plugins/chat/points-receipt-placement-framed-helper.js
  plugin({
    id: "chat.points_receipt_placement_framed_helper",
    job: "points_receipt_placement_framed_helper",
    timer: 1e3,
    /**
     * Extracts channel point balance and prediction data to send to the parent window.
     */
    handler: /* @__PURE__ */ __name(() => {
      var _a, _b, _c, _d, _e;
      let placement;
      if ((placement = Settings.points_receipt_placement ??= "null").equals("null"))
        return;
      const coin = (_b = (_a = $.last('[data-test-selector*="balance-string"i]')) == null ? void 0 : _a.closest("button")) == null ? void 0 : _b.querySelector("img[alt]");
      const balance = (_c = $.last('[data-test-selector*="balance-string"i]')) == null ? void 0 : _c.innerText, exact_debt = (_d = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p')) == null ? void 0 : _d.innerText, exact_change = (_e = $('[class*="points"i][class*="summary"i][class*="add-text"i]')) == null ? void 0 : _e.innerText;
      top.postMessage({ action: "jump", points_receipt_placement: { balance, coin_face: coin == null ? void 0 : coin.src, coin_name: coin == null ? void 0 : coin.alt, exact_debt, exact_change } }, location.origin);
    }, "handler"),
    /**
     * Checks if the points receipt placement feature is enabled.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return parseBool(Settings.points_receipt_placement);
    }
  });

  // src/plugins/chat/recover-chat.js
  plugin({
    id: "chat.recover_chat",
    job: "recover_chat",
    timer: 500,
    /**
     * Attempts to recover the chat by replacing the chat shell with a popout iframe if a loading error is detected.
     * @param {Object} context - Plugin context
     */
    handler: /* @__PURE__ */ __name((context) => {
      var _a, _b, _c;
      new context.StopWatch("recover_chat");
      const [chat] = $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]), [role="tt-log"i], [data-test-selector="banned-user-message"i], [data-test-selector^="video-chat"i]'), error = $('[class*="chat"i][class*="content"] .core-error');
      if (defined(error) || nullish(chat)) {
        (_a = $('[data-a-target*="welcome"i]')) == null ? void 0 : _a.append(furnish("p", { style: "text-decoration:underline var(--color-error)" }, `There was an error loading chat: ${(error == null ? void 0 : error.textContent) ?? "no response"}`));
        error == null ? void 0 : error.remove();
      }
      if (defined(chat))
        return;
      let [, name] = ((_b = context.STREAMER) == null ? void 0 : _b.name) ? [, context.STREAMER.name] : location.pathname.split(/\W/, 2), input = $(".chat-input"), iframe = furnish(`iframe#tt-popup-container.stream-chat.tt-c-text-base.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-full-height.tt-relative`, {
        src: `./popout/${name}/chat`,
        role: "tt-log"
      }), container = $(".chat-shell", top.document);
      (_c = container == null ? void 0 : container.parentElement) == null ? void 0 : _c.replaceChild(iframe, container);
      context.StopWatch.stop("recover_chat");
    }, "handler")
  });

  // src/plugins/chat/recover-messages.js
  var RESTORED_MESSAGES;
  plugin({
    id: "chat.recover_messages",
    job: "recover_messages",
    timer: 5e3,
    /**
     * Runs on initialization: initializes the set used to track restored messages.
     */
    init() {
      RESTORED_MESSAGES = /* @__PURE__ */ new Set();
    },
    /**
     * Runs every tick: identifies deleted chat messages and reconstructs them in the chat UI to recover lost content.
     * @param {Object} context - The plugin context
     * @returns {Promise<void>}
     */
    handler: /* @__PURE__ */ __name(async (context) => {
      var _a, _b, _c, _d, _e;
      new context.StopWatch("recover_messages");
      restoring: for (const [uuid, line] of Chat.messages) {
        if (RESTORED_MESSAGES.has(uuid))
          continue restoring;
        if ($.defined(`main [data-test-selector*="chat"i][data-test-selector*="message"i][data-test-selector*="container"i] [data-uuid="${uuid}"i]`))
          continue restoring;
        const { author, handle, message, emotes, badges, style } = line;
        const element = await line.element, deleted = await line.deleted;
        if (defined(element.dataset.plagiarism) || defined(element.dataset.repetitive) || parseBool(element.dataset.restored))
          continue restoring;
        element.dataset.uuid ||= uuid;
        if (!deleted || !(message == null ? void 0 : message.length) || author.equals(context.USERNAME))
          continue restoring;
        const f = furnish;
        let container = (_a = $(`[data-a-target^="chat"i] [data-a-target*="deleted"i]`)) == null ? void 0 : _a.closest(`[data-a-user]`);
        if (parseBool((_b = container == null ? void 0 : container.dataset) == null ? void 0 : _b.resurrected))
          continue restoring;
        if (nullish(container)) {
          container = f(`.chat-line__message[@aTarget="chat-line-message" @aUser="${author}" @testSelector="chat-line-message" align-items="center" @uuid="${uuid}"]`).with(
            f('[style="position:relative"]').with(
              f('.chat-line__message-highlight[@testSelector="chat-message-highlight" style="border-radius:.4rem; position:absolute"]'),
              f('.chat-line__message-container[style="position:relative"]').with(
                f("").with(
                  f('.chat-line__no-background[style="display:inline"]').with(
                    f('.chat-line__username-container[style="display:inline-block"]').with(
                      // Chat badges
                      f("span").with(
                        ...badges.map(
                          (name) => f("button[@aTarget=chat-badge]").with(
                            // /badges/{version}/{UUID}/{size}
                            // Broadcaster → https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1
                            f(`img.chat-badge[alt="${name}"]`, { src: `//static-cdn.jtvnw.net/badges/v1/${context.TTV_BADGES.get(name)}/1` })
                          )
                        )
                      ),
                      f("span.chat-line__username[role=button]").with(
                        f.span(
                          f(`span.chat-author__display-name[@aTarget="chat-message-username" @aUser="${author}" @testSelector="message-username" style="${style}"]`).text(handle)
                        )
                      )
                    ),
                    f("span[@testSelector=chat-message-separator]").text(": "),
                    f("span[@testSelector=chat-line-message-placeholder]").text(message)
                  )
                )
              ),
              f(".chat-line__icons")
            )
          );
          (_c = $('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-test-selector*="chat"i][data-test-selector*="message"i][data-test-selector*="container"i]) [role]')) == null ? void 0 : _c.append(container);
        }
        const body = $(`[data-test-selector$="message-placeholder"i]`, container), user = (_e = (_d = $(`[data-a-user="${author}"i]`, container)) == null ? void 0 : _d.dataset) == null ? void 0 : _e.aUser;
        if (nullish(body) || nullish(user))
          continue restoring;
        if (user.unlike(author) && user.unlike(handle))
          continue restoring;
        RESTORED_MESSAGES.add(uuid);
        $notice(`Restoring message (${uuid}):`, line);
        if (emotes.length > 0) {
          const inter = [], final = [];
          for (const word of message.split(" ").filter((s) => s.length))
            inter.push(
              emotes.contains(word) ? f(".chat-line__message--emote-button[@testSelector=emote-button]").with(
                f("div").with(
                  f("span[@aTarget=emote-name]").with(
                    f(".chat-image__container").with(
                      f(`img.chat-image.chat-line__message--emote[alt="${word}"][src="${Chat.emotes.get(word)}"]`)
                    )
                  )
                )
              ) : word
            );
          let fragments = [];
          for (const word of inter)
            if (typeof word == "string") {
              fragments.push(word);
            } else {
              if (fragments.length)
                final.push(f(".text-fragment[@aTarget=chat-message-text]").with(fragments.join(" ")));
              final.push(word);
              fragments = [];
            }
          if (fragments.length)
            final.push(f(".text-fragment[@aTarget=chat-message-text]").with(fragments.join(" ")));
          body.innerHTML = final.map((e) => e.outerHTML).join(" ");
        } else {
          body.innerText = message;
        }
        container.dataset.uuid = uuid;
        container.dataset.resurrected = true;
        const target = $('[data-a-target*="deleted"i]', container);
        if (defined(target))
          target.dataset.aTarget = "chat-restored-message-placeholder";
        $notice(`Restored message "${author}: ${message}"`, { line, container });
      }
      context.StopWatch.stop("recover_messages");
    }, "handler"),
    /**
     * Sets up the message recovery timer: dynamically adjusts the recovery check frequency based on the current viewer count.
     */
    setup() {
      setInterval(() => {
        var _a, _b;
        const actual = Timers.recover_messages, desired = Math.max(
          0,
          actual,
          500 + (parseInt((_b = (_a = $('[data-a-target$="viewers-count"i], [class*="stream-info-card"i] [data-test-selector$="description"i]')) == null ? void 0 : _a.textContent) == null ? void 0 : _b.replace(/\D+/g, "")) | 0)
        ).floorToNearest(100).clamp(1e3, 1e4), [min, max] = [desired, actual].sort((a, b) => a - b);
        if (min / max < 0.85) {
          Timers.recover_messages = desired;
          RestartJob("recover_messages", `timer-deviation:Timer has deviated more than 15% → min:${(min / 1e3).suffix("s")}; max:${(max / 1e3).suffix("s")}`);
        }
      }, 1e3);
    }
  });

  // src/plugins/chat/safe-greedy-raiding.js
  var RAID_LOGGED;
  plugin({
    id: "chat-safe.greedy_raiding",
    job: "greedy_raiding",
    timer: 5e3,
    /**
     * Initializes the raid logging state.
     */
    init() {
      RAID_LOGGED = false;
    },
    /**
     * Runs every tick: Detects raid banners and notifies the user if a raid is occurring on another channel.
     */
    handler: /* @__PURE__ */ __name(() => {
      const raiding = $.defined('[data-test-selector="raid-banner"i]'), atTop = top == window;
      if (RAID_LOGGED || atTop || !raiding)
        return;
      RAID_LOGGED ||= raiding;
      const { current = false } = parseBool(parseURL(location).searchParameters);
      let raid_banner = $.all('[data-test-selector="raid-banner"i] strong').map((strong) => strong == null ? void 0 : strong.innerText), [, from] = location.pathname.split(/(?<!^)\//), [to] = raid_banner.filter((name) => !RegExp(`^${from}$`, "i").test(name));
      if (current)
        return;
      $warn(`There is a raid happening on another channel... ${from} → ${to} (${raid_banner.join(" to ")})`);
      Runtime.sendMessage({ action: "LOG_RAID_EVENT", data: { from, to } }, async ({ events }) => {
        $warn(`${from} has raided ${events} time${events != 1 ? "s" : ""} this week. Current raid: ${to} @ ${/* @__PURE__ */ new Date()}`);
        const payable = $.defined('[data-test-selector*="balance-string"i]');
        top.postMessage({ action: "raid", from, to, events, payable }, location.origin);
      });
    }, "handler"),
    /**
     * Undoes the raid detection logic.
     */
    unhandler: /* @__PURE__ */ __name(() => {
    }, "unhandler")
  });

  // src/plugins/chat/safe-point-watcher-helper.js
  var pointWatcherCounter;
  var hasPointsEnabled;
  var ALL_CHANNEL_POINT_REWARDS;
  plugin({
    id: "chat-safe.point_watcher_helper",
    job: "point_watcher_helper",
    timer: 15e3,
    register: false,
    // setup() starts the job itself, when it should
    /**
     * Initializes channel point tracking variables to their default states.
     */
    init() {
      pointWatcherCounter = 0;
      hasPointsEnabled = false;
      ALL_CHANNEL_POINT_REWARDS = void 0;
    },
    /**
     * Scrapes channel point balance and reward data from the page and updates the cached streamer point information.
     * @param {*} context - The plugin context object
     */
    handler: /* @__PURE__ */ __name(async (context) => {
      if (top.__readyState__ == "unloading")
        return;
      Cache.load(["ChannelPoints"], ({ ChannelPoints }) => {
        let [amount, fiat, face, notEarned, pointsToEarnNext] = ((ChannelPoints ??= {})[context.STREAMER.name] ?? 0).toString().split("|"), balance = $.last('[data-test-selector*="balance-string"i]'), allRewards = ALL_CHANNEL_POINT_REWARDS;
        hasPointsEnabled ||= defined(balance);
        amount = context.STREAMER.coin = (balance == null ? void 0 : balance.innerText) ?? (hasPointsEnabled ? amount : "&#128683;");
        fiat = context.STREAMER.fiat ??= fiat ?? 0;
        face = context.STREAMER.face ??= face ?? `${context.STREAMER.sole}`;
        notEarned = (allRewards == null ? void 0 : allRewards.length) ? allRewards.filter((amount2) => parseCoin(amount2 == null ? void 0 : amount2.innerText) > context.STREAMER.coin).length : notEarned > -Infinity ? notEarned : -1;
        pointsToEarnNext = (allRewards == null ? void 0 : allRewards.length) ? allRewards.map((amount2) => parseCoin(amount2 == null ? void 0 : amount2.innerText) > context.STREAMER.coin ? parseCoin(amount2 == null ? void 0 : amount2.innerText) - context.STREAMER.coin : 0).sort((x, y) => x > y ? -1 : 1).filter((x) => x > 0).pop() : notEarned > -Infinity ? pointsToEarnNext : 0;
        face = face == null ? void 0 : face.replace(/^(?:https?:.*?)?([\d]+\/[\w\-\.\/]+)$/i, "$1");
        ChannelPoints[context.STREAMER.name] = [amount, fiat, face, notEarned, pointsToEarnNext].join("|");
        Cache.save({ ChannelPoints });
      });
    }, "handler"),
    /**
     * Undoes changes by removing all point amount display elements from the DOM.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      $.all(".tt-point-amount").forEach((span) => span == null ? void 0 : span.remove());
    }, "unhandler"),
    /**
     * Checks if the point watcher placement feature is enabled.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return parseBool(Settings.point_watcher_placement);
    },
    /**
     * Initializes the point watcher helper by detecting the balance button and fetching available channel point rewards.
     * @param {Object} context - The plugin context
     */
    setup(context) {
      when.defined(() => {
        var _a;
        return (_a = $.last('[data-test-selector*="balance-string"i]')) == null ? void 0 : _a.closest("button");
      }).then(async (balanceButton) => {
        var _a, _b, _c, _d, _e;
        RegisterJob("point_watcher_helper");
        const jump = (_e = (_d = (_c = context.STREAMER.jump) == null ? void 0 : _c[(_b = (_a = context.STREAMER.name) == null ? void 0 : _a.toLowerCase) == null ? void 0 : _b.call(_a)]) == null ? void 0 : _d.stream) == null ? void 0 : _e.points;
        if (defined(jump == null ? void 0 : jump.balance))
          return;
        balanceButton.click();
        ALL_CHANNEL_POINT_REWARDS = $.all('[data-test-selector="cost"i]').map((e) => ({ innerText: e.innerText, innerHTML: e.innerHTML, outerHTML: e.outerHTML }));
        wait(30).then(() => balanceButton.click());
      });
    }
  });

  // src/plugins/chat/safe-soft-unban.js
  plugin({
    id: "chat-safe.soft_unban",
    /**
     * Installs the soft unban feature to allow banned users to view chat via a proxy iframe.
     * @param {Object} context - Plugin context
     */
    async install(context) {
      Handlers.soft_unban = () => {
        var _a;
        if (!((_a = context.STREAMER) == null ? void 0 : _a.veto))
          return;
        $log(`Performing Soft Unban...`);
        const f = furnish;
        let name = (context.STREAMER.name || location.pathname.split(/\W/, 2)[1]).replace("/", ""), fiat = context.STREAMER.fiat || "Channel Points", url = parseURL(`https://nightdev.com/hosted/obschat/`).addSearch({
          theme: `bttv_${context.THEME}`,
          channel: name,
          fade: parseBool(Settings.soft_unban_fade_old_messages),
          bot_activity: parseBool(Settings.soft_unban_keep_bots),
          prevent_clipping: parseBool(Settings.soft_unban_prevent_clipping)
        }), iframe = f(`iframe#tt-proxy-chat`, { src: url.href, style: `width: 100%; height: 100%` }), preBanner = f("#tt-banned-banner.tt-pd-b-2.tt-pd-x-2").with(
          f(".tt-border-t.tt-pd-b-1.tt-pd-x-2"),
          f(".tt-align-center").with(
            f("p.tt-c-text.tt-strong[@testSelector=current-user-timed-out-text]").with(
              `Messages from ${name} chat.`
            ),
            f("p.tt-c-text-alt-2").with(
              `Unable to collect ${fiat}.`
            )
          )
        ), chat, cont, banner;
        name = (name == null ? void 0 : name.replace(/(.)$/, ($0, $1, $$, $_) => $1 + (/([s])/i.test($1) ? "'" : "'s"))) || "this";
        fiat = fiat.replace(/([^s])$/i, "$1s");
        try {
          chat = $(".chat-room__content > .tt-flex");
          banner = $(".chat-input").closest(".tt-block");
          banner.insertBefore(
            preBanner,
            banner.firstElementChild
          );
          chat.classList.remove(...chat.classList);
          chat.classList.add("chat-list--default", "scrollable-area");
          chat.replaceChild(iframe, chat.firstChild);
        } catch (error) {
          $warn(`Could not perform "old" unban method`, error);
          chat = $(".chat-input");
          cont = chat.previousElementSibling;
          try {
            chat.insertBefore(
              preBanner,
              chat.firstElementChild
            );
            cont.replaceChild(iframe, cont.firstChild);
          } catch (error2) {
            $warn(`Could not perform "new" unban method`, error2);
          }
        }
      };
      Timers.soft_unban = -2500;
      Unhandlers.soft_unban = () => {
        const iframe = $("iframe#tt-proxy-chat"), div = furnish(".tt-flex");
        if (nullish(iframe))
          return;
        iframe.parentElement.replaceChild(div, iframe);
      };
      __SoftUnban__:
        if (parseBool(Settings.soft_unban)) {
          RegisterJob("soft_unban");
        }
      __Static_Helpers__:
        if (IS_A_FRAMED_CONTAINER) {
        }
    }
  });

  // src/lib/dsl-host.js
  var URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/gi;
  var COMMAND_PATTERN = /^!([^\s!]+)(?:\s+([\s\S]*))?$/;
  var CHANNEL_FIELDS = Object.freeze({
    name: "name",
    id: "sole",
    live: "live",
    title: "desc",
    game: "game",
    viewers: "poll",
    uptime: "time",
    points: "coin",
    subscribed: "paid",
    following: "like",
    rerun: "redo",
    tags: "tags"
  });
  function toMessageEvent(message) {
    const text = String(message.message ?? ""), event = {
      kind: "message",
      id: String(message.uuid ?? ""),
      sender: String(message.author ?? "").toLowerCase(),
      display: String(message.handle ?? message.author ?? ""),
      message: text,
      mentions: [...message.mentions ?? []].map((name) => String(name).toLowerCase()),
      badges: Object.keys(message.badges ?? {}),
      emotes: [...message.emotes ?? []].map((emote) => String((emote == null ? void 0 : emote.name) ?? emote)),
      links: [...text.matchAll(URL_PATTERN)].map(([href]) => ({ href, text: href })),
      timestamp: Number(message.timestamp ?? Date.now())
    }, command = COMMAND_PATTERN.exec(text.trim());
    if (command) {
      event.kind = "command";
      event.command = command[1].toLowerCase();
      event.argument = (command[2] ?? "").trim();
    }
    return event;
  }
  __name(toMessageEvent, "toMessageEvent");
  function toWhisperEvent(whisper) {
    return {
      kind: "whisper",
      sender: String(whisper.from ?? "").toLowerCase(),
      message: String(whisper.message ?? ""),
      timestamp: Number(whisper.timestamp ?? Date.now())
    };
  }
  __name(toWhisperEvent, "toWhisperEvent");
  function toRaidEvent(bullet) {
    if ((bullet == null ? void 0 : bullet.subject) != "raid" || !bullet.raider)
      return null;
    return {
      kind: "raid",
      raider: String(bullet.raider).toLowerCase(),
      raid_size: Number(bullet.raid_size) | 0,
      timestamp: Number(bullet.timestamp ?? Date.now())
    };
  }
  __name(toRaidEvent, "toRaidEvent");
  function createAdapter(env) {
    const { Chat: Chat2, STREAMER, USERNAME } = env, hookName = `TTV_DSL_${Math.random().toString(36).slice(2)}`;
    const channel = {};
    for (const [field, source] of Object.entries(CHANNEL_FIELDS))
      Object.defineProperty(channel, field, {
        enumerable: true,
        get: /* @__PURE__ */ __name(() => field == "name" ? String(STREAMER[source] ?? "").toLowerCase() : field == "live" ? !!STREAMER[source] : STREAMER[source], "get")
      });
    if (env.viewerBadges)
      Object.defineProperty(channel, "badges", { enumerable: true, get: /* @__PURE__ */ __name(() => env.viewerBadges() ?? void 0, "get") });
    Object.freeze(channel);
    const realm = {
      name: "TWITCH",
      get current() {
        return channel;
      },
      channel(name) {
        return String(name).toLowerCase() == channel.name ? channel : null;
      },
      subject(path) {
        return this.channel(path);
      },
      badge(name, holder) {
        return ((holder == null ? void 0 : holder.badges) ?? []).includes(name) ? name : null;
      },
      user(name) {
        return { name: String(name).toLowerCase() };
      },
      goto(target) {
        var _a, _b;
        const name = typeof target == "string" ? target : target == null ? void 0 : target.name;
        if (!name)
          return;
        if (env.goto)
          env.goto(String(name).toLowerCase());
        else
          (_b = (_a = env.logger) == null ? void 0 : _a.warn) == null ? void 0 : _b.call(_a, `goto ${name}: not available in this frame`);
      }
    };
    const inCurrentChannel = /* @__PURE__ */ __name((context) => {
      var _a;
      const name = (_a = context.channel) == null ? void 0 : _a.name;
      return name == null || String(name).toLowerCase() == channel.name;
    }, "inCurrentChannel");
    const verbs = {
      POST(context, value) {
        const text = value == null ? "" : String(value);
        if (/^\s*$/.test(text) || !inCurrentChannel(context))
          return false;
        Chat2.send(text);
        return true;
      },
      REPLY(context, value) {
        var _a;
        const text = value == null ? "" : String(value), id = (_a = context.subject) == null ? void 0 : _a.id;
        if (/^\s*$/.test(text) || !inCurrentChannel(context))
          return false;
        if (id)
          Chat2.reply(id, text);
        else
          Chat2.send(text);
        return true;
      }
    };
    const datetime = {
      now: /* @__PURE__ */ __name(() => Date.now(), "now"),
      time: /* @__PURE__ */ __name(() => (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), "time")
    };
    return {
      options: {
        realms: { TWITCH: realm },
        verbs,
        constants: { USERNAME: String(USERNAME ?? "").toLowerCase() },
        jsBindings: { datetime },
        jsPermissions: {
          "datetime.now": "read:datetime",
          "datetime.time": "read:datetime"
        },
        ...env.clock ? { clock: env.clock } : {},
        ...env.random ? { random: env.random } : {},
        ...env.logger ? { logger: env.logger } : {}
      },
      /**
       * Starts feeding chat into a runtime.
       * @param {Object} runtime - From `TTV_DSL.createRuntime(options)`
       * @returns {function} Detach: removes every hook this call added
       */
      attach(runtime) {
        const named = /* @__PURE__ */ __name((suffix, callback) => ({ [`${hookName}_${suffix}`]: callback })[`${hookName}_${suffix}`], "named");
        const onMessage = named("message", (message) => runtime.dispatch(toMessageEvent(message)));
        const onWhisper = named("whisper", (whisper) => runtime.dispatch(toWhisperEvent(whisper)));
        const onBullet = named("bullet", (bullet) => {
          const event = toRaidEvent(bullet);
          if (event)
            runtime.dispatch(event);
        });
        Chat2.onmessage = onMessage;
        Chat2.onwhisper = onWhisper;
        Chat2.onbullet = onBullet;
        return () => {
          var _a, _b, _c;
          (_a = Chat2.__onmessage__) == null ? void 0 : _a.delete(onMessage.name);
          (_b = Chat2.__onwhisper__) == null ? void 0 : _b.delete(onWhisper.name);
          (_c = Chat2.__onbullet__) == null ? void 0 : _c.delete(onBullet.name);
        };
      }
    };
  }
  __name(createAdapter, "createAdapter");

  // src/lib/user-scripts.js
  var SCRIPTS_KEY = "user_scripts";
  var CONSENT_KEY = "user_scripts__consent";
  function grantsOf(permissions = []) {
    return [...new Set(permissions.flatMap(({ permissions: permissions2 }) => permissions2))].sort().join(" ");
  }
  __name(grantsOf, "grantsOf");
  function settingValues(meta, stored) {
    const values = {};
    for (const [key, setting] of Object.entries(meta.settings ?? {})) {
      if (key == meta.id || !(key in stored) || stored[key] == null)
        continue;
      const name = key.slice(meta.id.length + 2), value = stored[key];
      switch (setting.type) {
        case "checkbox":
          {
            values[name] = value === true || value === "true";
          }
          break;
        case "number":
          {
            const number = Number(value) * (setting.scale ? 1 / setting.scale : 1);
            if (Number.isFinite(number))
              values[name] = number;
          }
          break;
        default:
          {
            values[name] = String(value);
          }
          break;
      }
    }
    return values;
  }
  __name(settingValues, "settingValues");
  function createUserScripts({ DSL, storage, env, frame, log }) {
    const running = /* @__PURE__ */ new Map();
    let scripts = [], consent = {}, channel = null, watcher = null;
    const allowed = /* @__PURE__ */ __name((meta) => {
      var _a, _b;
      return ((_a = meta.frames) == null ? void 0 : _a.includes("chat")) || frame == "main" && ((_b = meta.frames) == null ? void 0 : _b.includes("main"));
    }, "allowed");
    const prefix = /* @__PURE__ */ __name((meta) => (message) => `[${meta.name ?? meta.id}] ${message}`, "prefix");
    async function launch(script) {
      var _a;
      const { meta, diagnostics, source } = script, stored = await storage.get(Object.keys(meta.settings ?? {}));
      if (stored[meta.id] !== true || !allowed(meta))
        return;
      if (diagnostics.length)
        return log.warn(prefix(meta)(`not started: ${diagnostics.length} problem(s) — ${diagnostics[0].message}`));
      const required = grantsOf(meta.permissions);
      if (required && consent[meta.id] !== required)
        return log.warn(prefix(meta)(`not started: its permissions need approval in Settings`));
      const say = prefix(meta), logger = { log: /* @__PURE__ */ __name((message) => log.log(say(message)), "log"), warn: /* @__PURE__ */ __name((message) => log.warn(say(message)), "warn"), error: /* @__PURE__ */ __name((message) => log.error(say(message)), "error") }, adapter = createAdapter({ ...env, logger }), runtime = DSL.createRuntime({ ...adapter.options, settings: settingValues(meta, stored) }), detach = adapter.attach(runtime);
      try {
        const context = await DSL.run(source, runtime, { channel: runtime.realm("TWITCH").current });
        running.set(meta.id, {
          stop() {
            context.stop();
            detach();
          }
        });
      } catch (error) {
        detach();
        log.error(say(((_a = error == null ? void 0 : error.codeFrame) == null ? void 0 : _a.call(error)) ?? (error == null ? void 0 : error.message) ?? String(error)));
      }
    }
    __name(launch, "launch");
    function halt(id) {
      var _a;
      (_a = running.get(id)) == null ? void 0 : _a.stop();
      running.delete(id);
    }
    __name(halt, "halt");
    async function reload() {
      for (const id of [...running.keys()])
        halt(id);
      const stored = await storage.get([SCRIPTS_KEY, CONSENT_KEY]);
      consent = stored[CONSENT_KEY] ?? {};
      scripts = (stored[SCRIPTS_KEY] ?? []).map(({ file, source }) => ({ file, source, ...DSL.inspect(source, { file }) }));
      for (const script of scripts)
        await launch(script);
    }
    __name(reload, "reload");
    async function changed(changes) {
      const keys = Object.keys(changes);
      if (keys.includes(SCRIPTS_KEY) || keys.includes(CONSENT_KEY))
        return reload();
      for (const script of scripts) {
        const { id } = script.meta;
        if (keys.some((key) => key == id || key.startsWith(`${id}__`))) {
          halt(id);
          await launch(script);
        }
      }
    }
    __name(changed, "changed");
    return {
      get running() {
        return [...running.keys()];
      },
      /**
       * Starts every enabled script and follows storage and channel changes.
       * @returns {Promise<void>}
       */
      async start() {
        var _a;
        storage.onChanged(changed);
        channel = (_a = env.STREAMER) == null ? void 0 : _a.name;
        watcher = setInterval(() => {
          var _a2;
          if (((_a2 = env.STREAMER) == null ? void 0 : _a2.name) && env.STREAMER.name != channel) {
            channel = env.STREAMER.name;
            reload();
          }
        }, 1e3);
        await reload();
      },
      /** Stops every script. */
      stop() {
        clearInterval(watcher);
        for (const id of [...running.keys()])
          halt(id);
      }
    };
  }
  __name(createUserScripts, "createUserScripts");

  // src/plugins/chat/user-scripts.js
  var RUNNER;
  plugin({
    id: "chat.user_scripts",
    job: "user_scripts",
    frames: ["chat"],
    register: false,
    // Always hosts; each script is switched on and off by its own toggle
    enabled: /* @__PURE__ */ __name(() => true, "enabled"),
    setup(context) {
      if (RUNNER)
        return;
      if (!globalThis.TTV_DSL)
        return $warn("User Scripts: the TTV DSL did not load");
      $remark("Hosting user scripts...");
      const frame = /^\/popout\//i.test(location.pathname) ? "chat" : "main";
      const STREAMER = new Proxy({}, { get: /* @__PURE__ */ __name((target, key) => {
        var _a;
        return (_a = context.STREAMER) == null ? void 0 : _a[key];
      }, "get") });
      RUNNER = createUserScripts({
        DSL: globalThis.TTV_DSL,
        storage: {
          get: /* @__PURE__ */ __name((keys) => new Promise((resolve) => Storage.get(keys, resolve)), "get"),
          onChanged: /* @__PURE__ */ __name((callback) => Storage.onChanged.addListener((changes) => callback(changes)), "onChanged")
        },
        env: {
          Chat,
          STREAMER,
          USERNAME: context.USERNAME,
          viewerBadges: /* @__PURE__ */ __name(() => Chat.viewerBadges, "viewerBadges"),
          ...frame == "main" ? { goto: /* @__PURE__ */ __name((name) => goto(`/${name}`), "goto") } : {}
        },
        frame,
        log: { log: $log, warn: $warn, error: $error }
      });
      RUNNER.start();
    }
  });

  // src/plugins/chat/index.js
  globalThis.TTV ??= { plugin, plugins: PLUGINS, run, start };
})();
