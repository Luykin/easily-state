"use strict";
exports.__esModule = true;
exports.cache = exports.setGlobalStorage = exports.getGlobal = exports.setGlobal = exports.bindData = exports.init = void 0;
var R = require("ramda");
var CryptoJS = require("crypto-js");
/**
 * 定义全局变量
 * LOCAL_CACHE 存储所有监听环境 //TODO 清空无用缓存
 * GLOBAL 存储全局变量
 * WEB_VERSION 网站版本
 * LSV_KEY localStorage中的版本key
 * DFT_VERSION 默认版本
 */
var DFT_VERSION = "@VERSION_BATE@";
var LSV_KEY = "@WEB_VERSION_EASY_STATE@";
var LOCAL_CACHE = {}, GLOBAL = {};
var IS_CONSOLE = false;
var WEB_VERSION = R.defaultTo(DFT_VERSION, localStorage.getItem(LSV_KEY));
/**
 * 初始化localStorage到全局环境
 */
function init(group, config) {
    try {
        IS_CONSOLE = Boolean(config === null || config === void 0 ? void 0 : config.console);
        _checkVS(config === null || config === void 0 ? void 0 : config.version);
        var UDG = R.type(group) === "Array" ? R.mergeAll(group) : group; // un formatted default global data 未格式化初始数据
        console.log(UDG, "UDG", IS_CONSOLE);
        var isCacheKey = function (val, key) { return key.includes(WEB_VERSION); };
        var notCacheKey = function (val, key) { return !key.includes(WEB_VERSION); };
        var noCacheDG = R.pickBy(notCacheKey);
        var changeKey = function (array) {
            var key = array[0].replace(WEB_VERSION, "");
            return [key, R.defaultTo(array[1], getLSValue_1(key))];
        };
        var getLSValue_1 = function (key) {
            var str = localStorage.getItem("" + WEB_VERSION + key);
            return str ? CryptoJS.AES.decrypt(str, WEB_VERSION, {}).toString(CryptoJS.enc.Utf8) : str;
        };
        var cacheDG = R.pipe(R.pickBy(isCacheKey), R.toPairs, R.map(changeKey), R.fromPairs);
        R.isEmpty(GLOBAL) && (GLOBAL = R.mergeAll([noCacheDG(UDG), cacheDG(UDG)]));
    }
    catch (err) {
        _consoleLog(JSON.stringify(err));
    }
}
exports.init = init;
/**
 * 给每个key添加代理
 * @param key
 */
function _proxy(key) {
    try {
        var val_1 = GLOBAL[key];
        Object.defineProperty(GLOBAL, key, {
            set: function (newVal) {
                if (newVal !== val_1 && LOCAL_CACHE[key]) {
                    console.log(LOCAL_CACHE[key], "xx");
                    LOCAL_CACHE[key].forEach(function (noticeFnc) { return noticeFnc(key, newVal); });
                    val_1 = newVal;
                    this[key] = newVal;
                }
            }
        });
    }
    catch (err) {
        _consoleLog(JSON.stringify(err));
    }
}
function bindData(key, local) {
    try {
        console.log("????");
        _clearDestroyLocal(key); //清空已经被销毁的订阅者
        var noticeFnc_1 = _buildNotice(local); //先处理好noticeFnc
        R.ifElse(function () { return !(LOCAL_CACHE[key]); }, function () { return LOCAL_CACHE[key] = [noticeFnc_1]; }, function () { return LOCAL_CACHE[key].push(noticeFnc_1); })();
        _proxy(key);
        _wrapDestroy(local);
        console.log(R.type(local) === "Array" && (local === null || local === void 0 ? void 0 : local.length) === 2, "a");
        return R.ifElse(function () { return R.type(local) === "Array" && (local === null || local === void 0 ? void 0 : local.length) === 2; }, function () { return [GLOBAL[key] || local[0], local[1]]; }, function () { return GLOBAL[key]; })();
    }
    catch (err) {
        _consoleLog(JSON.stringify(err));
        return null;
    }
}
exports.bindData = bindData;
function setGlobal(key, value, callback) {
    try {
        GLOBAL[key] = value;
        console.log(key, GLOBAL);
        callback && callback();
    }
    catch (err) {
        console.log(err);
        _consoleLog(JSON.stringify(err));
    }
}
exports.setGlobal = setGlobal;
function getGlobal(key) {
    return GLOBAL[key];
}
exports.getGlobal = getGlobal;
function setGlobalStorage(key, value, otherKey) {
    setGlobal(key, value);
    localStorage.setItem(otherKey || key, JSON.stringify(value));
}
exports.setGlobalStorage = setGlobalStorage;
function _clearDestroyLocal(key) {
    try {
        var isNotDestroy_1 = function (l) { return !l[LSV_KEY]; }; //判定没有被销毁的订阅者 !false;
        R.ifElse(R.isEmpty(LOCAL_CACHE[key]), R.identity, function () { return (LOCAL_CACHE[key] = R.filter(isNotDestroy_1, LOCAL_CACHE[key])); })(key);
    }
    catch (err) {
        _consoleLog(JSON.stringify(err));
    }
}
function _wrapDestroy(local) {
    try {
        if (R.type(local) === "Array")
            return;
        if (R.type(local === null || local === void 0 ? void 0 : local.setState) === "Function") { //组件销毁
            local.componentWillUnmount = function () {
                local === null || local === void 0 ? void 0 : local.componentWillUnmount.call(local);
                local[LSV_KEY] = true;
            };
            return;
        }
        local.beforeDestroy = function () {
            local === null || local === void 0 ? void 0 : local.beforeDestroy.call(local);
            local[LSV_KEY] = true;
        };
    }
    catch (err) {
        _consoleLog(JSON.stringify(err));
    }
}
function _buildNotice(local) {
    var isDestroy = local[LSV_KEY];
    if (R.type(local) === "Array") { // react hook
        return function (key, newVal) {
            console.log("执行 Array");
            R.ifElse(R.always(!isDestroy && (local === null || local === void 0 ? void 0 : local.length)), local[1], function () { return local[LSV_KEY] = true; })(newVal);
        };
    }
    if (R.type(local === null || local === void 0 ? void 0 : local.setState) === "Function") { // react class
        console.log("执行 Function");
        return function (key, newVal) {
            var _a;
            return !isDestroy && local["setState"]((_a = {}, _a[key] = newVal, _a));
        };
    }
    return function (key, newVal) { return !isDestroy && local && (local[key] = newVal); }; //vue 2/3
}
/**
 * 判断版本,新版本：清空localStorage,重置版本号
 */
function _checkVS(version) {
    if (version === void 0) { version = DFT_VERSION; }
    var clear = function (v) {
        localStorage.clear();
        localStorage.setItem(LSV_KEY, v);
        WEB_VERSION = v;
    };
    console.log(version, WEB_VERSION);
    R.ifElse(R.equals(WEB_VERSION), R.identity, clear)(version);
}
function _consoleLog(info) {
    IS_CONSOLE && console.log(info);
}
function cache(name) {
    return "" + WEB_VERSION + name;
}
exports.cache = cache;
// export const init = init;
// export default {
//   init,
//   cache,
//   bindData,
//   setGlobal,
//   getGlobal,
//   setGlobalStorage
// };