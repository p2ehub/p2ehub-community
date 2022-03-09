const util = require('./utils');
const settings = require('../settings');


/************************* Settings *************************/
const baseData = { address: settings.address };
const API_URL = 'https://metamon-api.radiocaca.com/usm-api';


/************************* Request *************************/
const login = () => {
    return {
        url: `${API_URL}/login`,
        data: { ...baseData, sign: settings.sign, msg: settings.msg, network: 1, clientType: "MetaMask" },
        skipHeader: true
    }
}

const getMyMonsterList = () => {
    return {
        url: `${API_URL}/getWalletPropertyList`,
        data: { ...baseData, page: '1', pageSize: settings.metamonCount }
    }
}

const checkBag = () => {
    return {
        url: `${API_URL}/checkBag`,
        data: baseData
    }
}

const setSelectedMonster = (monster) => {
    return {
        url: `${API_URL}/isFightMonster`,
        data: { ...baseData, metamonId: monster.id }
    }
}

const getSelectedMonster = () => {
    return {
        url: `${API_URL}/getFightMonster`,
        data: baseData
    }
}

const getRivalList = (monster, battleLevel) => {
    return {
        url: `${API_URL}/getBattelObjects`,
        data: { ...baseData, metamonId: monster.id, front: battleLevel }
    }
}

const startBattle = (monster, rival, battleLevel) => {
    return {
        url: `${API_URL}/startBattle`,
        data: { ...baseData, battleLevel: battleLevel, monsterA: monster.id, monsterB: rival.id }
    }
}

const updateMonster = (monster) => {
    return {
        url: `${API_URL}/updateMonster`,
        data: { ...baseData, nftId: monster.id }
    }
}

const composeEgg = () => {
    return {
        url: `${API_URL}/composeMonsterEgg`,
        data: baseData
    }
}

const openEgg = () => {
    return {
        url: `${API_URL}/openMonsterEgg`,
        data: baseData
    }
}


module.exports = {
    login,
    getMyMonsterList,
    checkBag,
    setSelectedMonster,
    getSelectedMonster,
    getRivalList,
    startBattle,
    updateMonster,
    composeEgg,
    openEgg,
}

