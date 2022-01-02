const path = require('path');
const i18n = require('i18n');
const util = require('./service/utils');
const requests = require('./service/requests');
const settings = require('./settings');

/************************* Setup *************************/
let metamonList = [];
let racaTotal = 0;
let noRaca = false;

/**
 * configure language shared state
 */
i18n.configure({
    locales: ['en', 'cn'],
    defaultLocale: 'en',
    directory: path.join(__dirname, './language')
});
// Set default language
i18n.setLocale(settings.language);


/************************* Function *************************/
const login = async () => {
    const res = await util.post(requests.login());
    util.setHeader(res);
};

const getMetamons = async () => {
    const res = await util.post(requests.getMyMonsterList());
    metamonList = res.metamonList;
};

const getBag = async () => {
    const res = await util.post(requests.checkBag());
    const itemInBag = {};

    for (let item of res.item) {
        const key = util.getBagMapping(item.bpType);
        itemInBag[key] = item.bpNum;
    }
    itemInBag.mintableEgg = parseInt(itemInBag.fragment / 1000);
    racaTotal = itemInBag.raca;

    return itemInBag;
}

const check = async () => {
    const itemInBag = await getBag();
    util.logBag(itemInBag);
    util.info(`${i18n.__('metamon')} ${metamonList.length}`);
}

const getBattleMonster = async (monster, battleLevel) => {
    const res = await util.post(requests.getRivalList(monster, battleLevel));
    const monList = res.objects;
    monList.sort((a, b) => a.sca - b.sca);
    const rival = monList[0];

    util.log(i18n.__('select_rival', rival.tokenId, rival.sca));
    return rival;
}

const updateMonster = async (monster) => {
    util.log(i18n.__('try_level_up'));

    const itemInBag = await getBag();
    const potion = util.getPotionMapping(monster.rarity);

    if (itemInBag[potion] > 0) {
        await util.post(requests.updateMonster(monster));
        await util.delay(1);
        util.info(i18n.__('level_up', monster.level + 1));
        return 1;
    } else {
        util.highlight(`${i18n.__(potion)}${i18n.__('not_enough')}`);
        return 0;
    }
}

const setSelectedMonster = async (monster) => {
    await util.post(requests.setSelectedMonster(monster));
    await util.delay(1);
    util.info(i18n.__('selected', `#${monster.tokenId}`));
}

const getSelectedMonster = async () => {
    const res = await util.post(requests.getSelectedMonster());
    return res.monster;
};

const getBattleRaca = async (battleLevel) => {
    const res = await util.post(requests.getSelectedMonster());
    switch (battleLevel) {
        case 1:
            return res.battle_fee_1;
            break;
        case 2:
            return res.battle_fee_2;
            break;
        case 3:
            return res.battle_fee_3;
            break;
    }
};

const battle = async (monster, index) => {
    let tear = monster.tear;
    let exp = monster.exp;
    let level = monster.level;

    let battleLevel = util.getBattleLevel(level);
    let racaCost = await getBattleRaca(battleLevel);
    let battle = 0;
    let win = 0;
    let lose = 0;
    let fragment = 0;
    let updateResult = 1;
    const skipLevelUp = util.skipLevelUp(level, monster.tokenId);

    if (racaTotal < racaCost) {
        util.highlight(`${i18n.__("raca")}${i18n.__("not_enough")}`);
        noRaca = true;
        return;
    }

    if (tear == 0) {
        // util.log(`${index + 1}/${metamonList.length} #${monster.tokenId}: ${i18n.__("energy")}${i18n.__("use_up")}`);
        return;
    }

    util.info(i18n.__('separator2'));
    await setSelectedMonster(monster);
    util.logMonster(monster, index, metamonList.length);

    let rival = await getBattleMonster(monster, battleLevel);

    while (true) {
        if (racaTotal < racaCost) {
            util.highlight(`${i18n.__("raca")}${i18n.__("not_enough")}`);
            noRaca = true;
            break;
        }

        if (tear == 0) {
            util.log(`${i18n.__("energy")}${i18n.__("use_up")}`);
            break;
        }

        if (exp < monster.expMax || skipLevelUp) {
            const res = await util.post(requests.startBattle(monster, rival, battleLevel));
            await util.delay(1);

            battle += 1;
            exp += res.challengeExp;
            tear -= 1;
            racaTotal -= racaCost;
            fragment += res.bpFragmentNum;

            if (res.challengeResult) {
                win += 1;
                util.log(i18n.__('win', battle, res.bpFragmentNum));
            } else {
                lose += 1;
                util.log(i18n.__('lose', battle, res.bpFragmentNum));
            }

        } else {
            updateResult = await updateMonster(monster);
            if (updateResult) {
                level += 1;
                exp = 0;
                battleLevel = util.getBattleLevel(level);
                racaCost = await getBattleRaca(battleLevel);
                rival = await getBattleMonster(monster, battleLevel);
            } else {
                break;
            }
        }
    }
    util.info(i18n.__('battle_result', battle, win, lose, fragment));

    const updatedMonster = await getSelectedMonster();
    util.logMonster(updatedMonster, index, metamonList.length);
}

const battleAll = async () => {
    util.info(i18n.__('separator1'));
    for (let i = 0; i < metamonList.length; i++) {
        if (noRaca) {
            util.highlight(`${i18n.__("raca")}${i18n.__("not_enough")}`);
            break;
        }
        await battle(metamonList[i], i);
    }
}

const composeEgg = async () => {
    util.info(i18n.__('separator1'));
    util.log(i18n.__('try_compose_egg'));

    const itemInBag = await getBag();
    const number = itemInBag.mintableEgg;
    if (number > 0) {
        await util.post(requests.composeEgg());
        await util.delay(1);
    }
    util.highlight(i18n.__n('compose_egg', number));
}

const openEgg = async (number) => {
    util.info(i18n.__('separator1'));

    const itemInBag = await getBag();
    number = Math.min(number, itemInBag.egg);

    const eggs = {};

    let cPotion = 0, cYDiamond = 0, cPDiamond = 0, cN = 0, cR = 0, cSR = 0, cSSR = 0, cUnknow = 0;

    for (let i = 0; i < number; i++) {
        const res = await util.post(requests.openEgg());
        await util.delay(1);

        if (res.category === 'Metamon') {
            switch (res.rarity) {
                case 'N':
                    cN += 1;
                    break;
                case 'R':
                    cR += 1;
                    break;
                case 'SR':
                    cSR += 1;
                    break;
                case 'SSR':
                    cSSR += 1;
                    break;
            }
            util.info(`${res.tokenId} ${res.rarity} ${i18n.__n('metamon')}`);
        } else {
            if (eggs[res.category]) {
                eggs[res.category] += res.amount;
            } else {
                eggs[res.category] = res.amount;
            }
            util.info(`${i18n.__(res.category.toLowerCase())} ${res.amount}`);
        }
    }
    util.info(i18n.__('separator1'));
    util.info(i18n.__('summary'));
    util.highlight(i18n.__n('open_egg', number));
    if (number > 0) {
        for (let k in eggs) {
            util.highlight(`${i18n.__(k.toLowerCase())}: ${eggs[k]} `);
        }
    }
}


/************************* Run *************************/
const run = async () => {
    util.info(i18n.__('start'));
    await login();
    await getMetamons();
    if (metamonList.length) {
        await check();
        if (!settings.skipBattle) {
            await battleAll();
        }
        await composeEgg();
        await openEgg(settings.openEgg);
        await getMetamons();
        util.logResult(metamonList);
    }
    await check();
    util.info(i18n.__('enjoy'));
};
run();
