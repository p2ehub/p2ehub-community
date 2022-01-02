const winston = require('winston');
const i18n = require('i18n');
const axios = require('axios');
const settings = require('../settings');

const headers = {};


/************************* Setup *************************/
/**
 * configure log
 */
const logger = winston.createLogger({
    level: 'silly',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(msg => `[${msg.timestamp}] ${msg.message}`)
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.colorize({ all: true })
        }),
        new winston.transports.File({
            filename: new Date().toDateString() + '.log',
            level: 'info'
        }),
    ],
});
// winston.addColors({
//     error: 'red',
//     warn: 'yellow',
//     info: 'white',
//     verbose: 'green',
// });



/************************* Common Util *************************/
const delay = async (seconds) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
};


/************************* Util *************************/
const setHeader = async (accessToken) => {
    headers.accesstoken = accessToken;
}

// TODO: handle server error
const post = async ({ url, data, skipHeader }) => {
    const res = await axios.post(url, new URLSearchParams(data), skipHeader ? null : { headers })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
    if (res.data.result == 1) {
        return res.data.data;
    } else {
        error(res.data.message);
        process.exit(1);
    }
}

const getPotionMapping = (rarity) => {
    switch (rarity) {
        case 'N':
            return 'potion';
        case 'R':
            return 'ydiamond';
        case 'SR':
            return 'pdiamond';
        case 'SSR':
            return 'pdiamond';
    }
}

const getBagMapping = (bpType) => {
    switch (bpType) {
        case 1:
            return 'fragment';
        case 2:
            return 'potion';
        case 3:
            return 'ydiamond';
        case 4:
            return 'pdiamond';
        case 5:
            return 'raca';
        case 6:
            return 'egg';
    }
}

const getBattleLevel = (level) => {
    return parseInt((level - 1) / 20) + 1;
}

// const getBattleRaca = (monster, battleLevel) => {
//     return Math.pow(2, battleLevel - 1) * 50;
// }

const skipLevelUp = (level, tokenId) => {
    if (level <= settings.skipLevel) {
        return true;
    }
    if (settings.skipLevelUp.indexOf(+tokenId) !== -1) {
        return true;
    }
    return false;
}


/************************* Log *************************/
const logMonster = (monster, index, total, saveInFile) => {
    const msg = `${index + 1}/${total} #${monster.tokenId} ` +
        `${i18n.__('energy')}: ${monster.tear}, ` +
        `${i18n.__('level')}: ${monster.level}, ` +
        `${i18n.__('exp')}: ${monster.exp}, ` +
        `${i18n.__('rarity')}: ${monster.rarity}, ` +
        `${i18n.__('sca')}: ${monster.sca}`;

    if (saveInFile) {
        info(`${msg}`);
    } else {
        log(`${msg}`);
    }
}

const logBag = (itemInBag) => {
    info(i18n.__('separator1'));
    info(`${i18n.__('raca')} ${itemInBag.raca}`);
    info(`${i18n.__('potion')} ${itemInBag.potion}`);
    info(`${i18n.__('ydiamond')} ${itemInBag.ydiamond}`);
    info(`${i18n.__('pdiamond')} ${itemInBag.pdiamond}`);
    info(`${i18n.__('fragment')} ${itemInBag.fragment}`);
    info(`${i18n.__('egg')} ${itemInBag.egg}`);
    info(`${i18n.__('mintable_egg')} ${itemInBag.mintableEgg}`);
}

const logResult = (metamonList) => {
    info(i18n.__('separator1'));
    info(i18n.__('summary'));
    let cN = 0, cR = 0, cSR = 0, cSSR = 0, c1 = 0, c2 = 0, c3 = 0;

    for (let i = 0; i < metamonList.length; i++) {
        const monster = metamonList[i];
        const battleLevel = getBattleLevel(monster.level);
        switch (monster.rarity) {
            case 'N':
                cN += 1; break;
            case 'R':
                cR += 1; break;
            case 'SR':
                cSR += 1; break;
            case 'SSR':
                cSSR += 1; break;
        }
        switch (battleLevel) {
            case 1:
                c1 += 1; break;
            case 2:
                c2 += 1; break;
            case 3:
                c3 += 1; break;
        }
        logMonster(monster, i, metamonList.length, true);
    }
    highlight(i18n.__('metamon_level', cN, cR, cSR, cSSR));
    highlight(i18n.__('battle_level', c1, c2, c3));

}

const error = (msg) => {
    logger.error(msg);
}
const highlight = (msg) => {
    return logger.warn(msg);
}
const info = (msg) => {
    return logger.info(msg);
}
const log = (msg) => {
    return logger.verbose(msg);
}


module.exports = {
    /** Common Util */
    delay,

    /** Util */
    setHeader,
    post,
    getPotionMapping,
    getBagMapping,
    getBattleLevel,
    // getBattleRaca,
    skipLevelUp,

    /** log */
    logMonster,
    logBag,
    logResult,
    error,
    highlight,
    info,
    log,
}
