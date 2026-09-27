/*** /lib/currency.js
 * Parsing SI-suffixed numbers ("1.2K").
 * Moved verbatim from tools.js in Phase 3; see src/lib/index.js for how it reaches the page.
 */

// Convert an SI number into a number
    // parseCoin(amount:string) → number
function parseCoin(amount = '') {
    function getUnits(lang) {
        let booklet;

        switch(lang?.toLowerCase()) {
            case 'bg': { booklet = '_ ХИЛ МИЛ' } break;

            case 'cs':
            case 'sk': { booklet = '_ TIS' } break;

            case 'fi':
            case 'da': { booklet = '_ T M' } break;

            case 'el': { booklet = '_ ΧΙΛ ΕΚΑ' } break;

            case 'hu': { booklet = '_ E' } break;

            case 'ja': { booklet = '_ 千 百万' } break;

            case 'ko': { booklet = '_ 천 백만' } break;

            case 'pl': { booklet = '_ TYS MIL' } break;

            case 'ru': { booklet = '_ ТЫС МИЛ' } break;

            case 'sv': { booklet = '_ TN' } break;

            case 'tr': { booklet = '_ B' } break;

            case 'vi': { booklet = '_ N M' } break;

            case 'zh-cn': { booklet = '_ 千 百万' } break;

            case 'zh-tw': { booklet = '_ 千 百萬' } break;

            case 'en':
            default: {
                booklet = '_ K M B T';
            } break;
        } // switch lang?.toLowerCase()

        let book = {}, index = 0;

        for(const symbol of booklet.split(' '))
            book[symbol] = index++;

        return book;
    }
    ;

    const units = getUnits(LITERATURE);
    const points = amount?.toString()?.replace(RegExp(`(\\d{1,3})(${ '(?:\\D\\d{1,3})?'.repeat(9) })?(?:\\s*(\\D))?`, 'i'), ($0, $1, $2 = '0', $3 = '_', $$, $_) => {
        $2 = $2.replace(/\D/g, '');

        return parseFloat([$1, $2].join($2.length > 2 ? '' : '.')) * (1e3 ** units[$3.toUpperCase()]);
    });

    return parseInt(points) | 0;
}

export { parseCoin };
