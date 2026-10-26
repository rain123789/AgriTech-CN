/**
 * jsdom 加载器：优先用项目/全局安装的 jsdom，
 * 找不到时回退到 WorkBuddy 托管 node 环境的 node_modules。
 */
"use strict";
const path = require("path");
const os = require("os");
const fs = require("fs");

function loadJsdom() {
  try {
    return require("jsdom");
  } catch (e) {
    /* 继续尝试回退路径 */
  }
  const candidates = [
    path.join(os.homedir(), ".workbuddy", "binaries", "node", "workspace", "node_modules", "jsdom"),
    path.join(__dirname, "..", "node_modules", "jsdom"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return require(candidate);
  }
  throw new Error(
    "未找到 jsdom。请先安装：npm install -D jsdom（或 npm install jsdom）"
  );
}

module.exports = loadJsdom;
