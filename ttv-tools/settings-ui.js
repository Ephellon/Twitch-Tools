(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // src/plugins/automation/auto-join.settings.js
  var auto_join_settings_default = {
    title: "Auto-Join",
    tr: "auto-join",
    glyph: "mod",
    flags: ["small"],
    keywords: "audiences,auto join,celebration,congregation,crowd,current,dinner,flood,flow,gallery,gathering,market,ominous,parties,public,rush,spate,stream,surge,tide,timepiece,torrent,tributary,warning,watch,wristwatch",
    rows: [
      {
        toggle: "auto_accept_mature"
      },
      {
        text: "When presented with a warning that the stream is intended for <b warning-text>mature audiences</b>, proceed automatically."
      },
      {
        text: "This will also join <a href='https://help.twitch.tv/s/article/watch-parties' top-tooltip='Watch Parties'>Watch Parties</a> automatically."
      }
    ],
    settings: {
      auto_accept_mature: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/chat/auto-claim-bonuses.settings.js
  var auto_claim_bonuses_settings_default = {
    title: "Claim Bonuses",
    tr: "auto-claim-bonuses",
    glyph: "channelpoints",
    flags: ["small"],
    keywords: "avenue,benefit,bonus,bonus channel points,bounty,button,carrier,channel,dividend,gift,gratuity,knob,means,medium,perk,points,premium,prize,reward,route,tunnel",
    rows: [
      {
        toggle: "auto_claim_bonuses"
      },
      {
        text: "When the <a href='https://help.twitch.tv/s/article/channel-points-guide' top-tooltip='Bonus Channel Points'><button style='background-color:var(--blue)!important'><span small black glyph='bonuschannelpoints'></span></button></a> button appears, click it automatically."
      }
    ],
    settings: {
      auto_claim_bonuses: {
        type: "checkbox",
        default: true
      }
    }
  };

  // src/plugins/automation/claim-drops.settings.js
  var claim_drops_settings_default = {
    title: "Claim Drops",
    tr: "claim-drops",
    glyph: "loot",
    flags: ["small"],
    badges: {
      new: "5.32.14"
    },
    keywords: "avenue,benefit,drop,bounty,button,carrier,channel,dividend,gift,gratuity,knob,loot,means,medium,perk,points,premium,prize,reward,route,tunnel",
    rows: [
      {
        toggle: "claim_drops"
      },
      {
        text: "While viewing supported streams, automatically claim <a href='https://help.twitch.tv/s/article/mission-based-drops' top-tooltip='Drops'>Drops</a> in your inventory every {{claim_drops__interval}}."
      }
    ],
    settings: {
      claim_drops: {
        type: "checkbox",
        default: true
      },
      claim_drops__interval: {
        type: "number",
        default: 10,
        min: 5,
        max: 60,
        step: 1,
        wrap: {
          "fix-unit": "min"
        }
      }
    }
  };

  // src/plugins/automation/claim-loot.settings.js
  var claim_loot_settings_default = {
    title: "Claim Prime Loot",
    tr: "claim-loot",
    glyph: "crown",
    flags: ["small", "gold"],
    badges: {
      new: "3.2"
    },
    keywords: "action,allegation,application,assertion,booty,call,case,claim,demand,endless,gaming,interest,loads,loot,myriad,page,petition,plea,request,requirement,spoils,suit,uncounted,untold",
    rows: [
      {
        toggle: "claim_loot"
      },
      {
        text: "Automatically claim and dismiss <b>Prime Gaming Loot</b> offers when the page loads."
      }
    ],
    settings: {
      claim_loot: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/automation/lurking.settings.js
  var lurking_settings_default = {
    title: "Easy Lurk",
    tr: "away-mode",
    glyph: "show",
    flags: ["small"],
    badges: {
      new: "4.12"
    },
    keywords: "agenda,amount,calendar,chart,chatter,conversation,figure,gossip,itinerary,lineup,list,number,program,quantity,record,roster,schedule,size,timetable,total,volume;sunday,monday,tuesday,wednesday,thursday,friday,saturday",
    rows: [
      {
        toggle: "away_mode"
      },
      {
        text: "Adds a button to toggle <b attention-text top-tooltip='Watching (one or more) streams with little to no engagement'>lurking</b>."
      },
      {
        text: "The keyboard shortcut <code id='key:alt-a'>Alt + A</code> can also be used."
      },
      {
        extras: {
          title: "Extras",
          tr: "extras",
          subtitle: 'Adjust settings for "Easy Lurk"'
        },
        rows: [
          {
            option: {
              title: "Hide Chat",
              tr: "away-mode:hide-chat"
            },
            rows: [
              {
                toggle: "away_mode__hide_chat"
              },
              {
                text: "Keep chat hidden while <b attention-text top-tooltip='Watching (one or more) streams with little to no engagement'>lurking</b>."
              }
            ]
          },
          {
            option: {
              title: "Lurking Volume",
              tr: "away-mode:volume"
            },
            rows: [
              {
                toggle: "away_mode__volume_control"
              },
              {
                text: "Set the volume to {{away_mode__volume}} when <b attention-text top-tooltip='Watching (one or more) streams with little to no engagement'>lurking</b>."
              }
            ]
          },
          {
            option: {
              title: "Schedule",
              tr: "away-mode:schedule"
            },
            rows: [
              {
                extras: {
                  title: "Times",
                  tr: "away-mode:schedule:options",
                  subtitle: "View, or remove times"
                },
                panelAttrs: {
                  type: "list",
                  id: "away_mode_schedule"
                },
                rows: [
                  {
                    html: `<div day-of-week='0'>
                                            <h2 tr-id='day-of-week'>Sunday</h2>
                                        </div>`
                  },
                  {
                    html: `<div day-of-week='1'>
                                            <h2 tr-id='day-of-week'>Monday</h2>
                                        </div>`
                  },
                  {
                    html: `<div day-of-week='2'>
                                            <h2 tr-id='day-of-week'>Tuesday</h2>
                                        </div>`
                  },
                  {
                    html: `<div day-of-week='3'>
                                            <h2 tr-id='day-of-week'>Wednesday</h2>
                                        </div>`
                  },
                  {
                    html: `<div day-of-week='4'>
                                            <h2 tr-id='day-of-week'>Thursday</h2>
                                        </div>`
                  },
                  {
                    html: `<div day-of-week='5'>
                                            <h2 tr-id='day-of-week'>Friday</h2>
                                        </div>`
                  },
                  {
                    html: `<div day-of-week='6'>
                                            <h2 tr-id='day-of-week'>Saturday</h2>
                                        </div>`
                  },
                  {
                    html: "<div hr><button id='add-time'><span small glyph='add_to_calendar'></span> <span tr-id='new'>New</span></button></div>"
                  },
                  {
                    html: `<div hidden>
                                            <!-- BUFFER -->
                                        </div>`
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    settings: {
      away_mode: {
        type: "checkbox",
        default: true
      },
      away_mode__hide_chat: {
        type: "checkbox",
        default: false
      },
      away_mode__volume_control: {
        type: "checkbox",
        default: false
      },
      away_mode__volume: {
        type: "number",
        default: 25,
        min: 1,
        max: 25,
        unit: "%",
        scale: 0.01
        // Saved as a fraction of full volume
      },
      away_mode_schedule: {
        type: "custom"
      }
    }
  };

  // src/plugins/up-next/first-in-line.settings.js
  var first_in_line_settings_default = {
    title: "First in Line / Up Next",
    tr: "first-in-line",
    glyph: "favorite",
    flags: ["small"],
    badges: {
      beta: "5.34.0.1"
    },
    keywords: "avenue,blink,carrier,channel,current,flood,flow,flutter,jerk,jiggle,keep,keep reminders,live,live reminders,means,medium,route,rush,shudder,spate,stream,surge,tide,torrent,tremble,tributary,tunnel,twitch",
    rows: [
      {
        text: "When a channel goes live, head to its stream automatically."
      },
      {
        text: "<b>Up Next</b> adds a queueing service to Twitch™."
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "First in Line"'
        },
        rows: [
          {
            choice: "first_in_line_none",
            title: "Disabled",
            tr: "first-in-line:disabled",
            text: "Do not ues this feature"
          },
          {
            choice: "first_in_line_now",
            title: "Immediate",
            tr: "first-in-line:immediate",
            text: "Go to all streams as soon as they go live",
            attrs: {
              beta: ""
            }
          },
          {
            choice: "first_in_line",
            title: "Notification",
            tr: "first-in-line:notification",
            text: "When you receive a notification for a channel going live, go to its stream after {{first_in_line_time_minutes}}"
          },
          {
            choice: "first_in_line_plus",
            title: "Appearance",
            tr: "first-in-line:appearance",
            text: "When a channel appears in your Followed Channels, go to its stream after {{first_in_line_plus_time_minutes}}"
          },
          {
            choice: "first_in_line_all",
            title: "Automatic",
            tr: "first-in-line:smart-notifications",
            text: "Go to all streams automatically after {{first_in_line_all_time_minutes}}",
            titleAttrs: {
              bubble: "Smart Notifications"
            }
          }
        ]
      },
      {
        extras: {
          title: "Extras",
          tr: "extras",
          subtitle: 'Adjust settings for "Up Next"'
        },
        rows: [
          {
            option: {
              title: "One Instance",
              tr: "up-next:extras"
            },
            rows: [
              {
                toggle: "up_next__one_instance"
              },
              {
                text: "Only the first tab to load <b>Up Next</b> is allowed to use it."
              }
            ]
          },
          {
            option: {
              title: "<span class='live'>LIVE</span> Reminders",
              tr: "auto-follow:live-reminders"
            },
            attrs: {
              disabled: ""
            },
            rows: [
              {
                toggle: "live_reminders"
              },
              {
                text: "Adds a <b attention-text top-tooltip='A notification will display when a channel goes live'>reminder</b> button in the <b>about me</b> panel."
              }
            ]
          },
          {
            option: {
              title: "Keep Reminders",
              tr: "auto-follow:keep-live-reminders"
            },
            rows: [
              {
                toggle: "keep_live_reminders"
              },
              {
                text: "When enabled, <span class='live'>LIVE</span> Reminders will not be automatically removed."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      first_in_line_none: {
        type: "radio",
        default: true,
        group: "first-in-line"
      },
      first_in_line_now: {
        type: "radio",
        default: false,
        group: "first-in-line"
      },
      first_in_line: {
        type: "radio",
        default: false,
        group: "first-in-line"
      },
      first_in_line_time_minutes: {
        type: "number",
        default: 15,
        min: 5,
        step: 5,
        unit: "min"
      },
      first_in_line_plus: {
        type: "radio",
        default: false,
        group: "first-in-line"
      },
      first_in_line_plus_time_minutes: {
        type: "number",
        default: 15,
        min: 5,
        step: 5,
        unit: "min"
      },
      first_in_line_all: {
        type: "radio",
        default: false,
        group: "first-in-line"
      },
      first_in_line_all_time_minutes: {
        type: "number",
        default: 15,
        min: 5,
        step: 5,
        unit: "min"
      },
      up_next__one_instance: {
        type: "checkbox",
        default: false
      },
      live_reminders: {
        type: "checkbox",
        default: true,
        attrs: {
          disabled: ""
        }
      },
      keep_live_reminders: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/automation/auto-follow.settings.js
  var auto_follow_settings_default = {
    title: "Follows",
    tr: "auto-follow",
    glyph: "favorite",
    flags: ["small"],
    keywords: "avenue,board,bulletin,bureau,button,cabinet,carrier,channels,charge,collectibles,commission,current,extras,flood,flow,follow,forum,group,handling,jury,knob,management,manipulation,means,medium,notice,notification,oversight,panel,plan,policy,proclamation,reminders,route,rush,spate,strategy,streams,surge,tab,task force,tide,torrent,transaction,treatment,tribunal,tributary,tunnel,warning",
    rows: [
      {
        text: "While watching a channel that is not followed, follow it automatically."
      },
      {
        html: `<div>
                    <!-- EMPTY OFFSET -->
                </div>`
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "Follows"'
        },
        rows: [
          {
            choice: "auto_follow_none",
            title: "Disabled",
            tr: "auto-follow:none",
            text: "Do not use this feature"
          },
          {
            choice: "auto_follow_raids",
            title: "Raids",
            tr: "auto-follow:raids",
            text: "When participating in a raid, follow the channel being raided"
          },
          {
            choice: "auto_follow_time",
            title: "Viewership",
            tr: "auto-follow:time",
            text: "After watching {{auto_follow_time_minutes}} of content, follow the channel"
          },
          {
            choice: "auto_follow_all",
            title: "Automatic",
            tr: "auto-follow:all",
            text: "Follow all channels automatically"
          }
        ]
      }
    ],
    settings: {
      auto_follow_none: {
        type: "radio",
        default: true,
        group: "auto-follow"
      },
      auto_follow_raids: {
        type: "radio",
        default: false,
        group: "auto-follow"
      },
      auto_follow_time: {
        type: "radio",
        default: false,
        group: "auto-follow"
      },
      auto_follow_time_minutes: {
        type: "number",
        default: 15,
        min: 5,
        step: 5,
        unit: "min"
      },
      auto_follow_all: {
        type: "radio",
        default: false,
        group: "auto-follow"
      }
    }
  };

  // src/plugins/automation/kill-extensions.settings.js
  var kill_extensions_settings_default = {
    title: "Kill Extensions",
    tr: "kill-extensions",
    glyph: "extensions",
    flags: ["small", "gold"],
    keywords: "act,array,blink,current,delay,demonstration,development,display,example,exhibit,expansion,extensions,flood,flow,flutter,increase,jerk,jiggle,parade,postponement,presentation,rush,shudder,spate,stream,surge,tide,torrent,tremble,tributary,twitch",
    rows: [
      {
        toggle: "kill_extensions"
      },
      {
        text: "Do not allow Twitch™ extensions to display over the stream."
      }
    ],
    settings: {
      kill_extensions: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/settings/sections/next-channel.js
  var next_channel_default = {
    title: "Next Channel",
    tr: "next-channel-preference",
    glyph: "favorite",
    flags: ["small"],
    badges: {
      new: "4.1.8"
    },
    keywords: "avenue,carrier,channel,current,flood,flow,means,medium,offline,route,rush,spate,stream,surge,tide,torrent,tributary,tunnel",
    rows: [
      {
        text: "How should the next channel be chosen when <b>Up Next</b> is empty?"
      },
      {
        text: "<b warning-text>This only activates when the current stream goes offline</b>."
      },
      {
        select: "next_channel_preference"
      }
    ],
    settings: {
      next_channel_preference: {
        type: "select",
        options: [
          {
            value: "none",
            label: "Disabled",
            attrs: {
              "tr-id": "next-channel-preference:options"
            }
          },
          {
            default: true,
            value: "random",
            label: "Go to a random channel",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "unpopular",
            label: "Go with the least viewers",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "popular",
            label: "Go with the most viewers",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "poor",
            label: "Go with the least channel points",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "rich",
            label: "Go with the most channel points",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "closest",
            label: "Go with the closest to having all channel point rewards",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "furthest",
            label: "Go with the furthest from having all channel point rewards",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      }
    }
  };

  // src/plugins/automation/parse-commands.settings.js
  var parse_commands_settings_default = {
    title: "Parse Commands",
    tr: "parse-commands",
    glyph: "extensions",
    flags: ["small", "gold"],
    badges: {
      new: "4.30"
    },
    keywords: "angle,association,avenue,board,bulletin,bureau,button,cabinet,carrier,change,channels,charge,collectibles,commands,commission,contact,corner,current,curve,departure,direction,duty,element,extras,fairway,flood,flow,forum,group,handling,hookup,jury,knob,law,links,management,mandate,manipulation,means,medium,network,notice,notification,order,oversight,page,panel,plan,policy,proclamation,regulation,relationship,reminders,request,responsibility,reversal,round,route,rule,rush,shift,spate,spin,spiral,strategy,streams,surge,swing,tab,task force,tide,tie,torrent,transaction,treatment,trend,tribunal,tributary,tunnel,turn,twist,warning,wind,word,word",
    rows: [
      {
        toggle: "parse_commands"
      },
      {
        text: "When a <b alert-text top-tooltip='!command'>command</b> has been found on the page, retrieve the contents of the command."
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "Parse Commands"'
        },
        rows: [
          {
            option: {
              title: "Create Links",
              tr: "parse-commands:options"
            },
            rows: [
              {
                toggle: "parse_commands__create_links"
              },
              {
                text: "<b>Parse Commands</b> will turn commands that contain links into their <b attention-text top-tooltip='Most fulfilled (missing the least number of components)'>best</b> link."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      parse_commands: {
        type: "checkbox",
        default: false
      },
      parse_commands__create_links: {
        type: "checkbox",
        default: true
      }
    }
  };

  // src/plugins/automation/prevent-raiding.settings.js
  var prevent_raiding_settings_default = {
    title: "Prevent Raiding",
    tr: "prevent-raiding",
    glyph: "people",
    flags: ["small"],
    badges: {
      new: "4.12.11"
    },
    keywords: "arrest,assault,avenue,break in,capture,carrier,channels,charge,handling,incursion,invasion,management,manipulation,means,medium,onslaught,oversight,plan,policy,raiding,route,sortie,strategy,surprise attack,sweep,transaction,treatment,tunnel",
    rows: [
      {
        text: "Prevent certain or all channels from raiding by going to the <b>Next Channel</b>."
      },
      {
        select: "prevent_raiding"
      },
      {
        extras: {
          title: "Extras",
          tr: "extras",
          subtitle: 'Adjust settings for "Prevent Raiding"'
        },
        rows: [
          {
            option: {
              title: "Greedy Raiding",
              tr: "@@greedy-raiding"
            },
            rows: [
              {
                toggle: "greedy_raiding"
              },
              {
                text: "Go to <b attention-text top-tooltip='Followed channels with Channel Points'>certain channels</b> when they begin a raid."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      prevent_raiding: {
        type: "select",
        options: [
          {
            default: true,
            value: "none",
            label: "Allow all channels to raid",
            attrs: {
              "tr-id": "prevent-raiding:options"
            }
          },
          {
            value: "greed",
            label: "Only raid to collect channel points",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "all",
            label: "Prevent all channels from raiding",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "unfollowed",
            label: "Prevent unfollowed channels from being raided",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      },
      greedy_raiding: {
        type: "checkbox",
        default: false,
        attrs: {
          requires: "#prevent_raiding"
        }
      }
    }
  };

  // src/plugins/automation/claim-prime.settings.js
  var claim_prime_settings_default = {
    title: "Prime Subscription",
    tr: "claim-prime",
    glyph: "crown",
    flags: ["small", "gold"],
    badges: {
      beta: "5.28"
    },
    keywords: "age,contribution,date,day,era,future,generation,hour,life,max,moment,month,occasion,pace,past,point,present,season,second,space,stage,subscription,subscription,term,turn,week,while,year",
    rows: [
      {
        toggle: "claim_prime"
      },
      {
        text: "Automatically reclaim your <a href='https://help.twitch.tv/s/article/how-to-use-twitch-prime-subscriptions' top-tooltip='Prime Gaming Subscription'>Prime Subscription</a> every month."
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "Prime Subscription"'
        },
        rows: [
          {
            option: {
              title: "Max Resubscriptions",
              tr: "claim-prime:max-claims"
            },
            rows: [
              {
                text: "<b>Prime Subscription</b> will resubscribe for {{claim_prime__max_claims}} months."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      claim_prime: {
        type: "checkbox",
        default: false
      },
      claim_prime__max_claims: {
        type: "number",
        default: 3,
        min: 1,
        max: 48,
        step: 1,
        unit: "🔢"
      }
    }
  };

  // src/plugins/automation/stay-live.settings.js
  var stay_live_settings_default = {
    title: "Stay Live",
    tr: "stay-live",
    glyph: "stream",
    flags: ["small"],
    badges: {
      new: "4.5"
    },
    keywords: "avenue,carrier,channel,current,deadline,edge,ends,flood,flow,holiday,means,medium,offline,point,route,rush,sojourn,spate,stay,stopover,streams,surge,term,tide,top,torrent,tributary,tributary,tunnel,vacation",
    rows: [
      {
        toggle: "stay_live"
      },
      {
        text: "After the current stream ends, go to the <b>Next Channel</b>."
      },
      {
        extras: {
          title: "Extras",
          tr: "extras",
          subtitle: 'Adjust settings for "Stay Live"'
        },
        rows: [
          {
            option: {
              title: "<span class='offline'>Rerun</span> → <span class='offline'>Offline</span>"
            },
            rows: [
              {
                toggle: "stay_live__ignore_channel_reruns"
              },
              {
                tr: "stay-live:vod-is-offline",
                text: "Treat <a href='https://help.twitch.tv/s/article/video-on-demand#reruns' top-tooltip='Reruns'>reruns</a> as offline streams."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      stay_live: {
        type: "checkbox",
        default: true
      },
      stay_live__ignore_channel_reruns: {
        type: "checkbox",
        default: false,
        attrs: {
          requires: "#stay_live"
        }
      }
    }
  };

  // src/plugins/automation/time-zones.settings.js
  var time_zones_settings_default = {
    title: "Time Zones",
    tr: "time-zones",
    glyph: "calendar",
    flags: ["small", "gold"],
    badges: {
      new: "4.12.14"
    },
    keywords: "area,belt,ground,page,region,section,sector,territory,time zone,zones",
    rows: [
      {
        toggle: "time_zones"
      },
      {
        text: "Automatically convert detected times on the page to your local time zone."
      }
    ],
    settings: {
      time_zones: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/automation/view-mode.settings.js
  var view_mode_settings_default = {
    title: "View Mode",
    tr: "view-mode",
    glyph: "video",
    flags: ["small", "gold"],
    badges: {
      new: "3.1.5"
    },
    keywords: "approach,aspect,condition,fashion,form,glimpse,loading,look,mechanism,method,mode,outlook,packing,page,perspective,picture,posture,procedure,process,prospect,quality,scene,sight,situation,status,storing,style,system,technique,tone,view,vision,way",
    rows: [
      {
        text: "When the page is done loading, change the view to:"
      },
      {
        select: "view_mode"
      }
    ],
    settings: {
      view_mode: {
        type: "select",
        options: [
          {
            default: true,
            value: "null",
            label: "Nothing (do not change)",
            attrs: {
              "tr-id": "view-mode:options"
            }
          },
          {
            value: "default",
            label: "Default Mode (banner + chat)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "theatre",
            label: "Theatre Mode (chat)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "fullwidth",
            label: "Fullwidth Mode (banner)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "fullscreen",
            label: "Fullscreen Mode",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      }
    }
  };

  // src/plugins/chat/simplify-chat.settings.js
  var simplify_chat_settings_default = {
    title: "Accessibility",
    tr: "simplify-chat",
    glyph: "accessible",
    flags: ["large", "help"],
    badges: {
      new: "5.32.7",
      id: "accessibility"
    },
    keywords: "accent,act,array,chatter,colors,conversation,demonstration,display,emphasis,example,exhibit,font,fount,gossip,homogeneous,inflection,inflexible,monotone,orderly,parade,presentation,reliable,resonance,rigid,strength,systematic,timbre,tones,uniform",
    rows: [
      {
        text: "Make Twitch™ easier to navigate and use."
      },
      {
        html: `<details>
                    <summary tr-id='options' subtitle='Adjust accessibility options'>Options</summary>

                    <div sect>
                        <h2><span small gold glyph='chat'></span> Chat</h2>

                        <div opt>
                            <div class='title' tr-id='simplify-chat:options'>Dual-tone Chat</div>
                            <div class='summary'>
                                <div class='toggle'>
                                    <input id='simplify_chat' type='checkbox'>
                                    <label for='simplify_chat'></label>
                                </div>
                                <p tr-id>
                                    Display the chat dual-toned to make it easier to read.
                                </p>
                            </div>
                        </div>

                        <div opt>
                            <div class='title' tr-id='simplify-chat:options'>Monotone Usernames</div>
                            <div class='summary'>
                                <div class='toggle'>
                                    <input id='simplify_chat_monotone_usernames' type='checkbox'>
                                    <label for='simplify_chat_monotone_usernames'></label>
                                </div>
                                <p tr-id>
                                    Keep username colors uniform.
                                </p>
                            </div>
                        </div>

                        <div opt>
                            <div class='title' tr-id>Chat Font</div>
                            <div class='summary'>
                                <p tr-id>
                                    Display chat in the following font:
                                </p>

                                <select id='simplify_chat_font'>
                                    <option value='Roobert' style='font-family:Roobert!important' selected>Roobert → TWITCH.tv™</option>
                                    <option value='Arial' style='font-family:Arial!important'>Arial → TWITCH.tv™</option>
                                    <option value='Calibri' style='font-family:Calibri!important'>Calibri → TWITCH.tv™</option>
                                    <option value='Dyslexie' style='font-family:Dyslexie!important'>Dyslexie → TWITCH.tv™</option>
                                    <option value='Helvetica' style='font-family:Helvetica!important'>Helvetica → TWITCH.tv™</option>
                                    <option value='Monospace' style='font-family:Monospace!important'>Monospace → TWITCH.tv™</option>
                                    <option value='System-UI' style='font-family:System-UI!important'>System-UI → TWITCH.tv™</option>
                                    <option value='Tahoma' style='font-family:Tahoma!important'>Tahoma → TWITCH.tv™</option>
                                    <option value='Verdana' style='font-family:Verdana!important'>Verdana → TWITCH.tv™</option>
                                    <option value='Inter' style='font-family:Inter!important'>Inter → TWITCH.tv™</option>
                                    <option value='04b03' style='font-family:"04b03"!important'>04b03 → TWITCH.tv™</option>
                                </select>
                            </div>
                        </div>

                        <div disabled opt>
                            <div class='title' tr-id>Reverse Emotes</div>
                            <div class='summary'>
                                <div class='toggle'>
                                    <input id='simplify_chat_reverse_emotes' type='checkbox' disabled>
                                    <label for='simplify_chat_reverse_emotes'></label>
                                </div>
                                <p tr-id>
                                    Convert emotes back into their text, and display the emote (as a <code>tooltip</code>) only when <code>hovering</code> the text.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div sect>
                        <h2><span small gold glyph='video'></span> Twitch™</h2>

                        <div opt>
                            <div class='title' tr-id='simplify-look:options'>Marquee Long Text</div>

                            <div class='summary'>
                                <div class='toggle'>
                                    <input id='simplify_look_auto_marquee' type='checkbox'>
                                    <label for='simplify_look_auto_marquee'></label>
                                </div>
                                <p tr-id>
                                    Text that extends beyond a container's display will be turned into a marquee.
                                </p>
                            </div>
                        </div>

                        <div opt>
                            <div class='title' tr-id>Page Font</div>
                            <div class='summary'>
                                <p tr-id>
                                    Display Twitch™ (excluding chat) in the following font:
                                </p>

                                <select id='simplify_page_font'>
                                    <option value='Roobert' style='font-family:Roobert!important' selected>Roobert → TWITCH.tv™</option>
                                    <option value='Arial' style='font-family:Arial!important'>Arial → TWITCH.tv™</option>
                                    <option value='Calibri' style='font-family:Calibri!important'>Calibri → TWITCH.tv™</option>
                                    <option value='Dyslexie' style='font-family:Dyslexie!important'>Dyslexie → TWITCH.tv™</option>
                                    <option value='Helvetica' style='font-family:Helvetica!important'>Helvetica → TWITCH.tv™</option>
                                    <option value='Monospace' style='font-family:Monospace!important'>Monospace → TWITCH.tv™</option>
                                    <option value='System-UI' style='font-family:System-UI!important'>System-UI → TWITCH.tv™</option>
                                    <option value='Tahoma' style='font-family:Tahoma!important'>Tahoma → TWITCH.tv™</option>
                                    <option value='Verdana' style='font-family:Verdana!important'>Verdana → TWITCH.tv™</option>
                                    <option value='Inter' style='font-family:Inter!important'>Inter → TWITCH.tv™</option>
                                    <option value='04b03' style='font-family:"04b03"!important'>04b03 → TWITCH.tv™</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </details>`
      }
    ],
    settings: {
      simplify_chat: {
        type: "custom"
      },
      simplify_chat_monotone_usernames: {
        type: "custom"
      },
      simplify_chat_font: {
        type: "custom"
      },
      simplify_look_auto_marquee: {
        type: "custom"
      },
      simplify_page_font: {
        type: "custom"
      },
      simplify_chat_reverse_emotes: {
        type: "custom",
        store: false
      }
    }
  };

  // src/plugins/chat/bttv-emotes.settings.js
  var bttv_emotes_settings_default = {
    title: "BetterTTV Emotes",
    tr: "bttv-emotes",
    glyph: "emotes",
    flags: ["small", "gold"],
    keywords: "amount,anxiety,area,avenue,bundle,capacity,carrier,cause,channel,consignment,content,district,document,element,emotes,explanation,fluctuation,goods,haul,idea,insecurity,instability,loading,locale,location,matter,means,medium,motivation,motive,neighborhood,origin,packing,paragraph,part,passage,payload,point,position,principle,purpose,quotation,region,root,route,scene,section,shipment,site,situation,source,spot,station,storing,text,theme,tunnel,uncertainty,venue,verse,volatility,vulnerability,weakness,weight,whereabouts,wording,words",
    rows: [
      {
        toggle: "bttv_emotes"
      },
      {
        text: "Enable the usage of BetterTTV emotes."
      },
      {
        text: "This may cause instability while loading emotes.",
        attrs: {
          "warning-text": ""
        }
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "BetterTTV emotes"'
        },
        rows: [
          {
            option: {
              title: "Auto-load Emotes",
              tr: "bttv-emotes:auto-load-bttv-emotes"
            },
            rows: [
              {
                toggle: "auto_load_bttv_emotes"
              },
              {
                text: "Automatically convert emote text to <b>BetterTTV</b> emotes."
              }
            ]
          },
          {
            option: {
              title: "Channel Specific Emotes",
              tr: "bttv-emotes:channel-specific-emotes"
            },
            rows: [
              {
                toggle: "bttv_emotes_channel"
              },
              {
                text: "Load channel specific <b>BetterTTV</b> emotes."
              }
            ]
          },
          {
            option: {
              title: "Emote Location",
              tr: "bttv-emotes:emote-location"
            },
            rows: [
              {
                text: "Load these <b>BetterTTV</b> emotes:"
              },
              {
                select: "bttv_emotes_location"
              }
            ]
          },
          {
            option: {
              title: "Extra Emotes",
              tr: "bttv-emotes:extra-emotes"
            },
            rows: [
              {
                text: "Add <b>BetterTTV</b> emotes with the words: {{bttv_emotes_extras}}"
              }
            ]
          },
          {
            option: {
              title: "Library Size",
              tr: "bttv-emotes:library-size"
            },
            rows: [
              {
                text: "Load up to {{bttv_emotes_maximum}}"
              }
            ]
          }
        ]
      }
    ],
    settings: {
      bttv_emotes: {
        type: "checkbox",
        default: false
      },
      auto_load_bttv_emotes: {
        type: "checkbox",
        default: false
      },
      bttv_emotes_channel: {
        type: "checkbox",
        default: false
      },
      bttv_emotes_location: {
        type: "select",
        options: [
          {
            default: true,
            value: "emotes/shared/trending",
            label: "Most popular (Trending)",
            attrs: {
              "tr-id": "bttv-emotes:emote-location:options"
            }
          },
          {
            value: "emotes/shared",
            label: "Most shared (Shared)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "emotes/shared/top",
            label: "Most used (Top)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "cached/emotes/global",
            label: "Most universal (Global)",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      },
      bttv_emotes_extras: {
        type: "text",
        default: "",
        placeholder: "monka,flex,pls",
        attrs: {
          "left-tooltip": "Case insensitive • Comma separated"
        }
      },
      bttv_emotes_maximum: {
        type: "number",
        default: 150,
        min: 30,
        max: 3e3,
        step: 30,
        wrap: {
          set: "unit=Glyphs.utf8.emotes"
        }
      }
    }
  };

  // src/plugins/chat/filter-messages.settings.js
  var filter_messages_settings_default = {
    title: "Filter Messages",
    tr: "filter-messages",
    glyph: "mod",
    flags: ["small", "gold"],
    badges: {
      new: "5.8"
    },
    keywords: "advertisement,aid,announcements,appliance,arrest,assault,assistance,avenue,backing,benefit,block,break in,briefing,broadcast,bulletins,capture,carrier,channels,charge,clean,compensation,contribution,cooperation,device,disclosure,dispatch,drain,dribble,filter,gear,gizmo,handling,handout,help,incursion,invasion,leak,machinery,management,manipulation,means,mechanism,medium,messages,news,notice,onslaught,oversight,penetrate,percolate,permeate,pin,pinned,plan,points,policy,prediction,publication,prevent,raids,refine,release,relief,report,revelation,route,rules,service,sift,sortie,statement,stop,strategy,subscriptions,support,surprise attack,sweep,tools,transaction,treatment,trickle,tunnel,winnow,writing",
    rows: [
      {
        toggle: "filter_messages"
      },
      {
        text: "Remove messages/rules across all channels."
      },
      {
        text: "Please see <a href='https://github.com/Ephellon/Twitch-Tools/wiki/Filter-Messages'>TTV Tools Wiki — Filter Messages</a> for assistance."
      },
      {
        tr: false,
        text: "{{filter_rules-input}}"
      },
      {
        extras: {
          title: "Rules",
          tr: "filter-messages:options",
          subtitle: "View, or remove rules"
        },
        panelAttrs: {
          type: "list",
          id: "filter_rules"
        },
        rows: [
          {
            html: `<div filter-type='channel' tr-id>
                            <h2>Channel Rules</h2>
                        </div>`
          },
          {
            html: `<div filter-type='badge' tr-id>
                            <h2>Badges</h2>
                        </div>`
          },
          {
            html: `<div filter-type='user' tr-id>
                            <h2>Users</h2>
                        </div>`
          },
          {
            html: `<div filter-type='emote' tr-id>
                            <h2>Emotes</h2>
                        </div>`
          },
          {
            html: `<div filter-type='text' tr-id>
                            <h2>Text</h2>
                        </div>`
          },
          {
            html: `<div filter-type='regexp' tr-id>
                            <h2>RegExp</h2>
                        </div>`
          },
          {
            html: `<div>
                            <h2 tr-id>
                                Get started by <a href='#filter_rules-input' target='_self'>adding</a> some rules.
                            </h2>

                            <details>
                                <summary subtitle>Examples</summary>
                                <ul>
                                    <li>
                                        Remove messages that contain certain words:
                                        <pre type='code'>merch,promo,sponsor</pre>
                                    </li>
                                    <li>
                                        Remove messages that contain certain emotes:
                                        <pre type='code'>:LUL:,:KEKW:</pre>
                                    </li>
                                    <li>
                                        Remove messages from certain users:
                                        <pre type='code'>@username,@otherUsername</pre>
                                    </li>
                                    <li>
                                        Remove messages from certain badge users:
                                        <pre type='code'>&lt;badge&gt;,&lt;another badge&gt;</pre>
                                        Only part of the badge names are required:
                                        <pre type='code'>&lt;mod&gt; → &lt;moderator&gt;; &lt;cheer&gt; = &lt;cheer100&gt; &lt;cheer500&gt; ...</pre>
                                    </li>
                                    <li>
                                        Remove messages that contain certain patterns (<a href='https://javascript.info/regular-expressions'>RegExp</a>):
                                        <pre type='code'>swears?|bad w[o0]rd</pre>
                                    </li>
                                    <li>
                                        Remove messages on certain channels:
                                        <pre type='code'>/DashDucks <em>filter-rule</em></pre>
                                    </li>
                                </ul>
                            </details>
                        </div>`
          }
        ]
      },
      {
        extras: {
          title: "Bulletins",
          tr: "filter-messages:bullets-options",
          subtitle: "Control the display of bulletins (highlighted messages)"
        },
        rows: [
          {
            option: {
              title: "Raids",
              tr: "",
              glyph: "raid",
              flags: ["small", "purple"]
            },
            rows: [
              {
                toggle: "filter_messages__bullets_raid"
              },
              {
                text: "Hide all raid related bulletins."
              }
            ]
          },
          {
            option: {
              title: "Channel Points",
              tr: "",
              glyph: "channelpoints",
              flags: ["small", "purple"]
            },
            rows: [
              {
                toggle: "filter_messages__bullets_coin"
              },
              {
                text: "Hide all channel point related bulletins."
              }
            ]
          },
          {
            option: {
              title: "Subscriptions",
              tr: "",
              glyph: "gift",
              flags: ["small", "gold"]
            },
            rows: [
              {
                toggle: "filter_messages__bullets_subs"
              },
              {
                text: "Hide all subscription related bulletins."
              }
            ]
          },
          {
            option: {
              title: "Announcements",
              tr: "",
              glyph: "alert",
              flags: ["small", "gold"]
            },
            rows: [
              {
                toggle: "filter_messages__bullets_note"
              },
              {
                text: "Hide all announcement related bulletins."
              }
            ]
          },
          {
            option: {
              title: "Pinned Messages",
              tr: "",
              glyph: "pinned",
              flags: ["small", "gold"]
            },
            rows: [
              {
                toggle: "filter_messages__bullets_paid"
              },
              {
                text: "Hide all pinned messages."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      filter_messages: {
        type: "checkbox",
        default: true
      },
      "filter_rules-input": {
        type: "text",
        default: "",
        placeholder: "/channel <badge> @user :emote: text reg.exp?",
        store: false,
        attrs: {
          "left-tooltip": "Case insensitive • Comma separated"
        }
      },
      filter_messages__bullets_raid: {
        type: "checkbox",
        default: false
      },
      filter_messages__bullets_coin: {
        type: "checkbox",
        default: false
      },
      filter_messages__bullets_subs: {
        type: "checkbox",
        default: false
      },
      filter_messages__bullets_note: {
        type: "checkbox",
        default: false
      },
      filter_messages__bullets_paid: {
        type: "checkbox",
        default: false
      },
      filter_rules: {
        type: "custom"
      }
    }
  };

  // src/plugins/chat/highlight-mentions.settings.js
  var highlight_mentions_settings_default = {
    title: "Highlight Mentions",
    tr: "highlight-mentions",
    glyph: "thread",
    flags: ["gold"],
    keywords: "attitude,belief,character,climax,determination,directive,feature,focal point,highlight,information,leader,letter,memorandum,message,news,note,notice,official,report,sentiment,someone,stance,stand,star,view,word",
    rows: [
      {
        toggle: "highlight_mentions"
      },
      {
        text: "When someone mentions you <code purple>@username</code>, make the message stand out by highlighting it."
      },
      {
        extras: {
          title: "Extras",
          tr: "extras",
          subtitle: 'Adjust settings for "Highlight Mentions"'
        },
        rows: [
          {
            html: "<div class='title' tr-id='highlight-mentions:options'>General Highlighting</div>"
          },
          {
            html: `<div class='summary'>
                            <div class='toggle'>
                                <input id='highlight_mentions_extra' type='checkbox'>
                                <label for='highlight_mentions_extra'></label>
                            </div>
                            <p tr-id>
                                When someone sends a general mention <code purple>@all</code> <code purple>@chat</code> <code purple>@everyone</code>, make the message stand out by highlighting it.
                            </p>
                        </div>`
          }
        ]
      }
    ],
    settings: {
      highlight_mentions: {
        type: "checkbox",
        default: true
      },
      highlight_mentions_extra: {
        type: "custom"
      }
    }
  };

  // src/plugins/chat/highlight-phrases.settings.js
  var highlight_phrases_settings_default = {
    title: "Highlight Phrases",
    tr: "highlight-phrases",
    glyph: "star",
    flags: ["gold"],
    badges: {
      new: "4.1"
    },
    keywords: "aid,appliance,assistance,attitude,backing,belief,benefit,character,climax,compensation,cooperation,determination,device,directive,expression,feature,focal point,gear,gizmo,help,highlight,idiom,information,leader,letter,machinery,means,mechanism,memorandum,message,motto,news,note,notice,official,phrases,phrasing,relief,remark,report,saying,sentiment,service,slogan,someone,stance,stand,star,support,terminology,tools,utterance,view,word,wording",
    rows: [
      {
        toggle: "highlight_phrases"
      },
      {
        text: "When someone sends a message with one of the following phrases, make the message stand out by highlighting it."
      },
      {
        text: "Please see <a href='https://github.com/Ephellon/Twitch-Tools/wiki/Highlight-Phrases'>TTV Tools Wiki — Highlight Phrases</a> for assistance."
      },
      {
        tr: false,
        text: "{{phrase_rules-input}}"
      },
      {
        extras: {
          title: "Rules",
          tr: "highlight-phrases:options",
          subtitle: "View, or remove rules"
        },
        panelAttrs: {
          type: "list",
          id: "phrase_rules"
        },
        rows: [
          {
            html: `<div phrase-type='channel' tr-id>
                            <h2>Channel Rules</h2>
                        </div>`
          },
          {
            html: `<div phrase-type='badge' tr-id>
                            <h2>Badges</h2>
                        </div>`
          },
          {
            html: `<div phrase-type='user' tr-id>
                            <h2>Users</h2>
                        </div>`
          },
          {
            html: `<div phrase-type='emote' tr-id>
                            <h2>Emotes</h2>
                        </div>`
          },
          {
            html: `<div phrase-type='text' tr-id>
                            <h2>Text</h2>
                        </div>`
          },
          {
            html: `<div phrase-type='regexp' tr-id>
                            <h2>RegExp</h2>
                        </div>`
          },
          {
            html: `<div>
                            <h3 tr-id>
                                Get started by <a href='#phrase_rules-input' target='_self'>adding</a> some rules.
                            </h3>

                            <details>
                                <summary subtitle>Examples</summary>
                                <ul>
                                    <li>
                                        Highlight messages that contain certain words:
                                        <pre type='code'>merch,promo,sponsor</pre>
                                    </li>
                                    <li>
                                        Highlight messages that contain certain emotes:
                                        <pre type='code'>:LUL:,:KEKW:</pre>
                                    </li>
                                    <li>
                                        Highlight messages from certain users:
                                        <pre type='code'>@username,@otherUsername</pre>
                                    </li>
                                    <li>
                                        Highlight messages from certain badge users:
                                        <pre type='code'>&lt;badge&gt;,&lt;another badge&gt;</pre>
                                        Only part of the badge names are required:
                                        <pre type='code'>&lt;mod&gt; → &lt;moderator&gt;; &lt;cheer&gt; = &lt;cheer100&gt; &lt;cheer500&gt; ...</pre>
                                    </li>
                                    <li>
                                        Highlight messages that contain certain patterns (<a href='https://javascript.info/regular-expressions'>RegExp</a>):
                                        <pre type='code'>praises?|g[o0]+d w[o0]rd</pre>
                                    </li>
                                    <li>
                                        Highlight messages on certain channels:
                                        <pre type='code'>/DashDucks <em>highlight-rule</em></pre>
                                    </li>
                                </ul>
                            </details>
                        </div>`
          }
        ]
      }
    ],
    settings: {
      highlight_phrases: {
        type: "checkbox",
        default: false
      },
      "phrase_rules-input": {
        type: "text",
        default: "",
        placeholder: "/channel <badge> @user :emote: text reg.exp?",
        store: false,
        attrs: {
          "left-tooltip": "Case insensitive • Comma separated"
        }
      },
      phrase_rules: {
        type: "custom"
      }
    }
  };

  // src/plugins/chat/link-maker-chat.settings.js
  var link_maker_chat_settings_default = {
    title: "Link Maker",
    tr: "link-maker",
    glyph: "compass",
    flags: ["small", "gold"],
    badges: {
      new: "5.16"
    },
    keywords: "association,badge,builder,calendar,cards,channel,chatter,check,contact,conversation,element,examination,fairway,gossip,hookup,inventor,label,links,maker,manufacturer,network,poster,preview,producer,program,relationship,sheet,ticket,tie,viewing",
    rows: [
      {
        toggle: "link_maker__chat"
      },
      {
        text: "Automatically convert links in chat to preview cards."
      }
    ],
    settings: {
      link_maker__chat: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/chat/auto-chat-vip.settings.js
  var auto_chat_vip_settings_default = {
    title: "Lurking Message",
    tr: "auto-chat",
    glyph: "thread",
    flags: ["white"],
    badges: {
      new: "5.32.5"
    },
    keywords: "channels,charge,directive,handling,information,letter,management,manipulation,memo,memorandum,message,news,note,notice,oversight,plan,policy,report,strategy,transaction,treatment,vip,word",
    rows: [
      {
        text: "Send message(s) in specific channels based on rules you set. If multiple messages are defined for the same rule, a random one will be chosen."
      },
      {
        text: "When you have the following <a href='https://help.twitch.tv/s/article/twitch-chat-badges-guide' top-tooltip='Chat Badges'>special badge</a>, it will send a <em>general message</em> on your behalf:"
      },
      {
        html: `<div>
                        <select id='auto_chat__vip'>
                            <option value='null' set='textContent→\\Glyphs.utf8.error \\this.textContent'>Disabled (never send)</option>
                            <option value='moderator' set='textContent→\\Glyphs.utf8.sword \\this.textContent'>Moderator</option>
                            <option value='vip' set='textContent→\\Glyphs.utf8.vip \\this.textContent'>VIP</option>
                            <option value='subscriber' set='textContent→\\Glyphs.utf8.fav \\this.textContent'>Subscriber</option>
                            <option value='everyone' set='textContent→\\Glyphs.utf8.intro \\this.textContent'>Everyone (always send)</option>
                        </select>
                    </div>`
      },
      {
        tr: false,
        text: ""
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "Lurking Message"'
        },
        rows: [
          {
            option: {
              title: "Mentions",
              tr: "auto-chat:include-mentions"
            },
            attrs: {
              disabled: ""
            },
            rows: [
              {
                text: "When someone mentions you <code purple>@username</code>:<br> {{auto_chat__mentions}}"
              }
            ]
          },
          {
            option: {
              title: "Message(s)",
              tr: "auto-chat:lurking-message"
            },
            rows: [
              {
                text: "{{lurking_rules-input}}"
              },
              {
                extras: {
                  title: "Messages",
                  tr: "lurking-message:options",
                  subtitle: "View, or remove messages"
                },
                panelAttrs: {
                  type: "list",
                  id: "lurking_rules"
                },
                rows: [
                  {
                    html: `<div lurking-type='channel' tr-id>
                                            <h2>Channel Specific Messages</h2>
                                        </div>`
                  },
                  {
                    html: `<div lurking-type='badge' tr-id>
                                            <h2>Badge Specific Messages</h2>
                                        </div>`
                  },
                  {
                    html: `<div lurking-type='text' tr-id>
                                            <h2>General Messages</h2>
                                        </div>`
                  },
                  {
                    html: `<div>
                                            <h2 tr-id>
                                                Get started by <a href='#lurking_rules-input' target='_self'>adding</a> some rules and messages.
                                            </h2>

                                            <details>
                                                <summary subtitle>Examples</summary>
                                                <ul>
                                                    <li>
                                                        Send a message on a specific channel (<em>DashDucks</em>):
                                                        <pre type='code'>/dashducks another day, another duck :D</pre>
                                                    </li>
                                                    <li>
                                                        Send a message where you have certain permissions (<em>moderator</em>):
                                                        <pre type='code'>&lt;mod&gt; modCheck I have risen modCheck</pre>
                                                    </li>
                                                    <li>
                                                        Send a message on a specific channel, where you have certain permissions (<em>DashDuck:moderator</em>):
                                                        <pre type='code'>/dashducks &lt;mod&gt; modCheck I have risen modCheck</pre>
                                                    </li>
                                                </ul>
                                            </details>
                                        </div>`
                  }
                ]
              }
            ]
          },
          {
            option: {
              title: "Wait Time",
              tr: "auto-chat:include-phrases"
            },
            rows: [
              {
                text: "Wait {{auto_chat__wait_time}} before sending the <b>message</b>."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      auto_chat__mentions: {
        type: "select",
        options: [
          {
            value: "null",
            label: "Do nothing"
          }
        ]
      },
      "lurking_rules-input": {
        type: "text",
        default: "",
        placeholder: "/channel <badge> message",
        store: false,
        attrs: {
          "left-tooltip": "Case insensitive • Semicolon separated"
        }
      },
      auto_chat__wait_time: {
        type: "number",
        default: 5,
        min: 0,
        max: 30,
        step: 1,
        unit: "min"
      },
      auto_chat__vip: {
        type: "custom"
      },
      lurking_rules: {
        type: "custom"
      }
    }
  };

  // src/plugins/chat/native-twitch-reply.settings.js
  var native_twitch_reply_settings_default = {
    title: "Native Reply",
    tr: "native-reply",
    glyph: "reply",
    flags: ["small", "gold"],
    keywords: "acknowledgment,act,array,attack,attempt,bid,blink,channels,charge,demonstration,display,endeavor,example,exhibit,experiment,feedback,flutter,handling,jerk,jiggle,management,manipulation,oversight,parade,plan,policy,presentation,pursuit,reaction,rejoinder,replies,reply,response,retort,shot,shudder,strategy,struggle,transaction,treatment,tremble,try,twitch",
    rows: [
      {
        toggle: "native_twitch_reply"
      },
      {
        text: "Attempt to display native Twitch™ replies on all channels."
      }
    ],
    settings: {
      native_twitch_reply: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/notifications/mention-audio.settings.js
  var mention_audio_settings_default = {
    title: "Notification Sounds",
    tr: "notification-sounds",
    glyph: "music",
    flags: ["small", "gold"],
    badges: {
      new: "4.1"
    },
    keywords: "accent,adoption,benefit,bulletin,buzz,character,climax,conditions,expression,feature,flawless,focal point,gossip,handling,harmony,help,highlight,hint,idiom,innuendo,intact,leader,melody,motto,murmur,music,need,noise,note,notice,notification,official,operation,phrases,phrasing,practice,proclamation,purpose,remark,robust,safe,sane,saying,service,sigh,slogan,solid,someone,sounds,stable,star,sturdy,terminology,thorough,tone,treatment,usage,uses,utterance,value,vibrant,vibration,vigorous,voice,warning,whispers,wording,wording",
    rows: [
      {
        text: "When one (or more) of the following conditions are met, play a notification sound."
      },
      {
        html: `<div>
                    <!-- EMPTY OFFSET -->
                </div>`
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "Notification Sounds"'
        },
        rows: [
          {
            option: {
              title: "Mentions",
              tr: "notification-sounds:include-mentions"
            },
            rows: [
              {
                toggle: "mention_audio"
              },
              {
                text: "When someone mentions you <code purple>@username</code>, play the <b>notification sound</b>."
              }
            ]
          },
          {
            option: {
              title: "Phrases",
              tr: "notification-sounds:include-phrases"
            },
            rows: [
              {
                toggle: "phrase_audio"
              },
              {
                text: "When someone uses a phrase from <b>Highlight Phrases</b>, play the <b>notification sound</b>."
              }
            ]
          },
          {
            option: {
              title: "Whispers",
              tr: "notification-sounds:include-whispers"
            },
            rows: [
              {
                toggle: "whisper_audio"
              },
              {
                text: "When someone sends you a whisper, play the <b>notification sound</b>."
              }
            ]
          },
          {
            html: "<hr>"
          },
          {
            option: {
              title: "Notification Sound",
              tr: "notification-sounds:options"
            },
            rows: [
              {
                select: "whisper_audio_sound"
              },
              {
                html: "<button id='whisper_audio_sound-test'>Test notification sound</button>"
              }
            ]
          },
          {
            tr: false,
            text: ""
          },
          {
            html: `<div class='cc-container'>
                                <div class='cc-svg'><span black glyph='cc'></span></div>
                                <p class='cc-text' tr-id='cc-sound-notice'>
                                    <a id='sound-href' href='https://notificationsounds.com/notification-sounds/goes-without-saying-608' rel='nofollow'>This sound</a> is licensed under the Creative Commons Attribution license.
                                    <a id='sound-license' href='https://creativecommons.org/licenses/by/4.0/legalcode' rel='nofollow'>Find out more</a>.
                                </p>
                            </div>`
          },
          {
            tr: false,
            text: ""
          }
        ]
      }
    ],
    settings: {
      mention_audio: {
        type: "checkbox",
        default: false
      },
      phrase_audio: {
        type: "checkbox",
        default: false
      },
      whisper_audio: {
        type: "checkbox",
        default: false
      },
      whisper_audio_sound: {
        type: "select",
        options: [
          {
            value: "beyond-doubt-2-581",
            label: "Beyond doubt 2"
          },
          {
            value: "consequence-544",
            label: "Consequence"
          },
          {
            value: "definite-555",
            label: "Definite"
          },
          {
            default: true,
            value: "goes-without-saying-608",
            label: "Goes without saying"
          },
          {
            value: "point-blank-589",
            label: "Point blank"
          },
          {
            value: "slow-spring-board-570",
            label: "Slow spring board"
          },
          {
            value: "to-the-point-568",
            label: "To the point"
          }
        ]
      }
    }
  };

  // src/plugins/chat/prevent-spam.settings.js
  var prevent_spam_settings_default = {
    title: "Prevent Spam",
    tr: "prevent-spam",
    glyph: "mod",
    flags: ["small", "gold"],
    keywords: "accident,breadth,chatter,circumstance,conversation,diameter,dimension,directive,duration,episode,existence,gossip,height,impression,imprint,incidence,incident,information,instance,length,letter,limit,line,magnitude,manifestation,mark,maximum,memorandum,messages,mileage,minimal,minimum,news,note,notice,occurrences,period,piece,point,portion,quantity,radius,range,record,report,scar,score,section,segment,signature,situation,space,spam,span,spot,stain,stamp,streak,stretch,symbol,talk,term,width,words,writing,writing",
    rows: [
      {
        toggle: "prevent_spam"
      },
      {
        text: "When repetitive messages are detected in chat, hide them."
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "Prevent Spam"'
        },
        rows: [
          {
            option: {
              title: "Message History",
              tr: "prevent-spam:options"
            },
            rows: [
              {
                text: "<b>Prevent Spam</b> will look back {{prevent_spam_look_back}} lines to detect <b attention-text top-tooltip='This will look for messages that match word-for-word'>plagiarism</b>."
              }
            ]
          },
          {
            option: {
              title: "Minimum Word Length",
              tr: ""
            },
            rows: [
              {
                text: "<b>Prevent Spam</b> will ignore messages if there are not any words longer than {{prevent_spam_minimum_length}} characters."
              }
            ]
          },
          {
            option: {
              title: "Maximum Occurrences",
              tr: ""
            },
            rows: [
              {
                text: "<b>Prevent Spam</b> will mark any message as <b>repetitious</b> after any word appears {{prevent_spam_ignore_under}} or more times."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      prevent_spam: {
        type: "checkbox",
        default: true
      },
      prevent_spam_look_back: {
        type: "number",
        default: 15,
        min: 1,
        max: 250,
        step: 1,
        unit: "¶"
      },
      prevent_spam_minimum_length: {
        type: "number",
        default: 5,
        min: 3,
        max: 500,
        step: 1,
        unit: "🔣"
      },
      prevent_spam_ignore_under: {
        type: "number",
        default: 5,
        min: 1,
        max: 150,
        step: 1,
        unit: "≥"
      }
    }
  };

  // src/plugins/chat/recover-chat.settings.js
  var recover_chat_settings_default = {
    title: "Recover Chat",
    tr: "recover-chat",
    glyph: "thread",
    keywords: "attack,attempt,bid,chatter,conversation,current,endeavor,experiment,flood,flow,gossip,pursuit,resurrect,rush,shot,spate,stream,struggle,surge,tide,torrent,tributary,try",
    rows: [
      {
        toggle: "recover_chat"
      },
      {
        text: "When the chat object is not loaded (or suddenly destroyed), attempt to recover it."
      }
    ],
    settings: {
      recover_chat: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/chat/recover-messages.settings.js
  var recover_messages_settings_default = {
    title: "Recover Messages",
    tr: "recover-messages",
    glyph: "thread",
    flags: ["gold"],
    badges: {
      new: "5.28"
    },
    keywords: "attack,attempt,bid,chatter,conversation,current,endeavor,experiment,flood,flow,gossip,pursuit,resurrect,rush,shot,spate,stream,struggle,surge,tide,torrent,tributary,try",
    rows: [
      {
        toggle: "recover_messages"
      },
      {
        text: "When a message is deleted, attempt to recover it."
      }
    ],
    settings: {
      recover_messages: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/chat/highlight-mentions-popup.settings.js
  var highlight_mentions_popup_settings_default = {
    title: "Show Pop-ups",
    tr: "highlight-mentions-popup",
    glyph: "thread",
    flags: ["gold"],
    keywords: "arrive,attitude,belief,blooper,character,come,come out,crop up,determination,develop,directive,emerge,information,leader,letter,looper,materialize,memorandum,message,news,note,notice,occur,official,pop ups,present,report,sentiment,show,show up,someone,stance,stand,star,surface,turn out,turn up,view,word",
    rows: [
      {
        toggle: "highlight_mentions_popup"
      },
      {
        text: "When someone mentions you <code purple>@username</code>, make the message stand out by showing a pop-up."
      }
    ],
    settings: {
      highlight_mentions_popup: {
        type: "checkbox",
        default: true
      }
    }
  };

  // src/plugins/chat/convert-bits.settings.js
  var convert_bits_settings_default = {
    title: "Convert Bits",
    tr: "convert-bits",
    glyph: "bits",
    flags: ["small"],
    keywords: "amount,bits,bulk,chunk,detritus,dollar,extent,junk,load,lot,measure,money,number,remains,rubbish,rubble,supply,ton,trash,usd,volume,wreck,wreckage",
    rows: [
      {
        toggle: "convert_bits"
      },
      {
        text: "When presented with <a href='https://www.twitch.tv/creatorcamp/en/get-rewarded/bits-and-subscriptions/#bits' top-tooltip='Bits'><button style='background-color:var(--grey)!important'><img src='bits.gif' alt='Bits' height='20' width='20' type='glyph'></button></a> show the true <b>USD</b> amount they represent."
      }
    ],
    settings: {
      convert_bits: {
        type: "checkbox",
        default: true
      }
    }
  };

  // src/plugins/currencies/points-receipt.channel-points-receipt.settings.js
  var points_receipt_channel_points_receipt_settings_default = {
    title: "Channel Points Receipt",
    tr: "channel-points-receipt",
    glyph: "channelpoints",
    flags: ["small"],
    keywords: "act,array,assemblage,assortment,avenue,carrier,certificate,channel,collection,compilation,demonstration,display,example,exhibit,lot,means,medium,number,parade,points,presentation,receipt,route,selection,set,store,tunnel,voucher",
    rows: [
      {
        text: "How should the receipt display <a href='https://help.twitch.tv/s/article/channel-points-guide' top-tooltip='Channel Points'><button style='background-color:var(--grey)!important'><span small purple glyph='channelpoints'></span></button></a> collection?"
      },
      {
        select: "channelpoints_receipt_display"
      }
    ],
    settings: {
      channelpoints_receipt_display: {
        type: "select",
        options: [
          {
            default: true,
            value: "null",
            label: "Display the exact amount collected",
            attrs: {
              "tr-id": "channel-points-receipt:options"
            }
          },
          {
            value: "round100",
            label: "Round to the nearest 100",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "round50",
            label: "Round to the nearest 50",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "round25",
            label: "Round to the nearest 25",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      }
    }
  };

  // src/plugins/chat/rewards-calculator.settings.js
  var rewards_calculator_settings_default = {
    title: "Rewards Calculator",
    tr: "rewards-calculator",
    glyph: "channelpoints",
    flags: ["small"],
    keywords: "accolade,appraisal,assessment,award,benefit,bonus,bounty,calculator,compensation,conclusion,current,dividend,estimates,estimation,evaluation,flood,flow,guess,honor,measurement,needs,opinion,premium,profit,projection,punishment,rating,remuneration,rewards,rush,spate,stream,surge,survey,tide,torrent,tributary,valuation",
    rows: [
      {
        toggle: "rewards_calculator"
      },
      {
        text: "Estimates how long a stream needs to be watched to redeem <a href='https://help.twitch.tv/s/article/channel-points-guide' top-tooltip='Channel Points'><button style='background-color:var(--grey)!important'><span small purple glyph='channelpoints'></span></button></a> rewards."
      }
    ],
    settings: {
      rewards_calculator: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/settings/sections/accent-color.js
  var accent_color_default = {
    title: "Accent Color",
    tr: "accent-color",
    glyph: "latest",
    flags: ["small"],
    badges: {
      new: "4.2.0"
    },
    keywords: "accent,color,glow,hue,intensity,paint",
    rows: [
      {
        text: "What should the TTV Tools' accent color be?"
      },
      {
        select: "accent_color"
      }
    ],
    settings: {
      accent_color: {
        type: "select",
        options: [
          {
            value: "colored/contrast",
            label: "Auto",
            attrs: {
              "tr-id": "color:auto"
            }
          },
          {
            value: "blue/12",
            label: "Blue",
            attrs: {
              "tr-id": "color:blue"
            }
          },
          {
            default: true,
            value: "twitch-purple/12",
            label: "Purple",
            attrs: {
              "tr-id": "color:purple"
            }
          },
          {
            value: "red/15",
            label: "Red",
            attrs: {
              "tr-id": "color:red"
            }
          }
        ]
      }
    }
  };

  // src/plugins/customization/block-banners.settings.js
  var block_banners_settings_default = {
    title: "Block Banners",
    tr: "block-banners",
    glyph: "hide",
    flags: ["small"],
    badges: {
      new: "5.33.4.8"
    },
    keywords: "ads,advertisement,banners,block,hide,remove",
    rows: [
      {
        toggle: "block_banners"
      },
      {
        text: "Remove (ad) banners for: <em>Bits</em>, <em>SUBtember</em>, <em>Turbo</em>, etc."
      }
    ],
    settings: {
      block_banners: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/settings/sections/context-menu-override.js
  var context_menu_override_default = {
    title: "Context Menu Override",
    tr: "context-menu-override",
    glyph: "latest",
    flags: ["small"],
    badges: {
      new: "5.34"
    },
    keywords: "click,context,custom,menu,right,over,popup,ride",
    rows: [
      {
        toggle: "context_menu_override"
      },
      {
        text: "Use a custom context menu (right-click) on select Twitch pages."
      }
    ],
    settings: {
      context_menu_override: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/automation/lurking.easy-lurk.settings.js
  var lurking_easy_lurk_settings_default = {
    title: "Easy Lurk",
    tr: "placement:away-mode",
    glyph: "latest",
    flags: ["small"],
    keywords: "button,knob",
    rows: [
      {
        text: "Where should the <b>Easy Lurk</b> button be displayed?"
      },
      {
        select: "away_mode_placement"
      }
    ],
    settings: {
      away_mode_placement: {
        type: "select",
        options: [
          {
            default: true,
            value: "null",
            label: "Do not display",
            attrs: {
              "tr-id": "placement:away-mode:options"
            }
          },
          {
            value: "over",
            label: "Over the video",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "under",
            label: "Under the video",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      }
    }
  };

  // src/plugins/player/hide-blank-ads.settings.js
  var hide_blank_ads_settings_default = {
    title: "Hide Blank Ads",
    tr: "hide-blank-ads",
    glyph: "hide",
    flags: ["small", "gold"],
    badges: {
      new: "4.15"
    },
    keywords: "act,ad,ads,array,blink,demonstration,displays,example,exhibit,flutter,jerk,jiggle,parade,presentation,shudder,tremble,twitch",
    rows: [
      {
        toggle: "hide_blank_ads"
      },
      {
        text: "When Twitch™ displays a <b attention-text top-tooltip='Purple Screen'>Blank Ad</b>, temporarily hide it."
      }
    ],
    settings: {
      hide_blank_ads: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/currencies/points-receipt.settings.js
  var points_receipt_settings_default = {
    title: "Points Receipt &amp; Rank",
    tr: "placement:points-receipt",
    glyph: "channelpoints",
    flags: ["small", "gold"],
    keywords: "certificate,content,document,idea,musty,noxious,paragraph,passage,points,putrid,quotation,ranking,receipt,text,theme,verse,voucher,wording",
    rows: [
      {
        text: "Where should the <b>Points Receipt &amp; Point Rank</b> text be displayed?"
      },
      {
        select: "points_receipt_placement"
      }
    ],
    settings: {
      points_receipt_placement: {
        type: "select",
        options: [
          {
            default: true,
            value: "null",
            label: "Do not display",
            attrs: {
              "tr-id": "placement:points-receipt:options"
            }
          },
          {
            value: "under",
            label: "Under the video",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      }
    }
  };

  // src/plugins/customization/point-watcher.settings.js
  var point_watcher_settings_default = {
    title: "Point Watcher",
    tr: "placement:point-watcher",
    glyph: "channelpoints",
    flags: ["small", "gold"],
    keywords: "content,document,idea,paragraph,passage,quotation,text,theme,verse,watcher,wording",
    rows: [
      {
        text: "Where should the <b>Point Watcher</b> text be displayed?"
      },
      {
        select: "point_watcher_placement"
      }
    ],
    settings: {
      point_watcher_placement: {
        type: "select",
        options: [
          {
            default: true,
            value: "null",
            label: "Do not display",
            attrs: {
              "tr-id": "placement:point-watcher:options"
            }
          },
          {
            value: "on",
            label: "On the tooltip",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      }
    }
  };

  // src/plugins/customization/stream-preview.settings.js
  var stream_preview_settings_default = {
    title: "Stream Preview",
    tr: "stream-preview",
    glyph: "video",
    flags: ["small", "gold"],
    badges: {
      new: "5.15"
    },
    keywords: "act,advertisement,amount,announcement,array,breadth,broadcasts,capacity,channels,charge,content,current,demonstration,diameter,display,examination,example,exhibit,extent,extras,flawless,flood,flow,handling,height,intact,intensity,length,magnitude,management,manipulation,newscast,oversight,parade,performance,plan,policy,pop-ups,pop ups,presentation,preview,program,proportion,publication,range,robust,rush,safe,sane,scope,show,simulcast,size,solid,sound,spate,stable,stature,strategy,stream,sturdy,surge,thorough,tide,torrent,transaction,transmission,treatment,tributary,vibrant,viewing,vigorous,volume,width",
    rows: [
      {
        toggle: "stream_preview"
      },
      {
        text: "When hovering over a streamer's icon, display a preview of their broadcast."
      },
      {
        extras: {
          title: "Extras",
          tr: "extras",
          subtitle: 'Adjust settings for "Stream Preview"'
        },
        rows: [
          {
            option: {
              title: "Preview Position",
              tr: "stream-preview:position"
            },
            rows: [
              {
                text: "Adjust the <b attention-text top-tooltip='In front of, or behind'>orthogonal</b> position of the preview."
              },
              {
                select: "stream_preview_position"
              }
            ]
          },
          {
            option: {
              title: "Preview Size",
              tr: "stream-preview:size"
            },
            rows: [
              {
                text: "How large sould the preview be?"
              },
              {
                select: "stream_preview_scale"
              }
            ]
          },
          {
            option: {
              title: "Preview Sound",
              tr: "stream-preview:sound"
            },
            rows: [
              {
                text: "Should the preview be audible?"
              },
              {
                text: "This will temporarily mute the current stream.",
                attrs: {
                  "warning-text": ""
                }
              },
              {
                toggle: "stream_preview_sound"
              }
            ]
          }
        ]
      }
    ],
    settings: {
      stream_preview: {
        type: "checkbox",
        default: false
      },
      stream_preview_position: {
        type: "select",
        options: [
          {
            default: true,
            value: "3",
            label: "Always in front (on top)",
            attrs: {
              "tr-id": "stream-preview:position-options"
            }
          },
          {
            value: "2",
            label: "Normal",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "1",
            label: "Always behind (on bottom)",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      },
      stream_preview_scale: {
        type: "select",
        options: [
          {
            default: true,
            value: "1",
            label: "Normal (×1)",
            attrs: {
              "tr-id": "stream-preview:size-options"
            }
          },
          {
            value: "2",
            label: "Large (×2)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "3",
            label: "Extra-Large (×3)",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      },
      stream_preview_sound: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/customization/watch-time.settings.js
  var watch_time_settings_default = {
    title: "Watch Time",
    tr: "placement:watch-time",
    glyph: "latest",
    flags: ["small"],
    keywords: "timepiece,watch,wristwatch",
    rows: [
      {
        text: "Where should the <b>Watch Time</b> be displayed?"
      },
      {
        select: "watch_time_placement"
      }
    ],
    settings: {
      watch_time_placement: {
        type: "select",
        options: [
          {
            default: true,
            value: "null",
            label: "Do not display",
            attrs: {
              "tr-id": "placement:watch-time:options"
            }
          },
          {
            value: "over",
            label: "Over the video",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "under",
            label: "Under the video",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      }
    }
  };

  // src/settings/sections/export-settings.js
  var export_settings_default = {
    title: "Export Settings",
    tr: "networking:sync-settings",
    glyph: "export",
    flags: ["small"],
    badges: {
      new: "5.32"
    },
    keywords: "cloud,download,dump,export,id,load,log in,network,settings,ship,smuggle,transport,upload",
    summaryAttrs: {
      style: "width:fit-content"
    },
    rows: [
      {
        text: "If you would like to <b attention-text top-tooltip='Save settings from somewhere else to this device'>download settings</b>, enter the <b attention-text top-tooltip='6 or more letters, numbers and/or dashes'>Upload ID</b>."
      },
      {
        tr: false,
        text: "{{sync-token}}"
      },
      {
        html: "<div id='sync-status' class='subtitle' style='margin-left:0.5rem; transition: all .5s;;'>&nbsp;</div>"
      },
      {
        tr: false,
        text: ""
      },
      {
        html: `<button id='sync-settings--upload' style='margin-right:0.5rem' top-tooltip='Save settings from this device to another device'>
                    <span small glyph='upload'></span>
                    <span tr-id='networking:sync-settings:upload'>Upload</span>
                </button>`
      },
      {
        html: `<button id='sync-settings--download' top-tooltip='Save settings from somewhere else to this device'>
                    <span small glyph='download'></span>
                    <span tr-id='networking:sync-settings:download'>Download</span>
                </button>`
      },
      {
        html: `<button id='sync-settings--share' class='edit'>
                    <span small glyph='bolt'></span>
                    <span tr-id='networking:sync-settings:copy'>Copy</span>
                </button>`
      },
      {
        html: "<hr>"
      },
      {
        html: "<input id='sync-settings--upload-json-input' type='file' accept='.json, application/json' style='display:none!important'>"
      },
      {
        html: `<label id='sync-settings--upload-json-label' for='sync-settings--upload-json-input' type='button' style='margin-right:0.5rem' top-tooltip='Restore settings from a file (JSON)'>
                    <span small glyph='rewind'></span>
                    <span tr-id='networking:sync-settings:upload-json'>Restore file</span>
                    <span small gold glyph='verified'></span>
                </label>`
      },
      {
        html: `<button id='sync-settings--download-json' top-tooltip='Save settings to a file (JSON)'>
                    <span small glyph='download'></span>
                    <span tr-id='networking:sync-settings:download-json'>Export file</span>
                    <span small gold glyph='verified'></span>
                </button>`
      }
    ],
    settings: {
      "sync-token": {
        type: "text",
        default: "TTV-TOOL",
        placeholder: "ABC123",
        attrs: {
          style: "width:-webkit-fill-available; width:-moz-available; font-family: monospace; letter-spacing:1em; text-align:center; --text-transform:uppercase; text-overflow:clip",
          pattern: "[\\w\\-]{6,}"
        }
      },
      "sync-settings--upload-json-input": {
        type: "custom",
        store: false
      }
    }
  };

  // src/plugins/customization/store-integration.settings.js
  var store_integration_settings_default = {
    title: "Store Integration",
    tr: "store-integration",
    glyph: "gift",
    flags: ["small", "gold"],
    badges: {
      new: "5.29"
    },
    keywords: "acquisition,advance,asset,assimilation,association,boy,buy,channel,contact,cube,current,dsi,element,epic,examination,exploration,flood,flow,game,hookup,hunt,inquiry,inspection,integration,investigation,investment,link,network,nintendo,play,playstation,purchase,pursuit,quest,relationship,research,rush,search,spate,station,stock,store,steam,stream,surge,switch,tide,tie,torrent,tributary,wii,xbox",
    rows: [
      {
        toggle: "store_integration"
      },
      {
        text: "When a stream is loaded and a game is detected, search for the game and create a purchase link."
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "Store Integration"'
        },
        rows: [
          {
            option: {
              title: "Steam®",
              tr: "store-integration:steam"
            },
            rows: [
              {
                text: "Enable Steam® store integration."
              },
              {
                toggle: "store_integration__steam"
              }
            ]
          },
          {
            option: {
              title: "PlayStation®",
              tr: "store-integration:playstation"
            },
            rows: [
              {
                text: "Enable PlayStation® store integration."
              },
              {
                toggle: "store_integration__playstation"
              }
            ]
          },
          {
            option: {
              title: "Xbox®",
              tr: "store-integration:xbox"
            },
            rows: [
              {
                text: "Enable Xbox® store integration."
              },
              {
                toggle: "store_integration__xbox"
              }
            ]
          },
          {
            option: {
              title: "Nintendo®",
              tr: "store-integration:nintendo"
            },
            rows: [
              {
                text: "Enable Nintendo® store integration."
              },
              {
                toggle: "store_integration__nintendo"
              }
            ]
          },
          {
            option: {
              title: "Epic Games®",
              tr: "store-integration:epic"
            },
            rows: [
              {
                text: "Enable Epic Games® store integration."
              },
              {
                toggle: "store_integration__epic"
              }
            ]
          }
        ]
      }
    ],
    settings: {
      store_integration: {
        type: "checkbox",
        default: true
      },
      store_integration__steam: {
        type: "checkbox",
        default: true
      },
      store_integration__playstation: {
        type: "checkbox",
        default: true
      },
      store_integration__xbox: {
        type: "checkbox",
        default: true
      },
      store_integration__nintendo: {
        type: "checkbox",
        default: true
      },
      store_integration__epic: {
        type: "checkbox",
        default: true
      }
    }
  };

  // src/plugins/networking/auto-dvr.settings.js
  var auto_dvr_settings_default = {
    title: "Video Clips",
    tr: "networking:video-clips",
    glyph: "download",
    flags: ["small"],
    badges: {
      new: "5.32.4",
      beta: "5.28"
    },
    keywords: "allocation,alt,avenue,bar,beginning,block,book,break,breathing space,carrier,case,channels,charge,chunk,citation,clips,collectibles,conclusion,crown,cup,current,data,dawn,decoration,default,delinquency,directory,dossier,dvr,excerpt,file,flood,flow,folder,fraction,fragment,gold,halt,handling,hesitation,hiatus,hitch,information,interlude,intermission,interruption,interval,keepsake,kickoff,lapse,layoff,letup,list,lot,lull,management,manipulation,means,medal,medium,memento,mow,nonpayment,notebook,opening,outset,oversight,part,pause,piece,plan,policy,portions,prize,prune,quantity,queue,recess,record,recording,respite,route,rush,section,segment,serving,shave,shear,snip,souvenir,spate,start,stoppage,strategy,streams,surge,suspension,televised,tide,torrent,transaction,treatment,tributary,trim,trophies,trophy,tunnel,video",
    rows: [
      {
        text: "Allows recording portions of streams. Use <code id='key:alt-z'>Alt + Z</code> to start/stop recording."
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust settings for "Video Clips"'
        },
        rows: [
          {
            option: {
              title: "File Type",
              tr: "video-clips:file-type"
            },
            rows: [
              {
                text: "What file type should <b>Video Clips</b> be?"
              },
              {
                select: "video_clips__file_type"
              }
            ]
          },
          {
            option: {
              title: "Quality",
              tr: "video-clips:quality"
            },
            rows: [
              {
                text: "What quality should <b>Video Clips</b> be?"
              },
              {
                select: "video_clips__quality"
              }
            ]
          },
          {
            option: {
              title: "Default Length",
              tr: "video-clips:length"
            },
            rows: [
              {
                text: "<b>Video Clips</b> should be {{video_clips__length}} by default."
              }
            ]
          },
          {
            option: {
              title: "DVR",
              tr: "video-clips:dvr"
            },
            rows: [
              {
                toggle: "video_clips__dvr"
              },
              {
                text: "Automatically record (and save) certain streams. Channels marked as <b>DVR</b> will skip and pause the <b>First in Line</b> queue."
              }
            ]
          },
          {
            option: {
              title: "Trophies",
              tr: "video-clips:trophy"
            },
            attrs: {
              "group-start": ""
            },
            rows: [
              {
                toggle: "video_clips__trophy"
              },
              {
                text: "Automatically record (and save) channel point redemption clips. Clips will be {{video_clips__trophy_length}} long."
              }
            ]
          },
          {
            option: {
              title: "Record Other Redemptions",
              tr: "video-clips:foreign-trophy"
            },
            attrs: {
              "group-end": ""
            },
            rows: [
              {
                toggle: "record_foreign_rewards"
              },
              {
                text: 'When another user redeems a channel point item you have saved to your "Buy Later" list, record their redemption.'
              }
            ]
          }
        ]
      }
    ],
    settings: {
      video_clips__file_type: {
        type: "select",
        options: [
          {
            default: true,
            value: "x-matroska",
            label: "Easiest to share (MKV)",
            attrs: {
              "tr-id": "video-clips:file-type-options"
            }
          },
          {
            value: "webm;codecs=h264",
            label: "Most compatible (MP4)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "webm;codecs=vp8,vp9",
            label: "Most supported (AVI)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "webm;codecs=opus",
            label: "Easiest to edit (OGV)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "webm;codecs=3gpp",
            label: "Most mobile-friendly (3GP)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "webm",
            label: "Most efficient (WebM)",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "mpeg",
            label: "Most dynamic (MPEG)",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      },
      video_clips__quality: {
        type: "select",
        options: [
          {
            default: true,
            value: "auto",
            label: "Auto",
            attrs: {
              "tr-id": "video-clips:quality-options"
            }
          },
          {
            value: "source",
            label: "Source",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "1080p",
            label: "1080p",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "720p",
            label: "720p",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "480p",
            label: "480p",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "360p",
            label: "360p",
            attrs: {
              "tr-id": ""
            }
          },
          {
            value: "160p",
            label: "160p",
            attrs: {
              "tr-id": ""
            }
          }
        ]
      },
      video_clips__length: {
        type: "number",
        default: 60,
        min: 15,
        max: 300,
        step: 15,
        wrap: {
          "fix-unit": "sec"
        }
      },
      video_clips__dvr: {
        type: "checkbox",
        default: false
      },
      video_clips__trophy: {
        type: "checkbox",
        default: false
      },
      video_clips__trophy_length: {
        type: "number",
        default: 60,
        min: 15,
        max: 1800,
        step: 15,
        wrap: {
          "fix-unit": "sec"
        }
      },
      record_foreign_rewards: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/settings/sections/keep-pop-outs.js
  var keep_pop_outs_default = {
    title: "Keep Pop-outs",
    tr: "keep-popout",
    glyph: "video",
    flags: ["small", "gold"],
    keywords: "another,current,delay,development,expansion,extension,flood,flow,increase,other,page,postponement,rush,spate,stream,surge,televised,that,tide,torrent,tributary,video",
    rows: [
      {
        toggle: "keep_popout"
      },
      {
        text: "When moving to another page, prevent the extension from destroying the small videos (pop-outs) of any streams."
      }
    ],
    settings: {
      keep_popout: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/settings/sections/ram-alarms.js
  var ram_alarms_default = {
    title: "RAM Alarms",
    tr: "ram-alarms",
    glyph: "flag",
    flags: ["small", "gold"],
    badges: {
      new: "5.35.1"
    },
    rows: [
      {
        text: "When a tab reaches a certain RAM level, what should the extension do?"
      },
      {
        extras: {
          title: "Alarms",
          tr: "alarms",
          subtitle: 'Adjust settings for "RAM Alarms"'
        },
        rows: [
          {
            html: `<div opt>
                            <div tr-id='ram-alarms:low'>When above <span unit='MB'><input disabled id='ram_low' type='number' value='500'></span> — LOW</div>
                            <select id='ram_onlow'>
                                <option value='ignore' tr-id set='textContent→\\Glyphs.utf8.ignore \\this.textContent'>Ignore</option>
                                <option value='notify' tr-id set='textContent→\\Glyphs.utf8.notify \\this.textContent'>Notify</option>
                                <option value='respawn' tr-id set='textContent→\\Glyphs.utf8.refresh \\this.textContent'>Respawn</option>
                            </select>
                        </div>`
          },
          {
            html: `<div opt>
                            <div tr-id='ram-alarms:medium'>When above <span unit='GB'><input disabled id='ram_medium' type='number' value='1'></span> — MEDIUM</div>
                            <select id='ram_onmedium'>
                                <option value='ignore' tr-id set='textContent→\\Glyphs.utf8.ignore \\this.textContent'>Ignore</option>
                                <option value='notify' tr-id set='textContent→\\Glyphs.utf8.notify \\this.textContent'>Notify</option>
                                <option value='respawn' tr-id set='textContent→\\Glyphs.utf8.refresh \\this.textContent'>Respawn</option>
                            </select>
                        </div>`
          },
          {
            html: `<div opt>
                            <div tr-id='ram-alarms:high'>When above <span unit='GB'><input disabled id='ram_high' type='number' value='2'></span> — HIGH</div>
                            <select id='ram_onhigh'>
                                <option value='ignore' tr-id set='textContent→\\Glyphs.utf8.ignore \\this.textContent'>Ignore</option>
                                <option value='notify' tr-id set='textContent→\\Glyphs.utf8.notify \\this.textContent'>Notify</option>
                                <option value='respawn' tr-id set='textContent→\\Glyphs.utf8.refresh \\this.textContent'>Respawn</option>
                            </select>
                        </div>`
          },
          {
            html: `<div opt>
                            <div tr-id='ram-alarms:high'>Scale RAM usage with tab age</div>
                            <div class='toggle'>
                                <input id='ram_timescale' type='checkbox'>
                                <label for='ram_timescale'></label>
                            </div>
                        </div>`
          }
        ]
      }
    ],
    settings: {
      ram_onlow: {
        type: "custom"
      },
      ram_onmedium: {
        type: "custom"
      },
      ram_onhigh: {
        type: "custom"
      },
      ram_timescale: {
        type: "custom"
      },
      ram_low: {
        type: "custom",
        store: false
      },
      ram_medium: {
        type: "custom",
        store: false
      },
      ram_high: {
        type: "custom",
        store: false
      }
    }
  };

  // src/plugins/video-recovery/recover-stream.recover-ads.settings.js
  var recover_stream_recover_ads_settings_default = {
    title: "Recover Ads",
    tr: "recover-ads",
    glyph: "play",
    flags: ["small"],
    keywords: "ads,advertisement,announcement,attack,attempt,bid,broadcast,commercial,display,endeavor,endorsement,exhibit,experiment,literature,notice,placard,poster,propaganda,publication,publicity,pursuit,shot,struggle,try",
    rows: [
      {
        toggle: "recover_ads"
      },
      {
        text: "When an advertisement <b attention-text top-tooltip='Fails to play for more than 5 seconds'>freezes</b>, attempt to recover it."
      }
    ],
    settings: {
      recover_ads: {
        type: "checkbox",
        default: false,
        attrs: {
          requires: "#recover_stream"
        }
      }
    }
  };

  // src/plugins/video-recovery/recover-frames.settings.js
  var recover_frames_settings_default = {
    title: "Recover Frames",
    tr: "recover-frames",
    glyph: "video",
    flags: ["small"],
    badges: {
      new: "4.12.4"
    },
    keywords: "abnormal,abrogate,annul,attack,attempt,bid,current,damaged,deficient,drops,endeavor,experiment,faulty,flawed,flood,flow,frames,inadequate,insufficient,nullify,override,pursuit,quash,refill,refresh,reload,restock,restore,reverse,revoke,rush,seconds,shot,spate,stream,struggle,surge,televised,tide,torrent,tributary,try,unhealthy,unsound,veto,video,video,webpage",
    rows: [
      {
        toggle: "recover_frames"
      },
      {
        text: "When the video <b attention-text top-tooltip='Fails to play for longer than 15 seconds'>freezes</b>, reload the webpage."
      },
      {
        extras: {
          title: "Extras",
          tr: "extras",
          subtitle: 'Adjust settings for "Recover Frames"'
        },
        rows: [
          {
            option: {
              title: "Try Embed",
              tr: "recover-frames:extras"
            },
            rows: [
              {
                toggle: "recover_frames__allow_embed"
              },
              {
                text: "Attempt to override the video with an embedded stream."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      recover_frames: {
        type: "checkbox",
        default: true
      },
      recover_frames__allow_embed: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/video-recovery/recover-pages.settings.js
  var recover_pages_settings_default = {
    title: "Recover Pages",
    tr: "recover-pages",
    glyph: "extensions",
    flags: ["small"],
    keywords: "act,archive,array,attack,attempt,bid,certificate,demonstration,diary,display,endeavor,evidence,example,exhibit,experiment,form,pages,paper,parade,presentation,pursuit,record,report,script,shot,struggle,testimony,try,webpage",
    rows: [
      {
        toggle: "recover_pages"
      },
      {
        text: "If the webpage fails to display, attempt to recover it."
      }
    ],
    settings: {
      recover_pages: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/video-recovery/recover-stream.settings.js
  var recover_stream_settings_default = {
    title: "Recover Stream",
    tr: "recover-stream",
    glyph: "video",
    flags: ["small"],
    keywords: "attack,attempt,bid,current,endeavor,experiment,flood,flow,pursuit,rush,shot,spate,stream,struggle,surge,tide,torrent,tributary,try",
    rows: [
      {
        toggle: "recover_stream"
      },
      {
        text: "When the stream <b attention-text top-tooltip='Fails to play for more than 5 seconds'>freezes</b>, attempt to recover it."
      }
    ],
    settings: {
      recover_stream: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/video-recovery/recover-video.settings.js
  var recover_video_settings_default = {
    title: "Recover Video",
    tr: "recover-video",
    glyph: "video",
    flags: ["small"],
    keywords: "cover,curtain,download,load,log in,net,refill,refresh,reload,restock,restore,screen,televised,video,webpage",
    rows: [
      {
        toggle: "recover_video"
      },
      {
        text: "When the video <b attention-text top-tooltip='Displays an error code or blank screen'>fails to download</b>, reload the webpage."
      }
    ],
    settings: {
      recover_video: {
        type: "checkbox",
        default: true
      }
    }
  };

  // src/settings/sections/display-console-messages.js
  var display_console_messages_default = {
    title: "Display Console Messages",
    tr: "@console",
    glyph: "stats",
    flags: ["small", "gold"],
    keywords: "act,array,assuage,console,delay,demonstration,development,display,example,exhibit,expansion,extension,increase,messages,parade,postponement,presentation,soothe,writing",
    rows: [
      {
        toggle: "display_in_console"
      },
      {
        text: "Allow the extension to display messages in the console."
      },
      {
        extras: {
          title: "Extras",
          tr: "extras",
          subtitle: 'Adjust settings for "Display Console Messages"'
        },
        rows: [
          {
            option: {
              title: "Allow logs",
              tr: "@console.log"
            },
            rows: [
              {
                toggle: "display_in_console__log"
              },
              {
                text: "Display <code style:log>console.log</code> messages."
              }
            ]
          },
          {
            option: {
              title: "Allow warnings",
              tr: "@console.warn"
            },
            rows: [
              {
                toggle: "display_in_console__warn"
              },
              {
                text: "Display <code style:warn>console.warn</code> messages."
              }
            ]
          },
          {
            option: {
              title: "Allow errors",
              tr: "@console.error"
            },
            rows: [
              {
                toggle: "display_in_console__error"
              },
              {
                text: "Display <code style:error>console.error</code> messages."
              }
            ]
          },
          {
            option: {
              title: "Allow remarks",
              tr: "@console.remark"
            },
            rows: [
              {
                toggle: "display_in_console__remark"
              },
              {
                text: "Display <code style:remark>console.remark</code> messages."
              }
            ]
          },
          {
            option: {
              title: "Allow notices",
              tr: "@console.notice"
            },
            rows: [
              {
                toggle: "display_in_console__notice"
              },
              {
                text: "Display <code style:notice>console.notice</code> messages."
              }
            ]
          },
          {
            option: {
              title: "Allow ignores",
              tr: "@console.ignore"
            },
            rows: [
              {
                toggle: "display_in_console__ignore"
              },
              {
                text: "Display <code style:ignore>console.ignore</code> messages."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      display_in_console: {
        type: "checkbox",
        default: false
      },
      display_in_console__log: {
        type: "checkbox",
        default: true
      },
      display_in_console__warn: {
        type: "checkbox",
        default: true
      },
      display_in_console__error: {
        type: "checkbox",
        default: true
      },
      display_in_console__remark: {
        type: "checkbox",
        default: true
      },
      display_in_console__notice: {
        type: "checkbox",
        default: true
      },
      display_in_console__ignore: {
        type: "checkbox",
        default: true
      }
    }
  };

  // src/settings/sections/display-statistics.js
  var display_statistics_default = {
    title: "Display Statistics",
    tr: "@stats",
    glyph: "stats",
    flags: ["small", "gold"],
    keywords: "act,array,data,delay,demonstration,development,display,example,exhibit,expansion,extension,increase,parade,postponement,presentation,statistics,stats",
    rows: [
      {
        toggle: "show_stats"
      },
      {
        text: "Allow the extension to display statistics from certain features, such as calculated data, images, errors, etc."
      }
    ],
    settings: {
      show_stats: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/developer/developer-features.experimental-features.settings.js
  var developer_features_experimental_features_settings_default = {
    title: "Experimental Features",
    tr: "@experimental",
    glyph: "stats",
    flags: ["small"],
    keywords: "accident,act,array,casualty,catastrophe,cause,cost,damage,data,debt,defeat,deficit,delay,demonstration,destruction,development,disaster,display,dossier,element,evidence,example,exhibit,expansion,explanation,extension,failure,fall,goods,increase,info,injury,input,knowledge,loss,markdown,matter,motivation,motive,origin,parade,picture,postponement,presentation,principle,purpose,root,source,statistics,testimony,trouble",
    rows: [
      {
        toggle: "experimental_mode"
      },
      {
        text: "Allow the extension to display, and use experimental features."
      },
      {
        text: "Some features may cause data loss.",
        attrs: {
          "warning-text": ""
        }
      }
    ],
    settings: {
      experimental_mode: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/developer/developer-features.settings.js
  var developer_features_settings_default = {
    title: "Extra Keyboard Shortcuts",
    tr: "@keyboard-shortcuts",
    glyph: "stats",
    flags: ["small"],
    badges: {
      new: "4.12.13"
    },
    keywords: "console,delay,development,expansion,extension,increase,keyboard,manual,piano,postponement,shortcuts",
    rows: [
      {
        toggle: "extra_keyboard_shortcuts"
      },
      {
        text: "Allow the extension to add extra keyboard shortcuts."
      },
      {
        text: "Keyboard shortcuts can be viewed by invoking <code id='key:?'>?</code> on any stream."
      }
    ],
    settings: {
      extra_keyboard_shortcuts: {
        type: "checkbox",
        default: true
      }
    }
  };

  // src/settings/sections/low-data-usage.js
  var low_data_usage_default = {
    title: "Low Data Usage",
    tr: "@low-data-mode",
    glyph: "stats",
    flags: ["small"],
    badges: {
      new: "4.30"
    },
    keywords: "appraisal,assessment,conclusion,data,delay,development,dossier,estimate,estimation,evaluation,evidence,expansion,extension,freedom,goods,guess,hour,increase,info,input,knowledge,management,measurement,opinion,opportunity,picture,postponement,projection,rating,statistics,survey,testimony,usage,valuation",
    rows: [
      {
        toggle: "low_data_mode"
      },
      {
        text: "Forces the extension to use less overhead data per hour."
      },
      {
        text: "Current estimate {{est-data-usage}}"
      }
    ],
    settings: {
      low_data_mode: {
        type: "checkbox",
        default: false,
        attrs: {
          "when-off": "5",
          "when-on": "15"
        }
      },
      "est-data-usage": {
        type: "number",
        default: 0,
        store: false,
        attrs: {
          disabled: "",
          visible: "",
          controller: "#low_data_mode"
        },
        wrap: {}
      }
    }
  };

  // src/settings/sections/user-scripts.js
  var user_scripts_default = {
    title: "User Scripts",
    tr: "user-scripts",
    glyph: "extensions",
    flags: ["small"],
    badges: {
      beta: "6.0"
    },
    keywords: "dsl,script,scripts,ttv,automation,plugin,plugins,custom,bot,commands",
    rows: [
      {
        text: "Write your own chat automation in the TTV DSL: reply to commands, greet raiders, post on a timer. Each script appears below with its own switch and settings."
      },
      {
        text: "Scripts run in chat on channel pages and pop-out chat. A script that asks for permissions only runs once you approve them."
      },
      {
        html: "<div id='user-scripts-manager'></div>"
      }
    ],
    settings: {}
  };

  // src/settings/sections/use-fine-details.js
  var use_fine_details_default = {
    title: "Use Fine Details",
    tr: "@fine-details",
    glyph: "stats",
    flags: ["small"],
    keywords: "accomplished,action,admirable,attractive,background,beautiful,blink,contact,cool,data,delay,details,development,dossier,elegant,evidence,exceptional,expansion,expensive,experience,exquisite,extension,fashionable,fine,first-rate,flutter,goods,great,handsome,increase,info,input,involvement,jerk,jiggle,know-how,knowledge,lovely,magnificent,maturity,minutiae,neat,outstanding,participation,patience,picture,pleasant,postponement,practice,rare,reality,refined,sense,shudder,skill,smart,solid,splendid,statistics,striking,struggle,subtle,superior,testimony,training,tremble,twitch,understanding,well-made,wisdom",
    rows: [
      {
        toggle: "fine_details"
      },
      {
        text: "Allow the extension to make use of Twitch™ API data to enhance your experience."
      },
      {
        text: "This will not collect any data. It will use the data Twitch™ has already collected.",
        attrs: {
          "warning-text": ""
        }
      }
    ],
    settings: {
      fine_details: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/settings/sections/automatic-tab-reloads.js
  var automatic_tab_reloads_default = {
    title: "Automatic Tab Reloads",
    tr: "@auto-tab-reloads",
    glyph: "refresh",
    flags: ["small"],
    keywords: "cause,data,extension,loss,reload,reloads,tab,tabs",
    rows: [
      {
        toggle: "auto_tab_reloads"
      },
      {
        text: "Allow the extension to automatically reload tabs."
      },
      {
        text: "This may cause data loss.",
        attrs: {
          "warning-text": ""
        }
      }
    ],
    settings: {
      auto_tab_reloads: {
        type: "checkbox",
        default: true
      }
    }
  };

  // src/settings/sections/show-default-values.js
  var show_default_values_default = {
    title: "Show Default Values",
    tr: "@default",
    glyph: "info",
    flags: ["small"],
    badges: {
      "hide-on": "show-defaults"
    },
    keywords: "default,delinquency,nonpayment,values",
    rows: [
      {
        html: `<div>
                    <a href='?show-defaults=true' target='_self' continue-search>
                        <button tr-id>Show</button>
                    </a>
                </div>`
      },
      {
        text: "Show the default values."
      }
    ],
    settings: {}
  };

  // src/plugins/automation/auto-focus.settings.js
  var auto_focus_settings_default = {
    title: "Auto-Focus",
    tr: "@@auto-focus",
    glyph: "show",
    flags: ["small"],
    keywords: "action,activity,appearance,auto focus,bar,block,break,conclusion,copy,current,detection,disclosure,drawing,election,enterprise,exercise,figure,flood,flow,focal point,focus,form,hiatus,icon,illustration,image,infinitesimal,insignificant,intermission,interruption,interval,layoff,life,likeness,lull,microscopic,minimal,minuscule,minute,model,movement,pause,photograph,picture,plebiscite,polling,portrait,precise,referendum,rush,slate,spate,spell,spotlight,statue,stop,stream,surge,tally,target,ticket,tide,timer,tiny,torrent,tributary,tributary",
    rows: [
      {
        toggle: "auto_focus"
      },
      {
        text: "Automatically adjust <b>Up Next</b> and <b>Easy Lurk</b> based upon stream activity."
      },
      {
        text: "This will <b>not</b> stop the <b>Up Next / First in Line</b> one minute timer.",
        attrs: {
          "warning-text": ""
        }
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "Auto-Focus"'
        },
        rows: [
          {
            html: `<div>
                            <div class='title' tr-id='@@auto-focus:options:detection-level'>Detection Level</div>
                            <div class='summary'>
                                <p tr-id>
                                    How much activity should activate <b>Auto-Focus</b>?
                                </p>

                                <select id='auto_focus_detection_threshold'>
                                    <option value='0' selected tr-id>Automatic</option>
                                    <option value='30' tr-id>High activity — FPS / IRL / Rhythm</option>
                                    <option value='20' tr-id>Modest activity — Action / Adventure / Platformer</option>
                                    <option value='10' tr-id>Seasonal activity — Horror / Puzzle / Trivia</option>
                                    <option value='5' tr-id>Low activity — Just Chatting / Simulation / Strategy</option>
                                </select>
                            </div>
                        </div>`
          },
          {
            html: `<div>
                            <div class='title' tr-id='@@auto-focus:options:polling-interval'>Polling Interval</div>
                            <div class='summary'>
                                <p tr-id>
                                    How often should the stream be <b attention-text left-tooltip='A screenshot of the stream will be taken to detect activity'>polled</b>?
                                </p>

                                <select id='auto_focus_poll_interval'>
                                    <option value='1' tr-id>Every second — CPU intensive, great detection</option>
                                    <option value='3' selected tr-id>Every 3 seconds — CPU friendly, good detection</option>
                                    <option value='5' tr-id>Every 5 seconds — CPU friendly, fair detection</option>
                                    <option value='10' tr-id>Every 10 seconds — CPU friendly, poor detection</option>
                                </select>
                            </div>
                        </div>`
          },
          {
            html: `<div>
                            <div class='title' tr-id='@@auto-focus:options:image-type'>Image Type</div>
                            <div class='summary'>
                                <p tr-id>
                                    What image type should be used for <b attention-text left-tooltip='A screenshot of the stream will be taken to detect activity'>polling</b>?
                                </p>

                                <select id='auto_focus_poll_image_type'>
                                    <option value='webp' selected tr-id>Automatic</option>
                                    <option value='jpeg' tr-id>JPG — CPU friendly, good detection</option>
                                    <option value='png' tr-id>PNG — CPU intensive, great detection</option>
                                    <option value='webp' tr-id>WebP — CPU friendly, great detection</option>
                                </select>
                            </div>
                        </div>`
          }
        ]
      }
    ],
    settings: {
      auto_focus: {
        type: "checkbox",
        default: false
      },
      auto_focus_detection_threshold: {
        type: "custom"
      },
      auto_focus_poll_interval: {
        type: "custom"
      },
      auto_focus_poll_image_type: {
        type: "custom"
      }
    }
  };

  // src/plugins/chat/convert-emotes.settings.js
  var convert_emotes_settings_default = {
    title: "Convert emotes",
    tr: "@@convert-emotes",
    glyph: "emotes",
    flags: ["small", "gold"],
    keywords: "blink,contribution,current,decipher,emotes,flood,flow,flutter,jerk,jiggle,management,rush,shudder,spate,stream,subscription,surge,tide,torrent,tremble,tributary,twitch,undo,unlock,unravel,usage,viewing",
    rows: [
      {
        toggle: "convert_emotes"
      },
      {
        text: "When presented with Twitch™ emotes, collect them for usage (without requiring a subscription)."
      },
      {
        text: "This only works for the current stream you are viewing."
      },
      {
        text: "This does <b>not</b> save/unlock the emote.",
        attrs: {
          "warning-text": ""
        }
      }
    ],
    settings: {
      convert_emotes: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/plugins/chat/safe-soft-unban.settings.js
  var safe_soft_unban_settings_default = {
    title: "Soft Unban",
    tr: "@@soft-unban",
    glyph: "chat",
    flags: ["small", "gold"],
    badges: {
      new: "3.1"
    },
    keywords: "channels,charge,chatter,conversation,gossip,handling,management,manipulation,oversight,plan,policy,strategy,transaction,treatment,viewing",
    rows: [
      {
        toggle: "soft_unban"
      },
      {
        text: "Re-enable chat for channels you've been banned from."
      },
      {
        text: "This only re-enables viewing the chat.",
        attrs: {
          "warning-text": ""
        }
      },
      {
        extras: {
          title: "Options",
          tr: "options",
          subtitle: 'Adjust options for "Soft Unban"'
        },
        rows: [
          {
            option: {
              title: "Fade Messages",
              tr: "@@soft-unban:options:fade-messages"
            },
            rows: [
              {
                toggle: "soft_unban_fade_old_messages"
              },
              {
                text: "Messages will be visible for <b>30s</b>."
              }
            ]
          },
          {
            option: {
              title: "Keep Bots",
              tr: "@@soft-unban:options:keep-bots"
            },
            rows: [
              {
                toggle: "soft_unban_keep_bots"
              },
              {
                text: "Display bot messages."
              }
            ]
          },
          {
            option: {
              title: "Prevent Clips",
              tr: "@@soft-unban:options:prevent-clips"
            },
            rows: [
              {
                toggle: "soft_unban_prevent_clipping"
              },
              {
                text: "Hide Twitch™ clips."
              }
            ]
          }
        ]
      }
    ],
    settings: {
      soft_unban: {
        type: "checkbox",
        default: false
      },
      soft_unban_fade_old_messages: {
        type: "checkbox",
        default: false
      },
      soft_unban_keep_bots: {
        type: "checkbox",
        default: false
      },
      soft_unban_prevent_clipping: {
        type: "checkbox",
        default: false
      }
    }
  };

  // src/settings/sections/version.js
  var version_default = {
    title: "Version",
    tr: "version",
    glyph: "extensions",
    flags: ["small"],
    keywords: "adaptation,advice,clue,data,form,history,information,instruction,intelligence,interpretation,knowledge,material,message,rendition,report,science,story,tale,tip,translation,variant,version,word",
    rows: [
      {
        html: "<a type='button' set='subtitle=version.installed'><span small glyph='extensions'></span> Installed</a>"
      },
      {
        html: "<a type='button' set='subtitle=version.github;from-github=origin.github' href='https://github.com/ephellon/twitch-tools' github><span small glyph='github'></span> GitHub </a>"
      },
      {
        html: "<a type='button' set='subtitle=version.chrome;from-chrome=origin.chrome' href='https://chrome.google.com/webstore/detail/twitch-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd' chrome><span small glyph='chrome'></span> Chrome Web Store </a>"
      }
    ],
    settings: {}
  };

  // src/settings/sections/data-usage.js
  var data_usage_default = {
    title: "Data Usage",
    tr: "data-usage--browser-storage",
    glyph: "poll",
    flags: ["small"],
    keywords: "data,dossier,evidence,goods,info,input,knowledge,management,picture,statistics,testimony,usage",
    rows: [
      {
        tr: false,
        text: ""
      },
      {
        html: `<table id='data-usage--browser-storage-itemized'>
                        <thead>
                            <tr>
                                <th colspan='999'><button id='data-usage--browser-storage-range' data-zoomed='false' visible style='margin:0;width:100%'></button></th>
                            </tr>
                        </thead>
                    </table>`
      },
      {
        tr: false,
        text: ""
      }
    ],
    settings: {}
  };

  // src/settings/sections/support.js
  var support_default = {
    title: "Support",
    tr: "support",
    glyph: "info",
    flags: ["small"],
    keywords: "backing,help,support",
    rows: [
      {
        html: `<a type='button' href='https://github.com/ephellon/twitch-tools' top-tooltip='Fastest communication method' github>
                    <span small glyph='github'></span>
                    GitHub
                </a>`
      },
      {
        html: `<a type='button' href='https://chrome.google.com/webstore/detail/twitch-tools/fcfodihfdbiiogppbnhabkigcdhkhdjd' top-tooltip='Reasonable communication method'>
                    <span small glyph='chrome'></span>
                    Chrome Web Store
                </a>`
      },
      {
        html: `<a disabled type='button' href='#mailto:minkcbos@gmail.com?subject=Twitch%20Tools' top-tooltip='Slowest communication method'>
                    <span small glyph='unread'></span>
                    e-mail
                </a>`
      }
    ],
    settings: {}
  };

  // src/settings/sections/language.js
  var language_default = {
    title: "Language",
    tr: "language",
    glyph: "translate",
    flags: ["small"],
    badges: {
      dead: "5.30"
    },
    keywords: "accent,dialect,expression,jargon,language,prose,sound,speech,style,terminology,vocabulary,voice,word,wording",
    rows: [
      {
        select: "user_language_preference"
      }
    ],
    settings: {
      user_language_preference: {
        type: "select",
        options: [
          {
            default: true,
            value: "en",
            label: "English (North American)"
          }
        ],
        attrs: {
          disabled: ""
        }
      }
    }
  };

  // src/settings/layout.js
  var layout_default = [
    {
      header: "Automation",
      tr: "header:automation",
      save: true,
      sections: [
        auto_join_settings_default,
        auto_claim_bonuses_settings_default,
        claim_drops_settings_default,
        claim_loot_settings_default,
        lurking_settings_default,
        first_in_line_settings_default,
        auto_follow_settings_default,
        kill_extensions_settings_default,
        next_channel_default,
        parse_commands_settings_default,
        prevent_raiding_settings_default,
        claim_prime_settings_default,
        stay_live_settings_default,
        time_zones_settings_default,
        view_mode_settings_default
      ]
    },
    {
      header: "Chat &amp; Messaging",
      tr: "header:chat-and-messaging",
      headerAttrs: {
        subtitle: "These settings do not apply to banned channels unless otherwise noted."
      },
      save: true,
      sections: [
        simplify_chat_settings_default,
        bttv_emotes_settings_default,
        filter_messages_settings_default,
        highlight_mentions_settings_default,
        highlight_phrases_settings_default,
        link_maker_chat_settings_default,
        auto_chat_vip_settings_default,
        native_twitch_reply_settings_default,
        mention_audio_settings_default,
        prevent_spam_settings_default,
        recover_chat_settings_default,
        recover_messages_settings_default,
        highlight_mentions_popup_settings_default
      ]
    },
    {
      header: "Currencies",
      tr: "header:currencies",
      save: true,
      sections: [
        convert_bits_settings_default,
        points_receipt_channel_points_receipt_settings_default,
        rewards_calculator_settings_default
      ]
    },
    {
      header: "Customization",
      tr: "header:customization",
      save: true,
      sections: [
        accent_color_default,
        block_banners_settings_default,
        context_menu_override_default,
        lurking_easy_lurk_settings_default,
        hide_blank_ads_settings_default,
        points_receipt_settings_default,
        point_watcher_settings_default,
        stream_preview_settings_default,
        watch_time_settings_default
      ]
    },
    {
      header: "Networking",
      tr: "header:networking",
      headerAttrs: {
        subtitle: "Data here will interact with the Internet."
      },
      save: true,
      sections: [
        export_settings_default,
        store_integration_settings_default,
        auto_dvr_settings_default
      ]
    },
    {
      header: "Video Recovery",
      tr: "header:video-recovery",
      save: true,
      sections: [
        keep_pop_outs_default,
        ram_alarms_default,
        recover_stream_recover_ads_settings_default,
        recover_frames_settings_default,
        recover_pages_settings_default,
        recover_stream_settings_default,
        recover_video_settings_default
      ]
    },
    {
      header: "User Scripts",
      tr: "header:user-scripts",
      headerAttrs: {
        subtitle: "Your own automation, written in the TTV DSL."
      },
      save: true,
      sections: [
        user_scripts_default
      ],
      // The installed scripts and the permissions approved for them (kept by the list above, not a control)
      stored: ["user_scripts", "user_scripts__consent"]
    },
    {
      header: "Developer Features",
      tr: "header:developer-features",
      headerAttrs: {
        subtitle: "These are advanced features that should be used for testing."
      },
      attrs: {
        id: ":settings--developer",
        danger: ""
      },
      save: true,
      sections: [
        display_console_messages_default,
        display_statistics_default,
        developer_features_experimental_features_settings_default,
        developer_features_settings_default,
        low_data_usage_default,
        use_fine_details_default,
        automatic_tab_reloads_default,
        show_default_values_default
      ]
    },
    {
      header: "Experimental Features",
      tr: "header:experimental-features",
      headerAttrs: {
        subtitle: "These are experimental features that may produce errors."
      },
      attrs: {
        id: ":settings--experimental",
        caution: ""
      },
      save: true,
      sections: [
        auto_focus_settings_default,
        convert_emotes_settings_default,
        safe_soft_unban_settings_default
      ]
    },
    {
      header: "About TTV Tools",
      tr: "about",
      footer: `<footer tr-id='footer'>
            <div>
                <h3>This extension is in no way affiliated with, nor endorsed by:</h3>
                <ul>
                    <li>
                        <a href='https://www.amazon.com/gp/help/customer/display.html?nodeId=G202075070' target='_blank'>Amazon.com, Inc.</a>
                        <ul>
                            <li><a href='https://twitch.tv/legal' target='_blank'>Twitch Interactive, Inc.</a></li>
                        </ul>
                    </li>
                    <li><a href='https://blerp.com/legal' target='_blank'>Blerp, Inc.</a></li>
                    <li><a href='https://policies.google.com/terms' target='_blank'>Google, LLC</a></li>
                    <li><a href='https://streamelements.com/terms' target='_blank'>Live Momentum, Ltd.</a></li>
                    <li>
                        <a href='https://microsoft.com/legal/terms-of-use' target='_blank'>Microsoft Co.</a>
                        <ul>
                            <li><a href='https://github.com/site-policy/github-terms' target='_blank'>GitHub, Inc.</a></li>
                        </ul>
                    </li>
                    <li><a href='https://nightdev.com/terms' target='_blank'>NightDev, LLC</a></li>
                    <li><a href='https://nintendo.com/terms-of-use' target='_blank'>Nintendo Co., Ltd.</a></li>
                    <li><a href='https://electronics.sony.com/terms-conditions' target='_blank'>Sony Group Co.</a></li>
                    <li><a href='https://streamloots.com/terms-and-conditions' target='_blank'>Streamloots</a></li>
                    <li><a href='https://valvesoftware.com/legal' target='_blank'>Valve Co.</a></li>
                    <li><em>...either aforementioned party's partners, affiliates, or subsidiaries.</em></li>
                </ul>
            </div>
        </footer>`,
      stored: ["clientID", "oauthToken"],
      sections: [
        version_default,
        data_usage_default,
        support_default,
        language_default
      ]
    }
  ];

  // src/settings/render.js
  var escapeAttribute = /* @__PURE__ */ __name((value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"), "escapeAttribute");
  function attributes(attrs = {}) {
    let html = "";
    for (const name in attrs) {
      const value = attrs[name];
      if (value === false || value == null)
        continue;
      html += value === "" || value === true ? ` ${name}` : ` ${name}="${escapeAttribute(value)}"`;
    }
    return html;
  }
  __name(attributes, "attributes");
  function control(id, setting) {
    if (setting == null)
      throw new Error(`Setting "${id}" is used but not defined`);
    if (setting.type == "select") {
      const options = setting.options.map(
        ({ label, value: value2, default: selected, attrs: attrs2 }) => `<option${attributes({ value: value2, ...attrs2, selected: selected ? "" : null })}>${label}</option>`
      ).join("");
      return `<select${attributes({ id, ...setting.attrs })}>${options}</select>`;
    }
    const { type, default: value, group: name, min, max, step, placeholder, unit, attrs, wrap = unit ? { unit } : null } = setting;
    const toggled = type == "checkbox" || type == "radio";
    const input = `<input${attributes({ id, type, name, min, max, step, placeholder, ...toggled ? {} : { value }, ...attrs, ...toggled && value ? { checked: "" } : {} })}>`;
    return wrap ? `<span${attributes(wrap)}>${input}</span>` : input;
  }
  __name(control, "control");
  function fill(text, settings) {
    return text.replace(/\{\{([\w\-:]+)\}\}/g, ($0, $1, $$, $_) => control($1, settings[$1]));
  }
  __name(fill, "fill");
  function titleBar({ title, tr, glyph, flags = [], attrs }) {
    const icon = glyph ? `<span${attributes(Object.fromEntries(flags.map((flag) => [flag, ""])))} glyph="${escapeAttribute(glyph)}"></span> ` : "";
    return `<div class="title"${attributes({ "tr-id": tr, ...attrs })}>${icon}${title}</div>`;
  }
  __name(titleBar, "titleBar");
  function renderRows(rows, settings) {
    return rows.map((row) => {
      if ("html" in row)
        return row.html;
      if ("toggle" in row) {
        const id = row.toggle;
        return `<div class="toggle">${control(id, settings[id])}<label for="${id}"></label></div>`;
      }
      if ("select" in row)
        return control(row.select, settings[row.select]);
      if ("choice" in row) {
        const id = row.choice;
        return `<div class="radio"${attributes(row.attrs)}>${control(id, settings[id])}<label${attributes({ "tr-id": row.tr, for: id })}><h2${attributes(row.titleAttrs)}>${row.title}</h2> ${fill(row.text ?? "", settings)}</label></div>`;
      }
      if ("text" in row) {
        const tr = row.tr === false ? null : row.tr ?? "";
        return `<p${attributes({ ...row.attrs, "tr-id": tr })}>${fill(row.text, settings)}</p>`;
      }
      if ("extras" in row) {
        const { title, tr, subtitle, attrs } = row.extras;
        return `<details${attributes(row.attrs)}><summary${attributes({ "tr-id": tr, subtitle, ...attrs })}>${title}</summary><div${attributes(row.panelAttrs)}>${renderRows(row.rows, settings)}</div></details>`;
      }
      if ("option" in row)
        return `<div opt${attributes(row.attrs)}>${titleBar(row.option)}<div class="summary">${renderRows(row.rows, settings)}</div></div>`;
      throw new Error(`Unknown settings row: ${JSON.stringify(row).slice(0, 80)}`);
    }).join("");
  }
  __name(renderRows, "renderRows");
  function renderSection(section) {
    if ("html" in section)
      return section.html;
    const { badges, summaryAttrs, rows, settings = {} } = section;
    return `<section${attributes(badges)}>${titleBar(section)}<div class="summary"${attributes(summaryAttrs)}>${renderRows(rows, settings)}</div></section>`;
  }
  __name(renderSection, "renderSection");
  function renderLayout(groups) {
    return groups.map(({ header, tr, headerAttrs, attrs, save, footer = "", sections }) => {
      const saveButton = save ? `<section save tr-id="save"><button class="ripple save">Save</button></section>` : "";
      return `<header${attributes({ "tr-id": tr, ...headerAttrs })}>${header}</header><article${attributes(attrs)}>${sections.map(renderSection).join("")}${saveButton}${footer}</article>`;
    }).join("");
  }
  __name(renderLayout, "renderLayout");
  function settingIds(groups) {
    return groups.flatMap(({ sections, stored = [] }) => [
      ...sections.flatMap(({ settings = {} }) => Object.keys(settings).filter((id) => settings[id].store !== false)),
      ...stored
    ]);
  }
  __name(settingIds, "settingIds");
  function settingDefaults(groups) {
    const defaults = {};
    for (const { sections } of groups)
      for (const { settings = {} } of sections)
        for (const id in settings) {
          const setting = settings[id];
          if (setting.store === false || setting.type == "custom")
            continue;
          if (setting.type == "select") {
            const option = setting.options.find((option2) => option2.default) ?? setting.options[0];
            defaults[id] = (option == null ? void 0 : option.value) ?? (option == null ? void 0 : option.label.replace(/<[^>]*>/g, "").trim()) ?? null;
          } else if (setting.type == "checkbox" || setting.type == "radio") {
            defaults[id] = !!setting.default;
          } else if ("default" in setting) {
            defaults[id] = setting.scale ? Number(setting.default) * setting.scale : String(setting.default);
          }
        }
    return defaults;
  }
  __name(settingDefaults, "settingDefaults");

  // src/lib/dsl-host.js
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

  // src/lib/user-scripts.js
  var SCRIPTS_KEY = "user_scripts";
  var CONSENT_KEY = "user_scripts__consent";
  function grantsOf(permissions = []) {
    return [...new Set(permissions.flatMap(({ permissions: permissions2 }) => permissions2))].sort().join(" ");
  }
  __name(grantsOf, "grantsOf");

  // src/settings/user-scripts.js
  var RETURN_HASH = "user-scripts-manager";
  var _a, _b;
  var STORAGE = (_b = (_a = globalThis.browser ?? globalThis.chrome) == null ? void 0 : _a.storage) == null ? void 0 : _b.local;
  var TEMPLATE = [
    'plugin hello_bot -- "Hello Bot"',
    '    about "Replies when someone says !hello, waves on !bye, and remembers who it greeted last."',
    '    setting reply: text "Hi there!" -- "Reply with the following"',
    '    setting reminders: checkbox true -- "Remind chat every 15 minutes"',
    "",
    "// Chat commands",
    "await (.command is SOMETHING)",
    "    when .command is",
    '        "hello":',
    "            // `!hello @zip` greets zip; a bare `!hello` replies to whoever asked",
    "            if .argument is SOMETHING",
    "                POST `${ setting.reply } ${ .argument }`",
    "            else",
    "                REPLY setting.reply",
    "",
    "            // Remembered for `!who` below",
    "            .sender -> last_greeted",
    "",
    '        "bye":',
    "            // A different goodbye each time",
    "            REPLY any from (",
    "                `See you later!`",
    "                `Thanks for stopping by 💜`",
    "                `Take care!`",
    "            )",
    "",
    '        "who":',
    "            if last_greeted is SOMETHING",
    "                REPLY `The last person I said hi to was ${ last_greeted }.`",
    "            else",
    "                REPLY `Nobody has said !hello yet. Be the first!`",
    "",
    "// Moderators get a salute when they say hello",
    'await (.command is "hello")',
    "    using [moderator]",
    "        POST `🛡️ ${ .sender } is on duty.`",
    "",
    "// Every 15 minutes, but only while the stream is live",
    "await 15:00 with (#live is true)",
    "    if setting.reminders",
    "        POST `Type !hello and I'll say hi 🤖`",
    ""
  ].join("\n");
  var read = /* @__PURE__ */ __name((keys) => new Promise((resolve) => STORAGE.get(keys, resolve)), "read");
  var write = /* @__PURE__ */ __name((values) => new Promise((resolve) => STORAGE.set(values, resolve)), "write");
  var ask = /* @__PURE__ */ __name(async (html) => !!await confirm(`${html}<!-- ${Date.now()} -->`), "ask");
  var escape = /* @__PURE__ */ __name((text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"), "escape");
  function inspectAll(scripts) {
    return scripts.map(({ file, source }) => ({ file, source, ...TTV_DSL.inspect(source, { file }) }));
  }
  __name(inspectAll, "inspectAll");
  function statusOf(script, consent) {
    const required = grantsOf(script.meta.permissions);
    if (script.diagnostics.length)
      return { label: `${script.diagnostics.length} problem${script.diagnostics.length > 1 ? "s" : ""}`, kind: "error" };
    if (required && consent[script.meta.id] !== required)
      return { label: "Needs approval", kind: "warning" };
    return { label: "Ready", kind: "ok" };
  }
  __name(statusOf, "statusOf");
  function highlighted(source) {
    return TTV_DSL.highlight(source).map(({ type, text }) => `<span class="ttv-dsl-${type}">${escape(text)}</span>`).join("") + "\n";
  }
  __name(highlighted, "highlighted");
  function openEditor({ source, file, original, taken }) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.id = "user-script-editor";
      overlay.innerHTML = `
            <div class="user-script-editor--dialog" role="dialog" aria-label="Script editor">
                <div class="user-script-editor--head"><strong>${escape(file)}</strong><span class="user-script-editor--meta"></span></div>
                <div class="user-script-editor--code">
                    <div class="user-script-editor--gutter" aria-hidden="true"></div>
                    <pre aria-hidden="true"></pre>
                    <textarea spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>
                </div>
                <ul class="user-script-editor--problems"></ul>
                <div class="user-script-editor--actions"><button class="user-script-editor--cancel">Cancel</button><button class="user-script-editor--save">Save</button></div>
            </div>`;
      const textarea = overlay.querySelector("textarea"), pre = overlay.querySelector("pre"), gutter = overlay.querySelector(".user-script-editor--gutter"), problems = overlay.querySelector(".user-script-editor--problems"), meta = overlay.querySelector(".user-script-editor--meta"), save = overlay.querySelector(".user-script-editor--save");
      let timer = null, faulty = /* @__PURE__ */ new Set();
      const number = /* @__PURE__ */ __name(() => {
        const count = textarea.value.split("\n").length;
        gutter.innerHTML = Array.from({ length: count }, (_, index) => `<div${faulty.has(index + 1) ? " problem" : ""}>${index + 1}</div>`).join("");
        gutter.scrollTop = textarea.scrollTop;
      }, "number");
      const refresh = /* @__PURE__ */ __name(() => {
        const text = textarea.value, { meta: info } = TTV_DSL.inspect(text, { file }), found = TTV_DSL.check(text);
        pre.innerHTML = highlighted(text);
        if (info.id != original && taken.has(info.id))
          found.unshift({ message: `The id "${info.id}" is already used by another setting or script`, loc: { line: 1, column: 1 } });
        meta.textContent = ` — ${info.name} (${info.id})`;
        problems.innerHTML = found.map(({ message, loc }) => `<li><code>${(loc == null ? void 0 : loc.line) ?? "?"}:${(loc == null ? void 0 : loc.column) ?? "?"}</code> ${escape(message)}</li>`).join("");
        save.disabled = found.length > 0;
        faulty = new Set(found.map(({ loc }) => loc == null ? void 0 : loc.line).filter(Boolean));
        number();
      }, "refresh");
      textarea.value = source;
      textarea.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(refresh, 150);
        pre.innerHTML = highlighted(textarea.value);
        number();
      });
      textarea.addEventListener("scroll", () => {
        pre.scrollTop = gutter.scrollTop = textarea.scrollTop;
        pre.scrollLeft = textarea.scrollLeft;
      });
      textarea.addEventListener("keydown", (event) => {
        if (event.key != "Tab" || event.ctrlKey || event.altKey || event.metaKey)
          return;
        event.preventDefault();
        document.execCommand("insertText", false, "    ");
      });
      const close = /* @__PURE__ */ __name((result) => {
        overlay.remove();
        resolve(result);
      }, "close");
      overlay.querySelector(".user-script-editor--cancel").onclick = () => close(null);
      save.onclick = () => close({ file, source: textarea.value });
      document.body.append(overlay);
      refresh();
      textarea.focus();
    });
  }
  __name(openEditor, "openEditor");
  async function askApproval(script) {
    const rows = script.meta.permissions.map(
      ({ permissions, description, line }) => `<li><code>${permissions.map(escape).join(", ")}</code><span>${escape(description ?? "")}</span><small>line ${line}</small></li>`
    ).join("");
    return ask(`<div class="user-scripts--approval">
        <p><strong>${escape(script.meta.name)}</strong> asks for these permissions:</p>
        <ul>${rows}</ul>
        <p class="user-scripts--approval-note">Only approve scripts you trust.</p>
    </div>`);
  }
  __name(askApproval, "askApproval");
  async function renderUserScripts({ ids, defaults }) {
    var _a2;
    const manager = document.getElementById("user-scripts-manager");
    if (!manager || !STORAGE || !globalThis.TTV_DSL)
      return;
    const stored = await read([SCRIPTS_KEY, CONSENT_KEY]), scripts = inspectAll(stored[SCRIPTS_KEY] ?? []), consent = { ...stored[CONSENT_KEY] }, builtIn = new Set(ids);
    const sections = scripts.filter(({ meta }) => !builtIn.has(meta.id)).map(({ meta }) => meta.section);
    const section = manager.closest("section");
    section.insertAdjacentHTML("afterend", sections.map(renderSection).join(""));
    for (const { meta } of scripts)
      for (const key of Object.keys(meta.settings ?? {}))
        if (!ids.includes(key))
          ids.push(key);
    Object.assign(defaults, settingDefaults([{ sections }]));
    const reload = /* @__PURE__ */ __name(() => {
      location.hash = RETURN_HASH;
      location.reload();
    }, "reload");
    if (location.hash == `#${RETURN_HASH}`) {
      const settle = /* @__PURE__ */ __name(() => [600, 1500].forEach((delay) => setTimeout(() => section.scrollIntoView({ block: "start", behavior: "instant" }), delay)), "settle");
      if (document.readyState == "complete")
        settle();
      else
        window.addEventListener("load", settle, { once: true });
      history.replaceState(null, "", location.pathname + location.search);
    }
    const taken = /* @__PURE__ */ __name(() => /* @__PURE__ */ new Set([...builtIn, ...scripts.map(({ meta }) => meta.id)]), "taken");
    const store = /* @__PURE__ */ __name(async (list) => {
      await write({ [SCRIPTS_KEY]: list.map(({ file, source }) => ({ file, source })) });
      reload();
    }, "store");
    manager.innerHTML = `
        <table class="user-scripts--list">${scripts.map((script, index) => {
      const { label, kind } = statusOf(script, consent);
      return `<tr data-index="${index}">
                <td><strong>${escape(script.meta.name)}</strong> <code>${escape(script.meta.id)}</code></td>
                <td><span class="user-scripts--status" status="${kind}">${label}</span></td>
                <td>${kind == "warning" ? '<button class="approve">Approve…</button> ' : ""}<button class="edit">Edit</button> <button class="remove">Remove</button></td>
            </tr>`;
    }).join("") || "<tr><td>No scripts yet.</td></tr>"}</table>
        <div class="user-scripts--actions">
            <button class="new">New script</button>
            <input type="file" accept=".ttv,text/plain" hidden>
            <button class="import">Import .ttv…</button>
        </div>`;
    for (const row of manager.querySelectorAll("tr[data-index]")) {
      const script = scripts[+row.dataset.index];
      row.querySelector(".edit").onclick = async () => {
        const others = taken();
        others.delete(script.meta.id);
        const result = await openEditor({ source: script.source, file: script.file, original: script.meta.id, taken: others });
        if (result)
          await store(scripts.map((other) => other == script ? result : other));
      };
      row.querySelector(".remove").onclick = async () => {
        if (!await ask(`Remove <strong>${escape(script.meta.name)}</strong>? Its settings are kept until you reinstall or reset.`))
          return;
        delete consent[script.meta.id];
        await write({ [CONSENT_KEY]: consent });
        await store(scripts.filter((other) => other != script));
      };
      (_a2 = row.querySelector(".approve")) == null ? void 0 : _a2.addEventListener("click", async () => {
        if (!await askApproval(script))
          return;
        consent[script.meta.id] = grantsOf(script.meta.permissions);
        await write({ [CONSENT_KEY]: consent });
        reload();
      });
    }
    const add = /* @__PURE__ */ __name(async (source, file) => {
      const result = await openEditor({ source, file, original: null, taken: taken() });
      if (result)
        await store([...scripts, result]);
    }, "add");
    const picker = manager.querySelector('input[type="file"]');
    manager.querySelector(".new").onclick = () => add(TEMPLATE, "hello-bot.ttv");
    manager.querySelector(".import").onclick = () => picker.click();
    picker.onchange = async () => {
      const [file] = picker.files;
      if (file)
        await add(await file.text(), file.name);
    };
  }
  __name(renderUserScripts, "renderUserScripts");

  // src/settings/index.js
  document.getElementById("search-container").insertAdjacentHTML("beforebegin", renderLayout(layout_default));
  window.SETTINGS_LAYOUT = layout_default;
  window.SETTINGS_IDS = settingIds(layout_default);
  window.SETTINGS_DEFAULTS = settingDefaults(layout_default);
  window.SETTINGS_EXTRA = renderUserScripts({ ids: window.SETTINGS_IDS, defaults: window.SETTINGS_DEFAULTS }).catch((error) => console.error("User Scripts:", error));
})();
