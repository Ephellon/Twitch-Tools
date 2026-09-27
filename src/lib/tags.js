/*** /lib/tags.js
 * Scoring Twitch tags by how much on-screen activity they suggest (used by Auto-Focus and the stats view).
 * Moved verbatim from tools.js in Phase 4.
 */

// Estimated level of screen activity
    // See https://www.twitch.tv/directory/all/tags
function scoreTagActivity(...tags) {
    let score = 0;

    // Last directory in pathname
    try {
        tags = tags.map(tag => decodeURIComponent(tag.split(/\//).pop().toUpperCase()));
    } catch(error) {
        return;
    }

    scoring:
    for(let tag of tags)
        switch(tag) {
            case 'ACTION':      case '4D1EAA36-F750-4862-B7E9-D0A13970D535': // Action
            case 'ADVENTURE':   case '80427D95-BB46-42D3-BF4D-408E9BDCA49A': // Adventure
            case 'FPS':         case 'A69F7FFB-DDDA-4C05-8D7D-F0B24975A2C3': // FPS
            case 'PINBALL':     case '9386024F-DB7E-4E4F-B8DF-A73E354C5BC2': // Pinball
            case 'PLATFORMER':  case '5D289CF9-D75A-42B5-A635-0D117609E6A6': // Platformer
            case 'SHOOT':       case 'E607B115-8FA1-49C1-ACDF-F6927BE4CA1B': // Shoot
            case 'SHOOTER':     case '523FE736-FA95-44C7-B22F-13008CA2172C': // Shooter
            case 'SPORTS':      case '0D4233AF-7AC6-49DA-937D-E0F42B7DB187': // Sports
            case 'WRESTLING':   case '7199189A-0569-4854-908E-08E6C3667379': // Wrestling
            {
                score += 20;
            } continue scoring;

            case '4X':          case '7304B834-D065-47D5-9865-C19CD17D2639': // 4X
            case 'BMX':         case 'E62CB1D5-A47D-4690-A373-FE4C0856F78B': // BMX
            case 'COSPLAY':     case '2FFD5C3E-B927-4749-BA53-79D3B626B2DA': // Cosplay
            case 'DRAG':        case '011F7C20-F533-4AD1-8093-8C6F8F75BC4C': // Drag
            case 'DRIVING':     case 'F5ED5BD0-78CB-4467-8E13-9172A210B64D': // Driving
            case 'E3':          case 'D27DA25E-1EE2-4207-BB11-DD8D54FA29EC': // E3
            case 'ESPORTS':     case '36A89A80-4FCD-4B74-B3D2-2C6FD9B30C95': // Esports
            case 'FASHION':     case '246D6E4B-B9C6-442B-9573-77028839F194': // Fashion
            case 'FIGHTING':    case '9751EE1D-0E5A-4FD3-8E9F-BC3C5D3230F0': // Fighting
            case 'GAME':        case '068C541B-DC07-4D7F-A689-5578F90905A9': // Game
            case 'IRL':         case '2610CFF9-10AE-4CB3-8500-778E6722FBB5': // IRL
            case 'MMO':         case '643FE658-C4FC-45F0-9AED-CBE54A7C1D10': // MMO
            case 'MOBA':        case '12510423-D1F6-4992-8AEA-1441A43D1DF4': // MOBA
            case 'PARTY':       case 'B1E92364-CBDA-4033-92FC-E01094C1753F': // Party
            case 'PVP':         case '8486F56B-8677-44F7-8004-000295391524': // PvP
            case 'POINT':       case '0C99BF18-5A92-4257-8974-D7A60088D1E8': // Point
            case 'RHYTHM':      case 'C8BB9D08-8202-42F8-B028-C59AC1AAFE76': // Rhythm
            case 'ROGUELIKE':   case 'CAD488FB-C95C-4BE1-B197-5B851D3A12FA': // Roguelike
            case 'VR':          case 'CA470745-C1DF-4C11-9474-9AB79DFC1863': // VR
            case 'VTUBER':      case '52D7E4CC-633D-46F5-818C-BB59102D9549': // Vtuber
            {
                score += 15;
            } continue scoring;

            case '100%':            case 'E659959D-392F-44C5-83A5-FB959CDBACCC': // 100%
            case '12':              case 'A31DAEB5-EDC2-4B29-AFA1-84C96612836D': // 12
            case 'ACHIEVEMENT':     case '27937CEC-5CFC-4F56-B1D3-F6E1D67735E2': // Achievement
            case 'ANIME':           case '6606E54C-F92D-40F6-8257-74977889CCDD': // Anime
            case 'ARCADE':          case '7FF66192-68EF-4B69-8906-24736BF66ED0': // Arcade
            case 'ATHLETICS':       case '72340836-353F-49BF-B9BE-1AAC4F658AFE': // Athletics
            case 'AUTOBATTLER':     case 'CD2EE226-342B-4E6B-90D5-C14687006B04': // Autobattler
            case 'AUTOMOTIVE':      case '1400CA9C-84EA-414E-A85B-076A70D38ECF': // Automotive
            case 'BAKING':          case '31866A92-269D-4DF3-A2FB-58081BF97378': // Baking
            case 'BRICKBUILDING':   case 'F1E3759C-35B3-4858-A50F-8F9CAFC2660F': // Brickbuilding
            case 'CREATIVE':        case 'E36D0169-268A-4C62-A4F4-DDF61A0B3AE4': // Creative
            case 'FARMING':         case '3FFBEC21-97A2-43F9-BD73-4506A1B4D62C': // Farming
            case 'FLIGHT':          case '10D820BB-A0A9-40DF-B0D3-FE32B45419EE': // Flight
            case 'GAME SHOW':       case '6A0C6EA2-84EB-42B1-A8BB-59FD684BFE1A': // Game Show
            case 'HORROR':          case 'CF0F97AD-EFB8-4494-83EC-6A11CA30261B': // Horror
            case 'MOBILE':          case '6E23D976-33EC-47E8-B22B-3727ACD41862': // Mobile
            case 'MYSTERY':         case '6540ED8D-3282-44DF-A592-887B37881846': // Mystery
            case 'RPG':             case '9D38085E-EE62-4203-877B-81797052A18B': // RPG
            case 'RTS':             case '3E30C47A-26C0-4DD3-9C3A-9CD6AD35589C': // RTS
            case 'SURVIVAL':        case 'AE7D0652-8B2E-476B-8B51-A076550B234F': // Survival
            {
                score += 10;
            } continue scoring;

            case 'ANIMALS':         case '3DC8F084-D886-4264-B20F-8BD5F90562B5': // Animals
            case 'ANIMATION':       case 'E3A6B378-232B-4EC2-9A82-86B72851E09A': // Animation
            case 'ART':             case 'DF448DA8-7082-45B2-92AD-C624DBA6551F': // Art
            case 'CARD':            case '8D39B307-D3AD-4F4A-98A4-D1951F55CEB7': // Card
            case 'DJ':              case 'D81D54C8-D705-4DF6-AAF0-01D715C1DBCC': // DJ
            case 'DRONES':          case 'AA971BDC-A28D-4A33-A686-F112C764E73B': // Drones
            case 'FANTASY':         case 'CB00CFE5-AE4E-4E4F-A8F1-8FA6DDEC6361': // Fantasy
            case 'GAMBLING':        case '71265475-E0B0-411E-A0CF-B93C33848B2B': // Gambling
            case 'HYPE':            case 'C2839AF5-F1D2-46C4-8EDC-1D0BFBD85070': // Hype
            case 'INDIE':           case 'D72D9DE6-1DF8-4C4E-B6A2-74E6F4C80557': // Indie
            case 'METROIDVANIA':    case '537F5D21-9CA0-4632-84F3-9A29A761D66D': // Metroidvania
            case 'OPEN':            case 'A682F560-5186-4871-B97A-8D8E3F4308E9': // Open
            case 'PUZZLE':          case '7616F6EA-7E3D-4501-A87C-C160D2BC1849': // Puzzle
            case 'SIMULATION':      case '22E434B6-CA88-46E8-91EF-C18EE1CB8A67': // Simulation
            case 'STEALTH':         case '0472BAB0-E068-49B3-9BB8-789FDFE3C66A': // Stealth
            case 'UNBOXING':        case 'CD9ED640-426D-4A08-B8E0-417A61197264': // Unboxing
            {
                score += 5;
            } continue scoring;

            default: {
                ++score;
            } continue scoring;
        };

    return score;
}

export { scoreTagActivity };
