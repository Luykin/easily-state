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
let LOCAL_CACHE: object = {}, GLOBAL: object = {};
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
    console.log(UDG, "UDG", IS_CONSOLE);
    const isCacheKey = (val, key) => key.includes(WEB_VERSION);
    const notCacheKey = (val, key) => !key.includes(WEB_VERSION);
    const noCacheDG = R.pickBy(notCacheKey);
    const changeKey = array => {
      const key = array[0].replace(WEB_VERSION, "");
      return [key, R.defaultTo(array[1], getLSValue(key))];
    };
    const getLSValue = key => {
      const str = localStorage.getItem(`${WEB_VERSION}${key}`);
      return str ? CryptoJS.AES.decrypt(str, WEB_VERSION, {}).toString(CryptoJS.enc.Utf8) : str;
    };
    const cacheDG = R.pipe(R.pickBy(isCacheKey), R.toPairs, R.map(changeKey), R.fromPairs);
    R.isEmpty(GLOBAL) && (GLOBAL = R.mergeAll([noCacheDG(UDG), cacheDG(UDG)]));
  } catch (err) {
    _consoleLog(JSON.stringify(err));
  }
}

/**
 * 给每个key添加代理
 * @param key
 */
function _proxy(key: string) {
  try {
    let val = GLOBAL[key];
    Object.defineProperty(GLOBAL, key, {
      set: function(newVal) {  //通知各个订阅者，支持[react class / hook] [vue2 / 3]
        if (newVal !== val && LOCAL_CACHE[key]) {
          console.log(LOCAL_CACHE[key], "xx");
          LOCAL_CACHE[key].forEach((noticeFnc) => noticeFnc(key, newVal));
          val = newVal;
          this[key] = newVal;
        }
      }
    });
  } catch (err) {
    _consoleLog(JSON.stringify(err));
  }
}

export function bindData(key: string, local: any) {
  try {
    console.log("????");
    _clearDestroyLocal(key);//清空已经被销毁的订阅者
    const noticeFnc = _buildNotice(local); //先处理好noticeFnc
    R.ifElse(() => !(LOCAL_CACHE[key]), () => LOCAL_CACHE[key] = [noticeFnc], () => LOCAL_CACHE[key].push(noticeFnc))();
    _proxy(key);
    _wrapDestroy(local);
    console.log(R.type(local) === "Array" && local?.length === 2, "a");
    return R.ifElse(() => R.type(local) === "Array" && local?.length === 2, () => [GLOBAL[key] || local[0], local[1]], () => GLOBAL[key])();
  } catch (err) {
    _consoleLog(JSON.stringify(err));
    return null;
  }
}

export function setGlobal(key: string, value: any, callback?) {
  try {
    GLOBAL[key] = value;
    console.log(key, GLOBAL);
    callback && callback();
  } catch (err) {
    console.log(err);
    _consoleLog(JSON.stringify(err));
  }
}

export function getGlobal(key: string) {
  return GLOBAL[key];
}

export function setGlobalStorage(key: string, value: any, otherKey?: string) {
  setGlobal(key, value);
  localStorage.setItem(otherKey || key, JSON.stringify(value));
}

function _clearDestroyLocal(key: string) {
  try {
    const isNotDestroy = l => !l[LSV_KEY]; //判定没有被销毁的订阅者 !false;
    R.ifElse(R.isEmpty(LOCAL_CACHE[key]), R.identity, () => (LOCAL_CACHE[key] = R.filter(isNotDestroy, LOCAL_CACHE[key])))(key);
  } catch (err) {
    _consoleLog(JSON.stringify(err));
  }
}

function _wrapDestroy(local: any) {
  try {
    if (R.type(local) === "Array") return;
    if (R.type(local?.setState) === "Function") { //组件销毁
      local.componentWillUnmount = () => {
        local?.componentWillUnmount.call(local);
        local[LSV_KEY] = true;
      };
      return;
    }
    local.beforeDestroy = () => { //vue2 TODO vue3 onUnmounted
      local?.beforeDestroy.call(local);
      local[LSV_KEY] = true;
    };
  } catch (err) {
    _consoleLog(JSON.stringify(err));
  }
}

function _buildNotice(local: any) {
  const isDestroy = local[LSV_KEY];
  if (R.type(local) === "Array") { // react hook
    return (key, newVal) => { //拿不到hook数组就清理local list
      console.log("执行 Array");
      R.ifElse(R.always(!isDestroy && local?.length), local[1], () => local[LSV_KEY] = true)(newVal);
    };
  }
  if (R.type(local?.setState) === "Function") { // react class
    console.log("执行 Function");
    return (key, newVal) => !isDestroy && local["setState"]({[key]: newVal});
  }
  return (key, newVal) => !isDestroy && local && (local[key] = newVal); //vue 2/3
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
  console.log(version, WEB_VERSION);
  R.ifElse(R.equals(WEB_VERSION), R.identity, clear)(version);
}

function _consoleLog(info: string) {
  IS_CONSOLE && console.log(info);
}

export function cache(name: string) {
  return `${WEB_VERSION}${name}`;
}

// export const init = init;
// export default {
//   init,
//   cache,
//   bindData,
//   setGlobal,
//   getGlobal,
//   setGlobalStorage
// };
