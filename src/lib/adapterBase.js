class AdapterBase {
  constructor ( mgr, name ) {
    /** @type {import('../../index').AdapterMgr} */
    this._mgr = mgr;

    /** @type {string} */
    this._name = name;

    /** @type {import('../../index').HwDbCli} */
    this._plug = this._mgr._plug;

    /** @type {import('@heywoogames/hw-base').HwAppBase} */
    this._app = this._plug._app;

    /**
     * @type {string[]}
     * @description 支持的数据库
     */
    this.supportDialect = [];

    /**
     * @type {Record<string, import('../../index').DialectCfg>}
     * @description 数据库配置
     */
    this._dialectCfg = {};
  }

  /**
   * 增加配置
   * @param {string} name 配置名
   * @param {import('../../index').DialectCfg} cfg 配置
   *
   * @returns {import('../../index').DialectCfg}
   */
  addDialectCfg ( name, cfg ) {
    this._dialectCfg[name] = cfg;
    return cfg;
  }

  /**
   * 更新现有配置
   * @param {import('../../index').DialectCfg} _cfgCur 配置
   * @param {import('../../index').DialectCfg} _cfgNew 配置
   */
  updateDialectCfg ( _cfgCur, _cfgNew ) {
    this._mgr._plug.app.logger.warn(
      `xx adapter ${this._name} updateDialectCfg not implement`,
    );
  }

  async testConn () {
    this._mgr._plug.app.logger.warn(
      `xx adapter ${this._name} testConn not implement`,
    );
  }

  /**
   * 启动
   */
  async start () {
    this._mgr._plug.app.logger.warn(
      `xx adapter ${this._name} start not implement`,
    );
  }

  /**
   * 添加记录到指定的表
   * @param {string} _tbName - 表名
   * @param {Record<string, any>[]} _data - 数据
   *
   * @returns { Promise<import('@types').AddRecordRet>}

   */
  async addRecord ( _tbName, _data ) {
    this._mgr._plug.app.logger.warn(
      `xx adapter ${this._name} addRecord not implement`,
    );
    return { status: false, msg: "not implement" };
  }

  /** 验证配置
   * @param {import('../../index').DialectCfg} _cfg - 配置

   */
  validCfg ( _cfg ) {
    this._mgr._plug.app.logger.warn(
      `xx adapter ${this._name} validCfg not implement`,
    );
  }

  /**
   * 设置日志级别
   * @param {string} _dbInsName db 实例名称
   * @param {number} _lv - 日志级别
   */
  setlogging ( _dbInsName, _lv ) {
    this._mgr._plug.app.logger.warn(
      `xx adapter ${this._name} setlogging not implement`,
    );
  }
}

module.exports = AdapterBase;
