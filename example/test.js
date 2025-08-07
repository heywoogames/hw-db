const base = require( "@heywoogames/hw-base" );
const { Op } = require( "@sequelize/core" );

class Main extends base.HwAppBase {
  constructor () {
    super();

    this.timer = null;
  }

  async onBeforeInit () {
    this.env.PROJ_PATH = this.env.PROJ_PATH + "/example";
    this.env.CFG_PATH = this.env.PROJ_PATH + "/config";

    console.log( "--- onBeforeInit" );
  }

  async onAfterInit () {
    this._db = this.getPlugin( "_db" );
    this._db.addDB( this._cfg.dbs );
  }

  async onBeforeStart () {
    this.logger.info( this.env.PROJ_PATH );
    console.log( "-- onBeforeStart" );
  }

  async onAfterStart () {
    console.log( "-- onAfterStart" );

    /** @type { import('../index').HwDbCli } */
    this._db = this.getPlugin( "_db" );
    this.timer = setTimeout( async () => {
      this.test();
    }, 2000 );
  }

  async test () {
    const testOpt = {
      manager: false,
      radar: false,
      postgre: false,
      opengauss: true,
      addRecord: false,
    };

    {
      const moIns = this._db.getModelByTbName( "user" );
      const res = await moIns.findAll( { attributes: ["username"] } );
      console.log( res.map( ( v ) => v.dataValues.username ) );

      this._db.setlogging( "user", 0 );
    }
    //
    {

    }
  }

  async onBeforeStop () {
    console.log( "--- onBeforeStop" );
    if ( this._timer !== null ) {
      clearInterval( this._timer );
    }
  }

  async onAfterStop () {
    console.log( "--- onAfterStop" );
    process.exit( 0 );
  }
}

( async () => {
  const main = new Main();
  await main.init();
  await main.start();
} )();
