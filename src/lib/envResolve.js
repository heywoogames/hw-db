"use strict";

const ENV_PREFIX = "ENV_HW_";

/**
 * 解析单个字段的 ENV 引用
 * @param {string} fieldName - 字段名 (host/port/username/password)
 * @param {*} value - 配置值
 * @returns {*} 解析后的值（未匹配前缀则原样返回）
 */
function resolveEnvField(fieldName, value) {
  if (typeof value !== "string" || !value.startsWith(ENV_PREFIX)) {
    return value;
  }

  const envVal = process.env[value];

  if (envVal === undefined) {
    throw new Error(`数据库配置 [${fieldName}]: 环境变量 ${value} 未设置 (配置值: ${value})`);
  }

  if (fieldName === "port") {
    const portNum = Number(envVal);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      throw new Error(
        `数据库配置 [port]: 环境变量 ${value} 的值 "${envVal}" 不是有效的端口号 (1-65535)`,
      );
    }
    return portNum;
  }

  return envVal;
}

/**
 * 解析数据库配置中的 ENV 引用（原地修改 cfg）
 * @param {import('../../index').DialectCfg} cfg - 数据库配置
 */
function resolveEnvCfg(cfg) {
  const fields = ["host", "port", "username", "password"];
  for (const field of fields) {
    if (cfg[field] !== undefined) {
      cfg[field] = resolveEnvField(field, cfg[field]);
    }
  }
}

module.exports = { resolveEnvCfg };
