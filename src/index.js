"use strict";

const { HwPluginBase } = require("@heywoogames/hw-base");
const AdapterMgr = require("./lib/adapterMgr");

/**
 *
 * @typedef {Object} ModelItem
 * @property {typeof Model} mo - 模型实例
 */

/**
 * @typedef { import('./index').AddRecordRet } AddRecordRet
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
  }

  /**
   *
   * @param {Object.<string, Options>} dbs
   */
  #initDBCfg(dbs) {
    if (dbs) {
      this._adaMgr.initDBCfg(dbs);
    }
  }

  async init() {
    this.cfg = await this.getConfig();
    this.cfg.useTablePartition = this.cfg?.useTablePartition === true;

    this.#initDBCfg(this.cfg.db);
  }

  /** 根据db名字，获取DB实例
   *
   * @param {string} dbInsName db 实例名称
   * @returns { Sequelize | null }
   */
  getDBIns(dbInsName) {
    return this._adaMgr.getDBIns(dbInsName);
  }

  /** 根据db名字，非Sequelize托管的DB实例
   *
   * @param {string} dbInsName db 实例名称
   * @returns { import('../index').DBFree | null }
   */
  getDBInsFree(dbInsName) {
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
   * @returns { Model | null }
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
  }

  async stop() {}

  /**
   *
   * @param {Object.<string, Options>} dbCfg
   */
  addDB(dbCfg) {
    this.#initDBCfg(dbCfg);
  }

  /**
   *
   * @param {string} tbName
   * @param {Object.<string, any>[]} data
   *
   * @returns {AddRecordRet}
   */
  async addRecord(tbName, data) {
    return this._adaMgr.addRecord(tbName, data);
  }

  /**
   * 获取所有模型
   * @returns {Object.<string, Model>}
   */
  getModels() {
    return this._adaMgr.getModels();
  }
}

module.exports = HwDbCli;
