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
let LOCAL_CACHE, GLOBAL: object = {};
let IS_CONSOLE: boolean = false;
let WEB_VERSION: string = R.defaultTo(DFT_VERSION, localStorage.getItem(LSV_KEY));


/**
 * 初始化localStorage到全局环境
 */
export function init(group: Array<object> | object, config?: { version: string, console: boolean }) {
  try {
    IS_CONSOLE = Boolean(config?.console);
    _checkVS(config?.version);
    const UDG = R.ifElse(() => R.type(group) === "Array", R.mergeAll, R.always)(group); // un formatted default global data 未格式化初始数据
    console.log(UDG, "UDG");
    const isCacheKey = (val, key) => key.includes(WEB_VERSION);
    const noCacheDG = R.pickBy(!isCacheKey);
    const changeKey = array => {
      const key = array[0].replace(WEB_VERSION, "");
      return [key, R.default(array[1], getLSValue(key))];
    };
    const getLSValue = key => CryptoJS.AES.decrypt(localStorage.getItem(`${WEB_VERSION}${key}`), WEB_VERSION, {}).toString(CryptoJS.enc.Utf8);
    const cacheDG = R.pipe(R.pickBy(isCacheKey), R.toPairs, R.map(changeKey), R.fromPairs);
    console.log(noCacheDG(UDG), cacheDG(UDG), "cacheDG(UDG)");
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
        const noticeAll = R.pipe(LOCAL_CACHE[key].forEach((noticeFnc) => noticeFnc(key, newVal)), () => (this[key] = newVal));
        R.ifElse(R.equals(val), R.identity, noticeAll)(newVal);
      }
    });
  } catch (err) {
    _consoleLog(JSON.stringify(err));
  }
}

export function bindData(key: string, local: any) {
  try {
    _clearDestroyLocal(key);//清空已经被销毁的订阅者
    const noticeFnc = _buildNotice(local); //先处理好noticeFnc
    R.ifElse(R.isEmpty(LOCAL_CACHE?.key), () => LOCAL_CACHE[key] = [noticeFnc], () => LOCAL_CACHE[key].push(noticeFnc))();
    _proxy(local);
    _wrapDestroy(local);
  } catch (err) {
    _consoleLog(JSON.stringify(err));
    return null;
  }
}

export function setGlobal(key: string, value: any, callback?) {
  try {
    GLOBAL[key] = value;
    callback && callback();
  } catch (err) {
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
    R.ifElse(R.isEmpty(LOCAL_CACHE[key]), R.identity, () => (LOCAL_CACHE[key] = R.filter(isNotDestroy, LOCAL_CACHE[key])))();
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
      R.ifElse(!isDestroy && local?.length, () => local[1](newVal), () => local[LSV_KEY] = true)();
    };
  }
  if (R.type(local?.setState) === "Function") { // react class
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
