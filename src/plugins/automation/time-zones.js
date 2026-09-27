/*** /plugins/automation/time-zones.js
 * Time Zones.
 * Moved from tools.js (Initialize) in Phase 4 and converted to the structured form (docs/PLUGINS.md).
 */

import { plugin } from '../../lib/plugins.js';

// The feature's state; init() resets it whenever the page (re)initializes
let TIME_ZONE__TEXT_MATCHES, TIME_ZONE__REGEXPS, TIME_ZONE__CONVERSIONS, GEOGRAPHIC__CONVERSIONS, NON_TIME_ZONE_WORDS, convertWordsToTimes;

plugin({
    id: 'time_zones',
    timer: 250,

    async init() {
        convertWordsToTimes = function convertWordsToTimes(string = '') {
            return string.normalize('NFKD')
                // .replace(/\b(mornings?|dawn)\b/i, '06:00 AM')
                .replace(/\b(after\s?noons?|evenings?)\b/i, '01:00 PM')
                .replace(/\b(noons?|lunch[\s\-]?time)\b/i, '12:00 PM')
                // .replace(/\b((?:to|2)?nights?|dusk)\b/i, '06:00 PM')
                .replace(/\b(mid[\s\-]?nights?)\b/i, '12:00 AM')

                // Ignores shorthands → "today" "2day" "tonight" "2night" "tomorrow" "2morrow" "tomrw" "2mw" etc.
                .replace(/\b(?:to|2)(?:day|night|m[or]*w)\b/ig, ($0, $$, $_) => $0.split('').join('\u200d'))

                // Replaces ranges
                // 6 - 11P ET | 6:00 AM - 11:00 PM EST
                .replace(/\b(?<start>\d{1,2}(?::?\d\d)?)(?<premeridiem>\s*[ap]\.?m?\.?)?(?<delimeter>[\p{Pd}\p{Zs}]+)(?<stop>\d{1,2}(?::?\d\d)?)(?<postmeridiem>\s*[ap]\.?m?\.?)?\s*(?<timezone>\b(?:AOE|GMT|UTC|[A-Y]{1,4}T))\b/igu, ($0, start, preMeridiem, delimeter, stop, postMeridiem, timezone) => {
                    let autoMeridiem = "AP"[+(new Date(STREAMER.data?.actualStartTime ?? +new Date).getHours() > 11)] + 'M';

                    preMeridiem ||= postMeridiem || autoMeridiem;
                    postMeridiem ||= preMeridiem;

                    let _mm = /(?<!:\d\d)$/, _00 = ':00';

                    start = start.replace(_mm, _00);
                    stop = stop.replace(_mm, _00);

                    return [start, preMeridiem, delimeter, stop, postMeridiem, ' ', timezone].join('');
                })
        };
        TIME_ZONE__TEXT_MATCHES = [];
        TIME_ZONE__REGEXPS = [
                // Natural
                // 3:00PM EST | 3PM EST | 3:00P EST | 3P EST | 3:00 EST | 3 EST | 3:00PM (EST) | 3PM (EST) | 3:00P (EST) | 3P (EST) | 3:00 (EST) | 3 (EST)
                /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))[ \t]*(?<meridiem>[ap]\.?m?\.?(?!\p{L}|\p{N}))?[ \t]*(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)[ \t]*\))/iu,
                // 15:00 EST | 1500 EST
                /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:?[0-5]\d)[ \t]*(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)[ \t]*\))/iu,
                // EST 3:00PM | EST 3PM | EST 3:00P | EST 3P | EST 3:00 | EST 3
                /(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)[ \t]*\))[ \t]*(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰])|[b-oq-z])[ \t]*(?<meridiem>[ap]\.?m?\.?(?!\p{L}|\p{N}))?/iu,
                // EST 15:00 | EST 1500
                /(?<timezone>(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)\b|\([ \t]*(?:(?:AOE|GMT|UTC)(?:(?:[+-])(?:2[0-3]|[01]?\d)(?::?[0-5]\d)?)?|[A-Y]{1,4}T)[ \t]*\))[ \t]*(?<hour>2[0-3]|[01]?\d)(?<minute>:?[0-5]\d)(?!\d*(?:\p{Sc}|[%‰]))/iu,
                // 3:00PM | 3PM
                /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))[ \t]*(?<meridiem>[ap]\.?m?\.?(?!\p{L}|\p{N}))/iu,
                // 15:00
                /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<hour>2[0-3]|[01]?\d)(?<minute>:[0-5]\d)[ \t]*/iu,

                // Zulu - https://stackoverflow.com/a/23421472/4211612
                // Z15:00 | Z1500 | +5:00 | -5:00 | +0500 | -0500
                /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?<offset>Z|[+-])(?<hour>2[0-3]|[01]\d)(?<minute>:?[0-5]\d)(?!\d*(?:\p{Sc}|[%‰]))\b/iu,

                // GMT/UTC
                // GMT+5:00 | GMT-5:00 | GMT+0500 | GMT-0500 | GMT+05 | GMT-05 | GMT+5 | GMT-5 | UTC+5:00 | UTC-5:00 | UTC+0500 | UTC-0500 | UTC+05 | UTC-05 | UTC+5 | UTC-5
                /(?<![#\$\.+:\d%‰]|\p{Sc})\b(?:GMT[ \t]*|UTC[ \t]*)(?<offset>[+-])(?<hour>2[0-3]|[01]?\d)(?<minute>:?[0-5]\d)?(?!\d*(?:\p{Sc}|[%‰]))\b/iu,
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
                YEKT: "+05:00",
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
                "Zimbabwe": "+02:00",
            };
        NON_TIME_ZONE_WORDS = await fetchURL(`get:./ext/[A-Y]{2,4}T.json`).then(response => response.json());
        convertWordsToTimes.inReverse ??= (string = '') => {
            return string.normalize('NFKD')
                // .replace(/\b(06:00AM)\b/i, 'morning')
                .replace(/\b(01:00PM)\b/i, 'evening')
                .replace(/\b(12:00PM)\b/i, 'noon')
                // .replace(/\b(06:00PM)\b/i, 'night')
                .replace(/\b(12:00AM)\b/i, 'midnight');
        };
    },

    handler: () => {
        let allNodes = node => (node.childNodes.length? [...node.childNodes].map(allNodes): [node]).flat();
        let cTitle = $.all('[data-a-target="stream-title"i], [data-a-target="about-panel"i], [data-a-target^="panel"i]'),
            rTitle = $('[class*="-tooltip"i]:is([class*="channel"i], [class*="guest"i]):not([class*="offline"i]) > p + p');

        parsing:
        for(let container of [...cTitle, rTitle].filter(defined)) {
            let [timezone, zone, type, trigger] = (null
                ?? (container?.innerText || '')
                    .normalize('NFKD')
                    .match(/(?:Time[ -]?zone[ \t:=]+)(?:(?<zone>\p{L}{3,}))(?:[ \t\-]*(?<type>\p{L}+))?/iu)
                ?? (container?.innerText || '')
                    .normalize('NFKD')
                    .match(/(?:(?<zone>\p{L}{3,})[ \t\-]+)(?:(?<type>\p{L}+)[ \t\-]+)?(?<trigger>time)\b/iu)
                ?? []
            );

            let MASTER_TIME_ZONE;

            locator: if(defined(zone)) {
                for(let place in GEOGRAPHIC__CONVERSIONS)
                    if(RegExp(place.replaceAll('-', '-?'), 'i').test(zone)) {
                        MASTER_TIME_ZONE = GEOGRAPHIC__CONVERSIONS[place];
                        break locator;
                    }

                // Try to not mistake common suffixes and titles...
                // From: https://translated-into.com/{word}
                if(false
                    // "the"
                    || /\b(y?a(h|ng?)?|c[aá]c|d(as|e[nt]?|ie|u)|e([lw]|ta)|i(he|l|ng|tu|yo)?|[lk]a|ny|o|quod|t(h?e|us)|u|y)\b/i
                        .test(zone)
                    // "of"
                    || /\b(a([fvz]|pie|utem)|d(ari|[ei])|e[ae]|[fvn]an|gada|ji|kohta|n([ae]k?|ing?|ke|tawm|y)|o([dif]|\s?ka)?|s(aka|e)|[tv]on|ti(na)?|vun|y[ae]|z)\b/i
                        .test(zone)
                    // "for"
                    || /\b(aua|(b|ch)o|canys|dla|eest|f([oö]a?r|un|yrir)|gia|hoki|kw?a(nggo|y)?|m(aka|ert)|ngoba|[ps](ara|[eëo]u?r?|r([eo]|iek))|quia|rau|til|untuk|v(arten|i|oo)r|ye|z(a|um))\b/i
                        .test(zone)
                    // "nor" or "or"
                    // || /\b(n?or?)\b/i
                    //     .test(zone)
                    // "but" or "and"
                    || /\b(a([bw]?er?|g(a|us)|ka?|[ls][ei]|m(m[ao]|pak)|nd|ti?)?|b(aina|[eu]t)|d(an|he)|e(n(gari)?|s|ta?)?|izda|k(a[ij]|[ou]ma)|l(an|e)|ja|lebe|m(a([anr]{2}|i?s)?|en|utta)|no|[ou]g|s(ed|is)|(te)?ta(b|pi)|u(nd)?|v[ae]|y)\b/i
                        .test(zone)
                    // "yet"
                    // || /\b(yet)\b/i
                    //     .test(zone)
                    // tensed words
                    || /\B(i?e[ds]|ing)$/i
                        .test(zone)
                )
                    break locator;

                MASTER_TIME_ZONE ??= (TIME_ZONE__CONVERSIONS[timezone?.length < 1? '': timezone = [zone, type ?? 'Standard', trigger].map((s = '') => s[0]).join('').toUpperCase()]?.length? timezone: '');
            }

            searching:
            for(let regexp of TIME_ZONE__REGEXPS) {
                replacing:
                for(let MAX = Object.keys(TIME_ZONE__CONVERSIONS).length; --MAX > 0 && regexp.test(convertWordsToTimes(container?.innerText));) {
                    container = (null
                        ?? container.getElementByText(regexp)
                        ?? container.getElementByText(/\b(after\s?noons?|evenings?|noons?|lunch[\s\-]?time|mid[\s\-]?nights?)\b/iu)
                    );

                    if(nullish(container))
                        continue searching;

                    let convertedText = convertWordsToTimes(container.innerText.trim()),
                        originalText = container.innerText;

                    if(convertedText.length < 1)
                        continue searching;

                    let { groups, index, length } = regexp.exec(convertedText),
                        { hour, minute = ':00', offset = '', meridiem = '', timezone = MASTER_TIME_ZONE } = groups,
                        timesone = timezone?.replace(/^([^s])t$/, '$1st')?.replace(/^([^S])T$/, '$1ST') ?? '';

                    if(offset.length > 0 && isNaN(parseInt(offset)))
                        continue;

                    let misint = timezone?.mutilate(),
                        MISINT = timezone?.toUpperCase(),
                        missnt = timesone?.mutilate(),
                        MISSNT = timesone?.toUpperCase();

                    // This isn't a timezone... it's a word...
                    if(true
                        && !(false
                            || MISINT in TIME_ZONE__CONVERSIONS
                            || MISSNT in TIME_ZONE__CONVERSIONS
                        )
                        && NON_TIME_ZONE_WORDS[misint?.[0]]?.[misint?.length]?.contains(misint)
                        && NON_TIME_ZONE_WORDS[missnt?.[0]]?.[missnt?.length]?.contains(missnt)
                    )
                        continue searching;

                    let now = new Date,
                        year = now.getFullYear(),
                        month = now.getMonth() + 1,
                        day = now.getDate(),
                        _hr_ = new Date(STREAMER.data?.actualStartTime || now).getHours(),
                        autoMeridiem = "AP"[+(_hr_ > 11)];

                    let houl = hour = parseInt(hour);

                    hour += (
                        Date.isDST()?
                            // Daylight Savings is active and Standard Time was detected
                            -/\Bs?t$/i.test(timezone):
                        // Daylight Savings is inactive and Daylight Time was detected
                        +/\Bdt$/i.test(timezone)
                    );

                    // Doesn't work as intended? Or works too well
                    if(meridiem[0]?.length < autoMeridiem.length) {
                        if(autoMeridiem == 'A')
                            hour += 12;
                        else
                            hour -= 12;

                        if(hour < 0)
                            hour += 24;
                    } else if(meridiem[0]?.equals(autoMeridiem)) {
                        if(autoMeridiem == 'P' && hour < 12)
                            hour += 12;
                        else if(autoMeridiem == 'A' && hour > 11)
                            hour -= 12;
                    } else if(meridiem[0]?.length) {
                        if(meridiem[0].toUpperCase() == 'P' && hour < 12)
                            hour += 12;
                        else if(meridiem[0].toUpperCase() == 'A' && hour > 11)
                            hour -= 12;
                    }

                    hour %= 24;

                    timezone ||= (offset.length? 'GMT': '');

                    if(timezone.length) {
                        let name = timezone = timezone.toUpperCase().replace(/[^\w\+\-]+/g, '');

                        if(timezone in TIME_ZONE__CONVERSIONS)
                            timezone = TIME_ZONE__CONVERSIONS[timezone].replace(/^[+-]/, 'GMT$&');
                        else if(/[\+\-]/.test(timezone))
                            timezone = timezone.replace(/^[+-]/, 'GMT$&');
                        else if(timesone in TIME_ZONE__CONVERSIONS)
                            timezone = TIME_ZONE__CONVERSIONS[timesone].replace(/^[+-]/, 'GMT$&');
                        else
                            continue searching;

                        MASTER_TIME_ZONE ||= name;
                    }

                    let newDate = new Date(`${ [year, month, day].join(' ') } ${ offset }${ hour + minute } ${ timezone }`),
                        newTime = newDate.toLocaleTimeString(top.LANGUAGE, { timeStyle: 'short' }),
                        noChange = convertWordsToTimes(originalText).equals(originalText);

                    if(isNaN(+newDate)) {
                        // Keep original text
                        let { groups, index, length } = regexp.exec(originalText);

                        container.innerHTML = `${ originalText.substr(0, index).split('').join('&zwj;') }{{time_zones?=${ btoa(escape(originalText.substr(index, length))) }}}${ originalText.substr(length).split('').join('&zwj;') }`;
                    } else {
                        // Convert to new text
                        container.innerText = convertedText
                            .replace(regexp, ($0, $$, $_) => `{{time_zones?=${ btoa(escape(newTime)) }|${ btoa(escape(noChange? $0.replace(/$/, (groups.timezone?.length? '': MASTER_TIME_ZONE?.length? ` (${ MASTER_TIME_ZONE })`: '')): convertWordsToTimes.inReverse($0))) }}}`);
                    }
                }
            }
        }

        let TZC = [], TZE = new Set;
        for(let MAX = 1000, regexp = /\{\{time_zones\?=(.+?)\}\}/, node; --MAX > 0 && defined(node = $.body.getElementByText(regexp));) {
            let text = RegExp['$&'],
                tzc = RegExp.$1;

            TZE.add(node);
            node.innerHTML = node.innerHTML.replace(text, `<!--!time#${ TZC.push(tzc) }-->`);
        }

        for(let node of TZE)
            allNodes(node)
                .filter(node => /\bcomment\b/i.test(node.nodeName) && node.textContent.startsWith('!time#'))
                .map(comment => {
                    let index = parseInt(comment.textContent.replace('!time#', '')) - 1;
                    let [newText, oldText] = TZC[index].split('|');

                    let span = furnish('span', {
                        id: `tt-time-zone--${ new nanoid(10, nanoid.LOWERCASE_SAFE) }`,
                        style: 'color:var(--user-contrast-color); text-decoration:underline 2px; width:min-content; white-space:nowrap',
                        contrast: THEME__PREFERRED_CONTRAST,
                        innerHTML: unescape(atob(newText)).split('').join('&zwj;').pad('&zwj;'),
                    });

                    if(oldText?.length)
                        span.setAttribute('tip-text--timezone', oldText);
                    else
                        span.removeAttribute('style');

                    comment.replaceWith(span);
                });

        wait(2_5_0).then(() => {
            $.all('[id^="tt-time-zone-"][tip-text--timezone]')
                .map(span => {
                    let oldText = span.getAttribute('tip-text--timezone');

                    new Tooltip(span, unescape(atob(oldText)), { from: 'top' });

                    // span.removeAttribute('tip-text--timezone');
                });
        });

        TIME_ZONE__TEXT_MATCHES = TIME_ZONE__TEXT_MATCHES.isolate();
    },

    setup() {
        $remark('Converting time zones...');
    },
});
