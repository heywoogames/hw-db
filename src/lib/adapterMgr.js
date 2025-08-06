const path = require("node:path");
const fs = require("node:fs");
const { utils } = require("@heywoogames/hw-utils");

class AdapterMgr {
  /**
   *
   * @param {import('../../index').HwDbCli} plug
   */
  constructor(plug) {
    /** @type {import('../../index').HwDbCli}  */
    this._plug = plug;

    /** @type {Object<string, import('./adapterBase')>} */
    this._adapters = {};

    /**
     * @type {Object<string, import('./adapterBase')>}
     * @description 数据库驱动与适配器实例映射表
     */
    this._dialectMap = {};

    /**
     * @type {Object.< string,import('@sequelize/core').Options>}
     *  - key string format: <host:port@database>, example: 127.0.0.1:111@radar
     *
     */
    this.dbMap = {};

    /** @type { Object.<string, {dbKey: string, adaIns: import('./adapterBase')}>} db 和db 实例名映射*/
    this.dbNameMap = {};

    /** @type { Object.<string, { mo: typeof Model, adaIns: import('./adapterBase')}>} 表和模型的映射关系*/
    this.tableModelMap = {};

    this.#loadAdapter();
  }

  #loadAdapter() {
    const adapterDir = path.join(__dirname, "adapter");
    const files = fs.readdirSync(adapterDir);

    files.forEach((file) => {
      if (file.endsWith(".js")) {
        try {
          const adapter = require(adapterDir + "/" + file);
          /** @type {import('./adapterBase')} */
          const ins = new adapter(this);
          this.registerAdapter(ins);
        } catch (err) {
          this._plug.app.logger.warn(
            `-- load adapter ${file} error: ${err.message}`,
          );
        }
      }
    });

    for (const dia in this._dialectMap) {
      this._plug.app.logger.info(
        `-- dialect ${dia} adapter ${this._dialectMap[dia]._name}`,
      );
    }
  }

  /**
   *
   * @param { string[] } paths
   */
  #normalizeModelPath(paths) {
    if (paths && paths instanceof Array) {
      for (let i = 0; i < paths.length; i++) {
        paths[i] = path.normalize(paths[i]);
      }
    }
  }

  /**
   * 获取数据库的唯一标识
   * @param {import('../../index').DialectCfg} cfg
   * @returns {string}
   */
  getDBKey(cfg) {
    return `${cfg.host}:${cfg.port}@${cfg.database}`;
  }

  /**
   * @param {Object.<string, import('../../index').DialectCfg>} dbs
   */
  initDBCfg(dbs) {
    if (!dbs) {
      return;
    }

    for (const key in dbs) {
      const cfgT = dbs[key];

      /** @type { import('./adapterBase')} */
      const diaIns = this._dialectMap[cfgT.dialect];
      if (diaIns === undefined) {
        this._plug.app.logger.warn(`-- dialect ${cfgT.dialect} not support`);
        continue;
      }

      diaIns.validCfg(cfgT);

      //
      const dbKey = this.getDBKey(cfgT);
      if (this.dbMap[dbKey] === undefined) {
        // 新建的
        const cfgN = diaIns.addDialectCfg(key, cfgT);
        this.dbMap[dbKey] = cfgN;
        this.dbNameMap[key] = { dbKey, adaIns: diaIns };
      } else {
        // 已经添加了这个了
        diaIns.updateDialectCfg(this.dbMap[dbKey], cfgT);
      }
    }
  }

  /**
   * 注册适配器
   * @param {import('./adapterBase')} adapter - 适配器实例
   */
  registerAdapter(adapter) {
    this._adapters[adapter._name] = adapter;

    for (const dia of adapter.supportDialect) {
      this._dialectMap[dia] = adapter;
    }

    this._plug.app.logger.info(`-- register adapter ${adapter._name}`);
  }

  /**
   * 规范配置, 去掉冗余 Model 配置
   */
  normalizeCfg() {
    this._plug.app.logger.info("-- normalizeCfg");
    for (const key in this.dbMap) {
      const it = this.dbMap[key];
      this.#normalizeModelPath(it.modelPath);

      if (it.modelPath instanceof Array) {
        it.modelPath = utils.arrayUnique(it.modelPath);
      }

      if (it.modelPackage instanceof Array) {
        it.modelPackage = utils.arrayUnique(it.modelPackage);
      }
    }
  }

  async start() {
    for (const key in this._adapters) {
      await this._adapters[key].start();
    }
  }

  // getAdapter(name) {
  //   return this.adapters[name];
  // }

  // getAdapters() {
  //   return this.adapters;
  // }

  /**
   *
   * @param {string} dbInsName - 实例名称
   * @returns
   */
  getDBIns(dbInsName) {
    const info = this.dbNameMap[dbInsName];

    if (info !== undefined) {
      return info.adaIns.db[dbInsName];
    }

    return null;
  }

  /**
   * 获取Model
   * @param {string} tbName 表名字
   * @returns { Model | null }
   */
  getModelByTbName(tbName) {
    const insItem = this.tableModelMap[tbName];
    return insItem ? insItem.mo : null;
  }

  /**
   * 获取所有模型
   * @returns {Object.<string, Model>}
   */
  getModels() {
    return this.tableModelMap;
  }

  /**
   * 添加记录到指定的表
   * @param {string} tbName
   * @param {Object.<string, any>[]} data
   *
   * @returns { import('../../index').AddRecordRet}
   */
  async addRecord(tbName, data) {
    const insItem = this.tableModelMap[tbName];
    if (insItem.mo === null) {
      return { status: false };
    } else {
      return await insItem.adaIns.addRecord(tbName, data);
    }
  }

  async testConn() {
    for (const ins in this._adapters) {
      await this._adapters[ins].testConn();
    }
  }
}

module.exports = AdapterMgr;
