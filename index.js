"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
var DESTROY_KEY = "@es_destruction_identification";
var LOCAL_CACHE = {}, GLOBAL = {}, PROXY_GLOBAL = {};
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
        var isCacheKey = function (val, key) { return key.includes(WEB_VERSION); };
        var notCacheKey = function (val, key) { return !key.includes(WEB_VERSION); };
        var noCacheDG = R.pickBy(notCacheKey);
        var changeKey = function (array) {
            var key = array[0].replace(WEB_VERSION, "");
            return [key, R.defaultTo(array[1], getLSValue_1(key))];
        };
        var getLSValue_1 = function (key) {
            var str = localStorage.getItem("" + WEB_VERSION + key);
            return str ? JSON.parse(CryptoJS.AES.decrypt(str, WEB_VERSION, {}).toString(CryptoJS.enc.Utf8)) : str;
        };
        var cacheDG = R.pipe(R.pickBy(isCacheKey), R.toPairs, R.map(changeKey), R.fromPairs);
        R.isEmpty(GLOBAL) && (GLOBAL = R.mergeAll([noCacheDG(UDG), cacheDG(UDG)]));
        console.log(GLOBAL, "GLOBAL");
        _proxyGlobal(); //TODO 在这实现总的监听事件
    }
    catch (err) {
        _consoleLog(JSON.stringify(err));
    }
}
exports.init = init;
/**
 * PROXY_GLOBAL添加代理
 */
function _proxyGlobal() {
    // @ts-ignore
    PROXY_GLOBAL = new Proxy(GLOBAL, {
        get: function (target, prop) {
            return GLOBAL[prop];
        },
        set: function (target, prop, value) {
            var _a;
            if (value !== GLOBAL[prop]) {
                target[prop] = value;
                (_a = LOCAL_CACHE[prop]) === null || _a === void 0 ? void 0 : _a.forEach(function (noticeFnc) { return noticeFnc(prop, value); });
            }
            return true;
        }
    });
}
function bindData(key, local) {
    try {
        _clearDestroyLocal(key); //清空已经被销毁的订阅者
        var noticeFnc_1 = _buildNotice(local); //先处理好noticeFnc
        R.ifElse(function () { return !LOCAL_CACHE[key]; }, function () { return LOCAL_CACHE[key] = [noticeFnc_1]; }, function () { return LOCAL_CACHE[key].push(noticeFnc_1); })();
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
        PROXY_GLOBAL[key] = value;
        callback && callback();
    }
    catch (err) {
        _consoleLog(JSON.stringify(err));
    }
}
exports.setGlobal = setGlobal;
function getGlobal(key) {
    return PROXY_GLOBAL[key];
}
exports.getGlobal = getGlobal;
function setGlobalStorage(key, value, otherKey) {
    setGlobal(key, value);
    var str = CryptoJS.enc.Utf8.parse(JSON.stringify(value));
    var encrypted = CryptoJS.AES.encrypt(str, WEB_VERSION, {});
    localStorage.setItem("" + WEB_VERSION + (otherKey || key), encrypted.toString());
}
exports.setGlobalStorage = setGlobalStorage;
function _clearDestroyLocal(key) {
    try {
        var isNotDestroy = function (l) { return !l[DESTROY_KEY]; }; //判定没有被销毁的订阅者 !false;
        LOCAL_CACHE[key] && (LOCAL_CACHE[key] = R.filter(isNotDestroy, LOCAL_CACHE[key]));
    }
    catch (err) {
        _consoleLog(JSON.stringify(err));
    }
}
function _buildNotice(local) {
    if (R.type(local) === "Array") { // react hook
        var update2reactHook_1 = function (key, newVal) {
            local[1](newVal);
            update2reactHook_1[DESTROY_KEY] = true;
        };
        return update2reactHook_1;
    }
    if (R.type(local === null || local === void 0 ? void 0 : local.setState) === "Function") { // react class
        var update2reactClass = function (key, newVal) {
            var _a;
            local["setState"]((_a = {}, _a[key] = newVal, _a));
        };
        _addDestroy(local, "componentWillUnmount", update2reactClass);
        return update2reactClass;
    }
    var update2vue = function (key, newVal) {
        local && (local[key] = newVal);
    };
    _addDestroy(local, "beforeDestroy", update2vue);
    return update2vue;
}
function _addDestroy(local, fncName, update) {
    if (!local[DESTROY_KEY]) { //如果没有添加过销毁清除
        local[DESTROY_KEY] = "Cleanup function has been added"; //添加标记
        var destroy_1 = local[fncName];
        local[fncName] = function () {
            destroy_1 && destroy_1.call(local);
            update[DESTROY_KEY] = true;
        };
    }
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
    R.ifElse(R.equals(WEB_VERSION), R.identity, clear)(version);
}
function _consoleLog(info) {
    IS_CONSOLE && console.log(info);
}
function cache(name) {
    return "" + WEB_VERSION + name;
}
exports.cache = cache;
