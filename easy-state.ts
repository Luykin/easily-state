import * as R from "ramda";
import * as CryptoJS from "crypto-js";

/**
 * 定义全局变量
 * LOCAL_CACHE 存储所有监听环境 //TODO 清空无用缓存
 * GLOBAL 存储全局变量
 * WEB_VERSION 网站版本
 * LSV_KEY localStorage中的版本key
 * DFT_VERSION 默认版本
 */
let DFT_VERSION = "@VERSION_BATE";
let LSV_KEY = "@WEB_VERSION_EASY_STATE";
let WEB_VERSION = R.defaultTo(DFT_VERSION, localStorage.getItem(LSV_KEY));
let LOCAL_CACHE, GLOBAL, IS_CONSOLE = null;


/**
 * 初始化localStorage到全局环境
 */
function init(group: Array<object>, config: { version: String, console: Boolean }) {
  try {
    IS_CONSOLE = Boolean(config?.console);
    _checkVS(config?.version);
    const UDG = R.mergeAll(group); // un formatted default global data 未格式化初始数据
    const isCacheKey = (val, key) => key.includes(WEB_VERSION);
    const noCacheDG = R.pickBy(!isCacheKey);
    const changeKey = array => {
      const key = array[0].replace(WEB_VERSION, "");
      return [key, R.default(array[1], getLSValue(key))];
    };
    const getLSValue = key => CryptoJS.AES.decrypt(localStorage.getItem(`${WEB_VERSION}${key}`), WEB_VERSION, {}).toString(CryptoJS.enc.Utf8);
    const cacheDG = R.pipe(R.pickBy(isCacheKey), R.toPairs, R.map(changeKey), R.fromPairs);
    !GLOBAL && (GLOBAL = R.mergeAll([noCacheDG(UDG), cacheDG(UDG)]));
  } catch (err) {
    _consoleLog(JSON.stringify(err));
  }
}

function proxy(key) {
  try {
    const setFuc = (newValue) => {}
    Object.defineProperty(GLOBAL, key, {
      set: setFuc
    });
  } catch (err) {
    _consoleLog(JSON.stringify(err));
  }
}

/**
 * 判断版本,新版本：清空localStorage,重置版本号
 */
function _checkVS(version: String) {
  const clear = (v) => {
    localStorage.clear();
    localStorage.setItem(LSV_KEY, v);
    WEB_VERSION = v;
  };
  R.ifElse(R.equals(WEB_VERSION), clear, R.identity)(version);
}

function _consoleLog(info: String) {
  IS_CONSOLE && console.log(info);
}

function cache(name: String) {
  return `${WEB_VERSION}${name}`;
}

export default {
  init,
  cache,
};
