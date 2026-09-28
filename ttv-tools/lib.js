globalThis.SETTINGS_DEFAULTS ??= Object.freeze({"auto_accept_mature":false,"auto_claim_bonuses":true,"claim_drops":true,"claim_drops__interval":"10","claim_loot":false,"away_mode":true,"away_mode__hide_chat":false,"away_mode__volume_control":false,"away_mode__volume":0.25,"first_in_line_none":true,"first_in_line_now":false,"first_in_line":false,"first_in_line_time_minutes":"15","first_in_line_plus":false,"first_in_line_plus_time_minutes":"15","first_in_line_all":false,"first_in_line_all_time_minutes":"15","up_next__one_instance":false,"live_reminders":true,"keep_live_reminders":false,"auto_follow_none":true,"auto_follow_raids":false,"auto_follow_time":false,"auto_follow_time_minutes":"15","auto_follow_all":false,"kill_extensions":false,"next_channel_preference":"random","parse_commands":false,"parse_commands__create_links":true,"prevent_raiding":"none","greedy_raiding":false,"claim_prime":false,"claim_prime__max_claims":"3","stay_live":true,"stay_live__ignore_channel_reruns":false,"time_zones":false,"view_mode":"null","bttv_emotes":false,"auto_load_bttv_emotes":false,"bttv_emotes_channel":false,"bttv_emotes_location":"emotes/shared/trending","bttv_emotes_extras":"","bttv_emotes_maximum":"150","filter_messages":true,"filter_messages__bullets_raid":false,"filter_messages__bullets_coin":false,"filter_messages__bullets_subs":false,"filter_messages__bullets_note":false,"filter_messages__bullets_paid":false,"highlight_mentions":true,"highlight_phrases":false,"link_maker__chat":false,"auto_chat__mentions":"null","auto_chat__wait_time":"5","native_twitch_reply":false,"mention_audio":false,"phrase_audio":false,"whisper_audio":false,"whisper_audio_sound":"goes-without-saying-608","prevent_spam":true,"prevent_spam_look_back":"15","prevent_spam_minimum_length":"5","prevent_spam_ignore_under":"5","recover_chat":false,"recover_messages":false,"highlight_mentions_popup":true,"convert_bits":true,"channelpoints_receipt_display":"null","rewards_calculator":false,"accent_color":"twitch-purple/12","block_banners":false,"context_menu_override":false,"away_mode_placement":"null","hide_blank_ads":false,"points_receipt_placement":"null","point_watcher_placement":"null","stream_preview":false,"stream_preview_position":"3","stream_preview_scale":"1","stream_preview_sound":false,"watch_time_placement":"null","sync-token":"TTV-TOOL","store_integration":true,"store_integration__steam":true,"store_integration__playstation":true,"store_integration__xbox":true,"store_integration__nintendo":true,"store_integration__epic":true,"video_clips__file_type":"x-matroska","video_clips__quality":"auto","video_clips__length":"60","video_clips__dvr":false,"video_clips__trophy":false,"video_clips__trophy_length":"60","record_foreign_rewards":false,"keep_popout":false,"recover_ads":false,"recover_frames":true,"recover_frames__allow_embed":false,"recover_pages":false,"recover_stream":false,"recover_video":true,"display_in_console":false,"display_in_console__log":true,"display_in_console__warn":true,"display_in_console__error":true,"display_in_console__remark":true,"display_in_console__notice":true,"display_in_console__ignore":true,"show_stats":false,"experimental_mode":false,"extra_keyboard_shortcuts":true,"low_data_mode":false,"fine_details":false,"auto_tab_reloads":true,"auto_focus":false,"convert_emotes":false,"soft_unban":false,"soft_unban_fade_old_messages":false,"soft_unban_keep_bots":false,"soft_unban_prevent_clipping":false,"user_language_preference":"en"});
(() => {
  var __defProp = Object.defineProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);

  // src/lib/balloon.js
  var _BALLOONS;
  var _Balloon = class _Balloon {
    constructor({ title, icon = "play", iconAttr = {} }, ...jobs) {
      const f = furnish;
      let [L_pane, C_pane, R_pane] = $.all(".top-nav__menu > div:not(:only-child)"), X = $("#tt-balloon", R_pane), I = Runtime.getURL("profile.png"), F, C, H, U, N;
      if ([L_pane, C_pane, R_pane].filter(nullish).length)
        return;
      const uuid = U = UUID.from([title, JSON.stringify(jobs)].join(":")).value, existing = __privateGet(_Balloon, _BALLOONS).get(title);
      if (defined(existing))
        return existing;
      if (defined(X)) {
        if (Queue.balloons.map((balloon) => balloon.uuid).missing(uuid)) {
          const interval = setInterval(() => {
            const existing2 = $("#tt-balloon");
            if (defined(existing2))
              return;
            const { title: title2, icon: icon2, jobs: jobs2, uuid: uuid2, interval: interval2 } = Queue.balloons.pop();
            new _Balloon({ title: title2, icon: icon2 }, ...jobs2);
            clearInterval(interval2);
          }, 500);
          Queue.balloons.splice(0, 0, { title, icon, jobs, uuid, interval });
        }
        return;
      }
      const p = f(
        ".tt-align-self-center.tt-flex-grow-0.tt-flex-nowrap.tt-flex-shrink-0.tt-mg-x-05",
        { style: `animation:1s fade-in 1;` },
        f.div(
          f(".tt-relative").with(
            // Navigation Icon
            N = f(
              `div[@testSelector=toggle-balloon-wrapper__mouse-enter-detector]`,
              {
                style: "display:inherit"
              },
              f(".tt-inline-flex.tt-relative").with(
                f(
                  "button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative",
                  {
                    "connected-to": U,
                    onclick: /* @__PURE__ */ __name((event) => {
                      let { currentTarget } = event, connectedTo = currentTarget.getAttribute("connected-to");
                      const balloon = $(`#tt-balloon-${connectedTo}`);
                      if (nullish(balloon))
                        return;
                      const display = balloon.getAttribute("display").equals("block") ? "none" : "block";
                      balloon.modStyle(`display:${display}!important; z-index:9; left: -15rem`);
                      balloon.setAttribute("display", display);
                    }, "onclick")
                  },
                  f(
                    "div",
                    {
                      style: "height:2rem; width:2rem",
                      innerHTML: Glyphs.modify(icon, iconAttr)
                    }
                  ),
                  // Notification counter
                  F = f(
                    `#tt-notification-counter--${U}.tt-absolute.tt-right-0.tt-top-0`,
                    { style: "visibility:hidden", "connected-to": U, length: 0 },
                    f(".tt-animation.tt-animation--animate.tt-animation--bounce-in.tt-animation--duration-medium.tt-animation--fill-mode-both.tt-animation--timing-ease-in[@aTarget=tt-animation-target]").with(
                      f(".tt-c-background-base.tt-inline-flex.tt-number-badge.tt-relative").with(
                        f(`#tt-notification-counter-output--${U}.tt-number-badge__badge.tt-relative`, {
                          "interval-id": setInterval(() => {
                            const counter = $(`#tt-notification-counter--${uuid}`), output = $(`#tt-notification-counter-output--${uuid}`), length = parseInt(counter == null ? void 0 : counter.getAttribute("length"));
                            if (nullish(counter) || nullish(output) || nullish(length))
                              return;
                            output.textContent = length;
                            if (length > 0) {
                              counter.modStyle(`visibility:unset; font-size:75%`);
                            } else {
                              counter.modStyle(`visibility:hidden`);
                            }
                          }, 1e3)
                        })
                      )
                    )
                  )
                )
              )
            ),
            // Balloon
            f(
              `#tt-balloon-${U}.tt-absolute.tt-balloon.tt-balloon--down.tt-balloon--right.tt-balloon-lg.tt-block`,
              {
                style: "display:none!important",
                display: "none",
                role: "dialog"
              },
              f(".tt-border-radius-large.tt-c-background-base.tt-c-text-inherit.tt-elevation-4").with(
                C = f(
                  `#tt-balloon-container-${U}.tt-flex.tt-flex-column`,
                  {
                    "tt-mix-blend": (Settings == null ? void 0 : Settings.accent_color) ?? "twitch-purple/12",
                    style: "min-height:22rem; max-height: 90vh; min-width:40rem; overflow-y: auto;",
                    role: "dialog"
                  },
                  // Header
                  f(
                    ".tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-c-text-base.tt-elevation-1.tt-flex.tt-flex-shrink-0.tt-pd-x-1.tt-pd-y-05.tt-popover-header",
                    { style: `background-color:#${THEME.equals("dark") ? "000" : "fff"}e; position:sticky; top:0; z-index:99999;` },
                    f(".tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-justify-content-center").with(
                      H = f(`h5#tt-balloon-header-${U}.tt-align-center.tt-c-text-alt.tt-semibold`, { style: "margin-left:4rem!important", contrast: THEME__PREFERRED_CONTRAST }, title)
                    ),
                    f(
                      "button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-button-icon--secondary.tt-core-button.tt-flex.tt-flex-column.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-justify-content-center.tt-mg-l-05.tt-overflow-hidden.tt-popover-header__icon-slot--right.tt-relative",
                      {
                        style: "padding:0.5rem!important; height:3rem!important; width:3rem!important",
                        contrast: THEME__PREFERRED_CONTRAST,
                        innerHTML: Glyphs.x,
                        "connected-to": U,
                        onclick: /* @__PURE__ */ __name((event) => {
                          let { currentTarget } = event, connectedTo = currentTarget.getAttribute("connected-to");
                          const balloon = $(`#tt-balloon-${connectedTo}`);
                          if (nullish(balloon))
                            return;
                          const display = balloon.getAttribute("display").equals("block") ? "none" : "block";
                          balloon.modStyle(`display:${display}!important`);
                          balloon.setAttribute("display", display);
                        }, "onclick")
                      }
                    )
                  ),
                  ...jobs.map((job, index) => {
                    let { href, message, subheader, src = I, attributes = {}, onremove = /* @__PURE__ */ __name((($2) => $2), "onremove"), animate = /* @__PURE__ */ __name((($2) => $2), "animate") } = job, guid = UUID.from([href, message].join(":")).value;
                    const container = f(
                      `#tt-balloon-job-${U}--${guid}`,
                      { ...attributes, uuid, guid, href: parseURL(href).href },
                      f(
                        ".simplebar-scroll-content",
                        {
                          style: "overflow: hidden;"
                        },
                        f(
                          ".simplebar-content",
                          {
                            style: "overflow: hidden; width:100%;"
                          },
                          f(".tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]").with(
                            f(
                              ".persistent-notification.tt-relative[@testSelector=persistent-notification]",
                              {
                                style: "width:100%"
                              },
                              f(".persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap").with(
                                f(
                                  "a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]",
                                  {
                                    "connected-to": `${U}--${guid}`,
                                    // Sometimes, Twitch likes to default to `_blank`
                                    "target": "_self",
                                    href,
                                    onclick: /* @__PURE__ */ __name((event) => {
                                      let { currentTarget } = event, connectedTo = currentTarget.getAttribute("connected-to");
                                      const element = $(`#tt-balloon-job-${connectedTo}`);
                                      if (defined(element)) {
                                        onremove({
                                          ...event,
                                          uuid,
                                          guid,
                                          href,
                                          element,
                                          canceled: false,
                                          callback(element2) {
                                            clearInterval(+element2.getAttribute("animationID"));
                                            element2.remove();
                                          }
                                        });
                                      }
                                    }, "onclick")
                                  },
                                  f(".persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1").with(
                                    // Avatar
                                    f.div(
                                      f(".tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden").with(
                                        f(".tt-aspect.tt-aspect--align-top").with(
                                          f("img.tt-balloon-avatar.tt-image", { src })
                                        )
                                      )
                                    ),
                                    // Message body
                                    f(".tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1").with(
                                      f(".persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]").with(
                                        f("span.tt-c-text-alt").with(
                                          f("p.tt-balloon-message").html(message)
                                        )
                                      ),
                                      // Subheader
                                      f(".tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05").with(
                                        f(".tt-mg-l-05").with(
                                          f("span.tt-balloon-subheader.tt-c-text-alt").html(subheader)
                                        )
                                      ),
                                      f("div").html(Glyphs.modify("navigation", { height: "20px", width: "20px", style: "position:absolute; right:0; top:40%;" }))
                                    )
                                  )
                                ),
                                // Repeat mini-button
                                f(
                                  ".persistent-notification__delete.tt-absolute",
                                  { style: `top:0; right:2rem; z-index:var(--always-on-top)` },
                                  f(".tt-align-items-start.tt-flex.tt-flex-nowrap").with(
                                    f(
                                      "button.tt-redo-btn.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]",
                                      {
                                        "connected-to": `${U}--${guid}`,
                                        "@streamer-name": parseURL(href).pathname.slice(1),
                                        onclick: /* @__PURE__ */ __name((event) => {
                                          var _a3, _b;
                                          let { currentTarget } = event, connectedTo = currentTarget.getAttribute("connected-to");
                                          const element = $(`#tt-balloon-job-${connectedTo}`), thisJob = $("a", element), redo = ((_b = (_a3 = parseURL(thisJob.href).searchParameters) == null ? void 0 : _a3.redo) == null ? void 0 : _b.equals(currentTarget.dataset.streamerName)) ? "" : currentTarget.dataset.streamerName, url = parseURL(thisJob.href).addSearch({ redo });
                                          thisJob.setAttribute("new-href", url.href);
                                          ALL_FIRST_IN_LINE_JOBS.map((job2, index2) => {
                                            if (parseURL(job2).pathname.equals(url.pathname))
                                              if (index2)
                                                ALL_FIRST_IN_LINE_JOBS.splice(index2, 1, url.href), Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                                              else
                                                REDO_FIRST_IN_LINE_QUEUE(job2, { redo });
                                          });
                                        }, "onclick")
                                      },
                                      f("span.tt-button-icon__icon").with(
                                        f(
                                          "div",
                                          {
                                            style: "height:1.6rem; width:1.6rem",
                                            innerHTML: Glyphs.refresh
                                          }
                                        )
                                      )
                                    )
                                  )
                                ).setTooltip(`Toggle channel repeat`, { from: "bottom" }),
                                // Delete mini-button
                                f(
                                  ".persistent-notification__delete.tt-absolute",
                                  { style: `top:0; right:0; z-index:var(--always-on-top)` },
                                  f(".tt-align-items-start.tt-flex.tt-flex-nowrap").with(
                                    f(
                                      "button.tt-del-btn.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]",
                                      {
                                        "connected-to": `${U}--${guid}`,
                                        onclick: /* @__PURE__ */ __name((event) => {
                                          let { currentTarget } = event, connectedTo = currentTarget.getAttribute("connected-to");
                                          const element = $(`#tt-balloon-job-${connectedTo}`);
                                          const tooltip = Tooltip.get(currentTarget.closest(".persistent-notification__delete"));
                                          if (defined(element))
                                            onremove({
                                              ...event,
                                              uuid,
                                              guid,
                                              href,
                                              element,
                                              canceled: true,
                                              callback(element2) {
                                                clearInterval(+element2.getAttribute("animationID"));
                                                tooltip.remove();
                                                element2.remove();
                                              }
                                            });
                                        }, "onclick")
                                      },
                                      f("span.tt-button-icon__icon").with(
                                        f(
                                          "div",
                                          {
                                            style: "height:1.6rem; width:1.6rem",
                                            innerHTML: Glyphs.x
                                          }
                                        )
                                      )
                                    )
                                  )
                                ).setTooltip(`Remove from queue`, { from: "bottom" })
                              )
                            )
                          )
                        )
                      )
                    );
                    container.setAttribute("animationID", animate(container));
                    return container;
                  })
                )
                // Container
              )
            )
          )
        )
      );
      R_pane == null ? void 0 : R_pane.insertBefore(p, R_pane.firstElementChild);
      this.body = C;
      this.icon = N;
      this.uuid = U;
      this.header = H;
      this.parent = R_pane;
      this.counter = F;
      this.container = p;
      const cssName = title.replace(/\s+/g, "-").toLowerCase();
      for (const key of "body icon header parent container".split(" "))
        this[key].setAttribute(`${cssName}--${key}`, (+/* @__PURE__ */ new Date()).toString(36));
      this.tooltip ??= f(".tt-tooltip.tt-tooltip--align-center.tt-tooltip--down", { id: `balloon-tooltip-for-${U}`, role: "tooltip" }, this.title = title);
      __privateGet(_Balloon, _BALLOONS).set(title, this);
      return this;
    }
    addButton({ left = false, icon = "play", onclick = /* @__PURE__ */ __name((($2) => $2), "onclick"), attributes = {} }) {
      const parent = this.header.closest('div[class*="header"i]');
      const uuid = UUID.from(onclick.toString()).value, existing = $(`[uuid="${uuid}"i]`, parent);
      if (defined(existing))
        return existing;
      const button = furnish(
        "button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-button-icon--secondary.tt-core-button.tt-flex.tt-flex-column.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-justify-content-center.tt-mg-l-05.tt-overflow-hidden.tt-popover-header__icon-slot--right.tt-relative",
        {
          ...attributes,
          uuid,
          onclick,
          style: "padding:0.5rem!important; height:3rem!important; width:3rem!important;",
          innerHTML: Glyphs[icon],
          "connected-to": this.uuid
        }
      );
      if (left)
        parent.insertBefore(button, parent.firstElementChild);
      else
        parent.insertBefore(button, parent.lastElementChild);
      return button;
    }
    remove() {
      var _a3;
      (_a3 = this.container) == null ? void 0 : _a3.remove();
      __privateGet(_Balloon, _BALLOONS).delete(this.title);
    }
    add(...jobs) {
      jobs = jobs.map((job, index) => {
        let { href, message, subheader, src = Runtime.getURL("profile.png"), attributes = {}, onremove = /* @__PURE__ */ __name((($2) => $2), "onremove"), animate = /* @__PURE__ */ __name((($2) => $2), "animate") } = job, { uuid } = this, guid = UUID.from(href).value, f = furnish;
        const existing = $(`#tt-balloon-job-${uuid}--${guid}`);
        if (defined(existing))
          return existing;
        ++this.length;
        const container = f(
          `#tt-balloon-job-${uuid}--${guid}`,
          { ...attributes, uuid, guid, href: parseURL(href).href },
          f(
            ".simplebar-scroll-content",
            {
              style: "overflow: hidden;"
            },
            f(
              ".simplebar-content",
              {
                style: "overflow: hidden; width:100%;"
              },
              f(".tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]").with(
                f(
                  ".persistent-notification.tt-relative[@testSelector=persistent-notification]",
                  {
                    style: "width:100%"
                  },
                  f(".persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap").with(
                    f(
                      "a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]",
                      {
                        "connected-to": `${uuid}--${guid}`,
                        href,
                        onclick: /* @__PURE__ */ __name((event) => {
                          let { currentTarget } = event, connectedTo = currentTarget.getAttribute("connected-to");
                          const element = $(`#tt-balloon-job-${connectedTo}`);
                          if (defined(element)) {
                            onremove({
                              ...event,
                              uuid,
                              guid,
                              href,
                              element,
                              canceled: false,
                              callback(element2) {
                                clearInterval(+element2.getAttribute("animationID"));
                                element2.remove();
                              }
                            });
                          }
                        }, "onclick")
                      },
                      f(".persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1").with(
                        // Avatar
                        f.div(
                          f(".tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden").with(
                            f(".tt-aspect.tt-aspect--align-top").with(
                              f("img.tt-balloon-avatar.tt-image", { src })
                            )
                          )
                        ),
                        // Message body
                        f(".tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1").with(
                          f(".persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]").with(
                            f("span.tt-c-text-alt").with(
                              f("p.tt-balloon-message").html(message)
                            )
                          ),
                          // Subheader
                          f(".tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05").with(
                            f(".tt-mg-l-05").with(
                              f("span.tt-balloon-subheader.tt-c-text-alt").html(subheader)
                            )
                          ),
                          f("div").html(Glyphs.modify("navigation", { height: "20px", width: "20px", style: "position:absolute; right:0; top:40%;" }))
                        )
                      )
                    ),
                    // Repeat mini-button
                    f(
                      ".persistent-notification__delete.tt-absolute",
                      { style: `top:0; right:2rem; z-index:var(--always-on-top)` },
                      f(".tt-align-items-start.tt-flex.tt-flex-nowrap").with(
                        f(
                          "button.tt-redo-btn.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]",
                          {
                            "connected-to": `${uuid}--${guid}`,
                            "@streamer-name": parseURL(href).pathname.slice(1),
                            onclick: /* @__PURE__ */ __name((event) => {
                              var _a3, _b;
                              let { currentTarget } = event, connectedTo = currentTarget.getAttribute("connected-to");
                              const element = $(`#tt-balloon-job-${connectedTo}`), thisJob = $("a", element), redo = ((_b = (_a3 = parseURL(thisJob.href).searchParameters) == null ? void 0 : _a3.redo) == null ? void 0 : _b.equals(currentTarget.dataset.streamerName)) ? "" : currentTarget.dataset.streamerName, url = parseURL(thisJob.href).addSearch({ redo });
                              thisJob.setAttribute("new-href", url.href);
                              ALL_FIRST_IN_LINE_JOBS.map((job2, index2) => {
                                if (parseURL(job2).pathname.equals(url.pathname))
                                  if (index2)
                                    ALL_FIRST_IN_LINE_JOBS.splice(index2, 1, url.href), Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                                  else
                                    REDO_FIRST_IN_LINE_QUEUE(job2, { redo });
                              });
                            }, "onclick")
                          },
                          f("span.tt-button-icon__icon").with(
                            f(
                              "div",
                              {
                                style: "height:1.6rem; width:1.6rem",
                                innerHTML: Glyphs.refresh
                              }
                            )
                          )
                        )
                      )
                    ).setTooltip(`Toggle channel repeat`, { from: "bottom" }),
                    // Remove mini-button
                    f(
                      ".persistent-notification__delete.tt-absolute",
                      { style: `top:0; right:0; z-index:var(--always-on-top)` },
                      f(".tt-align-items-start.tt-flex.tt-flex-nowrap").with(
                        f(
                          "button.tt-del-btn.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]",
                          {
                            "connected-to": `${uuid}--${guid}`,
                            onclick: /* @__PURE__ */ __name((event) => {
                              let { currentTarget } = event, connectedTo = currentTarget.getAttribute("connected-to");
                              const element = $(`#tt-balloon-job-${connectedTo}`);
                              const tooltip = Tooltip.get(currentTarget.closest(".persistent-notification__delete"));
                              if (defined(element)) {
                                onremove({
                                  ...event,
                                  uuid,
                                  guid,
                                  href,
                                  element,
                                  canceled: true,
                                  callback(element2) {
                                    clearInterval(+element2.getAttribute("animationID"));
                                    tooltip.remove();
                                    element2.remove();
                                  }
                                });
                              }
                            }, "onclick")
                          },
                          f("span.tt-button-icon__icon").with(
                            f(
                              "div",
                              {
                                style: "height:1.6rem; width:1.6rem",
                                innerHTML: Glyphs.x
                              }
                            )
                          )
                        )
                      )
                    ).setTooltip(`Remove from queue`, { from: "bottom" })
                  )
                )
              )
            )
          )
        );
        container.setAttribute("animationID", animate(container));
        this.body.append(container);
        return container;
      });
      return jobs;
    }
    static get(title) {
      return __privateGet(_Balloon, _BALLOONS).get(title);
    }
  };
  _BALLOONS = new WeakMap();
  __name(_Balloon, "Balloon");
  __privateAdd(_Balloon, _BALLOONS, /* @__PURE__ */ new Map());
  var Balloon2 = _Balloon;

  // src/lib/chat-footer.js
  var _FOOTERS, _FOOTER_TIMEOUT;
  var _ChatFooter = class _ChatFooter {
    constructor(title, options = {}) {
      const f = furnish;
      const uuid = UUID.from(title).value, existing = __privateGet(_ChatFooter, _FOOTERS).get(title);
      if (defined(existing))
        return existing;
      const parent = $('[data-a-target="chat-scroller"i]'), footer = f(
        "#tt-chat-footer.tt-absolute.tt-border-radius-medium.tt-bottom-0.tt-mg-b-1",
        {
          uuid,
          ...options,
          style: `background-color: #387aff; left: 50%; margin-bottom: 5rem!important; transform: translateX(-50%); width: fit-content;`
        },
        f(
          "button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-core-button.tt-core-button--overlay.tt-core-button--text.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative",
          { style: "padding: 0.5rem 1rem;" },
          f(".tt-align-items-center.tt-core-button-label.tt-flex.tt-flex-grow-0").with(
            f(".tt-flex-grow-0", {
              innerHTML: title
            })
          )
        )
      );
      parent.append(footer);
      this.uuid = uuid;
      this.parent = parent;
      this.container = footer;
      clearTimeout(__privateGet(_ChatFooter, _FOOTER_TIMEOUT));
      __privateSet(_ChatFooter, _FOOTER_TIMEOUT, setTimeout(() => {
        var _a3;
        return (_a3 = this == null ? void 0 : this.container) == null ? void 0 : _a3.remove();
      }, 15e3));
      return this;
    }
    remove() {
      if (this.container)
        this.container.remove();
    }
    static get(title) {
      return __privateGet(_ChatFooter, _FOOTERS).get(title);
    }
  };
  _FOOTERS = new WeakMap();
  _FOOTER_TIMEOUT = new WeakMap();
  __name(_ChatFooter, "ChatFooter");
  __privateAdd(_ChatFooter, _FOOTERS, /* @__PURE__ */ new Map());
  __privateAdd(_ChatFooter, _FOOTER_TIMEOUT, -1);
  var ChatFooter = _ChatFooter;

  // src/lib/card.js
  var _a, _CARDS;
  var _Card = class _Card {
    constructor({ title = "", subtitle = "", description = "", footer, icon, fineTuning = {} }) {
      var _a3;
      fineTuning.top ??= "7rem";
      fineTuning.left ??= "0px";
      fineTuning.cursor ??= "auto";
      let styling = [];
      for (const key in fineTuning) {
        let [value, unit] = (fineTuning[key] ?? "").toString().split(/([\-\+]?[\d\.]+)([^\d\.]+)/).filter((string) => string.length);
        if (nullish(value))
          continue;
        if (parseFloat(value) >= -Infinity)
          unit ??= "px";
        else
          unit ??= "";
        styling.push(`${key}:${value}${unit}`);
      }
      styling = styling.join(";");
      const f = furnish;
      const container = $('[data-a-target*="card"i] [class*="card-layer"i]'), card = f(`.tt-absolute.tt-border-radius-large.viewer-card-layer__draggable[@aTarget=viewer-card-positioner]`, { style: styling }), uuid = UUID.from([title, subtitle].join("\n")).value;
      icon ??= { src: Runtime.getURL("profile.png"), alt: "Profile" };
      card.id = uuid;
      [...container.children].forEach((child) => child.remove());
      const iconElement = f("img.emote-card__big-emote.tt-image[@testSelector=big-emote]", { ...icon }).setTooltip(icon.alt);
      card.append(
        f(
          '.emote-card.tt-border-b.tt-border-l.tt-border-r.tt-border-radius-large.tt-border-t.tt-elevation-1[data-a-target="emote-card"]',
          { style: "animation:1 fade-in .6s" },
          f(".emote-card__banner.tt-align-center.tt-align-items-center.tt-c-background-alt.tt-flex.tt-flex-grow-2.tt-flex-row.tt-full-width.tt-justify-content-start.tt-pd-l-1.tt-pd-y-1.tt-relative").with(
            f(".tt-inline-flex.viewer-card-drag-cancel").with(
              f(".tt-inline.tt-relative.tt-tooltip__container[@aTarget=emote-name]").with(iconElement)
            ),
            f(".emote-card__display-name.tt-align-items-center.tt-align-left.tt-ellipsis.tt-mg-1").with(
              f("h4.tt-c-text-base.tt-ellipsis.tt-strong[@testSelector=emote-code-header]").with(title),
              f("p.tt-c-text-alt-2.tt-ellipsis.tt-font-size-6[@testSelector=emote-type-copy]").with(subtitle)
            )
          )
        ),
        f(
          ".tt-absolute.tt-mg-r-05.tt-mg-t-05.tt-right-0.tt-top-0[@aTarget=viewer-card-close-button]",
          {
            onmouseup: /* @__PURE__ */ __name(({ button = -1 }) => {
              !button && $.all('[data-a-target*="card"i] [class*="card-layer"] > *').forEach((node) => node.remove());
            }, "onmouseup")
          },
          f(".tt-inline-flex.viewer-card-drag-cancel").with(
            f(
              "button.tt-button-icon.tt-button-icon--secondary.tt-core-button[@testSelector=close-viewer-card]",
              {
                "aria-label": "Hide"
              },
              f("span.tt-button-icon__icon").with(
                f('div[style="width: 2rem; height: 2rem;"]').with(
                  f(".tt-icon").with(
                    f(".tt-aspect").html(Glyphs.modify("x", { height: "20px", width: "20px" }).toString())
                  )
                )
              )
            )
          )
        )
      );
      container.append(card);
      if ((_a3 = footer == null ? void 0 : footer.href) == null ? void 0 : _a3.length)
        $("div", card).append(
          // Tiny banner (live status)
          f(".emote-card__content.tt-full-width.tt-inline-flex.tt-pd-1.viewer-card-drag-cancel").with(
            f.div(
              f(".tt-align-items-center.tt-align-self-start.tt-mg-b-05").with(
                f(".tt-align-items-center.tt-flex").with(
                  f(".tt-align-items-center.tt-flex.tt-mg-r-1").with(
                    f(
                      'a.tt-link[rel="noopener noreferrer" target="_blank"]',
                      { href: footer.href },
                      f(".tt-flex", {
                        innerHTML: `${Glyphs.modify("video", { height: "20px", width: "20px" })}${f(".tt-mg-l-05").with(
                          f("p.tt-c-text-link.tt-font-size-5.tt-strong").with(footer.name)
                        ).outerHTML}`
                      })
                    )
                  ),
                  f(".tt-align-items-center.tt-flex").with(
                    f(`div[tt-live-status-indicator="${parseBool(footer.live)}"]`),
                    f(".tt-flex.tt-mg-l-05").with(
                      f(
                        "p.tt-c-text-base.tt-font-size-6",
                        { style: "text-transform:uppercase" },
                        ["offline", "live"][+footer.live]
                      )
                    )
                  )
                )
              )
            )
          ),
          // "This useer has X emotes"
          f("div[@aTestSelector=emote-card-content-description]", { style: "padding:0 1rem; margin-bottom: 1rem", innerHTML: description })
        );
      card.classList.add("tt-c-background-base");
      this.body = card;
      this.icon = iconElement;
      this.icon.tooltip = new Tooltip(iconElement, icon.alt);
      this.uuid = uuid;
      this.footer = footer;
      this.container = container;
      __privateGet(_Card, _CARDS).set(title, this);
      return this;
    }
    remove() {
      var _a3;
      (_a3 = this.container) == null ? void 0 : _a3.remove();
      for (const [title, card] of __privateGet(_Card, _CARDS))
        if (card === this)
          __privateGet(_Card, _CARDS).delete(title);
    }
    static get(title) {
      return __privateGet(_Card, _CARDS).get(title);
    }
  };
  _CARDS = new WeakMap();
  __name(_Card, "Card");
  __privateAdd(_Card, _CARDS, /* @__PURE__ */ new Map());
  __publicField(_Card, "deferred", (_a = class {
    constructor(fineTuning = {}) {
      fineTuning.top ??= "7rem";
      fineTuning.left ??= "0px";
      fineTuning.cursor ??= "auto";
      fineTuning.padding ??= "1rem";
      let styling = ["border:var(--border-width-default) solid var(--color-border-base);"];
      for (const key in fineTuning) {
        let [value, unit] = (fineTuning[key] ?? "").toString().split(/([\-\+]?[\d\.]+)([^\d\.]+)/).filter((string) => string.length);
        if (nullish(value))
          continue;
        if (parseFloat(value) >= -Infinity)
          unit ??= "px";
        else
          unit ??= "";
        styling.push(`${key}:${value}${unit}`);
      }
      styling = styling.join(";");
      const f = furnish;
      const container = $('[data-a-target*="card"i] [class*="card-layer"i]'), card = f(
        `.tt-absolute.tt-border-radius-large.viewer-card-layer__draggable[@aTarget=viewer-card-positioner]`,
        { style: styling },
        f(
          ".tt-absolute.tt-mg-r-05.tt-mg-t-05.tt-right-0.tt-top-0[@aTarget=viewer-card-close-button]",
          {
            onmouseup: /* @__PURE__ */ __name(({ button = -1 }) => {
              !button && $.all('[data-a-target*="card"i] [class*="card-layer"] > *').forEach((node) => node.remove());
            }, "onmouseup")
          },
          f(".tt-inline-flex.viewer-card-drag-cancel").with(
            f(
              "button.tt-button-icon.tt-button-icon--secondary.tt-core-button[@testSelector=close-viewer-card]",
              {
                "aria-label": "Hide"
              },
              f("span.tt-button-icon__icon").with(
                f('div[style="width: 2rem; height: 2rem;"]').with(
                  f(".tt-icon").with(
                    f(".tt-aspect").html(Glyphs.modify("x", { height: "20px", width: "20px" }).toString())
                  )
                )
              )
            )
          )
        )
      );
      [...container.children].forEach((child) => child.remove());
      card.append(
        f(".tt-spinner")
      );
      container.append(card);
      const uuid = UUID.from(card.getPath()).value;
      card.id = uuid;
      card.classList.add("tt-c-background-base");
      this.body = card;
      this.uuid = uuid;
      this.container = container;
      return this;
    }
    post(state) {
      this.body.remove();
      return new _Card(state);
    }
  }, __name(_a, "deferred"), _a));
  var Card = _Card;

  // src/lib/context-menu.js
  var _RootCloseOnComplete;
  var _ContextMenu = class _ContextMenu {
    constructor({ inherit = {}, options = [], fineTuning = {} }) {
      fineTuning.top ??= "5rem";
      fineTuning.left ??= "5rem";
      fineTuning.cursor ??= "auto";
      let styling = [];
      for (const key in fineTuning) {
        let [value, unit] = (fineTuning[key] ?? "").toString().split(/([\-\+]?[\d\.]+)([^\d\.]+)/).filter((string) => string.length);
        if (nullish(value))
          continue;
        if (parseFloat(value) >= -Infinity)
          unit ??= "px";
        else
          unit ??= "";
        styling.push(`${key}:${value}${unit}`);
      }
      styling = styling.join(";");
      const f = furnish;
      const container = $("#root"), menu = f(`.tt-context-menu.tt-absolute`, { style: styling }), uuid = UUID.from(options.map(Object.values).join("\n")).value;
      menu.id = uuid;
      $.all(".tt-context-menu").forEach((menu2) => menu2.remove());
      menu.append(
        f(
          ".tt-border-radius-large",
          { style: "background:var(--color-background-alt-2); position:absolute; z-index:9999", direction: "top-right" },
          // The options...
          f(
            "div",
            { style: "display:inline-block; min-width:16rem; max-width:48rem; width:max-content", role: "dialog" },
            f(
              "div",
              { style: "padding:0.25rem;" },
              ...options.map(({ text = "", icon = "", shortcut = "", favicon = "", action = /* @__PURE__ */ __name(() => {
              }, "action") }) => {
                if (icon == null ? void 0 : icon.length)
                  icon = f("div", { style: "display:inline-block; float:left; margin-left:calc(-1rem - 16px); margin-right:1rem", innerHTML: Glyphs.modify(icon, { height: "16px", width: "16px", style: "vertical-align:-3px" }) });
                if (text == null ? void 0 : text.length)
                  text = f(".tt-hide-text-overflow").html(text);
                if (shortcut == null ? void 0 : shortcut.length)
                  shortcut = f.pre(f.code(GetMacro(shortcut)));
                if (favicon == null ? void 0 : favicon.length)
                  favicon = f.pre(f.code().html(favicon)).css(`margin-top:-2.5rem; transform:translate(0,25%)`);
                if (icon || text || shortcut || favicon)
                  return f("button.tt-context-menu-option", { onmouseup: /* @__PURE__ */ __name((event) => action({ ...event, inheritance: inherit }), "onmouseup"), style: "border-radius:0.6rem; display:inline-block; padding:0.5rem 0 0.5rem 3rem; width:-webkit-fill-available;width:-moz-available" }, icon, shortcut, text, favicon);
                return f("hr", { style: "border-top:1px solid var(--channel-color); margin:0.25rem 0;" });
              })
            )
          )
        )
      );
      container.append(menu);
      const offset = getOffset(menu.firstElementChild);
      if (offset.screenOverflow) {
        if (offset.screenOverflowX)
          menu.modStyle(`left:${getOffset(menu).left + offset.screenCorrectX}px`);
        if (offset.screenOverflowY)
          menu.modStyle(`top:${getOffset(menu).top + offset.screenCorrectY}px`);
      }
    }
  };
  _RootCloseOnComplete = new WeakMap();
  __name(_ContextMenu, "ContextMenu");
  __privateAdd(_ContextMenu, _RootCloseOnComplete, when.defined(() => $("#root")).then(
    (root) => root.addEventListener("mouseup", (event) => {
      let { path, button = -1 } = event, menu = $(".tt-context-menu");
      if (defined(menu))
        menu.remove();
    })
  ));
  var ContextMenu = _ContextMenu;

  // src/lib/search.js
  var _a2, _cache;
  var _Search = class _Search {
    constructor(ID = null, type = "channel", as = null) {
      const spadeEndpoint = `https://spade.twitch.tv/track`, twilightBuildID = "5fc26188-666b-4bf4-bdeb-19bd4a9e13a4";
      const pathname = location.pathname.slice(1), options = {
        method: "POST",
        headers: {
          "Accept-Language": "en-US",
          "Accept": "*/*",
          "Authorization": _Search.authorization,
          "Client-ID": _Search.clientID,
          "Content-Type": `text/plain; charset=UTF-8`
        }
      }, player = {
        type: "site",
        routes: {
          exact: ["activate", "bits", "bits-checkout", "directory", "following", "luna", "popout", "prime", "store", "subs"],
          start: ["bits-checkout/", "checkout/", "collections/", "communities/", "dashboard/", "directory/", "event/", "luna/", "prime/", "products/", "settings/", "store/", "subs/"]
        }
      };
      let vodID = null, channelName = null;
      if (nullish(ID) && /^auto(?:matic)?$/i.test(type)) {
        if (player.routes.exact.missing(pathname) && !player.routes.start.filter((route) => pathname.startsWith(route)).length && // Is a VOD
        (pathname.startsWith("videos/") ? vodID = pathname.replace("videos/", "").replace(/\//g, "").replace(/^v/, "") : channelName = pathname.replace(/\//g, "")))
          ;
        else
          throw `Unable to parse Search data`;
        if (vodID == null ? void 0 : vodID.length) {
          ID = vodID;
          type = "vod";
        } else if (channelName == null ? void 0 : channelName.length) {
          ID = channelName;
          type = "channel";
        }
      }
      if (type.equals("vod"))
        vodID = ID;
      if (type.equals("channel"))
        channelName = ID;
      let searchID = UUID.from([ID, type, as, new Date((+/* @__PURE__ */ new Date()).floorToNearest(_Search.cacheLeaseTime)).toJSON()].join("~")).value, searchResults;
      if (__privateGet(_Search, _cache).has(searchID))
        return __privateGet(_Search, _cache).get(searchID);
      let template;
      switch (_Search.parseType = as) {
        case "query":
          {
            const query = 'query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) { streamPlaybackAccessToken(channelName: $login, params: { platform: "web", playerBackend: "mediaplayer", playerType: $playerType }) @include(if: $isLive) { value signature __typename } videoPlaybackAccessToken(id: $vodID, params: { platform: "web", playerBackend: "mediaplayer", playerType: $playerType }) @include(if: $isVod) { value signature __typename }}';
            template = { operationName: "PlaybackAccessToken_Template", query };
          }
          break;
        case "chat.info":
          {
            const variables = { login: channelName }, extensions = { persistedQuery: "SHA-256", version: 1 };
            template = { operationName: "StreamChat", variables, extensions };
          }
          break;
        case "chat.user":
          {
            const variables = {}, extensions = { persistedQuery: "SHA-256", version: 1 };
            template = { operationName: "Chat_UserData", variables, extensions };
          }
          break;
        case "video.ad":
          {
            const variables = { login: channelName, ownsCollectionID: null, ownsVideoID: vodID }, extensions = { persistedQuery: "SHA-256", version: 1 };
            template = { operationName: "VideoAdBanner", variables, extensions };
          }
          break;
        case "video.info":
          {
            const variables = { id: STREAMER.sole }, extensions = { persistedQuery: "SHA-256", version: 1 };
            template = { operationName: "WithIsStreamLiveQuery", variables, extensions };
          }
          break;
        case ".legacy":
          {
            return fetchURL.fromDisk(`https://api.twitch.tv/helix/channels?broadcaster_id=${ID}`, { headers: { "Authorization": _Search.authorization, "Client-ID": _Search.clientID }, hoursUntilEntryExpires: 168 }).then((response) => response.json()).then((json) => {
              var _a3, _b, _c;
              const id = parseInt((_c = (_b = (_a3 = json == null ? void 0 : json.data) == null ? void 0 : _a3.shift) == null ? void 0 : _b.call(_a3)) == null ? void 0 : _c.broadcaster_id);
              if (nullish(id))
                throw `${json.error}: ${json.message}`;
              return id;
            });
          }
          break;
        /** Twitch Insights JSON
         * id: string<number~int>
         * displayName: string
         * createdAt: string<Date~ISO>
         * updatedAt: string<#empty|Date~ISO>
         * deletedAt: string<#empty|Date~ISO>
         * userType: string
         * broadcasterType: string
         * unavailableReason: string
         */
        case "getID":
          {
            return _Search.findUserID(ID);
          }
          break;
        case "getName":
          {
            return _Search.findUsername(ID);
          }
          break;
        case "status.live":
          {
            return _Search.getUserStatus(ID);
          }
          break;
        default:
          {
            const languages = `bg cs da de el en es es-mx fi fr hu it ja ko nl no pl ro ru sk sv th tr vi zh-cn zh-tw x-default`.split(" ");
            const name2 = channelName == null ? void 0 : channelName.toLowerCase();
            if (nullish(name2) || type.unlike("channel"))
              break;
            if (SEARCH_CACHE.has(name2))
              return Promise.resolve(SEARCH_CACHE.get(name2));
            searchResults = fetchURL.idempotent(`./${name2}`).then((response) => response.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then(async (doc) => {
              var _a3, _b, _c, _d, _e, _f, _g;
              let alt_languages = $.all('link[rel^="alt"i][hreflang]', doc).map((link) => link.hreflang), data = (_a3 = $('head>script[type^="application"i][type$="json"i]', doc)) == null ? void 0 : _a3.textContent;
              try {
                [data] = JSON.parse(data || `{"@graph":[]}`)["@graph"];
              } catch (error) {
                try {
                  [data] = JSON.parse(data || `[{}]`);
                } catch (error2) {
                  throw new Error(`Unable to perform a search for "${name3}": ${JSON.stringify(data)}`);
                }
              }
              let display_name = ((data == null ? void 0 : data.name) ?? `${channelName} - Twitch`).split("-").slice(0, -1).join("-").trim(), [language] = languages.filter((lang) => alt_languages.missing(lang)), name3 = (_b = display_name == null ? void 0 : display_name.trim()) == null ? void 0 : _b.toLowerCase(), profile_image = ((_c = $('meta[property$="image"i]', doc)) == null ? void 0 : _c.content) || Runtime.getURL("profile.png"), live = parseBool((_d = data == null ? void 0 : data.publication) == null ? void 0 : _d.isLiveBroadcast), started_at = new Date((_e = data == null ? void 0 : data.publication) == null ? void 0 : _e.startDate).toJSON(), status = (data == null ? void 0 : data.description) ?? ((_f = $('meta[name$="description"i]', doc)) == null ? void 0 : _f.content), updated_at = new Date((_g = data == null ? void 0 : data.publication) == null ? void 0 : _g.endDate).toJSON(), broadcaster_id;
              try {
                broadcaster_id = parseInt(await fetchURL.fromDisk(`https://api.twitchinsights.net/v1/user/status/${name3}`, { hoursUntilEntryExpires: 744 }).then((r) => r.json()).then((j) => j.id)) | 0;
              } catch (error) {
              }
              const json = { display_name, broadcaster_id, language, live, name: name3, profile_image, started_at, status, updated_at, href: `https://www.twitch.tv/${display_name}` };
              _Search.parseType = "pure";
              const channelData = await _Search.convertResults({ async json() {
                return json;
              } });
              SEARCH_CACHE.set(display_name.toLowerCase(), channelData);
              ALL_CHANNELS = [...ALL_CHANNELS, channelData].filter(defined).filter(uniqueChannels);
              return {
                async arrayBuffer() {
                  return new Blob([JSON.stringify(json, null, 0)], { type: "application/json" }).arrayBuffer();
                },
                async blob() {
                  return new Blob([JSON.stringify(json, null, 4)], { type: "application/json" });
                },
                async json() {
                  return json;
                },
                async text() {
                  return JSON.stringify(json);
                },
                async formData() {
                  const form = new FormData();
                  for (const key of Object.keys(json))
                    form.set(key, json[key]);
                  return form;
                }
              };
            }).catch((error) => {
              var _a3;
              $warn(error);
              return (_a3 = STREAMER == null ? void 0 : STREAMER.jump) == null ? void 0 : _a3[name2];
            });
            __privateGet(_Search, _cache).set(searchID, searchResults);
            return searchResults;
          }
          break;
      }
      let body, results;
      switch (type) {
        case "vod":
          {
            body = JSON.stringify({
              ...template,
              variables: {
                isLive: false,
                login: "",
                isVod: true,
                vodID: ID,
                playerType: player.type
              }
            });
            results = {
              contentType: "vod",
              id: ID,
              playerType: player.type,
              request: _Search.retrieve({ ...options, body })
            };
          }
          break;
        case "channel":
          {
            body = JSON.stringify({
              ...template,
              variables: {
                isLive: true,
                login: ID,
                isVod: false,
                vodID: "",
                playerType: player.type
              }
            });
            results = {
              contentType: "live",
              id: ID,
              playerType: player.type,
              request: _Search.retrieve({ ...options, body })
            };
          }
          break;
        default: {
          throw `Unable to search for item of type "${type}"`;
        }
      }
      const blob = new Blob([
        `data=${encodeURIComponent(
          btoa(
            JSON.stringify({
              event: "benchmark_template_loaded",
              properties: {
                app_version: twilightBuildID,
                benchmark_server_id: _Search.cookies.server_session_id,
                client_time: Date.now() / 1e3,
                device_id: _Search.cookies.unique_id,
                duration: Math.round(performance.now()),
                url: `${location.protocol}//${[location.hostname, location.pathname, location.search].join("")}`
              }
            })
          )
        )}`
      ], {
        type: `application/x-www-form-urlencoded; charset=UTF-8`
      });
      const request = new XMLHttpRequest();
      request.open("POST", spadeEndpoint);
      request.send(blob);
      __privateGet(_Search, _cache).set(searchID, searchResults = results.request);
      return searchResults;
    }
    static void(ID = null, type = "channel", as = null) {
      const pathname = location.pathname.slice(1), player = {
        type: "site",
        routes: {
          exact: ["activate", "bits", "bits-checkout", "directory", "following", "luna", "popout", "prime", "store", "subs"],
          start: ["bits-checkout/", "checkout/", "collections/", "communities/", "dashboard/", "directory/", "event/", "luna/", "prime/", "products/", "settings/", "store/", "subs/"]
        }
      };
      let vodID = null, channelName = null;
      if (nullish(ID) && /^auto(?:matic)?$/i.test(type)) {
        if (player.routes.exact.missing(pathname) && !player.routes.start.filter((route) => pathname.startsWith(route)).length && // Is a VOD
        (pathname.startsWith("videos/") ? vodID = pathname.replace("videos/", "").replace(/\//g, "").replace(/^v/, "") : channelName = pathname.replace(/\//g, "")))
          ;
        else
          throw `Unable to parse Search data`;
        if (vodID == null ? void 0 : vodID.length) {
          ID = vodID;
          type = "vod";
        } else if (channelName == null ? void 0 : channelName.length) {
          ID = channelName;
          type = "channel";
        }
      }
      if (type.equals("vod"))
        vodID = ID;
      if (type.equals("channel"))
        channelName = ID;
      const searchID = UUID.from([ID, type, as, new Date((+/* @__PURE__ */ new Date()).floorToNearest(_Search.cacheLeaseTime)).toJSON()].join("~")).value;
      SEARCH_CACHE.delete(ID == null ? void 0 : ID.toLowerCase());
      return __privateGet(_Search, _cache).delete(searchID);
    }
    static retrieve(query) {
      if (typeof fetch == "function")
        return fetchURL("https://gql.twitch.tv/gql", query);
      return new Promise((onSuccess, onError) => {
        var _a3;
        const request = new XMLHttpRequest();
        request.open("POST", `https://gql.twitch.tv/gql`);
        Object.keys(query.headers).map((key) => {
          try {
            request.setRequestHeader(key, query.headers[key]);
          } catch (error) {
            $warn(error);
          }
        });
        request.withCredentials = parseBool((_a3 = query.credentials) == null ? void 0 : _a3.equals("include"));
        request.onerror = onError;
        request.onload = () => onSuccess({
          status: request.status,
          statusText: request.statusText,
          body: request.response || request.responseText,
          ok: request.status >= 200 && request.status < 300,
          json: /* @__PURE__ */ __name(() => new Promise((onsuccess, onerror) => {
            try {
              onsuccess(JSON.parse(request.response || request.responseText));
            } catch (query2) {
              onerror(query2);
            }
          }), "json")
        });
        request.send(query.body);
      });
    }
    static async convertResults(response) {
      var _a3, _b, _c, _d, _e, _f, _g, _h;
      let json = await ((_a3 = response == null ? void 0 : response.json) == null ? void 0 : _a3.call(response)) ?? {}, data = {};
      let ConversionKey = {
        banStatus: "veto",
        broadcaster_id: "sole",
        channel: "name",
        channel_id: "sole",
        createdAt: "date",
        displayName: "name",
        hosting: "host",
        id: "sole",
        isMature: "nsfw",
        login: "name",
        mature: "nsfw",
        partner: "ally",
        primaryColorHex: "tint",
        profileImageURL: "icon",
        role: "role",
        subscriber: "paid",
        turbo: "fast",
        viewersCount: "poll",
        display_name: "name",
        status: "desc",
        title: "desc",
        live: "live",
        href: "href",
        profile_image: "icon"
      }, DataConversionKey = {
        started_at: "actualStartTime",
        updated_at: "lastSeen",
        stream: "broadcast"
      }, deeper = [];
      switch (_Search.parseType) {
        case "advanced":
          {
          }
          break;
        case "pure":
          {
          }
          break;
        case "chat.info":
          {
            try {
              json = JSON.parse(((_b = json == null ? void 0 : json.data) == null ? void 0 : _b.channel) ?? "null");
              deeper = ["self"];
            } catch (error) {
              throw `Unable to parse results: ${error}`;
            }
          }
          break;
        case "chat.user":
          {
            try {
              json = JSON.parse(((_c = json == null ? void 0 : json.data) == null ? void 0 : _c.user) ?? "null");
            } catch (error) {
              throw `Unable to parse results: ${error}`;
            }
          }
          break;
        case "video.ad":
          {
            try {
              json = JSON.parse(((_d = json == null ? void 0 : json.data) == null ? void 0 : _d.userByAttribute) ?? "null");
            } catch (error) {
              throw `Unable to parse results: ${error}`;
            }
          }
          break;
        case "video.info":
          {
            try {
              json = JSON.parse(((_f = (_e = json == null ? void 0 : json.data) == null ? void 0 : _e.user) == null ? void 0 : _f.stream) ?? "null");
            } catch (error) {
              throw `Unable to parse results: ${error}`;
            }
          }
          break;
        default:
          {
            try {
              json = JSON.parse(((_h = (_g = json == null ? void 0 : json.data) == null ? void 0 : _g.streamPlaybackAccessToken) == null ? void 0 : _h.value) ?? "null");
            } catch (error) {
              throw `Unable to parse results: ${error}`;
            }
          }
          break;
      }
      const deeperLevels = {};
      for (const key in json) {
        const to = ConversionKey[key];
        if (to == null ? void 0 : to.length)
          data[to] = json[key];
        if (deeper.contains(to))
          deeperLevels[to] = json[key];
      }
      for (const key in deeperLevels) {
        const to = ConversionKey[key];
        if (to == null ? void 0 : to.length)
          data[to] = deeperLevels[key];
      }
      data.data ??= {};
      const deeperDataLevels = {};
      for (const key in json) {
        const to = DataConversionKey[key];
        if (to == null ? void 0 : to.length)
          data.data[to] ??= json[key];
        if (deeper.contains(to))
          deeperDataLevels[to] = json[key];
      }
      for (const key in deeperDataLevels) {
        const to = DataConversionKey[key];
        if (to == null ? void 0 : to.length)
          data.data[to] ??= deeperDataLevels[key];
      }
      return new Promise((resolve) => {
        var _a4;
        return resolve({ ok: parseBool((_a4 = parseURL(data.icon).pathname) == null ? void 0 : _a4.startsWith("/jtv_user")), ...data });
      });
    }
    static async findUserID(username = null) {
      return fetchURL.fromDisk(`https://api.twitchinsights.net/v1/user/status/${username}`).then((response) => response.json()).then((json) => {
        const id = parseInt(json == null ? void 0 : json.id);
        if (nullish(id))
          throw `[${json.status}] An error occurred: ${json.error}`;
        return id;
      }).catch($warn);
    }
    static async findUsername(userID = null) {
      return fetchURL.fromDisk(`https://api.twitchinsights.net/v1/user/status/${userID}`).then((response) => response.json()).then((json) => {
        const name2 = json == null ? void 0 : json.displayName;
        if (nullish(name2))
          throw `[${json.status}] An error occurred: ${json.error}`;
        return name2;
      }).catch($warn);
    }
    static async getUserStatus(username = null) {
      return fetchURL.idempotent(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${username.toLowerCase()}-80x45.jpg`, { as: "native", hoursUntilEntryExpires: 1 / 12, keepDefectiveEntry: true }).then((response) => {
        const { pathname, filename } = parseURL(response.url);
        return !(/\/404_/.test(pathname) || !/\/previews-ttv\//i.test(pathname));
      });
    }
  };
  _cache = new WeakMap();
  __name(_Search, "Search");
  __publicField(_Search, "cookies", {
    ...((cookies = []) => {
      const object = {};
      for (const cookie of cookies) {
        let [name2, value] = cookie.split("=", 2);
        if (/^[\{\[]/.test(value))
          value = JSON.parse(decodeURIComponent(value));
        object[name2.replace(/\W+/g, "_")] = value;
      }
      return object;
    })((_a2 = document == null ? void 0 : document.cookie) == null ? void 0 : _a2.split(/;\s*/))
  });
  __publicField(_Search, "anonID", "kimne78kx3ncx6brgo4mv6wki5h1ko");
  __privateAdd(_Search, _cache, /* @__PURE__ */ new Map());
  __publicField(_Search, "cacheLeaseTime", 3e5 * (parseInt(Settings.low_data_mode) || 1));
  var Search2 = _Search;

  // src/lib/chat.js
  function Chat2(message = "", ...mentions) {
    if (!message.length)
      return Chat2.get();
    const finalMsg = [message.trim()];
    for (const mention of [mentions].flat())
      finalMsg.push(mention.replace(/^(?!@)/, "@"));
    return Chat2.send(finalMsg.join(" "));
  }
  __name(Chat2, "Chat");
  Object.defineProperties(Chat2, {
    element: { get() {
      return $('[data-test-selector$="message-container"i]').closest("section");
    } },
    badges: {
      get() {
        var _a3, _b;
        const badges = ((_b = (_a3 = JUMP_DATA == null ? void 0 : JUMP_DATA[STREAMER.name.toLowerCase()]) == null ? void 0 : _a3.stream) == null ? void 0 : _b.badges) ?? {};
        return {
          ...badges,
          get(type) {
            var _a4, _b2, _c, _d;
            return {
              everyone: "https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png",
              subscriber: ((_d = (_c = (_b2 = (_a4 = STREAMER.jump[STREAMER.name.toLowerCase()]) == null ? void 0 : _a4.stream) == null ? void 0 : _b2.badges) == null ? void 0 : _c[`${STREAMER.sole}_subscriber_0`]) == null ? void 0 : _d.href) || "https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png",
              regular: "https://static-cdn.jtvnw.net/user-default-pictures-uv/215b7342-def9-11e9-9a66-784f43822e80-profile_image-70x70.png",
              twitch_vip: "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3",
              vip: "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3",
              moderator: "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3",
              mod: "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3",
              admin: "https://static-cdn.jtvnw.net/badges/v1/d97c37bd-a6f5-4c38-8f57-4e4bef88af34/3",
              owner: "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3"
            }[(type ?? "everyone").toString().toLowerCase()];
          }
        };
      }
    },
    gang: { value: [] },
    mods: { value: [] },
    vips: { value: [] },
    get: {
      // Create an array of the current chat
      // Chat.get(mostRecent:number?, keepEmotes:boolean?) → [...object<{ style<string{ CSS }>, author<string>, emotes<array{ string }>, message<string>, mentions<array{ string }>, element?<Element>, uuid<string>, reply?<Element>, deleted?<boolean>, highlighted?<boolean> }>]
      value: /* @__PURE__ */ __name(function get(mostRecent = 250, keepEmotes = true) {
        const results = [];
        for (const [uuid, object] of [...Chat2.__allmessages__].slice(-mostRecent)) {
          let { message, emotes } = object;
          if (!keepEmotes)
            for (const emote of emotes)
              message = message.replaceAll(emote, "");
          const O = Object.assign({}, object, { message });
          Object.defineProperties(O, {
            deleted: {
              get: (async function() {
                return Promise.race([this, wait(100).then(() => null)]).then((self) => {
                  return self === null || nullish(self == null ? void 0 : self.parentElement) || $.defined('[data-a-target*="delete"i]:not([class*="spam-filter"i], [data-repetitive], [data-plagiarism])', self);
                });
              }).bind(object.element)
            }
          });
          results.push(O);
        }
        return results;
      }, "get")
    },
    send: {
      // Sends a message via the current chat
      // Chat.send(message:string?) → undefined
      value: /* @__PURE__ */ __name(function send(message = "") {
        if (typeof message != "string")
          return;
        when(() => TTV_IRC.socket.readyState === WebSocket.OPEN).then((ready) => {
          TTV_IRC.socket.send(`PRIVMSG #${STREAMER.name.toLowerCase()} :${message}`);
        });
      }, "send")
    },
    reply: {
      // Replies to a message via the current chat
      // Chat.send(to:string<IRC-Msg-Id>, message:string?) → undefined
      value: /* @__PURE__ */ __name(function reply(to = "", message = "") {
        if (typeof to != "string" || to.length < 1 || typeof message != "string" || message.length < 1)
          return;
        when(() => TTV_IRC.socket.readyState === WebSocket.OPEN).then((ready) => {
          TTV_IRC.socket.send(`@reply-parent-msg-id=${to} PRIVMSG #${STREAMER.name.toLowerCase()} :${message}`);
        });
      }, "reply")
    },
    // Deferred listener for new chat messages
    defer: {
      value: {
        set onmessage(callback) {
          const name2 = callback.name || UUID.from(callback.toString()).value;
          if (Chat2.__deferredEvents__.__onmessage__.has(name2))
            return Chat2.__deferredEvents__.__onmessage__.get(name2);
          Chat2.__deferredEvents__.__onmessage__.set(name2, callback);
          return callback;
        },
        get onmessage() {
          return Chat2.__deferredEvents__.__onmessage__.size;
        },
        set onpinned(callback) {
          const name2 = callback.name || UUID.from(callback.toString()).value;
          if (Chat2.__deferredEvents__.__onpinned__.has(name2))
            return Chat2.__deferredEvents__.__onpinned__.get(name2);
          Chat2.__deferredEvents__.__onpinned__.set(name2, callback);
          return callback;
        },
        get onpinned() {
          return Chat2.__deferredEvents__.__onpinned__.size;
        },
        set onwhisper(callback) {
          const name2 = callback.name || UUID.from(callback.toString()).value;
          if (Chat2.__deferredEvents__.__onwhisper__.has(name2))
            return Chat2.__deferredEvents__.__onwhisper__.get(name2);
          return Chat2.__deferredEvents__.__onwhisper__.set(name2, callback);
        },
        get onwhisper() {
          return Chat2.__deferredEvents__.__onwhisper__.size;
        },
        set onbullet(callback) {
          const name2 = callback.name || UUID.from(callback.toString()).value;
          if (Chat2.__deferredEvents__.__onbullet__.has(name2))
            return Chat2.__deferredEvents__.__onbullet__.get(name2);
          return Chat2.__deferredEvents__.__onbullet__.set(name2, callback);
        },
        get onbullet() {
          return Chat2.__deferredEvents__.__onbullet__.size;
        },
        set oncommand(callback) {
          const name2 = callback.name || UUID.from(callback.toString()).value;
          if (Chat2.__deferredEvents__.__oncommand__.has(name2))
            return Chat2.__deferredEvents__.__oncommand__.get(name2);
          return Chat2.__deferredEvents__.__oncommand__.set(name2, callback);
        },
        get oncommand() {
          return Chat2.__deferredEvents__.__oncommand__.size;
        }
      }
    },
    __deferredEvents__: { value: { __onmessage__: /* @__PURE__ */ new Map(), __onpinned__: /* @__PURE__ */ new Map(), __onwhisper__: /* @__PURE__ */ new Map(), __onbullet__: /* @__PURE__ */ new Map(), __oncommand__: /* @__PURE__ */ new Map() } },
    // Single-use events... Requires the callback (promise) to return a boolean: true = ok to consume (delete) event; false = not ok
    consume: {
      value: {
        set onmessage(callback) {
          const name2 = callback.name || UUID.from(callback.toString()).value;
          if (Chat2.__consumableEvents__.__onmessage__.has(name2))
            return Chat2.__consumableEvents__.__onmessage__.get(name2);
          Chat2.__consumableEvents__.__onmessage__.set(name2, callback);
          return callback;
        },
        get onmessage() {
          return Chat2.__consumableEvents__.__onmessage__.size;
        },
        set onpinned(callback) {
          const name2 = callback.name || UUID.from(callback.toString()).value;
          if (Chat2.__consumableEvents__.__onpinned__.has(name2))
            return Chat2.__consumableEvents__.__onpinned__.get(name2);
          Chat2.__consumableEvents__.__onpinned__.set(name2, callback);
          return callback;
        },
        get onpinned() {
          return Chat2.__consumableEvents__.__onpinned__.size;
        },
        set onwhisper(callback) {
          const name2 = callback.name || UUID.from(callback.toString()).value;
          if (Chat2.__consumableEvents__.__onwhisper__.has(name2))
            return Chat2.__consumableEvents__.__onwhisper__.get(name2);
          return Chat2.__consumableEvents__.__onwhisper__.set(name2, callback);
        },
        get onwhisper() {
          return Chat2.__consumableEvents__.__onwhisper__.size;
        },
        set onbullet(callback) {
          const name2 = callback.name || UUID.from(callback.toString()).value;
          if (Chat2.__consumableEvents__.__onbullet__.has(name2))
            return Chat2.__consumableEvents__.__onbullet__.get(name2);
          return Chat2.__consumableEvents__.__onbullet__.set(name2, callback);
        },
        get onbullet() {
          return Chat2.__consumableEvents__.__onbullet__.size;
        },
        set oncommand(callback) {
          const name2 = callback.name || UUID.from(callback.toString()).value;
          if (Chat2.__consumableEvents__.__oncommand__.has(name2))
            return Chat2.__consumableEvents__.__oncommand__.get(name2);
          return Chat2.__consumableEvents__.__oncommand__.set(name2, callback);
        },
        get oncommand() {
          return Chat2.__consumableEvents__.__oncommand__.size;
        }
      }
    },
    __consumableEvents__: { value: { __onmessage__: /* @__PURE__ */ new Map(), __onpinned__: /* @__PURE__ */ new Map(), __onwhisper__: /* @__PURE__ */ new Map(), __onbullet__: /* @__PURE__ */ new Map(), __oncommand__: /* @__PURE__ */ new Map() } },
    // Regular events...
    onmessage: {
      set(callback) {
        const name2 = callback.name || UUID.from(callback.toString()).value;
        if (Chat2.__onmessage__.has(name2))
          return Chat2.__onmessage__.get(name2);
        Chat2.__onmessage__.set(name2, callback);
        return callback;
      },
      get() {
        return Chat2.__onmessage__.size;
      }
    },
    __onmessage__: { value: /* @__PURE__ */ new Map() },
    onpinned: {
      set(callback) {
        const name2 = callback.name || UUID.from(callback.toString()).value;
        if (Chat2.__onpinned__.has(name2))
          return Chat2.__onpinned__.get(name2);
        Chat2.__onpinned__.set(name2, callback);
        return callback;
      },
      get() {
        return Chat2.__onpinned__.size;
      }
    },
    __onpinned__: { value: /* @__PURE__ */ new Map() },
    onwhisper: {
      set(callback) {
        const name2 = callback.name || UUID.from(callback.toString()).value;
        if (Chat2.__onwhisper__.has(name2))
          return Chat2.__onwhisper__.get(name2);
        return Chat2.__onwhisper__.set(name2, callback);
      },
      get() {
        return Chat2.__onwhisper__.size;
      }
    },
    __onwhisper__: { value: /* @__PURE__ */ new Map() },
    onbullet: {
      set(callback) {
        const name2 = callback.name || UUID.from(callback.toString()).value;
        if (Chat2.__onbullet__.has(name2))
          return Chat2.__onbullet__.get(name2);
        return Chat2.__onbullet__.set(name2, callback);
      },
      get() {
        return Chat2.__onbullet__.size;
      }
    },
    __onbullet__: { value: /* @__PURE__ */ new Map() },
    oncommand: {
      set(callback) {
        const name2 = callback.name || UUID.from(callback.toString()).value;
        if (Chat2.__oncommand__.has(name2))
          return Chat2.__oncommand__.get(name2);
        return Chat2.__oncommand__.set(name2, callback);
      },
      get() {
        return Chat2.__oncommand__.size;
      }
    },
    __oncommand__: { value: /* @__PURE__ */ new Map() },
    // Everything gathered...
    __allmessages__: { value: /* @__PURE__ */ new Map() },
    __allbullets__: { value: /* @__PURE__ */ new Set() },
    __allemotes__: { value: /* @__PURE__ */ new Map() },
    __allpinned__: { value: /* @__PURE__ */ new Map() },
    messages: {
      get() {
        return Chat2.__allmessages__;
      },
      set(value) {
        return Chat2.__allmessages__;
      }
    },
    bullets: {
      get() {
        return Chat2.__allbullets__;
      },
      set(value) {
        return Chat2.__allbullets__;
      }
    },
    emotes: {
      get() {
        return Chat2.__allemotes__;
      },
      set(value) {
        return Chat2.__allemotes__;
      }
    },
    pinned: {
      get() {
        return Chat2.__allpinned__;
      },
      set(value) {
        return Chat2.__allpinned__;
      }
    },
    // Chat restrictions
    restrictions: {
      set(value) {
      },
      get() {
        var _a3, _b, _c;
        return TTV_IRC.restrictions.get(`#${STREAMER.name.toLowerCase()}`) || (((_c = (_b = (_a3 = $('[class*="chat-restriction"i]')) == null ? void 0 : _a3.parentElement) == null ? void 0 : _b.nextElementSibling) == null ? void 0 : _c.textContent) || "");
      }
    }
  });

  // src/lib/currency.js
  function parseCoin2(amount = "") {
    var _a3;
    function getUnits(lang) {
      let booklet;
      switch (lang == null ? void 0 : lang.toLowerCase()) {
        case "bg":
          {
            booklet = "_ ХИЛ МИЛ";
          }
          break;
        case "cs":
        case "sk":
          {
            booklet = "_ TIS";
          }
          break;
        case "fi":
        case "da":
          {
            booklet = "_ T M";
          }
          break;
        case "el":
          {
            booklet = "_ ΧΙΛ ΕΚΑ";
          }
          break;
        case "hu":
          {
            booklet = "_ E";
          }
          break;
        case "ja":
          {
            booklet = "_ 千 百万";
          }
          break;
        case "ko":
          {
            booklet = "_ 천 백만";
          }
          break;
        case "pl":
          {
            booklet = "_ TYS MIL";
          }
          break;
        case "ru":
          {
            booklet = "_ ТЫС МИЛ";
          }
          break;
        case "sv":
          {
            booklet = "_ TN";
          }
          break;
        case "tr":
          {
            booklet = "_ B";
          }
          break;
        case "vi":
          {
            booklet = "_ N M";
          }
          break;
        case "zh-cn":
          {
            booklet = "_ 千 百万";
          }
          break;
        case "zh-tw":
          {
            booklet = "_ 千 百萬";
          }
          break;
        case "en":
        default:
          {
            booklet = "_ K M B T";
          }
          break;
      }
      let book = {}, index = 0;
      for (const symbol of booklet.split(" "))
        book[symbol] = index++;
      return book;
    }
    __name(getUnits, "getUnits");
    ;
    const units = getUnits(LITERATURE);
    const points = (_a3 = amount == null ? void 0 : amount.toString()) == null ? void 0 : _a3.replace(RegExp(`(\\d{1,3})(${"(?:\\D\\d{1,3})?".repeat(9)})?(?:\\s*(\\D))?`, "i"), ($0, $1, $2 = "0", $3 = "_", $$, $_) => {
      $2 = $2.replace(/\D/g, "");
      return parseFloat([$1, $2].join($2.length > 2 ? "" : ".")) * 1e3 ** units[$3.toUpperCase()];
    });
    return parseInt(points) | 0;
  }
  __name(parseCoin2, "parseCoin");

  // src/lib/player.js
  async function GetQuality2() {
    var _a3, _b, _c, _d, _e, _f, _g, _h;
    const lock = { configurable: false, enumerable: true, writable: false };
    const { videoHeight } = $('[data-a-target="video-player"i] video') ?? { videoHeight: (_b = (_a3 = $('[class*="player"i][class*="controls"i]')) == null ? void 0 : _a3.getElementByText(/\d+p/i)) == null ? void 0 : _b.textContent };
    if ((parseInt(videoHeight) | 0) > 0) {
      const value = parseInt(videoHeight), quality2 = new String(`${value}p`);
      Object.defineProperties(quality2, {
        auto: { value: true, ...lock },
        high: { value: value > 720, ...lock },
        mid: { value: value < 721 && value > 360, ...lock },
        low: { value: value < 361, ...lock },
        source: { value: quality2.toLowerCase().contains("source"), ...lock }
      });
      return quality2;
    }
    const buttons = {
      get settings() {
        return $('[data-a-target*="player"i][data-a-target*="button"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
      },
      get quality() {
        return $('[data-a-target*="player"i][data-a-target*="item"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
      },
      get options() {
        return $.all('[data-a-target*="player"i][data-a-target*="item"i]');
      }
    };
    (_c = buttons.settings) == null ? void 0 : _c.click();
    await when.defined(() => buttons.settings).then(async () => {
      await when.defined(() => buttons.quality).then((button) => button.click());
    }).catch($error);
    const textOf = /* @__PURE__ */ __name((text) => (text == null ? void 0 : text.textContent) ?? (text == null ? void 0 : text.value) ?? text, "textOf");
    const qualities = $.all('[data-a-target*="quality"i]:is([data-a-target*="option"i], [data-a-target*="setting"i]) input[type="radio"i]').map((input) => ({ input, label: input.parentElement.querySelector(`label[for="${input.id}"]`), uuid: input.id })).map((option) => ({ value: textOf(option.label) ?? "Unknown", ...option })).sort((a, b) => parseInt(b.value) - parseInt(a.value));
    let current = qualities.find(({ input }) => input.checked);
    if (nullish(current)) {
      let { videoHeight: videoHeight2 = 0 } = $('[data-a-target="video-player"i] video') ?? {};
      if ((videoHeight2 |= 0) < 1)
        return;
      current = { label: { textContent: `${videoHeight2}p` } };
    }
    const quality = new String(current.label.textContent);
    const source = current.uuid == ((_d = qualities.find(({ value }) => /source/i.test(value))) == null ? void 0 : _d.uuid), auto = current.uuid == ((_e = qualities.find(({ value }) => /auto/i.test(value))) == null ? void 0 : _e.uuid), high = current.uuid == ((_f = qualities.find(({ value }) => /^\d+p/i.test(value))) == null ? void 0 : _f.uuid), low = current.uuid == ((_g = qualities.at(-1)) == null ? void 0 : _g.uuid);
    Object.defineProperties(quality, {
      auto: { value: auto, ...lock },
      high: { value: high, ...lock },
      low: { value: low, ...lock },
      source: { value: source, ...lock }
    });
    (_h = buttons.settings) == null ? void 0 : _h.click();
    return quality;
  }
  __name(GetQuality2, "GetQuality");
  async function SetQuality2(quality = "auto", backup = "source") {
    var _a3, _b, _c, _d, _e, _f;
    const buttons = {
      get settings() {
        return $('[data-a-target*="player"i][data-a-target*="button"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
      },
      get quality() {
        return $('[data-a-target*="player"i][data-a-target*="item"i]:is([data-a-target*="option"i], [data-a-target*="setting"i])');
      },
      get options() {
        return $.all('[data-a-target*="player"i][data-a-target*="item"i]');
      }
    };
    (_a3 = buttons.settings) == null ? void 0 : _a3.click();
    await when.defined(() => buttons.settings).then(async () => {
      await when.defined(() => buttons.quality).then((button) => button.click());
    }).catch($error);
    const textOf = /* @__PURE__ */ __name((text) => (text == null ? void 0 : text.textContent) ?? (text == null ? void 0 : text.value) ?? text, "textOf");
    const qualities = $.all('[data-a-target*="quality"i]:is([data-a-target*="option"i], [data-a-target*="setting"i]) input[type="radio"i]').map((input) => ({ input, label: input.parentElement.querySelector(`label[for="${input.id}"]`), uuid: input.id })).map((option) => ({ value: textOf(option.label) ?? "Unknown", ...option })).sort((a, b) => parseInt(b.value) - parseInt(a.value));
    qualities.source = qualities.find(({ value }) => /source/i.test(value));
    qualities.auto = qualities.find(({ value }) => /auto/i.test(value));
    qualities.high = qualities.find(({ value }) => /^\d+p/i.test(value));
    qualities.low = qualities.at(-1);
    let current = qualities.find(({ input }) => input.checked), desired;
    if (/(auto|high|low|source)/i.test(quality))
      desired = qualities[RegExp.$1];
    else
      desired = qualities.find(({ label }) => textOf(label).contains(quality.toLowerCase())) ?? null;
    if (nullish(desired))
      desired = qualities.auto;
    else if ((current == null ? void 0 : current.uuid) === (desired == null ? void 0 : desired.uuid))
      ;
    else if (defined((_b = current == null ? void 0 : current.input) == null ? void 0 : _b.checked) && defined((_c = desired == null ? void 0 : desired.input) == null ? void 0 : _c.checked))
      desired.input.checked = !(current.input.checked = false);
    (_e = (_d = desired == null ? void 0 : desired.input) == null ? void 0 : _d.click) == null ? void 0 : _e.call(_d);
    (_f = buttons.settings) == null ? void 0 : _f.click();
    return new Promise((resolve, reject) => {
      const checker = setInterval(() => {
        const video = $.all("video").pop(), computed = ((video == null ? void 0 : video.videoHeight) | 0) + "p";
        if (desired !== computed) {
          clearInterval(checker);
          resolve({ oldValue: current, newValue: desired ?? computed });
        }
      }, 250);
    });
  }
  __name(SetQuality2, "SetQuality");
  function GetVolume2(fromVideoElement = true) {
    const video = $('[data-a-target="video-player"i] video'), slider = $('[data-a-target*="player"i][data-a-target*="volume"i]');
    return parseFloat(fromVideoElement ? video == null ? void 0 : video.volume : slider == null ? void 0 : slider.value);
  }
  __name(GetVolume2, "GetVolume");
  Object.defineProperties(GetVolume2, {
    onchange: {
      set(callback) {
        const name2 = callback.name || UUID.from(callback.toString()).value;
        if (GetVolume2.__onchange__.has(name2))
          return GetVolume2.__onchange__.get(name2);
        return GetVolume2.__onchange__.set(name2, callback);
      },
      get() {
        return GetVolume2.__onchange__.size;
      }
    },
    __onchange__: { value: /* @__PURE__ */ new Map() }
  });
  function SetVolume2(volume = 0.5) {
    var _a3;
    const video = $('[data-a-target="video-player"i] video'), thumb = $('[data-a-target*="player"i][data-a-target*="volume"i]'), slider = $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls + * [style]');
    volume = parseFloat(((_a3 = volume == null ? void 0 : volume.toFixed) == null ? void 0 : _a3.call(volume, 2)) || 1);
    if (defined(video))
      video.volume = volume;
    if (defined(thumb))
      thumb.value = volume;
    if (defined(slider))
      slider.modStyle(`width: ${100 * volume}%`);
  }
  __name(SetVolume2, "SetVolume");
  function GetViewMode2() {
    var _a3;
    let mode = "default", theatre = false, overview = false, fullwidth = false;
    if (theatre ||= /theatre/i.test([...$(`[data-test-selector*="video-container"i]`).classList].join(" ")))
      mode = "theatre";
    if (overview ||= $.defined(`.home`))
      mode = "overview";
    if (fullwidth ||= $.defined(`[data-a-target*="right-column"i][data-a-target*="chat-bar"i][data-a-target*="collapsed"i] button[data-a-target*="collapse"i]`))
      mode = "fullwidth";
    const container = (_a3 = $(`button[data-a-target*="fullscreen"i]`)) == null ? void 0 : _a3.closest("div");
    if (nullish(container))
      return mode;
    const classes = ["", ...container.classList].join(".");
    if (theatre && fullwidth && !overview || $.all(classes, container.parentElement).length <= 3)
      mode = "fullscreen";
    return mode;
  }
  __name(GetViewMode2, "GetViewMode");
  function SetViewMode2(mode = "default") {
    var _a3;
    const buttons = [], toggles = {
      overview: {
        off: `[class*="root"i][class*="home"i] [href]`,
        on: `[class*="root"i][class*="chat"i] [href]`
      },
      theatre: {
        off: `[data-test-selector*="video-container"i]:not([class*="theatre"i]) button[data-a-target*="theatre-mode"i], [tt-svg-label="theatre-mode-off"i]`,
        on: `[data-test-selector*="video-container"i][class*="theatre"i] button[data-a-target*="theatre-mode"i], [tt-svg-label="theatre-mode-on"i]`
      },
      chat: {
        off: `[data-a-target*="right-column"i][data-a-target*="chat-bar"i]:not([data-a-target*="collapsed"i]) button[data-a-target*="collapse"i]`,
        on: `[data-a-target*="right-column"i][data-a-target*="chat-bar"i][data-a-target*="collapsed"i] button[data-a-target*="collapse"i]`
      }
    };
    switch (mode) {
      case "fullscreen":
        {
          buttons.push(toggles.theatre.off, toggles.chat.off);
        }
        break;
      case "fullwidth":
        {
          buttons.push(toggles.theatre.on, toggles.chat.off);
        }
        break;
      case "overview":
        {
          buttons.push(toggles.overview.on);
        }
        break;
      case "theatre":
        {
          buttons.push(toggles.theatre.off, toggles.chat.on);
        }
        break;
      case "default":
        {
          buttons.push(toggles.theatre.on, toggles.chat.on);
        }
        break;
    }
    for (let button of buttons) {
      button = $(button);
      if (nullish(button))
        continue;
      (_a3 = button.closest("button")) == null ? void 0 : _a3.click();
    }
  }
  __name(SetViewMode2, "SetViewMode");

  // src/lib/page.js
  async function GetActivity() {
    return when.defined(() => {
      var _a3, _b;
      const open2 = $.defined('[data-a-target="user-display-name"i], [class*="dropdown-menu-header"i]');
      if (open2) {
        ACTIVITY = window.ACTIVITY = (_a3 = $('[data-a-target="presence-text"i]')) == null ? void 0 : _a3.textContent;
      } else {
        UserMenuToggleButton == null ? void 0 : UserMenuToggleButton.click();
        ACTIVITY = window.ACTIVITY = (_b = $('[data-a-target="presence-text"i]')) == null ? void 0 : _b.textContent;
        UserMenuToggleButton == null ? void 0 : UserMenuToggleButton.click();
      }
      return ACTIVITY;
    });
  }
  __name(GetActivity, "GetActivity");
  async function GetLanguage() {
    return when.defined(() => {
      var _a3, _b, _c, _d, _e, _f, _g;
      const open2 = $.defined('[data-a-target="user-display-name"i], [class*="dropdown-menu-header"i]');
      if (open2) {
        LITERATURE = window.LITERATURE = (_c = (_b = (_a3 = $("[data-language] svg")) == null ? void 0 : _a3.closest("button")) == null ? void 0 : _b.dataset) == null ? void 0 : _c.language;
      } else {
        UserMenuToggleButton == null ? void 0 : UserMenuToggleButton.click();
        (_d = $('[data-a-target^="language"i]')) == null ? void 0 : _d.click();
        LITERATURE = window.LITERATURE = (_g = (_f = (_e = $("[data-language] svg")) == null ? void 0 : _e.closest("button")) == null ? void 0 : _f.dataset) == null ? void 0 : _g.language;
        UserMenuToggleButton == null ? void 0 : UserMenuToggleButton.click();
      }
      return LITERATURE;
    });
  }
  __name(GetLanguage, "GetLanguage");
  async function ReloadPage2(onlineOnly = true) {
    var _a3, _b, _c;
    if (onlineOnly && (((_b = (_a3 = navigator.connection) == null ? void 0 : _a3.type) == null ? void 0 : _b.equals("none")) || navigator.onLine === false))
      return;
    if (document.visibilityState == "hidden") {
      if (!ReloadPage2.deferred) {
        ReloadPage2.deferred = true;
        document.addEventListener("visibilitychange", () => {
          ReloadPage2.deferred = false;
          ReloadPage2(onlineOnly);
        }, { once: true });
      }
      return;
    }
    await ((_c = top.beforeleaving) == null ? void 0 : _c.call(top, new CustomEvent("locationchange", { from: location.pathname, to: location.pathname, persisted: document.readyState.unlike("unloading") })));
    location.reload();
  }
  __name(ReloadPage2, "ReloadPage");

  // src/lib/tags.js
  function scoreTagActivity(...tags) {
    let score = 0;
    try {
      tags = tags.map((tag) => decodeURIComponent(tag.split(/\//).pop().toUpperCase()));
    } catch (error) {
      return;
    }
    scoring:
      for (const tag of tags)
        switch (tag) {
          case "ACTION":
          case "4D1EAA36-F750-4862-B7E9-D0A13970D535":
          // Action
          case "ADVENTURE":
          case "80427D95-BB46-42D3-BF4D-408E9BDCA49A":
          // Adventure
          case "FPS":
          case "A69F7FFB-DDDA-4C05-8D7D-F0B24975A2C3":
          // FPS
          case "PINBALL":
          case "9386024F-DB7E-4E4F-B8DF-A73E354C5BC2":
          // Pinball
          case "PLATFORMER":
          case "5D289CF9-D75A-42B5-A635-0D117609E6A6":
          // Platformer
          case "SHOOT":
          case "E607B115-8FA1-49C1-ACDF-F6927BE4CA1B":
          // Shoot
          case "SHOOTER":
          case "523FE736-FA95-44C7-B22F-13008CA2172C":
          // Shooter
          case "SPORTS":
          case "0D4233AF-7AC6-49DA-937D-E0F42B7DB187":
          // Sports
          case "WRESTLING":
          case "7199189A-0569-4854-908E-08E6C3667379": {
            score += 20;
            continue scoring;
          }
          case "4X":
          case "7304B834-D065-47D5-9865-C19CD17D2639":
          // 4X
          case "BMX":
          case "E62CB1D5-A47D-4690-A373-FE4C0856F78B":
          // BMX
          case "COSPLAY":
          case "2FFD5C3E-B927-4749-BA53-79D3B626B2DA":
          // Cosplay
          case "DRAG":
          case "011F7C20-F533-4AD1-8093-8C6F8F75BC4C":
          // Drag
          case "DRIVING":
          case "F5ED5BD0-78CB-4467-8E13-9172A210B64D":
          // Driving
          case "E3":
          case "D27DA25E-1EE2-4207-BB11-DD8D54FA29EC":
          // E3
          case "ESPORTS":
          case "36A89A80-4FCD-4B74-B3D2-2C6FD9B30C95":
          // Esports
          case "FASHION":
          case "246D6E4B-B9C6-442B-9573-77028839F194":
          // Fashion
          case "FIGHTING":
          case "9751EE1D-0E5A-4FD3-8E9F-BC3C5D3230F0":
          // Fighting
          case "GAME":
          case "068C541B-DC07-4D7F-A689-5578F90905A9":
          // Game
          case "IRL":
          case "2610CFF9-10AE-4CB3-8500-778E6722FBB5":
          // IRL
          case "MMO":
          case "643FE658-C4FC-45F0-9AED-CBE54A7C1D10":
          // MMO
          case "MOBA":
          case "12510423-D1F6-4992-8AEA-1441A43D1DF4":
          // MOBA
          case "PARTY":
          case "B1E92364-CBDA-4033-92FC-E01094C1753F":
          // Party
          case "PVP":
          case "8486F56B-8677-44F7-8004-000295391524":
          // PvP
          case "POINT":
          case "0C99BF18-5A92-4257-8974-D7A60088D1E8":
          // Point
          case "RHYTHM":
          case "C8BB9D08-8202-42F8-B028-C59AC1AAFE76":
          // Rhythm
          case "ROGUELIKE":
          case "CAD488FB-C95C-4BE1-B197-5B851D3A12FA":
          // Roguelike
          case "VR":
          case "CA470745-C1DF-4C11-9474-9AB79DFC1863":
          // VR
          case "VTUBER":
          case "52D7E4CC-633D-46F5-818C-BB59102D9549": {
            score += 15;
            continue scoring;
          }
          case "100%":
          case "E659959D-392F-44C5-83A5-FB959CDBACCC":
          // 100%
          case "12":
          case "A31DAEB5-EDC2-4B29-AFA1-84C96612836D":
          // 12
          case "ACHIEVEMENT":
          case "27937CEC-5CFC-4F56-B1D3-F6E1D67735E2":
          // Achievement
          case "ANIME":
          case "6606E54C-F92D-40F6-8257-74977889CCDD":
          // Anime
          case "ARCADE":
          case "7FF66192-68EF-4B69-8906-24736BF66ED0":
          // Arcade
          case "ATHLETICS":
          case "72340836-353F-49BF-B9BE-1AAC4F658AFE":
          // Athletics
          case "AUTOBATTLER":
          case "CD2EE226-342B-4E6B-90D5-C14687006B04":
          // Autobattler
          case "AUTOMOTIVE":
          case "1400CA9C-84EA-414E-A85B-076A70D38ECF":
          // Automotive
          case "BAKING":
          case "31866A92-269D-4DF3-A2FB-58081BF97378":
          // Baking
          case "BRICKBUILDING":
          case "F1E3759C-35B3-4858-A50F-8F9CAFC2660F":
          // Brickbuilding
          case "CREATIVE":
          case "E36D0169-268A-4C62-A4F4-DDF61A0B3AE4":
          // Creative
          case "FARMING":
          case "3FFBEC21-97A2-43F9-BD73-4506A1B4D62C":
          // Farming
          case "FLIGHT":
          case "10D820BB-A0A9-40DF-B0D3-FE32B45419EE":
          // Flight
          case "GAME SHOW":
          case "6A0C6EA2-84EB-42B1-A8BB-59FD684BFE1A":
          // Game Show
          case "HORROR":
          case "CF0F97AD-EFB8-4494-83EC-6A11CA30261B":
          // Horror
          case "MOBILE":
          case "6E23D976-33EC-47E8-B22B-3727ACD41862":
          // Mobile
          case "MYSTERY":
          case "6540ED8D-3282-44DF-A592-887B37881846":
          // Mystery
          case "RPG":
          case "9D38085E-EE62-4203-877B-81797052A18B":
          // RPG
          case "RTS":
          case "3E30C47A-26C0-4DD3-9C3A-9CD6AD35589C":
          // RTS
          case "SURVIVAL":
          case "AE7D0652-8B2E-476B-8B51-A076550B234F": {
            score += 10;
            continue scoring;
          }
          case "ANIMALS":
          case "3DC8F084-D886-4264-B20F-8BD5F90562B5":
          // Animals
          case "ANIMATION":
          case "E3A6B378-232B-4EC2-9A82-86B72851E09A":
          // Animation
          case "ART":
          case "DF448DA8-7082-45B2-92AD-C624DBA6551F":
          // Art
          case "CARD":
          case "8D39B307-D3AD-4F4A-98A4-D1951F55CEB7":
          // Card
          case "DJ":
          case "D81D54C8-D705-4DF6-AAF0-01D715C1DBCC":
          // DJ
          case "DRONES":
          case "AA971BDC-A28D-4A33-A686-F112C764E73B":
          // Drones
          case "FANTASY":
          case "CB00CFE5-AE4E-4E4F-A8F1-8FA6DDEC6361":
          // Fantasy
          case "GAMBLING":
          case "71265475-E0B0-411E-A0CF-B93C33848B2B":
          // Gambling
          case "HYPE":
          case "C2839AF5-F1D2-46C4-8EDC-1D0BFBD85070":
          // Hype
          case "INDIE":
          case "D72D9DE6-1DF8-4C4E-B6A2-74E6F4C80557":
          // Indie
          case "METROIDVANIA":
          case "537F5D21-9CA0-4632-84F3-9A29A761D66D":
          // Metroidvania
          case "OPEN":
          case "A682F560-5186-4871-B97A-8D8E3F4308E9":
          // Open
          case "PUZZLE":
          case "7616F6EA-7E3D-4501-A87C-C160D2BC1849":
          // Puzzle
          case "SIMULATION":
          case "22E434B6-CA88-46E8-91EF-C18EE1CB8A67":
          // Simulation
          case "STEALTH":
          case "0472BAB0-E068-49B3-9BB8-789FDFE3C66A":
          // Stealth
          case "UNBOXING":
          case "CD9ED640-426D-4A08-B8E0-417A61197264": {
            score += 5;
            continue scoring;
          }
          default: {
            ++score;
            continue scoring;
          }
        }
    ;
    return score;
  }
  __name(scoreTagActivity, "scoreTagActivity");

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
    var _a3, _b;
    const feature = PLUGINS.get(id);
    if (!feature)
      throw new Error(`No plugin "${id}"`);
    feature.started = true;
    if (feature.install)
      return await feature.install(context);
    const { job } = feature;
    await ((_a3 = feature.init) == null ? void 0 : _a3.call(feature, context));
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

  // src/plugins/automation/auto-join.js
  var IGNORE_ZOOM_STATE = false;
  plugin({
    id: "auto_accept_mature",
    timer: 5e3,
    /**
     * Automatically clicks buttons to bypass mature content, class, or watchparty overlays.
     */
    handler() {
      var _a3;
      (_a3 = $([
        '[data-a-target*="mature"i]:is([data-a-target*="overlay"i], [data-a-target*="accept"i]) button',
        '[data-a-target*="class"i]:is([data-a-target*="overlay"i], [data-a-target*="accept"i]) button',
        '[data-a-target*="watchparty"i] button',
        IGNORE_ZOOM_STATE ? "" : '.home:not([user-intended="true"i]) [data-a-target^="home"i]'
      ].filter((s) => s.length).join(","))) == null ? void 0 : _a3.click();
    },
    /**
     * Setup: Sets up listeners to mark home page visits as user-intended when clicking channel links.
     */
    setup() {
      $.all(`[class*="info"i] [href$="${STREAMER.name}"i] [class*="title"i], main [href$="${STREAMER.name}"i]`).map((element) => {
        element.closest("div[class]").addEventListener("mousedown", async ({ isTrusted, button = -1 }) => {
          var _a3, _b;
          !button && ((_b = (_a3 = await when.defined(() => $(".home"))) == null ? void 0 : _a3.setAttribute) == null ? void 0 : _b.call(_a3, "user-intended", IGNORE_ZOOM_STATE = isTrusted));
        });
      });
    }
  });

  // src/plugins/automation/kill-extensions.js
  var EXTENSION_VIEWS = '[class*="extension"i]:is([class*="view"i], [class*="popover"i])';
  plugin({
    id: "kill_extensions",
    timer: 2500,
    /**
     * Hides all Twitch extension views from the page.
     * @param {Object} params - Execution context
     * @param {StopWatch} params.StopWatch - Timer for performance tracking
     */
    handler({ StopWatch }) {
      new StopWatch("kill_extensions");
      for (const view of $.all(EXTENSION_VIEWS))
        view.modStyle("display:none!important");
      StopWatch.stop("kill_extensions");
    },
    // Un-hide the same views the handler hid (it used to look for `[class^="extension-view"i]` only)
    /**
     * Undoes kill-extensions: Restores visibility to extension views by removing style overrides.
     */
    unhandler() {
      for (const view of $.all(EXTENSION_VIEWS))
        view.removeAttribute("style");
    },
    /**
     * Setup: Logs the initialization of the extension killer.
     */
    setup() {
      $remark("Adding extension killer...");
    }
  });

  // src/plugins/automation/view-mode.js
  plugin({
    id: "view_mode",
    timer: -2500,
    /**
     * Sets the Twitch player view mode based on the provided mode or the default setting.
     * @param {*} context - Execution context
     * @param {string} [mode=Settings.view_mode] - The view mode to apply
     */
    handler(context, mode = Settings.view_mode) {
      SetViewMode(mode);
    }
  });

  // src/plugins/automation/claim-loot.js
  plugin({
    id: "claim_loot",
    timer: -1e3,
    /**
     * Automatically identifies and claims available Prime Gaming loot offers.
     */
    handler: /* @__PURE__ */ __name(() => {
      when.defined(() => $(".prime-offers button")).then((prime_btn) => {
        let handled = 0;
        prime_btn.click();
        when.sated(() => $.all('[class*="prime"i][class*="offer"i][class*="header"i] ~ *'), 750).then((offerContainers) => {
          for (const container of offerContainers)
            when((container2) => {
              var _a3, _b, _c, _d, _e, _f, _g, _h, _i;
              const offerClaimLink = $('[data-a-target*="prime"i][data-a-target*="claim"i]', container2);
              const offerClaimButton = $('button[data-a-target*="prime-claim"i]', container2);
              const offerDismissButton = $('[class*="prime-offer"i][class*="dismiss"i] button', container2);
              if (nullish(offerClaimLink ?? offerClaimButton ?? offerDismissButton))
                return false;
              const gameTitle = (_b = (_a3 = $('[data-a-target*="prime-offer"i][data-a-target*="game"i][data-a-target*="title"i]', container2)) == null ? void 0 : _a3.innerText) == null ? void 0 : _b.trim();
              const offerTitle = (_d = (_c = $('[data-a-target*="prime-offer"i][data-a-target*="title"i]:not([data-a-target*="game"i])', container2)) == null ? void 0 : _c.innerText) == null ? void 0 : _d.trim();
              const offerImage = (_e = $("img", container2)) == null ? void 0 : _e.src;
              const offerDescription = (_g = (_f = $('[class*="prime-offer"i][class*="description"i]', container2)) == null ? void 0 : _f.innerText) == null ? void 0 : _g.trim();
              const offerPublisher = (_i = (_h = $('[class*="prime-offer"i][class*="publisher"i]', container2)) == null ? void 0 : _h.innerText) == null ? void 0 : _i.trim();
              $notice(`Claiming Prime Loot Offer:`, { title: offerTitle, game: gameTitle, description: offerDescription, publisher: offerPublisher, type: offerClaimButton ? "BUTTON_CLAIM" : "LINK_CLAIM" });
              if (defined(offerClaimButton))
                offerClaimButton.click();
              else if (defined(offerClaimLink))
                offerDismissButton == null ? void 0 : offerDismissButton.click();
              ++handled;
              return true;
            }, 1e3, container).then(() => {
              if (handled >= offerContainers.length)
                prime_btn.click();
            });
        });
        when.defined(() => $('[class*="prime"i][class*="empty"i]')).then(() => prime_btn.click());
      });
    }, "handler"),
    /**
     * Checks if the Prime loot claiming feature is enabled in settings and allowed for the current tab.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.claim_loot);
    },
    /**
     * Initializes the Prime loot claiming feature and logs a status remark.
     */
    setup() {
      $remark("Claiming Prime Gaming Loot...");
    }
  });

  // src/plugins/automation/claim-prime.js
  plugin({
    id: "claim_prime",
    timer: -5e3,
    /**
     * Automatically renews the Prime subscription for the current streamer based on cached settings and claim limits.
     */
    handler: /* @__PURE__ */ __name(() => {
      Cache.load(["PrimeSubscription", "PrimeSubscriptionReclaims"], ({ PrimeSubscription, PrimeSubscriptionReclaims }) => {
        PrimeSubscription ??= "";
        PrimeSubscriptionReclaims ??= 0;
        if (PrimeSubscription.length < 1 && STREAMER.main)
          Cache.save({ PrimeSubscription: PrimeSubscription = STREAMER.sole.toString(36).toUpperCase(), PrimeSubscriptionReclaims: PrimeSubscriptionReclaims = parseInt(Settings.claim_prime__max_claims) });
        resubscribing:
          if (PrimeSubscription.equals(STREAMER.sole.toString(36))) {
            if (PrimeSubscriptionReclaims < 3)
              confirm.timed(`Please review your settings. TTV Tools ${["was", "is"][+!!PrimeSubscriptionReclaims]} still reclaiming your <strong>Prime Subscription</strong> for this channel!`).then((answer) => {
                if (answer)
                  postMessage({ action: "open-options-page" });
                else if (answer === false)
                  Cache.save({ PrimeSubscription: "", PrimeSubscriptionReclaims: 0 });
              });
            if (PrimeSubscriptionReclaims < 1)
              break resubscribing;
            const button = $('[data-a-target="subscribe-button"i]');
            if (nullish(button))
              break resubscribing;
            button.click();
            when.defined(() => $('.channel-root .support-panel input[type="checkbox"i]:not(:checked)')).then((input) => {
              var _a3;
              input.checked = true;
              (_a3 = input.closest(".support-panel").querySelector("button:only-child")) == null ? void 0 : _a3.click();
              when(() => STREAMER.main).then(() => {
                Cache.save({ PrimeSubscriptionReclaims: --PrimeSubscriptionReclaims });
                $warn(`[Prime Subscription] just renewed your subscription to ${STREAMER.name} @ ${(/* @__PURE__ */ new Date()).toJSON()}`).toNativeStack();
              });
            });
          }
      });
    }, "handler"),
    /**
     * Checks if the Prime subscription claiming feature is enabled in settings and allowed for the current tab.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.claim_prime);
    },
    /**
     * Initializes the Prime subscription claiming feature and logs a status remark.
     */
    setup() {
      $remark("Claiming Prime Subscription...");
    }
  });

  // src/plugins/automation/claim-drops.js
  var TTV_DROPS_FRAME;
  var TTV_DROPS_CHECKER;
  var TTV_DROPS_REFRESHER;
  var TTV_DROPS_CLAIMED;
  plugin({
    id: "claim_drops",
    timer: -5e3,
    /**
     * Initializes state for the drops claimer, resetting frames and trackers.
     */
    init() {
      TTV_DROPS_FRAME = void 0;
      TTV_DROPS_CHECKER = void 0;
      TTV_DROPS_REFRESHER = void 0;
      TTV_DROPS_CLAIMED = /* @__PURE__ */ new Set();
    },
    /**
     * Sets up the drops claiming process by creating a hidden inventory iframe and scheduling periodic checks to claim available drops.
     */
    handler: /* @__PURE__ */ __name(() => {
      TTV_DROPS_FRAME = furnish('iframe#tt-drops-claimer[src="/drops/inventory"]', { style: "display:none!important" });
      $.body.append(TTV_DROPS_FRAME);
      (TTV_DROPS_CHECKER = /* @__PURE__ */ __name((btn_str, svg_str) => {
        when(() => $.defined(btn_str, TTV_DROPS_FRAME.contentDocument)).then(() => {
          var _a3;
          let claimed = 0;
          const dia_str = '[role*="dialog"i] [class*="combo"i] ~ * button';
          $.all(btn_str, TTV_DROPS_FRAME.contentDocument).map((btn) => {
            if ($.nullish(svg_str, btn))
              return;
            if (TTV_DROPS_CLAIMED.has(getDOMPath(btn, getDOMPath.ANCHORED)))
              return;
            TTV_DROPS_CLAIMED.add(getDOMPath(btn, getDOMPath.ANCHORED));
            ++claimed;
            btn.click();
          });
          const error = ((_a3 = $(".tw-alert-banner", TTV_DROPS_FRAME.contentDocument)) == null ? void 0 : _a3.innerText) ?? "";
          if (claimed > 0) {
            claimed = [claimed, "drop".pluralSuffix(claimed)].join(" ");
            if (error.length > 0)
              alert.timed(`An error occurred while trying to claim ${claimed}`, 7e3);
            else
              alert.timed(`Claiming ${claimed}!`, 7e3);
          }
        }).then(() => TTV_DROPS_CHECKER(btn_str, svg_str));
      }, "TTV_DROPS_CHECKER"))('.tw-tower *:not([class*="tooltip"i]) > button:not([class*="image"i]):not([disabled], [aria-label*="refresh"i])', 'path:is([clip-rule~="evenodd"i], [fill-rule~="evenodd"i])');
      TTV_DROPS_REFRESHER = setInterval(() => {
        TTV_DROPS_FRAME.src = parseURL(TTV_DROPS_FRAME.src).addSearch({ contentReload: Date.now() }).href;
      }, parseInt(Settings.claim_drops__interval ?? 10) * 6e4);
    }, "handler"),
    /**
     * Undoes the drops claimer setup by removing the inventory iframe and clearing the refresh interval.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      TTV_DROPS_FRAME == null ? void 0 : TTV_DROPS_FRAME.remove();
      clearInterval(TTV_DROPS_REFRESHER);
    }, "unhandler"),
    /**
     * Checks if the drops claimer is enabled in settings and permitted for the current tab.
     * @returns {boolean} True if the feature should be active
     */
    enabled() {
      return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.claim_drops);
    },
    /**
     * Logs a message indicating the Drop claimer is being created.
     */
    setup() {
      $remark("Creating Drop claimer...");
    }
  });

  // src/plugins/automation/first-in-line-plus.js
  plugin({
    id: "first_in_line_plus",
    /**
     * Installs the "First in Line Plus" logic to track live followed streamers and ensure the side navigation is correctly loaded.
     * @param {Object} options - Installation options
     * @param {StopWatch} options.StopWatch - StopWatch utility for performance tracking
     */
    async install({ StopWatch }) {
      let OLD_STREAMERS, NEW_STREAMERS, BAD_STREAMERS, ON_INSTALLED_REASON;
      await Cache.load(["OLD_STREAMERS", "BAD_STREAMERS"], (cache) => {
        OLD_STREAMERS = cache.OLD_STREAMERS ?? "";
        BAD_STREAMERS = cache.BAD_STREAMERS ?? "";
      });
      Handlers.first_in_line_plus = async () => {
        var _a3, _b, _c, _d;
        new StopWatch("first_in_line_plus");
        const streamers = [...STREAMERS, STREAMER].filter(isLive).map((streamer) => streamer.name).isolate().sort();
        NEW_STREAMERS = streamers.join(",").toLowerCase();
        if (nullish(OLD_STREAMERS))
          OLD_STREAMERS = NEW_STREAMERS;
        let old_names = OLD_STREAMERS.split(",").filter(defined), new_names = NEW_STREAMERS.split(",").filter(defined), bad_names = (_b = (_a3 = BAD_STREAMERS == null ? void 0 : BAD_STREAMERS.split(",")) == null ? void 0 : _a3.filter(defined)) == null ? void 0 : _b.filter(parseBool);
        if (bad_names == null ? void 0 : bad_names.length) {
          $warn("Twitch failed to add these channels correctly:", bad_names);
          BAD_STREAMERS = "";
          Cache.save({ BAD_STREAMERS });
        } else if ($.nullish('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a[class*="side-nav-card"i]') && !/^User_Not_Logged_In_\d+$/.test(USERNAME)) {
          wait(3e3).then(() => {
            if (SideNav.open)
              SideNav.set(false).then(() => wait(1e3)).then(() => SideNav.set(true));
            if ($.nullish('[id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] a[class*="side-nav-card"i]'))
              return;
            $warn("[Followed Channels] is missing. Reloading...");
            Cache.save({ BAD_STREAMERS: OLD_STREAMERS });
            addReport({ "TTV-Tools-failed-to-get-channel-details": (/* @__PURE__ */ new Date()).toString() }, true);
          });
          return;
        }
        if (OLD_STREAMERS == NEW_STREAMERS)
          return StopWatch.stop("first_in_line_plus"), Cache.save({ OLD_STREAMERS });
        new_names = new_names.filter((name2) => old_names.missing(name2)).filter((name2) => bad_names.missing(name2));
        if (new_names.length < 1)
          return StopWatch.stop("first_in_line_plus"), Cache.save({ OLD_STREAMERS });
        installation_viewer:
          switch (ON_INSTALLED_REASON ||= Settings.onInstalledReason) {
            case CHROME_UPDATE:
            case SHARED_MODULE_UPDATE:
              {
              }
              break;
            case INSTALL:
              {
                new_names = [];
              }
              break;
            case UPDATE:
            default:
              {
              }
              break;
          }
        creating_new_events:
          for (const name2 of new_names) {
            const streamer = STREAMERS.find((streamer2) => RegExp(name2, "i").test(streamer2.name)), { searchParameters } = parseURL(location.href);
            if (nullish(streamer) || ((_c = searchParameters.obit) == null ? void 0 : _c.equals(streamer.name)) || !(name2 == null ? void 0 : name2.length))
              continue creating_new_events;
            const { href } = streamer;
            if (!((_d = streamer == null ? void 0 : streamer.name) == null ? void 0 : _d.length))
              continue creating_new_events;
            $log("A channel just appeared:", name2, /* @__PURE__ */ new Date());
            Handlers.first_in_line({ href, innerText: `${name2} is live [First in Line+]` });
          }
        OLD_STREAMERS = NEW_STREAMERS;
        Cache.save({ OLD_STREAMERS });
        StopWatch.stop("first_in_line_plus");
      };
      Timers.first_in_line_plus = 1e3;
      Unhandlers.first_in_line_plus = Unhandlers.first_in_line;
      __FirstInLinePlus__:
        if (parseBool(Settings.first_in_line_plus) || parseBool(Settings.first_in_line_all)) {
          RegisterJob("first_in_line_plus");
        }
    }
  });

  // src/plugins/customization/store-integration.js
  plugin({
    id: "game_overview_card",
    timer: 5e3,
    /**
     * Plugin hook: Updates or creates a game overview card by fetching and displaying metadata for the current streamer's game.
     */
    handler: /* @__PURE__ */ __name(() => {
      var _a3, _b, _c;
      const existing = $("#game-overview-card");
      if ((_b = (_a3 = existing == null ? void 0 : existing.dataset) == null ? void 0 : _a3.game) == null ? void 0 : _b.equals(STREAMER.game))
        return;
      existing == null ? void 0 : existing.remove();
      const { href = "", origin, protocol, scheme, host, hostname, domainPath = [], port, pathname, search, hash } = parseURL(STREAMER.game.href);
      if (href.trim().length < 4 || domainPath.length < 2)
        return;
      const timerStart = +/* @__PURE__ */ new Date();
      const MATURE_HINTS = ["ADULT", "MATUR", "NSFW", ...16 .to(99)], RATING_STYLING = `max-height:10rem; max-width:6rem; position:absolute; left:50%; bottom:-9rem; transform:translate(-50%);`;
      fetchURL.fromDisk(href, { hoursUntilEntryExpires: 8, keepDefectiveEntry: true }).then((response) => response.text()).then(DOMParser.stripBody).then((html) => new DOMParser().parseFromString(html, "text/html")).catch($warn).then((DOM) => {
        var _a4, _b2, _c2;
        if (!(DOM instanceof Document))
          throw TypeError(`No DOM available. Page not loaded`);
        const f = furnish;
        const get2 = /* @__PURE__ */ __name((property) => DOM.get(property), "get");
        let [title, description, image] = ["title", "description", "image"].map(get2), error = (_a4 = DOM.querySelector("parsererror")) == null ? void 0 : _a4.textContent;
        const ok = $.defined('meta[property="og:image"i]');
        if (!ok)
          throw `No metadata available for "${STREAMER.game}"`;
        $log(`Loaded page: Game @ ${href}`, { title, description, image, DOM, size: (DOM.documentElement.innerHTML.length * 8).suffix("B", 2, "data"), time: ((+/* @__PURE__ */ new Date() - timerStart) / 1e3).suffix("s", false) });
        if (!(title == null ? void 0 : title.length) || !(image == null ? void 0 : image.length)) {
          if (!(error == null ? void 0 : error.length))
            return;
          else
            throw error;
        }
        title = title.replace(/[\s\-]*twitch\s*$/i, "").replace(/^\s*$/, STREAMER.game);
        const card = f(".tt-iframe-card.tt-border-radius-medium.tt-elevation-1").with(
          f(".tt-border-radius-medium.tt-c-background-base.tt-flex.tt-full-width").with(
            f(
              ".tt-block.tt-border-radius-medium.tt-full-width.tt-interactable",
              { style: "color:inherit; text-decoration:none; min-height:12rem; height:fit-content" },
              f(
                ".chat-card.tt-flex.tt-flex-nowrap.tt-pd-05",
                {
                  style: "min-height:30rem"
                },
                // Preview image
                f(
                  ".chat-card__preview-img.tt-align-items-center.tt-c-background-alt-2.tt-flex.tt-flex-shrink-0.tt-justify-content-center",
                  {
                    style: "background-color:#0000!important;height:4.5rem;width:15rem"
                  },
                  f(".tt-card-image").with(
                    f(
                      ".tt-aspect",
                      { style: "transform:translate(0,40%)" },
                      f("img.tt-image.game-card-img", {
                        alt: title,
                        src: image.replace(/^(?!(?:https?:)?\/\/[^\/]+)\/?/i, `${top.location.protocol}//${host}/`),
                        style: "height:15rem; object-fit:cover",
                        ok: /\/ttv-boxart\//i.test(image)
                      }),
                      f("img#tt-content-rating-placeholder", { src: `//image.api.playstation.com/grc/images/ratings/hd/esrb/rp.png`, style: RATING_STYLING })
                    )
                  )
                ),
                // Title & Subtitle
                f(".tt-align-items-center.tt-flex.tt-overflow-hidden").with(
                  f(".tt-full-width.tt-pd-l-1").with(
                    // Title
                    f(".chat-card__title.tt-ellipsis").with(
                      f("h3.tt-strong.tt-ellipsis.tt-auto-marquee[@testSelector=chat-card-title]").with(title)
                    ),
                    // Subtitle
                    f(".tt-ellipsis").with(
                      f("p.tt-c-text-alt-2[@testSelector=chat-card-description][@twitch-provided-description]", { style: "white-space:break-spaces;max-height:40vh;overflow:auto" }).with(description)
                    ),
                    // Footer
                    f("#tt-purchase-container.tt-ellipsis").with(
                      f.br(),
                      f("#tt-steam-purchase"),
                      f("#tt-playstation-purchase"),
                      f("#tt-xbox-purchase"),
                      f("#tt-nintendo-purchase"),
                      f("#tt-epic-purchase")
                    )
                  )
                )
              )
            )
          )
        );
        const container = f(
          `#game-overview-card[@game="${STREAMER.game}"]`,
          {
            style: `animation:1s fade-in 1; max-width:fit-content; overflow:visible; overflow-wrap:normal; margin-bottom:3rem`
          },
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
        new Tooltip($('[data-a-target$="game-link"i]'), `Read about <ins>${title}</ins> below`, { from: "top" });
        (_c2 = (_b2 = $(".about-section__panel--content")) == null ? void 0 : _b2.closest("*:not([style]):not([class]):not([id])")) == null ? void 0 : _c2.insertAdjacentElement("afterend", container);
      }).catch($error);
      if (parseBool(Settings.simplify_look_auto_marquee))
        setInterval(() => {
          for (const auto of $.all(".tt-auto-marquee")) {
            const { textOverflowX = false } = getOffset(auto);
            if (textOverflowX) {
              const html = auto.innerHTML;
              auto.innerHTML = furnish(`marquee[behavior=alternate][scrollamount=2]`).html(html).outerHTML;
              auto.classList.remove("tt-auto-marquee");
            }
          }
        }, 3e3);
      if (nullish(Settings.store_integration) || parseBool(Settings.store_integration)) {
        let normalize = function(string, ...conditions) {
          var _a4;
          conditions = [
            [LE_QUOTES, '"'],
            [LE_APOSTE, "'"],
            [NON_ASCII, ""]
          ].concat(conditions);
          for (const [expression, replacement] of conditions)
            string = string == null ? void 0 : string.replace(expression, replacement);
          return ((_a4 = string == null ? void 0 : string.replace(/[\u2010-\u2015]/g, "-")) == null ? void 0 : _a4.replace(EditionsRegExp, "")) ?? "";
        };
        __name(normalize, "normalize");
        const lang = navigator.language, [langCode, counCode = ""] = lang.split("-"), [langName] = ((_c = ISO_639_1[langCode]) == null ? void 0 : _c.names) || [navigator.language], game = STREAMER.game, gameURI = encodeURIComponent(game);
        const timeout = 15e3;
        const LE_QUOTES = /[\u2033\u2036\u275d\u275e]/gu, LE_APOSTE = /[\u0312-\u0315\u031b\u2032\u2035\u275b\u275c\u2019\u201a]/gu;
        const NON_ASCII = /[^\p{L}\d `\-=~!@#\$%^&\*\(\)\+\{\}\|\[\]\\:;"'<>\?,\.\/]/gu;
        const ITEM_NOT_FOUND = /* @__PURE__ */ Symbol("NOT_FOUND");
        const PARTIAL_MATCH_THRESHOLD = 0.015;
        const PlayStationRegExp = /\bPS\s*(\d|one|p(ortable)?|v(ita)?|(plus|\+)|move|vr(\s*\d)?).*$/i, XboxRegExp = /\bXbox\s*(\d+|live|one\s*(series\s*)?([x\|s]+\s*)?(enhanced)?)?.*$/i, NintendoRegExp = /\bNintendo\s*(64|[23]?DS\s*(i|XL)?|Switch|Game[\s-]?(Boy(\s*Advance)?|Cube)|Wii([\s-]?U)?)/i, SteamRegExp = /(Valve\s+)?\bSteam\s+(Deck(\s+O?LED)?)/i, EpicRegExp = /(?:Epic\s+Games)/i, EditionsRegExp = /\s*(([-~:]\s*)?([\p{L}\s'-]){3,}\s*)(Edition|Season|Episode)s?(\s+[:\-\dIVXLCD]+)?[^$]+/iu;
        Steam: if (parseBool(Settings.store_integration__steam)) {
          async function fetchSteamGame(game2) {
            return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/steam/${game2[0].toLowerCase().replace(/[^a-z]/, "_")}.json`, { hoursUntilEntryExpires: 168 }).then((r) => r.json()).then((data) => {
              const [best, ...othr] = data.sort(
                (prev, next) => normalize(prev.name, [SteamRegExp, ""]).errs(game2) - normalize(next.name, [SteamRegExp, ""]).errs(game2)
              ).slice(0, 60).sort(
                (prev, next) => normalize(prev.name, [SteamRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase()) - normalize(next.name, [SteamRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase())
              ).sort(
                (prev, next) => !isNaN(parseFloat((next.price + "").replace(/^free$/i, "0"))) ? 0 : !isNaN(parseFloat((prev.price + "").replace(/^free$/i, "0"))) ? -1 : 1
              );
              if (best.name.equals(game2) || normalize(best.name, [SteamRegExp, ""]).trim().equals(game2) || normalize(best.name, [SteamRegExp, ""]).errs(game2) < PARTIAL_MATCH_THRESHOLD)
                return {
                  game: game2,
                  good: normalize(best.name, [SteamRegExp, ""]).errs(game2, true) < PARTIAL_MATCH_THRESHOLD,
                  name: best.name,
                  href: best.href,
                  img: best.image,
                  price: best.price
                };
              throw ITEM_NOT_FOUND;
            }).catch((error) => {
              if (error == ITEM_NOT_FOUND)
                return (
                  /*await*/
                  fetchURL.fromDisk(`https://store.steampowered.com/search/suggest?term=${gameURI}&f=games&cc=${counCode}&realm=1&l=${langName}&use_store_query=1&use_search_spellcheck=1`).then((r) => r.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                    var _a4, _b2, _c2, _d;
                    for (const item of $.all("[data-ds-appid]", DOM)) {
                      const href2 = item.href || `//store.steampowered.com/app/${item.uuid}`, name2 = (_b2 = normalize((_a4 = $('[class*="name"i]', item)) == null ? void 0 : _a4.textContent)) == null ? void 0 : _b2.normalize("NFKD"), img = (_c2 = $('[class*="img"i] img', item)) == null ? void 0 : _c2.src, price = ((_d = $('[class*="price"i], [class*="subtitle"i]', item)) == null ? void 0 : _d.textContent) || "More...", good = game2.errs(name2, true) < PARTIAL_MATCH_THRESHOLD;
                      if (good)
                        return { game: game2, name: name2, href: href2, img, price, good };
                    }
                    return {};
                  })
                );
              $warn(error);
            });
          }
          __name(fetchSteamGame, "fetchSteamGame");
          if (/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
            let [, main, suff, vers = ""] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);
            suff = suff.replace(/s$/, "");
            const jbpp = `The ${main} ${suff} ${vers}`.trim();
            fetchSteamGame(jbpp).then((info = {}) => {
              const { game: game2, name: name2, href: href2, img, price, good = false } = info;
              if (!(href2 == null ? void 0 : href2.length))
                return;
              const f = furnish;
              const purchase = f(`.tt-store-purchase--container.is-steam[name="${name2}"][@goodMatch=${good}]`).with(
                // Price
                f(".tt-store-purchase--price").with(price),
                // Link to Steam
                f(".tt-store-purchase--handler").with(
                  f(`a#steam-link[href="${href2}"][target=_blank]`).html(`Steam&reg;`)
                )
              );
              when.defined(() => $("#tt-steam-purchase")).then((container) => {
                fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                  $(".tt-store-purchase--container.is-steam").dataset.matureContent = $.defined('[id*="error"i], [id*="mature"i], [id*="age"i][id*="gate"i], [id*="content"i][id*="desc"i]', DOM);
                }).catch((error) => {
                  $warn(`Unable to fetch Steam pricing information for "${jbpp}"`, error);
                });
                fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then(DOMParser.stripBody).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                  var _a4, _b2, _c2, _d, _e, _f, _g, _h, _i, _j, _k, _l;
                  const description = ((_a4 = $('[id][class*="description"i]', DOM)) == null ? void 0 : _a4.textContent) ?? ((_b2 = $('meta[name="description"i]', DOM)) == null ? void 0 : _b2.content);
                  const gameDesc = $("[data-twitch-provided-description]");
                  if (defined(gameDesc) && good) {
                    $('[data-test-selector="chat-card-title"]').innerHTML += " &mdash; Steam&reg;";
                    gameDesc.innerText = description || gameDesc.innerText;
                    gameDesc.removeAttribute("data-twitch-provided-description");
                  }
                  let data = (_d = (_c2 = DOM.head.getElementByText("core2")) == null ? void 0 : _c2.textContent) == null ? void 0 : _d.replace(/.*preload.*(\{[^$]+?\});/, "$1");
                  if (data == null ? void 0 : data.length) {
                    data = (_g = (_f = (_e = JSON.parse(data).core2) == null ? void 0 : _e.products) == null ? void 0 : _f.productSummaries) == null ? void 0 : _g[gameID];
                    if (nullish(data == null ? void 0 : data.specificPrices))
                      return;
                    const mature = ((_h = data.contentRating) == null ? void 0 : _h.rating) || "", price2 = (_l = (_k = (_j = (_i = data.specificPrices) == null ? void 0 : _i.purchaseable) == null ? void 0 : _j.shift) == null ? void 0 : _k.call(_j)) == null ? void 0 : _l.listPrice;
                    $(".tt-store-purchase--container.is-steam").dataset.matureContent = mature;
                    $(".is-steam .tt-store-purchase--price").textContent = new RegExp("^\\p{Sc}?(\\d+(?:[\\.,]\\d+)?|\\w+)$", "u").test(price2 ?? "") ? price2 : info.price;
                  }
                });
                container.replaceWith(purchase);
              });
            }).catch((error) => {
              $warn(`Unable to connect to Steam. Tried to look for "${jbpp}"`, error);
            });
          } else {
            fetchSteamGame(game).then((info = {}) => {
              const { game: game2, name: name2, href: href2, img, price, good = false } = info;
              if (!(href2 == null ? void 0 : href2.length))
                return;
              const f = furnish;
              const purchase = f(`.tt-store-purchase--container.is-steam[name="${name2}"][@goodMatch=${good}]`).with(
                // Price
                f(".tt-store-purchase--price").with(price),
                // Link to Steam
                f(".tt-store-purchase--handler").with(
                  f(`a#steam-link[href="${href2}"][target=_blank]`).html(`Steam&reg;`)
                )
              );
              when.defined(() => $("#tt-steam-purchase")).then((container) => {
                fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                  $(".tt-store-purchase--container.is-steam").dataset.matureContent = $.defined('[id*="error"i], [id*="mature"i], [id*="age"i][id*="gate"i], [id*="content"i][id*="desc"i]', DOM);
                }).catch((error) => {
                  $warn(`Unable to fetch Steam pricing information for "${game2}"`, error);
                });
                container.replaceWith(purchase);
              });
              $log(`Got "${game2}" data from Steam:`, info);
            }).catch((error) => {
              $warn(`Unable to connect to Steam. Tried to look for "${game}"`, error);
            });
          }
        }
        PlayStation: if (parseBool(Settings.store_integration__playstation)) {
          async function fetchPlayStationGame(game2, index = 1, pages = 1) {
            return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/psn/${game2[0].toLowerCase().replace(/[^a-z]/, "_")}.json`, { hoursUntilEntryExpires: 168 }).then((r) => r.json()).then((data) => {
              const [best, ...othr] = data.sort(
                (prev, next) => normalize(prev.name, [PlayStationRegExp, ""]).errs(game2) - normalize(next.name, [PlayStationRegExp, ""]).errs(game2)
              ).slice(0, 60).sort(
                (prev, next) => normalize(prev.name, [PlayStationRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase()) - normalize(next.name, [PlayStationRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase())
              ).sort(
                (prev, next) => !isNaN(parseFloat((next.price + "").replace(/^free$/i, "0"))) ? 0 : !isNaN(parseFloat((prev.price + "").replace(/^free$/i, "0"))) ? -1 : 1
              );
              if (best.name.equals(game2) || normalize(best.name, [PlayStationRegExp, ""]).trim().equals(game2) || normalize(best.name, [PlayStationRegExp, ""]).errs(game2) < PARTIAL_MATCH_THRESHOLD)
                return {
                  game: game2,
                  good: normalize(best.name, [PlayStationRegExp, ""]).errs(game2, true) < PARTIAL_MATCH_THRESHOLD,
                  name: best.name,
                  href: best.href,
                  img: best.image,
                  price: best.price
                };
              throw ITEM_NOT_FOUND;
            }).catch((error) => {
              if (error == ITEM_NOT_FOUND)
                return (
                  /*await*/
                  fetchURL.fromDisk(`https://store.playstation.com/${lang}/search/${gameURI}`, { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then(async (DOM) => {
                    var _a4, _b2, _c2, _d, _e, _f, _g, _h, _i, _j, _k;
                    let items = [];
                    for (const element of $.all('#main li > [data-qa^="search"i]', DOM))
                      items.push({
                        id: (_b2 = (_a4 = $("[href]", element)) == null ? void 0 : _a4.href) == null ? void 0 : _b2.slice(1).split("/").pop(),
                        name: (_c2 = $('[data-qa*="product-name"i]', element)) == null ? void 0 : _c2.textContent,
                        href: (_e = (_d = $("[href]", element)) == null ? void 0 : _d.href) == null ? void 0 : _e.replace(/^\/([^\/].+)$/, "https://store.playstation.com/$1"),
                        img: (_f = $("img[loading]", element)) == null ? void 0 : _f.src,
                        price: (_g = $('[data-qa*="display-price"i]', element)) == null ? void 0 : _g.textContent,
                        platforms: $.all('[data-qa*="game"i][data-qa*="tag"i]', element).map((tag) => tag.textContent.trim())
                      });
                    items = items.sort(
                      (prev, next) => normalize(prev.name, [PlayStationRegExp, ""]).errs(game2) - normalize(next.name, [PlayStationRegExp, ""]).errs(game2)
                    ).slice(0, 60).sort(
                      (prev, next) => normalize(prev.name, [PlayStationRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase()) - normalize(next.name, [PlayStationRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase())
                    );
                    for (const item of items)
                      if (((_h = item.platforms) == null ? void 0 : _h.length) && (((_i = item.name) == null ? void 0 : _i.equals(
                        normalize(game2, [PlayStationRegExp, ""])
                      )) || ((_j = normalize(item.name, [PlayStationRegExp, ""])) == null ? void 0 : _j.errs(game2)) < PARTIAL_MATCH_THRESHOLD))
                        return {
                          game: game2,
                          good: ((_k = normalize(item.name, [PlayStationRegExp, ""])) == null ? void 0 : _k.errs(game2, true)) < PARTIAL_MATCH_THRESHOLD || 0,
                          name: item.name,
                          href: `https://store.playstation.com/${lang}/product/${item.id}`,
                          img: item.img,
                          price: item.price || "More..."
                        };
                    return {};
                  })
                );
              $warn(error);
            });
          }
          __name(fetchPlayStationGame, "fetchPlayStationGame");
          if (/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
            let [, main, suff, vers = ""] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);
            suff = suff.replace(/s$/, "");
            const jbpp = `The ${main} ${suff} ${vers}`.trim();
            fetchPlayStationGame(jbpp).then((info = {}) => {
              const { game: game2, name: name2, href: href2, img, price, good = false } = info;
              if (!(href2 == null ? void 0 : href2.length))
                return;
              const f = furnish;
              const purchase = f(`.tt-store-purchase--container.is-playstation[name="${name2}"][@goodMatch=${good}]`).with(
                // Price
                f(".tt-store-purchase--price").with(price),
                // Link to PlayStation
                f(".tt-store-purchase--handler").with(
                  f(`a#playstation-link[href="${href2}"][target=_blank]`).html(`PlayStation&reg;`)
                )
              );
              when.defined(() => $("#tt-playstation-purchase")).then((container) => {
                fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                  var _a4, _b2, _c2, _d;
                  let data = (_a4 = $('[class*="content"i][class*="rating"i] script[type*="json"i]', DOM)) == null ? void 0 : _a4.textContent, description = (_b2 = $('[data-qa*="overview"i][data-qa*="description"i]', DOM)) == null ? void 0 : _b2.innerHTML;
                  const gameDesc = $("[data-twitch-provided-description]");
                  if (defined(gameDesc) && good) {
                    $('[data-test-selector="chat-card-title"]').innerHTML += " &mdash; PlayStation&reg;";
                    gameDesc.innerHTML = (description == null ? void 0 : description.replace(/([\.!\?])\s*([^\.!\?]+(?:\.{3}|…))\s*$/, "$1")) || gameDesc.innerHTML;
                    gameDesc.removeAttribute("data-twitch-provided-description");
                  }
                  if (!(data == null ? void 0 : data.length))
                    return;
                  data = JSON.parse(data);
                  finder: for (const key in data.cache)
                    if (/^product/i.test(key)) {
                      const { authority, description: description2, name: name3, url } = data.cache[key].contentRating;
                      $(".tt-store-purchase--container.is-playstation").dataset.matureContent = ((_c2 = description2 == null ? void 0 : description2.replace(authority, "")) == null ? void 0 : _c2.trim()) || parseBool(name3 == null ? void 0 : name3.contains(...MATURE_HINTS));
                      (_d = $("#tt-content-rating-placeholder")) == null ? void 0 : _d.replaceWith(f.img({ alt: description2, src: url, style: RATING_STYLING }));
                      break finder;
                    }
                }).catch((error) => {
                  $warn(`Unable to fetch PlayStation pricing information for "${jbpp}"`, error);
                });
                container.replaceWith(purchase);
              });
              $log(`Got "${jbpp}" data from PlayStation:`, info);
            }).catch((error) => {
              $warn(`Unable to connect to PlayStation. Tried to look for "${jbpp}"`, error);
            });
          } else {
            fetchPlayStationGame(game).then((info = {}) => {
              let { game: game2, name: name2, href: href2, img, price, good = false } = info;
              if (!(href2 == null ? void 0 : href2.length))
                return;
              if ($.defined('.game-card-img[ok="false"i]')) {
                const i = new Image();
                i.crossOrigin = "anonymous";
                i.addEventListener("load", (event) => {
                  const I = $('.game-card-img[ok="false"i]');
                  if (nullish(I))
                    return;
                  for (const { name: name3, value } of I.attributes)
                    if (["src", "ok"].missing(name3))
                      i.setAttribute(name3, value);
                  I.replaceWith(i);
                });
                i.addEventListener("error", (event) => {
                  i.setAttribute("ok", false);
                });
                i.src = img;
              }
              const f = furnish;
              const purchase = f(`.tt-store-purchase--container.is-playstation[name="${name2}"][@goodMatch=${good}]`).with(
                // Price
                f(".tt-store-purchase--price").with(price),
                // Link to PlayStation
                f(".tt-store-purchase--handler").with(
                  f(`a#playstation-link[href="${href2}"][target=_blank]`).html(`PlayStation&reg;`)
                )
              );
              when.defined(() => $("#tt-playstation-purchase")).then((container) => {
                href2 = href2.replace(/^\/\//, "https:$&");
                fetchURL.fromDisk(href2, { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                  var _a4, _b2, _c2, _d;
                  let data = (_a4 = $('[class*="content"i][class*="rating"i] script[type*="json"i]', DOM)) == null ? void 0 : _a4.textContent, description = (_b2 = $('[data-qa*="overview"i][data-qa*="description"i]', DOM)) == null ? void 0 : _b2.innerHTML;
                  const gameDesc = $("[data-twitch-provided-description]");
                  if (defined(gameDesc) && good) {
                    $('[data-test-selector="chat-card-title"]').innerHTML += " &mdash; PlayStation&reg;";
                    gameDesc.innerHTML = description || gameDesc.innerHTML;
                    gameDesc.removeAttribute("data-twitch-provided-description");
                  }
                  if (!(data == null ? void 0 : data.length))
                    return;
                  data = JSON.parse(data);
                  finder: for (const key in data.cache)
                    if (/^product/i.test(key)) {
                      const { authority, description: description2, name: name3, url } = data.cache[key].contentRating;
                      $(".tt-store-purchase--container.is-playstation").dataset.matureContent = ((_c2 = description2 == null ? void 0 : description2.replace(authority, "")) == null ? void 0 : _c2.trim()) || parseBool(name3 == null ? void 0 : name3.contains(...MATURE_HINTS));
                      (_d = $("#tt-content-rating-placeholder")) == null ? void 0 : _d.replaceWith(f.img({ alt: description2, src: url, style: RATING_STYLING }));
                      break finder;
                    }
                }).catch((error) => {
                  $warn(`Unable to fetch PlayStation pricing information for "${game2}"`, error);
                });
                container.replaceWith(purchase);
              });
              $log(`Got "${game2}" data from PlayStation:`, info);
            }).catch((error) => {
              $warn(`Unable to connect to PlayStation. Tried to look for "${game}"`, error);
            });
          }
        }
        Xbox: if (parseBool(Settings.store_integration__xbox)) {
          async function fetchXboxGame(game2) {
            return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/xbox/${game2[0].toLowerCase().replace(/[^a-z]/, "_")}.json`, { hoursUntilEntryExpires: 168 }).then((r) => r.json()).then((data) => {
              const [best, ...othr] = data.sort(
                (prev, next) => normalize(prev.name, [XboxRegExp, ""]).errs(game2) - normalize(next.name, [XboxRegExp, ""]).errs(game2)
              ).slice(0, 60).sort(
                (prev, next) => normalize(prev.name, [XboxRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase()) - normalize(next.name, [XboxRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase())
              ).sort(
                (prev, next) => !isNaN(parseFloat((next.price + "").replace(/^free$/i, "0"))) ? 0 : !isNaN(parseFloat((prev.price + "").replace(/^free$/i, "0"))) ? -1 : 1
              );
              if (best.name.equals(game2) || normalize(best.name, [XboxRegExp, ""]).trim().equals(game2) || normalize(best.name, [XboxRegExp, ""]).errs(game2) < PARTIAL_MATCH_THRESHOLD)
                return {
                  game: game2,
                  good: normalize(best.name, [XboxRegExp, ""]).errs(game2, true) < PARTIAL_MATCH_THRESHOLD,
                  name: best.name,
                  href: best.href,
                  img: best.image,
                  price: best.price
                };
              throw ITEM_NOT_FOUND;
            }).catch((error) => {
              if (error == ITEM_NOT_FOUND)
                return (
                  /*await*/
                  fetchURL.fromDisk(`https://www.microsoft.com/msstoreapiprod/api/autosuggest?market=${lang}&sources=DCatAll-Products&filter=%2BClientType%3AStoreWeb&query=${gameURI}`, { hoursUntilEntryExpires: 168 }).then((r) => r.json()).then((json) => {
                    var _a4, _b2, _c2, _d;
                    const info = (_c2 = (_b2 = (_a4 = json == null ? void 0 : json.ResultSets) == null ? void 0 : _a4.shift()) == null ? void 0 : _b2.Suggests) == null ? void 0 : _c2.find(({ Description, ImageUrl, Metas, Source, Title, Url }) => (Source == null ? void 0 : Source.equals("games")) && (Title == null ? void 0 : Title.errs(game2)) < PARTIAL_MATCH_THRESHOLD);
                    if (nullish(info))
                      return {};
                    const name2 = normalize(info.Title).normalize("NFKD"), href2 = info.Url, img = info.ImageUrl, price = "More...", errs = parseBool(((_d = info.Title) == null ? void 0 : _d.errs(game2)) < PARTIAL_MATCH_THRESHOLD);
                    return { game: game2, name: name2, href: href2, img, price, errs };
                  })
                );
              $warn(error);
            });
          }
          __name(fetchXboxGame, "fetchXboxGame");
          if (/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
            let [, main, suff, vers = ""] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);
            suff = suff.replace(/s$/, "");
            const jbpp = `The ${main} ${suff} ${vers}`.trim();
            fetchXboxGame(jbpp).then((info = {}) => {
              const { game: game2, name: name2, href: href2, img, price, good = false } = info;
              if (!(href2 == null ? void 0 : href2.length))
                return;
              const f = furnish;
              const purchase = f(`.tt-store-purchase--container.is-xbox[name="${name2}"][@goodMatch=${good}]`).with(
                // Price
                f(".tt-store-purchase--price").with(price),
                // Link to Xbox
                f(".tt-store-purchase--handler").with(
                  f(`a#xbox-link[href="${href2}"][target=_blank]`).html(`Xbox&reg;`)
                )
              );
              when.defined(() => $("#tt-xbox-purchase")).then((container) => {
                fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                  var _a4, _b2, _c2, _d, _e, _f;
                  const price2 = ((_a4 = $('[itemprop="price"i]', DOM)) == null ? void 0 : _a4.content) ?? ((_c2 = (_b2 = $('[class^="price-mod"i][class*="discount"i]', DOM) ?? $('[class^="price-mod"i][class*="original"i]', DOM) ?? $('[class^="price-mod"i]', DOM) ?? $('[class$="price-text"i] *', DOM)) == null ? void 0 : _b2.textContent) == null ? void 0 : _c2.trim());
                  const rating = $('[class*="age"i][class*="rating"i] img', DOM), mature = parseBool((_e = (_d = rating == null ? void 0 : rating.alt) == null ? void 0 : _d.toUpperCase()) == null ? void 0 : _e.contains(...MATURE_HINTS));
                  rating.modStyle(RATING_STYLING);
                  $(".is-xbox .tt-store-purchase--price").textContent = new RegExp("^\\p{Sc}?(\\d+(?:[\\.,]\\d+)?|\\w+)$", "u").test(price2 ?? "") ? price2 : info.price;
                  $(".tt-store-purchase--container.is-xbox").dataset.matureContent = rating.alt || mature;
                  if (rating)
                    (_f = $("#tt-content-rating-placeholder")) == null ? void 0 : _f.replaceWith(rating);
                }).catch((error) => {
                  $warn(`Unable to fetch Xbox pricing information for "${jbpp}"`, error);
                });
                fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then(DOMParser.stripBody).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                  var _a4, _b2, _c2, _d, _e, _f, _g, _h, _i, _j, _k, _l;
                  const description = ((_a4 = $('[id][class*="description"i]', DOM)) == null ? void 0 : _a4.textContent) ?? ((_b2 = $('meta[name="description"i]', DOM)) == null ? void 0 : _b2.content);
                  const gameDesc = $("[data-twitch-provided-description]");
                  if (defined(gameDesc) && good) {
                    $('[data-test-selector="chat-card-title"]').innerHTML += " &mdash; Xbox&reg;";
                    gameDesc.innerText = description || gameDesc.innerText;
                    gameDesc.removeAttribute("data-twitch-provided-description");
                  }
                  return;
                  let data = (_d = (_c2 = DOM.head.getElementByText("core2")) == null ? void 0 : _c2.textContent) == null ? void 0 : _d.replace(/.*preload.*(\{[^$]+?\});/, "$1");
                  if (data == null ? void 0 : data.length) {
                    data = (_g = (_f = (_e = JSON.parse(data).core2) == null ? void 0 : _e.products) == null ? void 0 : _f.productSummaries) == null ? void 0 : _g[gameID];
                    if (nullish(data == null ? void 0 : data.specificPrices))
                      return;
                    const mature = ((_h = data.contentRating) == null ? void 0 : _h.rating) || "", price2 = (_l = (_k = (_j = (_i = data.specificPrices) == null ? void 0 : _i.purchaseable) == null ? void 0 : _j.shift) == null ? void 0 : _k.call(_j)) == null ? void 0 : _l.listPrice;
                    $(".tt-store-purchase--container.is-xbox").dataset.matureContent = mature;
                    $(".is-xbox .tt-store-purchase--price").textContent = new RegExp("^\\p{Sc}?(\\d+(?:[\\.,]\\d+)?|\\w+)$", "u").test(price2 ?? "") ? price2 : info.price;
                  }
                });
                container.replaceWith(purchase);
              });
            }).catch((error) => {
              $warn(`Unable to connect to Xbox. Tried to look for "${jbpp}"`, error);
            });
          } else {
            fetchXboxGame(game).then((info = {}) => {
              const { game: game2, name: name2, href: href2, img, price, good = false } = info;
              if (!(href2 == null ? void 0 : href2.length))
                return;
              if ($.defined('.game-card-img[ok="false"i]')) {
                const i = new Image();
                i.crossOrigin = "anonymous";
                i.addEventListener("load", (event) => {
                  const I = $('.game-card-img[ok="false"i]');
                  if (nullish(I))
                    return;
                  for (const { name: name3, value } of I.attributes)
                    if (["src", "ok"].missing(name3))
                      i.setAttribute(name3, value);
                  I.replaceWith(i);
                });
                i.addEventListener("error", (event) => {
                  i.setAttribute("ok", false);
                });
                i.src = img;
              }
              const f = furnish;
              const purchase = f(`.tt-store-purchase--container.is-xbox[name="${name2}"][@goodMatch=${good}]`).with(
                // Price
                f(".tt-store-purchase--price").with(price),
                // Link to Xbox
                f(".tt-store-purchase--handler").with(
                  f(`a#xbox-link[href="${href2}"][target=_blank]`).html(`Xbox&reg;`)
                )
              );
              when.defined(() => $("#tt-xbox-purchase")).then((container) => {
                fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                  var _a4, _b2, _c2, _d, _e, _f;
                  const price2 = ((_a4 = $('[itemprop="price"i]', DOM)) == null ? void 0 : _a4.content) ?? ((_c2 = (_b2 = $('[class^="price-mod"i][class*="discount"i]', DOM) ?? $('[class^="price-mod"i][class*="original"i]', DOM) ?? $('[class^="price-mod"i]', DOM) ?? $('[class$="price-text"i] *', DOM)) == null ? void 0 : _b2.textContent) == null ? void 0 : _c2.trim());
                  const rating = $('[class*="age"i][class*="rating"i] img', DOM), mature = parseBool((_e = (_d = rating == null ? void 0 : rating.alt) == null ? void 0 : _d.toUpperCase()) == null ? void 0 : _e.contains(...MATURE_HINTS));
                  rating == null ? void 0 : rating.modStyle(RATING_STYLING);
                  $(".is-xbox .tt-store-purchase--price").textContent = new RegExp("^\\p{Sc}?(\\d+(?:[\\.,]\\d+)?|\\w+)$", "u").test(price2 ?? "") ? price2 : info.price;
                  $(".tt-store-purchase--container.is-xbox").dataset.matureContent = (rating == null ? void 0 : rating.alt) || mature;
                  if (rating)
                    (_f = $("#tt-content-rating-placeholder")) == null ? void 0 : _f.replaceWith(rating);
                }).catch((error) => {
                  $warn(`Unable to fetch Xbox pricing information for "${game2}"`, error);
                });
                fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then(DOMParser.stripBody).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                  var _a4, _b2, _c2, _d, _e, _f, _g, _h, _i, _j, _k, _l;
                  const description = ((_a4 = $('[id][class*="description"i]', DOM)) == null ? void 0 : _a4.textContent) ?? ((_b2 = $('meta[name="description"i]', DOM)) == null ? void 0 : _b2.content);
                  const gameDesc = $("[data-twitch-provided-description]");
                  if (defined(gameDesc) && good) {
                    $('[data-test-selector="chat-card-title"]').innerHTML += " &mdash; Xbox&reg;";
                    gameDesc.innerText = description || gameDesc.innerText;
                    gameDesc.removeAttribute("data-twitch-provided-description");
                  }
                  return;
                  let data = (_d = (_c2 = DOM.head.getElementByText("core2")) == null ? void 0 : _c2.textContent) == null ? void 0 : _d.replace(/.*preload.*(\{[^$]+?\});/, "$1");
                  if (data == null ? void 0 : data.length) {
                    data = (_g = (_f = (_e = JSON.parse(data).core2) == null ? void 0 : _e.products) == null ? void 0 : _f.productSummaries) == null ? void 0 : _g[gameID];
                    if (nullish(data == null ? void 0 : data.specificPrices))
                      return;
                    const mature = ((_h = data.contentRating) == null ? void 0 : _h.rating) || "", price2 = (_l = (_k = (_j = (_i = data.specificPrices) == null ? void 0 : _i.purchaseable) == null ? void 0 : _j.shift) == null ? void 0 : _k.call(_j)) == null ? void 0 : _l.listPrice;
                    $(".tt-store-purchase--container.is-xbox").dataset.matureContent = mature;
                    $(".is-xbox .tt-store-purchase--price").textContent = new RegExp("^\\p{Sc}?(\\d+(?:[\\.,]\\d+)?|\\w+)$", "u").test(price2 ?? "") ? price2 : info.price;
                  }
                });
                container.replaceWith(purchase);
              });
              $log(`Got "${game2}" data from Xbox:`, info);
            }).catch((error) => {
              $warn(`Unable to connect to Xbox. Tried to look for "${game}"`, error);
            });
          }
        }
        Nintendo: if (parseBool(Settings.store_integration__nintendo)) {
          async function fetchNintendoGame(game2) {
            return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/nintendo/${game2[0].toLowerCase().replace(/[^a-z]/, "_")}.json`, { hoursUntilEntryExpires: 168 }).then((r) => r.json()).then((data) => {
              const [best, ...othr] = data.sort(
                (prev, next) => normalize(prev.name, [NintendoRegExp, ""]).errs(game2) - normalize(next.name, [NintendoRegExp, ""]).errs(game2)
              ).slice(0, 60).sort(
                (prev, next) => normalize(prev.name, [NintendoRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase()) - normalize(next.name, [NintendoRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase())
              ).sort(
                (prev, next) => !isNaN(parseFloat((next.price + "").replace(/^free$/i, "0"))) ? 0 : !isNaN(parseFloat((prev.price + "").replace(/^free$/i, "0"))) ? -1 : 1
              );
              if (best.name.equals(game2) || normalize(best.name, [NintendoRegExp, ""]).trim().equals(game2) || normalize(best.name, [NintendoRegExp, ""]).errs(game2) < 0.07)
                return {
                  game: game2,
                  good: normalize(best.name, [NintendoRegExp, ""]).errs(game2, true) < PARTIAL_MATCH_THRESHOLD,
                  name: best.name,
                  href: best.href,
                  img: best.image,
                  price: best.price,
                  rating: best.rating
                };
              throw ITEM_NOT_FOUND;
            }).catch((error) => {
              if (error == ITEM_NOT_FOUND)
                return (
                  /*await*/
                  fetchURL.fromDisk(encodeURI`https://u3b6gr4ua3-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia for JavaScript (4.14.2); Browser; JS Helper (3.11.1); react (17.0.2); react-instantsearch (6.38.0)`, {
                    hoursUntilEntryExpires: 168,
                    // 1 week lifetime
                    keepDefectiveEntry: true,
                    // Keep bad requests
                    headers: {
                      "accept": "*/*",
                      "accept-language": navigator.languages.join(","),
                      "content-type": "application/x-www-form-urlencoded",
                      "sec-ch-ua": navigator.userAgentData.brands.map((b) => [`"${b.brand}"`, `v="${b.version}"`].join(";")).join(", "),
                      "sec-ch-ua-mobile": "?" + +navigator.userAgentData.mobile,
                      "sec-ch-ua-platform": `"${navigator.userAgentData.platform}"`,
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "cross-site",
                      "x-algolia-api-key": "a29c6927638bfd8cee23993e51e721c9",
                      "x-algolia-application-id": "U3B6GR4UA3"
                    },
                    referrer: "https://www.nintendo.com/",
                    referrerPolicy: "strict-origin-when-cross-origin",
                    body: JSON.stringify({
                      requests: [{
                        indexName: "store_all_products_en_us",
                        query: game2,
                        params: encodeURI`filters=&hitsPerPage=120&analytics=false&facetingAfterDistinct=true&clickAnalytics=false&highlightPreTag=^*^^&highlightPostTag=^*&attributesToHighlight=["description"]`
                      }]
                    }),
                    method: "POST",
                    mode: "cors",
                    credentials: "omit"
                  }).then((r) => r.json()).then(
                    (j) => j.results.shift().hits.filter((item) => item.topLevelCategoryCode.equals("GAMES") && item.topLevelFilters.missing("DLC", "DLC bundle")).map((item) => {
                      var _a4;
                      return {
                        name: item.title,
                        price: (((_a4 = item.price) == null ? void 0 : _a4.regPrice) || "Free").toString().replace(/^\d/, "$$$&"),
                        image: item.productImage,
                        href: `https://www.nintendo.com${item.url}`,
                        uuid: item.nsuid,
                        platforms: [item.platform],
                        rating: { "E": "everyone", "E10": "everyone 10+", "RP": "rating pending", "T": "teen", "M": "mature 17+" }[item.esrbRating] || item.esrbRating || "none"
                      };
                    })
                  )
                );
              $warn(error);
            });
          }
          __name(fetchNintendoGame, "fetchNintendoGame");
          if (/(?:^Pok[ée]mon)/i.test(game)) {
            let [, main, vers] = /(^Pok[ée]mon)\s+(.+)$/i.exec(game);
            vers = vers.split("/").map((v) => v.trim());
            for (const ver of vers)
              fetchNintendoGame(main + ver).then((info = {}) => {
                const { game: game2, name: name2, href: href2, img, price, rating = "none", good = false } = info;
                if (!(href2 == null ? void 0 : href2.length))
                  return;
                fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then(DOMParser.stripBody).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                  var _a4, _b2, _c2, _d, _e;
                  const description = ((_d = (_c2 = (_b2 = JSON.parse(((_a4 = $('script[id*="data"i][type$="json"i]', DOM)) == null ? void 0 : _a4.textContent) ?? "{}").props) == null ? void 0 : _b2.pageProps) == null ? void 0 : _c2.meta) == null ? void 0 : _d.description) ?? ((_e = $('meta[name="description"i]', DOM)) == null ? void 0 : _e.content);
                  const gameDesc = $("[data-twitch-provided-description]");
                  if (defined(gameDesc) && good) {
                    $('[data-test-selector="chat-card-title"]').innerHTML += " &mdash; Nintendo&reg;";
                    gameDesc.innerText = [description, gameDesc.innerText].sort((a, b) => (b == null ? void 0 : b.length) - (a == null ? void 0 : a.length)).shift().replace(/([\.!\?])\s*(?:\.{3}|…)\s*$/, "$1");
                    gameDesc.removeAttribute("data-twitch-provided-description");
                  }
                });
                const f = furnish;
                const purchase = f(`.tt-store-purchase--container.is-nintendo[name="${name2}"][@versionName="${main} ${ver}"][@goodMatch=${good}]`).with(
                  // Price
                  f(".tt-store-purchase--price").with(price),
                  // Link to Nintendo
                  f(".tt-store-purchase--handler").with(
                    f(`a#nintendo-link[href="${href2}"][target=_blank]`).html(`Nintendo&reg;`)
                  )
                );
                when.defined(() => $("#tt-nintendo-purchase")).then((container) => {
                  container.replaceWith(purchase);
                  new Tooltip(purchase, `ESRB (USA): ${rating.toUpperCase()}`, { from: "top" });
                  if ($.all(".is-nintendo").length < vers.length)
                    $("#tt-purchase-container").append(
                      f("#tt-nintendo-purchase")
                    );
                });
                $log(`Got "${game2}" data from Nintendo:`, info);
              }).catch((error) => {
                $warn(`Unable to connect to Nintendo. Tried to look for "${game}"`, error);
              });
          } else if (/(?:^(?:The\s+)?Jackbox Party)/i.test(game)) {
            let [, main, suff, vers = ""] = /^(?:The\s+)?(Jackbox Party)\s+(Pack)s?\s*(\d+)?/i.exec(game);
            suff = suff.replace(/s$/, "");
            const jbpp = `The ${main} ${suff} ${vers}`.trim();
            fetchNintendoGame(jbpp).then((info = {}) => {
              const { game: game2, name: name2, href: href2, img, price, rating = "none", good = false } = info;
              if (!(href2 == null ? void 0 : href2.length))
                return;
              const f = furnish;
              const purchase = f(`.tt-store-purchase--container.is-nintendo[@matureContent="${rating.toUpperCase()}"][name="${name2}"][@goodMatch=${good}]`).with(
                // Price
                f(".tt-store-purchase--price").with(price),
                // Link to Nintendo
                f(".tt-store-purchase--handler").with(
                  f(`a#nintendo-link[href="${href2}"][target=_blank]`).html(`Nintendo&reg;`)
                )
              );
              $log(`Got "${jbpp}" data from Nintendo:`, info);
            }).catch((error) => {
              $warn(`Unable to connect to Nintendo. Tried to look for "${jbpp}"`, error);
            });
          } else {
            fetchNintendoGame(game).then((info = {}) => {
              const { game: game2, name: name2, href: href2, img, price, rating = "none", good = false } = info;
              if (!(href2 == null ? void 0 : href2.length))
                return;
              if ($.defined('.game-card-img[ok="false"i]')) {
                const i = new Image();
                i.crossOrigin = "anonymous";
                i.addEventListener("load", (event) => {
                  const I = $('.game-card-img[ok="false"i]');
                  if (nullish(I))
                    return;
                  for (const { name: name3, value } of I.attributes)
                    if (["src", "ok"].missing(name3))
                      i.setAttribute(name3, value);
                  I.replaceWith(i);
                });
                i.addEventListener("error", (event) => {
                  i.setAttribute("ok", false);
                });
                i.src = img;
              }
              fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                var _a4, _b2, _c2, _d, _e, _f;
                const description = ((_d = (_c2 = (_b2 = JSON.parse(((_a4 = $('script[id*="data"i][type$="json"i]', DOM)) == null ? void 0 : _a4.textContent) ?? "{}").props) == null ? void 0 : _b2.pageProps) == null ? void 0 : _c2.meta) == null ? void 0 : _d.description) ?? ((_e = $('meta[name="description"i]', DOM)) == null ? void 0 : _e.content);
                const gameDesc = $("[data-twitch-provided-description]");
                if (defined(gameDesc) && good) {
                  $('[data-test-selector="chat-card-title"]').innerHTML += " &mdash; Nintendo&reg;";
                  console.log("Nintendo:", description, description == null ? void 0 : description.length);
                  console.log("Twitch:", gameDesc.innerText, (_f = gameDesc.innerText) == null ? void 0 : _f.length);
                  console.log([description, gameDesc.innerText].sort((a, b) => (b == null ? void 0 : b.length) - (a == null ? void 0 : a.length)));
                  gameDesc.innerHTML = [description, gameDesc.innerText].sort((a, b) => (b == null ? void 0 : b.length) - (a == null ? void 0 : a.length)).shift().replace(/([\.!\?])\s*(?:\.{3}|…)\s*$/, "$1");
                  gameDesc.removeAttribute("data-twitch-provided-description");
                }
              });
              const f = furnish;
              const purchase = f(`.tt-store-purchase--container.is-nintendo[@matureContent="${rating.toUpperCase()}"][name="${name2}"][@goodMatch=${good}]`).with(
                // Price
                f(".tt-store-purchase--price").with(price),
                // Link to Nintendo
                f(".tt-store-purchase--handler").with(
                  f(`a#nintendo-link[href="${href2}"][target=_blank]`).html(`Nintendo&reg;`)
                )
              );
              when.defined(() => $("#tt-nintendo-purchase")).then((container) => {
                container.replaceWith(purchase);
              });
              $log(`Got "${game2}" data from Nintendo:`, info);
            }).catch((error) => {
              $warn(`Unable to connect to Nintendo. Tried to look for "${game}"`, error);
            });
          }
        }
        Epic: if (parseBool(Settings.store_integration__epic)) {
          async function fetchEpicGame(game2) {
            return fetchURL.fromDisk(`https://raw.githubusercontent.com/Ephellon/game-store-catalog/main/epic/${game2[0].toLowerCase().replace(/[^a-z]/, "_")}.json`, { hoursUntilEntryExpires: 168 }).then((r) => r.json()).then((data) => {
              const [best, ...othr] = data.sort(
                (prev, next) => normalize(prev.name, [EpicRegExp, ""]).errs(game2) - normalize(next.name, [EpicRegExp, ""]).errs(game2)
              ).slice(0, 60).sort(
                (prev, next) => normalize(prev.name, [EpicRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase()) - normalize(next.name, [EpicRegExp, ""]).toLowerCase().distanceFrom(game2.toLowerCase())
              ).sort(
                (prev, next) => !isNaN(parseFloat((next.price + "").replace(/^free$/i, "0"))) ? 0 : !isNaN(parseFloat((prev.price + "").replace(/^free$/i, "0"))) ? -1 : 1
              );
              if (best.name.equals(game2) || normalize(best.name, [EpicRegExp, ""]).trim().equals(game2) || normalize(best.name, [EpicRegExp, ""]).errs(game2) < PARTIAL_MATCH_THRESHOLD)
                return {
                  game: game2,
                  good: normalize(best.name, [EpicRegExp, ""]).errs(game2, true) < PARTIAL_MATCH_THRESHOLD,
                  name: best.name,
                  href: best.href,
                  img: best.image,
                  price: best.price
                };
              throw ITEM_NOT_FOUND;
            }).catch((error) => {
              const variables = JSON.stringify({
                allowCountries: counCode,
                country: counCode,
                locale: lang,
                category: ["games/edition/base", "games/edition", "games/demo"].join("|"),
                count: 10,
                sortBy: null,
                sortDir: "DESC",
                keywords: game2.replace(/\s+/g, "+")
              });
              if (error == ITEM_NOT_FOUND)
                return (
                  /*await*/
                  fetchURL.fromDisk(`https://store.epicgames.com/graphql?operationName=primarySearchAutocomplete&variables=${encodeURIComponent(variables)}`).then((r) => r.json()).then(async ({ data = {} }) => {
                    var _a4, _b2, _c2, _d, _e, _f;
                    for (const element of ((_b2 = (_a4 = data.Catalog) == null ? void 0 : _a4.searchStore) == null ? void 0 : _b2.elements) ?? []) {
                      const { offerId, sandboxId, title } = element;
                      if (nullish(offerId))
                        continue;
                      const offer = JSON.stringify({
                        country: counCode,
                        locale: lang,
                        offerId,
                        sandboxId
                      });
                      const item = (_d = (_c2 = (await fetch(`https://store.epicgames.com/graphql?operationName=getCatalogOffer&variables=${encodeURIComponent(offer)}`).then((r) => r.json())).data) == null ? void 0 : _c2.Catalog) == null ? void 0 : _d.catalogOffer;
                      if (nullish(item))
                        continue;
                      const href2 = `//store.epicgames.com/en-US/p/${item.urlSlug}`, name2 = item.title.normalize("NFKD"), img = item.keyImages.at(0), price = ((_e = item.price.totalPrice.fmtPrice) == null ? void 0 : _e.originalPrice) ?? item.price.totalPrice.originalPrice / 10 ** (((_f = item.price.totalPrice.currencyInfo) == null ? void 0 : _f.decimals) || -1), good = game2.errs(name2, true) < PARTIAL_MATCH_THRESHOLD;
                      if (good)
                        return { game: game2, name: name2, href: href2, img, price, good };
                    }
                    return {
                      game: game2,
                      name,
                      href: `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(game2)}`,
                      price: "Unavailable",
                      good: game2.errs(name, true) < PARTIAL_MATCH_THRESHOLD
                    };
                  })
                );
              $warn(error);
            });
          }
          __name(fetchEpicGame, "fetchEpicGame");
          fetchEpicGame(game).then((info = {}) => {
            let { game: game2, name: name2, href: href2, img, price, good = false } = info;
            if (!(href2 == null ? void 0 : href2.length))
              return;
            href2 = parseURL(href2).addSearch({ category: "Game", count: 10, start: 0 }).href;
            const f = furnish;
            const purchase = f(`.tt-store-purchase--container.is-epic[name="${name2}"][@goodMatch=${good}]`).with(
              // Price
              f(".tt-store-purchase--price").with(price),
              // Link to Epic
              f(".tt-store-purchase--handler").with(
                f(`a#epic-link[href="${href2}"][target=_blank]`).html(`Epic Games&reg;`)
              )
            );
            when.defined(() => $("#tt-epic-purchase")).then((container) => {
              fetchURL.fromDisk(href2.replace(/^\/\//, "https:$&"), { hoursUntilEntryExpires: 168 }).then((r) => r.text()).then((html) => new DOMParser().parseFromString(html, "text/html")).then((DOM) => {
                var _a4, _b2, _c2, _d, _e, _f, _g, _h, _i, _j;
                $(".tt-store-purchase--container.is-epic").dataset.matureContent = ((_j = (_i = (_h = (_g = (_f = (_e = (_d = (_c2 = JSON.parse(
                  ((_b2 = (_a4 = $.all("script", DOM).find((script) => script.textContent.includes("__REACT_QUERY_INITIAL_QUERIES__"))) == null ? void 0 : _a4.textContent) == null ? void 0 : _b2.replace(/\b__REACT_QUERY_INITIAL_QUERIES__\s*=\s*(.+);\r?\n/, "$1")) ?? "{}"
                )) == null ? void 0 : _c2.queries) == null ? void 0 : _d.find(({ queryKey }) => Array.isArray(queryKey) && queryKey.find((query) => query.includes("age-rating")))) == null ? void 0 : _e.state) == null ? void 0 : _f.data) == null ? void 0 : _g.ageGate) == null ? void 0 : _h.gate) == null ? void 0 : _i.toLowerCase()) == null ? void 0 : _j.startsWith("age")) ?? "";
              }).catch((error) => {
                $warn(`Unable to fetch Epic pricing information for "${game2}"`, error);
              });
              container.replaceWith(purchase);
            });
            $log(`Got "${game2}" data from Epic:`, info);
          }).catch((error) => {
            $warn(`Unable to connect to Epic. Tried to look for "${game}"`, error);
          });
        }
      }
    }, "handler"),
    /**
     * Undoes the store integration by removing the game overview card from the DOM.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      var _a3;
      (_a3 = $("#game-overview-card")) == null ? void 0 : _a3.remove();
    }, "unhandler"),
    /**
     * Determines if the game overview card feature is enabled in the settings.
     * @returns {boolean} Whether the feature should be active
     */
    enabled() {
      return nullish(Settings.game_overview_card) || parseBool(Settings.game_overview_card);
    },
    /**
     * Initializes the game overview card feature and logs a status message.
     */
    setup() {
      $remark("Adding game overview card...");
    }
  });

  // src/plugins/automation/parse-commands.js
  var parseCommands;
  var decodeMD;
  plugin({
    id: "parse_commands",
    timer: -1e3,
    /**
     * Initializes the command parsing logic to replace placeholders in strings with dynamic user, channel, and stream data.
     */
    init() {
      parseCommands = /* @__PURE__ */ __name(function parseCommands2(string = "", variables = {}) {
        var _a3;
        for (let MAX_ITER = 3 * string.count("$"), regexp = /\$?(\([^\(\)]+?\)|\{[^\{\}]+?\}|\[[^\[\]]+?\])/; regexp.test(string) && --MAX_ITER > 0; )
          string = (_a3 = string.replace(regexp, ($0, $1, $$, $_) => {
            var _a4, _b;
            const path = $1.replace(/^[\(\[\{]|[\}\]\)]$/g, "").split(/[\s\.]+/).filter((string2) => !!string2.length);
            const gameText = STREAMER.game + "";
            let properties = {
              // StreamElements
              user: {
                _: USERNAME,
                name: USERNAME.toLocaleLowerCase(top.LANGUAGE),
                level: 100,
                points: STREAMER.coin,
                points_rank: [STREAMER.rank, STREAMER.cult].join("/"),
                points_alltime_rank: [STREAMER.rank, STREAMER.cult].join("/"),
                time_online_rank: [STREAMER.rank, STREAMER.cult].join("/"),
                time_offline_rank: [STREAMER.rank, STREAMER.cult].join("/"),
                lastmessage: Chat.get().filter(({ author }) => USERNAME.equals(author)).pop(),
                lastseen: toTimeString(0, "!minute_m !second_s"),
                lastactive: toTimeString(0, "!minute_m !second_s"),
                time_online: toTimeString(parseCoin((_a4 = $("#tt-points-receipt")) == null ? void 0 : _a4.textContent) / 320 * 4e3),
                time_offline: toTimeString(+/* @__PURE__ */ new Date() - +new Date(((_b = STREAMER.data) == null ? void 0 : _b.lastSeen) || $("#root").dataset.aPageLoaded))
              },
              user1: USERNAME,
              "2": USERNAME,
              user2: STREAMER.name,
              "1": STREAMER.name,
              channel: {
                _: STREAMER.name,
                [STREAMER.name]: STREAMER.name,
                [USERNAME]: USERNAME,
                viewers: STREAMER.poll,
                views: (STREAMER.cult * (1 + STREAMER.poll / STREAMER.cult)).floor(),
                followers: STREAMER.cult,
                subs: STREAMER.poll,
                display_name: STREAMER.name,
                alias: STREAMER.name
              },
              title: $('[data-a-target="stream-title"i]').textContent,
              status: $('[data-a-target="stream-title"i]').textContent,
              game: {
                _: gameText,
                [STREAMER.name]: gameText,
                [USERNAME]: gameText
              },
              pointsname: STREAMER.fiat,
              uptime: toTimeString(STREAMER.time),
              // NightBot
              channelid: STREAMER.sole,
              userlevel: "everyone",
              sender: USERNAME,
              touser: USERNAME,
              // Either...
              customapi: `ℂ𝕦𝕤𝕥𝕠𝕞 𝔸ℙ𝕀`,
              // Fetched...
              ...variables
            }, value = properties;
            dir:
              for (const root of path)
                if (nullish(value = value[root]))
                  return $0;
            value = (value == null ? void 0 : value._) ?? value;
            return value || $_;
          })) == null ? void 0 : _a3.replace(/^\/(?:\w\S+)\s*/, "");
        return string;
      }, "parseCommands");
      decodeMD = /* @__PURE__ */ __name(function decodeMD2(string = "") {
        return string.replace(/(`{3})((?:[\w\-]+\s)?)([^$]+)\1/g, '<code type="$2">$3</code>').replace(/([`]{1})([^\1]+)\1/g, "<code>$2</code>").replace(/([\*_]{3})([^\1]+)\1/g, "<strong><em>$2</em></strong>").replace(/([\*_]{2})([^\1]+)\1/g, "<strong>$2</strong>").replace(/([\*_]{1})([^\1]+)\1/g, "<em>$2</em>").replace(/!\[([^\[\]]+?)\]\(([^\(\)]+?)\)/g, '<img alt="$1" src="$2"/>').replace(/\[([^\[\]]+?)\]\(([^\(\)]+?)\)/g, '<a href="$2" target="_blank">$1</a>').replace(/([~]{1})([^$]+)\1/g, '<span style="text-decoration:1px line-through!important">$2</span>').replace(/([#]{1,3})([^$]+)\1/g, ($0, $1, $2, $$, $_) => {
          const type = ["opf", "scr", "fr"][$1.length - 1];
          let string2 = "";
          for (const char of $2)
            string2 += /[a-z]/i.test(char) ? `&${char}${type};` : char;
          return string2;
        }).replace(/([#]{1,5})([^$]+)/g, ($0, $1, $2, $$, $_) => `<h${$1.length}>${$2.trim()}</h${$1.length}>`);
      }, "decodeMD");
    },
    /**
     * Scans the page for command-like text in titles and panels and replaces them with their defined replies.
     */
    handler: /* @__PURE__ */ __name(async () => {
      const elements = $.all('[data-a-target="stream-title"i], [data-a-target="about-panel"i] *, [data-a-target^="panel"i] *').map(($0) => $0.getElementByText(/([!][\p{Alpha}\.\\\/\?\+\(\)\[\]\{\}\*\|]+)/u)).isolate().filter(defined).filter((e) => nullish(e.closest("a[href]")));
      for (const element of elements) {
        for (let { aliases, command, reply: reply2, availability, enabled, origin, variables } of await STREAMER.coms)
          await wait(1).then(() => {
            const regexp = RegExp(`([!](?:${[command, ...aliases].filter((s) => typeof s == "string" && s.length).map((s) => s.replace(/[\.\\\/\?\+\(\)\[\]\{\}\$\*\|]/g, "\\$&")).join("|")})(?!\\p{L}))`, "igu");
            if (!regexp.test(element.innerHTML))
              return;
            element.innerHTML = element.innerHTML.replace(regexp, ($0, $1, $$, $_) => {
              if ($0.trim().length <= 1)
                return $0;
              reply2 = parseCommands(reply2, variables);
              let url = parseURL(reply2), string;
              let _href, _protocol, _host, _origin, _port, _pathname, _search, _hash;
              const errors = [];
              if (defined(url))
                for (let s = reply2, i = 0, maxURLs = 5; i < s.length && --maxURLs; ) {
                  const found = parseURL.pattern.exec(s.slice(i));
                  if (nullish(found))
                    continue;
                  const { index, groups } = found;
                  const { href, protocol, host, origin: origin2, port, pathname, search, hash } = groups;
                  if (href && !_href || pathname && !_pathname || search && !_search || hash && !_hash || (protocol && !_protocol || host && !_host || origin2 && !_origin || port && !_port)) {
                    _href = href;
                    _origin = origin2;
                    _protocol = protocol;
                    _host = host;
                    _port = port;
                    _pathname = pathname;
                    _search = search;
                    _hash = hash;
                  }
                  if (index + href.length >= s.slice(i).length)
                    break;
                  i = index + href.length;
                }
              const titleTo = new UUID() + "";
              if (parseBool(Settings.parse_commands__create_links) && defined(_href))
                string = `<code tt-code style="border:1px solid currentColor; color:var(--color-colored)!important; white-space:nowrap;" contrast="${THEME__PREFERRED_CONTRAST}" title-to="${titleTo};${encodeHTML(reply2)}"><a style="color:inherit!important" href="${_href.replace(/^(\w{3,}\.\w{2,})/, `https://$1`)}" target=_blank>${decodeMD(encodeHTML($1))} ${Glyphs.modify("ne_arrow", { height: 12, width: 12, style: "vertical-align:middle!important" })}</a></code>`;
              else
                string = `<code tt-code style="opacity:${2 ** -!enabled}; white-space:nowrap" title-to="${titleTo};${encodeHTML(reply2)}">${decodeMD(encodeHTML($1))}</code>`;
              return `<span title-to="${titleTo}" tt-parse-commands="${btoa(escape(string))}">${$0.split("").join("&zwj;")}</span>`;
            });
          });
        if (true)
          wait(500, element).then((element2) => {
            const title = decodeHTML(element2.getAttribute("title") ?? "");
            if (title.length < 1)
              return;
            new Tooltip(element2, title, { from: "top" });
            element2.removeAttribute("title");
          });
        $.all('[tt-parse-commands]:not([tt-parsed="true"i])').map((element2) => {
          const titleTo = element2.getAttribute("title-to");
          element2.outerHTML = unescape(atob(element2.getAttribute("tt-parse-commands")));
          when.defined((to) => $(`[title-to^="${to};"i]`), 30, titleTo).then((tooltip) => {
            const [to, title = ""] = tooltip.getAttribute("title-to").split(";");
            if (title.trim().length)
              new Tooltip(tooltip, title);
            tooltip.removeAttribute("title-to");
          });
          element2.setAttribute("tt-parsed", true);
        });
      }
    }, "handler"),
    /**
     * Undoes command parsing by resetting the stream title to its original plain text.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      const title = $('[data-a-target="stream-title"i]');
      if (defined(title))
        title.innerHTML = encodeHTML($('[data-a-target="stream-title"i]').innerText);
    }, "unhandler"),
    /**
     * Sets up the command parsing feature, registering the job and adding a listener to the chat input for command suggestions and auto-completion.
     */
    setup() {
      var _a3;
      $remark("Parsing title commands...");
      RegisterJob("parse_commands");
      let CSSBlockName = `Chat-Input-Menu:${new UUID()}`, AvailableCommands;
      (_a3 = $('[data-a-target="chat-input"i]')) == null ? void 0 : _a3.addEventListener("keyup", delay(async (event) => {
        var _a4, _b, _c, _d, _e, _f, _g, _h, _i, _j;
        let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event, value = (target == null ? void 0 : target.value) ?? (target == null ? void 0 : target.textContent) ?? (target == null ? void 0 : target.innerText), [tray, chat] = ((_b = (_a4 = target.closest("div:not([class])")) == null ? void 0 : _a4.firstElementChild) == null ? void 0 : _b.children) ?? [,], f = furnish;
        if (["Tab", "Space", "Enter", "Escape"].contains(code) || (value == null ? void 0 : value.contains(" ")) || !(value == null ? void 0 : value.startsWith("!"))) {
          const command = (_c = $(".tt-chat-input-suggestion")) == null ? void 0 : _c.getAttribute("command");
          if (code.equals("Tab") && defined(command)) {
            const match = value.match(/!(\S+|$)/), { index } = match, [text, word] = match;
            target.setRangeText(`!${command}`, index, index + text.length, "end");
          }
          (_d = tray == null ? void 0 : tray.classList) == null ? void 0 : _d.remove("tt-chat-input-tray__open");
          (_e = chat == null ? void 0 : chat.classList) == null ? void 0 : _e.remove("tt-chat-input-container__open");
          (_g = (_f = chat == null ? void 0 : chat.firstElementChild) == null ? void 0 : _f.classList) == null ? void 0 : _g.remove("tt-chat-input-container__input-wrapper");
          (_h = $("#tt-tcito1")) == null ? void 0 : _h.remove();
          return RemoveCustomCSSBlock(CSSBlockName);
        }
        value = value.slice(1).toLowerCase();
        const listable = (AvailableCommands ??= await STREAMER.coms).sort(
          (a, b) => a.command.toLowerCase().contains(value) && b.command.toLowerCase().missing(value) || defined(a.aliases.find((aka) => aka.toLowerCase().contains(value))) && nullish(b.aliases.find((aka) => aka.toLowerCase().contains(value))) ? -1 : b.command.toLowerCase().contains(value) && a.command.toLowerCase().missing(value) || defined(b.aliases.find((aka) => aka.toLowerCase().contains(value))) && nullish(a.aliases.find((aka) => aka.toLowerCase().contains(value))) ? 1 : 0
        ).slice(0, 30).map((data) => ({ ...data, textDistance: Math.min(...[data.command, ...data.aliases].map((string) => value.distanceFrom(string.toLowerCase()))) })).sort((a, b) => a.textDistance - b.textDistance).slice(0, 5);
        tray.classList.add("tt-chat-input-tray__open");
        chat.classList.add("tt-chat-input-container__open");
        chat.firstElementChild.classList.add("tt-chat-input-container__input-wrapper");
        if (listable.length < 1) {
          (_i = $("#tt-tcito1")) == null ? void 0 : _i.remove();
          tray.firstElementChild.append(
            f("#tt-tcito1").with(
              f(".tcito2").with(
                f(".tcito3").with(
                  f(
                    "div",
                    { style: `max-height:3rem!important` },
                    f(
                      "div",
                      { style: `padding: 0.05rem!important` },
                      f("span", { style: `color:var(--color-text-alt-2)!important` }, `No commands found.`)
                    )
                  )
                )
              )
            )
          );
        } else {
          (_j = $("#tt-tcito1")) == null ? void 0 : _j.remove();
          tray.firstElementChild.append(
            f("#tt-tcito1").with(
              f(".tcito2").with(
                f(".tcito3").with(
                  f(
                    "div",
                    { style: `max-height:18rem!important` },
                    f.div(
                      ...listable.map(({ aliases, command, reply: reply2, availability, enabled, origin, variables, textDistance }, index, array) => {
                        reply2 = parseCommands(reply2, variables);
                        const { href } = parseURL(reply2);
                        if (defined(href))
                          reply2 = f("a", { href: href.replace(/^(\w{3,}\.\w{2,})/, `https://$1`), style: `margin-right:0.75rem` }, reply2);
                        return f(`#tt-command--${command.replace(/[^\w\-]+/g, "")}`).with(
                          f(
                            "button.tcito7",
                            {
                              style: `cursor:${["not-allowed", "auto"][+enabled]}!important; color:${["inherit", "var(--color-text-success)"][+(textDistance < 1)]}`,
                              onmouseup: /* @__PURE__ */ __name(({ target: target2, button = -1 }) => {
                                var _a5, _b2;
                                if (button)
                                  return;
                                const command2 = (_a5 = $(".tt-chat-input-suggestion", target2.closest("[id]"))) == null ? void 0 : _a5.getAttribute("command");
                                if (defined(command2)) {
                                  const target3 = $('[data-a-target="chat-input"i]');
                                  const match = ((target3 == null ? void 0 : target3.value) ?? (target3 == null ? void 0 : target3.textContent) ?? (target3 == null ? void 0 : target3.innerText)).match(/!(\S+|$)/), { index: index2 } = match, [text, word] = match;
                                  target3.setRangeText(`!${command2}`, index2, index2 + text.length, "end");
                                  target3.focus();
                                }
                                tray.classList.remove("tt-chat-input-tray__open");
                                chat.classList.remove("tt-chat-input-container__open");
                                chat.firstElementChild.classList.remove("tt-chat-input-container__input-wrapper");
                                (_b2 = $("#tt-tcito1")) == null ? void 0 : _b2.remove();
                                return RemoveCustomCSSBlock(CSSBlockName);
                              }, "onmouseup")
                            },
                            f(".tcito8").with(
                              f(".tcito9").with(
                                f(
                                  "p.tt-chat-input-suggestion",
                                  { style: `word-break:break-word!important; color:${["inherit", "var(--color-text-error)"][+!enabled]}`, command },
                                  f("img.chat-badge", { src: Chat.badges.get(availability), availability, style: `margin:0 0.75rem 0 0; height:1.5rem; width:1.5rem` }),
                                  `!${command}`,
                                  f("span.tt-hide-inline-text-overflow", { style: `color:var(--color-text-alt-2); padding:0 0.75rem 0 0; position:absolute; right:0; max-width:50%`, title: reply2 }).html(reply2)
                                )
                              )
                            )
                          )
                        );
                      })
                    )
                  )
                )
              )
            )
          );
        }
        AddCustomCSSBlock(CSSBlockName, `
                .tt-chat-input-tray__open {
                    bottom: 100%;
                    margin: 0 -.5rem -.5rem;
                    min-width: 100%;

                    /* .bhOZBz */
                    background-color: var(--color-background-base) !important;
                    border: var(--border-width-default) solid var(--color-border-base) !important;
                    border-radius: 0.6rem !important;
                    display: block !important;

                    box-shadow: var(--shadow-elevation-1) !important;

                    position: absolute !important;
                    left: 0px !important;
                    right: 0px !important;
                    z-index: var(--z-index-below) !important;

                    padding: 0.5rem !important;
                }

                .tcito2 {
                    position: relative !important;
                    padding: 0.5rem 0.5rem 0 !important;
                }

                .tcito3 {
                    display: flex !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                }

                .tcito7 {
                    border-radius: var(--border-radius-small);
                    display: block;
                    width: 100%;
                    color: inherit;
                }

                .tcito7:hover {
                    background-color: var(--color-background-interactable-hover) !important;
                }

                .tcito8 {
                    -webkit-box-align: center !important;
                    -moz-box-align: center !important;
                    align-items: center !important;
                    display: flex !important;
                    padding-left: 0.5rem !important;
                    padding-right: 0.5rem !important;
                }

                .tcito9 {
                    padding: 0.5rem !important;
                    display: flex !important;
                    -webkit-box-pack: justify !important;
                    -moz-box-pack: justify !important;
                    justify-content: space-between !important;
                    -webkit-box-align: center !important;
                    -moz-box-align: center !important;
                    align-items: center !important;
                    -webkit-box-flex: 1 !important;
                    -moz-box-flex: 1 !important;
                    flex-grow: 1 !important;
                }

                .tt-chat-input-container__open {
                    border: 1px solid var(--color-border-base);
                    border-top: 0;
                    box-shadow: 0 2px 3px -1px rgba(0,0,0,.1),0 2px 2px -2px rgba(0,0,0,.02);
                    margin: 0 -.5rem -.5rem;
                    min-width: 100%;

                    /* .exNKnb */
                    background-color: var(--color-background-base)  !important;
                    border-bottom-left-radius: 0.6rem !important;
                    border-bottom-right-radius: 0.6rem !important;
                    display: block !important;
                    padding: 0.5rem !important;
                }

                .tt-chat-input-container__input-wrapper {
                    margin: 0 -1px -1px;
                }

                .tt-kb {
                    background-color: var(--color-background-alt) !important;
                    border: var(--border-width-default) solid var(--color-border-base) !important;
                    border-radius: 0.2rem !important;
                    display: inline-flex !important;
                    -webkit-box-align: center !important;
                    -moz-box-align: center !important;

                    align-items: center !important;
                    padding: 0 0.5rem !important;

                    /* .keyboard-prompt */
                    height: 1.5rem;
                    margin-right: .3rem;
                }

                .tt-kb-text {
                    color: var(--color-text-alt-2) !important;

                    /* .keyboard-prompt--text */
                    font-size: 1.1rem;
                }
            `);
      }, 250));
    }
  });

  // src/plugins/automation/auto-badge.js
  plugin({
    id: "auto_badge",
    timer: -1e3,
    /**
     * Adds broadcaster, moderator, and VIP badges to the Twitch chat autocomplete suggestions.
     */
    handler: /* @__PURE__ */ __name(() => {
      var _a3;
      (_a3 = $('[data-a-target="chat-input"i]')) == null ? void 0 : _a3.addEventListener("keyup", delay(async (event) => {
        let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event, value = (target == null ? void 0 : target.value) ?? (target == null ? void 0 : target.textContent) ?? (target == null ? void 0 : target.innerText), f = furnish;
        if (["Tab", "Space", "Enter", "Escape"].contains(code) || !(value == null ? void 0 : value.contains("@")))
          return;
        const elements = $.all('[class*="autocomplete"i] button[data-a-target^="@"]').isolate().filter(defined);
        for (const element of elements) {
          const name2 = element.dataset.aTarget.slice(1);
          const p = $("p", element);
          if (STREAMER.name.equals(name2) && $.nullish('img[data-badge="owner"i]', p))
            p.append(
              f.img({
                "@badge": "owner",
                src: Chat.badges.get("owner")
              })
            );
          if (Chat.mods.includes(name2) && $.nullish('img[data-badge="mod"i]', p))
            p.append(
              f.img({
                "@badge": "mod",
                src: Chat.badges.get("mod")
              })
            );
          if (Chat.vips.includes(name2) && $.nullish('img[data-badge="vip"i]', p))
            p.append(
              f.img({
                "@badge": "vip",
                src: Chat.badges.get("vip")
              })
            );
        }
      }, 100));
    }, "handler"),
    /**
     * Undoes auto-badge: Removes the added badges from the autocomplete suggestions.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      $.all('[class*="autocomplete"i] button[data-a-target^="@"] img[data-badge]').isolate().filter(defined).map((e) => e.remove());
    }, "unhandler"),
    /**
     * Checks if the auto-badge feature is enabled in settings.
     * @returns {boolean} Whether the feature should be active
     */
    enabled() {
      return nullish(Settings.auto_badge) || parseBool(Settings.auto_badge);
    },
    /**
     * Setup: Registers the auto-badge job and applies custom CSS for the badges.
     */
    setup() {
      $remark("Adding username-suggestion badges...");
      RegisterJob("auto_badge");
      AddCustomCSSBlock(`Username-Suggestion-Badges:${new UUID()}`, `
            img[data-badge] {
                display:inline-block;

                height:2rem;

                margin: 0 0 0 .75rem;
            }
        `);
    }
  });

  // src/plugins/automation/prevent-raiding.js
  var CONTINUE_RAIDING;
  var SHADOW_RAID;
  plugin({
    id: "prevent_raiding",
    timer: 1e4,
    /**
     * Resets the internal state variables for the raid prevention feature.
     */
    init() {
      CONTINUE_RAIDING = false;
      SHADOW_RAID = false;
    },
    /**
     * Runs every tick: Detects raids and decides whether to abort or continue based on the configured prevention method.
     * @param {Object} context - Execution context
     * @param {StopWatch} context.StopWatch - StopWatch utility for performance tracking
     */
    handler: /* @__PURE__ */ __name(async ({ StopWatch }) => {
      var _a3;
      new StopWatch("prevent_raiding");
      if (CONTINUE_RAIDING)
        return StopWatch.stop("prevent_raiding");
      const url = parseURL(location), data = url.searchParameters, raided = parseBool(((_a3 = data.referrer) == null ? void 0 : _a3.equals("raid")) || data.raided), raiding = $.defined('[data-test-selector="raid-banner"i]'), next = await GetNextStreamer(), raid_banner = $.all('[data-test-selector="raid-banner"i] strong').map((strong) => strong == null ? void 0 : strong.textContent), from = raided ? null : STREAMER.name, [to] = raided ? [STREAMER.name] : raid_banner.filter((name2) => name2.unlike(from));
      const method = Settings.prevent_raiding ?? "none";
      raid_stopper:
        if (raiding || raided || SHADOW_RAID) {
          top.onlocationchange = () => wait(5e3).then(() => CONTINUE_RAIDING = SHADOW_RAID = false);
          if (["greed", "unfollowed"].contains(method, SHADOW_RAID)) {
            if (raiding && method.equals("greed")) {
              $log(`[RAIDING] There is a possiblity to collect bonus points. Do not leave the raid.`, parseURL(`${location.origin}/${to}`).addSearch({ referrer: "raid", raided: true }).href);
              addToSearch({ referrer: "raid", raided: true });
              removeFromSearch(["redo"]);
              Cache.save({ LastRaid: { from, to, type: method } });
              CONTINUE_RAIDING = true;
              break raid_stopper;
            } else if (raiding && defined(STREAMERS.find((channel) => RegExp(`^${to}$`, "i").test(channel.name)))) {
              $log(`[RAIDING] ${to} is already followed. No need to leave the raid`);
              CONTINUE_RAIDING = true;
              break raid_stopper;
            } else if (raided && STREAMER.like) {
              $log(`[RAIDED] ${to} is already followed. No need to abort the raid`);
              Cache.save({ LastRaid: {} });
              removeFromSearch(["referrer", "raided"]);
              CONTINUE_RAIDING = true;
              break raid_stopper;
            }
          }
          STREAMER.onraid = async ({ raiding: raiding2, raided: raided2 }) => {
            CONTINUE_RAIDING = false;
            const next2 = await GetNextStreamer();
            raid_stopper:
              if (defined(next2)) {
                $log(`${STREAMER.name} ${raiding2 ? "is raiding" : "was raided"}. Moving onto next channel (${next2.name})`, next2.href, /* @__PURE__ */ new Date());
                if (raiding2 && ["greed"].contains(method))
                  break raid_stopper;
                if (UP_NEXT_ALLOW_THIS_TAB)
                  goto(parseURL(next2.href).addSearch({ tool: `raid-stopper--${method}` }).href);
                else
                  Runtime.sendMessage({ action: "STEAL_UP_NEXT", next: next2.href, from: STREAMER == null ? void 0 : STREAMER.name, method }, ({ next: next3, from: from2, method: method2 }) => {
                    $notice(`Stealing an Up Next job (raid): ${from2} → ${next3}`);
                    goto(parseURL(next3).addSearch({ tool: `raid-stopper--${method2}` }).href);
                  });
                const index = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF), [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1);
                if (UP_NEXT_ALLOW_THIS_TAB)
                  Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
              } else {
                $log(`${STREAMER.name} ${raiding2 ? "is raiding" : "was raided"}. There doesn't seem to be any followed channels on right now`, /* @__PURE__ */ new Date());
              }
          };
          CONTINUE_RAIDING = ["greed"].contains(method);
          for (const callback of STREAMER.__eventlisteners__.onraid)
            callback({ raiding, raided });
        }
      StopWatch.stop("prevent_raiding");
    }, "handler"),
    /**
     * Checks if the raid prevention feature is enabled in settings.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return (Settings.prevent_raiding ?? "none").unlike("none");
    },
    /**
     * Initializes raid prevention state from cache and sets up navigation listeners to track raid transitions.
     */
    setup() {
      Cache.load("LastRaid", ({ LastRaid }) => {
        var _a3;
        const { from, to, type } = LastRaid || {};
        SHADOW_RAID = (to == null ? void 0 : to.length) > 0 && ((_a3 = to == null ? void 0 : to.equals) == null ? void 0 : _a3.call(to, STREAMER == null ? void 0 : STREAMER.name)) ? type : false;
        Cache.save({ LastRaid: {} });
      });
      top.beforeleaving = top.onlocationchange = async ({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
        if (raiding || raided)
          CONTINUE_RAIDING = false;
      };
    }
  });

  // src/plugins/automation/greedy-raiding.js
  var GREEDY_RAIDING_FRAMES;
  plugin({
    id: "greedy_raiding",
    timer: 5e3,
    /**
     * Init: Initializes the map used to track greedy raiding frames.
     */
    init() {
      GREEDY_RAIDING_FRAMES = /* @__PURE__ */ new Map();
    },
    /**
     * Creates hidden iframes for all currently live followed channels to maintain connections.
     */
    handler: /* @__PURE__ */ __name(() => {
      const online = [STREAMER, ...STREAMERS].filter(isLive).filter(({ name: name2 }) => name2.unlike(STREAMER.name)), container = $("#tt-greedy-raiding--container") ?? furnish("#tt-greedy-raiding--container", {
        style: new CSSObject(`
                        display: none;
                        visibility: hidden;

                        position: absolute;
                        top: -100vh;
                        left: -100vw;

                        height: 0;
                        width: 0;
                    `, true).toString("all")
      });
      for (const channel of online) {
        const { name: name2 } = channel;
        const frame = $(`#tt-greedy-raiding--${name2}`) ?? furnish(`iframe#tt-greedy-raiding--${name2}`, {
          src: `./popout/${name2}/chat?hidden=true&parent=twitch.tv&current=${STREAMER.name.equals(name2)}&allow=greedy_raiding`,
          destroy: setTimeout((name3) => {
            var _a3;
            return (_a3 = $(`#tt-greedy-raiding--${name3}`)) == null ? void 0 : _a3.remove();
          }, 12e4, name2)
          // sandbox: `allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals`,
        });
        GREEDY_RAIDING_FRAMES.set(channel.name, frame);
        if ([...container.children].missing(frame))
          container.append(frame);
      }
      if ([...$.body.children].missing(container))
        $.body.append(container);
    }, "handler"),
    /**
     * Undoes greedy-raiding: Removes all created raiding iframes.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      for (const [name2, frame] of GREEDY_RAIDING_FRAMES)
        frame == null ? void 0 : frame.remove();
    }, "unhandler"),
    /**
     * Checks if greedy raiding is enabled in settings and allowed in the current tab.
     * @returns {boolean} Whether the feature should be active
     */
    enabled() {
      return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.greedy_raiding);
    },
    setup() {
      $remark("Adding raid-watching logic...");
    }
  });

  // src/plugins/automation/stay-live.js
  var ClearIntent;
  var twitch_pathnames;
  var reserved_twitch_pathnames;
  var WATCHED_LIVE;
  var USER_INTENT;
  plugin({
    id: "stay_live",
    timer: 3e3,
    /**
     * Initializes state and path patterns used to track live channel visits.
     */
    init() {
      ClearIntent = void 0;
      WATCHED_LIVE = void 0;
      USER_INTENT = void 0;
      twitch_pathnames = [
        USERNAME,
        ...TWITCH_PATHNAMES
      ];
      reserved_twitch_pathnames = RegExp(`/(${twitch_pathnames.join("|")})`, "i");
    },
    /**
     * Automatically navigates to the next live followed channel when the current streamer goes offline.
     * @param {Object} params - Execution context
     * @param {StopWatch} params.StopWatch - Timer for performance tracking
     * @returns {Promise<void>}
     */
    handler: /* @__PURE__ */ __name(async ({ StopWatch }) => {
      var _a3, _b, _c, _d, _e, _f;
      new StopWatch("stay_live");
      const next = await GetNextStreamer(STREAMER.name), { pathname } = location;
      try {
        await Cache.load("UserIntent", async ({ UserIntent }) => {
          if (parseBool(UserIntent))
            TWITCH_PATHNAMES.push(USER_INTENT = UserIntent);
          Cache.remove("UserIntent");
        });
      } catch (error) {
        return StopWatch.stop("stay_live"), Cache.remove("UserIntent");
      }
      const ignoreReruns = parseBool(Settings.stay_live__ignore_channel_reruns);
      if (STREAMER.live && !(ignoreReruns && STREAMER.redo))
        WATCHED_LIVE = STREAMER.name;
      NotLive:
        if (!STREAMER.live || parseBool(Settings.stay_live__ignore_channel_reruns) && STREAMER.redo) {
          if (reserved_twitch_pathnames.test(pathname))
            break NotLive;
          if (!RegExp(STREAMER == null ? void 0 : STREAMER.name, "i").test(PATHNAME))
            break NotLive;
          const broughtHere = defined((_a3 = parseURL(location).searchParameters) == null ? void 0 : _a3.tool);
          if (((_b = USER_INTENT == null ? void 0 : USER_INTENT.equals) == null ? void 0 : _b.call(USER_INTENT, STREAMER == null ? void 0 : STREAMER.name)) || !(((_c = WATCHED_LIVE == null ? void 0 : WATCHED_LIVE.equals) == null ? void 0 : _c.call(WATCHED_LIVE, STREAMER == null ? void 0 : STREAMER.name)) || broughtHere))
            break NotLive;
          if (defined(next)) {
            $warn(`${STREAMER == null ? void 0 : STREAMER.name} is no longer live. Moving onto next channel (${next.name})`, next.href, /* @__PURE__ */ new Date());
            REDO_FIRST_IN_LINE_QUEUE((_f = (_e = (_d = parseURL(FIRST_IN_LINE_HREF)) == null ? void 0 : _d.addSearch) == null ? void 0 : _e.call(_d, { from: STREAMER == null ? void 0 : STREAMER.name })) == null ? void 0 : _f.href);
            const index = ALL_FIRST_IN_LINE_JOBS.indexOf(FIRST_IN_LINE_HREF), [removed] = index < 0 ? [] : ALL_FIRST_IN_LINE_JOBS.splice(index, 1);
            if (UP_NEXT_ALLOW_THIS_TAB)
              Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                var _a4, _b2, _c2;
                return goto(((_c2 = (_b2 = (_a4 = parseURL(next.href)) == null ? void 0 : _a4.addSearch) == null ? void 0 : _b2.call(_a4, { obit: STREAMER == null ? void 0 : STREAMER.name, tool: "stay-live" })) == null ? void 0 : _c2.href) ?? "?tool=stay-live");
              });
            else
              Runtime.sendMessage({ action: "STEAL_UP_NEXT", next: next.href, obit: STREAMER == null ? void 0 : STREAMER.name }, ({ next: next2, obit }) => {
                $notice(`Stealing an Up Next job (stay live): ${obit} → ${next2}`);
                goto(parseURL(next2).addSearch({ obit, tool: "stay-live--steal" }).href);
              });
          } else {
            $warn(`${STREAMER == null ? void 0 : STREAMER.name} is no longer live. There doesn't seem to be any followed channels on right now`, /* @__PURE__ */ new Date());
          }
          ClearIntent ??= setTimeout(Cache.remove, 3e4, "UserIntent");
        } else if (/\/search\b/i.test(pathname)) {
          const { term } = parseURL(location).searchParameters;
          Cache.save({ UserIntent: term });
        }
      StopWatch.stop("stay_live");
    }, "handler"),
    /**
     * Setup: Logs the initialization of the stay-live feature.
     */
    setup() {
      $remark("Ensuring Twitch stays live...");
    }
  });

  // src/plugins/automation/time-zones.js
  var TIME_ZONE__TEXT_MATCHES;
  var TIME_ZONE__REGEXPS;
  var TIME_ZONE__CONVERSIONS;
  var GEOGRAPHIC__CONVERSIONS;
  var NON_TIME_ZONE_WORDS;
  var convertWordsToTimes;
  plugin({
    id: "time_zones",
    timer: 250,
    /**
     * Initializes time zone conversion utilities, including natural language time parsing and timezone mapping data.
     */
    async init() {
      convertWordsToTimes = /* @__PURE__ */ __name(function convertWordsToTimes2(string = "") {
        return string.normalize("NFKD").replace(/\b(after\s?noons?|evenings?)\b/i, "01:00 PM").replace(/\b(noons?|lunch[\s\-]?time)\b/i, "12:00 PM").replace(/\b(mid[\s\-]?nights?)\b/i, "12:00 AM").replace(/\b(?:to|2)(?:day|night|m[or]*w)\b/ig, ($0, $$, $_) => $0.split("").join("‍")).replace(/\b(?<start>\d{1,2}(?::?\d\d)?)(?<premeridiem>\s*[ap]\.?m?\.?)?(?<delimeter>[\p{Pd}\p{Zs}]+)(?<stop>\d{1,2}(?::?\d\d)?)(?<postmeridiem>\s*[ap]\.?m?\.?)?\s*(?<timezone>\b(?:AOE|GMT|UTC|[A-Y]{1,4}T))\b/igu, ($0, start2, preMeridiem, delimeter, stop, postMeridiem, timezone, $$, $_) => {
          var _a3;
          const autoMeridiem = "AP"[+(new Date(((_a3 = STREAMER.data) == null ? void 0 : _a3.actualStartTime) ?? +/* @__PURE__ */ new Date()).getHours() > 11)] + "M";
          preMeridiem ||= postMeridiem || autoMeridiem;
          postMeridiem ||= preMeridiem;
          const _mm = /(?<!:\d\d)$/, _00 = ":00";
          start2 = start2.replace(_mm, _00);
          stop = stop.replace(_mm, _00);
          return [start2, preMeridiem, delimeter, stop, postMeridiem, " ", timezone].join("");
        });
      }, "convertWordsToTimes");
      TIME_ZONE__TEXT_MATCHES = [];
      TIME_ZONE__REGEXPS = [
        // Natural
        // 3:00PM EST | 3PM EST | 3:00P EST | 3P EST | 3:00 EST | 3 EST | 3:00PM (EST) | 3PM (EST) | 3:00P (EST) | 3P (EST) | 3:00 (EST) | 3 (EST)
        new RegExp("(?<![#\\$\\.+:\\d%‰]|\\p{Sc})\\b(?<hour>2[0-3]|[01]?\\d)(?<minute>:[0-5]\\d)?(?!\\d*(?:\\p{Sc}|[%‰]))[ \\t]*(?<meridiem>[ap]\\.?m?\\.?(?!\\p{L}|\\p{N}))?[ \\t]*(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\\d)(?::?[0-5]\\d)?)?|[A-Y]{1,4}T)\\b|\\([ \\t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\\d)(?::?[0-5]\\d)?)?|[A-Y]{1,4}T)[ \\t]*\\))", "iu"),
        // 15:00 EST | 1500 EST
        new RegExp("(?<![#\\$\\.+:\\d%‰]|\\p{Sc})\\b(?<hour>2[0-3]|[01]?\\d)(?<minute>:?[0-5]\\d)[ \\t]*(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\\d)(?::?[0-5]\\d)?)?|[A-Y]{1,4}T)\\b|\\([ \\t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\\d)(?::?[0-5]\\d)?)?|[A-Y]{1,4}T)[ \\t]*\\))", "iu"),
        // EST 3:00PM | EST 3PM | EST 3:00P | EST 3P | EST 3:00 | EST 3
        new RegExp("(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\\d)(?::?[0-5]\\d)?)?|[A-Y]{1,4}T)\\b|\\([ \\t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\\d)(?::?[0-5]\\d)?)?|[A-Y]{1,4}T)[ \\t]*\\))[ \\t]*(?<hour>2[0-3]|[01]?\\d)(?<minute>:[0-5]\\d)?(?!\\d*(?:\\p{Sc}|[%‰])|[b-oq-z])[ \\t]*(?<meridiem>[ap]\\.?m?\\.?(?!\\p{L}|\\p{N}))?", "iu"),
        // EST 15:00 | EST 1500
        new RegExp("(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\\d)(?::?[0-5]\\d)?)?|[A-Y]{1,4}T)\\b|\\([ \\t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\\d)(?::?[0-5]\\d)?)?|[A-Y]{1,4}T)[ \\t]*\\))[ \\t]*(?<hour>2[0-3]|[01]?\\d)(?<minute>:?[0-5]\\d)(?!\\d*(?:\\p{Sc}|[%‰]))", "iu"),
        // 3:00PM | 3PM
        new RegExp("(?<![#\\$\\.+:\\d%‰]|\\p{Sc})\\b(?<hour>2[0-3]|[01]?\\d)(?<minute>:[0-5]\\d)?(?!\\d*(?:\\p{Sc}|[%‰]))[ \\t]*(?<meridiem>[ap]\\.?m?\\.?(?!\\p{L}|\\p{N}))", "iu"),
        // 15:00
        new RegExp("(?<![#\\$\\.+:\\d%‰]|\\p{Sc})\\b(?<hour>2[0-3]|[01]?\\d)(?<minute>:[0-5]\\d)[ \\t]*", "iu"),
        // Zulu - https://stackoverflow.com/a/23421472/4211612
        // Z15:00 | Z1500 | +5:00 | -5:00 | +0500 | -0500
        new RegExp("(?<![#\\$\\.+:\\d%‰]|\\p{Sc})\\b(?<offset>Z|[+-])(?<hour>2[0-3]|[01]\\d)(?<minute>:?[0-5]\\d)(?!\\d*(?:\\p{Sc}|[%‰]))\\b", "iu"),
        // GMT/UTC
        // GMT+5:00 | GMT-5:00 | GMT+0500 | GMT-0500 | GMT+05 | GMT-05 | GMT+5 | GMT-5 | UTC+5:00 | UTC-5:00 | UTC+0500 | UTC-0500 | UTC+05 | UTC-05 | UTC+5 | UTC-5
        new RegExp("(?<![#\\$\\.+:\\d%‰]|\\p{Sc})\\b(?:GMT[ \\t]*|UTC[ \\t]*)(?<offset>[+-])(?<hour>2[0-3]|[01]?\\d)(?<minute>:?[0-5]\\d)?(?!\\d*(?:\\p{Sc}|[%‰]))\\b", "iu")
      ];
      TIME_ZONE__CONVERSIONS = {
        AOE: "-12:00",
        GMT: "+00:00",
        UTC: "+00:00",
        // "Normal" timezones
        ACT: "+09:30",
        AET: "+10:00",
        AGT: "-03:00",
        ART: "+02:00",
        AST: "-09:00",
        BET: "-03:00",
        BST: "+06:00",
        CAT: "-01:00",
        CNT: "-03:30",
        CST: "-06:00",
        CDT: "-05:00",
        CTT: "+08:00",
        EAT: "+03:00",
        ECT: "+01:00",
        EET: "+02:00",
        EST: "-05:00",
        EDT: "-04:00",
        HST: "-10:00",
        IET: "-05:00",
        IST: "+05:30",
        JST: "+09:00",
        MET: "+03:30",
        MIT: "-11:00",
        MST: "-07:00",
        MDT: "-06:00",
        NET: "+04:00",
        NST: "+12:00",
        PLT: "+05:00",
        PNT: "-07:00",
        PRT: "-04:00",
        PST: "-08:00",
        PDT: "-07:00",
        SST: "+11:00",
        VST: "+07:00",
        // "Other" timezones - https://www.timeanddate.com/time/zones/
        // There are some conflicting entries--I chose to stick with the first entry
        ACDT: "+10:30",
        ACST: "+09:30",
        ACWST: "+08:45",
        ADT: "+04:00",
        AEDT: "+11:00",
        AEST: "+10:00",
        AFT: "+04:30",
        AKDT: "-08:00",
        AKST: "-09:00",
        ALMT: "+06:00",
        AMST: "-03:00",
        AMT: "-04:00",
        ANAST: "+12:00",
        ANAT: "+12:00",
        AQTT: "+05:00",
        AWDT: "+09:00",
        AWST: "+08:00",
        AZOST: "+0:00",
        AZOT: "-01:00",
        AZST: "+05:00",
        AZT: "+04:00",
        BNT: "+08:00",
        BOT: "-04:00",
        BRST: "-02:00",
        BRT: "-03:00",
        BTT: "+06:00",
        CAST: "+08:00",
        CCT: "+06:30",
        CEST: "+02:00",
        CET: "+01:00",
        CHADT: "+13:45",
        CHAST: "+12:45",
        CHOST: "+09:00",
        CHOT: "+08:00",
        CHUT: "+10:00",
        CIDST: "-04:00",
        CIST: "-05:00",
        CKT: "-10:00",
        CLST: "-03:00",
        CLT: "-04:00",
        COT: "-05:00",
        CVT: "-01:00",
        CXT: "+07:00",
        CHST: "+10:00",
        DAVT: "+07:00",
        DDUT: "+10:00",
        EASST: "-05:00",
        EAST: "-06:00",
        EEST: "+03:00",
        EGST: "+0:00",
        EGT: "-01:00",
        FET: "+03:00",
        FJST: "+13:00",
        FJT: "+12:00",
        FKST: "-03:00",
        FKT: "-04:00",
        FNT: "-02:00",
        GALT: "-06:00",
        GAMT: "-09:00",
        GET: "+04:00",
        GFT: "-03:00",
        GILT: "+12:00",
        GST: "+04:00",
        GYT: "-04:00",
        HDT: "-09:00",
        HKT: "+08:00",
        HOVST: "+08:00",
        HOVT: "+07:00",
        ICT: "+07:00",
        IDT: "+03:00",
        IOT: "+06:00",
        IRDT: "+04:30",
        IRKST: "+09:00",
        IRKT: "+08:00",
        IRST: "+03:30",
        KGT: "+06:00",
        KOST: "+11:00",
        KRAST: "+08:00",
        KRAT: "+07:00",
        KST: "+09:00",
        KUYT: "+04:00",
        LHDT: "+11:00",
        LHST: "+10:30",
        LINT: "+14:00",
        MAGST: "+12:00",
        MAGT: "+11:00",
        MART: "-09:30",
        MAWT: "+05:00",
        MHT: "+12:00",
        MMT: "+06:30",
        MSD: "+04:00",
        MSK: "+03:00",
        MUT: "+04:00",
        MVT: "+05:00",
        MYT: "+08:00",
        NCT: "+11:00",
        NDT: "-02:30",
        NFDT: "+12:00",
        NFT: "+11:00",
        NOVST: "+07:00",
        NOVT: "+07:00",
        NPT: "+05:45",
        NRT: "+12:00",
        NUT: "-11:00",
        NZDT: "+13:00",
        NZST: "+12:00",
        OMSST: "+07:00",
        OMST: "+06:00",
        ORAT: "+05:00",
        PET: "-05:00",
        PETST: "+12:00",
        PETT: "+12:00",
        PGT: "+10:00",
        PHOT: "+13:00",
        PHT: "+08:00",
        PKT: "+05:00",
        PMDT: "-02:00",
        PMST: "-03:00",
        PONT: "+11:00",
        PWT: "+09:00",
        PYST: "-03:00",
        PYT: "-04:00",
        QYZT: "+06:00",
        RET: "+04:00",
        ROTT: "-03:00",
        SAKT: "+11:00",
        SAMT: "+04:00",
        SAST: "+02:00",
        SBT: "+11:00",
        SCT: "+04:00",
        SGT: "+08:00",
        SRET: "+11:00",
        SRT: "-03:00",
        SYOT: "+03:00",
        TAHT: "-10:00",
        TFT: "+05:00",
        TJT: "+05:00",
        TKT: "+13:00",
        TLT: "+09:00",
        TMT: "+05:00",
        TOST: "+14:00",
        TOT: "+13:00",
        TRT: "+03:00",
        TVT: "+12:00",
        ULAST: "+09:00",
        ULAT: "+08:00",
        UYST: "-02:00",
        UYT: "-03:00",
        UZT: "+05:00",
        VET: "-04:00",
        VLAST: "+11:00",
        VLAT: "+10:00",
        VOST: "+06:00",
        VUT: "+11:00",
        WAKT: "+12:00",
        WARST: "-03:00",
        WAST: "+02:00",
        WAT: "+01:00",
        WEST: "+01:00",
        WET: "+0:00",
        WFT: "+12:00",
        WGST: "-02:00",
        WGT: "-03:00",
        WIB: "+07:00",
        WIT: "+09:00",
        WITA: "+08:00",
        WST: "+13:00",
        YAKST: "+10:00",
        YAKT: "+09:00",
        YAPT: "+10:00",
        YEKST: "+06:00",
        YEKT: "+05:00"
      };
      GEOGRAPHIC__CONVERSIONS = {
        "Acre": "-05:00",
        "Adak": "-10:00",
        "Adelaide": "+09:30",
        "Afghanistan": "+04:30",
        "Akrotiri": "+02:00",
        "Aktobe": "+05:00",
        "Åland Islands": "+02:00",
        "Alaska": "-09:00",
        "Albania": "+01:00",
        "Alberta": "-07:00",
        "Aleutian Islands": "-10:00",
        "Algeria": "+01:00",
        "Almaty": "+06:00",
        "Altai Krai": "+07:00",
        "Altai Republic": "+07:00",
        "Amapá": "-03:00",
        "Amazon": "-04:00",
        "Amazon (Campo Grande)": "-04:00",
        "Amazon (Cuiaba)": "-04:00",
        "Amazonas": "-04:00",
        "Amazonas State": "-04:00",
        "American Samoa": "-11:00",
        "Amsterdam Islands": "+05:00",
        "Amundsen–Scott": "+12:00",
        "Amundsen–Scott South Pole Station": "+12:00",
        "Amur Oblast": "+09:00",
        "Anadyr": "+12:00",
        "Anchorage": "-09:00",
        "Andorra": "+01:00",
        "Angola": "+01:00",
        "Anguilla": "-04:00",
        "Antigua & Barbuda": "-04:00",
        "Anywhere on Earth": "-12:00",
        "Apia": "-11:00",
        "Aqtau": "+05:00",
        "Aqtobe": "+05:00",
        "Arabian": "+03:00",
        "Araguaina": "-03:00",
        "Argentina": "-03:00",
        "Armenia": "+04:00",
        "Aruba": "-04:00",
        "Ascension": "+00:00",
        "Astrakhan": "+04:00",
        "Astrakhan Oblast": "+04:00",
        "Atikokan": "-05:00",
        "Atlantic": "-04:00",
        "Atyrau": "+05:00",
        "Austral Islands": "-10:00",
        "Australian Capital Territory": "+10:00",
        "Australian Central": "+09:30",
        "Australian Central Western": "+08:45",
        "Australian Eastern": "+09:30",
        "Australian Western": "+08:00",
        "Austria": "+01:00",
        "Autonomous Region of Bougainville": "+11:00",
        "Azerbaijan": "+04:00",
        "Azores": "-01:00",
        "Bahamas": "-05:00",
        "Bahia": "-03:00",
        "Bahia Banderas": "-06:00",
        "Bahrain": "+03:00",
        "Baja California": "-08:00",
        "Baja California Sur": "-07:00",
        "Baker Island": "-12:00",
        "Bali": "+08:00",
        "Bangka Belitung Islands": "+07:00",
        "Bangladesh": "+06:00",
        "Barbados": "-04:00",
        "Barnaul": "+07:00",
        "Bas-Uele": "+02:00",
        "Bashkortostan": "+05:00",
        "Bayan-Ölgii": "+07:00",
        "Belarus": "+03:00",
        "Belem": "-03:00",
        "Belgium": "+01:00",
        "Belize": "-06:00",
        "Benin": "+01:00",
        "Bermuda": "-04:00",
        "Beulah": "-06:00",
        "Bhutan": "+06:00",
        "Blanc-Sablon": "-04:00",
        "Boa Vista": "-04:00",
        "Boise": "-07:00",
        "Bolivia": "-04:00",
        "Bosnia & Herzegovina": "+01:00",
        "Botswana": "+02:00",
        "Bougainville": "+11:00",
        "Brasilia": "-03:00",
        "Brazil": "-03:00",
        "Brazzaville": "+01:00",
        "Brisbane": "+10:00",
        "British Columbia": "-08:00",
        "British Indian Ocean Territory": "+06:00",
        "British Virgin Islands": "-04:00",
        "Broken Hill": "+09:30",
        "Brunei": "+08:00",
        "Brunei Darussalam": "+08:00",
        "Buenos Aires": "-03:00",
        "Bulgaria": "+02:00",
        "Burkina Faso": "+00:00",
        "Burundi": "+02:00",
        "Buryatia": "+08:00",
        "Busingen": "+01:00",
        "Caicos Islands": "-05:00",
        "Cambodia": "+07:00",
        "Cambridge Bay": "-07:00",
        "Cameroon": "+01:00",
        "Campo Grande": "-04:00",
        "Canary": "+00:00",
        "Canary Islands": "+00:00",
        "Cancun": "-05:00",
        "Cantung Mine": "-08:00",
        "Cape Verde": "-01:00",
        "Caribbean Islands": "-04:00",
        "Caribbean Municipalities": "-04:00",
        "Caribbean Netherlands": "-04:00",
        "Casey": "+11:00",
        "Casey Station": "+11:00",
        "Catamarca": "-03:00",
        "Cayman Islands": "-05:00",
        "Center": "-06:00",
        "Central": "-06:00",
        "Central Africa": "-01:00",
        "Central African": "-01:00",
        "Central African Republic": "+01:00",
        "Central Australia": "+09:30",
        "Central European": "+01:00",
        "Central Indonesia": "+08:00",
        "Central Nunavut": "-06:00",
        "Central Sakha Republic": "+10:00",
        "Ceuta": "+01:00",
        "Chad": "+01:00",
        "Chamorro": "+10:00",
        "Chatham": "+12:45",
        "Chatham Islands": "+12:45",
        "Chelyabinsk Oblast": "+05:00",
        "Chicago": "-06:00",
        "Chihuahua": "-07:00",
        "Chile": "-04:00",
        "Chilean Antarctica": "-03:00",
        "China": "+08:00",
        "Chita": "+09:00",
        "Choibalsan": "+08:00",
        "Christmas Island": "+07:00",
        "Chukotka": "+12:00",
        "Chuuk": "+10:00",
        "Chuuk and Yap": "+10:00",
        "Clipperton Island": "-08:00",
        "Cocos (Keeling) Islands": "+06:30",
        "Cocos Islands": "+06:30",
        "Colombia": "-05:00",
        "Comoros": "+03:00",
        "Congo": "+01:00",
        "Cook Islands": "-10:00",
        "Coordinated Universal": "+00:00",
        "Cordoba": "-03:00",
        "Costa Rica": "-06:00",
        "Creston": "-07:00",
        "Croatia": "+01:00",
        "Crozet Islands": "+04:00",
        "Cuba": "-05:00",
        "Cuiaba": "-04:00",
        "Curaçao": "-04:00",
        "Currie": "+10:00",
        "Czechia": "+01:00",
        "Côte d’Ivoire": "+00:00",
        "Danmarkshavn": "+00:00",
        "Danmarkshavn Weather Station": "+00:00",
        "Darwin": "+09:30",
        "Davis": "+07:00",
        "Davis Station": "+07:00",
        "Dawson": "-08:00",
        "Dawson Creek": "-07:00",
        "Denmark": "+01:00",
        "Denver": "-07:00",
        "Detroit": "-05:00",
        "Dhekelia": "+02:00",
        "Distrito Federal": "-03:00",
        "Djibouti": "+03:00",
        "Dominica": "-04:00",
        "Dominican Republic": "-04:00",
        "Dumont d’Urville": "+10:00",
        "Dumont-d'Urville Station": "+10:00",
        "Dumont-d’Urville": "+10:00",
        "East Africa": "+03:00",
        "East African": "+03:00",
        "East Brazilian Islands": "-02:00",
        "East Greenland": "-01:00",
        "East Kalimantan": "+08:00",
        "East Kazakhstan": "+06:00",
        "East Nunavut": "-05:00",
        "East Nusa Tenggara": "+08:00",
        "East Ontario": "-05:00",
        "East Quebec": "-04:00",
        "East Sakha": "+11:00",
        "East Timor": "+09:00",
        "Easter": "-06:00",
        "Easter Island": "-06:00",
        "Eastern": "-05:00",
        "Eastern Africa": "+03:00",
        "Eastern Australia": "+10:00",
        "Eastern European": "+02:00",
        "Eastern Indonesia": "+09:00",
        "Ecuador": "-05:00",
        "Edmonton": "-07:00",
        "Egypt": "+02:00",
        "Egyptian": "+02:00",
        "Eire": "+00:00",
        "Eirunepe": "-05:00",
        "El Salvador": "-06:00",
        "Enderbury": "+13:00",
        "Équateur": "+01:00",
        "Equatorial Guinea": "+01:00",
        "Eritrea": "+03:00",
        "Estonia": "+02:00",
        "Ethiopia": "+03:00",
        "Eucla": "+08:45",
        "European Russia": "+03:00",
        "Falkland Islands": "-03:00",
        "Famagusta": "+02:00",
        "Faroe Islands": "+00:00",
        "Fernando de Noronha": "-02:00",
        "Fiji": "+12:00",
        "Finland": "+02:00",
        "Fort Nelson": "-07:00",
        "Fortaleza": "-03:00",
        "France": "+01:00",
        "French Guiana": "-03:00",
        "French Southern & Antarctic": "+05:00",
        "French Southern Territories": "+05:00",
        "Futuna": "+12:00",
        "Gabon": "+01:00",
        "Galapagos": "-06:00",
        "Galápagos Province": "-06:00",
        "Gambia": "+00:00",
        "Gambier": "-09:00",
        "Gambier Islands": "-09:00",
        "Gaza": "+02:00",
        "Georgia": "+04:00",
        "Germany": "+01:00",
        "Ghana": "+00:00",
        "Gibraltar": "+01:00",
        "Gilbert Islands": "+12:00",
        "Glace Bay": "-04:00",
        "Goiás": "-03:00",
        "Goose Bay": "-04:00",
        "Great Lakes": "-06:00",
        "Greece": "+02:00",
        "Greenland": "-03:00",
        "Greenwich Mean": "+00:00",
        "Grenada": "-04:00",
        "Guadeloupe": "-04:00",
        "Guam": "+10:00",
        "Guatemala": "-06:00",
        "Guernsey": "+00:00",
        "Guinea": "+00:00",
        "Guinea-Bissau": "+00:00",
        "Gulf": "+04:00",
        "Gulf Coast": "-06:00",
        "Guyana": "-04:00",
        "Haiti": "-05:00",
        "Halifax": "-04:00",
        "Haut-Katanga": "+02:00",
        "Haut-Lomami": "+02:00",
        "Haut-Uele": "+02:00",
        "Hawaii": "-10:00",
        "Hawaii-Aleutian": "-10:00",
        "Heard Islands": "+05:00",
        "Hebron": "+02:00",
        "Hermosillo": "-07:00",
        "Hobart": "+10:00",
        "Honduras": "-06:00",
        "Hong Kong": "+08:00",
        "Hong Kong SAR China": "+08:00",
        "Honolulu": "-10:00",
        "Hovd": "+07:00",
        "Howland Island": "-12:00",
        "Hungary": "+01:00",
        "Iceland": "+00:00",
        "India": "+05:30",
        "Indian": "",
        "Indian Ocean": "+06:00",
        "Indian Pacific (Port Augusta)": "+08:00",
        "Indianapolis": "-05:00",
        "Indochina": "+07:00",
        "Inuvik": "-07:00",
        "Iqaluit": "-05:00",
        "Iran": "+03:30",
        "Iraq": "+03:00",
        "Ireland": "+00:00",
        "Irkutsk": "+08:00",
        "Irkutsk Oblast": "+08:00",
        "Islands of Maluku Islands": "+09:00",
        "Islands of Sulawesi": "+08:00",
        "Islands of Sumatra": "+07:00",
        "Isle of Man": "+00:00",
        "Israel": "+02:00",
        "Italy": "+01:00",
        "Ittoqqortoormiit": "-01:00",
        "Ituri Interim Administration": "+02:00",
        "Jakarta": "+07:00",
        "Jamaica": "-05:00",
        "Japan": "+09:00",
        "Jarvis Island": "-11:00",
        "Java": "+07:00",
        "Jayapura": "+09:00",
        "Jersey": "+00:00",
        "Jewish Autonomous Oblast": "+10:00",
        "Jewish Oblast": "+10:00",
        "Johnston": "-10:00",
        "Johnston Atoll": "-10:00",
        "Jordan": "+02:00",
        "Jujuy": "-03:00",
        "Juneau": "-09:00",
        "Kalgoorlie": "+08:00",
        "Kalimantan": "+07:00",
        "Kaliningrad": "+02:00",
        "Kaliningrad Oblast": "+02:00",
        "Kamchatka": "+12:00",
        "Kamchatka Krai": "+12:00",
        "Kasaï": "+02:00",
        "Kasaï Oriental": "+02:00",
        "Kasaï-Central": "+02:00",
        "Keeling Islands": "+06:30",
        "Kemerovo": "+07:00",
        "Kemerovo Oblast": "+07:00",
        "Kenya": "+03:00",
        "Kerguelen Islands": "+05:00",
        "Khabarovsk Krai": "+10:00",
        "Khakassia": "+07:00",
        "Khandyga": "+09:00",
        "Khanty–Mansia": "+05:00",
        "Khovd": "+07:00",
        "Kingman Reef": "-11:00",
        "Kinshasa": "+01:00",
        "Kiritimati": "+14:00",
        "Kirov": "+03:00",
        "Knox": "-06:00",
        "Kongo Central": "+01:00",
        "Korean": "+09:00",
        "Kosrae": "+11:00",
        "Kosrae and Pohnpei": "+11:00",
        "Krasnoyarsk": "+07:00",
        "Krasnoyarsk Krai": "+07:00",
        "Kuching": "+08:00",
        "Kurgan Oblast": "+05:00",
        "Kuwait": "+03:00",
        "Kwajalein": "+12:00",
        "Kwango": "+01:00",
        "Kwilu": "+01:00",
        "Kyrgyzstan": "+06:00",
        "Kyzylorda": "+05:00",
        "La Rioja": "-03:00",
        "Labrador": "-04:00",
        "Laos": "+07:00",
        "Latvia": "+02:00",
        "Lebanon": "+02:00",
        "Lesotho": "+02:00",
        "Liberia": "+00:00",
        "Libya": "+02:00",
        "Liechtenstein": "+01:00",
        "Lindeman": "+10:00",
        "Line Islands": "+14:00",
        "Lithuania": "+02:00",
        "Lloydminster": "-07:00",
        "Lomami": "+02:00",
        "Lord Howe": "+10:30",
        "Lord Howe Island": "+10:30",
        "Los Angeles": "-08:00",
        "Louisville": "-05:00",
        "Lualaba": "+02:00",
        "Lubumbashi": "+02:00",
        "Luxembourg": "+01:00",
        "Macau SAR China": "+08:00",
        "Macedonia": "+01:00",
        "Maceio": "-03:00",
        "Macquarie": "+11:00",
        "Macquarie Island": "+11:00",
        "Madagascar": "+03:00",
        "Madeira": "+00:00",
        "Madura": "+07:00",
        "Magadan": "+11:00",
        "Magadan Oblast": "+11:00",
        "Magallanes": "-03:00",
        "Mai-Ndombe": "+01:00",
        "Makassar": "+08:00",
        "Malawi": "+02:00",
        "Malaysia": "+08:00",
        "Maldives": "+05:00",
        "Mali": "+00:00",
        "Malta": "+01:00",
        "Manaus": "-04:00",
        "Mangystau": "+05:00",
        "Maniema": "+02:00",
        "Manitoba": "-06:00",
        "Marengo": "-05:00",
        "Marquesas": "-09:30",
        "Marquesas Islands": "-09:30",
        "Marshall Islands": "+12:00",
        "Martim Vaz": "-02:00",
        "Martinique": "-04:00",
        "Matamoros": "-06:00",
        "Mato Grosso": "-04:00",
        "Mato Grosso do Sul": "-04:00",
        "Mauritania": "+00:00",
        "Mauritius": "+04:00",
        "Mawson": "+05:00",
        "Mawson Station": "+05:00",
        "Mayotte": "+03:00",
        "Mazatlan": "-07:00",
        "McDonald Islands": "+05:00",
        "McMurdo": "+12:00",
        "McMurdo Station": "+12:00",
        "Melbourne": "+10:00",
        "Mendoza": "-03:00",
        "Menominee": "-06:00",
        "Merida": "-06:00",
        "Metlakatla": "-09:00",
        "Mexican Pacific": "-07:00",
        "Mexico": "-06:00",
        "Mexico City": "-06:00",
        "Midway": "-11:00",
        "Midway Atoll": "-11:00",
        "Moldova": "+02:00",
        "Monaco": "+01:00",
        "Moncton": "-04:00",
        "Mongala": "+01:00",
        "Montenegro": "+01:00",
        "Monterrey": "-06:00",
        "Monticello": "-05:00",
        "Montreal": "-05:00",
        "Montserrat": "-04:00",
        "Morocco": "+00:00",
        "Moscow": "+03:00",
        "Mountain": "-07:00",
        "Moutain": "-07:00",
        "Mozambique": "-01:00",
        "Myanmar": "+06:30",
        "Myanmar (Burma)": "+06:30",
        "Namibia": "+02:00",
        "Nauru": "+12:00",
        "Nayarit": "-07:00",
        "Nepal": "+05:45",
        "Netherlands": "+01:00",
        "New Brunswick": "-04:00",
        "New Caledonia": "+11:00",
        "New Salem": "-06:00",
        "New South Wales": "+10:00",
        "New South Wales (Yancowinna County)": "+09:30",
        "New York": "-05:00",
        "New Zealand": "+12:00",
        "Newfoundland": "-03:30",
        "Nicaragua": "-06:00",
        "Nicosia": "+02:00",
        "Niger": "+01:00",
        "Nigeria": "+01:00",
        "Nipigon": "-05:00",
        "Niue": "-11:00",
        "Nome": "-09:00",
        "Nord-Kivu": "+02:00",
        "Nord-Ubangi": "+01:00",
        "Norfolk Island": "+11:00",
        "Noronha": "-02:00",
        "North Kalimantan": "+08:00",
        "North Korea": "+08:30",
        "North Mariana Islands": "+10:00",
        "North Territory": "+09:30",
        "North West Ontario": "-06:00",
        "Northeast Region": "-03:00",
        "Northern Mariana Islands": "+10:00",
        "Northwest Mexico": "-08:00",
        "Northwest Territories": "-07:00",
        "Norway": "+01:00",
        "Nova Scotia": "-04:00",
        "Novokuznetsk": "+07:00",
        "Novosibirsk": "+07:00",
        "Novosibirsk Oblast": "+07:00",
        "Nunavut (Kitikmeot Region)": "-07:00",
        "Nunavut (Southampton Island)": "-05:00",
        "Nuuk": "-03:00",
        "Ojinaga": "-07:00",
        "Oman": "+04:00",
        "Omsk": "+06:00",
        "Omsk Oblast": "+06:00",
        "Oral": "+05:00",
        "Orenburg Oblast": "+05:00",
        "Pacific": "-08:00",
        "Pakistan": "+05:00",
        "Palau": "+09:00",
        "Palmer": "-03:00",
        "Palmer Station": "-03:00",
        "Palmyra Atoll": "-11:00",
        "Panama": "-05:00",
        "Pangnirtung": "-05:00",
        "Papua New Guinea": "+10:00",
        "Paraguay": "-04:00",
        "Pará": "-03:00",
        "Perm Krai": "+05:00",
        "Perth": "+08:00",
        "Peru": "-05:00",
        "Petersburg": "-05:00",
        "Petropavlovsk-Kamchatski": "+12:00",
        "Philippine": "+08:00",
        "Philippines": "+08:00",
        "Phoenix": "-07:00",
        "Phoenix Islands": "+13:00",
        "Pitcairn": "-08:00",
        "Pitcairn Islands": "-08:00",
        "Pituffik": "-04:00",
        "Pituffik Space Base": "-04:00",
        "Pohnpei": "+11:00",
        "Poland": "+01:00",
        "Ponape": "+11:00",
        "Pontianak": "+07:00",
        "Port Augusta": "+08:00",
        "Port Moresby": "+10:00",
        "Porto Velho": "-04:00",
        "Portugal": "+00:00",
        "Primorsky Krai": "+10:00",
        "Prince Edward Island": "-04:00",
        "Prince Edward Islands": "+03:00",
        "Puerto Rico": "-04:00",
        "Punta Arenas": "-03:00",
        "Pyongyang": "+08:30",
        "Qatar": "+03:00",
        "Quebec": "-05:00",
        "Queensland": "+10:00",
        "Quintana Roo": "-05:00",
        "Qyzylorda": "+06:00",
        "Rainy River": "-06:00",
        "Rankin Inlet": "-06:00",
        "Recife": "-03:00",
        "Regina": "-06:00",
        "Resolute": "-06:00",
        "Reunion": "+04:00",
        "Riau Islands": "+07:00",
        "Rio Branco": "-05:00",
        "Rio Gallegos": "-03:00",
        "Rocas Atoll": "-02:00",
        "Romania": "+02:00",
        "Rondônia": "-04:00",
        "Roraima": "-04:00",
        "Rothera": "-03:00",
        "Rothera Station": "-03:00",
        "Rwanda": "+02:00",
        "Réunion": "+04:00",
        "Saint Barthélemy": "-04:00",
        "Saint Helena": "+00:00",
        "Saint Martin": "-04:00",
        "Saint Miquelon": "-03:00",
        "Saint Paul": "+05:00",
        "Saint Paul Archipelago": "-02:00",
        "Saint Peter": "-02:00",
        "Saint Pierre": "-03:00",
        "Sakhalin": "+11:00",
        "Sakhalin Oblast": "+11:00",
        "Salta": "-03:00",
        "Samara": "+04:00",
        "Samara Oblast": "+04:00",
        "Samarkand": "+05:00",
        "Samoa": "+13:00",
        "San Juan": "-03:00",
        "San Luis": "-03:00",
        "San Marino": "+01:00",
        "Sankuru": "+02:00",
        "Santa Isabel": "-08:00",
        "Santarem": "-03:00",
        "Sao Paulo": "-03:00",
        "Saratov": "+04:00",
        "Saratov Oblast": "+04:00",
        "Saskatchewan": "-06:00",
        "Saudi Arabia": "+03:00",
        "Scattered Islands": "+03:00",
        "Senegal": "+00:00",
        "Serbia": "+01:00",
        "Seychelles": "+04:00",
        "Sierra Leone": "+00:00",
        "Simferopol": "+03:00",
        "Sinaloa": "-07:00",
        "Singapore": "+08:00",
        "Sint Maarten": "-04:00",
        "Sitka": "-09:00",
        "Slovakia": "+01:00",
        "Slovenia": "+01:00",
        "Society Islands": "-10:00",
        "Solomon": "+11:00",
        "Solomon Islands": "+11:00",
        "Somalia": "+03:00",
        "Sonora": "-07:00",
        "South Africa": "+02:00",
        "South Australia": "+09:30",
        "South East Labrador": "-03:30",
        "South Georgia": "-02:00",
        "South Georgia & South Sandwich Islands": "-02:00",
        "South Kalimantan": "+08:00",
        "South Korea": "+09:00",
        "South Region": "-03:00",
        "South Sandwich Islands": "-02:00",
        "South Sudan": "+03:00",
        "South West Amazonas": "-05:00",
        "Southeast Region": "-03:00",
        "Spain": "+01:00",
        "Srednekolymsk": "+11:00",
        "Sri Lanka": "+05:30",
        "St. Barthélemy": "-04:00",
        "St. Helena": "+00:00",
        "St. John's": "-03:30",
        "St. John’s": "-03:30",
        "St. Kitts & Nevis": "-04:00",
        "St. Lucia": "-04:00",
        "St. Martin": "-04:00",
        "St. Pierre & Miquelon": "-03:00",
        "St. Vincent & Grenadines": "-04:00",
        "Sud-Kivu": "+02:00",
        "Sud-Ubangia": "+01:00",
        "Sudan": "+02:00",
        "Suriname": "-03:00",
        "Svalbard & Jan Mayen": "+01:00",
        "Sverdlovsk Oblast": "+05:00",
        "Swaziland": "+02:00",
        "Sweden": "+01:00",
        "Swift Current": "-06:00",
        "Switzerland": "+01:00",
        "Sydney": "+10:00",
        "Syowa": "+03:00",
        "Syowa Station": "+03:00",
        "Syria": "+02:00",
        "São Tomé & Príncipe": "+00:00",
        "Tahiti": "-10:00",
        "Taipei": "+08:00",
        "Taiwan": "+08:00",
        "Tajikistan": "+05:00",
        "Tanganyika": "+02:00",
        "Tanzania": "+03:00",
        "Tarawa": "+12:00",
        "Tasmania": "+10:00",
        "Tell City": "-06:00",
        "Thailand": "+07:00",
        "Thule": "-04:00",
        "Thunder Bay": "-05:00",
        "Tijuana": "-08:00",
        "Timor-Leste": "+09:00",
        "Tocantins": "-03:00",
        "Togo": "+00:00",
        "Tokelau": "+13:00",
        "Tomsk": "+07:00",
        "Tomsk Oblast": "+07:00",
        "Tonga": "+13:00",
        "Toronto": "-05:00",
        "Trindade": "-02:00",
        "Trinidad & Tobago": "-04:00",
        "Tristan da Cunha": "+00:00",
        "Troll": "+00:00",
        "Troll Station": "+00:00",
        "Tshopo Interim Administration": "+02:00",
        "Tshuapa": "+01:00",
        "Tuamotus": "-10:00",
        "Tucuman": "-03:00",
        "Tungsten": "-08:00",
        "Tunisia": "+01:00",
        "Tunu": "+00:00",
        "Turkey": "+03:00",
        "Turkmenistan": "+05:00",
        "Turks & Caicos Islands": "-05:00",
        "Turks Islands": "-05:00",
        "Tuva": "+07:00",
        "Tuvalu": "+12:00",
        "Tyumen Oblast": "+05:00",
        "U.S. Virgin Islands": "-04:00",
        "Udmurtia": "+04:00",
        "Uganda": "+03:00",
        "Ukraine": "+02:00",
        "Ulaanbaatar": "+08:00",
        "Ulyanovsk": "+04:00",
        "Ulyanovsk Oblast": "+04:00",
        "United Arab Emirates": "+04:00",
        "United Kingdom": "+00:00",
        "Universal": "+00:00",
        "Uruguay": "-03:00",
        "Urumqi": "+06:00",
        "Ushuaia": "-03:00",
        "Ust-Nera": "+10:00",
        "Uvs": "+07:00",
        "Uzbekistan": "+05:00",
        "Uzhhorod": "+02:00",
        "Vancouver": "-08:00",
        "Vanuatu": "+11:00",
        "Vatican City": "+01:00",
        "Venezuela": "-04:00",
        "Vevay": "-05:00",
        "Victoria": "+10:00",
        "Vietnam": "+07:00",
        "Vincennes": "-05:00",
        "Vladivostok": "+10:00",
        "Volgograd": "+03:00",
        "Vostok": "+06:00",
        "Vostok Station": "+06:00",
        "Wake": "+12:00",
        "Wake Island": "+12:00",
        "Wallis": "+12:00",
        "Wallis & Futuna": "+12:00",
        "West Africa": "+01:00",
        "West Australia": "+08:00",
        "West Greenland": "-03:00",
        "West Kazakhstan": "+05:00",
        "West Kazakhstan (Aktobe)": "+05:00",
        "West New Guinea": "+09:00",
        "West Nunavut": "-07:00",
        "West Nusa Tenggara": "+08:00",
        "West Russia": "+03:00",
        "West Sakha Republic": "+09:00",
        "Western Argentina": "-03:00",
        "Western European": "+00:00",
        "Western Indonesia": "+07:00",
        "Western Sahara": "+00:00",
        "Whitehorse": "-08:00",
        "Winamac": "-05:00",
        "Winnipeg": "-06:00",
        "Yakutat": "-09:00",
        "Yakutsk": "+09:00",
        "Yamalia": "+05:00",
        "Yekaterinburg": "+05:00",
        "Yellowknife": "-07:00",
        "Yemen": "+03:00",
        "Yukon": "-08:00",
        "Zabaykalsky Krai": "+09:00",
        "Zambia": "+02:00",
        "Zaporozhye": "+02:00",
        "Zimbabwe": "+02:00"
      };
      NON_TIME_ZONE_WORDS = await fetchURL(`get:./ext/[A-Y]{2,4}T.json`).then((response) => response.json());
      convertWordsToTimes.inReverse ??= (string = "") => {
        return string.normalize("NFKD").replace(/\b(01:00PM)\b/i, "evening").replace(/\b(12:00PM)\b/i, "noon").replace(/\b(12:00AM)\b/i, "midnight");
      };
    },
    /**
     * Scans stream titles and panels for timezone mentions and converts detected times to the local time zone.
     */
    handler: /* @__PURE__ */ __name(() => {
      var _a3, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const allNodes = /* @__PURE__ */ __name((node) => (node.childNodes.length ? [...node.childNodes].map(allNodes) : [node]).flat(), "allNodes");
      const cTitle = $.all('[data-a-target="stream-title"i], [data-a-target="about-panel"i], [data-a-target^="panel"i]'), rTitle = $('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i]):not([class*="offline"i]) > p + p');
      parsing:
        for (let container of [...cTitle, rTitle].filter(defined)) {
          let [timezone, zone, type, trigger] = ((container == null ? void 0 : container.innerText) || "").normalize("NFKD").match(new RegExp("(?:Time[ -]?zone[ \\t:=]+)(?:(?<zone>\\p{L}{3,}))(?:[ \\t\\-]*(?<type>\\p{L}+))?", "iu")) ?? ((container == null ? void 0 : container.innerText) || "").normalize("NFKD").match(new RegExp("(?:(?<zone>\\p{L}{3,})[ \\t\\-]+)(?:(?<type>\\p{L}+)[ \\t\\-]+)?(?<trigger>time)\\b", "iu")) ?? [];
          let MASTER_TIME_ZONE;
          locator: if (defined(zone)) {
            for (const place in GEOGRAPHIC__CONVERSIONS)
              if (RegExp(place.replaceAll("-", "-?"), "i").test(zone)) {
                MASTER_TIME_ZONE = GEOGRAPHIC__CONVERSIONS[place];
                break locator;
              }
            if (/\b(y?a(h|ng?)?|c[aá]c|d(as|e[nt]?|ie|u)|e([lw]|ta)|i(he|l|ng|tu|yo)?|[lk]a|ny|o|quod|t(h?e|us)|u|y)\b/i.test(zone) || /\b(a([fvz]|pie|utem)|d(ari|[ei])|e[ae]|[fvn]an|gada|ji|kohta|n([ae]k?|ing?|ke|tawm|y)|o([dif]|\s?ka)?|s(aka|e)|[tv]on|ti(na)?|vun|y[ae]|z)\b/i.test(zone) || /\b(aua|(b|ch)o|canys|dla|eest|f([oö]a?r|un|yrir)|gia|hoki|kw?a(nggo|y)?|m(aka|ert)|ngoba|[ps](ara|[eëo]u?r?|r([eo]|iek))|quia|rau|til|untuk|v(arten|i|oo)r|ye|z(a|um))\b/i.test(zone) || /\b(a([bw]?er?|g(a|us)|ka?|[ls][ei]|m(m[ao]|pak)|nd|ti?)?|b(aina|[eu]t)|d(an|he)|e(n(gari)?|s|ta?)?|izda|k(a[ij]|[ou]ma)|l(an|e)|ja|lebe|m(a([anr]{2}|i?s)?|en|utta)|no|[ou]g|s(ed|is)|(te)?ta(b|pi)|u(nd)?|v[ae]|y)\b/i.test(zone) || /\B(i?e[ds]|ing)$/i.test(zone))
              break locator;
            MASTER_TIME_ZONE ??= ((_a3 = TIME_ZONE__CONVERSIONS[(timezone == null ? void 0 : timezone.length) < 1 ? "" : timezone = [zone, type ?? "Standard", trigger].map((s = "") => s[0]).join("").toUpperCase()]) == null ? void 0 : _a3.length) ? timezone : "";
          }
          searching:
            for (const regexp of TIME_ZONE__REGEXPS) {
              replacing:
                for (let MAX = Object.keys(TIME_ZONE__CONVERSIONS).length; --MAX > 0 && regexp.test(convertWordsToTimes(container == null ? void 0 : container.innerText)); ) {
                  container = container.getElementByText(regexp) ?? container.getElementByText(/\b(after\s?noons?|evenings?|noons?|lunch[\s\-]?time|mid[\s\-]?nights?)\b/iu);
                  if (nullish(container))
                    continue searching;
                  const convertedText = convertWordsToTimes(container.innerText.trim()), originalText = container.innerText;
                  if (convertedText.length < 1)
                    continue searching;
                  let { groups, index, length } = regexp.exec(convertedText), { hour, minute = ":00", offset = "", meridiem = "", timezone: timezone2 = MASTER_TIME_ZONE } = groups, timesone = ((_b = timezone2 == null ? void 0 : timezone2.replace(/^([^s])t$/, "$1st")) == null ? void 0 : _b.replace(/^([^S])T$/, "$1ST")) ?? "";
                  if (offset.length > 0 && isNaN(parseInt(offset)))
                    continue;
                  const misint = timezone2 == null ? void 0 : timezone2.mutilate(), MISINT = timezone2 == null ? void 0 : timezone2.toUpperCase(), missnt = timesone == null ? void 0 : timesone.mutilate(), MISSNT = timesone == null ? void 0 : timesone.toUpperCase();
                  if (!(MISINT in TIME_ZONE__CONVERSIONS || MISSNT in TIME_ZONE__CONVERSIONS) && ((_d = (_c = NON_TIME_ZONE_WORDS[misint == null ? void 0 : misint[0]]) == null ? void 0 : _c[misint == null ? void 0 : misint.length]) == null ? void 0 : _d.contains(misint)) && ((_f = (_e = NON_TIME_ZONE_WORDS[missnt == null ? void 0 : missnt[0]]) == null ? void 0 : _e[missnt == null ? void 0 : missnt.length]) == null ? void 0 : _f.contains(missnt)))
                    continue searching;
                  const now = /* @__PURE__ */ new Date(), year = now.getFullYear(), month = now.getMonth() + 1, day = now.getDate(), _hr_ = new Date(((_g = STREAMER.data) == null ? void 0 : _g.actualStartTime) || now).getHours(), autoMeridiem = "AP"[+(_hr_ > 11)];
                  const houl = hour = parseInt(hour);
                  hour += Date.isDST() ? -/\Bs?t$/i.test(timezone2) : +/\Bdt$/i.test(timezone2);
                  if (((_h = meridiem[0]) == null ? void 0 : _h.length) < autoMeridiem.length) {
                    if (autoMeridiem == "A")
                      hour += 12;
                    else
                      hour -= 12;
                    if (hour < 0)
                      hour += 24;
                  } else if ((_i = meridiem[0]) == null ? void 0 : _i.equals(autoMeridiem)) {
                    if (autoMeridiem == "P" && hour < 12)
                      hour += 12;
                    else if (autoMeridiem == "A" && hour > 11)
                      hour -= 12;
                  } else if ((_j = meridiem[0]) == null ? void 0 : _j.length) {
                    if (meridiem[0].toUpperCase() == "P" && hour < 12)
                      hour += 12;
                    else if (meridiem[0].toUpperCase() == "A" && hour > 11)
                      hour -= 12;
                  }
                  hour %= 24;
                  timezone2 ||= offset.length ? "GMT" : "";
                  if (timezone2.length) {
                    const name2 = timezone2 = timezone2.toUpperCase().replace(/[^\w\+\-]+/g, "");
                    if (timezone2 in TIME_ZONE__CONVERSIONS)
                      timezone2 = TIME_ZONE__CONVERSIONS[timezone2].replace(/^[+-]/, "GMT$&");
                    else if (/[\+\-]/.test(timezone2))
                      timezone2 = timezone2.replace(/^[+-]/, "GMT$&");
                    else if (timesone in TIME_ZONE__CONVERSIONS)
                      timezone2 = TIME_ZONE__CONVERSIONS[timesone].replace(/^[+-]/, "GMT$&");
                    else
                      continue searching;
                    MASTER_TIME_ZONE ||= name2;
                  }
                  const newDate = /* @__PURE__ */ new Date(`${[year, month, day].join(" ")} ${offset}${hour + minute} ${timezone2}`), newTime = newDate.toLocaleTimeString(top.LANGUAGE, { timeStyle: "short" }), noChange = convertWordsToTimes(originalText).equals(originalText);
                  if (isNaN(+newDate)) {
                    const { groups: groups2, index: index2, length: length2 } = regexp.exec(originalText);
                    container.innerHTML = `${originalText.substr(0, index2).split("").join("&zwj;")}{{time_zones?=${btoa(escape(originalText.substr(index2, length2)))}}}${originalText.substr(length2).split("").join("&zwj;")}`;
                  } else {
                    container.innerText = convertedText.replace(regexp, ($0, $$, $_) => {
                      var _a4;
                      return `{{time_zones?=${btoa(escape(newTime))}|${btoa(escape(noChange ? $0.replace(/$/, ((_a4 = groups.timezone) == null ? void 0 : _a4.length) ? "" : (MASTER_TIME_ZONE == null ? void 0 : MASTER_TIME_ZONE.length) ? ` (${MASTER_TIME_ZONE})` : "") : convertWordsToTimes.inReverse($0)))}}}`;
                    });
                  }
                }
            }
        }
      const TZC = [], TZE = /* @__PURE__ */ new Set();
      for (let MAX = 1e3, regexp = /\{\{time_zones\?=(.+?)\}\}/, node; --MAX > 0 && defined(node = $.body.getElementByText(regexp)); ) {
        const text = RegExp["$&"], tzc = RegExp.$1;
        TZE.add(node);
        node.innerHTML = node.innerHTML.replace(text, `<!--!time#${TZC.push(tzc)}-->`);
      }
      for (const node of TZE)
        allNodes(node).filter((node2) => /\bcomment\b/i.test(node2.nodeName) && node2.textContent.startsWith("!time#")).map((comment) => {
          const index = parseInt(comment.textContent.replace("!time#", "")) - 1;
          const [newText, oldText] = TZC[index].split("|");
          const span = furnish("span", {
            id: `tt-time-zone--${new nanoid(10, nanoid.LOWERCASE_SAFE)}`,
            style: "color:var(--user-contrast-color); text-decoration:underline 2px; width:min-content; white-space:nowrap",
            contrast: THEME__PREFERRED_CONTRAST,
            innerHTML: unescape(atob(newText)).split("").join("&zwj;").pad("&zwj;")
          });
          if (oldText == null ? void 0 : oldText.length)
            span.setAttribute("tip-text--timezone", oldText);
          else
            span.removeAttribute("style");
          comment.replaceWith(span);
        });
      wait(250).then(() => {
        $.all('[id^="tt-time-zone-"][tip-text--timezone]').map((span) => {
          const oldText = span.getAttribute("tip-text--timezone");
          new Tooltip(span, unescape(atob(oldText)), { from: "top" });
        });
      });
      TIME_ZONE__TEXT_MATCHES = TIME_ZONE__TEXT_MATCHES.isolate();
    }, "handler"),
    /**
     * Logs a message indicating that time zone conversion is starting.
     */
    setup() {
      $remark("Converting time zones...");
    }
  });

  // src/plugins/customization/block-banners.js
  var UNWANTED_BANNER_AD_SELECTOR;
  var LAST_ELEMENT;
  var EMPTY_ELEMENT_SUBSTITUTE;
  plugin({
    id: "block_banners",
    timer: 2500,
    register: false,
    // setup() starts the job itself, when it should
    /**
     * Initializes constants and identifiers used for blocking banner ads.
     */
    init() {
      UNWANTED_BANNER_AD_SELECTOR = new nanoid(21, nanoid.LOWERCASE_SAFE).value;
      LAST_ELEMENT = /* @__PURE__ */ Symbol("last-selector-slot");
      EMPTY_ELEMENT_SUBSTITUTE = { dataset: {} };
    },
    /**
     * Loads and parses a remote list of banner ad selectors to identify and block unwanted banners.
     */
    handler: /* @__PURE__ */ __name(() => {
      fetchURL.fromDisk(`https://ephellon.github.io/ttv-tools/ad-banners.css`, { hoursUntilEntryExpires: 24 }).then((r) => r.text()).then((bannerSelectors) => {
        bannerSelectors = bannerSelectors.split(/[\r\n]+/).filter((s) => s.trim().length).map((selector) => {
          const syntaxes = [];
          const path = [""];
          let curr = "";
          let esc = false;
          const detect = /* @__PURE__ */ __name((char) => {
            const { length } = syntaxes;
            if (char == "(") {
              curr = char;
              syntaxes.push("operator");
            } else if (char == "[") {
              curr = char;
              syntaxes.push("attribute");
            } else if (char == '"') {
              syntaxes.push("string:2");
            } else if (char == "'") {
              syntaxes.push("string:1");
            } else if (char == "<") {
              path.push("");
              syntaxes.push("closest");
            }
            return length < syntaxes.length;
          }, "detect");
          constructing: for (const char of selector)
            switch (syntaxes.at(-1)) {
              case "operator":
                {
                  curr += char;
                  if (detect(char)) {
                    continue constructing;
                  } else if (char == ")") {
                    path[path.length - 1] = curr;
                    curr = "";
                    syntaxes.pop();
                  }
                }
                break;
              case "attribute":
                {
                  curr += char;
                  if (detect(char)) {
                    continue constructing;
                  } else if (char == "]") {
                    path[path.length - 1] = curr;
                    curr = "";
                    syntaxes.pop();
                  }
                }
                break;
              case "string:2":
                {
                  curr += char;
                  if (char == "\\")
                    esc = !esc;
                  else if (esc)
                    esc = !esc;
                  else if (!esc && char == '"')
                    syntaxes.pop();
                }
                break;
              case "string:1":
                {
                  curr += char;
                  if (char == "\\")
                    esc = !esc;
                  else if (esc)
                    esc = !esc;
                  else if (!esc && char == "'")
                    syntaxes.pop();
                }
                break;
              case "closest":
                {
                  if (detect(char))
                    continue constructing;
                  else
                    path[path.length - 1] += char;
                }
                break;
              default:
                {
                  detect(char);
                }
                break;
            }
          path.push(LAST_ELEMENT);
          return path.reduce((elements, v, i, a) => {
            if (v === LAST_ELEMENT)
              return elements;
            else if (v.trim() === "")
              return [EMPTY_ELEMENT_SUBSTITUTE];
            else if (i === 0)
              return $.all(v);
            let c = parseInt(v.trim() || "1");
            if (Number.isNaN(c)) {
              return elements.map((el) => el.closest(v)).filter(defined);
            } else {
              for (; c-- > 0; )
                elements = elements.map((el) => el.parentElement).filter(defined);
              return elements;
            }
          }, []).isolate().forEach((el) => {
            var _a3;
            if (parseBool((_a3 = el.dataset) == null ? void 0 : _a3[UNWANTED_BANNER_AD_SELECTOR]))
              return;
            $remark("Blocking...", el);
            el.dataset[UNWANTED_BANNER_AD_SELECTOR] = true;
          });
        });
        AddCustomCSSBlock("Remove Banner Ads", `[data-${UNWANTED_BANNER_AD_SELECTOR}="true"i] {display:none!important}`);
      });
    }, "handler"),
    /**
     * Undoes banner blocking by removing the associated custom CSS block.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      RemoveCustomCSSBlock("Remove Banner Ads");
    }, "unhandler"),
    /**
     * Sets up a delayed event listener on mouse-up to trigger banner blocking.
     */
    setup() {
      const listener = DelayJob("block_banners");
      $.body.addEventListener("mouseup", listener);
      listener();
    }
  });

  // src/plugins/customization/point-watcher.js
  var POINT_WATCHER_COUNTER;
  var HAS_POINTS_BALANCE;
  plugin({
    id: "point_watcher_placement",
    timer: 250,
    register: false,
    // setup() starts the job itself, when it should
    /**
     * Initializes state variables for the point watcher feature.
     * @returns {void}
     */
    init() {
      POINT_WATCHER_COUNTER = 0;
      HAS_POINTS_BALANCE = false;
    },
    /**
     * Runs periodically to update the channel points display in tooltips and apply styling to the balance text.
     * @param {Object} context - The plugin context containing `StopWatch`
     * @returns {Promise<void>}
     */
    handler: /* @__PURE__ */ __name(async ({ StopWatch }) => {
      new StopWatch("point_watcher_placement");
      if (top.WINDOW_STATE == "unloading")
        return;
      const balance = $.last('[data-test-selector*="balance-string"i]');
      balance == null ? void 0 : balance.setAttribute("rainbow-border", await STREAMER.done);
      balance == null ? void 0 : balance.setAttribute("bottom-only", "");
      const richTooltip = $('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])');
      let { name: name2, game } = STREAMER;
      let target = null;
      contextualizer: if (defined(richTooltip)) {
        let [title, subtitle, ...footers] = richTooltip.children, [gTarget] = footers.map((footer) => $('[class*="tooltip"i][class*="text"i]', footer)).filter(defined);
        if (nullish(subtitle)) {
          const [rTitle, rSubtitle] = $.all('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *'), rTarget = $('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="status"i]');
          title = rTitle;
          subtitle = rSubtitle;
          gTarget = rTarget;
        }
        if (nullish(title) || nullish(gTarget))
          break contextualizer;
        [name2, game] = title.textContent.split(/[^\w\s]/);
        name2 = name2 == null ? void 0 : name2.trim();
        game = game == null ? void 0 : game.trim();
        target = gTarget;
      }
      $.all(`:is(.tt-point-amount, .tt-point-face):not([name="${name2}"i])`).map((element) => element == null ? void 0 : element.remove());
      Cache.load(["ChannelPoints"], async ({ ChannelPoints }) => {
        var _a3, _b;
        ChannelPoints ??= {};
        let [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name2] ?? 0).toString().split("|"), style = new CSSObject({ verticalAlign: "bottom", height: "20px", width: "20px" }), upNext = !!~(ALL_FIRST_IN_LINE_JOBS ?? []).findIndex((href) => RegExp(`/${name2}\\b`, "i").test(href));
        amount = (_a3 = amount ?? "") == null ? void 0 : _a3.replace(".0", "");
        notEarned = parseInt(notEarned);
        pointsToEarnNext = parseInt(
          notEarned >= -Infinity ? pointsToEarnNext : 0
        );
        const amounter = $(`.tt-point-amount[name="${name2}"i]`, target);
        if (defined(amounter)) {
          amounter.setAttribute("rainbow-border", notEarned == 0);
          if (amounter.innerHTML.unlike(amount))
            amounter.innerHTML = amount;
        } else if (defined(target)) {
          const pointAmount = `span.tt-point-amount[bottom-only][name="${name2}"]`, pointFace = `span.tt-point-face[name="${name2}"]`;
          const text = furnish(pointAmount, {
            "rainbow-border": notEarned == 0,
            innerHTML: amount
          }), icon = (face == null ? void 0 : face.contains("/")) ? furnish(pointFace, {
            innerHTML: ` | ${furnish("img", { src: `https://static-cdn.jtvnw.net/channel-points-icons/${face}`, style: style.toString() }).outerHTML} `
          }) : furnish(pointFace, {
            innerHTML: ` | ${Glyphs.modify("channelpoints", { style, ...style.toObject() })} `
          });
          target.append(icon);
          target.append(text);
          (_b = target.closest('[role="dialog"i]')) == null ? void 0 : _b.setAttribute("tt-in-up-next", upNext);
        }
        if (!(POINT_WATCHER_COUNTER++ % 60)) {
          const allRewards = (await STREAMER.shop).filter((reward) => reward.enabled), balance2 = STREAMER.coin || 0;
          HAS_POINTS_BALANCE ||= defined(balance2);
          amount = (balance2 ? balance2.suffix("", 1).replace(".0", "").toUpperCase() : 0) || (HAS_POINTS_BALANCE ? amount : "&#128683;");
          fiat = (STREAMER == null ? void 0 : STREAMER.fiat) ?? fiat ?? 0;
          face = (STREAMER == null ? void 0 : STREAMER.face) ?? face ?? `${STREAMER.sole}`;
          notEarned = (allRewards == null ? void 0 : allRewards.length) ? allRewards.filter(({ cost = 0 }) => cost > STREAMER.coin).length : notEarned >= -Infinity ? notEarned : -1;
          pointsToEarnNext = (allRewards == null ? void 0 : allRewards.length) ? allRewards.map((reward) => reward.cost > STREAMER.coin ? reward.cost - STREAMER.coin : 0).sort((x, y) => x > y ? -1 : 1).filter((x) => x > 0).pop() : notEarned >= -Infinity ? pointsToEarnNext : 0;
          face = face == null ? void 0 : face.replace(/^(?:https?:.*?)?([\d]+\/[\w\-\.\/]+)$/i, "$1");
          ChannelPoints[STREAMER.name] = [amount, fiat, face, notEarned, pointsToEarnNext].join("|");
          Cache.save({ ChannelPoints });
        }
        PrepareForGarbageCollection(ChannelPoints);
      });
      StopWatch.stop("point_watcher_placement", 2700);
    }, "handler"),
    /**
     * Undoes the point watcher's changes by removing all point amount elements from the DOM.
     * @returns {void}
     */
    unhandler: /* @__PURE__ */ __name(() => {
      $.all(".tt-point-amount").forEach((span) => span.remove());
    }, "unhandler"),
    /**
     * Prepares the point watcher by triggering the rewards menu and indexing available channel rewards.
     * @returns {void}
     */
    setup() {
      when.defined(() => {
        var _a3;
        return (_a3 = $.last('[data-test-selector*="balance-string"i]')) == null ? void 0 : _a3.closest("button");
      }).then(async (balanceButton) => {
        var _a3, _b, _c, _d, _e, _f, _g, _h, _i;
        RegisterJob("point_watcher_placement");
        const jump = (_e = (_d = (_c = STREAMER.jump) == null ? void 0 : _c[(_b = (_a3 = STREAMER.name) == null ? void 0 : _a3.toLowerCase) == null ? void 0 : _b.call(_a3)]) == null ? void 0 : _d.stream) == null ? void 0 : _e.points;
        if (defined(jump == null ? void 0 : jump.balance))
          return;
        balanceButton.click();
        for (const reward of $.all('[class*="reward"i][class*="item"i]')) {
          let [image, cost, title] = $.all('[class*="reward"i][class*="image"i] img[alt], [data-test-selector="cost"i], p[title]', reward), backgroundColor = (((_i = (_h = (_g = (_f = $("button [style]")) == null ? void 0 : _f.getComputedStyle) == null ? void 0 : _g.call(_f, $(`main a[href$="${NORMALIZED_PATHNAME}"i]`) ?? $(":root"))) == null ? void 0 : _h.getPropertyValue) == null ? void 0 : _i.call(_h, "background-color")) || "#9147FF").toUpperCase();
          image = (image == null ? void 0 : image.src) ?? "https://static-cdn.jtvnw.net/custom-reward-images/default-1.png";
          cost = parseCoin(cost == null ? void 0 : cost.textContent) | 0;
          title = ((title == null ? void 0 : title.textContent) ?? "").trim();
          if (!title.length && !cost)
            continue;
          const imgURL = parseURL(image), imgPath = imgURL.pathname.slice(1), [imgType, imgName, imgSub = ""] = imgPath.split("/"), realId = imgType.contains("auto") && imgType.contains("reward") ? {
            "SUBSONLY": "SINGLE_MESSAGE_BYPASS_SUB_MODE",
            SINGLE_MESSAGE_BYPASS_SUB_MODE: "SINGLE_MESSAGE_BYPASS_SUB_MODE",
            "HIGHLIGHT": "SEND_HIGHLIGHTED_MESSAGE",
            SEND_HIGHLIGHTED_MESSAGE: "SEND_HIGHLIGHTED_MESSAGE",
            "MODIFY-EMOTE": "CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK",
            CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK: "CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK",
            "RANDOM-EMOTE": "RANDOM_SUB_EMOTE_UNLOCK",
            RANDOM_SUB_EMOTE_UNLOCK: "RANDOM_SUB_EMOTE_UNLOCK",
            "CHOOSE-EMOTE": "CHOSEN_SUB_EMOTE_UNLOCK",
            CHOSEN_SUB_EMOTE_UNLOCK: "CHOSEN_SUB_EMOTE_UNLOCK"
          }[imgName.replace(/(\W?\d+)?\.(gif|jpe?g|png)$/i, "").replace(/^(\d+)$/, imgSub).toUpperCase()] : null;
          const item = {
            title,
            cost,
            image: { url: image },
            backgroundColor: Color.destruct(backgroundColor).HEX,
            id: realId ?? UUID.from([image, title.mutilate(), cost].join("|$|"), true).value,
            type: realId ?? "UNKNOWN",
            enabled: true,
            available: true,
            count: 0,
            hidden: false,
            maximum: {
              global: 0,
              user: 0
            },
            needsInput: false,
            paused: false,
            premium: false,
            prompt: "",
            skips: false,
            updated: (/* @__PURE__ */ new Date()).toJSON()
          };
          if (!~STREAMER.__shop__.findIndex((i) => i.id == item.id))
            STREAMER.__shop__.push(item);
        }
        wait(30).then(() => balanceButton.click());
      });
    }
  });

  // src/plugins/video-recovery/recover-frames.js
  var SECONDS_VIDEO_PAUSED_UNSAFELY;
  var VIDEO_CREATION_TIME;
  var TOTAL_VIDEO_FRAMES;
  var PAGE_HAS_FOCUS;
  var VIDEO_OVERRIDE;
  var FRAME_HASH_ALLOWED;
  var PREVIOUS_FRAME_HASH;
  plugin({
    id: "recover_frames",
    timer: 1e3,
    /**
     * Initializes the state and constants for the video frame recovery system.
     */
    init() {
      SECONDS_VIDEO_PAUSED_UNSAFELY = 0;
      VIDEO_CREATION_TIME = void 0;
      TOTAL_VIDEO_FRAMES = void 0;
      PAGE_HAS_FOCUS = document.visibilityState.equals("visible");
      VIDEO_OVERRIDE = false;
      FRAME_HASH_ALLOWED = (navigator.deviceMemory ?? 0) > 1;
      PREVIOUS_FRAME_HASH = void 0;
    },
    /**
     * Runs every tick: Monitors the video for stalling frames or playback lag and attempts to recover by replacing the video with an embedded player if enabled.
     * @param {Object} context - Contains the StopWatch utility
     */
    handler: /* @__PURE__ */ __name(({ StopWatch }) => {
      var _a3, _b, _c, _d, _e, _f, _g;
      new StopWatch("recover_frames");
      const video = $("video") ?? $("video", (_a3 = $("#tt-embedded-video")) == null ? void 0 : _a3.contentDocument);
      if (nullish(video))
        return StopWatch.stop("recover_frames");
      let { paused } = video, isTrusted = $.defined('button[data-a-player-state="paused"i]'), isAdvert = $.defined('[data-a-target*="ad-countdown"i]'), { creationTime, totalVideoFrames } = video.getVideoPlaybackQuality(), cframe = /* @__PURE__ */ __name(() => $.defined("#tt-embedded-video") ? performance.now() : FRAME_HASH_ALLOWED ? UUID.from($("video").captureFrame()).value : null, "cframe");
      VIDEO_CREATION_TIME ??= creationTime;
      TOTAL_VIDEO_FRAMES ??= totalVideoFrames;
      PREVIOUS_FRAME_HASH ??= cframe();
      if (paused && isTrusted || PAGE_HAS_FOCUS === false)
        return StopWatch.stop("recover_frames");
      if ((creationTime !== VIDEO_CREATION_TIME || PREVIOUS_FRAME_HASH === cframe()) && (totalVideoFrames === TOTAL_VIDEO_FRAMES || totalVideoFrames - TOTAL_VIDEO_FRAMES < 15)) {
        if (SECONDS_VIDEO_PAUSED_UNSAFELY > 0 && !(SECONDS_VIDEO_PAUSED_UNSAFELY % 5))
          $warn(`The video has been stalling for ${SECONDS_VIDEO_PAUSED_UNSAFELY}s`, { VIDEO_CREATION_TIME, TOTAL_VIDEO_FRAMES, SECONDS_VIDEO_PAUSED_UNSAFELY }, "Frames fallen behind:", totalVideoFrames - TOTAL_VIDEO_FRAMES);
        if (SECONDS_VIDEO_PAUSED_UNSAFELY > 5 && !(SECONDS_VIDEO_PAUSED_UNSAFELY % 10)) {
          __RecoverFrames_Embed__:
            if (parseBool(Settings.recover_frames__allow_embed)) {
              $warn(`Attempting to override the video`);
              (_b = $("#tt-embedded-video")) == null ? void 0 : _b.remove();
              const container = (_c = $("video")) == null ? void 0 : _c.closest('[class*="container"i]');
              if (nullish(container))
                break __RecoverFrames_Embed__;
              let { name: name2 } = STREAMER, controls = true, iframe;
              container.insertAdjacentElement(
                "afterbegin",
                iframe = furnish(`iframe#tt-embedded-video`, {
                  allow: "autoplay",
                  src: parseURL(`https://player.twitch.tv/`).addSearch({
                    channel: name2,
                    parent: "twitch.tv",
                    [video.muted ? "muted" : "volume"]: video[video.muted ? "muted" : "volume"],
                    controls
                  }).href,
                  style: `border: 1px solid var(--color-warn); position:absolute; top:0; z-index:99999;`,
                  height: "100%",
                  width: "100%",
                  onload(event) {
                    when.defined(() => {
                      var _a4;
                      const iDocument = (_a4 = $("#tt-embedded-video")) == null ? void 0 : _a4.contentDocument;
                      if (nullish(iDocument))
                        return;
                      const iVideo = $("video", iDocument), video2 = $("video");
                      if (nullish(iVideo))
                        return;
                      if ((iVideo.currentTime || 0) <= 0)
                        return;
                      for (const [key, { recording }] of video2.getRecording(Recording.ALL)) {
                        let { name: name3, as, maxTime } = recording;
                        maxTime = parseFloat(maxTime);
                        maxTime = maxTime < 0 ? Infinity : maxTime;
                        if (!/^\[\[(.+)\]\]$/.test(key)) {
                          recording.save();
                          Recording.proxy(iVideo, { name: name3, as, maxTime }).then((event2) => {
                            const { target } = event2;
                            const { recording: recording2 } = target;
                            const { name: name4, as: as2 } = recording2;
                            if (name4.startsWith("AUTO_DVR"))
                              Handlers.__MASTER_AUTO_DVR_HANDLER__.call(target, event2);
                            else
                              recording2.save(as2);
                          });
                        }
                      }
                      return VIDEO_OVERRIDE = true;
                    }, 250);
                  }
                })
              );
              $("video").muted = true;
              $("video", container).modStyle(`display:none`);
              (_d = $("[data-a-player-state]")) == null ? void 0 : _d.setTooltip(`${name2}'${/s$/.test(name2) ? "" : "s"} stream ran into an error`);
            } else {
              $warn(`Attempting to pause/play the video`);
              if ((_g = (_f = (_e = $("button[data-a-player-state]")) == null ? void 0 : _e.dataset) == null ? void 0 : _f.aPlayerState) == null ? void 0 : _g.equals("playing")) {
                $("button[data-a-player-state]").click();
                wait(1e3).then(() => {
                  var _a4;
                  return (_a4 = $("button[data-a-player-state]")) == null ? void 0 : _a4.click();
                });
              }
            }
        }
        TOTAL_VIDEO_FRAMES = totalVideoFrames;
        PREVIOUS_FRAME_HASH = cframe();
        ++SECONDS_VIDEO_PAUSED_UNSAFELY;
        video.stalling = true;
      } else {
        VIDEO_CREATION_TIME = creationTime;
        TOTAL_VIDEO_FRAMES = totalVideoFrames;
        PREVIOUS_FRAME_HASH = cframe();
        video.stalling = false;
        return SECONDS_VIDEO_PAUSED_UNSAFELY = 0;
      }
      if (SECONDS_VIDEO_PAUSED_UNSAFELY > 30)
        ReloadPage();
      StopWatch.stop("recover_frames");
    }, "handler"),
    /**
     * Initializes the frame recovery feature by setting up a page visibility listener and registering the recovery job.
     */
    setup() {
      $.on("visibilitychange", (event) => PAGE_HAS_FOCUS = document.visibilityState.equals("visible"));
      RegisterJob("recover_frames");
      $warn("[Recover-Frames] is monitoring the stream...");
    }
  });

  // src/plugins/video-recovery/recover-stream.js
  var VIDEO_PLAYER_TIMEOUT;
  plugin({
    id: "recover_stream",
    timer: 2500,
    /**
     * Initializes the stream recovery state by resetting the video player timeout.
     */
    init() {
      VIDEO_PLAYER_TIMEOUT = -1;
    },
    /**
     * Runs every tick: Attempts to programmatically resume video playback if the stream is paused unexpectedly.
     * @param {Object} context - Contains the StopWatch utility
     * @param {HTMLVideoElement} [video=$('video')] - The video element to recover
     */
    handler: /* @__PURE__ */ __name(({ StopWatch }, video = $("video")) => {
      var _a3, _b, _c;
      new StopWatch("recover_stream");
      if (nullish(video))
        return StopWatch.stop("recover_stream");
      let { paused } = video, isTrusted = $.defined('button[data-a-player-state="paused"i]'), isAdvert = $.defined('[data-a-target*="ad-countdown"i]');
      if (!paused || isTrusted || isAdvert && !parseBool(Settings.recover_ads) || VIDEO_PLAYER_TIMEOUT > -1)
        return StopWatch.stop("recover_stream");
      VIDEO_PLAYER_TIMEOUT = setTimeout(() => VIDEO_PLAYER_TIMEOUT = -1, 1e3);
      __RecoverVideoProgramatically__:
        try {
          const playing = video.play();
          if (defined(playing))
            playing.catch($error);
        } catch (error) {
          $error(error);
          let control = $("button[data-a-player-state]"), playing = (_b = (_a3 = control.dataset) == null ? void 0 : _a3.aPlayerState) == null ? void 0 : _b.equals("playing"), attempts = ((_c = control.dataset) == null ? void 0 : _c.recoveryAttempts) | 0;
          if (nullish(control)) {
            $warn("No video controls presented.");
            break __RecoverVideoProgramatically__;
          }
          if (attempts > 3) {
            $warn("Automatic attempts are not helping.");
            break __RecoverVideoProgramatically__;
          }
          if (!playing) {
            control.click();
          } else if (playing) {
            control.click();
            wait(250).then(() => control.click());
          }
          control.dataset.recoveryAttempts = ++attempts;
          wait(5e3).then(() => {
            var _a4;
            let control2 = $("button[data-a-player-state]"), attempts2 = ((_a4 = control2.dataset) == null ? void 0 : _a4.recoveryAttempts) | 0;
            control2.dataset.recoveryAttempts = --attempts2;
          });
        }
      StopWatch.stop("recover_stream");
    }, "handler"),
    /**
     * Sets up a listener to trigger the stream recovery handler whenever the video is paused.
     */
    setup() {
      __RecoverStream__: {
        const video = $("video");
        if (nullish(video))
          break __RecoverStream__;
        video.addEventListener("pause", (event) => Handlers.recover_stream(event.currentTarget));
      }
    }
  });

  // src/plugins/video-recovery/recover-video.js
  var RECOVERING_VIDEO;
  plugin({
    id: "recover_video",
    timer: 1e4,
    /**
     * Initializes the video recovery state.
     */
    init() {
      RECOVERING_VIDEO = false;
    },
    /**
     * Runs every tick: Detects video player errors and attempts recovery by navigating to another streamer or clicking the recovery button.
     * @param {Object} context - Contains the StopWatch utility
     */
    handler: /* @__PURE__ */ __name(async ({ StopWatch }) => {
      var _a3, _b, _c, _d;
      new StopWatch("recover_video");
      const errorMessage = $('[data-a-target*="player"i]:is([data-a-target*="content"i], [data-a-target*="gate"i]) [data-a-target*="text"i]');
      if (nullish(errorMessage))
        return StopWatch.stop("recover_video");
      if (RECOVERING_VIDEO)
        return StopWatch.stop("recover_video");
      RECOVERING_VIDEO = true;
      $error("The stream ran into an error:", errorMessage.textContent, /* @__PURE__ */ new Date());
      const latin = top.location.pathname.slice(1).split("/").shift();
      const native = ((_a3 = $(`a[href$="${latin}"i] [class*="title"]`)) == null ? void 0 : _a3.textContent) ?? latin;
      if ((_c = (_b = errorMessage.closest('[class*="content"i]:is([role], [data-a-target])')) == null ? void 0 : _b.textContent) == null ? void 0 : _c.includes(native)) {
        const next = await GetNextStreamer(latin);
        if (defined(next))
          goto(parseURL(next.href).addSearch({ tool: "video-recovery--non-subscriber" }).href);
      } else {
        (_d = $("button", errorMessage) ?? errorMessage.closest("button")) == null ? void 0 : _d.click();
        addReport({ "TTV-Tools-failed-to-recover-video": (errorMessage == null ? void 0 : errorMessage.textContent) ?? "Unknown error" });
        RECOVERING_VIDEO = false;
      }
      StopWatch.stop("recover_video");
    }, "handler")
  });

  // src/plugins/video-recovery/user-intent.js
  plugin({
    id: "user_intent",
    /**
     * Sets up listeners on channel links to track and cache the user's intended navigation destination.
     */
    async install() {
      wait(1e3).then(() => {
        $.all('[data-a-target="followed-channel"i], [id*="side"i][id*="nav"i] .side-nav-section[aria-label][tt-svg-label="followed"i] [href^="/"], [data-test-selector*="search-result"i][data-test-selector*="channel"i] a:not([href*="/search?"])').map((a) => {
          a.addEventListener("mouseup", async (event) => {
            const { currentTarget, button = -1 } = event;
            if (button)
              return;
            const url = parseURL(currentTarget.href), UserIntent = url.pathname.replace("/", "");
            Cache.save({ UserIntent });
          });
        });
      });
    }
  });

  // src/plugins/video-recovery/private-viewing.js
  plugin({
    id: "private_viewing",
    /**
     * Periodically adds a custom Picture-in-Picture button to live search result items.
     */
    async install() {
      setInterval(() => {
        $.all('.search-tray [role="cell"i] [data-a-target="nav-search-item"i]').map((element) => {
          var _a3;
          const [thumbnail, searchTerm] = element.children;
          const image = (_a3 = $("img", thumbnail)) == null ? void 0 : _a3.src, name2 = searchTerm.textContent.trim(), live = $.defined('[data-test-selector="live-badge"i]', element);
          if (!live)
            return;
          const f = furnish;
          const button = $("[tt-pip]", element.closest("[role]"));
          if (defined(button))
            return;
          const anchor = element.closest("[href]");
          anchor.modStyle("display:inline-block;width:calc(100% - 5rem)");
          anchor.insertAdjacentElement("afterend", f(`button[tt-pip]`, {
            name: name2,
            live,
            image,
            onmousedown({ currentTarget }) {
              MiniPlayer = currentTarget.getAttribute("name");
            },
            innerHTML: Glyphs.modify("picture_in_picture", { height: 20, width: 20, fill: "currentcolor", style: "vertical-align:middle" })
          }));
        });
      }, 300);
    }
  });

  // src/plugins/video-recovery/recover-pages.js
  var RECOVER_PAGE_FROM_LAG;
  var RECOVER_PAGE_FROM_LAG__EXACT;
  var RECOVER_PAGE_FROM_LAG__WARNINGS;
  plugin({
    id: "recover_pages",
    timer: 5e3,
    /**
     * Initializes the page recovery state and lag tracking variables.
     */
    init() {
      RECOVER_PAGE_FROM_LAG = void 0;
      RECOVER_PAGE_FROM_LAG__EXACT = void 0;
      RECOVER_PAGE_FROM_LAG__WARNINGS = 0;
    },
    /**
     * Runs every tick: Detects page-level errors and attempts to recover by reloading the page or navigating to the next available streamer.
     * @param {Object} context - Contains the StopWatch utility
     */
    handler: /* @__PURE__ */ __name(async ({ StopWatch }) => {
      new StopWatch("recover_pages");
      const error = $('main :is([data-a-target*="error"i][data-a-target*="message"i], [data-test-selector*="content"i][data-test-selector*="overlay"i])');
      if (nullish(error))
        return StopWatch.stop("recover_pages");
      const message = error.textContent, next = await GetNextStreamer(STREAMER.name);
      $error(message);
      if (/content.*unavailable/i.test(message) && defined(next))
        goto(parseURL(next.href).addSearch({ tool: "page-recovery--content-unavailable" }).href);
      else
        ReloadPage();
      StopWatch.stop("recover_pages");
    }, "handler"),
    /**
     * Undoes the page recovery setup by clearing the lag-monitoring interval.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      clearInterval(RECOVER_PAGE_FROM_LAG);
    }, "unhandler"),
    /**
     * Initializes a timer to monitor page timing drift and reloads the page if excessive lag is detected.
     */
    setup() {
      RECOVER_PAGE_FROM_LAG__EXACT = +/* @__PURE__ */ new Date();
      RECOVER_PAGE_FROM_LAG = setInterval(() => {
        const now = +/* @__PURE__ */ new Date(), span = now - RECOVER_PAGE_FROM_LAG__EXACT;
        if (span > Timers.recover_pages * 1.25)
          $warn(`The page seems to be lagging (${span.suffix("s", false, "time")})... This is the ${nth(++RECOVER_PAGE_FROM_LAG__WARNINGS)} warning. Offending site: ${location.href}`);
        else if (span < Timers.recover_pages * 1.05 && RECOVER_PAGE_FROM_LAG__WARNINGS > 0)
          --RECOVER_PAGE_FROM_LAG__WARNINGS;
        if (span > 15e3)
          RECOVER_PAGE_FROM_LAG__WARNINGS = Infinity;
        if (RECOVER_PAGE_FROM_LAG__WARNINGS > 2)
          ReloadPage();
        RECOVER_PAGE_FROM_LAG__EXACT = now;
      }, Timers.recover_pages);
    }
  });

  // src/plugins/misc/miscellaneous.js
  plugin({
    id: "miscellaneous",
    /**
     * Installs miscellaneous styling: detects the current theme and injects custom CSS to optimize channel color contrast and visibility.
     * @returns {Promise<void>}
     */
    async install() {
      Miscellaneous: {
        THEME = [...$("html").classList].find((c) => /theme-(\w+)/i.test(c)).replace(/[^]*theme-(\w+)/i, "$1").toLowerCase();
        ANTITHEME = window.ANTITHEME = ["light", "dark"].filter((theme2) => theme2.unlike(THEME)).pop();
        let [PRIMARY, SECONDARY] = [STREAMER.tint, STREAMER.tone].map(Color.HEXtoColor).sort((C1, C2) => {
          const background = THEME.equals("dark") ? Color.black : Color.white;
          return Color.contrast(background, [C1.R, C1.G, C1.B]) - Color.contrast(background, [C2.R, C2.G, C2.B]);
        }).map((color) => color.HEX);
        THEME__CHANNEL_DARK = THEME.equals("dark") ? PRIMARY : SECONDARY;
        THEME__CHANNEL_LIGHT = THEME.unlike("dark") ? PRIMARY : SECONDARY;
        PRIMARY = Color.HEXtoColor(PRIMARY);
        SECONDARY = Color.HEXtoColor(SECONDARY);
        const contrastOf = /* @__PURE__ */ __name((C1, C2) => Color.contrast(...[C1, C2].map(({ R, G, B }) => [R, G, B])), "contrastOf"), black = { R: 0, G: 0, B: 0 }, white = { R: 255, G: 255, B: 255 }, theme = THEME.equals("dark") ? black : white, antitheme = THEME.unlike("dark") ? black : white;
        THEME__BASE_CONTRAST = contrastOf(PRIMARY, SECONDARY);
        THEME__PREFERRED_CONTRAST = `${THEME__BASE_CONTRAST.toString()} prefer ${contrastOf(PRIMARY, theme) > contrastOf(SECONDARY, theme) ? THEME : ANTITHEME}`;
        AddCustomCSSBlock("Better-Themed Styling", `
                /* The user is using the light theme (like a crazy person) */
                :root {
                    --channel-color: ${STREAMER.tint};
                    --channel-color-contrast: ${STREAMER.tone};
                    --channel-color-complement: ${STREAMER.aego};
                    --channel-color-dark: ${THEME__CHANNEL_DARK};
                    --channel-color-light: ${THEME__CHANNEL_LIGHT};
                }

                /* The user likes hurting their eyes */
                :root[class*="light"i] {
                    --color-colored: var(--channel-color-light);
                    --color-colored-contrast: var(--channel-color-dark);
                    --channel-color-opposite: var(--channel-color-complement);
                }

                /* The user is using the correct theme */
                :root[class*="dark"i] {
                    --color-colored: var(--channel-color-dark);
                    --color-colored-contrast: var(--channel-color-light);
                    --channel-color-opposite: var(--channel-color-complement);
                }

                [up-next--body] *:is(button, h5) {
                    --color: var(--user-contrast-color) !important;
                    --fill: var(--user-contrast-color) !important;
                }

                /* Apply contrast correction... div[contrast="low prefer dark"] */
                :root[class*="light"i] [contrast~="low"i][contrast~="light"i],
                [contrast~="low"i][contrast~="dark"i] {
                    color: #000 !important;
                    fill: #000 !important;

                    /** Over complicated method
                     * background-color: #0000;
                     * mix-blend-mode: lighten;
                     * text-shadow: 0 0 5px #000;
                     */
                }

                :root[class*="dark"i] [contrast~="low"i][contrast~="dark"i],
                [contrast~="low"i][contrast~="light"i] {
                    color: #fff !important;
                    fill: #fff !important;

                    /** Over complicated method
                     * background-color: #fff0;
                     * mix-blend-mode: darken;
                     * text-shadow: 0 0 5px #fff;
                     */
                }
            `);
      }
      __GET_UPDATE_INFO__: {
        const installedFromWebstore = parseURL(Runtime.getURL("profile.png")).host.equals("fcfodihfdbiiogppbnhabkigcdhkhdjd");
        wait(36e5, installedFromWebstore).then(async (installedFromWebstore2) => {
          let FETCHED_DATA = { wasFetched: false };
          const properties = {
            origin: {
              github: !installedFromWebstore2,
              chrome: installedFromWebstore2
            },
            version: {
              installed: Manifest.version,
              github: "5.6",
              chrome: "5.6"
            },
            Glyphs
          };
          await Settings.get(["buildVersion", "chromeVersion", "githubVersion", "versionRetrivalDate"], async ({ buildVersion, chromeVersion, githubVersion, versionRetrivalDate }) => {
            buildVersion ??= properties.version.installed;
            versionRetrivalDate ||= 0;
            __FetchingUpdates__:
              if (FETCHED_DATA.wasFetched === false && versionRetrivalDate + 36e5 < +/* @__PURE__ */ new Date()) {
                const githubURL = "https://api.github.com/repos/ephellon/twitch-tools/releases/latest";
                fetchURL(githubURL).then((response) => {
                  if (FETCHED_DATA.wasFetched)
                    throw "Data was already fetched";
                  return response.json();
                }).then((metadata) => {
                  $log({ ["GitHub"]: metadata });
                  return properties.version.github = metadata.tag_name;
                }).then((version) => Settings.set({ githubVersion: version })).catch(async (error) => {
                  await Settings.get(["githubVersion"], ({ githubVersion: githubVersion2 }) => {
                    if (defined(githubVersion2))
                      properties.version.github = githubVersion2;
                  });
                }).finally(() => {
                  const githubUpdateAvailable = compareVersions(`${properties.version.installed} < ${properties.version.github}`), chromeUpdateAvailable = false;
                  FETCHED_DATA = { ...FETCHED_DATA, ...properties };
                  Settings.set({ githubUpdateAvailable });
                  __ChromeOnly__:
                    if (installedFromWebstore2)
                      Settings.set({ chromeUpdateAvailable: githubUpdateAvailable });
                  if (!installedFromWebstore2 && githubUpdateAvailable || installedFromWebstore2 && chromeUpdateAvailable)
                    confirm.timed(`There is an update available for ${Manifest.name} (${properties.version.installed} &rarr; ${properties.version.github})`).then((ok) => {
                      if (nullish(ok))
                        return;
                      open([
                        "https://github.com/Ephellon/Twitch-Tools/releases",
                        "https://chrome.google.com/webstore/detail/ttv-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd"
                      ][+installedFromWebstore2], "_blank");
                    });
                });
                if (FETCHED_DATA.wasFetched === false) {
                  FETCHED_DATA.wasFetched = true;
                  versionRetrivalDate = +/* @__PURE__ */ new Date();
                  Settings.set({ versionRetrivalDate });
                }
              } else {
                properties.version.github = githubVersion ?? properties.version.github;
                properties.version.chrome = chromeVersion ?? properties.version.chrome;
              }
          });
        });
      }
    }
  });

  // src/plugins/automation/not-implemented.js
  plugin({
    id: "not_implemented",
    /**
     * Installs the phone number parsing and common phrase translation features, registering their respective handlers and timers.
     */
    async install() {
      Handlers.phone_number = () => {
        const syntax = /(?<countryCode>\+?\d{1,3})?[\s\.\-\(]?(?<areaCode>\d{3})?[\)\.\-\s]?(?<officeCode>\d{3})[\s\.\-]?(?<lineNumber>\d{1,4})/;
      };
      Timers.phone_number = 250;
      __PhoneNumber__:
        if (parseBool(Settings.phone_number)) {
          $remark("Parsing phone numbers...");
          RegisterJob("phone_number");
        }
      Handlers.common_phrase_translations = () => {
        const translations = [
          [/(Twitch|T.?T.?V|The)(.?s)?\s+(T\W?o\W?S\W?|Terms(?:.+of.+Service)?)/i, [`<a href="/legal/terms-of-service/" target="_blank">$&</a>`, (e) => defined(e.closest("[href]"))]]
          // Twitch's ToS
        ];
        for (const [phrases, [replacement, ignoreIf]] of translations)
          for (const element of $.getAllElementsByText(phrases)) {
            if (element != element.getElementByText(phrases))
              continue;
            if (ignoreIf(element))
              continue;
            element.innerHTML = element.innerHTML.replace(phrases, replacement);
          }
      };
      Timers.common_phrase_translations = 250;
      __CommonPhraseTranslations__:
        if (true) {
          RegisterJob("common_phrase_translations");
        }
    }
  });

  // src/plugins/automation/auto-focus.js
  var CAPTURE_HISTORY;
  var CAPTURE_INTERVAL;
  var POLL_INTERVAL;
  var STALLED_FRAMES;
  var POSITIVE_TREND;
  plugin({
    id: "auto_focus",
    timer: -1e3,
    /**
     * Initializes state variables for the auto-focus monitoring system.
     */
    init() {
      CAPTURE_HISTORY = [];
      CAPTURE_INTERVAL = void 0;
      POLL_INTERVAL = void 0;
      STALLED_FRAMES = void 0;
      POSITIVE_TREND = void 0;
    },
    /**
     * Runs the auto-focus monitoring loop, capturing and comparing video frames to detect movement and optionally displaying analysis statistics on the UI.
     */
    handler: /* @__PURE__ */ __name(() => {
      let detectionThreshold = (parseInt(Settings.auto_focus_detection_threshold) || STREAMER.mark).clamp(5, 75), pollInterval = parseInt(Settings.auto_focus_poll_interval), imageType = Settings.auto_focus_poll_image_type, detectedTrend = "&bull;";
      POLL_INTERVAL ??= pollInterval * 1e3;
      STALLED_FRAMES = 0;
      if (CAPTURE_HISTORY.length > 90)
        CAPTURE_HISTORY.shift();
      CAPTURE_INTERVAL = setInterval(() => {
        const video = $.all("video").pop();
        if (nullish(video))
          return;
        const frame = video.captureFrame(`image/${imageType}`), start2 = +/* @__PURE__ */ new Date();
        wait(250).then(() => {
          resemble(frame).compareTo(video.captureFrame(`image/${imageType}`)).ignoreColors().scaleToSameSize().outputSettings({ errorType: "movementDifferenceIntensity", errorColor: { red: 0, green: 255, blue: 255 } }).onComplete(async (data) => {
            var _a3;
            let { analysisTime, misMatchPercentage } = data, threshold = detectionThreshold, totalTime = 0, bias = [];
            analysisTime = parseInt(analysisTime);
            misMatchPercentage = parseFloat(misMatchPercentage) || 0;
            for (const [mismatch, time, trend2] of CAPTURE_HISTORY) {
              threshold += parseFloat(mismatch);
              totalTime += time;
              bias.push(trend2);
            }
            threshold /= CAPTURE_HISTORY.length;
            const trend = misMatchPercentage > (parseBool(Settings.auto_focus_detection_threshold) ? detectionThreshold : threshold) ? "up" : "down";
            (window.CAP_HIS = CAPTURE_HISTORY).push([misMatchPercentage, analysisTime, trend]);
            let diffImg = $("img#tt-auto-focus-differences"), diffDat = $("span#tt-auto-focus-stats"), stop = +/* @__PURE__ */ new Date();
            DisplayingAutoFocusDetails:
              if (Settings.show_stats) {
                const parent = $(".chat-list--default");
                if (nullish(parent))
                  break DisplayingAutoFocusDetails;
                let { height, width } = getOffset(video), { videoHeight } = video;
                height = parseInt(height * 0.25);
                width = parseInt(width * 0.25);
                if (nullish(diffImg)) {
                  diffDat = furnish("span#tt-auto-focus-stats", { style: `background: var(--color-background-tooltip); color: var(--color-text-tooltip); position: absolute; z-index: 6; width: 100%; height: 2rem; overflow: hidden; font-family: monospace; font-size: 1rem; text-align: center; padding: 0;` });
                  diffImg = furnish("img#tt-auto-focus-differences", { style: `position: absolute; z-index: 3; width: 100%; transition: all 0.5s;` });
                  parent.append(diffDat, diffImg);
                }
                diffImg.src = (_a3 = data.getImageDataUrl) == null ? void 0 : _a3.call(data);
                const size = diffImg.src.length, { totalVideoFrames } = video.getVideoPlaybackQuality();
                diffDat.innerHTML = `Frame #${totalVideoFrames.toString(36).toUpperCase()} / ${detectedTrend} ${misMatchPercentage}% &#866${3 + trend[0].equals("d")}; / ${((stop - start2) / 1e3).suffix("s", 2)} / ${size.suffix("B", 2)} / ${videoHeight}p`;
              } else {
                diffImg == null ? void 0 : diffImg.remove();
                diffDat == null ? void 0 : diffDat.remove();
              }
            const changes = ["changing trend detection level"];
            if (bias.length > 30 && GET_TIME_REMAINING() > 6e4) {
              if ((nullish(POSITIVE_TREND) || POSITIVE_TREND === false) && bias.slice(-(30 / pollInterval)).filter((trend2) => trend2.equals("down")).length < 30 / pollInterval / 2) {
                POSITIVE_TREND = true;
                __AutoFocus_Pause_UpNext__: if (UP_NEXT_ALLOW_THIS_TAB) {
                  const button = $("#up-next-control"), paused = parseBool(button == null ? void 0 : button.getAttribute("paused"));
                  if (paused)
                    break __AutoFocus_Pause_UpNext__;
                  button == null ? void 0 : button.click();
                  changes.push("pausing up next");
                }
                __AutoFocus_Disable_AwayMode__: {
                  const button = $("#away-mode"), quality = await GetQuality();
                  if (quality.auto)
                    break __AutoFocus_Disable_AwayMode__;
                  button == null ? void 0 : button.click();
                  changes.push("disabling lurking");
                }
                detectedTrend = "&uArr;";
                $log("Positive trend detected: " + changes.join(", "));
              } else if ((nullish(POSITIVE_TREND) || POSITIVE_TREND === true) && bias.slice(-(60 / pollInterval)).filter((trend2) => trend2.equals("up")).length < 60 / pollInterval / 5) {
                POSITIVE_TREND = false;
                __AutoFocus_Resume_UpNext__: if (UP_NEXT_ALLOW_THIS_TAB) {
                  const button = $("#up-next-control"), paused = parseBool(button == null ? void 0 : button.getAttribute("paused"));
                  if (!paused || (button == null ? void 0 : button.getAttribute("paused-by")) == "user")
                    break __AutoFocus_Resume_UpNext__;
                  button == null ? void 0 : button.click();
                  changes.push("resuming up next");
                }
                __AutoFocus_Enable_AwayMode__: {
                  const button = $("#away-mode"), quality = await GetQuality();
                  if (quality.low)
                    break __AutoFocus_Enable_AwayMode__;
                  button == null ? void 0 : button.click();
                  changes.push("enabling lurking");
                }
                detectedTrend = "&dArr;";
                $log("Negative trend detected: " + changes.join(", "));
              }
            }
            if (video.stalling)
              ++STALLED_FRAMES;
            else if (STALLED_FRAMES > 0)
              --STALLED_FRAMES;
            if (STALLED_FRAMES > 15 || stop - start2 > POLL_INTERVAL * 0.75) {
              $warn("The stream seems to be stalling...", "Increasing Auto-Focus job time...", (POLL_INTERVAL / 1e3).toFixed(2) + "s →", (POLL_INTERVAL * 1.1 / 1e3).toFixed(2) + "s");
              POLL_INTERVAL *= 1.1;
              STALLED_FRAMES = 0;
              RestartJob("auto_focus", "modify");
            }
          });
        });
      }, POLL_INTERVAL);
    }, "handler"),
    /**
     * Undoes auto-focus monitoring by clearing the capture interval and removing associated statistics and difference elements from the UI.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      if (RestartJob.__reason__.noneOf("default", "modify", "reinit"))
        $.all("#tt-auto-focus-differences, #tt-auto-focus-stats").forEach((element) => element.remove());
      clearInterval(CAPTURE_INTERVAL);
    }, "unhandler"),
    /**
     * Sets up the auto-focus feature and logs a notification that the stream is being monitored.
     */
    setup() {
      $warn("[Auto-Focus] is monitoring the stream...");
    }
  });

  // src/plugins/automation/lurking.js
  var AwayModeButton;
  var AwayModeEnabled;
  var InitialQuality;
  var InitialViewMode;
  var NUMBER_OF_FAILED_QUALITY_FETCHES;
  plugin({
    id: "away_mode",
    timer: 1e3,
    /**
     * Resets the internal state variables for the Away Mode (Lurking) feature.
     */
    init() {
      AwayModeButton = void 0;
      AwayModeStatus = false;
      AwayModeEnabled = false;
      InitialQuality = void 0;
      InitialVolume = void 0;
      InitialViewMode = void 0;
      MAINTAIN_VOLUME_CONTROL = true;
      NUMBER_OF_FAILED_QUALITY_FETCHES = 0;
    },
    /**
     * Runs every tick: Manages the Away Mode button creation, keyboard shortcuts, and automatic volume adjustments.
     * @param {Object} context - Execution context
     * @param {StopWatch} context.StopWatch - StopWatch utility for performance tracking
     */
    handler: /* @__PURE__ */ __name(async ({ StopWatch }) => {
      var _a3, _b, _c;
      new StopWatch("away_mode");
      let button = $("#away-mode"), currentQuality = Handlers.away_mode.quality ??= await GetQuality();
      if (nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A))
        $.on("keydown", GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_A = /* @__PURE__ */ __name(function Toggle_Lurking({ key = "", altKey, ctrlKey, metaKey, shiftKey }) {
          var _a4, _b2;
          if (!(ctrlKey || metaKey || shiftKey) && altKey && key.equals("a"))
            (_b2 = (_a4 = $("#away-mode")) == null ? void 0 : _a4.click) == null ? void 0 : _b2.call(_a4);
        }, "Toggle_Lurking"));
      if (defined(button) || $.defined('[data-a-target*="ad-countdown"i]') || nullish(currentQuality) || /\/search\b/i.test(NORMALIZED_PATHNAME)) {
        if (nullish(currentQuality) && ++NUMBER_OF_FAILED_QUALITY_FETCHES > 60) {
          const scapeGoat = await GetNextStreamer();
          $warn(`The following page failed to load correctly (no quality controls present): ${STREAMER.name} @ ${/* @__PURE__ */ new Date()}`);
          goto(parseURL(scapeGoat.href).addSearch({ tool: "away-mode--scape-goat" }).href);
        }
        if (defined(button) && AwayModeStatus && MAINTAIN_VOLUME_CONTROL && parseBool(Settings.away_mode__volume_control)) {
          const target = parseFloat(Settings.away_mode__volume);
          if (!Number.isNaN(target) && Math.abs(GetVolume() - target) > 0.01)
            SetVolume(target);
        }
        return StopWatch.stop("away_mode");
      }
      await Cache.load({ AwayModeEnabled }, (cache) => AwayModeEnabled = cache.AwayModeEnabled ?? false);
      const enabled = AwayModeStatus = AwayModeEnabled || currentQuality.low && !(currentQuality.auto || currentQuality.high || currentQuality.source);
      if (nullish(button)) {
        let sibling, parent, before, extra = /* @__PURE__ */ __name(() => {
        }, "extra"), placement = Settings.away_mode_placement ??= "null";
        switch (placement) {
          // Option 1 "over" - video overlay, play button area
          case "over":
            {
              sibling = $('[data-a-target="player-controls"i] [class*="player-controls"i][class*="right-control-group"i] > :last-child');
              parent = sibling == null ? void 0 : sibling.parentElement;
              before = "first";
              extra = /* @__PURE__ */ __name(({ container: container2 }) => {
                var _a4;
                (_a4 = container2.querySelector('[role="tooltip"i]')) == null ? void 0 : _a4.remove();
              }, "extra");
            }
            break;
          // Option 2 "under" - quick actions, follow/notify/subscribe area
          case "under":
            {
              sibling = $('[data-test-selector="live-notifications-toggle"i]') ?? $('[data-target="channel-header-right"i] [style] div div:not([style])');
              parent = sibling == null ? void 0 : sibling.parentElement;
              before = "last";
              extra = /* @__PURE__ */ __name(({ container: container2 }) => {
                var _a4, _b2;
                const classes = ((_b2 = (_a4 = $("button", container2)) == null ? void 0 : _a4.closest("div")) == null ? void 0 : _b2.classList) ?? [];
                [...classes].map((value) => {
                  if (/[-_]/.test(value))
                    return StopWatch.stop("away_mode");
                  classes.remove(value);
                });
              }, "extra");
            }
            break;
          default: {
            return StopWatch.stop("away_mode");
          }
        }
        if (nullish(parent) || nullish(sibling))
          return StopWatch.stop("away_mode");
        let container = $("#away-mode");
        if (nullish(container))
          container = furnish("#away-mode", {
            innerHTML: sibling.outerHTML.replace(/(?:[\w\-]*)(?:follow|header|notifications?|settings-menu)([\w\-]*)/ig, "away-mode$1")
          });
        parent.insertBefore(container, parent[before + "ElementChild"]);
        if (["over"].contains(placement)) {
          container.firstElementChild.classList.remove("tt-mg-l-1");
        } else if (["under"].contains(placement)) {
          (_a3 = $("span", container)) == null ? void 0 : _a3.remove();
          (_b = $("[style]", container)) == null ? void 0 : _b.modStyle("opacity: 1; transform: translateX(15%) translateZ(0px);");
        }
        extra({ container, sibling, parent, before, placement });
        button = {
          enabled,
          container,
          icon: $("svg", container),
          background: $("button", container),
          get offset() {
            return getOffset(container);
          },
          tooltip: new Tooltip(container, `${["Start", "Stop"][+enabled]} Lurking (${GetMacro("alt+a")})`, { from: "top", left: 5 })
        };
        button.container.setAttribute("tt-away-mode-enabled", enabled);
        button.icon ??= $("svg", container);
        button.icon.outerHTML = [
          Glyphs.modify("show", { id: "tt-away-mode--show", height: "20px", width: "20px" }).toString(),
          Glyphs.modify("hide", { id: "tt-away-mode--hide", height: "20px", width: "20px" }).toString()
        ].filter(defined).join("");
        button.icon = $("svg", container);
      } else {
        const container = $("#away-mode");
        button = {
          enabled,
          container,
          icon: $("svg", container),
          tooltip: Tooltip.get(container),
          get offset() {
            return getOffset(container);
          },
          background: $("button", container)
        };
      }
      if (nullish(InitialQuality)) {
        InitialQuality = Handlers.away_mode.quality ??= await GetQuality();
        InitialVolume = Handlers.away_mode.volume ??= GetVolume();
        InitialViewMode = Handlers.away_mode.viewMode ??= GetViewMode();
        await SetQuality(["auto", "low"][+enabled]).then(() => {
          if (parseBool(Settings.away_mode__volume_control))
            SetVolume([InitialVolume, Settings.away_mode__volume][+enabled]);
          const controls = $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls');
          if (defined(controls))
            controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL && enabled && parseBool(Settings.away_mode__volume_control);
          if (parseBool(Settings.away_mode__hide_chat))
            [
              () => SetViewMode(InitialViewMode),
              () => SetViewMode("fullwidth")
            ][+enabled]();
        });
      }
      const [accent, contrast] = (Settings.accent_color ?? "blue/12").split("/");
      (_c = button.background) == null ? void 0 : _c.modStyle(`background:${[`var(--user-accent-color)`, "var(--color-background-button-secondary-default)"][+button.container.getAttribute("tt-away-mode-enabled").equals("true")]} !important;`);
      button.container.onclick ??= async (event) => {
        const enabled2 = !parseBool(AwayModeButton.container.getAttribute("tt-away-mode-enabled")), { container, background, tooltip } = AwayModeButton;
        container.setAttribute("tt-away-mode-enabled", enabled2);
        tooltip.innerHTML = `${["Start", "Stop"][+enabled2]} Lurking (${GetMacro("alt+a")})`;
        background == null ? void 0 : background.modStyle(`background:${[`var(--user-accent-color)`, "var(--color-background-button-secondary-default)"][+enabled2]} !important;`);
        MAINTAIN_VOLUME_CONTROL = true;
        const controls = $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls');
        if (defined(controls))
          controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL && enabled2 && parseBool(Settings.away_mode__volume_control);
        let size = parseBool(Settings.low_data_mode) ? getOffset($("video")).height.floorToNearest(100) : -1;
        switch (size) {
          case 0:
          case 100:
            {
              size = "160p";
            }
            break;
          case 200:
          case 300:
            {
              size = "360p";
            }
            break;
          case 400:
          case 500:
            {
              size = "480p";
            }
            break;
          case 600:
          case 700:
          case 800:
            {
              size = "720p";
            }
            break;
          default:
            {
              size = "auto";
            }
            break;
        }
        await SetQuality([size, "low"][+enabled2]).then(() => {
          if (parseBool(Settings.away_mode__volume_control))
            SetVolume([InitialVolume, Settings.away_mode__volume][+enabled2]);
          if (parseBool(Settings.away_mode__hide_chat))
            [
              () => SetViewMode(InitialViewMode),
              () => SetViewMode("fullwidth")
            ][+enabled2]();
        });
        Cache.save({ AwayModeEnabled: AwayModeStatus = enabled2 });
      };
      button.container.onmouseenter ??= (event) => {
        let { currentTarget } = event, svgContainer = $("figure", currentTarget), svgShow = $("svg#tt-away-mode--show", svgContainer), svgHide = $("svg#tt-away-mode--hide", svgContainer);
        const enabled2 = parseBool(currentTarget.closest("#away-mode").getAttribute("tt-away-mode-enabled"));
        svgShow == null ? void 0 : svgShow.setAttribute("preview", !enabled2);
        svgHide == null ? void 0 : svgHide.setAttribute("preview", !!enabled2);
      };
      button.container.onmouseleave ??= (event) => {
        let { currentTarget } = event, svgContainer = $("figure", currentTarget), svgShow = $("svg#tt-away-mode--show", svgContainer), svgHide = $("svg#tt-away-mode--hide", svgContainer);
        svgShow == null ? void 0 : svgShow.removeAttribute("preview");
        svgHide == null ? void 0 : svgHide.removeAttribute("preview");
      };
      AwayModeButton = button;
      StopWatch.stop("away_mode");
    }, "handler"),
    /**
     * Undoes the Away Mode feature by removing the Away Mode button from the DOM.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      var _a3;
      (_a3 = $("#away-mode")) == null ? void 0 : _a3.remove();
    }, "unhandler"),
    /**
     * Initializes the Away Mode feature, sets up volume control listeners, and configures the automated activation schedule.
     */
    setup() {
      $remark("Adding & Scheduling the Lurking button...");
      RegisterJob("away_mode");
      GetVolume.onchange = (volume, { isTrusted = false }) => {
        if (!MAINTAIN_VOLUME_CONTROL || !isTrusted)
          return;
        $warn("[Lurking] is releasing volume control due to user interaction...");
        MAINTAIN_VOLUME_CONTROL = !isTrusted;
        $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls').dataset.automatic = MAINTAIN_VOLUME_CONTROL;
        SetVolume(volume);
      };
      when.defined(() => $(':is(video, [class*="video"i][class*="render"i]) ~ * .player-controls')).then((controls) => controls.dataset.automatic = MAINTAIN_VOLUME_CONTROL && AwayModeStatus && parseBool(Settings.away_mode__volume_control));
      when.defined(() => $("#away-mode"), 3e3).then((awayMode) => {
        const schedules = JSON.parse((Settings == null ? void 0 : Settings.away_mode_schedule) || "[]");
        const today = /* @__PURE__ */ new Date(), YEAR = today.getFullYear(), MONTH = today.getMonth(), DATE = today.getDate(), TODAY = today.getDay(), H = today.getHours(), M = today.getMinutes(), S = today.getSeconds();
        const weekdays = "Sun Mon Tue Wed Thu Fri Sat".split(" "), months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
        let desiredStatus, currentStatus = parseBool(awayMode.getAttribute("tt-away-mode-enabled"));
        for (const schedule of schedules) {
          let { day, time, duration, status } = schedule;
          if (TODAY != day)
            continue;
          if (H < time || H > (time + duration) % 24)
            continue;
          duration *= 36e5;
          $warn(`Lurking is scheduled to be "${["off", "on"][+status]}" for ${weekdays[day]} @ ${time}:00 for ${toTimeString(duration, "?hours_h")}`);
          if (defined(desiredStatus = status))
            break;
        }
        if (defined(desiredStatus) && desiredStatus != currentStatus)
          awayMode.click();
      });
    }
  });

  // src/plugins/automation/claim-reward.js
  plugin({
    id: "claim_reward",
    /**
     * Installs the reward claiming feature and configures settings for recording video clips of reward purchases.
     */
    async install() {
      VideoClips = {
        dvr: parseBool(Settings.video_clips__dvr),
        filetype: Settings.video_clips__file_type ?? "webm",
        quality: Settings.video_clips__quality ?? "auto",
        length: parseInt(Settings.video_clips__length ?? 60) * 1e3
      };
      let DISPLAY_WALLET_BUTTONS, REWARDS_ON_COOLDOWN = /* @__PURE__ */ new Map(), CLAIMING_REWARD = false, TEXT_BOX_ALREADY_FOCUSED, USER_INVOKED_PAUSE = true;
      async function RECORD_PURCHASE({ updateRecords = true, fromUser = true, override = null, element, message, subject, mentions, AutoClaimRewards }) {
        var _a3, _b, _c, _d, _e, _f, _g, _h;
        element = await element;
        if (!(subject.equals("coin") && fromUser == (message.contains(USERNAME) || mentions.contains(USERNAME) || ((_c = (_b = (_a3 = $('[class*="message"i] [class*="username"i] [data-a-user]', element)) == null ? void 0 : _a3.dataset) == null ? void 0 : _b.aUser) == null ? void 0 : _c.equals(USERNAME)))))
          return false;
        if (UP_NEXT_ALLOW_THIS_TAB) {
          const button = $("#up-next-control"), paused = parseBool(button == null ? void 0 : button.getAttribute("paused"));
          if (!paused) {
            USER_INVOKED_PAUSE = false;
            button == null ? void 0 : button.click();
          }
        }
        const rewardID = (override == null ? void 0 : override.rewardID) ?? ((_d = element.dataset) == null ? void 0 : _d.shopItemId) ?? ((_f = (_e = element.closest("[data-tt-reward-id]")) == null ? void 0 : _e.dataset) == null ? void 0 : _f.ttRewardId) ?? element.dataset.uuid;
        const [item] = (override == null ? void 0 : override.shop) ?? await STREAMER.shop.filter(({ id: id2, title: title2 }) => {
          var _a4;
          return id2.equals(rewardID) || (title2 == null ? void 0 : title2.length) && ((_a4 = message == null ? void 0 : message.mutilate()) == null ? void 0 : _a4.contains(title2.mutilate()));
        });
        if (nullish(item))
          return false;
        const { title, cost, id } = item;
        if (updateRecords) {
          let { sole } = STREAMER;
          AutoClaimRewards[sole |= 0] = (_h = (_g = AutoClaimRewards[sole]) == null ? void 0 : _g.filter((i) => i)) == null ? void 0 : _h.filter((i) => i.unlike(id));
          Cache.save({ AutoClaimRewards });
        }
        const video = $.all("video").pop();
        const time = parseInt(Settings.video_clips__trophy_length) * 1e3;
        const name2 = [STREAMER.name, `${title} (${(/* @__PURE__ */ new Date()).toLocaleDateString(top.LANGUAGE, { dateStyle: "short" }).replace(GetFileSystem().allIllegalFilenameCharacters, "-")})`].join(" - ");
        video.dataset.trophyId = title;
        SetQuality(VideoClips.quality, "auto").then(() => {
          const recording = Recording.proxy(video, { name: name2, as: name2, maxTime: time, mimeType: `video/${VideoClips.filetype}`, hidden: !Settings.show_stats });
          recording.then(async ({ target }) => await target.recording.save()).then(
            (link) => alert.silent(`
                        <video controller controls
                            title="Trophy Clip Saved &mdash; ${link.download}"
                            src="${link.href}" style="max-width:-webkit-fill-available"
                        ></video>
                        `)
          );
          confirm.timed(
            `
                    <input hidden controller
                        icon="🔴️" title='Recording "${STREAMER.name} - ${title}"'
                        okay="${encodeHTML(Glyphs.modify("download", { height: "20px", width: "20px", style: "vertical-align:bottom" }))} Save"
                        deny="${encodeHTML(Glyphs.modify("trash", { height: "20px", width: "20px", style: "vertical-align:bottom" }))} Discard"
                    />
                    ${title} &mdash; ${Glyphs.modify("channelpoints", { height: "20px", width: "20px", style: "display:inline-block;vertical-align:bottom;width:fit-content" })}${comify(cost)}`,
            time
          ).then((answer) => {
            if (answer === false)
              throw `Trophy clip discarded!`;
            recording.stop();
          }).catch((error) => {
            alert.silent(error);
            recording.controller.abort(error);
          }).finally(() => {
            if (USER_INVOKED_PAUSE)
              return;
            const button = $("#up-next-control"), paused = parseBool(button == null ? void 0 : button.getAttribute("paused"));
            if (!paused)
              return;
            button == null ? void 0 : button.click();
          });
        });
        return true;
      }
      __name(RECORD_PURCHASE, "RECORD_PURCHASE");
      ;
      const WaitForElement = /* @__PURE__ */ __name((condition, timeout = 1e4, ms = 100) => {
        const deadline = +/* @__PURE__ */ new Date() + timeout;
        return when.defined(() => condition() ?? (+/* @__PURE__ */ new Date() > deadline ? when.null : null), ms);
      }, "WaitForElement");
      Handlers.claim_reward = () => {
        if (top.TWITCH_INTEGRITY_FAIL)
          return;
        Cache.load(["AutoClaimRewards", "AutoClaimAnswers"], async ({ AutoClaimRewards, AutoClaimAnswers }) => {
          AutoClaimRewards ??= {};
          AutoClaimAnswers ??= {};
          for (const sole in AutoClaimRewards)
            if (sole == STREAMER.sole)
              for (const rewardID of AutoClaimRewards[sole])
                await STREAMER.shop.filter(({ available, enabled, hidden, paused, premium }) => available && enabled && !(hidden || paused || premium && !STREAMER.paid)).filter(({ id }) => id.equals(rewardID)).map(async ({ id, cost, title, needsInput = false, answer = null }) => {
                  if (REWARDS_ON_COOLDOWN.has(id)) {
                    if (REWARDS_ON_COOLDOWN.get(id) < +/* @__PURE__ */ new Date())
                      REWARDS_ON_COOLDOWN.delete(id);
                    else
                      return;
                  }
                  cost = parseInt(cost);
                  title = title.trim();
                  await when.defined(() => $('[data-test-selector*="chat"i] [data-test-selector*="points"i][data-test-selector*="summary"i] button')).then(async (rewardsMenuButton) => {
                    var _a3;
                    const { coin, fiat } = STREAMER;
                    $notice(`Can "${title}" be bought yet? ${["No", "Yes"][+(coin >= cost)]}`);
                    if (TEXT_BOX_ALREADY_FOCUSED)
                      return;
                    if (coin < cost)
                      return;
                    if ($.defined("#tt_saved_input_for_redemption"))
                      return;
                    if (CLAIMING_REWARD)
                      return;
                    CLAIMING_REWARD = true;
                    rewardsMenuButton.click();
                    $log(`Purchasing "${title}" for ${cost} ${fiat}...`);
                    if (needsInput) {
                      prompt.silent(`<input id=tt_saved_input_for_redemption hidden controller title="You have saved text for this redemption..." />${title}<br><br><strong>${parseBool(Settings.video_clips__trophy) ? "This redemption will be recorded</strong>" : ""}`, ((_a3 = AutoClaimAnswers[sole]) == null ? void 0 : _a3[id]) ?? "").then(() => {
                        var _a4;
                        (_a4 = $('[data-a-target="chat-input"i]')) == null ? void 0 : _a4.modStyle(`background:!delete`);
                      });
                      when.defined(() => $('[data-a-target="chat-input"i]')).then((inputBox) => {
                        inputBox.addEventListener("keydown", ({ key = "", altKey, ctrlKey, metaKey, shiftKey, currentTarget }) => {
                          var _a4;
                          if (!(ctrlKey || metaKey || altKey || shiftKey) && key.equals("Enter")) {
                            (_a4 = $('[data-a-target="chat-input"i]')) == null ? void 0 : _a4.modStyle(`background:!delete`);
                            TEXT_BOX_ALREADY_FOCUSED = false;
                            if (parseBool(Settings.video_clips__trophy))
                              Chat.consume.onbullet = ({ element, message, subject, mentions }) => RECORD_PURCHASE({ element, message, subject, mentions, AutoClaimRewards }).then((recording) => {
                                if (!recording)
                                  alert.silent(`Recording "${title}" ran into an error! Will try to salvage video.`);
                                return true;
                              });
                          }
                        });
                        inputBox.modStyle(`background:#387aff`);
                        inputBox.focus();
                        TEXT_BOX_ALREADY_FOCUSED = true;
                      });
                    }
                    await WaitForElement(() => {
                      var _a4, _b, _c;
                      return (_c = (_b = (_a4 = $(".rewards-list")) == null ? void 0 : _a4.getElementByText(title, "i")) == null ? void 0 : _b.closest(".reward-list-item")) == null ? void 0 : _c.querySelector("button");
                    }).then(async (rewardButton) => {
                      const { coin: coin2, fiat: fiat2 } = STREAMER;
                      $notice(`Can "${title}" be bought yet? ${["No", "Yes"][+(coin2 >= cost)]}`);
                      if (nullish(rewardButton) || coin2 < cost || rewardButton.disabled) {
                        if (nullish(rewardButton) || rewardButton.disabled)
                          REWARDS_ON_COOLDOWN.set(id, +/* @__PURE__ */ new Date() + 6e4);
                        rewardsMenuButton.click();
                        return CLAIMING_REWARD = false;
                      }
                      rewardButton.click();
                      await WaitForElement(() => {
                        var _a4;
                        return (_a4 = $('.reward-center-body [data-test-selector*="required"i][data-test-selector*="points"i]')) == null ? void 0 : _a4.closest("button");
                      }, 1e4, 500).then((purchaseButton) => {
                        var _a4, _b;
                        if (nullish(purchaseButton) || purchaseButton.disabled) {
                          $log(`Unable to purchase "${title}" right now. Waiting ${toTimeString(6e4)}`);
                          return REWARDS_ON_COOLDOWN.set(id, +/* @__PURE__ */ new Date() + 6e4);
                        }
                        const cooldown = parseTime((_b = (_a4 = purchaseButton.previousElementSibling) == null ? void 0 : _a4.getElementByText(parseTime.pattern)) == null ? void 0 : _b.textContent);
                        if (cooldown > 0) {
                          $log(`Unable to purchase "${title}" right now. Waiting ${toTimeString(cooldown)}`);
                          return REWARDS_ON_COOLDOWN.set(id, +/* @__PURE__ */ new Date() + cooldown);
                        }
                        if (parseBool(Settings.video_clips__trophy) && ["SINGLE_MESSAGE_BYPASS_SUB_MODE", "SEND_HIGHLIGHTED_MESSAGE", "CHOSEN_MODIFIED_SUB_EMOTE_UNLOCK", "RANDOM_SUB_EMOTE_UNLOCK", "CHOSEN_SUB_EMOTE_UNLOCK"].missing((ID) => ID.contains(id))) {
                          Chat.consume.onbullet = ({ element, message, subject, mentions }) => RECORD_PURCHASE({ element, message, subject, mentions, AutoClaimRewards }).then((recording) => {
                            if (!recording)
                              alert.silent(`Recording "${title}" ran into an error! Will try to salvage video.`);
                            return true;
                          });
                          purchaseButton.click();
                        } else {
                          purchaseButton.click();
                        }
                        wait(1e4).then(() => {
                          var _a5, _b2;
                          top.TWITCH_INTEGRITY_FAIL = defined((_b2 = (_a5 = $('[data-test-selector*="reward"i]')) == null ? void 0 : _a5.closest("[aria-label]")) == null ? void 0 : _b2.querySelector('[class*="load"i][class*="spin"i]'));
                        });
                      }).finally(() => {
                        rewardsMenuButton.click();
                        CLAIMING_REWARD = false;
                      });
                    });
                  });
                });
          PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
        });
      };
      Timers.claim_reward = 15e3;
      Unhandlers.claim_reward = () => {
        clearInterval(DISPLAY_WALLET_BUTTONS);
      };
      __ClaimReward__:
        if (nullish(Settings.claim_reward) || parseBool(Settings.claim_reward)) {
          $remark("Adding reward claimer...");
          RegisterJob("claim_reward");
          Cache.load(["AutoClaimRewards", "AutoClaimAnswers"], ({ AutoClaimRewards, AutoClaimAnswers }) => {
            const streamers = STREAMER.jump;
            AutoClaimRewards ??= {};
            AutoClaimAnswers ??= {};
            for (const streamer in streamers) {
              const { id } = streamers[streamer];
              if (id in AutoClaimRewards && id in AutoClaimAnswers) {
                const rewards = AutoClaimRewards[id];
                const answers = AutoClaimAnswers[id];
                if (void 0 in answers) {
                  answers[rewards[0]] = answers[void 0];
                  $notice(`Correcting auto-answer entry ${streamer}@${rewards[0]} → "${answers[void 0]}"`);
                  delete answers[void 0];
                }
              }
            }
            Cache.save({ AutoClaimRewards, AutoClaimAnswers });
            PrepareForGarbageCollection(AutoClaimRewards, AutoClaimAnswers);
          });
          DISPLAY_WALLET_BUTTONS = setInterval(() => {
            var _a3, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
            const container = (_b = (_a3 = $('[data-test-selector*="required"i][data-test-selector*="points"i]:not(:empty), button[disabled] [data-test-selector*="required"i][data-test-selector*="points"i]:empty, [data-test-selector*="chat"i] svg[type*="warn"i]')) == null ? void 0 : _a3.closest) == null ? void 0 : _b.call(_a3, 'button, [class*="error"i]'), handler = $("#tt-auto-claim-reward-handler, #tt-purchase-and-record-handler");
            const f = furnish;
            Unlock_All_Emotes: {
              const emoteCheckout = $('[class*="unlock"i][class*="emote"i][class*="checkout"i]');
              if (defined(emoteCheckout))
                when.sated(() => $.all('[data-test-selector^="emote"i]', emoteCheckout)).then(async (available) => {
                  available = available.length;
                  if ($.defined("#tt-unlock-all-emotes") || available < 2)
                    return;
                  const item = await STREAMER.shop.find(({ title, id }) => {
                    var _a4, _b2;
                    return ((_b2 = (_a4 = $("#channel-points-reward-center-header")) == null ? void 0 : _a4.textContent) == null ? void 0 : _b2.equals(title)) || id.toUpperCase().contains("CHOSEN_SUB_EMOTE_UNLOCK");
                  }), cost = (item == null ? void 0 : item.cost) | 0, face = STREAMER.face ? furnish.img({ src: STREAMER.face }).outerHTML : Glyphs.modify("channelpoints", { height: 16, width: 16, fill: STREAMER.tint }), coin = (STREAMER == null ? void 0 : STREAMER.coin) | 0, amount = (coin / cost).floor().clamp(0, available);
                  if (amount < 1)
                    return;
                  emoteCheckout.firstElementChild.lastElementChild.insertAdjacentElement("beforebegin", furnish(`button#tt-unlock-all-emotes.tt-button.purple[@available=${available}][@cost=${cost}]`, {
                    style: `margin:0.5rem 0`,
                    onmouseup({ currentTarget }) {
                      let { available: available2, cost: cost2 } = currentTarget.dataset;
                      function buyOut(count = 1) {
                        var _a4;
                        count *= +$.defined('[class*="reward-center"i]');
                        available2 |= 0;
                        cost2 |= 0;
                        if (count > 0)
                          when.defined(() => {
                            var _a5, _b2;
                            return (_b2 = (_a5 = $.all('[class*="unlock"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')) == null ? void 0 : _a5.random()) == null ? void 0 : _b2.closest("button");
                          }).then((emote) => {
                            emote.click();
                            when.defined(() => $('[class*="unlock"i][class*="emote"i][class*="checkout"i] button')).then((unlock) => {
                              unlock.click();
                              when.defined(() => $('.reward-center-body [data-test-selector^="share"i][data-test-selector*="emote"i]'), 2500).then((success) => {
                                EXACT_POINTS_SPENT += cost2;
                                when.defined(() => $('[class*="reward-center"i] [class*="pop"i][class*="head"i] button')).then((back) => {
                                  back.click();
                                  wait(250).then(() => buyOut(--count));
                                });
                              });
                            });
                          });
                        else
                          (_a4 = $('[class*="reward-center"i] [class*="pop"i][class*="head"i] > [class*="right"i]:last-of-type')) == null ? void 0 : _a4.click();
                      }
                      __name(buyOut, "buyOut");
                      buyOut(amount);
                    },
                    innerHTML: `Unlock ${amount >= available ? `all (${available})` : amount} ${"emote".pluralSuffix(amount)}${cost > 0 ? ` for ${(cost * amount).suffix("", 1).replace(".0", "")}` : ""}`
                  }));
                });
            }
            Modify_All_Emotes: {
              const emoteCheckout = $('[class*="modify"i][class*="emote"i][class*="checkout"i]'), modifiers = "BW HF SG SQ TK".split(" "), modified = /* @__PURE__ */ new Map();
              if (defined(emoteCheckout))
                when.sated(() => $.all('[data-test-selector^="emote"i]', emoteCheckout)).then(async (available) => {
                  available = available.length * modifiers.length;
                  if ($.defined("#tt-modify-all-emotes") || available < 2)
                    return;
                  const item = await STREAMER.shop.find(({ title, id }) => {
                    var _a4, _b2;
                    return ((_b2 = (_a4 = $("#channel-points-reward-center-header")) == null ? void 0 : _a4.textContent) == null ? void 0 : _b2.equals(title)) || id.toUpperCase().contains("MODIFY_SUB_EMOTE");
                  }), cost = (item == null ? void 0 : item.cost) | 0, face = STREAMER.face ? furnish.img({ src: STREAMER.face }).outerHTML : Glyphs.modify("channelpoints", { height: 16, width: 16, fill: STREAMER.tint }), coin = (STREAMER == null ? void 0 : STREAMER.coin) | 0, amount = (coin / cost).floor().clamp(0, available);
                  if (!amount)
                    return;
                  emoteCheckout.firstElementChild.lastElementChild.insertAdjacentElement("beforebegin", furnish(`button#tt-modify-all-emotes.tt-button.purple[@available=${available}][@cost=${cost}][@modifiers=${modifiers}]`, {
                    style: `margin:0.5rem 0`,
                    onmouseup({ currentTarget }) {
                      let { available: available2, modifiers: modifiers2, cost: cost2 } = currentTarget.dataset;
                      modifiers2 = modifiers2.split(",");
                      function buyOut(count = 1) {
                        var _a4;
                        const rewardsBackButton = $('[class*="reward-center"i] [class*="pop"i][class*="head"i] button');
                        count *= +$.defined('[class*="reward-center"i]');
                        available2 |= 0;
                        cost2 |= 0;
                        if (count > 0)
                          when.defined(() => {
                            var _a5, _b2;
                            return (_b2 = (_a5 = $.all('[class*="modify"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')) == null ? void 0 : _a5.random()) == null ? void 0 : _b2.closest("button");
                          }, 500).then((emote) => {
                            emote.click();
                            when.defined(() => {
                              var _a5, _b2;
                              return (_b2 = (_a5 = $.all('[class*="reward-center"i] button:not(:disabled) img')) == null ? void 0 : _a5.random()) == null ? void 0 : _b2.closest("button");
                            }, 1e3).then((modifier) => {
                              modifier.click();
                              when.defined(() => $('button [class*="selected"i] img')).then((img) => {
                                var _a5, _b2;
                                const name2 = (_a5 = $('[data-test-selector*="preview"i], [class*="modify"i][class*="emote"i][class*="checkout"i] [data-a-target*="animation"i] ~ *')) == null ? void 0 : _a5.textContent;
                                if (nullish(name2))
                                  return;
                                const [em, md] = name2.split("_", 2);
                                if (!modified.has(em))
                                  modified.set(em, [md]);
                                else if ((_b2 = modified.get(em)) == null ? void 0 : _b2.missing(md))
                                  modified.set(em, [...modified.get(em), md]);
                                else
                                  return buyOut(count, rewardsBackButton == null ? void 0 : rewardsBackButton.click());
                                $remark(`Buying emote: "${name2}" for ${cost2}`);
                                when.defined(() => {
                                  var _a6;
                                  return (_a6 = $(`[data-test-selector="RequiredPoints"i], [class*="modify"i][class*="emote"i][class*="checkout"i] img[class*="channel"i][class*="points"i]:not([alt="${name2}"i])`)) == null ? void 0 : _a6.closest("button");
                                }, 250).then((unlock) => {
                                  unlock.click();
                                  when.defined(() => $(`[class*="modify"i][class*="emote"i][class*="checkout"i] img[alt="${name2}"i]`), 2500).then((success) => {
                                    EXACT_POINTS_SPENT += cost2;
                                    rewardsBackButton == null ? void 0 : rewardsBackButton.click();
                                    wait(500).then(() => buyOut(--count));
                                  });
                                });
                              });
                            });
                            wait(1200).then(() => {
                              if ($.nullish('[class*="reward-center"i] button:not(:disabled) img')) {
                                rewardsBackButton == null ? void 0 : rewardsBackButton.click();
                                when.defined(() => {
                                  var _a5, _b2;
                                  return (_b2 = (_a5 = $.all('[class*="modify"i][class*="emote"i][class*="checkout"i] [data-test-selector^="emote"i]')) == null ? void 0 : _a5.random()) == null ? void 0 : _b2.closest("button");
                                }, 500).then((emote2) => emote2.click());
                              }
                            });
                          });
                        else
                          (_a4 = $('[class*="reward-center"i] [class*="pop"i][class*="head"i] > [class*="right"i]:last-of-type')) == null ? void 0 : _a4.click();
                      }
                      __name(buyOut, "buyOut");
                      buyOut(amount);
                    },
                    innerHTML: `Modify ${amount >= available ? available : amount} ${"emote".pluralSuffix(amount)}${cost > 0 ? ` for ${(cost * amount).suffix("", 1).replace(".0", "")}` : ""}`
                  }));
                });
            }
            Wallet_Display: {
              const rewards = $.all(".rewards-list .reward-list-item:not([tt-wallet])");
              if (rewards.length < 1)
                break Wallet_Display;
              Cache.load("AutoClaimRewards", async ({ AutoClaimRewards }) => {
                var _a4, _b2, _c2;
                AutoClaimRewards ??= {};
                for (const reward of rewards) {
                  const $image = (_a4 = $("img", reward)) == null ? void 0 : _a4.src, $cost = parseCoin((_b2 = $('[data-test-selector="cost"i]', reward)) == null ? void 0 : _b2.textContent), $title = (((_c2 = $("button ~ * [title]", reward)) == null ? void 0 : _c2.textContent) || "").trim();
                  const [item] = await STREAMER.shop.filter(
                    ({ type = "UNKNOWN", id = "", title = "", cost = 0, image = "" }) => type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join("|$|"), true).value) || title.equals($title) && (cost == $cost || image.url.equals($image.url))
                  );
                  const child = $('[data-test-selector="cost"i]', reward);
                  const wanted = (AutoClaimRewards[STREAMER.sole] ??= []).contains(item == null ? void 0 : item.id);
                  child.modStyle(`animation-duration:${(1 / (STREAMER.coin / $cost)).clamp(1, 30).toFixed(2)}s`);
                  child.setAttribute("rainbow-border", wanted);
                  reward.setAttribute("tt-wallet-title", $title);
                  reward.setAttribute("tt-wallet-cost", $cost);
                  reward.setAttribute("tt-wallet", wanted);
                  if (REWARDS_ON_COOLDOWN.has(item == null ? void 0 : item.id))
                    child.closest(".reward-list-item").setAttribute("timed-out", toTimeString((REWARDS_ON_COOLDOWN.get(item == null ? void 0 : item.id) - +/* @__PURE__ */ new Date()).clamp(0, Infinity), "clock"));
                }
                PrepareForGarbageCollection(AutoClaimRewards);
              });
            }
            if (defined(handler))
              return void ($("button", handler).disabled = top.TWITCH_INTEGRITY_FAIL);
            Buy_and_Record: if (nullish(container) && parseBool(Settings.video_clips__trophy)) {
              const purchaseButton = (_d = (_c = $('[data-test-selector*="required"i][data-test-selector*="points"i]:empty')) == null ? void 0 : _c.closest) == null ? void 0 : _d.call(_c, "button");
              const cooldown = parseTime((_f = (_e = purchaseButton == null ? void 0 : purchaseButton.previousElementSibling) == null ? void 0 : _e.getElementByText(parseTime.pattern)) == null ? void 0 : _f.textContent) | 0;
              if (nullish(purchaseButton) || cooldown > 0)
                break Buy_and_Record;
              const [head, body] = purchaseButton.closest('[class*="reward"i][class*="content"i], [class*="chat"i][class*="input"i]:not([class*="error"i])').children, $body = $('[class*="tray"i][class*="body"i]', head), $title = ((((_g = $("#channel-points-reward-center-header", head)) == null ? void 0 : _g.textContent) ?? ((_h = $body == null ? void 0 : $body.previousElementSibling) == null ? void 0 : _h.textContent)) || "").trim(), $prompt = ((((_i = $(".reward-center-body p", body)) == null ? void 0 : _i.textContent) ?? ($body == null ? void 0 : $body.textContent)) || "").trim(), $image = (_j = $('[class*="reward-icon"i] img', body) ?? $('[class*="reward-icon"i] img', head)) == null ? void 0 : _j.src, [$cost = 0] = ((_o = (_n = (_m = (_l = ((_k = $('[data-test-selector="RewardText"i]', body)) == null ? void 0 : _k.parentElement) ?? $('[class*="reward"i][class*="header"i]', head)) == null ? void 0 : _l.innerText) == null ? void 0 : _m.split(/\s/)) == null ? void 0 : _n.map(parseCoin)) == null ? void 0 : _o.filter((n) => n > 0)) ?? [];
              const [item] = STREAMER.shop.filter(
                ({ type = "UNKNOWN", id = "", title = "", cost = 0, image = "" }) => {
                  var _a4;
                  return type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join("|$|"), true).value) || type.unlike("custom") && cost == $cost && id.equals([STREAMER.sole, type].join(":")) || title.equals($title) && (cost == $cost || ((_a4 = image == null ? void 0 : image.url) == null ? void 0 : _a4.equals($image == null ? void 0 : $image.url)));
                }
              );
              if (nullish(item))
                break Buy_and_Record;
              purchaseButton.dataset.ttAutoBuy = item.id;
              purchaseButton.insertAdjacentElement(
                "afterend",
                f(`#tt-purchase-and-record-handler[data-tt-reward-id=${item.id}]`).with(
                  f(".tt-inline-flex.tt-relative").with(
                    f(
                      "button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative",
                      {
                        style: `padding:1rem;text-align:center;min-width:fit-content;width:${getOffset(purchaseButton).width.ceil()}px!important`,
                        async onmouseup({ currentTarget }) {
                          var _a4, _b2, _c2, _d2, _e2;
                          const rewardID = ((_b2 = (_a4 = currentTarget.closest("[data-shop-item-id]")) == null ? void 0 : _a4.dataset) == null ? void 0 : _b2.shopItemId) ?? ((_d2 = (_c2 = currentTarget.closest("[data-tt-reward-id]")) == null ? void 0 : _c2.dataset) == null ? void 0 : _d2.ttRewardId);
                          const [item2] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID));
                          if (nullish(item2))
                            return;
                          Chat.consume.onbullet = ({ element, message, subject, mentions }) => RECORD_PURCHASE({ updateRecords: false, override: { rewardID, shop: [item2] }, element, message, subject, mentions }).then((recording) => {
                            if (!recording)
                              alert.silent(`Recording "${item2.title}" ran into an error! Will try to salvage video.`);
                            return true;
                          });
                          (_e2 = $(`[data-tt-auto-buy="${rewardID}"i]`)) == null ? void 0 : _e2.click();
                          wait(1e4).then(() => {
                            var _a5, _b3;
                            top.TWITCH_INTEGRITY_FAIL = defined((_b3 = (_a5 = $('[data-test-selector*="reward"i]')) == null ? void 0 : _a5.closest("[aria-label]")) == null ? void 0 : _b3.querySelector('[class*="load"i][class*="spin"i]'));
                          });
                        }
                      },
                      f("[style=height:2rem; width:2rem]", {
                        innerHTML: Glyphs.modify("video", { style: "padding-right:.2rem" })
                      }),
                      `Buy + Record`
                    )
                  )
                )
              );
            }
            if (nullish(container))
              return;
            Cache.load("AutoClaimRewards", async ({ AutoClaimRewards }) => {
              var _a4, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2;
              AutoClaimRewards ??= {};
              const [head, body] = container.closest('[class*="reward"i][class*="content"i], [class*="chat"i][class*="input"i]:not([class*="error"i])').children, $body = $('[class*="tray"i][class*="body"i]', head), $title = ((((_a4 = $("#channel-points-reward-center-header", head)) == null ? void 0 : _a4.textContent) ?? ((_b2 = $body == null ? void 0 : $body.previousElementSibling) == null ? void 0 : _b2.textContent)) || "").trim(), $prompt = ((((_c2 = $(".reward-center-body p", body)) == null ? void 0 : _c2.textContent) ?? ($body == null ? void 0 : $body.textContent)) || "").trim(), $image = (_d2 = $('[class*="reward-icon"i] img', body) ?? $('[class*="reward-icon"i] img', head)) == null ? void 0 : _d2.src, [$cost = 0] = ((_h2 = (_g2 = (_f2 = (_e2 = $("[disabled]", body) ?? $('[class*="reward"i][class*="header"i]', head)) == null ? void 0 : _e2.innerText) == null ? void 0 : _f2.split(/\s/)) == null ? void 0 : _g2.map(parseCoin)) == null ? void 0 : _h2.filter((n) => n > 0)) ?? [];
              const [item] = await STREAMER.shop.filter(
                ({ type = "UNKNOWN", id = "", title = "", cost = 0, image = "" }) => {
                  var _a5;
                  return type.equals("unknown") && id.equals(UUID.from([$image, $title.mutilate(), $cost].join("|$|"), true).value) || type.unlike("custom") && cost == $cost && id.equals([STREAMER.sole, type].join(":")) || title.equals($title) && (cost == $cost || ((_a5 = image == null ? void 0 : image.url) == null ? void 0 : _a5.equals($image == null ? void 0 : $image.url)));
                }
              );
              if (nullish(item))
                return;
              const itemIDs = AutoClaimRewards[STREAMER.sole] ??= [], rewardID = item.id;
              const textContent = itemIDs.contains(rewardID) ? `Do not buy` : `Buy when available${"*".repeat(+item.needsInput)}`;
              (_i2 = $('[id$="header"i], [class*="header"i]', head)) == null ? void 0 : _i2.modStyle(`animation-duration:${(1 / (STREAMER.coin / $cost)).clamp(1, 30).toFixed(2)}s`);
              (_j2 = $('[id$="header"i], [class*="header"i]', head)) == null ? void 0 : _j2.setAttribute("rainbow-text", itemIDs.contains(rewardID));
              container.insertAdjacentElement(
                "afterend",
                f(`#tt-auto-claim-reward-handler[data-tt-reward-id=${rewardID}]`).with(
                  f(".tt-inline-flex.tt-relative").with(
                    f(
                      "button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-medium.tt-border-bottom-right-radius-medium.tt-border-top-left-radius-medium.tt-border-top-right-radius-medium.tt-button-icon.tt-core-button.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative",
                      {
                        style: `padding:1rem;text-align:center;min-width:fit-content;width:${getOffset(container).width.ceil()}px!important`,
                        async onmouseup({ currentTarget }) {
                          var _a5, _b3, _c3, _d3;
                          const rewardID2 = ((_b3 = (_a5 = currentTarget.closest("[data-shop-item-id]")) == null ? void 0 : _a5.dataset) == null ? void 0 : _b3.shopItemId) ?? ((_d3 = (_c3 = currentTarget.closest("[data-tt-reward-id]")) == null ? void 0 : _c3.dataset) == null ? void 0 : _d3.ttRewardId);
                          const [item2] = await STREAMER.shop.filter(({ id }) => id.equals(rewardID2));
                          if (nullish(item2))
                            return;
                          Cache.load(["AutoClaimRewards", "AutoClaimAnswers"], async ({ AutoClaimRewards: AutoClaimRewards2, AutoClaimAnswers }) => {
                            var _a6, _b4;
                            AutoClaimRewards2 ??= {};
                            AutoClaimAnswers ??= {};
                            let itemIDs2 = AutoClaimRewards2[STREAMER.sole] ??= [];
                            let answers = AutoClaimAnswers[STREAMER.sole] ??= {};
                            const index = itemIDs2.indexOf(rewardID2);
                            if (~index) {
                              delete answers[rewardID2];
                              itemIDs2.splice(index, 1);
                            } else {
                              if (item2.needsInput) {
                                answers[rewardID2] = await prompt.silent(`<input hidden controller title='Input required to redeem "${item2.title.replace(/'/g, "&apos;")}"' />${item2.prompt || `Please provide input...`}`);
                                if (answers[rewardID2] === null)
                                  return;
                              }
                              itemIDs2.push(rewardID2);
                            }
                            itemIDs2 = itemIDs2.filter(defined);
                            answers = Object.filter(answers, itemIDs2);
                            if (!itemIDs2.length) {
                              delete AutoClaimRewards2[STREAMER.sole];
                              delete AutoClaimAnswers[STREAMER.sole];
                            } else {
                              AutoClaimRewards2[STREAMER.sole] = itemIDs2;
                              AutoClaimAnswers[STREAMER.sole] = answers;
                            }
                            const [node] = [...currentTarget.childNodes].filter((node2) => node2.nodeName.equals("#text"));
                            node.textContent = !~index ? `Do not buy` : `Buy when available${"*".repeat(+item2.needsInput)}`;
                            (_b4 = (_a6 = currentTarget.closest('[class*="reward"i][class*="content"i]')) == null ? void 0 : _a6.querySelector('[id$="header"i]')) == null ? void 0 : _b4.setAttribute("rainbow-text", !~index);
                            Cache.save({ AutoClaimRewards: AutoClaimRewards2, AutoClaimAnswers });
                            PrepareForGarbageCollection(AutoClaimRewards2, AutoClaimAnswers);
                          });
                        }
                      },
                      f("[style=height:2rem; width:2rem]", {
                        innerHTML: Glyphs.modify("wallet", { style: "padding-right:.2rem" })
                      }),
                      textContent
                    )
                  )
                )
              );
              PrepareForGarbageCollection(AutoClaimRewards);
            });
            (_q = (_p = $(".reward-center-body img")) == null ? void 0 : _p.closest(":not(img,:only-child)")) == null ? void 0 : _q.setAttribute("tt-rewards-calc", "after");
          }, 300);
        }
      __RecordForeignRewards__:
        if (parseBool(Settings.record_foreign_rewards)) {
          Chat.onbullet = async ({ element, message, subject, mentions, usable }) => {
            var _a3, _b, _c;
            if (!usable)
              return;
            element = await element;
            subject ||= element.dataset.type;
            const rewardID = ((_a3 = element.dataset) == null ? void 0 : _a3.shopItemId) ?? ((_c = (_b = element.closest("[data-tt-reward-id]")) == null ? void 0 : _b.dataset) == null ? void 0 : _c.ttRewardId) ?? element.dataset.uuid;
            const [item] = await STREAMER.shop.filter(({ id: id2 }) => id2.equals(rewardID));
            if (nullish(item))
              return;
            const { id, title } = item;
            const { sole } = STREAMER;
            Cache.load(["AutoClaimRewards"], async ({ AutoClaimRewards }) => {
              AutoClaimRewards ??= {};
              const itemIDs = AutoClaimRewards[sole] ??= [];
              const index = itemIDs.indexOf(rewardID);
              if (!~index)
                return;
              RECORD_PURCHASE({ fromUser: false, element, message, subject, mentions, AutoClaimRewards });
              PrepareForGarbageCollection(AutoClaimRewards);
            });
          };
        }
    }
  });

  // src/plugins/up-next/helpers.js
  plugin({
    id: "up_next_helpers",
    /**
     * Installs the "First in Line" helper: configures wait times based on user settings and defines the `REDO_FIRST_IN_LINE_QUEUE` utility function.
     * @param {Object} options - Installation options
     * @param {StopWatch} options.StopWatch - StopWatch utility
     * @returns {Promise<void>}
     */
    async install({ StopWatch }) {
      FIRST_IN_LINE_WAIT_TIME = parseInt(
        parseBool(Settings.first_in_line) ? Settings.first_in_line_time_minutes : parseBool(Settings.first_in_line_plus) ? Settings.first_in_line_plus_time_minutes : parseBool(Settings.first_in_line_all) ? Settings.first_in_line_all_time_minutes : parseBool(Settings.first_in_line_now) ? 0 : 0
      ) | 0;
      let ALREADY_RESTORING_DEAD_CHANNEL = false;
      top.REDO_FIRST_IN_LINE_QUEUE = /* @__PURE__ */ __name(async function REDO_FIRST_IN_LINE_QUEUE2(url, search = null) {
        var _a3;
        if (nullish(url) || FIRST_IN_LINE_HREF === url && [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].filter(nullish).length < 1)
          return;
        else if (nullish(search))
          url = parseURL(url).addSearch(location.search);
        else
          url = parseURL(url).addSearch(((_) => {
            for (const k in _)
              if (_[k] === "")
                delete _[k];
            return _;
          })(search));
        let { href, pathname } = url, name2 = pathname.slice(1), channel = await (ALL_CHANNELS.find((channel2) => channel2.name.equals(name2)) ?? new Search(name2).then(Search.convertResults));
        if (nullish(channel))
          return $error(`Unable to create job for "${href}"`);
        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
        STARTED_TIMERS == null ? true : delete STARTED_TIMERS.WARNING;
        FIRST_IN_LINE_HREF = href;
        GetNextStreamer.cachedStreamer = channel;
        name2 = ((_a3 = channel.name) == null ? void 0 : _a3.equals(name2)) ? channel.name : name2;
        if (!ALL_FIRST_IN_LINE_JOBS.filter((href2) => href2 == null ? void 0 : href2.length).length)
          FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
        $log(`[Queue Redo] Waiting ${toTimeString(GET_TIME_REMAINING() | 0)} before leaving for "${name2}" → ${href}`, /* @__PURE__ */ new Date());
        FIRST_IN_LINE_WARNING_JOB = setInterval(async () => {
          let timeRemaining = GET_TIME_REMAINING();
          timeRemaining = timeRemaining < 0 ? 0 : timeRemaining;
          if (!UP_NEXT_ALLOW_THIS_TAB)
            return;
          if (FIRST_IN_LINE_PAUSED)
            return;
          if (timeRemaining > 6e4)
            return;
          if (defined(STARTED_TIMERS.WARNING))
            return;
          STARTED_TIMERS.WARNING = true;
          $log("Heading to stream in", toTimeString(timeRemaining), FIRST_IN_LINE_HREF, /* @__PURE__ */ new Date());
          const url2 = parseURL(FIRST_IN_LINE_HREF);
          if (nullish(url2.pathname))
            return;
          let { name: name3 } = await GetNextStreamer();
          if (url2.pathname.slice(1).unlike(name3))
            name3 = url2.pathname.slice(1);
          confirm.timed(`<div hidden controller title="${Settings.stream_preview ? `Up next: ${name3}` : "Coming up next..."}" okay="Go now" deny="Skip ${name3}"></div>${Settings.stream_preview ? "" : `Up next: <a href="${url2.href}">${name3}</a>`}`, timeRemaining).then((action) => {
            var _a4;
            if (nullish(action))
              return;
            const current = parseURL(FIRST_IN_LINE_HREF).pathname, thisJob = ALL_FIRST_IN_LINE_JOBS.findIndex((job) => {
              var _a5;
              return (_a5 = parseURL(job).pathname) == null ? void 0 : _a5.equals(current);
            }), [removed = FIRST_IN_LINE_HREF] = thisJob < 0 ? [] : ALL_FIRST_IN_LINE_JOBS.splice(thisJob, 1), name4 = parseURL(removed).pathname.slice(1), [next] = ALL_FIRST_IN_LINE_JOBS;
            $notice(`${["Skipping", "Heading to"][+action]} Up Next channel (confirmation):`, removed);
            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
            FIRST_IN_LINE_HREF = void 0;
            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(FIRST_IN_LINE_TIMER);
            if (defined(next))
              REDO_FIRST_IN_LINE_QUEUE2(next, { redo: ((_a4 = parseURL(removed).searchParameters) == null ? void 0 : _a4.redo) ?? "" });
            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
              if (action) {
                goto(parseURL(removed).addSearch({ tool: "first-in-line--ok" }).href);
              } else {
                $log("Canceled First in Line event", removed);
                const balloonChild = $(`[id^="tt-balloon-job"i][href$="/${name4}"i]`), animationID = (balloonChild == null ? void 0 : balloonChild.getAttribute("animationID")) || -1;
                clearInterval(animationID);
                balloonChild == null ? void 0 : balloonChild.remove();
              }
            });
          });
          when.defined(() => $(".tt-confirm-container")).then((container) => {
            $.body.append(furnish("style").with(`.tt-confirm-header { background:#0008 } .tt-confirm-body, .tt-confirm-footer { background:#0000; text-shadow:0 0 1rem #000 }`));
            container.append(furnish(`iframe[src=https://player.twitch.tv/?channel=${name3}&controls=false&muted=true&parent=twitch.tv&quality=160p]`, { style: "position:absolute;top:4px;z-index:-9;padding:0;max-width:calc(100% - 4px);max-height:calc(100% - 4px);border-radius:inherit" }));
          });
        }, 1e3);
        FIRST_IN_LINE_JOB = setInterval(() => {
          let index = ALL_CHANNELS.findIndex((channel3) => RegExp(parseURL(channel3.href).pathname + "\\b", "i").test(FIRST_IN_LINE_HREF)), channel2 = ALL_CHANNELS[index], timeRemaining = GET_TIME_REMAINING();
          timeRemaining = timeRemaining < 0 ? 0 : timeRemaining;
          if (!UP_NEXT_ALLOW_THIS_TAB)
            return;
          if (FIRST_IN_LINE_PAUSED)
            return;
          if (nullish(channel2) && !ALREADY_RESTORING_DEAD_CHANNEL) {
            if (nullish(FIRST_IN_LINE_HREF))
              return;
            $log("Restoring dead channel (interval)...", FIRST_IN_LINE_HREF);
            const { href: href2, pathname: pathname2 } = parseURL(FIRST_IN_LINE_HREF), channelID = UUID.from(pathname2).value;
            if (nullish(pathname2))
              return;
            ALREADY_RESTORING_DEAD_CHANNEL = true;
            const name3 = pathname2.slice(1);
            new Search(name3).then(Search.convertResults).then((streamer) => {
              const restored = {
                from: "SEARCH",
                href: href2,
                icon: typeof streamer.icon == "string" ? Object.assign(new String(streamer.icon), parseURL(streamer.icon)) : null,
                live: parseBool(streamer.live),
                name: streamer.name
              };
              ALREADY_RESTORING_DEAD_CHANNEL = false;
              ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
              ALL_FIRST_IN_LINE_JOBS[index] = restored;
            }).catch((error) => {
              ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.map((url2) => {
                var _a4;
                return (_a4 = url2 == null ? void 0 : url2.toLowerCase) == null ? void 0 : _a4.call(url2);
              }).isolate().filter((url2) => url2 == null ? void 0 : url2.length).filter((url2) => parseURL(url2).pathname != parseURL(FIRST_IN_LINE_HREF).pathname);
              FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
              Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                REDO_FIRST_IN_LINE_QUEUE2(ALL_FIRST_IN_LINE_JOBS[0]);
                $warn(error);
              });
            });
          }
          if (timeRemaining > 1e3)
            return;
          Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(), ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter((url2) => parseURL(url2).pathname.toLowerCase() != parseURL(FIRST_IN_LINE_HREF).pathname.toLowerCase()) }, (href2 = parseURL((channel2 == null ? void 0 : channel2.href) ?? FIRST_IN_LINE_HREF).addSearch({ ...parseURL(FIRST_IN_LINE_HREF).searchParameters ?? {} }).href) => {
            $log("Heading to stream now [Job Interval]", href2);
            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
            goto(parseURL(href2).addSearch({ tool: "first-in-line--timeout" }).href);
          });
        }, 1e3);
      }, "REDO_FIRST_IN_LINE_QUEUE");
      top.NEW_DUE_DATE = /* @__PURE__ */ __name(function NEW_DUE_DATE2(offset) {
        if (!UP_NEXT_ALLOW_THIS_TAB)
          return +/* @__PURE__ */ new Date() + 36e5;
        return +/* @__PURE__ */ new Date() + (offset ?? FIRST_IN_LINE_WAIT_TIME * 6e4);
      }, "NEW_DUE_DATE");
      top.GET_TIME_REMAINING = /* @__PURE__ */ __name(function GET_TIME_REMAINING2() {
        if (!UP_NEXT_ALLOW_THIS_TAB)
          return 36e5;
        const now = +/* @__PURE__ */ new Date(), due = FIRST_IN_LINE_DUE_DATE;
        return due - now;
      }, "GET_TIME_REMAINING");
      FIRST_IN_LINE_SAFETY_CATCH = setInterval(() => {
        const job = $("[up-next--body] [name][time]");
        if (nullish(job))
          return;
        const timeRemaining = parseInt(job.getAttribute("time"));
        if (timeRemaining <= 6e4 && $.nullish(".tt-confirm"))
          wait(6e4).then(() => {
            var _a3;
            const name2 = (_a3 = GetNextStreamer.cachedStreamer) == null ? void 0 : _a3.name;
            if ($.defined(".tt-confirm") || nullish(name2))
              return;
            $warn(`Mitigation for Up Next: Loose interval @ ${location} / ${/* @__PURE__ */ new Date()}`);
            confirm.timed(`Coming up next: <a href='./${name2}'>${name2}</a>`, timeRemaining).then((action) => {
              if (nullish(action))
                return;
              if (action) {
                goto(parseURL(`./${name2}`).addSearch({ tool: `up-next--ok` }).href);
              } else {
                const balloonChild = $(`[id^="tt-balloon-job"i][href$="/${name2}"i]`), animationID = (balloonChild == null ? void 0 : balloonChild.getAttribute("animationID")) || -1;
                clearInterval(animationID);
                balloonChild == null ? void 0 : balloonChild.remove();
              }
            });
          });
        clearInterval(FIRST_IN_LINE_SAFETY_CATCH);
      }, 1e3);
      const FIRST_IN_LINE_BALLOON__INSURANCE = setInterval(() => {
        if (NORMAL_MODE && nullish(FIRST_IN_LINE_BALLOON)) {
          FIRST_IN_LINE_BALLOON = new Balloon({ title: "Up Next", icon: UP_NEXT_ALLOW_THIS_TAB ? "calendar" : "error" });
          const imgSize = "70px";
          const pinned_button = FIRST_IN_LINE_BALLOON == null ? void 0 : FIRST_IN_LINE_BALLOON.addButton({
            attributes: {
              id: "pinned-streamer",
              contrast: THEME__PREFERRED_CONTRAST
            },
            icon: "pinned",
            onclick: /* @__PURE__ */ __name(async (event) => {
              var _a3, _b, _c, _d, _e, _f, _g;
              let { currentTarget } = event, parent = currentTarget.closest('[id^="tt-balloon-container"i]');
              const f = furnish;
              let body = $("#tt-reminder-listing"), search = $("#tt-pinned-search");
              if (defined(body))
                return body == null ? void 0 : body.remove();
              else
                body = f(`#tt-reminder-listing`);
              search = f(`input#tt-pinned-search.input.autocomplete[autocomplete=false][spellcheck=false][placeholder="Search for a streamer, game or description here... Esc to exit"]`, {
                style: "margin-top:1px",
                onkeyup: delay(async (event2) => {
                  let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event2, value = ((target == null ? void 0 : target.value) ?? (target == null ? void 0 : target.textContent) ?? (target == null ? void 0 : target.innerText) ?? "").trim();
                  const terms = value.split(/\s+/).map((term) => ["name", "game", "desc"].map((type) => `[${type}*="${term}"i]`).join(","));
                  if (value.length)
                    AddCustomCSSBlock(target.id, `#${target.id}-form ~ :not(${terms.join(",")}) { display: none }`);
                  else
                    RemoveCustomCSSBlock(target.id);
                  target.setAttribute("value", value);
                }, 250)
              });
              body.with(
                f(`form#${search.id}-form[action=#]`, { style: "position:sticky; top:4rem; z-index:99999" }).with(search)
              );
              const SearchableNames = new Set(ALL_CHANNELS.map((c) => c.name));
              const WantedNames = new Set(STREAMERS.map((c) => c.name));
              Cache.load("LiveReminders", async ({ LiveReminders }) => {
                try {
                  LiveReminders = JSON.parse(LiveReminders || "{}");
                } catch (error) {
                  LiveReminders ??= {};
                }
                for (const { name: name2 } in LiveReminders) {
                  SearchableNames.add(name2);
                  WantedNames.add(name2);
                }
                PrepareForGarbageCollection(LiveReminders);
              });
              parent.insertBefore(body, $("[up-next--body] > :nth-child(2)"));
              listing:
                for (const name2 of SearchableNames) {
                  if (nullish(name2))
                    continue listing;
                  const channel = ALL_CHANNELS.find((c) => c.name.equals(name2)) ?? await new Search(name2).then(Search.convertResults);
                  if (nullish(channel))
                    continue listing;
                  const _name = name2.toLowerCase();
                  const { icon, live } = channel;
                  const pinned = parseBool((_a3 = GetNextStreamer.pinnedStreamer) == null ? void 0 : _a3.equals(name2));
                  const wanted = WantedNames.has(name2);
                  const current = name2.equals(STREAMER.name);
                  const desc = ((_c = (_b = STREAMER.jump) == null ? void 0 : _b[_name]) == null ? void 0 : _c.title) ?? "";
                  const game = ((_g = (_f = (_e = (_d = STREAMER.jump) == null ? void 0 : _d[_name]) == null ? void 0 : _e.stream) == null ? void 0 : _f.game) == null ? void 0 : _g.name) ?? "";
                  autocomplete(search, { [name2]: [name2, game, desc].filter((s) => s.length).join(" - ") });
                  const container = f(
                    `.tt-pinnable`,
                    { name: name2, game, desc, live, style: `animation:fade-in 1s 1; background:var(--color-background-${pinned ? "chat" : "base"})` },
                    f(
                      ".simplebar-scroll-content",
                      {
                        style: "overflow: hidden;"
                      },
                      f(
                        ".simplebar-content",
                        {
                          style: "overflow: hidden; width:100%;"
                        },
                        f(".tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]").with(
                          f(
                            ".persistent-notification.tt-relative[@testSelector=persistent-notification]",
                            {
                              style: "width:100%"
                            },
                            f(".persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap").with(
                              f(
                                "a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]",
                                {
                                  // Sometimes, Twitch likes to default to `_blank`
                                  target: "_self",
                                  "@pinned": pinned,
                                  "@name": name2,
                                  "@icon": icon,
                                  href: `#📌${name2}`,
                                  style: `color:inherit!important`,
                                  onmouseup(event2) {
                                    var _a4, _b2;
                                    event2.preventDefault(true);
                                    const { currentTarget: currentTarget2 } = event2;
                                    let pinned2 = parseBool(currentTarget2.dataset.pinned);
                                    let oldValue, newValue;
                                    unpin: if (defined(GetNextStreamer.pinnedStreamer)) {
                                      const pidged = $(`.tt-pinnable [data-name="${GetNextStreamer.pinnedStreamer}"i]`);
                                      if (nullish(pidged))
                                        break unpin;
                                      oldValue = { ...pidged.dataset };
                                      pidged.dataset.pinned = false;
                                      pidged.closest(".tt-pinnable").modStyle(`background:var(--color-background-base);`);
                                      $(".tt-balloon-message strong", pidged).modStyle(`color:!delete`);
                                      $("strong", pidged).html(`${name2} &bull; Click to pin 📌`);
                                      (_a4 = pidged.closest("form")) == null ? void 0 : _a4.insertAdjacentElement("afterend", pidged.closest(".tt-pinnable"));
                                    }
                                    if (pinned2) {
                                      delete GetNextStreamer.pinnedStreamer;
                                      $("#pinned-streamer").innerHTML = Glyphs.pinned;
                                      Cache.remove(["PinnedStreamer"]);
                                    } else {
                                      newValue = { ...currentTarget2.dataset };
                                      pinned2 = currentTarget2.dataset.pinned = true;
                                      GetNextStreamer.pinnedStreamer = currentTarget2.dataset.name;
                                      $("#pinned-streamer").innerHTML = furnish(`.tt-border-radius-rounded`).with(furnish.img({ src: currentTarget2.dataset.icon, style: `min-width:calc(${imgSize}/2); border-radius:${imgSize}` })).outerHTML;
                                      currentTarget2.closest(".tt-pinnable").modStyle(`background:var(--color-background-chat);`);
                                      $(".tt-balloon-message strong", currentTarget2).modStyle(`color:var(--color-amazon)`);
                                      $("strong", currentTarget2).html(`${name2} &bull; Pinned. Click to unpin`);
                                      (_b2 = currentTarget2.closest('[id$="listing"i]').querySelector("form")) == null ? void 0 : _b2.insertAdjacentElement("beforeend", currentTarget2.closest(".tt-pinnable"));
                                      Cache.save({ PinnedStreamer: GetNextStreamer.pinnedStreamer });
                                    }
                                    Runtime.sendMessage({ action: `UPDATE_PINNED_STREAMER`, oldValue, newValue });
                                  }
                                },
                                f(".persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1").with(
                                  // Avatar
                                  f.div(
                                    f(".tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden").with(
                                      f(".tt-aspect.tt-aspect--align-top").with(
                                        f("img.tt-balloon-avatar.tt-image", { src: icon, style: `min-width:${imgSize}` })
                                      )
                                    )
                                  ),
                                  // Message body
                                  f(".tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1", { style: `max-width:calc(100% - ${imgSize})` }).with(
                                    f(".persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]").with(
                                      f("span.tt-c-text-alt").with(
                                        f("p.tt-balloon-message").with(
                                          f.span(
                                            f(`strong`, { innerHTML: `${name2} &bull; ${pinned ? "Pinned. Click to unpin" : "Click to pin 📌"}`, style: pinned ? "color:var(--color-amazon)" : "" })
                                          )
                                        )
                                      )
                                    ),
                                    // Subheader
                                    f(".tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05", { style: `max-width:100%` }).with(
                                      f(`[style="max-width:inherit"]`).with(
                                        f(`p.tt-hide-text-overflow`, { style: `text-indent:.25em; max-width:inherit` }).setTooltip(desc, { from: "top" }).with(desc)
                                      )
                                    ),
                                    // Footer (persistent)
                                    f(".tt-footer").with(
                                      f(`span.tt-${live ? "live" : "offline"}`, {
                                        style: `min-width:3.5em; background-color:var(--color-background-${current ? "accent" : wanted ? live ? "live" : "alt-2" : "brand"})`
                                      }, (current ? "viewing" : wanted ? live ? "live" : "offline" : "suggested").toUpperCase())
                                    )
                                  )
                                )
                              )
                            )
                          )
                        )
                      )
                    )
                  );
                  if (pinned)
                    search.insertAdjacentElement("afterend", container);
                  else
                    body.append(container);
                }
            }, "onclick")
          });
          pinned_button.tooltip = new Tooltip(pinned_button, "Pin a user to go to when the queue is <em>empty</em> and <em>offline</em>");
          if (defined(GetNextStreamer.pinnedStreamer))
            when.sated(() => ALL_CHANNELS).then(
              (A_C) => {
                var _a3;
                return pinned_button.innerHTML = furnish(`.tt-border-radius-rounded`).with(
                  furnish.img({
                    src: ((_a3 = A_C.find((c) => c.name.equals(GetNextStreamer.pinnedStreamer))) == null ? void 0 : _a3.icon) ?? `https://static-cdn.jtvnw.net/ttv-static-metadata/twitch_logo3.jpg`,
                    style: `min-width:calc(${imgSize}/2); border-radius:${imgSize}`
                  })
                ).outerHTML;
              }
            );
          const first_in_line_boost_button = FIRST_IN_LINE_BALLOON == null ? void 0 : FIRST_IN_LINE_BALLOON.addButton({
            attributes: {
              id: "up-next-boost",
              contrast: THEME__PREFERRED_CONTRAST
            },
            icon: "latest",
            onclick: /* @__PURE__ */ __name((event) => {
              var _a3, _b;
              let { currentTarget } = event, speeding = parseBool(currentTarget.getAttribute("speeding"));
              speeding = FIRST_IN_LINE_BOOST = !speeding;
              speeding = FIRST_IN_LINE_BOOST &&= (ALL_FIRST_IN_LINE_JOBS == null ? void 0 : ALL_FIRST_IN_LINE_JOBS.length) > 0;
              (_a3 = currentTarget.querySelector("svg[fill]")) == null ? void 0 : _a3.setAttribute("fill", "currentcolor");
              (_b = currentTarget.querySelector("svg[fill]")) == null ? void 0 : _b.modStyle(`opacity:${2 ** -!speeding}; fill:currentcolor`);
              currentTarget.setAttribute("speeding", speeding);
              if (defined(currentTarget.tooltip))
                currentTarget.tooltip.innerHTML = `${["Start", "Stop"][+speeding]} rushing the queue`;
              const up_next_button = $("[up-next--container] button");
              up_next_button == null ? void 0 : up_next_button.setAttribute("allowed", parseBool(UP_NEXT_ALLOW_THIS_TAB));
              up_next_button == null ? void 0 : up_next_button.setAttribute("speeding", parseBool(speeding));
              const oneMin = 6e4, fiveMin = 5.5 * oneMin, tenMin = 10 * oneMin;
              FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(
                FIRST_IN_LINE_TIMER = // If the streamer hasn't been on for longer than 10mins, wait until then
                STREAMER.time < tenMin ? (
                  // Boost is enabled
                  FIRST_IN_LINE_BOOST ? fiveMin + (tenMin - STREAMER.time) : FIRST_IN_LINE_WAIT_TIME * oneMin
                ) : (
                  // Boost is enabled
                  FIRST_IN_LINE_BOOST ? Math.min(GET_TIME_REMAINING(), fiveMin) : FIRST_IN_LINE_WAIT_TIME * oneMin
                )
              );
              REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
              $.all(`[up-next--body] [time]`).forEach((element) => element.setAttribute("time", FIRST_IN_LINE_TIMER));
              Cache.save({ FIRST_IN_LINE_BOOST, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });
            }, "onclick")
          });
          const first_in_line_pause_button = FIRST_IN_LINE_BALLOON == null ? void 0 : FIRST_IN_LINE_BALLOON.addButton({
            attributes: {
              id: "up-next-control",
              contrast: THEME__PREFERRED_CONTRAST
            },
            icon: "pause",
            onclick: /* @__PURE__ */ __name((event) => {
              var _a3;
              let { currentTarget } = event, paused = parseBool((_a3 = currentTarget.getAttribute("paused")) == null ? void 0 : _a3.equals("true"));
              paused = !paused;
              currentTarget.innerHTML = Glyphs[["pause", "play"][+paused]];
              currentTarget.setAttribute("paused", FIRST_IN_LINE_PAUSED = paused);
              currentTarget.setAttribute("paused-at", FIRST_IN_LINE_PAUSED_AT = +/* @__PURE__ */ new Date());
              currentTarget.setAttribute("paused-by", paused ? ["auto", "user"][+event.isTrusted] : "");
              if (defined(currentTarget.tooltip))
                currentTarget.tooltip.innerHTML = `${["Pause", "Resume"][+paused]} the queue`;
            }, "onclick")
          });
          const live_reminders_catalog_button = FIRST_IN_LINE_BALLOON == null ? void 0 : FIRST_IN_LINE_BALLOON.addButton({
            attributes: {
              id: "live-reminders-catalog",
              contrast: THEME__PREFERRED_CONTRAST
            },
            icon: "notify",
            left: true,
            onclick: /* @__PURE__ */ __name(async (event) => {
              let { currentTarget } = event, parent = currentTarget.closest('[id^="tt-balloon-container"i]');
              Cache.load(["LiveReminders", "ChannelPoints", "DVRChannels"], async ({ LiveReminders = null, ChannelPoints = {}, DVRChannels = null }) => {
                var _a3, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
                try {
                  LiveReminders = JSON.parse(LiveReminders || "{}");
                } catch (error) {
                  LiveReminders ??= {};
                }
                try {
                  DVRChannels = JSON.parse(DVRChannels || "{}");
                } catch (error) {
                  DVRChannels ??= {};
                }
                const Hash = {
                  live_reminders: UUID.from(JSON.stringify(LiveReminders)).value,
                  dvr_channels: UUID.from(JSON.stringify(DVRChannels)).value
                };
                const f = furnish;
                let body = $("#tt-reminder-listing"), head = $("[up-next--header]"), search = $("#tt-reminder-search");
                if (defined(body)) {
                  live_reminders_catalog_button.innerHTML = Glyphs.modify("notify", { height: "20px", width: "20px" });
                  live_reminders_catalog_button.tooltip.innerHTML = "View Live Reminders";
                  head.innerHTML = "Up Next";
                  return body == null ? void 0 : body.remove();
                } else {
                  live_reminders_catalog_button.innerHTML = Glyphs.modify("calendar", { height: "20px", width: "20px" });
                  live_reminders_catalog_button.tooltip.innerHTML = "View Up Next";
                  head.innerHTML = "Live Reminders";
                }
                body = f(`#tt-reminder-listing`);
                if (Object.keys(LiveReminders).length > 6) {
                  search = f(`input#tt-reminder-search.input.autocomplete[autocomplete=false][spellcheck=false][placeholder="Search for a streamer, game or description here... Esc to exit"]`, {
                    style: "margin-top:1px",
                    onkeyup: delay(async (event2) => {
                      let { target, code, altKey, ctrlKey, metaKey, shiftKey } = event2, value = ((target == null ? void 0 : target.value) ?? (target == null ? void 0 : target.textContent) ?? (target == null ? void 0 : target.innerText) ?? "").trim();
                      const terms = value.split(/\s+/).map((term) => ["name", "game", "desc"].map((type) => `[${type}*="${term}"i]`).join(","));
                      if (value.length)
                        AddCustomCSSBlock(target.id, `#${target.id}-form ~ :not(${terms.join(",")}) { display: none }`);
                      else
                        RemoveCustomCSSBlock(target.id);
                      target.setAttribute("value", value);
                    }, 250)
                  });
                  autocomplete(search, LiveReminders);
                  body.with(
                    f(`form#${search.id}-form[action=#]`, { style: "position:sticky; top:4rem; z-index:99999" }).with(search)
                  );
                }
                parent.insertBefore(body, $("[up-next--body] > :nth-child(2)"));
                const { abs, random, round } = Math;
                let reminders = [];
                const now = /* @__PURE__ */ new Date(), today = now.toLocaleDateString(top.LANGUAGE, { dateStyle: "short" }), yesterday = new Date(+now - 864e5).toLocaleDateString(top.LANGUAGE, { dateStyle: "short" });
                sorting:
                  for (const reminderName in LiveReminders)
                    reminders.push({ name: reminderName, time: new Date(LiveReminders[reminderName]) });
                reminders = reminders.sort((a, b) => abs(+now - +a.time) < abs(+now - +b.time) ? -1 : 1);
                if (!reminders.length)
                  return await alert.timed(`There are no Live Reminders to display<p tt-x>${new UUID()}</p>`, 7e3);
                listing:
                  for (let index = 0; index < reminders.length; ++index) {
                    if ($.nullish(`#tt-reminder-listing`))
                      break listing;
                    const { length } = reminders;
                    const { name: name2, time } = reminders[index];
                    let channel = await new Search(name2).then(Search.convertResults), ok = parseBool(channel == null ? void 0 : channel.ok);
                    let num = 3;
                    while (!ok && num-- > 0 && $.defined(`#tt-reminder-listing`)) {
                      Search.void(name2);
                      channel = await new Search(name2).then(Search.convertResults);
                      ok = parseBool(channel == null ? void 0 : channel.ok);
                    }
                    if (!num && !ok) {
                      channel = ALL_CHANNELS.find((channel2) => channel2.name.equals(name2));
                      if (nullish(channel == null ? void 0 : channel.name))
                        continue listing;
                    }
                    const [amount, fiat, face, notEarned, pointsToEarnNext] = (ChannelPoints[name2] ?? 0).toString().split("|"), sole = (_b = (_a3 = face == null ? void 0 : face.split("/")) == null ? void 0 : _a3.map(parseFloat)) == null ? void 0 : _b.shift();
                    if (!ok)
                      try {
                        const definitiveID = await new Search(name2, "sniffer", "getID");
                        if (nullish(definitiveID)) {
                          const real2 = await new Search(sole, "sniffer", "getName");
                          $warn(`Updating details about (#${sole}) "${name2}" → "${real2}"`);
                          Cache.load(`data/${name2}`, (cache) => {
                            Cache.save({ [`data/${real2}`]: cache[`data/${name2}`] });
                            Cache.remove(`data/${name2}`);
                          });
                          ChannelPoints[real2] = ChannelPoints[name2];
                          delete ChannelPoints[name2];
                          Cache.save({ ChannelPoints });
                          LiveReminders[real2] = LiveReminders[name2];
                          delete LiveReminders[name2];
                          Cache.save({ LiveReminders }, () => Settings.set({ "LIVE_REMINDERS": Object.keys(LiveReminders) }));
                          reminders.push({ name: real2, time });
                          PrepareForGarbageCollection(LiveReminders);
                          continue listing;
                        }
                      } catch (error) {
                        if (nullish(channel))
                          continue listing;
                      }
                    const legacy = +now < +time;
                    if (nullish(channel))
                      continue listing;
                    const real = new Date(((_c = channel.data) == null ? void 0 : _c.actualStartTime) || 0);
                    const day = time.toLocaleDateString(top.LANGUAGE, { dateStyle: "short" }), hour = time.toLocaleTimeString(top.LANGUAGE, { timeStyle: "short" }), recent = abs(+now - +time) / 36e5 < 24, live = +real > +time || await Search.getUserStatus(name2), [since] = toTimeString(live && time < now ? now - time : abs(now - time), "~hour hour|~minute minute|~second second").split("|").filter(parseFloat), [tense_A, tense_B] = [["", " ago"], ["in ", ""]][+legacy];
                    const _name = name2.toLowerCase();
                    const { href = `./${_name}`, icon = Runtime.getURL("profile.png"), desc = ((_e = (_d = STREAMER.jump) == null ? void 0 : _d[_name]) == null ? void 0 : _e.title) ?? "" } = channel;
                    const coinStyle = new CSSObject({ verticalAlign: "bottom", height: "20px", width: "20px" }), coinText = furnish("span.tt-live-reminder-point-amount[bottom-only]", {
                      "rainbow-border": notEarned == 0,
                      innerHTML: amount.replace(".0", "").toLocaleString(LANGUAGE)
                    }).outerHTML, coinIcon = ((face == null ? void 0 : face.contains("/")) ? furnish("span.tt-live-reminder-point-face", {
                      innerHTML: furnish("img", { src: `https://static-cdn.jtvnw.net/channel-points-icons/${face}`, style: coinStyle.toString() }).outerHTML
                    }) : furnish("span.tt-live-reminder-point-face", {
                      innerHTML: Glyphs.modify("channelpoints", { style: `vertical-align:bottom; ${coinStyle.toString()}` })
                    })).outerHTML;
                    const game = ((_i = (_h = (_g = (_f = STREAMER.jump) == null ? void 0 : _f[_name]) == null ? void 0 : _g.stream) == null ? void 0 : _h.game) == null ? void 0 : _i.name) ?? "", primaryColor = Color.destruct(((_k = (_j = STREAMER.jump) == null ? void 0 : _j[_name]) == null ? void 0 : _k.primaryColorHex) || "9147ff"), primaryColorDarker = `hsl(${primaryColor.H}deg,${primaryColor.S}%,${(primaryColor.L * 0.9).clamp(0, 75)}%)`, primaryColorLighter = `hsl(${primaryColor.H}deg,${primaryColor.S}%,${(primaryColor.L * 1.1).clamp(25, 100)}%)`;
                    const liveFontColor = THEME.equals("dark") ? Color.white : Color.black;
                    const [liveBGColor] = [primaryColor.HEX, primaryColorDarker, primaryColorLighter].map(Color.destruct).sort((a, b) => Color.contrast(liveFontColor, [b.R, b.G, b.B]) - Color.contrast(liveFontColor, [a.R, a.G, a.B]));
                    const status = `<span class="tt-${live ? "live" : "offline"}" style="min-width:3.5em;${!live ? "" : `background-color:${liveBGColor.HEX}`}">${live ? "LIVE" : recent ? tense_A + since.pluralSuffix(parseFloat(since)) + tense_B : [day, hour].join(" ")}</span>`;
                    const DVR_ON = parseBool(DVRChannels[_name]);
                    if ((_l = game || desc) == null ? void 0 : _l.length)
                      autocomplete(search, { [name2]: [name2, game, desc].filter((s) => s.length).join(" - ") });
                    const imgSize2 = "70px";
                    const container = f(
                      `.tt-reminder`,
                      { name: name2, game, desc, live, style: `animation:fade-in 1s 1; background:var(--color-background-base)` },
                      f(
                        ".simplebar-scroll-content",
                        {
                          style: "overflow: hidden;"
                        },
                        f(
                          ".simplebar-content",
                          {
                            style: "overflow: hidden; width:100%;"
                          },
                          f(".tt-align-items-center.tt-flex.tt-flex-column.tt-flex-grow-1.tt-flex-nowrap.tt-overflow-hidden[@testSelector=center-window__content]").with(
                            f(
                              ".persistent-notification.tt-relative[@testSelector=persistent-notification]",
                              {
                                style: "width:100%"
                              },
                              f(".persistent-notification__unread.tt-border-b.tt-flex.tt-flex-nowrap").with(
                                f(
                                  "a.tt-block.tt-full-width.tt-interactable.tt-interactable--alpha.tt-interactable--hover-enabled.tt-interactive[@testSelector=persistent-notification__click]",
                                  {
                                    // Sometimes, Twitch likes to default to `_blank`
                                    "target": "_self",
                                    href
                                  },
                                  f(".persistent-notification__area.tt-flex.tt-flex-nowrap.tt-pd-b-1.tt-pd-l-1.tt-pd-r-3.tt-pd-t-1").with(
                                    // Avatar
                                    f.div(
                                      f(
                                        ".tt-border-radius-rounded.tt-card-img.tt-card-img--size-4.tt-flex-shrink-0.tt-overflow-hidden",
                                        { style: !live ? "" : `border:3px solid ${primaryColor.HEX}` },
                                        f(".tt-aspect.tt-aspect--align-top").with(
                                          f("img.tt-balloon-avatar.tt-image", { src: icon, style: `min-width:${imgSize2}` })
                                        )
                                      )
                                    ),
                                    // Message body
                                    f(".tt-flex.tt-flex-column.tt-flex-nowrap.tt-mg-x-1", { style: `max-width:calc(100% - ${imgSize2})` }).with(
                                      f(".persistent-notification__body.tt-overflow-hidden[@testSelector=persistent-notification__body]").with(
                                        f("span.tt-c-text-alt").with(
                                          f("p.tt-balloon-message").with(
                                            !live ? f.strong(name2) : f.span(
                                              f(`strong`, { innerHTML: [name2, game].filter((s) => s.length).join(" &mdash; ") }),
                                              f(`span.tt-time-elapsed[start=${(+real > +time ? real : time).toJSON()}]`).with(hour),
                                              f(`p.tt-hide-text-overflow[style=text-indent:.25em]`).setTooltip(desc, { from: "top" }).with(desc)
                                            )
                                          )
                                        )
                                      ),
                                      // Subheader
                                      f(".tt-align-items-center.tt-flex.tt-flex-shrink-0.tt-mg-t-05", { style: `max-width:100%` }).with(
                                        f(".tt-mg-l-05", { style: `max-width:inherit` }).with(
                                          f("span.tt-balloon-subheader.tt-c-text-alt", { style: `max-width:inherit` }).html([status, coinIcon + coinText].join(" &bull; "))
                                        )
                                      ),
                                      // Footer (persistent)
                                      f("div", {
                                        /* ... */
                                      })
                                    )
                                  )
                                ),
                                f(
                                  ".persistent-notification__delete.tt-absolute.tt-pd-l-1",
                                  { style: `top:0.0rem; right:0` },
                                  f(".tt-align-items-start.tt-flex.tt-flex-nowrap").with(
                                    f(
                                      "button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__delete]",
                                      {
                                        name: name2,
                                        onmouseup: /* @__PURE__ */ __name((event2) => {
                                          let { currentTarget: currentTarget2 } = event2, name3 = currentTarget2.getAttribute("name");
                                          Cache.load("LiveReminders", async ({ LiveReminders: LiveReminders2 }) => {
                                            var _a4;
                                            try {
                                              LiveReminders2 = JSON.parse(LiveReminders2 || "{}");
                                            } catch (error) {
                                              LiveReminders2 ??= {};
                                            }
                                            const justInCase = { ...LiveReminders2[name3] };
                                            (_a4 = $(`.tt-reminder[name="${name3}"i]`)) == null ? void 0 : _a4.remove();
                                            delete LiveReminders2[name3];
                                            Cache.save({ LiveReminders: LiveReminders2 }, () => Settings.set({ "LIVE_REMINDERS": Object.keys(LiveReminders2) }));
                                            await confirm.timed(`Reminder for <a href="/${name3}">${name3}</a> removed successfully!<p tt-x>${UUID.from(name3).value}</p>`, 5e3).then((ok2) => {
                                              if (ok2 === false)
                                                Cache.save({ LiveReminders: { ...LiveReminders2, [name3]: justInCase } }, () => Settings.set({ "LIVE_REMINDERS": Object.keys(LiveReminders2) }));
                                            });
                                          });
                                        }, "onmouseup")
                                      },
                                      f("span.tt-button-icon__icon").with(
                                        f(
                                          "div",
                                          {
                                            style: "height:1.6rem; width:1.6rem",
                                            innerHTML: Glyphs.ignore
                                          }
                                        )
                                      )
                                    ).setTooltip(`Remove ${name2} from Live Reminders`, { from: "top" })
                                  )
                                ),
                                f(
                                  ".persistent-notification__popout.tt-absolute.tt-pd-l-1",
                                  { style: `top:2.5rem; right:0` },
                                  f(".tt-align-items-start.tt-flex.tt-flex-nowrap").with(
                                    f(
                                      "button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__popout]",
                                      {
                                        name: name2,
                                        onmouseup: /* @__PURE__ */ __name((event2) => {
                                          let { currentTarget: currentTarget2 } = event2, name3 = currentTarget2.getAttribute("name");
                                          MiniPlayer = name3;
                                        }, "onmouseup")
                                      },
                                      f("span.tt-button-icon__icon").with(
                                        f(
                                          "div",
                                          {
                                            style: "height:1.6rem; width:1.6rem",
                                            innerHTML: Glyphs.picture_in_picture
                                          }
                                        )
                                      )
                                    ).setTooltip(`Send to MiniPlayer`, { from: "top" })
                                  )
                                ),
                                parseBool(Settings.video_clips__dvr) ? f(
                                  ".persistent-notification__popout.tt-absolute.tt-pd-l-1",
                                  { style: `top:5rem; right:0` },
                                  f(".tt-align-items-start.tt-flex.tt-flex-nowrap").with(
                                    f(
                                      "button.tt-align-items-center.tt-align-middle.tt-border-bottom-left-radius-small.tt-border-bottom-right-radius-small.tt-border-top-left-radius-small.tt-border-top-right-radius-small.tt-button-icon.tt-button-icon--small.tt-core-button.tt-core-button--small.tt-inline-flex.tt-interactive.tt-justify-content-center.tt-overflow-hidden.tt-relative[@testSelector=persistent-notification__popout]",
                                      {
                                        name: name2,
                                        onmouseup: /* @__PURE__ */ __name((event2) => {
                                          let { currentTarget: currentTarget2 } = event2, name3 = currentTarget2.getAttribute("name");
                                          Cache.load("DVRChannels", async ({ DVRChannels: DVRChannels2 }) => {
                                            var _a4;
                                            try {
                                              DVRChannels2 = JSON.parse(DVRChannels2 || "{}");
                                            } catch (error) {
                                              DVRChannels2 ??= {};
                                            }
                                            let s = /* @__PURE__ */ __name((string) => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"), "s"), DVR_ID = name3.toLowerCase(), enabled = !parseBool((_a4 = DVRChannels2[DVR_ID]) == null ? void 0 : _a4.length), [title, subtitle, icon2] = [
                                              ["Turn DVR on", `${s(name3)} live streams will be recorded`, "host"],
                                              ["Turn DVR off", `${s(name3)} live streams will no longer be recorded`, "clip"]
                                            ][+!!enabled];
                                            icon2 = Glyphs.modify(icon2, { style: "fill:var(--user-contrast-color)!important", height: "20px", width: "20px" });
                                            $(".tt-button-icon__icon", currentTarget2).innerHTML = icon2;
                                            let message;
                                            if (enabled) {
                                              message = `${s(name3)} streams will be recorded.`;
                                              DVRChannels2[DVR_ID] = new ClipName(2);
                                            } else {
                                              message = `${name3} will not be recorded.`;
                                              delete DVRChannels2[DVR_ID];
                                            }
                                            Cache.save({ DVRChannels: DVRChannels2 }, () => Settings.set({ "DVR_CHANNELS": Object.keys(DVRChannels2) }).then(() => parseBool(message) && alert.timed(message, 7e3)).catch($warn));
                                          });
                                        }, "onmouseup")
                                      },
                                      f("span.tt-button-icon__icon").with(
                                        f(
                                          "div",
                                          {
                                            style: "height:1.6rem; width:1.6rem",
                                            innerHTML: Glyphs.modify(["host", "clip"][+DVR_ON], { style: `fill:${["currentcolor", "#f59b00"][+DVR_ON]}` })
                                          }
                                        )
                                      )
                                    ).setTooltip(`${["Start", "Stop"][+DVR_ON]} recording ${name2}'${/s$/.test(name2) ? "" : "s"} streams`, { from: "top" })
                                  )
                                ) : ""
                              )
                            )
                          )
                        )
                      )
                    );
                    const lastOnline = $.all('.tt-reminder[live="true"i]', body).pop(), [firstOffline] = $.all('.tt-reminder[live="false"i]', body);
                    if (defined(firstOffline) && live)
                      firstOffline.insertAdjacentElement("beforebegin", container);
                    else if (defined(lastOnline) && live)
                      lastOnline.insertAdjacentElement("afterend", container);
                    else
                      body.append(container);
                    if (+real > +time)
                      LiveReminders[name2].time = real;
                    if (live) {
                      const data = LiveReminders[name2];
                      delete LiveReminders[name2];
                      LiveReminders = { [name2]: data, ...LiveReminders };
                    }
                    (_m = $("[up-next--body] > *")) == null ? void 0 : _m.modStyle(`border-bottom:2px solid #0000; transition:border .5s; border-image:linear-gradient(90deg, var(--user-complement-color) ${(100 * (index / length)).toFixed(0)}%, #0000 0) 1;`);
                  }
                wait(500).then(() => $("[up-next--body] > *").modStyle("border-bottom:2px solid #0000; transition:border .5s; border-image:linear-gradient(90deg, #0000, #0000) 1;"));
                if (Hash.live_reminders != UUID.from(JSON.stringify(LiveReminders)).value || Hash.dvr_channels != UUID.from(JSON.stringify(DVRChannels)).value)
                  Cache.save({ LiveReminders, DVRChannels }, () => Settings.set({ "LIVE_REMINDERS": Object.keys(LiveReminders), "DVR_CHANNELS": Object.keys(DVRChannels) }));
                PrepareForGarbageCollection(LiveReminders, ChannelPoints, DVRChannels);
              });
            }, "onclick")
          });
          live_reminders_catalog_button.tooltip ??= new Tooltip(live_reminders_catalog_button, "View Live Reminders");
          LIVE_REMINDERS__LISTING_INTERVAL ??= setInterval(() => {
            for (const span of $.all(".tt-time-elapsed"))
              span.innerHTML = toTimeString(+/* @__PURE__ */ new Date() - +new Date(span.getAttribute("start")), "<&days=:>!hour:!minute:!second");
          }, 1e3);
          const first_in_line_help_button = FIRST_IN_LINE_BALLOON == null ? void 0 : FIRST_IN_LINE_BALLOON.addButton({
            attributes: {
              id: "up-next-help",
              contrast: THEME__PREFERRED_CONTRAST
            },
            icon: "help",
            left: true
          }), [accent, contrast] = (Settings.accent_color ?? "blue/12").split("/"), [colorName] = accent.split("-").reverse();
          first_in_line_help_button.tooltip ??= new Tooltip(first_in_line_help_button, "Drop a channel here to queue it");
          setInterval(() => {
            let thematicColor = Color.getName(THEME.equals("dark") ? THEME__CHANNEL_DARK : THEME__CHANNEL_LIGHT);
            const textShadow = ["black", "white"].contains(thematicColor) ? `text-shadow:0 0 2px ${THEME.equals("dark") ? "black" : "white"}` : "";
            thematicColor = { black: "white", white: "black" }[thematicColor] ?? thematicColor;
            first_in_line_help_button.tooltip.innerHTML = (UP_NEXT_ALLOW_THIS_TAB ? `Drop a channel in the <span style="color:var(--user-accent-color); ${textShadow}">${colorName}</span> area to queue it` : `Up Next is disabled for this tab`).replace(/\bcolored\b/g, ($0, $$, $_) => thematicColor);
          }, 1e3);
          Cache.load(["ALL_FIRST_IN_LINE_JOBS", "FIRST_IN_LINE_DUE_DATE", "FIRST_IN_LINE_BOOST"], (cache) => {
            var _a3, _b, _c;
            const oneMin = 6e4, fiveMin = 5.5 * oneMin, tenMin = 10 * oneMin;
            [FIRST_IN_LINE_HREF] = ALL_FIRST_IN_LINE_JOBS = cache.ALL_FIRST_IN_LINE_JOBS ?? [];
            FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && parseBool(ALL_FIRST_IN_LINE_JOBS == null ? void 0 : ALL_FIRST_IN_LINE_JOBS.length);
            FIRST_IN_LINE_DUE_DATE = cache.FIRST_IN_LINE_DUE_DATE ?? NEW_DUE_DATE(
              FIRST_IN_LINE_TIMER = // If the streamer hasn't been on for longer than 10mins, wait until then
              STREAMER.time < tenMin ? (
                // Boost is enabled
                FIRST_IN_LINE_BOOST ? fiveMin + (tenMin - STREAMER.time) : FIRST_IN_LINE_WAIT_TIME * oneMin
              ) : (
                // Boost is enabled
                FIRST_IN_LINE_BOOST ? Math.min(GET_TIME_REMAINING(), fiveMin) : FIRST_IN_LINE_WAIT_TIME * oneMin
              )
            );
            if (FIRST_IN_LINE_BOOST) {
              FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(Math.min(GET_TIME_REMAINING(), fiveMin));
              wait(5e3).then(() => $.all('[up-next--body] [time]:not([index="0"])').forEach((element) => element.setAttribute("time", FIRST_IN_LINE_TIMER = fiveMin)));
              Cache.save({ FIRST_IN_LINE_DUE_DATE });
              $remark(`Up Next Boost is enabled → Waiting ${toTimeString(GET_TIME_REMAINING() | 0)} before leaving for "${(_a3 = parseURL(FIRST_IN_LINE_HREF).pathname) == null ? void 0 : _a3.slice(1)}"`);
            } else {
              $remark(`Up Next Boost is disabled`);
            }
            first_in_line_boost_button.setAttribute("speeding", FIRST_IN_LINE_BOOST);
            (_b = first_in_line_boost_button.querySelector("svg[fill]")) == null ? void 0 : _b.setAttribute("fill", "");
            (_c = first_in_line_boost_button.querySelector("svg[fill]")) == null ? void 0 : _c.modStyle(`opacity:${2 ** -!FIRST_IN_LINE_BOOST}; fill:currentcolor`);
            first_in_line_boost_button.tooltip ??= new Tooltip(first_in_line_boost_button, `${["Start", "Stop"][FIRST_IN_LINE_BOOST | 0]} rushing the queue`);
            const up_next_button = $("[up-next--container] button");
            up_next_button == null ? void 0 : up_next_button.setAttribute("allowed", parseBool(UP_NEXT_ALLOW_THIS_TAB));
            up_next_button == null ? void 0 : up_next_button.setAttribute("speeding", parseBool(FIRST_IN_LINE_BOOST));
            first_in_line_pause_button.tooltip ??= new Tooltip(first_in_line_pause_button, `Pause the queue`);
          });
        }
        if (defined(FIRST_IN_LINE_BALLOON)) {
          FIRST_IN_LINE_BALLOON.body.ondragover ??= (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = UP_NEXT_ALLOW_THIS_TAB ? "move" : "none";
          };
          FIRST_IN_LINE_BALLOON.body.ondrop ??= async (event) => {
            var _a3;
            event.preventDefault();
            if (!UP_NEXT_ALLOW_THIS_TAB)
              return;
            const text = event.dataTransfer.getData("text");
            if (!parseURL.pattern.test(text))
              return;
            const { href, hostname, pathname, domainPath } = parseURL(text), name2 = pathname.slice(1).split("/").shift();
            if (!(hostname == null ? void 0 : hostname.length) || !(pathname == null ? void 0 : pathname.length))
              return $error(`Unknown [ondrop] text: "${text}"`);
            if (!/^tv\.twitch/i.test(domainPath.join(".")) || RESERVED_TWITCH_PATHNAMES.test(pathname))
              return $warn(`Unable to add link to Up Next "${href}"`);
            const streamer = await (ALL_CHANNELS.find((channel) => parseURL(channel.href).pathname.equals("/" + name2)) ?? (new Search(name2).then(Search.convertResults) ?? Promise.reject(`Unable to perform search for "${name2}"`)).then((search) => {
              const found = {
                from: "SEARCH",
                href,
                icon: typeof search.icon == "string" ? Object.assign(new String(search.icon), parseURL(search.icon)) : null,
                live: parseBool(search.live),
                name: search.name
              };
              ALL_CHANNELS = [...ALL_CHANNELS, found].filter(defined).filter(uniqueChannels);
              return found;
            }).catch($warn));
            $log("Adding to Up Next [ondrop]:", { href, streamer });
            if (nullish(streamer == null ? void 0 : streamer.icon)) {
              const name3 = (streamer == null ? void 0 : streamer.name) ?? ((_a3 = parseURL(href).pathname) == null ? void 0 : _a3.slice(1));
              if (defined(name3))
                new Search(name3).then(Search.convertResults).then((streamer2) => {
                  const restored = {
                    from: "SEARCH",
                    href,
                    icon: typeof streamer2.icon == "string" ? Object.assign(new String(streamer2.icon), parseURL(streamer2.icon)) : null,
                    live: parseBool(streamer2.live),
                    name: name3
                  };
                  ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
                });
            }
            if (ALL_FIRST_IN_LINE_JOBS.length < 1)
              FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
            ALL_FIRST_IN_LINE_JOBS = [...ALL_FIRST_IN_LINE_JOBS, href].map((url) => {
              var _a4;
              return (_a4 = url == null ? void 0 : url.toLowerCase) == null ? void 0 : _a4.call(url);
            }).isolate().filter((url) => url == null ? void 0 : url.length);
            Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
              REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
            });
          };
          FIRST_IN_LINE_BALLOON.icon.onmouseenter ??= (event) => {
            let { container, tooltip, title } = FIRST_IN_LINE_BALLOON, offset = getOffset(container);
            $("div#root > *").append(
              furnish(
                ".tt-tooltip-layer.tooltip-layer",
                { style: `transform: translate(${offset.left}px, ${offset.top}px); width: 30px; height: 30px; z-index: 9999;` },
                furnish(
                  ".tt-inline-flex.tt-relative.tt-tooltip-wrapper",
                  { "aria-describedby": tooltip.id, "show": true },
                  furnish("div", { style: "width: 30px; height: 30px;" }),
                  tooltip
                )
              )
            );
            tooltip.modStyle("display:block");
          };
          FIRST_IN_LINE_BALLOON.icon.onmouseleave ??= (event) => {
            var _a3, _b, _c;
            (_a3 = $("div#root .tt-tooltip-layer.tooltip-layer")) == null ? void 0 : _a3.remove();
            (_c = (_b = FIRST_IN_LINE_BALLOON.tooltip) == null ? void 0 : _b.closest("[show]")) == null ? void 0 : _c.setAttribute("show", false);
          };
          FIRST_IN_LINE_SORTING_HANDLER ??= new Sortable(FIRST_IN_LINE_BALLOON.body, {
            animation: 150,
            draggable: "[name]",
            filter: ".tt-static",
            onUpdate: /* @__PURE__ */ __name(({ oldIndex, newIndex }) => {
              var _a3;
              const [moved] = ALL_FIRST_IN_LINE_JOBS.splice(--oldIndex, 1);
              ALL_FIRST_IN_LINE_JOBS.splice(--newIndex, 0, moved);
              ALL_FIRST_IN_LINE_JOBS = ALL_FIRST_IN_LINE_JOBS.filter(defined);
              const channel = ALL_CHANNELS.find((channel2) => RegExp(parseURL(channel2.href).pathname + "\\b", "i").test(moved));
              if (nullish(channel))
                return $warn("No channel found:", { oldIndex, newIndex, desiredChannel: channel, givenChannel: moved });
              if ([oldIndex, newIndex].contains(0)) {
                const first = ALL_CHANNELS.find((channel2) => RegExp(parseURL(channel2.href).pathname + "\\b", "i").test(FIRST_IN_LINE_HREF = ALL_FIRST_IN_LINE_JOBS[0]));
                const time = (
                  /* FIRST_IN_LINE_TIMER = */
                  parseInt((_a3 = $(`[name="${(first == null ? void 0 : first.name) ?? ""}"i]`)) == null ? void 0 : _a3.getAttribute("time"))
                );
                $log("New First in Line event:", { ...first, time });
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);
              }
              REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
              Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
            }, "onUpdate")
          });
          if (Settings.first_in_line_none)
            FIRST_IN_LINE_BALLOON.container.modStyle("display:none!important");
          else
            FIRST_IN_LINE_LISTING_JOB ??= setInterval(async () => {
              for (let index = 0, fails = 0; UP_NEXT_ALLOW_THIS_TAB && index < (ALL_FIRST_IN_LINE_JOBS == null ? void 0 : ALL_FIRST_IN_LINE_JOBS.length); index++) {
                let href = ALL_FIRST_IN_LINE_JOBS[index], name2 = parseURL(href).pathname.slice(1), channel = await (ALL_CHANNELS.find((channel2) => channel2.name.equals(name2)) ?? new Search(name2).then(Search.convertResults));
                if (nullish(href) || nullish(channel))
                  continue;
                const { live } = channel;
                name2 = channel.name;
                if ($.defined(`[live][time][name="${name2}"i]`))
                  continue;
                const [balloon] = (FIRST_IN_LINE_BALLOON == null ? void 0 : FIRST_IN_LINE_BALLOON.add({
                  href,
                  src: channel.icon,
                  message: `${name2} <span style="display:${live ? "none" : "inline-block"}">is not live</span>`,
                  subheader: `Coming up next`,
                  onremove: /* @__PURE__ */ __name((event) => {
                    var _a3, _b, _c;
                    const index2 = ALL_FIRST_IN_LINE_JOBS.findIndex((href2) => event.href == href2), [removed] = index2 < 0 ? [] : ALL_FIRST_IN_LINE_JOBS.splice(index2, 1), purl = parseURL(removed), name3 = (_a3 = purl.pathname) == null ? void 0 : _a3.slice(1), redo = ((_b = purl.searchParameters) == null ? void 0 : _b.redo) ?? "";
                    $notice(`Removed from Up Next via Sorting Handler (${nth(index2 + 1, "ordinal-position")}):`, removed, "Was it canceled?", event.canceled);
                    if (event.canceled)
                      DO_NOT_AUTO_ADD.push(removed);
                    else if (redo.equals(name3))
                      ALL_FIRST_IN_LINE_JOBS.push(removed);
                    if (ALL_FIRST_IN_LINE_JOBS.length)
                      REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: ((_c = parseURL(ALL_FIRST_IN_LINE_JOBS[0]).searchParameters) == null ? void 0 : _c.redo) ?? "" });
                    if (index2 > 0) {
                      Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => event.callback(event.element));
                    } else {
                      $log("Destroying current job [Job Listings]...", { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME });
                      [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
                      FIRST_IN_LINE_HREF = void 0;
                      FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                      Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                        REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                        event.callback(event.element);
                      });
                    }
                  }, "onremove"),
                  attributes: {
                    name: name2,
                    live,
                    index,
                    time: index < 1 ? GET_TIME_REMAINING() : FIRST_IN_LINE_WAIT_TIME * 6e4,
                    style: `opacity: ${2 ** -!live}!important`
                  },
                  animate: /* @__PURE__ */ __name((container) => {
                    const subheader = $(".tt-balloon-subheader", container);
                    if (!UP_NEXT_ALLOW_THIS_TAB)
                      return -1;
                    if (container.hasAttribute("time-ctrl"))
                      return -1;
                    container.setAttribute("time-ctrl", true);
                    return setInterval(async () => {
                      new StopWatch("up_next_balloon__subheader_timer_animation");
                      const controller = getDOMPath(container);
                      let timeRemaining = GET_TIME_REMAINING();
                      timeRemaining = timeRemaining < 0 ? 0 : timeRemaining;
                      if (FIRST_IN_LINE_PAUSED) {
                        if (FIRST_IN_LINE_PAUSED_AT.floorToNearest(1e3) === (+/* @__PURE__ */ new Date()).floorToNearest(1e3))
                          return;
                        Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1e3) });
                        StopWatch.stop("up_next_balloon__subheader_timer_animation", 1e3);
                        return FIRST_IN_LINE_PAUSED_AT = +/* @__PURE__ */ new Date();
                      }
                      let name3 = container.getAttribute("name"), channel2 = await (ALL_CHANNELS.find((channel3) => name3.equals(channel3.name)) ?? new Search(name3).then(Search.convertResults)), { live: live2 } = channel2;
                      name3 = channel2.name;
                      const time = timeRemaining, intervalID = parseInt(container.getAttribute("animationID")), index2 = $.all("[id][guid][uuid]", container.parentElement).indexOf(container), anchor = $.all("a[connected-to]", container.parentElement)[index2];
                      if (anchor.hasAttribute("new-href")) {
                        const href2 = anchor.getAttribute("new-href");
                        anchor.removeAttribute("new-href");
                        ALL_FIRST_IN_LINE_JOBS.splice(index2, 1, anchor.href = href2);
                        container.setAttribute("href", href2);
                        REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                        Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                      }
                      if (time < 6e4 && nullish(FIRST_IN_LINE_HREF)) {
                        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);
                        $warn("Creating job to avoid [Job Listing] mitigation event", channel2);
                        return StopWatch.stop("up_next_balloon__subheader_timer_animation", 1e3), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel2.href);
                      }
                      if (time < 1e3)
                        wait(5e3, [container, intervalID]).then(([container2, intervalID2]) => {
                          $log("Mitigation event for [Job Listings]", { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, /* @__PURE__ */ new Date());
                          Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.filter((href2) => parseURL(href2).pathname.unlike(parseURL(FIRST_IN_LINE_HREF).pathname)), FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                            $warn(`Timer overdue [animation:first-in-line-balloon--initializer] » ${FIRST_IN_LINE_HREF}`);
                            goto(FIRST_IN_LINE_HREF);
                          });
                          return clearInterval(intervalID2);
                        });
                      container.setAttribute("time", time - (index2 > 0 ? 0 : 1e3));
                      if (container.getAttribute("index") != index2)
                        container.setAttribute("index", index2);
                      const theme = { light: "w", dark: "b" }[THEME];
                      $("a", container).modStyle(`background-color: var(--color-opac-${theme}-${index2 > 15 ? 1 : 15 - index2})`);
                      if (container.getAttribute("live") != live2 + "") {
                        $(".tt-balloon-message", container).innerHTML = `${name3} <span style="display:${live2 ? "none" : "inline-block"}">is not live</span>`;
                        container.modStyle(`opacity: ${2 ** -!live2}!important`);
                        container.setAttribute("live", live2);
                      }
                      subheader.innerHTML = index2 > 0 ? `${nth(index2 + 1, "ordinal-position")} &mdash; ${new Date(+/* @__PURE__ */ new Date() + time + index2 * FIRST_IN_LINE_WAIT_TIME * 6e4).toLocaleTimeString(top.LANGUAGE, { timeStyle: "short" })}` : toTimeString(time, "clock");
                      StopWatch.stop("up_next_balloon__subheader_timer_animation", 1e3);
                    }, 1e3);
                  }, "animate")
                })) ?? [];
              }
              FIRST_IN_LINE_BALLOON.counter.setAttribute("length", $.all(`[up-next--body] [time]`).length);
            }, 1e3);
        }
      }, 1e3);
    }
  });

  // src/plugins/up-next/first-in-line.js
  var HANDLED_NOTIFICATIONS;
  plugin({
    id: "first_in_line",
    timer: 1e3,
    /**
     * Init: Initializes arrays and objects for tracking notifications and timers.
     */
    init() {
      HANDLED_NOTIFICATIONS = [];
      STARTED_TIMERS = {};
    },
    /**
     * Processes actionable notifications to queue them for automatic navigation.
     * @param {Object} params - Execution context
     * @param {StopWatch} params.StopWatch - Timer for performance tracking
     * @param {Element|*} ActionableNotification - A specific notification to process
     * @param {string} [preferredPlace] - Where to insert the job in the queue (e.g., 'first' or 'last')
     */
    handler: /* @__PURE__ */ __name(async ({ StopWatch }, ActionableNotification, preferredPlace) => {
      var _a3, _b, _c, _d, _e;
      new StopWatch("first_in_line");
      const notifications = [...$.all('[data-test-selector*="notifications"i] [data-test-selector*="notification"i]'), ActionableNotification].filter(defined);
      preferredPlace ??= "last";
      (_b = (_a3 = $("[up-next--body]")) == null ? void 0 : _a3.setAttribute) == null ? void 0 : _b.call(_a3, "empty", !(UP_NEXT_ALLOW_THIS_TAB && ALL_FIRST_IN_LINE_JOBS.length));
      (_d = (_c = $("[up-next--body]")) == null ? void 0 : _c.setAttribute) == null ? void 0 : _d.call(_c, "allowed", !!UP_NEXT_ALLOW_THIS_TAB);
      if (!UP_NEXT_ALLOW_THIS_TAB)
        return;
      for (const notification of notifications) {
        const action = notification instanceof Element ? $('a[href^="/"]', notification) : notification;
        if (nullish(action))
          continue;
        const { href, pathname } = parseURL(action.href.toLowerCase()), { innerText } = action, uuid = UUID.from(innerText).value;
        if (HANDLED_NOTIFICATIONS.contains(uuid))
          continue;
        HANDLED_NOTIFICATIONS.push(uuid);
        if (DO_NOT_AUTO_ADD.contains(href) || RESERVED_TWITCH_PATHNAMES.test(href))
          continue;
        if ((_e = parseURL(href).pathname) == null ? void 0 : _e.equals(`/${STREAMER == null ? void 0 : STREAMER.name}`))
          continue;
        if ((parseURL(href).pathname ?? "/").length < 2)
          continue;
        if (!/\blive\b/i.test(innerText) && $.nullish('[class*="toast"i][class*="action"i]', notification))
          continue;
        $log("Received an actionable notification:", innerText, /* @__PURE__ */ new Date());
        const ALL_JOBS_PREFERENCE_SORTED = preferredPlace.toString().anyOf("begin", "beginning", "first", "head", "start", "0", "1", "^") ? [href, ...ALL_FIRST_IN_LINE_JOBS] : [...ALL_FIRST_IN_LINE_JOBS, href];
        if (defined(FIRST_IN_LINE_HREF ??= ALL_FIRST_IN_LINE_JOBS[0])) {
          if ([...ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_HREF].missing(href)) {
            $log("Pushing to First in Line:", href, /* @__PURE__ */ new Date());
            ALL_FIRST_IN_LINE_JOBS = ALL_JOBS_PREFERENCE_SORTED.map((url) => {
              var _a4;
              return (_a4 = url == null ? void 0 : url.toLowerCase) == null ? void 0 : _a4.call(url);
            }).isolate().filter((url) => url == null ? void 0 : url.length);
          } else {
            $warn("Not pushing to First in Line:", href, /* @__PURE__ */ new Date());
            $log(
              "Reason(s):",
              [FIRST_IN_LINE_JOB, ...ALL_FIRST_IN_LINE_JOBS],
              `It is the next job? ${["No", "Yes"][+(FIRST_IN_LINE_HREF === href)]}`,
              `It is in the queue already? ${["No", "Yes"][+ALL_FIRST_IN_LINE_JOBS.contains(href)]}`
            );
          }
          Cache.save({ ALL_FIRST_IN_LINE_JOBS });
          continue;
        } else {
          $log("Pushing to First in Line (no contest):", href, /* @__PURE__ */ new Date());
          ALL_FIRST_IN_LINE_JOBS = ALL_JOBS_PREFERENCE_SORTED.map((url) => {
            var _a4;
            return (_a4 = url == null ? void 0 : url.toLowerCase) == null ? void 0 : _a4.call(url);
          }).isolate().filter((url) => url == null ? void 0 : url.length);
          FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
          Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
          });
        }
        AddBalloon: {
          update();
          let index = ALL_FIRST_IN_LINE_JOBS.indexOf(href), name2 = parseURL(href).pathname.slice(1), channel = await (ALL_CHANNELS.find((channel2) => channel2.name.equals(name2)) ?? new Search(name2).then(Search.convertResults));
          if (nullish(channel))
            continue;
          const { live } = channel;
          name2 = channel.name;
          if ($.defined(`[live][time][name="${name2}"i]`))
            continue;
          index = index < 0 ? ALL_FIRST_IN_LINE_JOBS.length : index;
          const [balloon] = (FIRST_IN_LINE_BALLOON == null ? void 0 : FIRST_IN_LINE_BALLOON.add({
            href,
            src: channel.icon,
            message: `${name2} <span style="display:${live ? "none" : "inline-block"}">is not live</span>`,
            subheader: `Coming up next`,
            onremove: /* @__PURE__ */ __name((event) => {
              var _a4, _b2, _c2;
              const index2 = ALL_FIRST_IN_LINE_JOBS.findIndex((href2) => event.href == href2), [removed] = index2 < 0 ? [] : ALL_FIRST_IN_LINE_JOBS.splice(index2, 1), purl = parseURL(removed), name3 = (_a4 = purl.pathname) == null ? void 0 : _a4.slice(1), redo = ((_b2 = purl.searchParameters) == null ? void 0 : _b2.redo) ?? "";
              $notice(`Removed from Up Next via Balloon (${nth(index2 + 1, "ordinal-position")}):`, removed, "Was it canceled?", event.canceled);
              if (event.canceled)
                DO_NOT_AUTO_ADD.push(removed);
              else if (redo.equals(name3))
                ALL_FIRST_IN_LINE_JOBS.push(removed);
              if (ALL_FIRST_IN_LINE_JOBS.length)
                REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: ((_c2 = parseURL(ALL_FIRST_IN_LINE_JOBS[0]).searchParameters) == null ? void 0 : _c2.redo) ?? "" });
              if (index2 > 0) {
                Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => event.callback(event.element));
              } else {
                $log("Destroying current job [First in Line]...", { FIRST_IN_LINE_HREF, FIRST_IN_LINE_DUE_DATE });
                [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
                FIRST_IN_LINE_HREF = void 0;
                FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                  REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                  event.callback(event.element);
                });
              }
            }, "onremove"),
            attributes: {
              name: name2,
              live,
              index,
              time: index < 1 ? GET_TIME_REMAINING() : FIRST_IN_LINE_WAIT_TIME * 6e4,
              style: `opacity: ${2 ** -!live}!important`
            },
            animate: /* @__PURE__ */ __name((container) => {
              const subheader = $(".tt-balloon-subheader", container);
              if (!UP_NEXT_ALLOW_THIS_TAB)
                return -1;
              if (container.hasAttribute("time-ctrl"))
                return -1;
              container.setAttribute("time-ctrl", true);
              return setInterval(async () => {
                new StopWatch("first_in_line__job_watcher");
                let timeRemaining = GET_TIME_REMAINING();
                timeRemaining = timeRemaining < 0 ? 0 : timeRemaining;
                if (FIRST_IN_LINE_PAUSED) {
                  if (FIRST_IN_LINE_PAUSED_AT.floorToNearest(1e3) === (+/* @__PURE__ */ new Date()).floorToNearest(1e3))
                    return;
                  Cache.save({ FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(timeRemaining + 1e3) });
                  StopWatch.stop("first_in_line__job_watcher", 1e3);
                  return FIRST_IN_LINE_PAUSED_AT = +/* @__PURE__ */ new Date();
                }
                Cache.save({ FIRST_IN_LINE_BOOST });
                let name3 = container.getAttribute("name"), channel2 = await (ALL_CHANNELS.find((channel3) => name3.equals(channel3.name)) ?? new Search(name3).then(Search.convertResults)), { live: live2 } = channel2;
                name3 = channel2.name;
                const time = timeRemaining, intervalID = parseInt(container.getAttribute("animationID")), index2 = $.all("[id][guid][uuid]", container.parentElement).indexOf(container), anchor = $.all("a[connected-to]", container.parentElement)[index2];
                if (anchor.hasAttribute("new-href")) {
                  const href2 = anchor.getAttribute("new-href");
                  anchor.removeAttribute("new-href");
                  ALL_FIRST_IN_LINE_JOBS.splice(index2, 1, anchor.href = href2);
                  container.setAttribute("href", href2);
                  REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0]);
                  Cache.save({ ALL_FIRST_IN_LINE_JOBS });
                }
                if (time < 6e4 && nullish(FIRST_IN_LINE_HREF)) {
                  FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(time);
                  $warn("Creating job to avoid [First in Line] mitigation event", channel2);
                  return StopWatch.stop("first_in_line__job_watcher", 1e3), REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = channel2.href);
                }
                if (time < 1e3)
                  wait(5e3, [container, intervalID]).then(([container2, intervalID2]) => {
                    $log("Mitigation event from [First in Line]", { ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_HREF }, /* @__PURE__ */ new Date());
                    FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
                    Cache.save({ ALL_FIRST_IN_LINE_JOBS: ALL_FIRST_IN_LINE_JOBS.filter((href2) => parseURL(href2).pathname.unlike(parseURL(FIRST_IN_LINE_HREF).pathname)), FIRST_IN_LINE_DUE_DATE: FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE() }, () => {
                      $warn(`Timer overdue [animation:first-in-line-balloon] » ${FIRST_IN_LINE_HREF}`);
                      goto(FIRST_IN_LINE_HREF);
                    });
                    return clearInterval(intervalID2);
                  });
                container.setAttribute("time", time - (index2 > 0 ? 0 : 1e3));
                if (container.getAttribute("index") != index2)
                  container.setAttribute("index", index2);
                const theme = { light: "w", dark: "b" }[THEME];
                $("a", container).modStyle(`background-color: var(--color-opac-${theme}-${index2 > 15 ? 1 : 15 - index2})`);
                if (container.getAttribute("live") != live2 + "") {
                  $(".tt-balloon-message", container).innerHTML = `${name3} <span style="display:${live2 ? "none" : "inline-block"}">is not live</span>`;
                  container.modStyle(`opacity: ${2 ** -!live2}!important`);
                  container.setAttribute("live", live2);
                }
                subheader.innerHTML = index2 > 0 ? nth(index2 + 1, "ordinal-position") : toTimeString(time, "clock");
                StopWatch.stop("first_in_line__job_watcher", 1e3);
              }, 1e3);
            }, "animate")
          })) ?? [];
          if (defined(FIRST_IN_LINE_WAIT_TIME) && nullish(FIRST_IN_LINE_HREF)) {
            REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
            $log("Redid First in Line queue [First in Line]...", { FIRST_IN_LINE_DUE_DATE, FIRST_IN_LINE_WAIT_TIME, FIRST_IN_LINE_HREF });
          } else if (Settings.first_in_line_none) {
            $log("Heading to stream now [First in Line] is OFF", FIRST_IN_LINE_HREF);
            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
            goto(parseURL(FIRST_IN_LINE_HREF).addSearch({ tool: "first-in-line--killed" }).href);
          }
        }
      }
      FIRST_IN_LINE_BOOST &&= ALL_FIRST_IN_LINE_JOBS.length > 0;
      const filb = $("#up-next-boost");
      if (defined(filb) && parseBool(filb.getAttribute("speeding")) != parseBool(FIRST_IN_LINE_BOOST))
        filb.click();
      StopWatch.stop("first_in_line");
    }, "handler"),
    /**
     * Undoes first-in-line: Clears active timers and wipes the navigation queue.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      if (defined(FIRST_IN_LINE_JOB))
        [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
      if (UnregisterJob.__reason__.anyOf("default", "reinit", "job-destruction"))
        return;
      wait(5e3).then(() => {
        if (defined(FIRST_IN_LINE_HREF))
          FIRST_IN_LINE_HREF = "?";
        ALL_FIRST_IN_LINE_JOBS = [];
        FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
        Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE });
      });
    }, "unhandler"),
    /**
     * Checks if any version of the "First in Line" setting is enabled.
     * @returns {boolean} Whether the feature should be active
     */
    enabled() {
      return parseBool(Settings.first_in_line) || parseBool(Settings.first_in_line_plus) || parseBool(Settings.first_in_line_all) || parseBool(Settings.first_in_line_now);
    },
    /**
     * Sets up the "First in Line" feature: loads cached job data, calculates the next due date based on streamer status, and manages visual rainbow borders for redo entries.
     */
    async setup() {
      var _a3, _b, _c;
      __FirstInLine__: {
        await Cache.load(["ALL_FIRST_IN_LINE_JOBS", "FIRST_IN_LINE_DUE_DATE", "FIRST_IN_LINE_BOOST"], (cache) => {
          const oneMin = 6e4, fiveMin = 5.5 * oneMin, tenMin = 10 * oneMin;
          [FIRST_IN_LINE_HREF] = ALL_FIRST_IN_LINE_JOBS = cache.ALL_FIRST_IN_LINE_JOBS ?? [];
          FIRST_IN_LINE_BOOST = parseBool(cache.FIRST_IN_LINE_BOOST) && parseBool(ALL_FIRST_IN_LINE_JOBS == null ? void 0 : ALL_FIRST_IN_LINE_JOBS.length);
          FIRST_IN_LINE_DUE_DATE = cache.FIRST_IN_LINE_DUE_DATE ?? NEW_DUE_DATE(
            FIRST_IN_LINE_TIMER = // If the streamer hasn't been on for longer than 10mins, wait until then
            STREAMER.time < tenMin ? (
              // Boost is enabled
              FIRST_IN_LINE_BOOST ? fiveMin + (tenMin - STREAMER.time) : FIRST_IN_LINE_WAIT_TIME * oneMin
            ) : (
              // Boost is enabled
              FIRST_IN_LINE_BOOST ? Math.min(GET_TIME_REMAINING(), fiveMin) : FIRST_IN_LINE_WAIT_TIME * oneMin
            )
          );
        });
        RegisterJob("first_in_line");
        if (decodeURIComponent((_a3 = parseURL(top.location).searchParameters) == null ? void 0 : _a3.redo).toLowerCase().split(",").includes(STREAMER.name.toLowerCase()) && !decodeURIComponent((_b = parseURL(top.location).searchParameters) == null ? void 0 : _b.obit).toLowerCase().split(",").includes(STREAMER.name.toLowerCase()) && top.location.pathname.equals(`/${STREAMER.name}`) && STREAMER.live)
          Handlers.first_in_line({ href: top.location.href, innerText: `${STREAMER.name} is live [Entry Redo]` });
        setInterval(
          () => $.all('[id^="tt-balloon"i][name][live][href*="redo="i]').map((el) => {
            const { searchParameters } = parseURL(el.getAttribute("href"));
            const name2 = el.getAttribute("name");
            const redo = ((searchParameters == null ? void 0 : searchParameters.redo) ?? "").equals(name2);
            if (parseBool(el.getAttribute("rainbow-border")) != redo) {
              el.setAttribute("rainbow-border", redo);
              $(".tt-redo-btn svg", el).modStyle(
                redo ? "animation: 1s linear 0s infinite normal none running spinner" : "animation: !delete"
              );
            }
          }),
          100
        );
        top.onlocationchange = ({ from, to }) => {
          if (from == to)
            return;
          $remark("Resetting timer. Location change detected:", { from, to });
          if (!RESERVED_TWITCH_PATHNAMES.test(to))
            FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE();
        };
        if (nullish(FIRST_IN_LINE_HREF) && ALL_FIRST_IN_LINE_JOBS.length) {
          const [href] = ALL_FIRST_IN_LINE_JOBS, first = RegExp(parseURL(STREAMER.href).pathname + "\\b", "i").test(href), channel = ALL_CHANNELS.filter(isLive).filter((channel2) => channel2.href !== STREAMER.href).find((channel2) => parseURL(channel2.href).pathname === parseURL(href).pathname) ?? new Search(parseURL(href).pathname.slice(1)).then(Search.convertResults);
          if (nullish(channel) && !first) {
            const index = ALL_FIRST_IN_LINE_JOBS.findIndex((job) => job == href), dead = ALL_FIRST_IN_LINE_JOBS[index];
            $log("Restoring dead channel (initializer)...", dead);
            const { pathname } = parseURL(dead), channelID = UUID.from(pathname).value;
            const name2 = pathname.slice(1);
            new Search(name2).then(Search.convertResults).then((streamer) => {
              const restored = {
                from: "SEARCH",
                href,
                icon: typeof streamer.icon == "string" ? Object.assign(new String(streamer.icon), parseURL(streamer.icon)) : null,
                live: parseBool(streamer.live),
                name: streamer.name
              };
              ALL_CHANNELS = [...ALL_CHANNELS, restored].filter(defined).filter(uniqueChannels);
              REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
            }).catch((error) => {
              var _a4;
              const [removed] = index < 0 ? [] : ALL_FIRST_IN_LINE_JOBS.splice(index, 1), name3 = parseURL(removed).pathname.slice(1);
              $notice(`Necromancy work:`, removed);
              REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: ((_a4 = parseURL(removed).searchParameters) == null ? void 0 : _a4.redo) ?? "" });
              Cache.save({ ALL_FIRST_IN_LINE_JOBS }, () => {
                $warn(`Unable to perform search for "${name3}" - ${error}`, removed);
              });
            });
            break __FirstInLine__;
          } else if (!first) {
            REDO_FIRST_IN_LINE_QUEUE(FIRST_IN_LINE_HREF = href);
          } else if (first) {
            const [removed] = ALL_FIRST_IN_LINE_JOBS.splice(0, 1), name2 = parseURL(removed).pathname.slice(1);
            $notice(`Doppleganger work:`, removed);
            REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: ((_c = parseURL(removed).searchParameters) == null ? void 0 : _c.redo) ?? "" });
            [FIRST_IN_LINE_JOB, FIRST_IN_LINE_WARNING_JOB, FIRST_IN_LINE_WARNING_TEXT_UPDATE].forEach(clearInterval);
            Cache.save({ ALL_FIRST_IN_LINE_JOBS }, () => {
              $warn("Removed duplicate job", removed);
            });
          }
        }
      }
    }
  });

  // src/plugins/automation/live-reminders.js
  plugin({
    id: "live_reminders",
    timer: -2500,
    /**
     * Adds the "Remind me" action button to the channel's about section.
     * @param {Object} params - The plugin context
     * @param {Object} params.StopWatch - Utility to track and stop the handler execution
     */
    handler: /* @__PURE__ */ __name(({ StopWatch }) => {
      new StopWatch("live_reminders");
      const actionPanel = $(".about-section__actions");
      if (nullish(actionPanel))
        return StopWatch.stop("live_reminders");
      let action = $('[tt-action="live-reminders"i]', actionPanel);
      if (defined(action))
        return StopWatch.stop("live_reminders");
      Cache.load("LiveReminders", async ({ LiveReminders }) => {
        try {
          LiveReminders = JSON.parse(LiveReminders || "{}");
        } catch (error) {
          LiveReminders ??= {};
        }
        let f = furnish, s = /* @__PURE__ */ __name((string) => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"), "s"), reminderName = STREAMER.name, realName = Object.keys(LiveReminders).find((name2) => name2.equals(reminderName)), hasReminder = sated(realName), tense = parseBool(Settings.keep_live_reminders) ? "" : " next", stream_s = "stream".pluralSuffix(+!!tense), [title, subtitle, icon] = [
          ["Remind me", `Receive a notification for ${s(STREAMER.name)}${tense} live ${stream_s}`, "inform"],
          ["Reminder set", `You will receive a notification for ${s(STREAMER.name)}${tense} live ${stream_s}`, "notify"]
        ][+!!hasReminder];
        icon = Glyphs.modify(icon, { style: "fill:var(--user-contrast-color)!important", height: "20px", width: "20px" });
        action = f(
          "div",
          { "tt-action": "live-reminders", "for": realName, "remind": hasReminder, "action-origin": "foreign", style: `animation:1s fade-in 1;` },
          f("button", {
            onmouseup: /* @__PURE__ */ __name(async (event) => {
              const { currentTarget, isTrusted = false, button = -1 } = event;
              if (button)
                return;
              Cache.load("LiveReminders", async ({ LiveReminders: LiveReminders2 }) => {
                var _a3, _b;
                try {
                  LiveReminders2 = JSON.parse(LiveReminders2 || "{}");
                } catch (error) {
                  LiveReminders2 ??= {};
                }
                let s2 = /* @__PURE__ */ __name((string) => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"), "s"), reminderName2 = STREAMER.name, realName2 = Object.keys(LiveReminders2).find((name2) => name2.equals(reminderName2)), notReminded = empty(realName2), tense2 = parseBool(Settings.keep_live_reminders) ? "" : " next", stream_s2 = "stream".pluralSuffix(+!!tense2), [title2, subtitle2, icon2] = [
                  ["Remind me", `Receive a notification for ${s2(STREAMER.name)}${tense2} live ${stream_s2}`, "inform"],
                  ["Reminder set", `You will receive a notification for ${s2(STREAMER.name)}${tense2} live ${stream_s2}`, "notify"]
                ][+!!notReminded];
                icon2 = Glyphs.modify(icon2, { style: "fill:var(--user-contrast-color)!important", height: "20px", width: "20px" });
                $(".tt-action-icon", currentTarget).innerHTML = icon2;
                $(".tt-action-title", currentTarget).innerText = title2;
                $(".tt-action-subtitle", currentTarget).innerText = subtitle2;
                let message;
                if (notReminded) {
                  message = `You'll be notified when <a href="/${reminderName2}">${reminderName2}</a> goes live.`;
                  LiveReminders2[reminderName2] = STREAMER.live ? new Date((_a3 = STREAMER == null ? void 0 : STREAMER.data) == null ? void 0 : _a3.actualStartTime) : ((_b = STREAMER == null ? void 0 : STREAMER.data) == null ? void 0 : _b.lastSeen) ?? /* @__PURE__ */ new Date();
                } else {
                  message = `Reminder for <a href="/${reminderName2}">${reminderName2}</a> removed successfully!`;
                  delete LiveReminders2[reminderName2];
                }
                currentTarget.closest("[tt-action]").setAttribute("remind", notReminded);
                Cache.save({ LiveReminders: LiveReminders2 }, () => Settings.set({ "LIVE_REMINDERS": Object.keys(LiveReminders2) }).then(() => parseBool(message) && confirm.timed(message, 7e3)).catch($warn));
              });
            }, "onmouseup")
          }, f.div(
            f(".tt-action-icon").html(icon),
            f.div(
              f("p.tw-title.tt-action-title").with(title),
              f("p.tt-action-subtitle").with(subtitle)
            )
          ))
        );
        actionPanel.append(action);
        PrepareForGarbageCollection(LiveReminders);
      });
      StopWatch.stop("live_reminders");
    }, "handler"),
    /**
     * Undoes the live reminders feature by removing the action buttons and clearing the check interval.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      $.all('[tt-action="live-reminders"i]').map((action) => action.remove());
      [LIVE_REMINDERS__LISTING_INTERVAL].map(clearInterval);
    }, "unhandler"),
    /**
     * Determines if the live reminders feature is enabled in the settings.
     * @returns {boolean} True if the feature should be active
     */
    enabled() {
      return nullish(Settings.live_reminders) || parseBool(Settings.live_reminders);
    },
    /**
     * Initializes the live reminders system and sets up the background checker.
     */
    setup() {
      var _a3, _b;
      $remark("Adding Live Reminders...");
      const REMINDERS_INDEX = -1, REMINDERS_LENGTH = 0, PARSED_REMINDERS = /* @__PURE__ */ new Map();
      const LIVE_REMINDERS__CHECKER = /* @__PURE__ */ __name(() => {
        Cache.load("LiveReminders", async ({ LiveReminders }) => {
          var _a4, _b2;
          try {
            LiveReminders = JSON.parse(LiveReminders || "{}");
          } catch (error) {
            LiveReminders ??= {};
          }
          checking:
            for (const reminderName in LiveReminders) {
              const realName = Object.keys(LiveReminders).find((name3) => name3.equals(reminderName));
              culling: if (PARSED_REMINDERS.has(realName)) {
                const repeats = PARSED_REMINDERS.get(realName) + 1;
                PARSED_REMINDERS.set(realName, repeats);
                if (repeats % 3)
                  continue checking;
              }
              let channel = await new Search(reminderName).then(Search.convertResults), ok = parseBool(channel == null ? void 0 : channel.ok);
              let num = 3;
              while (!ok && num-- > 0) {
                Search.void(reminderName);
                channel = await new Search(reminderName).then(Search.convertResults);
                ok = parseBool(channel == null ? void 0 : channel.ok);
              }
              if (!num && !ok) {
                channel = ALL_CHANNELS.find((channel2) => channel2.name.equals(reminderName));
                if (nullish(channel == null ? void 0 : channel.name))
                  continue checking;
              }
              if (!channel.live) {
                continue checking;
              }
              const { name: name2, live, icon, href, data = { actualStartTime: null, lastSeen: null } } = channel;
              const lastOnline = new Date((+new Date(LiveReminders[realName])).floorToNearest(1e3)).toJSON(), justOnline = new Date((+new Date(data.actualStartTime)).floorToNearest(1e3)).toJSON();
              if (lastOnline != justOnline) {
                PARSED_REMINDERS.set(realName, 0);
                if (parseBool(Settings.keep_live_reminders)) {
                  LiveReminders[realName] = justOnline;
                } else {
                  (_b2 = (_a4 = $(`[tt-action="live-reminders"i][for="${realName}"i][remind="true"i] button`)) == null ? void 0 : _a4.dispatchEvent) == null ? void 0 : _b2.call(_a4, new MouseEvent("mouseup", { bubbles: false }));
                  delete LiveReminders[realName];
                }
                Cache.save({ LiveReminders }, async () => {
                  Handle_phantom_notification: {
                    const notification = { href, innerText: `${name2} is live [Live Reminders]` }, [page, note] = [STREAMER.href, href].map((url) => parseURL(url).pathname);
                    if (page == null ? void 0 : page.equals(note))
                      break Handle_phantom_notification;
                    Handlers.first_in_line(notification);
                    const last = new Date(lastOnline);
                    const just = new Date(justOnline);
                    const instance = last - just < 6e4 ? "just now" : toTimeString((last - just).abs().floorToNearest(6e4), "?minutes minutes ago");
                    Display_phantom_notification: {
                      $warn(`Live Reminders: ${name2} went live ${instance}`, /* @__PURE__ */ new Date());
                      alert.timed(`<a href='/${name2}'>${name2}</a> went live ${instance}!`, 7e3);
                    }
                    Update_cached_streamer: {
                      GetNextStreamer.cachedStreamer = null;
                      (GetNextStreamer.cachedReminders ??= []).push({
                        name: name2,
                        live,
                        href,
                        from: "LIVE_REMINDERS__CHECKER"
                      });
                      GetNextStreamer();
                    }
                  }
                });
              } else {
              }
            }
          Settings.set({ "LIVE_REMINDERS": Object.keys(LiveReminders) });
          PrepareForGarbageCollection(LiveReminders);
        });
      }, "LIVE_REMINDERS__CHECKER");
      let actionPanel = $(".about-section__actions");
      if (nullish(actionPanel)) {
        actionPanel = furnish(".about-section__actions", { style: `padding-left: 2rem; margin-bottom: 3rem; width: 24rem;` });
        (_b = (_a3 = $(".about-section")) == null ? void 0 : _a3.append) == null ? void 0 : _b.call(_a3, actionPanel);
      } else {
        for (const child of actionPanel.children)
          child.setAttribute("action-origin", "native");
      }
      setTimeout(LIVE_REMINDERS__CHECKER, 5e3);
      setInterval(LIVE_REMINDERS__CHECKER, 3e5);
    }
  });

  // src/plugins/automation/auto-follow.js
  plugin({
    id: "auto_follow",
    /**
     * Installs the auto-follow feature, initializing watch-time tracking and registering jobs to follow streamers during raids or after a set duration.
     * @param {Object} options - Plugin options
     * @param {Object} options.StopWatch - Stopwatch utility for performance tracking
     */
    async install({ StopWatch }) {
      STARTED_WATCHING = +/* @__PURE__ */ new Date();
      CURRENT_WATCHTIME_NAME = `WatchTimes/${STREAMER.name.toLowerCase()}`;
      Cache.load(CURRENT_WATCHTIME_NAME, (_) => {
        _[CURRENT_WATCHTIME_NAME] >>= 0;
        STARTED_WATCHING -= _[CURRENT_WATCHTIME_NAME];
        Cache.save(_);
      });
      GET_WATCH_TIME = /* @__PURE__ */ __name(function GET_WATCH_TIME2() {
        return +/* @__PURE__ */ new Date() - STARTED_WATCHING;
      }, "GET_WATCH_TIME");
      Handlers.auto_follow_raids = () => {
        var _a3;
        new StopWatch("auto_follow_raids");
        if (nullish(STREAMER))
          return StopWatch.stop("auto_follow_raids");
        const url = parseURL(location), data = url.searchParameters;
        let { like, follow } = STREAMER, raid = parseBool(((_a3 = data.referrer) == null ? void 0 : _a3.equals("raid")) || data.raided);
        if (!like && raid)
          follow();
        Cache.load("LastRaid", ({ LastRaid }) => {
          var _a4;
          const { from, to, type } = LastRaid || {};
          if (!like && ((_a4 = to == null ? void 0 : to.equals) == null ? void 0 : _a4.call(to, STREAMER.name)))
            follow();
        });
        StopWatch.stop("auto_follow_raids");
      };
      Timers.auto_follow_raids = 1e3;
      __AutoFollowRaid__:
        if (parseBool(Settings.auto_follow_raids) || parseBool(Settings.auto_follow_all)) {
          RegisterJob("auto_follow_raids");
        }
      let AUTO_FOLLOW_EVENT;
      Handlers.auto_follow_time = async () => {
        new StopWatch("auto_follow_time");
        let { like, follow } = STREAMER, mins = parseInt(Settings.auto_follow_time_minutes) | 0;
        if (!like) {
          const secs = GET_WATCH_TIME() / 1e3;
          if (secs > mins * 60)
            follow();
          AUTO_FOLLOW_EVENT ??= setTimeout(follow, mins * 6e4);
        }
        StopWatch.stop("auto_follow_time");
      };
      Timers.auto_follow_time = 1e3;
      __AutoFollowTime__:
        if (parseBool(Settings.auto_follow_time) || parseBool(Settings.auto_follow_all)) {
          RegisterJob("auto_follow_time");
        }
    }
  });

  // src/plugins/notifications/notification-sounds.js
  plugin({
    id: "notification_sounds",
    /**
     * Sets up the global notification state and creates the audio element for notification sounds.
     */
    async install() {
      NOTIFIED = { mention: 0, phrase: 0, whisper: 0 };
      NOTIFICATION_EVENTS = {};
      NOTIFICATION_SOUND = $("audio#tt-notification-sound") ?? furnish("audio#tt-notification-sound", {
        style: "display:none",
        innerHTML: [
          // 'mp3',
          "ogg"
        ].map((type) => {
          const types = { mp3: "mpeg" }, src = Runtime.getURL(`aud/${Settings.whisper_audio_sound ?? "goes-without-saying-608"}.${type}`);
          type = `audio/${types[type] ?? type}`;
          return furnish("source", { src, type }).outerHTML;
        }).join("")
      });
    }
  });

  // src/plugins/notifications/mention-audio.js
  plugin({
    id: "mention_audio",
    timer: -1e3,
    /**
     * Plays a notification sound when the user is mentioned in a chat message.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name(({ StopWatch }) => {
      new StopWatch("mention_audio");
      NOTIFICATION_EVENTS.onmention ??= Chat.onmessage = ({ mentions }) => {
        if (mentions.contains(USERNAME) && !(NOTIFICATION_SOUND == null ? void 0 : NOTIFICATION_SOUND.playing))
          NOTIFICATION_SOUND == null ? void 0 : NOTIFICATION_SOUND.play();
      };
      StopWatch.stop("mention_audio");
    }, "handler"),
    /**
     * Undoes mention audio by pausing the notification sound.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      NOTIFICATION_SOUND == null ? void 0 : NOTIFICATION_SOUND.pause();
    }, "unhandler")
  });

  // src/plugins/notifications/phrase-audio.js
  plugin({
    id: "phrase_audio",
    timer: 1e3,
    /**
     * Plays a notification sound when a message matching a highlighted phrase is detected.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name(({ StopWatch }) => {
      new StopWatch("phrase_audio");
      NOTIFICATION_EVENTS.onphrase ??= Chat.onmessage = (line) => {
        when((line2) => defined(line2.element) ? line2 : false, 1e3, line).then((element) => {
          if (element.hasAttribute("tt-light") && !(NOTIFICATION_SOUND == null ? void 0 : NOTIFICATION_SOUND.playing))
            NOTIFICATION_SOUND == null ? void 0 : NOTIFICATION_SOUND.play();
        });
      };
      StopWatch.stop("phrase_audio");
    }, "handler"),
    /**
     * Undoes phrase audio by pausing the notification sound.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      NOTIFICATION_SOUND == null ? void 0 : NOTIFICATION_SOUND.pause();
    }, "unhandler")
  });

  // src/plugins/notifications/whisper-audio.js
  plugin({
    id: "whisper_audio",
    timer: 1e3,
    /**
     * Plays a notification sound for new whispers or changes in the unread whisper count.
     * @param {Object} context - The plugin context
     */
    handler: /* @__PURE__ */ __name(({ StopWatch }) => {
      new StopWatch("whisper_audio");
      NOTIFICATION_EVENTS.onwhisper ??= Chat.onwhisper = ({ unread: unread2, from, message }) => {
        if (!unread2 && !from && !message)
          return;
        NOTIFICATION_SOUND == null ? void 0 : NOTIFICATION_SOUND.play();
      };
      const pill = $(".whispers__pill"), unread = parseInt(pill == null ? void 0 : pill.textContent) | 0;
      if (nullish(pill))
        return StopWatch.stop("whisper_audio"), NOTIFIED.whisper = 0;
      if (NOTIFIED.whisper >= unread)
        return StopWatch.stop("whisper_audio");
      NOTIFIED.whisper = unread;
      NOTIFICATION_SOUND == null ? void 0 : NOTIFICATION_SOUND.play();
      StopWatch.stop("whisper_audio");
    }, "handler"),
    /**
     * Undoes whisper audio by pausing the notification sound.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      NOTIFICATION_SOUND == null ? void 0 : NOTIFICATION_SOUND.pause();
    }, "unhandler"),
    /**
     * Checks if whisper audio notifications are enabled and permitted in the current tab.
     * @returns {boolean} Whether the feature is enabled
     */
    enabled() {
      return UP_NEXT_ALLOW_THIS_TAB && parseBool(Settings.whisper_audio);
    }
  });

  // src/plugins/currencies/points-receipt.js
  plugin({
    id: "points_receipt_placement",
    /**
     * Initializes the points receipt feature, sets up periodic updates for available points, and attempts to determine the channel points multiplier.
     * @param {Object} context - The plugin context containing `StopWatch`
     * @returns {Promise<void>}
     */
    async install({ StopWatch }) {
      var _a3, _b, _c, _d;
      let RECEIPT_TOOLTIP;
      let COUNTING_POINTS;
      EXACT_POINTS_SPENT = 0;
      let EXACT_POINTS_DEBTED = 0;
      let EXACT_POINTS_EARNED = 0;
      const COUNTING_HREF = NORMALIZED_PATHNAME;
      const OBSERVED_COLLECTION_ANIMATIONS = /* @__PURE__ */ new Map();
      let DISPLAYING_RANK;
      let RANK_TOOLTIP;
      const TALLY = /* @__PURE__ */ new Map();
      let CHANNEL_POINTS_MULTIPLIER;
      function UpdateReceiptDisplay() {
        var _a4;
        let receipt = EXACT_POINTS_EARNED - (EXACT_POINTS_SPENT + EXACT_POINTS_DEBTED), glyph = Glyphs.modify("channelpoints", { height: "20px", width: "20px", style: "vertical-align:bottom" }), { abs } = Math;
        receipt = receipt.floorToNearest(parseInt(String(Settings.channelpoints_receipt_display ?? "").replace("round", "")) || 1);
        const TIME_LEFT = (((_a4 = STREAMER.data) == null ? void 0 : _a4.dailyBroadcastTime) ?? 162e5) - STREAMER.time;
        let AVAILABLE_POINTS = TIME_LEFT < 1 ? -1 : (120 + 200 * +!top.TWITCH_INTEGRITY_FAIL) * CHANNEL_POINTS_MULTIPLIER * (TIME_LEFT / 36e5) | 0;
        if (AVAILABLE_POINTS < 1)
          AVAILABLE_POINTS = Infinity;
        RECEIPT_TOOLTIP.innerHTML = [
          // Earned
          abs(EXACT_POINTS_EARNED).suffix(" &uarr;", 1, "natural"),
          // Spent
          abs(EXACT_POINTS_SPENT + EXACT_POINTS_DEBTED).suffix(" &darr;", 1, "natural"),
          // Available (according to stremer's average stream time)
          parseBool(Settings.show_stats) ? [furnish(`marquee[direction=left][scrollamount=1]`, { style: "width:fit-content;vertical-align:top" }).html(`&larr;`), Glyphs.modify("channelpoints", { height: "12px", width: "12px", style: "vertical-align:-1px;position:relative" }).asNode, furnish(`span#tt-points-left-this-stream`).html(AVAILABLE_POINTS.prefix("", 1, "natural"))].map((e) => e.outerHTML).join("") : null
        ].filter(defined).join(" | ");
        $("#tt-points-receipt").innerHTML = `${glyph} ${abs(receipt).suffix(`&${"du"[+(receipt >= 0)]}arr;`, 1, "natural")}`;
      }
      __name(UpdateReceiptDisplay, "UpdateReceiptDisplay");
      setInterval(() => {
        var _a4;
        const container = $("#tt-points-left-this-stream");
        if (nullish(container))
          return;
        const TIME_LEFT = (((_a4 = STREAMER.data) == null ? void 0 : _a4.dailyBroadcastTime) ?? 162e5) - STREAMER.time;
        let AVAILABLE_POINTS = TIME_LEFT < 1 ? -1 : (120 + 200 * +!top.TWITCH_INTEGRITY_FAIL) * CHANNEL_POINTS_MULTIPLIER * (TIME_LEFT / 36e5) | 0;
        if (AVAILABLE_POINTS < 1)
          AVAILABLE_POINTS = Infinity;
        container.innerHTML = AVAILABLE_POINTS.prefix("", 1, "natural");
      }, 250);
      __GetMultiplierAmount__:
        if (nullish(CHANNEL_POINTS_MULTIPLIER)) {
          const button = $('[data-test-selector*="points"i][data-test-selector*="summary"i] button');
          if (defined(button)) {
            button.click();
            (_c = (_b = (_a3 = $('.reward-center-body [href*="//help.twitch.tv/"i]')) == null ? void 0 : _a3.closest(".reward-center-body")) == null ? void 0 : _b.querySelector("button")) == null ? void 0 : _c.click();
            CHANNEL_POINTS_MULTIPLIER = parseFloat((_d = $("#channel-points-reward-center-header h6")) == null ? void 0 : _d.innerText) || 1;
            button.click();
          } else {
            CHANNEL_POINTS_MULTIPLIER = 1;
          }
        }
      Handlers.points_receipt_placement = () => {
        new StopWatch("points_receipt_placement__ranking");
        DisplayRanking: {
          let placement;
          if ((placement = Settings.points_receipt_placement ??= "null").equals("null")) {
            StopWatch.stop("points_receipt_placement__ranking");
            break DisplayRanking;
          }
          DISPLAYING_RANK = setInterval(async () => {
            let container = $('[data-test-selector="chat-input-buttons-container"i]'), ranking = $("#tt-channel-point-ranking");
            if (nullish(container))
              return StopWatch.stop("points_receipt_placement__ranking");
            const scale = /* @__PURE__ */ __name((n) => n ** 9, "scale");
            let { cult, poll, rank } = STREAMER, place = (100 * scale(rank / cult)).clamp(1, 100) | 0, string = nth((rank * scale(rank / cult)).clamp(1, cult).round().toLocaleString(LANGUAGE)), color = ["#FFD700", "#C0C0C0", "#CD7F32"][((place / 10).ceil() || 1) - 1] ?? "#91FF47";
            rank = rank < 1 || isNaN(rank) ? "&infin;" : place <= 30 ? `<span style="text-decoration:${4 - ((place / 10).ceil() || 1)}px underline ${color}">${string}</span>` : string;
            if (nullish(ranking))
              container.insertBefore(ranking = furnish(
                "div",
                { style: "animation:1s fade-in 1;" },
                furnish("#tt-channel-point-ranking", { style: "display:flex; position:relative; align-items:center; vertical-align:middle; height:100%;" })
              ), container.lastElementChild);
            else
              ranking.innerHTML = Glyphs.modify("trophy", { height: "16px", width: "16px", fill: color }) + rank;
            RANK_TOOLTIP ??= new Tooltip(ranking, rank, { from: "top" });
            let placementString;
            if (rank.equals("&infin;"))
              placementString = `Unable to get your rank for this channel`;
            else
              placementString = `You are in the top ${place}% of ${STREAMER.ping ? "follow" : "view"}ers`;
            if (RANK_TOOLTIP.innerHTML.unlike(placementString))
              RANK_TOOLTIP.innerHTML = placementString;
          }, 5e3);
        }
        StopWatch.stop("points_receipt_placement__ranking");
        new StopWatch("points_receipt_placement");
        DisplayReceipt: {
          let placement;
          if ((placement = Settings.points_receipt_placement ??= "null").equals("null"))
            return StopWatch.stop("points_receipt_placement");
          const live_time = $(".live-time");
          if (nullish(live_time)) {
            StopWatch.stop("points_receipt_placement");
            return WaitForLiveTime("points_receipt_placement");
          }
          const classes = /* @__PURE__ */ __name((element) => [...element.classList].map((label) => "." + label).join(""), "classes");
          const container = live_time.closest(`*:not(${classes(live_time)})`), parent = container.closest(`*:not(${classes(container)})`);
          const f = furnish;
          const points_receipt = f(
            `${container.tagName}${classes(container)}`,
            { style: "min-width:7rem; text-align:center" },
            f(`${live_time.tagName}#tt-points-receipt${classes(live_time).replace(/\blive-time\b/gi, "points-receipt")}`, { receipt: 0, innerHTML: `${Glyphs.modify("channelpoints", { height: "20px", width: "20px", style: "vertical-align:bottom" })} 0 &uarr;` })
          );
          parent.append(points_receipt);
          RECEIPT_TOOLTIP = new Tooltip(points_receipt);
          COUNTING_POINTS = setInterval(async () => {
            var _a4;
            let points_receipt2 = $("#tt-points-receipt"), balance = $.last('[data-test-selector*="balance-string"i]'), exact_debt = $('[data-test-selector^="prediction-checkout"i], [data-test-selector*="user-prediction"i][data-test-selector*="points"i], [data-test-selector*="user-prediction"i] p, [class*="points-icon"i] ~ p *:not(:empty)'), exact_change = $('[class*="points"i][class*="summary"i][class*="add-text"i]');
            if (nullish(points_receipt2))
              return RestartJob("points_receipt_placement", "missing:points_receipt");
            const [chat] = $.all('[role] ~ *:is([role="log"i], [class~="chat-room"i], [data-a-target*="chat"i], [data-test-selector*="chat"i]), [data-test-selector*="banned"i][data-test-selector*="message"i], [data-test-selector^="video-chat"i]');
            if (nullish(chat)) {
              const framedData = PostOffice.get("points_receipt_placement");
              window.PostOffice = PostOffice;
              if (nullish(framedData))
                return;
              balance ??= { textContent: framedData.balance };
              exact_debt ??= { textContent: framedData.exact_debt };
              exact_change ??= { textContent: framedData.exact_change };
            }
            EXACT_POINTS_DEBTED = parseCoin((exact_debt == null ? void 0 : exact_debt.textContent) ?? EXACT_POINTS_DEBTED) | 0;
            const animationID = (((exact_change == null ? void 0 : exact_change.textContent) ?? (exact_debt == null ? void 0 : exact_debt.textContent) ?? -EXACT_POINTS_SPENT) | 0).toString(), animationTimeStamp = +/* @__PURE__ */ new Date();
            if (!/^([\+\-, \d]+)$/.test(animationID))
              return;
            if (OBSERVED_COLLECTION_ANIMATIONS.has(animationID)) {
              const time = OBSERVED_COLLECTION_ANIMATIONS.get(animationID);
              if (nullish(animationID) || !parseBool(animationID) || Math.abs(animationTimeStamp - time) < 3e5)
                return;
            }
            OBSERVED_COLLECTION_ANIMATIONS.set(animationID, animationTimeStamp);
            $log(`Observing "${animationID}" @ ${/* @__PURE__ */ new Date()}`, OBSERVED_COLLECTION_ANIMATIONS);
            if (!~[points_receipt2, exact_change, balance].findIndex(defined)) {
              (_a4 = points_receipt2 == null ? void 0 : points_receipt2.parentElement) == null ? void 0 : _a4.remove();
              RestartJob("points_receipt_placement", "missing:points_receipt,exact_change,balance");
              return clearInterval(COUNTING_POINTS);
            }
            EXACT_POINTS_EARNED += parseCoin(exact_change == null ? void 0 : exact_change.textContent);
            UpdateReceiptDisplay();
          }, 250);
        }
        StopWatch.stop("points_receipt_placement");
      };
      Timers.points_receipt_placement = -2500;
      Unhandlers.points_receipt_placement = () => {
        [COUNTING_POINTS, DISPLAYING_RANK].map(clearInterval);
        $.all("#tt-points-receipt, #tt-channel-point-ranking").forEach((span) => {
          var _a4;
          return (_a4 = span == null ? void 0 : span.parentElement) == null ? void 0 : _a4.remove();
        });
      };
      const REDEMPTION_LISTENERS = {};
      __PointsReceiptPlacement__:
        if (parseBool(Settings.points_receipt_placement)) {
          RegisterJob("points_receipt_placement");
          Chat.onbullet = async ({ element, message, subject, mentions }) => {
            var _a4, _b2, _c2;
            element = await element;
            if (!(subject.equals("coin") && (message.contains(USERNAME) || ((_c2 = (_b2 = (_a4 = $('[class*="message"i] [class*="username"i] [data-a-user]', element)) == null ? void 0 : _a4.dataset) == null ? void 0 : _b2.aUser) == null ? void 0 : _c2.equals(USERNAME)))))
              return;
            const [item] = (await STREAMER.shop).filter((reward) => reward.title.length && message.mutilate().contains(reward.title.mutilate()));
            if (nullish(item))
              return;
            EXACT_POINTS_SPENT += parseCoin(item.cost) | 0;
            UpdateReceiptDisplay();
          };
          AddRedemptionListener: {
            let addListener = function(address = 15) {
              if (address & 1) {
                when.defined(() => $('[data-test-selector*="required"i]:empty')).then((element) => {
                  if (defined(REDEMPTION_LISTENERS.UNLOCKED_REWARDS))
                    return;
                  REDEMPTION_LISTENERS.UNLOCKED_REWARDS = true;
                  element.closest("button").addEventListener("mouseup", ({ currentTarget }) => {
                    var _a4;
                    const title = $('[id*="reward"i][id*="header"i]').textContent.trim(), amount = parseCoin((_a4 = currentTarget == null ? void 0 : currentTarget.previousSibling) == null ? void 0 : _a4.nodeValue) | 0;
                    EXACT_POINTS_SPENT += amount;
                    TALLY.set(`Reward: "${title}" @ ${(/* @__PURE__ */ new Date()).toJSON()}`, amount);
                    delete REDEMPTION_LISTENERS.UNLOCKED_REWARDS;
                    addListener(1);
                    $log(`Spent ${amount} on "${title}"`, /* @__PURE__ */ new Date());
                  });
                });
                when.nullish(() => $('[data-test-selector*="required"i]:empty')).then(() => delete REDEMPTION_LISTENERS.UNLOCKED_REWARDS);
              }
              if (address & 2) {
                when.defined(() => $('[class*="community"i][class*="stack"i] [data-test-selector^="expanded"i] button')).then((button) => {
                  if (defined(REDEMPTION_LISTENERS.BRIBABLE_VOTES))
                    return;
                  REDEMPTION_LISTENERS.BRIBABLE_VOTES = true;
                  button.addEventListener("mouseup", ({ currentTarget }) => {
                    var _a4;
                    let title = ((_a4 = $('[class*="community"i][class*="stack"i] [data-test-selector="header"i] ~ *')) == null ? void 0 : _a4.textContent) ?? "Something? No real title given", [amount] = new RegExp("\\p{N}+", "u").exec(currentTarget == null ? void 0 : currentTarget.textContent) || "";
                    EXACT_POINTS_SPENT += amount |= 0;
                    TALLY.set(`Poll: "${title}" @ ${(/* @__PURE__ */ new Date()).toJSON()}`, amount | 0);
                    delete REDEMPTION_LISTENERS.BRIBABLE_VOTES;
                    addListener(2);
                    $log(`Spent ${amount} on "${title}"`, /* @__PURE__ */ new Date());
                  });
                });
                when.nullish(() => $('[class*="community"i][class*="stack"i] [data-test-selector^="expanded"i] button')).then(() => delete REDEMPTION_LISTENERS.BRIBABLE_VOTES);
              }
            };
            __name(addListener, "addListener");
            addListener();
          }
        }
    }
  });

  // src/plugins/customization/stream-preview.js
  var STREAM_PREVIEW;
  plugin({
    id: "stream_preview",
    timer: 500,
    /**
     * Resets the stream preview state.
     */
    init() {
      STREAM_PREVIEW = void 0;
    },
    /**
     * Runs every tick: Creates and positions a stream preview player when hovering over a channel or guest tooltip.
     * @param {Object} params - The handler parameters
     * @param {Object} params.StopWatch - Utility for measuring execution time
     */
    handler: /* @__PURE__ */ __name(async ({ StopWatch }) => {
      var _a3, _b, _c, _d, _e, _f, _g, _h;
      new StopWatch("stream_preview");
      const richTooltips = $.all(`:is([class*="channel"i], [class*="guest-star"i])[class*="tooltip"i][class*="body"i]`), [richTooltip] = richTooltips;
      if (nullish(richTooltip)) {
        if (parseBool(Settings.stream_preview_sound) && MAINTAIN_VOLUME_CONTROL)
          SetVolume(parseBool(Settings.away_mode__volume_control) && AwayModeStatus ? Settings.away_mode__volume : InitialVolume ?? 1);
        else if (parseBool(Settings.stream_preview_sound) && defined(STREAM_PREVIEW == null ? void 0 : STREAM_PREVIEW.element))
          SetVolume(InitialVolume);
        return StopWatch.stop("stream_preview"), STREAM_PREVIEW = { element: (_a3 = STREAM_PREVIEW == null ? void 0 : STREAM_PREVIEW.element) == null ? void 0 : _a3.remove() };
      }
      let [title, subtitle] = $.all('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i]) > *', richTooltip), isOnline = parseBool((_c = (_b = richTooltip.classList) == null ? void 0 : _b.value) == null ? void 0 : _c.missing("offline"));
      if (nullish(subtitle)) {
        const [rTitle, rSubtitle] = $.all('[data-a-target*="side-nav-header-"i] ~ * *:hover [data-a-target$="metadata"i] > *');
        title = rTitle;
        subtitle = rSubtitle;
      }
      if (nullish(title))
        return StopWatch.stop("stream_preview"), (_d = STREAM_PREVIEW == null ? void 0 : STREAM_PREVIEW.element) == null ? void 0 : _d.remove();
      let [alias] = title.textContent.split(/[^\p{L}\w\s]/u);
      alias = alias == null ? void 0 : alias.trim();
      const name2 = (_f = (_e = ALL_CHANNELS.find(({ name: name3 }) => name3.contains("(") && name3.contains(")") ? name3.contains(alias) : name3.equals(alias)) ?? { name: alias.normalize("NFKD") }) == null ? void 0 : _e.name) == null ? void 0 : _f.replace(/[^]*\(([^\(\)]+)\)[^]*/, "$1");
      if ([STREAMER == null ? void 0 : STREAMER.name, STREAM_PREVIEW == null ? void 0 : STREAM_PREVIEW.name].contains(name2))
        return StopWatch.stop("stream_preview");
      const { top: top2, left, bottom, right, height, width } = getOffset(richTooltip), [body, video] = $.all("body, video").map(getOffset);
      (_g = STREAM_PREVIEW == null ? void 0 : STREAM_PREVIEW.element) == null ? void 0 : _g.remove();
      const scale = parseFloat(Settings.stream_preview_scale) || 1, muted = !parseBool(Settings.stream_preview_sound), quality = scale > 1 ? "auto" : "720p", watchParty = $.defined('[data-a-target^="watchparty"i][data-a-target*="overlay"i]'), controls = false;
      STREAM_PREVIEW = {
        name: name2,
        element: furnish(
          `.tt-stream-preview.invisible[@position=${top2 + height / 2 < body.height / 2 ? "below" : "above"}][@vods=${richTooltips.length > 1}]`,
          {
            style: (top2 + height / 2 < body.height / 2 ? `top: calc(${bottom}px + 0.5em);` : `top: calc(${top2}px - 0.5em - (15rem * ${scale}));`) + `left: calc(${(watchParty ? (_h = getOffset($('[data-a-target^="side-nav-bar"i]'))) == null ? void 0 : _h.width : video == null ? void 0 : video.left) ?? 50}px - 6rem); height: calc(15rem * ${scale}); width: calc(26.75rem * ${scale}); z-index: ${"9".repeat(1 + parseInt(Settings.stream_preview_position ?? 0))};`
          },
          furnish(".tt-stream-preview--poster", {
            style: `background-image: url("https://static-cdn.jtvnw.net/previews-ttv/live_user_${name2.toLowerCase()}-1280x720.jpg?${+/* @__PURE__ */ new Date()}");`,
            onerror: /* @__PURE__ */ __name((event) => {
            }, "onerror")
          }),
          furnish(`iframe#tt-stream-preview--iframe[@index=0][@name=${name2}][@live=${isOnline}][@controls=${controls}][@muted=${muted}][@quality=${quality}]`, {
            allow: "autoplay",
            src: parseURL(`https://player.twitch.tv/`).addSearch(
              isOnline ? {
                channel: name2,
                parent: "twitch.tv",
                controls,
                muted,
                quality
              } : {
                video: `v${richTooltip.closest('[href^="/videos/"i]').href.split("/").pop()}`,
                parent: "twitch.tv",
                autoplay: true,
                controls,
                muted,
                quality
              }
            ).href,
            height: "100%",
            width: "100%",
            onload: /* @__PURE__ */ __name((event) => {
              var _a4, _b2, _c2, _d2;
              (_b2 = (_a4 = $(".tt-stream-preview--poster")) == null ? void 0 : _a4.classList) == null ? void 0 : _b2.add("invisible");
              (_d2 = (_c2 = $.all('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])').at($("#tt-stream-preview--iframe").dataset.index | 0)) == null ? void 0 : _c2.closest('[href^="/videos/"i]')) == null ? void 0 : _d2.modStyle(`background:var(--color-twitch-purple-${6 + (THEME.equals("light") ? 6 : 0)})`);
              if (!parseBool(Settings.stream_preview_sound))
                return;
              if (nullish(InitialVolume))
                InitialVolume = GetVolume();
              const hasAudio = /* @__PURE__ */ __name((element) => {
                var _a5;
                return parseBool(
                  (element == null ? void 0 : element.webkitAudioDecodedByteCount) ?? ((_a5 = element == null ? void 0 : element.audioTracks) == null ? void 0 : _a5.length)
                );
              }, "hasAudio");
              when.defined(() => $("#tt-stream-preview--iframe")).then(() => SetVolume(0));
            }, "onload")
          })
        )
      };
      $.body.append(STREAM_PREVIEW.element);
      wait(250).then(() => {
        var _a4, _b2;
        return (_b2 = (_a4 = $(".tt-stream-preview.invisible")) == null ? void 0 : _a4.classList) == null ? void 0 : _b2.remove("invisible");
      });
      StopWatch.stop("stream_preview");
    }, "handler"),
    /**
     * Undoes the stream preview by removing the preview element from the DOM.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      var _a3;
      STREAM_PREVIEW = { element: (_a3 = STREAM_PREVIEW == null ? void 0 : STREAM_PREVIEW.element) == null ? void 0 : _a3.remove() };
    }, "unhandler"),
    /**
     * Initializes stream previews, sets up location change cleanup, and adds keyboard navigation for the preview player.
     */
    setup() {
      $remark("Adding Stream previews...");
      top.onlocationchange = Unhandlers.stream_preview;
      $.body.addEventListener("keyup", ({ key = "", altKey, ctrlKey, metaKey, shiftKey }) => {
        var _a3, _b, _c, _d, _e;
        if (altKey || ctrlKey || metaKey || shiftKey)
          return;
        if (!/^Arrow(Up|Down)$/i.test(key))
          return;
        const richTooltips = $.all(`[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i])`), { length } = richTooltips, iframe = $("#tt-stream-preview--iframe");
        if (nullish(iframe) || richTooltips.length < 1)
          return;
        let { index = 0, controls = false, muted = true, quality = "auto" } = iframe.dataset;
        index |= 0;
        controls = parseBool(controls);
        muted = parseBool(muted);
        (_b = (_a3 = richTooltips.at(index)) == null ? void 0 : _a3.closest('[href^="/videos/"i]')) == null ? void 0 : _b.removeAttribute("style");
        if (key.equals("ArrowUp"))
          --index;
        else if (key.equals("ArrowDown"))
          ++index;
        if (index < 0)
          index = length - 1;
        else if (index >= length)
          index = 0;
        iframe.dataset.index = index;
        iframe.src = parseURL(`https://player.twitch.tv/`).addSearch({
          video: `v${(_e = (_d = (_c = richTooltips[index].closest('[href^="/videos/"i]')) == null ? void 0 : _c.href) == null ? void 0 : _d.split("/")) == null ? void 0 : _e.pop()}`,
          parent: "twitch.tv",
          autoplay: true,
          controls,
          muted,
          quality
        }).href;
      });
    }
  });

  // src/plugins/customization/watch-time.js
  var WATCH_TIME_INTERVAL;
  var WATCH_TIME_TOOLTIP;
  var THIS_POLL;
  var THAT_POLL;
  var GET_TOP_100_INTERVAL;
  var TOP_100_GAME;
  var IN_TOP_100;
  var ALL_WATCHTIME_COUNTS;
  var ALL_WATCHTIME_VALUES;
  plugin({
    id: "watch_time_placement",
    timer: -1e3,
    /**
     * Initializes and resets the watch time tracking state.
     */
    init() {
      WATCH_TIME_INTERVAL = void 0;
      WATCH_TIME_TOOLTIP = void 0;
      THIS_POLL = STREAMER.poll;
      THAT_POLL = 1;
      GET_TOP_100_INTERVAL = void 0;
      TOP_100_GAME = STREAMER.game;
      IN_TOP_100 = void 0;
      ALL_WATCHTIME_COUNTS = {};
      ALL_WATCHTIME_VALUES = {};
    },
    /**
     * Runs every tick: Manages the placement and display of the stream watch-time indicator and tracks current viewing progress.
     */
    handler: /* @__PURE__ */ __name(async () => {
      let placement;
      if ((placement = Settings.watch_time_placement ??= "null").equals("null"))
        return;
      let parent, container, extra = /* @__PURE__ */ __name(() => {
      }, "extra");
      const classes = /* @__PURE__ */ __name((element) => [...element.classList].map((label) => "." + label).join(""), "classes");
      const live_time = $(".live-time");
      if (nullish(live_time))
        return WaitForLiveTime("watch_time_placement");
      switch (placement) {
        // Option 1 "over" - video overlay, volume control area
        case "over":
          {
            container = live_time.closest(`*:not(${classes(live_time)})`);
            parent = $('[data-a-target="player-controls"i] [class*="player-controls"i][class*="left-control-group"i]');
          }
          break;
        // Option 2 "under" - under quick actions, live count/live time area
        case "under":
          {
            container = live_time.closest(`*:not(${classes(live_time)})`);
            parent = container.closest(`*:not(${classes(container)})`);
            extra = /* @__PURE__ */ __name(({ live_time: live_time2 }) => {
              live_time2.modStyle("color:var(--color-text-live)");
              if (parseBool(Settings.show_stats))
                live_time2.tooltipAnimation = setInterval(() => {
                  var _a3, _b;
                  live_time2.tooltip ??= new Tooltip(live_time2, "");
                  const percentage = (STREAMER.time / (((_a3 = STREAMER.data) == null ? void 0 : _a3.dailyBroadcastTime) ?? 162e5)).clamp(0, 1), timeLeft = (((_b = STREAMER.data) == null ? void 0 : _b.dailyBroadcastTime) ?? 162e5) - STREAMER.time;
                  live_time2.tooltip.innerHTML = (timeLeft < 0 ? "+" : "") + toTimeString(Math.abs(timeLeft), "clock");
                  live_time2.tooltip.modStyle(`background:linear-gradient(90deg, hsla(${120 * percentage | 0}, 100%, 50%, 0.5) ${(100 * percentage).toFixed(2)}%, #0000 0), var(--color-background-tooltip)`);
                }, 250);
            }, "extra");
          }
          break;
        default: {
          return;
        }
      }
      const f = furnish;
      const watch_time = f(
        `${container.tagName}${classes(container)}`,
        { style: `color: var(--user-contrast-color)`, contrast: THEME__PREFERRED_CONTRAST },
        f(`${live_time.tagName}#tt-watch-time${classes(live_time).replace(/\blive-time\b/gi, "watch-time")}`, { time: 0 })
      );
      WATCH_TIME_TOOLTIP ??= new Tooltip(watch_time);
      parent.append(watch_time);
      extra({ parent, container, live_time, placement });
      Cache.load([CURRENT_WATCHTIME_NAME, `Watching`], (_) => {
        let { Watching } = _;
        if (!(Watching instanceof Array))
          Watching = [];
        if ((Watching ??= [NORMALIZED_PATHNAME]).missing(NORMALIZED_PATHNAME)) {
          Watching.push(NORMALIZED_PATHNAME);
          STARTED_WATCHING = +($("#root").dataset.aPageLoaded ??= +/* @__PURE__ */ new Date());
        }
        _[CURRENT_WATCHTIME_NAME] >>= 0;
        WATCH_TIME_INTERVAL = setInterval(() => {
          const watch_time2 = $("#tt-watch-time"), time = GET_WATCH_TIME();
          if (nullish(watch_time2) || !time) {
            clearInterval(WATCH_TIME_INTERVAL);
            return RestartJob("watch_time_placement", "missing:watch_time|time");
          }
          watch_time2.setAttribute("time", time);
          watch_time2.innerHTML = toTimeString(time, "clock");
          watch_time2.modStyle(`mix-blend-mode:${ANTITHEME}en;`);
          if (parseBool(Settings.show_stats))
            WATCH_TIME_TOOLTIP.innerHTML = toTimeString(time, "short-epoch");
          Cache.load(null, (_2) => {
            for (let [key, val] of Object.entries(_2).filter((key2, val2) => /^WatchTimes\/([\w\-]+)/.test(key2))) {
              fixer: if (UP_NEXT_ALLOW_THIS_TAB) {
                if (key == CURRENT_WATCHTIME_NAME)
                  break fixer;
                let count = ALL_WATCHTIME_COUNTS[key] >>= 0;
                const value = ALL_WATCHTIME_VALUES[key] >>= 0;
                if (value != val) {
                  ALL_WATCHTIME_COUNTS[key] = 0;
                  ALL_WATCHTIME_VALUES[key] = val;
                  continue;
                }
                if (++count > 60) {
                  Cache.remove(key);
                  delete ALL_WATCHTIME_COUNTS[key];
                  delete ALL_WATCHTIME_VALUES[key];
                  continue;
                }
                ALL_WATCHTIME_COUNTS[key] = count;
              }
              if (key == CURRENT_WATCHTIME_NAME)
                val = time;
              Cache.save({ [key]: val });
            }
          });
        }, 500 + Math.random() * 500);
        Cache.save({ Watching });
      });
      function getTop100(callback = ($2) => $2) {
        const { filename } = parseURL(STREAMER.game.href);
        if (!(filename == null ? void 0 : filename.length))
          return;
        fetchURL.idempotent(`https://gql.twitch.tv/gql`, {
          method: "POST",
          headers: { "client-id": Search.anonID },
          body: JSON.stringify([{
            operationName: "DirectoryPage_Game",
            variables: {
              imageWidth: 50,
              slug: filename,
              options: {
                sort: "VIEWER_COUNT",
                freeformTags: null,
                tags: [],
                broadcasterLanguages: [],
                systemFilters: []
              },
              sortTypeIsRecency: false,
              limit: 100
              // [1, 100]
            },
            extensions: {
              persistedQuery: {
                version: 1,
                sha256Hash: `3c9a94ee095c735e43ed3ad6ce6d4cbd03c4c6f754b31de54993e0d48fd54e30`
              }
            }
          }])
        }).then((r) => r.json()).then((json) => {
          var _a3, _b, _c;
          if (!(json == null ? void 0 : json.length))
            throw `No query data available @ ${filename}`;
          [json] = json;
          if (json.errors)
            throw json.errors.join("; ");
          const edges = ((_c = (_b = (_a3 = json == null ? void 0 : json.data) == null ? void 0 : _a3.game) == null ? void 0 : _b.streams) == null ? void 0 : _c.edges) ?? [];
          const { game, poll, sole } = STREAMER;
          let polls = [{ sole, poll }], spot = 1, place = null;
          for (const edge of edges) {
            const { broadcaster, freeFormTags, game: game2, id, previewImageURL, title, type, viewersCount } = edge.node;
            if (sole == broadcaster.id)
              place = spot;
            polls.push({ sole: broadcaster.id, poll: viewersCount, spot: spot++ });
          }
          const container2 = $('[data-a-target*="viewer"i][data-a-target*="count"i]').parentElement;
          if (IN_TOP_100 = defined(place))
            new Tooltip(container2, `Top 100! #${place} for <ins>${game}</ins>`).setAttribute("rainbow-border", true);
          else if (nullish(IN_TOP_100 = null))
            new Tooltip(container2, `Viewer change: &${"du"[+(THIS_POLL >= THAT_POLL)]}arr; ${Math.abs(THIS_POLL - THAT_POLL)}`).setAttribute("rainbow-border", false);
          callback();
        }).catch((error) => {
          $warn(error);
          clearInterval(GET_TOP_100_INTERVAL);
        });
      }
      __name(getTop100, "getTop100");
      GET_TOP_100_INTERVAL = setInterval(() => {
        THIS_POLL = STREAMER.poll;
        const updt = /* @__PURE__ */ __name(() => THAT_POLL = THIS_POLL, "updt");
        const DIFF = Math.abs(THIS_POLL - THAT_POLL) / THAT_POLL;
        if (TOP_100_GAME.unlike(STREAMER.game))
          return (TOP_100_GAME = STREAMER.game) && getTop100(updt);
        if (THIS_POLL > 5e3 && DIFF > 0.15)
          getTop100(updt);
        if (THIS_POLL > 500 && THIS_POLL <= 5e3 && DIFF > 0.1)
          getTop100(updt);
        else if (THIS_POLL > 50 && THIS_POLL <= 500 && DIFF > 0.05)
          getTop100(updt);
        else if (THIS_POLL <= 50 && THIS_POLL != THAT_POLL) {
          if (IN_TOP_100 || nullish(IN_TOP_100))
            getTop100(updt);
        }
      }, 5e3);
    }, "handler"),
    /**
     * Undoes watch-time feature changes by clearing intervals, removing UI elements, and cleaning up tooltips.
     */
    unhandler: /* @__PURE__ */ __name(() => {
      var _a3, _b, _c, _d;
      clearInterval(WATCH_TIME_INTERVAL);
      (_b = (_a3 = $("#tt-watch-time")) == null ? void 0 : _a3.parentElement) == null ? void 0 : _b.remove();
      const live_time = $(".live-time");
      live_time == null ? void 0 : live_time.removeAttribute("style");
      (_d = (_c = live_time == null ? void 0 : live_time.tooltip) == null ? void 0 : _c.remove) == null ? void 0 : _d.call(_c);
      clearInterval(live_time == null ? void 0 : live_time.tooltipAnimation);
      if (UnregisterJob.__reason__.anyOf("modify", "reinit"))
        return;
      Cache.save({ Watching: [] });
    }, "unhandler")
  });

  // src/plugins/networking/auto-dvr.js
  plugin({
    id: "video_clips__dvr",
    /**
     * Installs the Auto-DVR feature, adding recording controls to the channel about section.
     * @param {Object} context - The plugin context
     * @param {StopWatch} context.StopWatch - The StopWatch class for timing operations
     * @returns {Promise<void>}
     */
    async install({ StopWatch }) {
      var _a3, _b, _c;
      let AUTO_DVR__CHECKING;
      let AUTO_DVR__CHECKING_INTERVAL;
      MASTER_VIDEO = $("[data-a-player-state] video");
      when.defined(() => $("[data-a-player-state] video")).then((_) => MASTER_VIDEO = _);
      Handlers.video_clips__dvr = () => {
        new StopWatch("video_clips__dvr");
        const actionPanel = $(".about-section__actions");
        if (nullish(actionPanel))
          return StopWatch.stop("video_clips__dvr");
        Cache.load("DVRChannels", async ({ DVRChannels }) => {
          var _a4;
          try {
            DVRChannels = JSON.parse(DVRChannels || "{}");
          } catch (error) {
            DVRChannels ??= {};
          }
          let f = furnish, s = /* @__PURE__ */ __name((string) => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"), "s"), DVR_ID = STREAMER.name.toLowerCase(), enabled = parseBool((_a4 = DVRChannels[DVR_ID]) == null ? void 0 : _a4.length), [title, subtitle, icon] = [
            ["Turn DVR on", `${s(STREAMER.name)} live streams will be recorded`, "host"],
            ["Turn DVR off", `${s(STREAMER.name)} live streams will no longer be recorded`, "clip"]
          ][+!!enabled];
          icon = Glyphs.modify(icon, { style: "fill:var(--user-contrast-color)!important", height: "20px", width: "20px" });
          const action = f(
            "div",
            { "tt-action": "auto-dvr", "for": DVR_ID, enabled, "action-origin": "foreign", style: `animation:1s fade-in 1;` },
            f("button", {
              onmouseup: /* @__PURE__ */ __name(async (event) => {
                const { currentTarget, isTrusted = false, button = -1 } = event;
                if (button)
                  return;
                Cache.load("DVRChannels", async ({ DVRChannels: DVRChannels2 }) => {
                  var _a5, _b2, _c2;
                  try {
                    DVRChannels2 = JSON.parse(DVRChannels2 || "{}");
                  } catch (error) {
                    DVRChannels2 ??= {};
                  }
                  let s2 = /* @__PURE__ */ __name((string) => string.replace(/$/, "'").replace(/(?<!s)'$/, "'s"), "s"), DVR_ID2 = STREAMER.name.toLowerCase(), enabled2 = !parseBool((_a5 = DVRChannels2[DVR_ID2]) == null ? void 0 : _a5.length), [title2, subtitle2, icon2] = [
                    ["Turn DVR on", `${s2(STREAMER.name)} live streams will be recorded`, "host"],
                    ["Turn DVR off", `${s2(STREAMER.name)} live streams will no longer be recorded`, "clip"]
                  ][+!!enabled2];
                  icon2 = Glyphs.modify(icon2, { style: "fill:var(--user-contrast-color)!important", height: "20px", width: "20px" });
                  $(".tt-action-icon", currentTarget).innerHTML = icon2;
                  $(".tt-action-title", currentTarget).textContent = title2;
                  $(".tt-action-subtitle", currentTarget).textContent = subtitle2;
                  let message;
                  if (enabled2) {
                    message = `${s2(STREAMER.name)} streams will be recorded.`;
                    DVRChannels2[DVR_ID2] = DVR_CLIP_PRECOMP_NAME;
                    when.nullish(() => $('[data-a-target*="ad-countdown"i]')).then(() => {
                      SetQuality(VideoClips.quality, "auto").then(() => {
                        MASTER_VIDEO.DEFAULT_RECORDING = Recording.proxy(MASTER_VIDEO, { name: "AUTO_DVR", as: DVR_CLIP_PRECOMP_NAME, mimeType: `video/${VideoClips.filetype}`, hidden: !Settings.show_stats });
                        MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                      });
                    });
                  } else {
                    message = `${STREAMER.name} will not be recorded.`;
                    delete DVRChannels2[DVR_ID2];
                    (_c2 = (_b2 = MASTER_VIDEO.DEFAULT_RECORDING) == null ? void 0 : _b2.stop()) == null ? void 0 : _c2.save(DVR_CLIP_PRECOMP_NAME);
                  }
                  currentTarget.closest("[tt-action]").setAttribute("enabled", enabled2);
                  Cache.save({ DVRChannels: DVRChannels2 }, () => Settings.set({ "DVR_CHANNELS": Object.keys(DVRChannels2) }).then(() => parseBool(message) && alert.timed(message, 7e3)).catch($warn));
                });
              }, "onmouseup")
            }, f.div(
              f(".tt-action-icon").html(icon),
              f.div(
                f("p.tw-title.tt-action-title").with(title),
                f("p.tt-action-subtitle").with(subtitle)
              )
            ))
          );
          actionPanel.append(action);
          if (enabled && !STREAMER.redo) {
            when.nullish(() => $('[data-a-target*="ad-countdown"i]')).then(() => {
              SetQuality(VideoClips.quality, "auto").then(() => {
                MASTER_VIDEO.DEFAULT_RECORDING = Recording.proxy(MASTER_VIDEO, { name: "AUTO_DVR", mimeType: `video/${VideoClips.filetype}`, hidden: !Settings.show_stats });
                MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
              });
            });
            const leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async ({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
              var _a5, _b2;
              if (STASH_SAVED)
                return;
              STASH_SAVED = true;
              for (const [guid, { recording }] of Recording.__RECORDERS__)
                if (recording == MASTER_VIDEO.DEFAULT_RECORDING)
                  (_a5 = recording == null ? void 0 : recording.stop()) == null ? void 0 : _a5.save(DVR_CLIP_PRECOMP_NAME);
                else
                  (_b2 = recording == null ? void 0 : recording.stop()) == null ? void 0 : _b2.save();
              const next = await GetNextStreamer();
              $log("Saving current DVR stash. Reason (DVR leave handler):", { hosting, raiding, raided, leaving: defined(from) }, "Moving onto:", next);
            };
            $.on("focusin", (event) => {
              const DVR_ID2 = STREAMER.name.toLowerCase();
              if (top.focusedin)
                return;
              top.focusedin = true;
              top.addEventListener("beforeunload", leaveHandler);
            });
          }
          PrepareForGarbageCollection(DVRChannels);
        });
        StopWatch.stop("video_clips__dvr");
      };
      Timers.video_clips__dvr = -2500;
      try {
        Object.defineProperties(top, {
          DVR_CLIP_PRECOMP_NAME: {
            get() {
              var _a4;
              const chunks = (_a4 = MASTER_VIDEO.getRecording(Recording.ANY)) == null ? void 0 : _a4.blobs;
              if (!(chunks == null ? void 0 : chunks.length))
                return new ClipName(2);
              const now = /* @__PURE__ */ new Date();
              return [
                STREAMER.name,
                now.toLocaleDateString().replace(/[\/\\:\*\?"<>\|]+/g, "-"),
                `(${(parseBool(Settings.show_stats) ? toTimeString(chunks.recordingLength, "short") : (now.getHours() % 12 || 12) + now.getMeridiem()).replace(/\b(0+[ydhms])+/ig, "")})`
              ].filter((s) => s == null ? void 0 : s.length).map((s) => s.trim()).join(" ");
            }
          }
        });
        top.addEventListener("beforeunload", async ({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
          var _a4, _b2;
          if (STASH_SAVED)
            return;
          STASH_SAVED = true;
          for (const [guid, { recording }] of Recording.__RECORDERS__)
            if (recording == MASTER_VIDEO.DEFAULT_RECORDING)
              (_a4 = recording == null ? void 0 : recording.stop()) == null ? void 0 : _a4.save(DVR_CLIP_PRECOMP_NAME);
            else
              (_b2 = recording == null ? void 0 : recording.stop()) == null ? void 0 : _b2.save();
          const next = await GetNextStreamer();
          $log("Saving current DVR stash. Reason (beforeunload):", { hosting, raiding, raided, leaving: defined(from) }, "Moving onto:", next);
        });
      } catch (error) {
      }
      Handlers.__MASTER_AUTO_DVR_HANDLER__ = (event) => {
        var _a4, _b2, _c2, _d;
        (_d = (_c2 = (_b2 = (_a4 = MASTER_VIDEO.DEFAULT_RECORDING) == null ? void 0 : _a4.then(({ target }) => {
          const chunks = target.blobs;
          const feed = null, halt = parseBool(feed == null ? void 0 : feed.getAttribute("halt")), name2 = ((feed == null ? void 0 : feed.getAttribute("value")) || DVR_CLIP_PRECOMP_NAME).replace(GetFileSystem().allIllegalFilenameCharacters, "-");
        })) == null ? void 0 : _b2.stop()) == null ? void 0 : _c2.save(DVR_CLIP_PRECOMP_NAME)) == null ? void 0 : _d.then(
          (link) => alert.silent(`
                <video controller controls
                    title="Video Saved &mdash; ${link.download}"
                    src="${link.href}" style="max-width:-webkit-fill-available"
                ></video>
                `)
        );
      };
      Unhandlers.video_clips__dvr = () => {
        var _a4;
        const DVR_ID = STREAMER.name.toLowerCase();
        (_a4 = MASTER_VIDEO.DEFAULT_RECORDING) == null ? void 0 : _a4.stop();
      };
      setInterval(() => {
        if (nullish(top.titleInterval))
          top.titleInterval = setInterval(() => {
            var _a4;
            document.title = MASTER_VIDEO.hasRecording(Recording.ANY) ? `🔴 ${STREAMER.name} - ${toTimeString(/* @__PURE__ */ new Date() - ((_a4 = MASTER_VIDEO.getRecording(Recording.ANY)) == null ? void 0 : _a4.creationTime), "clock")}` : `${STREAMER.name} - Twitch`;
          }, 250);
      }, 1e3);
      __AutoDVR__:
        if (parseBool(Settings == null ? void 0 : Settings.video_clips__dvr)) {
          let HandleAd = function(adCountdown) {
            var _a4, _b2;
            const [main, mini] = $.all("video");
            if (nullish(main) || !main.hasRecording("AUTO_DVR") || nullish(mini))
              return when.defined(() => $('[data-a-target*="ad-countdown"i]')).then(HandleAd);
            const blobs = ((_a4 = main.getRecording("AUTO_DVR")) == null ? void 0 : _a4.blobs) ?? [];
            const InsertChunksAt = blobs.length;
            const AdBreak = Recording.proxy(mini, { name: "AUTO_DVR:AD_HANDLER", mimeType: main.mimeType });
            AdBreak.then((event) => {
              const chunks = event.target.blobs;
              $notice(`Adding chunks to main <video> @ ${InsertChunksAt}`, { blobs, chunks, event });
              blobs.splice(InsertChunksAt, 0, ...chunks);
            });
            when.nullish(() => $('[data-a-target*="ad-countdown"i]')).then(() => {
              var _a5, _b3;
              const [main2, mini2] = $.all("video");
              main2 == null ? void 0 : main2.resumeRecording("AUTO_DVR");
              mini2 == null ? void 0 : mini2.stopRecording("AUTO_DVR:AD_HANDLER");
              when.defined(() => $('[data-a-target*="ad-countdown"i]')).then(HandleAd);
              $notice(`Ad is done playing... ${toTimeString(/* @__PURE__ */ new Date() - ((_a5 = main2 == null ? void 0 : main2.getRecording("AUTO_DVR")) == null ? void 0 : _a5.creationTime), "clock")} | ${(/* @__PURE__ */ new Date()).toJSON()}`, { main: main2, mini: mini2, blobs, chunks: (_b3 = mini2 == null ? void 0 : mini2.getRecording("AUTO_DVR:AD_HANDLER")) == null ? void 0 : _b3.blobs });
            });
            main.pauseRecording("AUTO_DVR");
            $notice(`There is an ad playing... ${toTimeString(/* @__PURE__ */ new Date() - ((_b2 = main.getRecording("AUTO_DVR")) == null ? void 0 : _b2.creationTime), "clock")} | ${(/* @__PURE__ */ new Date()).toJSON()}`, { main, mini });
          };
          __name(HandleAd, "HandleAd");
          $remark("Adding DVR functionality...");
          when.defined(() => $('[data-a-target*="ad-countdown"i]')).then(HandleAd);
          AUTO_DVR__CHECKING_INTERVAL = setInterval(AUTO_DVR__CHECKING ??= /* @__PURE__ */ __name(() => {
            new StopWatch("video_clips__dvr__checking_interval");
            if (UP_NEXT_ALLOW_THIS_TAB)
              Cache.load("DVRChannels", async ({ DVRChannels }) => {
                var _a4;
                try {
                  DVRChannels = JSON.parse(DVRChannels || "{}");
                } catch (error) {
                  DVRChannels ??= {};
                }
                checking:
                  for (const DVR_ID in DVRChannels) {
                    const streamer = (DVR_ID + "").toLowerCase();
                    let channel = await new Search(streamer).then(Search.convertResults), ok = parseBool(channel == null ? void 0 : channel.ok);
                    let num = 3;
                    while (!ok && num-- > 0) {
                      Search.void(streamer);
                      channel = await new Search(streamer).then(Search.convertResults);
                      ok = parseBool(channel == null ? void 0 : channel.ok);
                    }
                    if (!num && !ok) {
                      channel = ALL_CHANNELS.find((channel2) => channel2.name.equals(DVR_ID));
                      if (nullish(channel == null ? void 0 : channel.name))
                        continue checking;
                    }
                    if (!parseBool(channel.live)) {
                      PrepareForGarbageCollection(channel, DVRChannels);
                      continue checking;
                    }
                    let { name: name2, live, icon, href, data = { actualStartTime: null } } = channel, slug = DVRChannels[name2.toLowerCase()], enabled = defined(slug);
                    const index = ALL_FIRST_IN_LINE_JOBS.findIndex((href2) => parseURL(href2).pathname.slice(1).equals(name2)), job = ALL_FIRST_IN_LINE_JOBS[index];
                    if (defined(job) && name2.unlike(STREAMER.name) && enabled) {
                      const [removed] = ALL_FIRST_IN_LINE_JOBS.splice(index, 1), name3 = parseURL(removed).pathname.slice(1);
                      $notice(`Skipper work:`, removed);
                      FIRST_IN_LINE_DUE_DATE = NEW_DUE_DATE(FIRST_IN_LINE_TIMER);
                      REDO_FIRST_IN_LINE_QUEUE(ALL_FIRST_IN_LINE_JOBS[0], { redo: ((_a4 = parseURL(removed).searchParameters) == null ? void 0 : _a4.redo) ?? "" });
                      Cache.save({ ALL_FIRST_IN_LINE_JOBS, FIRST_IN_LINE_DUE_DATE }, () => {
                        $log("Skipping queue in favor of a DVR channel", job);
                        goto(parseURL(job).addSearch({ dvr: true }).href);
                      });
                    }
                  }
                Settings.set({ "DVR_CHANNELS": Object.keys(DVRChannels) });
                StopWatch.stop("video_clips__dvr__checking_interval", 3e4);
                PrepareForGarbageCollection(DVRChannels);
              });
          }, "AUTO_DVR__CHECKING"), 3e4);
          let actionPanel = $(".about-section__actions");
          if (nullish(actionPanel)) {
            actionPanel = furnish(".about-section__actions", { style: `padding-left: 2rem; margin-bottom: 3rem; width: 24rem;` });
            (_b = (_a3 = $(".about-section")) == null ? void 0 : _a3.append) == null ? void 0 : _b.call(_a3, actionPanel);
          } else {
            for (const child of actionPanel.children)
              child.setAttribute("action-origin", "native");
          }
          if (parseBool((_c = parseURL(top.location.href).searchParameters) == null ? void 0 : _c.dvr) || (STREAMER == null ? void 0 : STREAMER.redo) === false)
            Cache.load("DVRChannels", async ({ DVRChannels }) => {
              try {
                DVRChannels = JSON.parse(DVRChannels || "{}");
              } catch (error) {
                DVRChannels ??= {};
              }
              for (const DVR_ID in DVRChannels) {
                const streamer = (DVR_ID + "").toLowerCase();
                if (parseBool(DVRChannels[DVR_ID]) && [STREAMER.name, STREAMER.sole].map((s) => (s + "").toLowerCase()).contains(streamer))
                  when.defined(() => $("#up-next-control")).then((button) => {
                    const paused = parseBool(button.getAttribute("paused"));
                    if (paused)
                      return;
                    button == null ? void 0 : button.click();
                  }).then(() => {
                    var _a4;
                    if (compareVersions(`${Manifest.version} ≥ 5.33.0.8`))
                      confirm.silent(`<div hidden controller deny="Why?" okay="Acknowledge (interact)" title="${STREAMER.name} &mdash; DVR Notice"></div>
                                            To guarantee DVRs save when this page navigates to another stream (or reloads unexpectedly), you must interact with this page.
                                        `).then((answer) => {
                        if (!answer)
                          open("https://developer.mozilla.org/en-US/docs/Web/Security/User_activation", "_blank");
                      });
                    if (parseBool((_a4 = $("[data-recording-status]")) == null ? void 0 : _a4.getAttribute("data-recording-status")))
                      new Tooltip($("[data-recording-status]"), `Recording this stream: ${STREAMER.name}`);
                    if (MASTER_VIDEO.hasRecording("AUTO_DVR"))
                      return;
                    when.nullish(() => $('[data-a-target*="ad-countdown"i]')).then(() => {
                      const recordingKey = "AUTO_DVR:AD_COUNTDOWN";
                      SetQuality(VideoClips.quality, "auto").then(() => {
                        Recording.proxy(MASTER_VIDEO, { name: recordingKey, mimeType: `video/${VideoClips.filetype}`, hidden: !Settings.show_stats }).then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                        when(() => MASTER_VIDEO.hasRecording("AUTO_DVR")).then(() => {
                          MASTER_VIDEO.cancelRecording(recordingKey, `Master recording ("AUTO_DVR") already exists. Removing "AUTO_DVR:AD_COUNTDOWN"`).removeRecording(recordingKey);
                        });
                        wait(5e3).then(() => {
                          if (!MASTER_VIDEO.hasRecording(recordingKey))
                            return;
                          MASTER_VIDEO.DEFAULT_RECORDING = MASTER_VIDEO.getRecording(recordingKey);
                          MASTER_VIDEO.DEFAULT_RECORDING.then(Handlers.__MASTER_AUTO_DVR_HANDLER__);
                        });
                      });
                    });
                    const leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async ({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
                      var _a5, _b2;
                      if (STASH_SAVED)
                        return;
                      STASH_SAVED = true;
                      const DVR_ID2 = STREAMER.name.toLowerCase();
                      for (const [guid, { recording }] of Recording.__RECORDERS__)
                        if (recording == MASTER_VIDEO.DEFAULT_RECORDING)
                          (_a5 = recording == null ? void 0 : recording.stop()) == null ? void 0 : _a5.save(DVR_CLIP_PRECOMP_NAME);
                        else
                          (_b2 = recording == null ? void 0 : recording.stop()) == null ? void 0 : _b2.save();
                      const next = await GetNextStreamer();
                      $log("Saving current DVR stash. Reason (panel leave handler):", { hosting, raiding, raided, leaving: defined(from) }, "Moving onto:", next);
                    };
                    $.on("focusin", (event) => {
                      const DVR_ID2 = STREAMER.name.toLowerCase();
                      if (top.focusedin)
                        return;
                      top.focusedin = true;
                      top.addEventListener("beforeunload", leaveHandler);
                    });
                  });
              }
              PrepareForGarbageCollection(DVRChannels);
            });
          AUTO_DVR__CHECKING == null ? void 0 : AUTO_DVR__CHECKING();
          RegisterJob("video_clips__dvr");
        }
    }
  });

  // src/plugins/developer/developer-features.js
  plugin({
    id: "extra_keyboard_shortcuts",
    /**
     * Install: Sets up developer shortcuts for taking stream screenshots and recording clips.
     */
    async install() {
      Handlers.extra_keyboard_shortcuts = () => {
        if (nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X))
          $.on("keydown", GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_SHIFT_X = /* @__PURE__ */ __name(function Take_a_Screenshot({ key = "", altKey, ctrlKey, metaKey, shiftKey }) {
            if (!(ctrlKey || metaKey) && altKey && shiftKey && key.equals("x"))
              $.all("video").pop().copyFrame().then(async (copied) => await alert.timed(`Screenshot saved to clipboard!<p tt-x>${new UUID().value}</p>`, 5e3)).catch(async (error) => await alert.timed(`Failed to take screenshot: ${error}<p tt-x>${new UUID().value}</p>`, 7e3));
          }, "Take_a_Screenshot"));
        if (nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z)) {
          $.on("keydown", GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z = /* @__PURE__ */ __name(function Start_$_Stop_a_Recording({ key = "", altKey, ctrlKey, metaKey, shiftKey }) {
            if (!(ctrlKey || metaKey || shiftKey) && altKey && key.equals("z")) {
              const video = MASTER_VIDEO;
              const system = GetFileSystem();
              video.setAttribute("uuid", video.uuid ??= new UUID().value);
              const body = `<input hidden controller anchor="${video.uuid}"
                            icon="🔴️" title="Recording ${(STREAMER == null ? void 0 : STREAMER.name) ?? top.location.pathname.slice(1).split("/").shift()}..."
                            placeholder="${DEFAULT_CLIP_NAME}"
                            pattern="${system.acceptableFilenames.source}"

                            okay="${encodeHTML(Glyphs.modify("download", { height: "20px", width: "20px", style: "vertical-align:bottom" }))} Save"
                            deny="${encodeHTML(Glyphs.modify("trash", { height: "20px", width: "20px", style: "vertical-align:bottom" }))} Discard"
                            />

                            <table is-hidden="${!Settings.experimental_mode}">
                                <caption>Video details</caption>
                                <tbody>
                                    <tr>
                                        <td>Slug</td>
                                        <td><code>${DEFAULT_CLIP_NAME}</code></td>
                                    </tr>
                                    <tr>
                                        <td>Length</td>
                                        <td><code tt-clip-timer data-connected-to=${video.uuid}></code></td>
                                    </tr>
                                    <tr>
                                        <td>Size</td>
                                        <td><code tt-clip-watcher data-connected-to=${video.uuid}></code></td>
                                    </tr>
                                    <tr>
                                        <td style=padding-right:1em>Dimensions</td>
                                        <td><code tt-clip-sizer data-connected-to=${video.uuid}></code></td>
                                    </tr>
                                    <tr>
                                        <td>Quality</td>
                                        <td tt-clip-rater data-connected-to=${video.uuid}></td>
                                    </tr>
                                    <tr>
                                        <td>Type</td>
                                        <td tt-clip-typer data-connected-to=${video.uuid}></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div>
                                <h4>You can change the filename of this recording below.</h4>
                                <p>You <strong>cannot</strong> use the following characters: ${system.unacceptableFilenameCharacters.filter((c) => system.characterNames[c].composable).map((c) => `<code title="${system.characterNames[c]}">${c}</code>`).join(" ")}</p>
                            </div>`;
              const EVENT_NAME = GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z.name;
              let SAVE_NAME = DEFAULT_CLIP_NAME;
              if (!video.hasRecording(EVENT_NAME)) {
                prompt.silent(body).then((value) => {
                  const feed = $(`.tt-prompt[uuid="${UUID.from(body).value}"i]`);
                  const temp = video.stopRecording(EVENT_NAME);
                  feed == null ? void 0 : feed.setAttribute("halt", nullish(value));
                  if (nullish(value)) {
                    phantomClick($(".deny", feed));
                  } else {
                    phantomClick($(".okay", feed));
                    temp.saveRecording(EVENT_NAME, SAVE_NAME = value || SAVE_NAME);
                  }
                  temp == null ? void 0 : temp.removeRecording(EVENT_NAME);
                });
                SetQuality(VideoClips.quality, "auto").then(() => {
                  Recording.proxy(video, { name: EVENT_NAME, as: DEFAULT_CLIP_NAME, mimeType: `video/${VideoClips.filetype}`, hidden: !Settings.show_stats }).then(({ target }) => {
                    const chunks = target.blobs;
                    const feed = $(`.tt-prompt[uuid="${UUID.from(body).value}"i]`), halt = parseBool(feed == null ? void 0 : feed.getAttribute("halt")), name2 = ((feed == null ? void 0 : feed.getAttribute("value")) || SAVE_NAME).replace(GetFileSystem().allIllegalFilenameCharacters, "-");
                    return SAVE_NAME = name2;
                  }).catch((error) => {
                    $warn(error);
                    alert.timed(error, 7e3);
                  }).finally(() => {
                    DEFAULT_CLIP_NAME = new ClipName(2);
                    video.stopRecording(EVENT_NAME).saveRecording(EVENT_NAME, SAVE_NAME);
                    when.defined(() => $(`[data-save-name="${SAVE_NAME.replaceAll('"', "&quot;")}"i]`)).then(
                      (link) => alert.silent(`
                                            <video controller controls
                                                title="Video Saved &mdash; ${link.download}"
                                                src="${link.href}" style="max-width:-webkit-fill-available"
                                            ></video>
                                            `)
                    );
                  });
                });
              } else {
                const feed = $(`.tt-prompt[uuid="${UUID.from(body).value}"i]`);
                phantomClick($(".okay", feed));
              }
            }
          }, "Start_$_Stop_a_Recording"));
          const leaveHandler = STREAMER.onraid = STREAMER.onhost = top.beforeleaving = top.onlocationchange = async ({ hosting = false, raiding = false, raided = false, from, to, persisted }) => {
            var _a3;
            if (STASH_SAVED)
              return;
            STASH_SAVED = true;
            const next = await GetNextStreamer();
            $log("Saving current recording(s). Reason (keyboard shortcuts leave handler):", { hosting, raiding, raided, leaving: defined(from) }, "Moving onto:", next);
            for (const [guid, { recording }] of Recording.__RECORDERS__)
              (_a3 = recording == null ? void 0 : recording.stop()) == null ? void 0 : _a3.save();
          };
          $.on("focusin", (event) => {
            if (top.focusedin)
              return;
            top.focusedin = true;
            top.addEventListener("beforeunload", leaveHandler);
          });
        }
        if (nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_Z))
          $.on("keydown", GLOBAL_EVENT_LISTENERS.KEYDOWN_Z = /* @__PURE__ */ __name(function Send_to_Miniplayer({ key = "", altKey, ctrlKey, metaKey, shiftKey }) {
            if (!(ctrlKey || metaKey || altKey || shiftKey) && key.equals("z") && $.defined("#tt-stream-preview--iframe") && parseBool($("#tt-stream-preview--iframe").dataset.live))
              MiniPlayer = $("#tt-stream-preview--iframe").dataset.name;
          }, "Send_to_Miniplayer"));
        if (nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_R))
          $.on("keydown", GLOBAL_EVENT_LISTENERS.KEYDOWN_R = /* @__PURE__ */ __name(function Send_to_Live_Reminders({ key = "", altKey, ctrlKey, metaKey, shiftKey }) {
            if (!(ctrlKey || metaKey || altKey || shiftKey) && key.equals("r") && $.defined("#tt-stream-preview--iframe") && parseBool($("#tt-stream-preview--iframe").dataset.live)) {
              const name2 = $("#tt-stream-preview--iframe").dataset.name;
              Cache.load("LiveReminders", async ({ LiveReminders }) => {
                var _a3, _b;
                try {
                  LiveReminders = JSON.parse(LiveReminders || "{}");
                } catch (error) {
                  LiveReminders ??= {};
                }
                const justInCase = { ...LiveReminders };
                if (defined(LiveReminders[name2]))
                  return confirm.timed(`<div hidden controller
                                        okay="${encodeHTML(Glyphs.modify("checkmark", { height: "20px", width: "20px", style: "vertical-align:bottom" }))} OK"
                                        deny="${encodeHTML(Glyphs.modify("trash", { height: "20px", width: "20px", style: "vertical-align:bottom" }))} Stop"
                                        ></div>You're already getting notifications for <a href="/${name2}">${name2}</a>.`, 7e3).then((ok) => {
                    if (ok === false) {
                      delete LiveReminders[name2];
                      Cache.save({ LiveReminders }, () => Settings.set({ "LIVE_REMINDERS": Object.keys(LiveReminders) }));
                    }
                  });
                const search = await new Search(name2).then(Search.convertResults);
                LiveReminders[name2] = search.live ? new Date((_a3 = search == null ? void 0 : search.data) == null ? void 0 : _a3.actualStartTime) : ((_b = search == null ? void 0 : search.data) == null ? void 0 : _b.lastSeen) ?? /* @__PURE__ */ new Date();
                Cache.save({ LiveReminders }, () => Settings.set({ "LIVE_REMINDERS": Object.keys(LiveReminders) }));
                await confirm.timed(`You'll be notified when <a href="/${name2}">${name2}</a> goes live.`, 7e3).then((ok) => {
                  if (ok === false)
                    Cache.save({ LiveReminders: { ...justInCase } }, () => Settings.set({ "LIVE_REMINDERS": Object.keys(LiveReminders) }));
                });
                PrepareForGarbageCollection(LiveReminders);
              });
            }
          }, "Send_to_Live_Reminders"));
        const [help] = $.body.getAllElementsByText("space/k", "i").filter((element) => element.tagName.equals("TBODY"));
        const f = furnish;
        if (defined(help) && $.nullish(".tt-extra-keyboard-shortcuts", help)) {
          for (const shortcut in GLOBAL_EVENT_LISTENERS)
            if (/^(key(?:up|down)_)/i.test(shortcut)) {
              const name2 = GLOBAL_EVENT_LISTENERS[shortcut].toTitle(), macro = GetMacro(shortcut.toLowerCase().split("_").slice(1).join("+"));
              if (!name2.length)
                continue;
              help.append(
                f("tr.tw-table-row.tt-extra-keyboard-shortcuts").with(
                  f("td.tw-table-cell").with(
                    f.p(name2)
                  ),
                  f("td.tw-table-cell").with(
                    f.span(macro)
                  )
                )
              );
            }
        }
      };
      Timers.extra_keyboard_shortcuts = 250;
      __ExtraKeyboardShortcuts__:
        if (parseBool(Settings.extra_keyboard_shortcuts)) {
          RegisterJob("extra_keyboard_shortcuts");
        }
      let DEFAULT_CLIP_NAME = new ClipName(2);
      const GLOBAL_CLIP_HANDLER = setInterval(() => {
        if (nullish(GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z))
          return;
        const EVENT_NAME = GLOBAL_EVENT_LISTENERS.KEYDOWN_ALT_Z.name;
        $.all("[tt-clip-timer]").map((element) => {
          const video = $(`video[uuid="${element.dataset.connectedTo}"]`), recorder = video.getRecording(EVENT_NAME);
          element.closest("[icon]").setAttribute("icon", element.innerHTML = toTimeString(+/* @__PURE__ */ new Date() - (recorder == null ? void 0 : recorder.creationTime), "clock"));
        });
        $.all("[tt-clip-sizer]").map((element) => {
          const video = $(`video[uuid="${element.dataset.connectedTo}"]`);
          element.innerHTML = `${video.videoWidth}&times;${video.videoHeight}`;
        });
        $.all("[tt-clip-typer]").map((element) => {
          const video = $(`video[uuid="${element.dataset.connectedTo}"]`), [type] = ((video == null ? void 0 : video.mimeType) ?? "video/x-unknown").split(";");
          element.innerHTML = `<code>${MIME_Types.find(type)}</code> <code>${type}</code>`;
        });
        $.all("[tt-clip-rater]").map((element) => {
          const video = $(`video[uuid="${element.dataset.connectedTo}"]`), recorder = video.getRecording(EVENT_NAME), data = recorder == null ? void 0 : recorder.blobs;
          element.innerHTML = `<code>${video.videoHeight}p</code> <code>${((data == null ? void 0 : data.reduce((total, { size = 0 }) => total += size, 0)) / (data == null ? void 0 : data.length) | 0).suffix("bps", false, "data")}</code>`;
        });
        $.all("[tt-clip-watcher]").map((element) => {
          var _a3;
          const video = $(`video[uuid="${element.dataset.connectedTo}"]`), recorder = video.getRecording(EVENT_NAME), data = recorder == null ? void 0 : recorder.blobs;
          element.innerHTML = (_a3 = data == null ? void 0 : data.reduce((total, { size = 0 }) => total += size, 0)) == null ? void 0 : _a3.suffix("B", 2);
        });
        $.all("[unit] input").map((input) => {
          input.onfocus ??= ({ currentTarget }) => currentTarget.closest("[unit]").setAttribute("focus", true);
          input.onblur ??= ({ currentTarget }) => currentTarget.closest("[unit]").setAttribute("focus", false);
          if (input.disabled)
            input.closest("[unit]").setAttribute("valid", true);
          else
            input.oninput = ({ currentTarget }) => currentTarget.closest("[unit]").setAttribute("valid", currentTarget.checkValidity());
        });
      }, 1e3);
    }
  });

  // src/lib/index.js
  globalThis.TTV ??= { plugin, plugins: PLUGINS, run, start };
  Object.assign(globalThis, {
    Balloon: Balloon2,
    ChatFooter,
    Card,
    ContextMenu,
    Search: Search2,
    Chat: Chat2,
    parseCoin: parseCoin2,
    GetQuality: GetQuality2,
    SetQuality: SetQuality2,
    GetVolume: GetVolume2,
    SetVolume: SetVolume2,
    GetViewMode: GetViewMode2,
    SetViewMode: SetViewMode2,
    GetActivity,
    GetLanguage,
    ReloadPage: ReloadPage2,
    scoreTagActivity
  });
})();
