# Example: Link Guard

Asks viewers not to post links — except to Twitch and YouTube. Moderators and VIPs can post
anything. (A script can't delete messages; this one just says something.)

<!-- example: link-guard.ttv -->
```ttv
plugin link_guard -- "Link Guard"
    about "Asks viewers not to post links, except to Twitch and YouTube. Moderators and VIPs are exempt."
    setting warning: text "Please don't post links in chat 🙏" -- "Warning"

// Any message that contains at least one link
await (.links is SOMETHING)

    // Keep only the links that aren't to Twitch or YouTube.
    // The parentheses make this a filter over each link, not one comparison
    .links | (not ("twitch.tv" in .href or "youtube.com" in .href)) -> outside_links

    // Moderators and VIPs may post whatever they like
    if outside_links is SOMETHING and not ("moderator" in .badges or "vip" in .badges)
        REPLY `${ setting.warning } (${ (1st of outside_links).href })`
```

## What to notice

- **Links come ready.** `.links` is every link in the message, each with an `.href`.
  `await (.links is SOMETHING)` only fires for messages that have at least one.
- **Filtering a list.** `.links | ( … )` keeps the links for which the part in parentheses is
  true — inside it, `.href` means *that* link's address. The parentheses matter: without them
  the line would be read as one yes/no question instead of a filter.
- **`not`, `and`, `or`, `in`.** `"twitch.tv" in .href` asks whether the address contains that
  text. Comparisons like this ignore upper and lower case.
- **Checking badges without `using`.** `.badges` is the sender's badges as a list, so
  `"vip" in .badges` works anywhere in a condition.
- **Picking from a list.** `1st of outside_links` is the first link that got through the filter;
  `.href` reads its address. `-1st` would be the last.

## Settings

| Setting | Type | Default |
| :--- | :--- | :--- |
| Warning | text | `Please don't post links in chat 🙏` |

## In chat

```
zip:  look https://twitch.tv/zip/clip/x
      (nothing — Twitch links are fine)
zip:  buy now https://spam.example/buy
bot:  Please don't post links in chat 🙏 (https://spam.example/buy)
vip1: https://spam.example/vip                     (vip1 is a VIP)
      (nothing — VIPs are exempt)
```

## Try it

1. In TTV Tools, open **Settings → User Scripts** and choose **New script** (or save the
   script below as a `.ttv` file and use **Import .ttv…**).
2. Paste the script and save. It appears in the list with its own switch and settings.
3. Turn it on. If it asks for permissions, you'll be shown what and why before it runs.
