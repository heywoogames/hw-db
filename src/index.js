"use strict";

const { HwPluginBase } = require("@heywoogames/hw-base");
const { AdapterMgr } = require("./lib/adapterMgr");
const { Sequelize, Model, DataTypes, QueryTypes, Op, literal } = require("@sequelize/core");

function capitalizeFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 *
 * @typedef {object} ModelItem
 * @property {typeof Model} mo - 模型实例
 */

/**
 * @typedef { import('@types').AddRecordRet } AddRecordRet
 */

/**
 * @class
 */
class HwDbCli extends HwPluginBase {
  constructor(app, info) {
    super(app, info);

    /** @type {import('../index').HwDBCfg} */
    this.cfg = null;

    /** @type {AdapterMgr} */
    this._adaMgr = new AdapterMgr(this);

    /**
     * @type {string[]}
     * - 要使用的数据库实例名称列表
     */
    this.useDb = [];

    if (Array.isArray(info?.extCfg?.useDb)) {
      this.useDb = info.extCfg.useDb;
    }
  }

  /**
   *
   * @param {Record<string, import('@types').DialectCfg>} dbs - 数据库配置
   */
  #initDBCfg(dbs) {
    if (dbs) {
      this._adaMgr.initDBCfg(dbs);
    }
  }

  async init() {
    this.cfg = await this.getConfig();
    this.cfg.useTablePartition = this.cfg?.useTablePartition === true;

    /** @type {Record<string, import('@types').DialectCfg>} */
    let dbs = {};
    if (this.useDb.length > 0) {
      for (const it of this.useDb) {
        if (this.cfg.db[it]) {
          const dbCfg = this.cfg.db[it];
          dbCfg.enable = true;
          dbs[it] = dbCfg;
        }
      }
    } else {
      dbs = this.cfg.db;
    }

    this.#initDBCfg(dbs);
  }

  /** 根据db名字，获取DB实例
   *
   * @param {string} dbInsName db 实例名称
   * @returns { import('@types').Sequelize | null }
   */
  getDBIns(dbInsName) {
    return this._adaMgr.getDBIns(dbInsName);
  }

  /** 根据db名字，非Sequelize托管的DB实例
   *
   * @param {string} dbInsName db 实例名称
   * @returns { import('@types').DBFree | null }
   */
  getDBInsFree(dbInsName) {
    // @ts-ignore
    return this._adaMgr.getDBIns(dbInsName);
  }

  /**
   * 设置日志级别
   * @param {string} dbInsName db 实例名称
   * @param {number} lv - 日志级别
   */
  setlogging(dbInsName, lv) {
    const m = this._adaMgr.dbNameMap[dbInsName];
    if (m !== undefined) {
      m.adaIns.setlogging(dbInsName, lv);
    }
  }

  get useTablePartition() {
    return this.cfg.useTablePartition;
  }

  /**
   *
   * @param {string} tbName 表名字
   * @returns { import('@types').ModelX | null }
   */
  getModelByTbName(tbName) {
    return this._adaMgr.getModelByTbName(tbName);
  }

  async afterInitAll() {}

  async beforeStartAll() {
    this._adaMgr.normalizeCfg();
  }

  async start() {
    await this._adaMgr.start();
    await this._adaMgr.testConn();

    // 挂载模型

    /** @type {string[]} */
    const dbImport = [];

    /** @type {string[]} */
    const dbExport = [];

    /** @type {string[]} */
    const dbDef = [];
    const models = this.getModels();
    for (let modelName in models) {
      if (modelName.split(".").length > 1) continue;

      const capName = capitalizeFirstLetter(modelName);
      const capNameT = capName.endsWith("Model") ? capName : `${capName}Model`;
      const modNameT = `_mo${capName}`;
      // @ts-ignore
      const modIns = this.getModelByTbName(modelName);
      if (modIns === null) {
        this.app.logger.error(`model [${modelName}] not found,please check dbmoels directory`);
        process.exit(1);
      }

      if (this.app.cmdOpts.api_doc === true) {
        let v = models[modelName];
        // @ts-ignore
        let path = v.mo.path;
        // @ts-ignore
        if (v.path.length > 0 && v.path.startsWith(this.app.env.PROJ_PATH)) {
          // @ts-ignore
          const pathT = v.path.substring(this.app.env.PROJ_PATH.length + 1).replace(/\\/g, "/");
          path = pathT;
        }

        dbImport.push(`import { ${capName} as ${capNameT} } from "${path}";`);
        dbExport.push(`  ${capNameT},`);
        dbDef.push(`    ${modNameT}: typeof ${capNameT};`);
      }

      // @ts-ignore
      this.app[modNameT] = modIns;
      //this.logger.info(`load model [${modNameT}]`)
    }

    const dbs = this._adaMgr.dbNameMap;
    for (let key in dbs) {
      const db = dbs[key];
      const dbNameT = `_db${capitalizeFirstLetter(key)}`;

      switch (db.adaIns._name) {
        case "sequelize":
          dbDef.unshift(`    ${dbNameT}: Sequelize;`);
          break;
        case "opengauss":
          dbDef.unshift(`    ${dbNameT}: DBFree;`);
          break;
        default:
          //dbDef.push(`    _db_${key}: any;`);
          break;
      }

      // @ts-ignore
      this.app[dbNameT] = db.adaIns.db[key];
    }

    if (this.app.cmdOpts.api_doc === true && dbDef.length > 0) {
      let dtsPath = this.app.getDstPath();
      if (dtsPath.length > 0) {
        this.app.insertDtsContent(dtsPath, "model_import", dbImport.join("\n"));
        this.app.insertDtsContent(dtsPath, "model_export", dbExport.join("\n"));
        this.app.insertDtsContent(dtsPath, "model_def", dbDef.join("\n"));
        this.app.logger.info(`-- typedef model_def update success`);
      }
    }
  }

  async stop() {}

  /**
   *
   * @param {Record<string, import('@types').DialectCfg>} dbCfg - 数据库配置
   */
  addDB(dbCfg) {
    this.#initDBCfg(dbCfg);
  }

  /**
   *
   * @param {string} tbName - 表名
   * @param {Record<string, any>[]} data - 数据
   *
   * @returns { Promise<AddRecordRet> }
   */
  async addRecord(tbName, data) {
    return this._adaMgr.addRecord(tbName, data);
  }

  /**
   * 获取所有模型
   * @returns {Record<string, import('@types').ModelXItem>}
   */
  getModels() {
    return this._adaMgr.getModels();
  }
}

module.exports = {
  npluginDefault: HwDbCli,
  HwDbCli,
  Sequelize,
  Model,
  DataTypes,
  QueryTypes,
  Op,
  literal,
};
