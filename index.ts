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
let DFT_VERSION: string = "@VERSION_BATE@";
let LSV_KEY: string = "@WEB_VERSION_EASY_STATE@";
let DESTROY_KEY: string = "@es_destruction_identification";
let LOCAL_CACHE: object = {}, GLOBAL: object = {}, PROXY_GLOBAL: object = {};
let IS_CONSOLE: boolean = false;
let WEB_VERSION: string = R.defaultTo(DFT_VERSION, localStorage.getItem(LSV_KEY));


/**
 * 初始化localStorage到全局环境
 */
export function init(group: Array<object> | object, config?: { version: string, console: boolean }) {
  try {
    IS_CONSOLE = Boolean(config?.console);
    _checkVS(config?.version);
    const UDG = R.type(group) === "Array" ? R.mergeAll(group) : group; // un formatted default global data 未格式化初始数据
    const isCacheKey = (val, key) => key.includes(WEB_VERSION);
    const notCacheKey = (val, key) => !key.includes(WEB_VERSION);
    const noCacheDG = R.pickBy(notCacheKey);
    const changeKey = array => {
      const key = array[0].replace(WEB_VERSION, "");
      return [key, R.defaultTo(array[1], getLSValue(key))];
    };
    const getLSValue = key => {
      const str = localStorage.getItem(`${WEB_VERSION}${key}`);
      return str ? JSON.parse(CryptoJS.AES.decrypt(str, WEB_VERSION, {}).toString(CryptoJS.enc.Utf8)) : str;
    };
    const cacheDG = R.pipe(R.pickBy(isCacheKey), R.toPairs, R.map(changeKey), R.fromPairs);
    R.isEmpty(GLOBAL) && (GLOBAL = R.mergeAll([noCacheDG(UDG), cacheDG(UDG)]));
    console.log(GLOBAL, "GLOBAL");
    _proxyGlobal();//TODO 在这实现总的监听事件
  } catch (err) {
    _consoleLog(JSON.stringify(err));
  }
}

/**
 * PROXY_GLOBAL添加代理
 */
function _proxyGlobal() {
  // @ts-ignore
  PROXY_GLOBAL = new Proxy(GLOBAL, {
    get: function(target, prop) {
      return GLOBAL[prop];
    },
    set: function(target, prop, value) {
      if (value !== GLOBAL[prop]) {
        target[prop] = value;
        LOCAL_CACHE[prop]?.forEach((noticeFnc) => noticeFnc(prop, value));
      }
      return true;
    }
  });
}

export function bindData(key: string, local: any) {
  try {
    _clearDestroyLocal(key);//清空已经被销毁的订阅者
    const noticeFnc = _buildNotice(local); //先处理好noticeFnc
    R.ifElse(() => !LOCAL_CACHE[key], () => LOCAL_CACHE[key] = [noticeFnc], () => LOCAL_CACHE[key].push(noticeFnc))();
    return R.ifElse(() => R.type(local) === "Array" && local?.length === 2, () => [GLOBAL[key] || local[0], local[1]], () => GLOBAL[key])();
  } catch (err) {
    _consoleLog(JSON.stringify(err));
    return null;
  }
}

export function setGlobal(key: string, value: any, callback?) {
  try {
    PROXY_GLOBAL[key] = value;
    callback && callback();
  } catch (err) {
    _consoleLog(JSON.stringify(err));
  }
}

export function getGlobal(key: string) {
  return PROXY_GLOBAL[key];
}

export function setGlobalStorage(key: string, value: any, otherKey?: string) {
  setGlobal(key, value);
  let str = CryptoJS.enc.Utf8.parse(JSON.stringify(value));
  let encrypted = CryptoJS.AES.encrypt(str, WEB_VERSION, {});
  localStorage.setItem(`${WEB_VERSION}${otherKey || key}`, encrypted.toString());
}

function _clearDestroyLocal(key: string) {
  try {
    const isNotDestroy = l => !l[DESTROY_KEY]; //判定没有被销毁的订阅者 !false;
    LOCAL_CACHE[key] && (LOCAL_CACHE[key] = R.filter(isNotDestroy, LOCAL_CACHE[key]));
  } catch (err) {
    _consoleLog(JSON.stringify(err));
  }
}

function _buildNotice(local: any) {
  if (R.type(local) === "Array") { // react hook
    const update2reactHook = function(key, newVal) {
      local[1](newVal);
      update2reactHook[DESTROY_KEY] = true;
    };
    return update2reactHook;
  }
  if (R.type(local?.setState) === "Function") { // react class
    const update2reactClass = function(key, newVal) {
      local["setState"]({[key]: newVal});
    };
    _addDestroy(local, "componentWillUnmount", update2reactClass);
    return update2reactClass;
  }
  const update2vue = function(key, newVal) { //vue 2/3
    local && (local[key] = newVal);
  };
  _addDestroy(local, "beforeDestroy", update2vue);
  return update2vue;
}

function _addDestroy(local: any, fncName: string, update?) {
  if (!local[DESTROY_KEY]) { //如果没有添加过销毁清除
    local[DESTROY_KEY] = "Cleanup function has been added";//添加标记
    const destroy = local[fncName];
    local[fncName] = () => {
      destroy && destroy.call(local);
      update[DESTROY_KEY] = true;
    };
  }
}

/**
 * 判断版本,新版本：清空localStorage,重置版本号
 */
function _checkVS(version: string = DFT_VERSION) {
  const clear = (v) => {
    localStorage.clear();
    localStorage.setItem(LSV_KEY, v);
    WEB_VERSION = v;
  };
  R.ifElse(R.equals(WEB_VERSION), R.identity, clear)(version);
}

function _consoleLog(info: string) {
  IS_CONSOLE && console.log(info);
}

export function cache(name: string) {
  return `${WEB_VERSION}${name}`;
}
