const base = require("@heywoogames/hw-base");
const { Op } = require("@sequelize/core");

class Main extends base.HwAppBase {
  constructor() {
    super();

    this.timer = null;
  }

  async onBeforeInit() {
    this.env.PROJ_PATH = this.env.PROJ_PATH + "/example";
    this.env.CFG_PATH = this.env.PROJ_PATH + "/config";

    console.log("--- onBeforeInit");
  }

  async onAfterInit() {
    this._db = this.getPlugin("_db");
    this._db.addDB(this._cfg.dbs);
  }

  async onBeforeStart() {
    this.logger.info(this.env.PROJ_PATH);
    console.log("-- onBeforeStart");
  }

  async onAfterStart() {
    console.log("-- onAfterStart");

    /** @type { import('../index').HwDbCli } */
    this._db = this.getPlugin("_db");
    this.timer = setTimeout(async () => {
      this.test();
    }, 2000);
  }

  async test() {
    const testOpt = {
      manager: false,
      radar: false,
      postgre: false,
      opengauss: true,
      addRecord: false,
    };

    {
      const moIns = this._db.getModelByTbName("radar_info");
      const res = await moIns.findAll({ attributes: ["radarcd"] });
      console.log(res.map((v) => v.dataValues.radarcd));

      this._db.setlogging("radar", 0);
    }
    //
    {
      // const moIns = this._db.getModelByTbName('warn_events');
      // const res = await moIns.findAll( {attributes: ['radarcd']} );
      // console.log(res.map( v => v.dataValues.radarcd ));
    }

    if (testOpt.radar) {
      const bSortDesc = true;

      const curTm = Date.now();
      try {
        const moIns = this._db.getModelByTbName("radar");
        if (moIns === null) {
          throw new Error("maybe not start");
        }
        const res = await moIns.findAll({
          attributes: ["id", "station_id", "file_path", "data_time"],
          where: {
            [Op.and]: [{ product_id: 2 }],
            data_time: {
              [Op.gte]: curTm - 3600000,
              [Op.lte]: curTm,
            },
          },
          order: [["data_time", bSortDesc ? "DESC" : "ASC"]],
          limit: 1,
        });
        console.log(
          "--- selData: ",
          res.map((v) => v.dataValues),
        );
      } catch (err) {
        console.log(err);
      }

      /// create
      // const rec = await moIns.create( {
      //     station_id: '111',
      //     product_id: 2,
      //     mcode: '',
      //     file_name: '20230811_232323',
      //     file_path: '20230811_232323',
      //     data_time: Date.now(),
      //     sync_time: Date.now(),
      //     rain_type: 0,
      //     mcode1: ''
      //   } );

      // console.log('--- rec');
    }

    if (testOpt.addRecord) {
      const res = await this._db.addRecord("warn_events", [
        {
          idx: 0,
          radarcd: "Z9856",
          warn_time: Math.trunc(Date.now() / 1000),
          warn_content: "warn_content",
          warn_type: 1,
          warn_subtype: 1,
          longitude: 100,
          latitude: 30,
          boundary: "boundary",
          reserve1: "reserve1",
          linepoints:
            "MULTIPOLYGON(((107.35067 35.39424, 107.3397 35.3982,107.33606 35.36702, 107.35067 35.39424)))",
        },
      ]);

      console.log("addRecord: ", res);
    }

    // postgre
    if (testOpt.postgre) {
      const moIns = this._db.getModelByTbName("area");
      const res = await moIns.findAll({
        attributes: ["id", "code", "name"],
        where: {
          p_id: "110000",
        },
        order: [["code", "ASC"]],
        limit: 10,
      });
      console.log(res.map((v) => v.dataValues));

      const db = this._db.getDBIns("cover");
      if (db) {
        const res = await db.query("select version();");
        console.log("postgre: ", res);
      }
    }

    //area_boundary
    if (testOpt.manager) {
      const moIns = this._db.getModelByTbName("area_boundary");
      const res = await moIns.findAll({
        attributes: ["gid", "code", "name"],
        where: {
          code: "220200",
        },
        order: [["code", "ASC"]],
        limit: 10,
      });

      console.log(" manager: area_boundary");
      res.map((v) => {
        console.log(v.dataValues);
        console.dir(v.dataValues, { depth: 10 });
      });
    }

    if (testOpt.opengauss) {
      this.logger.info("test opengauss ...");
      const db = this._db.getDBInsFree("ywmanagerNew");
      //this._db.setlogging("ywmanagerNew", 2);
      if (db) {
        const res1 = await db.query("select * from radar_product");
        console.log("opengauss: ", res1);
        // const resUp = await db.query(
        //   `update radar_product set up_time='2025-03-24T01:00:00+08:00' WHERE id=2;`,
        // );
        // console.log("opengauss: ", resUp);
        // const resT = await db.queryDBSimpleArray(
        //   "select * from radar_product WHERE up_time >= ?",
        //   ["2025-03-24 01:00:00"],
        // );
        // console.log("opengauss resT: ", resT);
        // const conn = await db.connection();
        // const cols = await conn.columns(null, "public", "radar_product", null);
        // console.log("cols: ", cols);
        // const szSqlT = `INSERT INTO arith_def(id,name,uptime,cfg,cfgb) VALUES( ?, ?, ?, ?, ?)`;
        // const resT = await db.query(szSqlT, [
        //   2,
        //   "name",
        //   "2025-03-24 01:00:00",
        //   JSON.stringify({ a: 1, b: 2 }),
        //   "{}",
        // ]);
        // console.log("opengauss: ", resT);
        // const szSqlT = `INSERT INTO radar_product(p_id,name,ename,script,type,props,params_cfg)
        // VALUES
        // ( ?, ?, ?, ?, ?, ?, ?),
        // ( ?, ?, ?, ?, ?, ?, ?)
        // RETURNING id;`;
        // const resT = await db.queryDBSimpleArray(szSqlT, [
        //   1,
        //   "name",
        //   "ename",
        //   "script",
        //   1,
        //   "{}",
        //   "{}",
        //   1,
        //   "name1",
        //   "ename1",
        //   "script1",
        //   1,
        //   "{}",
        //   "{}",
        // ]);
        //console.log("opengauss: ", resT);
      } else {
        this.logger.error("getDBIns ywmanagerNew failed");
      }
    }
  }

  async onBeforeStop() {
    console.log("--- onBeforeStop");
    if (this._timer !== null) {
      clearInterval(this._timer);
    }
  }

  async onAfterStop() {
    console.log("--- onAfterStop");
    process.exit(0);
  }
}

(async () => {
  const main = new Main();
  await main.init();
  await main.start();
})();
