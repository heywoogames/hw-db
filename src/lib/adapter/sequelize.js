const { Sequelize, QueryTypes } = require("@sequelize/core");
const path = require("node:path");
const fs = require("node:fs");
const { AdapterBase } = require("../adapterBase.js");

function lowercaseFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Sequelize 适配器
 * @augments {AdapterBase<import('@sequelize/core').Sequelize>}
 */
class SequelizeAdapter extends AdapterBase {
  /**
   * @type {Record<string, string>}
   * - key <database:modelFileName>
   * - val {pos: 'default' | 'path' | 'lib'}
   */
  #modelMap = {};

  constructor(mgr) {
    super(mgr, "sequelize");

    this.supportDialect = ["mysql", "postgres", "mssql"];

    /** @type {Record< string,import('@sequelize/core').Sequelize>} */
    this.db = {};
  }

  /**
   * @param {import('@sequelize/core').Sequelize} seqIns 实例
   * @param { import('@types').Options} cfg 配置
   * @param {Record<string, {pos: 'default' | 'path' | 'lib', path: string}> | null} modelsPath 模型路径
   */
  #loadModels(seqIns, cfg, modelsPath = null) {
    const dbName = cfg._ywdbName;

    const defPath = path
      .normalize(path.join(this._app.env.PROJ_PATH, this._plug.cfg.modelDefaultPath))
      .replace(/\\/g, "/");
    const modelPaths = [{ pos: "default", path: defPath }];
    if (cfg.modelPath instanceof Array) {
      for (const it of cfg.modelPath) {
        let pathT = path.normalize(it);
        if (fs.existsSync(pathT)) {
          modelPaths.push({ pos: "path", path: pathT });
        } else {
          pathT = path.normalize(path.join(this._app.env.PROJ_PATH, it));
          if (fs.existsSync(pathT)) {
            modelPaths.push({ pos: "path", path: pathT });
          }
        }
      }
    }

    if (cfg.modelPackage instanceof Array) {
      for (const it of cfg.modelPackage) {
        try {
          const pathT = require(it);
          if (fs.existsSync(pathT)) {
            modelPaths.push({ pos: "lib", path: pathT });
          }
        } catch (err) {
          this._app.logger.warn(`not find db models ${it}`, err);
        }
      }
    }

    for (const it of modelPaths) {
      const modelPath = `${it.path}/${dbName}`;
      if (fs.existsSync(modelPath)) {
        const files = fs.readdirSync(modelPath);
        for (const itModel of files) {
          if (itModel === "index.js") {
            continue;
          }

          const key = `${dbName}:${itModel}`;
          const modelFile = `${modelPath}/${itModel}`;
          try {
            const tmp = this.#modelMap[key];
            if (tmp !== undefined && tmp !== "lib") {
              continue;
            }

            const m = require(modelFile);
            m.createModel(seqIns);

            this.#modelMap[key] = it.pos;
            if (modelsPath !== null) {
              // @ts-ignore
              modelsPath[m.modelName] = { pos: it.pos, path: modelFile };
            }
          } catch (err) {
            this._app.logger.warn(`--- load model error: ${modelFile}`, err);
          }
        }
      }
    }
  }

  /**
   * @override
   * @param {string} name 配置名
   * @param {import('../../../index').DialectCfg} cfg 配置
   */
  addDialectCfg(name, cfg) {
    cfg._ywdbName = name;
    if (cfg.modelPath === undefined) {
      cfg.modelPath = [];
    }

    if (cfg.modelPackage === undefined) {
      cfg.modelPackage = [];
    }

    if (cfg.timezone === undefined) {
      cfg.timezone = "+08:00";
    }

    this._dialectCfg[name] = cfg;

    return cfg;
  }

  /** 验证配置
   * @override
   * @param {import('@types').DialectCfg} cfg - 配置
   */
  validCfg(cfg) {
    if (typeof cfg.logging === "string") {
      switch (cfg.logging) {
        case "console.info":
          // @ts-ignore
          cfg.logging = console.info;
          break;
        default:
          // @ts-ignore
          cfg.logging = console.log;
          break;
      }
    } else if (typeof cfg.logging === "boolean") {
      if (cfg.logging === true) {
        cfg.logging = this._plug.app.logger.info;
      }
    }
  }

  /**
   * @override
   * @param {import('@types').DialectCfg} cfgCur 配置
   * @param {import('@types').DialectCfg} cfgNew 配置
   */
  updateDialectCfg(cfgCur, cfgNew) {
    if (cfgNew.modelPath instanceof Array) {
      for (const it of cfgNew.modelPath) {
        cfgCur.modelPath.push(it);
      }
    }

    if (cfgNew.modelPackage instanceof Array) {
      for (const it of cfgNew.modelPackage) {
        cfgCur.modelPackage.push(it);
      }
    }
  }

  async start() {
    for (const key in this._dialectCfg) {
      const cfg = this._dialectCfg[key];
      if (cfg?.enable === false) {
        this._app.logger.info(`- [${key}] db: ${cfg.database} is disabled`);
        continue;
      }

      const ins = new Sequelize(cfg);
      ins._ywapp = this._app;

      /** @type {Record<string, {pos: 'default' | 'path' | 'lib', path: string}> | null} */
      const modelsPath = {};

      this.#loadModels(ins, cfg, modelsPath);
      this.db[key] = ins;

      for (const moName in ins.models) {
        const moIns = ins.models[moName];
        const nameSchema = moIns.getTableName();

        const bIsStr = typeof nameSchema === "string";

        const name = bIsStr ? nameSchema : `${nameSchema.schema}.${nameSchema.tableName}`;

        const moNameT = lowercaseFirstLetter(moName);

        this._mgr.tableModelMap[name] = {
          mo: moIns,
          adaIns: this,
          // @ts-ignore
          pos: modelsPath[moNameT]?.pos || "default",
          path: modelsPath[moNameT]?.path || "",
        };

        if (bIsStr === false) {
          const tbIns = this._mgr.tableModelMap[nameSchema.tableName];
          if (tbIns === undefined) {
            this._mgr.tableModelMap[nameSchema.tableName] = this._mgr.tableModelMap[name];
          } else {
            const nameSchemaT = tbIns.mo.getTableName();
            const nameT =
              typeof nameSchemaT !== "string"
                ? `${nameSchemaT.schema}.${nameSchemaT.tableName}`
                : nameSchemaT;
            this._app.logger.error(
              `[${name}]'s table name ${nameSchema.tableName} has used by [${nameT}]!`,
            );
          }
        }
      }

      this._app.logger.info(`o [${key}] db: ${cfg.database} load success!`);
    }
  }

  async testConn() {
    for (const key in this.db) {
      try {
        await this.db[key].authenticate();
        this._app.logger.info(`Connection has been established successfully. ${key}`);
      } catch (error) {
        this._app.logger.error(`Unable to connect to the database: ${key}`, error);
      }
    }
  }

  /**
   * 添加记录到指定的表
   * @param {string} tbName - 表名
   * @param {Record<string, any>[]} data - 数据
   *
   * @returns { Promise<import('@types').AddRecordRet>}
   */
  async addRecord(tbName, data) {
    try {
      const moIns = this._mgr.getModelByTbName(tbName);
      if (moIns !== null) {
        // @ts-ignore
        if (typeof moIns.convertData === "function") {
          // @ts-ignore
          const convRet = moIns.convertData(data);
          let newTableName = tbName;
          let szSql = "";
          if (typeof convRet === "string") {
            szSql = convRet;
          } else {
            newTableName = convRet.tbName;
            szSql = convRet.szSql;
          }

          if (szSql.length < 5) {
            return { status: false };
          }

          const rec = await moIns.sequelize.query(szSql, {
            type: QueryTypes.INSERT,
          });
          const ids = [];
          const idStart = rec[0];
          const idEnd = idStart + rec[1];
          for (let id = idStart; id < idEnd; id++) {
            ids.push(id);
          }
          return { status: rec[1] > 0, tbName: newTableName, ids };
        } else {
          // @ts-ignore
          const rec = await moIns.bulkCreate(data);
          const ids = [];
          for (const it of rec) {
            // @ts-ignore
            ids.push(it.dataValues.id);
          }

          return { status: rec.length > 0, tbName, ids };
        }
      } else {
        return { status: false };
      }
    } catch (err) {
      this._app.logger.warn("--- addRecord err", err);
      return { status: false };
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
          ins.options.logging = false;
          break;
        case 1:
          ins.options.logging = true;
          break;
        case 2:
          ins.options.logging = console.log;
          break;
        default:
          ins.options.logging = console.info;
          break;
      }
    }
  }
}

module.exports = SequelizeAdapter;
