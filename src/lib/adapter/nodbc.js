const AdapterBase = require("../adapterBase.js");

const odbcDriver = {
  opengauss: "{OpenGaussODBC}",
};

const REUSE_CONNECTIONS_DEFAULT = true;
const INITIAL_SIZE_DEFAULT = 2;
const INCREMENT_SIZE_DEFAULT = 2;
const MAX_SIZE_DEFAULT = 50;
const SHRINK_DEFAULT = true;
const CONNECTION_TIMEOUT_DEFAULT = 5;
const LOGIN_TIMEOUT_DEFAULT = 5;

class OdbcDb {
  /**
   * @param {string} name
   * @param {OdbcAdapter} ada
   * @param {import('../../../index').DialectCfg} cfg
   */
  constructor(name, ada, cfg) {
    this._odbc = require("odbc");

    this._name = name;
    this._ada = ada;
    /** @type {import('../../../index').DialectCfg} */
    this._cfg = cfg;

    /** @type { import('odbc').Pool | null } */
    this._pool = null;

    this.logging = false;
  }

  /**
   * @param {Object<string, import('../../../index').DialectCfg>} cfg - 数据库配置
   */
  #genConnectionString(cfg) {
    const opt = {
      Driver: odbcDriver[cfg.dialect],
      Servername: cfg.host,
      Port: cfg.port,
      Database: cfg.database,
      Username: cfg.username,
      Password: cfg.password,
      Debug: 0,
    };

    if (cfg.options) {
      for (const key in cfg.options) {
        opt[key] = cfg.options[key];
      }
    }
    if (cfg.logging === true || cfg.logging === "console.info") {
      this.logging = cfg.logging;
    }

    const optArr = [];
    for (const key in opt) {
      optArr.push(`${key}=${opt[key]}`);
    }

    console.log(`[${this._name}]`, optArr.join(";"));

    return {
      connectionString: optArr.join(";") + ";",
      connectionTimeout:
        cfg?.odbc?.connectionTimeout || CONNECTION_TIMEOUT_DEFAULT,
      loginTimeout: cfg?.odbc?.loginTimeout || LOGIN_TIMEOUT_DEFAULT,
      initialSize: cfg?.odbc?.initialSize || INITIAL_SIZE_DEFAULT,
      incrementSize: cfg?.odbc?.incrementSize || INCREMENT_SIZE_DEFAULT,
      maxSize: cfg?.odbc?.maxSize || MAX_SIZE_DEFAULT,
      reuseConnections:
        cfg?.odbc?.reuseConnections || REUSE_CONNECTIONS_DEFAULT,
      shrink: cfg?.odbc?.shrink || SHRINK_DEFAULT,
    };
  }

  async start() {
    const connString = this.#genConnectionString(this._cfg);
    /** @type { import('odbc').Pool | null } */
    this._pool = await this._odbc.pool(connString);
    if (this._pool) {
      this._pool.connectionEmitter.on("connected", (connection) => {
        console.log(`[${this._name}]`, "connected");

        if (this._cfg.dialect === "opengauss") {
          if (typeof this._cfg.timezone === "string") {
            connection.query(`SET SESSION TIMEZONE TO '${this._cfg.timezone}'`);
          }
        }
      });
    }
  }

  printLog(res) {
    if (this.logging === true || this.logging === "console.info") {
      this._ada._app.logger.info(`[${this._name}] statement: ` + res.statement);
      if (res.parameters.length > 0) {
        this._ada._app.logger.info(
          `[${this._name}] parameters: ` + JSON.stringify(res.parameters),
        );
      }
    }
  }

  /**
   * 查询接口
   * @param {string} sql - 查询语句
   * @param {Array<number|string>} [params] - 参数列表
   */
  async query(sql, params) {
    if (this._pool === null) {
      throw new Error("pool is null");
    }

    let res = null;
    if (Array.isArray(params)) {
      res = await this._pool.query(sql, params);
      this.printLog(res);
    } else {
      res = await this._pool.query(sql);
      this.printLog(res);
    }

    return res;
  }

  /** 获取数组记录，没有结果返回 []
   *
   * @template T
   * @param {string} szSql 查询字符串
   * @param {Array<number|string>} [params] - 参数列表
   *
   * @return { Promise<T[]>} 返回数据数组
   */
  async queryDBSimpleArray(szSql, params) {
    try {
      const ret = await this.query(szSql, params);

      if (ret.length > 0) {
        return ret.map((item) => {
          return item;
        });
      }
      return [];
    } catch (e) {
      throw new Error(`${szSql}, Error: ${e.toString()}`);
    }
  }

  /** 简单查询, 之返回影响行数，0表示失败
   *
   * @param {string} szSql -SQL 语句
   * @param {Array<number|string>} [params] - 参数列表
   *
   * @return { Promise< number > } 返回影响的行数
   */
  async queryDBSimple(szSql, params) {
    try {
      const ret = await this.query(szSql, params);
      return ret.count;
    } catch (e) {
      throw new Error(`${szSql}, Error: ${e.toString()}`);
    }
  }

  async connection() {
    if (this._pool === null) {
      throw new Error("pool is null");
    }

    return await this._pool.connect();
  }
}

class OdbcAdapter extends AdapterBase {
  constructor(mgr) {
    super(mgr, "opengauss");

    this.supportDialect = ["opengauss"];

    /** @type { Object.<string, OdbcDb>} */
    this.db = {};
  }

  /**
   * @override
   * @param {string} name 配置名
   * @param {import('../../../index').DialectCfg} cfg 配置
   */
  addDialectCfg(name, cfg) {
    this._dialectCfg[name] = cfg;
    return cfg;
  }

  async start() {
    for (const key in this._dialectCfg) {
      const cfg = this._dialectCfg[key];
      if (cfg?.enable === false) {
        this._app.logger.info(`- [${key}] db: ${cfg.database} is disabled`);
        continue;
      }

      const ins = new OdbcDb(key, this, cfg);
      await ins.start();

      this.db[key] = ins;
    }
  }

  /** 验证配置
   * @override
   * @param {import('../../../index').DialectCfg} _cfg
   */
  validCfg(_cfg) {}

  async testConn() {
    const szSql = "select version();";

    for (const key in this.db) {
      try {
        const res = await this.db[key].query(szSql);
        this._app.logger.info(
          `Connection has been established successfully. ${key}`,
        );
        this._app.logger.info(`${key}: ${res[0].version}`);
      } catch (error) {
        this._app.logger.error(
          `Unable to connect to the database: ${key}`,
          error,
        );
      }
    }
  }

  /**
   * 设置日志级别
   * @param {string} dbInsName db 实例名称
   * @param {number} lv - 日志级别
   */
  setlogging(dbInsName, lv) {
    const ins = this.db[dbInsName];
    if (ins !== undefined) {
      switch (lv) {
        case 0:
          ins.logging = false;
          break;
        default:
          ins.logging = "console.info";
          break;
      }
    }
  }
}

module.exports = OdbcAdapter;
