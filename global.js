"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}

function _defineProperty(e, o, t) {
  return o in e ? Object.defineProperty(e, o, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0,
  }) : e[o] = t, e;
}

function proxy(e) {
  if (global && e in global) {
    var o = global[e];
    Object.defineProperty(global, e, {
      get: function() {
        return o;
      }, set: function(t) {
        try {
          t !== o && (localObj[e] && localObj[e].forEach(function(o) {
            "function" == typeof o.setState ? o.setState(_defineProperty({}, e, t)) : o[e] = t;
          }), o = t, this[e] = t);
        } catch (e) {
          console.log(e);
        }
      },
    });
  }
}

function clearLocal(e) {
  try {
    if ("function" == typeof e.setState) {
      var o = e.componentWillUnmount ? e.componentWillUnmount : function() {
      };
      e.componentWillUnmount = function() {
        o.call(e), e.setState = function() {
          return null;
        };
      };
    }
  } catch (e) {
    console.log(e);
  }
}

function bindData(e, o) {
  return global && e in global ? (!localObj[e] || !localObj[e] instanceof Array ? (localObj[e] = [o], clearLocal(o)) : localObj[e].push(o), proxy(e), global[e]) : (console.log(e + " key not in global"), {});
}

function setGlobal(e, o, t) {
  global && e in global ? (global[e] = o, t && t()) : console.log(e + " key not in global");
}

function getGlobal(e) {
  return global && e in global ? global[e] : (console.log(e + " key not in global"), {});
}

function setDefaultGlobal(e) {
  global || (global = e);
}

function setGlobalStorage(e, o, t) {
  try {
    "string" == typeof e && (setGlobal(e, o), localStorage.setItem("" + webVersion + (t || e), _cryptoJs2.default.AES.encrypt(JSON.stringify(o), webVersion).toString()));
  } catch (e) {
    console.log(e);
  }
}

function initGlobal() {
  var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
    o = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : defaultVersion;
  try {
    var t = JSON.stringify(o);
    webVersion !== t && (localStorage.clear(), localStorage.setItem(storageVersionKey, t), webVersion = t);
    var l = [], n = {}, a = [];
    for (var r in e) if (r.includes("__")) {
      var i = r.replace("__", "");
      n[i] = e[r], a.push(i);
    } else n[r] = e[r];
    return a.forEach(function(e) {
      l.push(new Promise(function(o, t) {
        var l = localStorage.getItem("" + webVersion + e);
        setKey(n, e, l ? _cryptoJs2.default.AES.decrypt(l, webVersion).toString(_cryptoJs2.default.enc.Utf8) : "", o);
      }));
    }), setDefaultGlobal(n), Promise.all(l);
  } catch (e) {
    console.log(e);
  }
}

function setKey(e, o, t, l) {
  if (t) try {
    e[o] = JSON.parse(t);
  } catch (l) {
    e[o] = t;
  }
  l && l(t);
}

Object.defineProperty(exports, "__esModule", { value: !0 }), exports.bindData = bindData, exports.setGlobal = setGlobal, exports.getGlobal = getGlobal, exports.setDefaultGlobal = setDefaultGlobal, exports.setGlobalStorage = setGlobalStorage, exports.initGlobal = initGlobal;
var _cryptoJs = require("crypto-js"), _cryptoJs2 = _interopRequireDefault(_cryptoJs), localObj = {}, global = null,
  storageVersionKey = "@web-gsm-version", defaultVersion = "@v1",
  webVersion = localStorage.getItem(storageVersionKey) || defaultVersion;
