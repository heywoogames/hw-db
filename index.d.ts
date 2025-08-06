
import { HwPluginBase, HwAppBase } from "@heywoogames/hw-base"
import { Sequelize, Options as SeqOpt, Dialect as SeqDial, Model } from "@sequelize/core";
import AdapterBase from "./src/lib/adapterBase";
import AdapterMgr from "./src/lib/adapterMgr";
import odbc, { Result as OdbcResult} from "odbc"

export { AdapterBase, AdapterMgr, SeqOpt };

// 扩展 命令配置项定义
declare module "@sequelize/core" {
    export interface Options {

        /**
         * db model Path
        */
        modelPath: string[];

        /**
         * db model Package
        */
        modelPackage: string[];
    }

    export interface Model {
        convertData( data: object[] ): boolean;
    }

    export interface Sequelize{
        _ywapp: HwAppBase;
    }
}

export type OdbcCfg = {
  /** 连接超时,秒, default: 5 */
  connectionTimeout: number,
  /** 登录超时,秒, default: 5 */
  loginTimeout: number,
  /** 连接池 初始连接数, default: 2 */
  initialSize: number,
  /** 连接池 增量连接数, default: 2 */
  incrementSize: number,
  /** 连接池 最大连接数, default: 50 */
  maxSize: number,
  /** 连接池 是否重用连接, default: true */
  reuseConnections: boolean,
  /** 连接池 是否收缩, default: true */
  shrink: boolean
}

export type OpenGaussOption = {
    /** 查询是否使用本地时间 */
    Sslmode: 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';

    /** 设置为1时，将会打印psqlodbc驱动的mylog，日志生成目录为/tmp/。设置为0时则不会生成*/
    Debug: 0 | 1;
}


export type DialectCfg = SeqOpt & {

  /** 时区配置,使用与某些数据库( mysql, opengauss ) */
  timezone?: string;
  options: {[key: string]: any} | OpenGaussOption;

  /** odbc 配置,适用于 odbc 连接池(opengauss) */
  odbc?: OdbcCfg
}

export type HwDialect = SeqDial | 'opengauss'


export type HwDBCfg = {
    /** 查询是否使用本地时间 */
    queryUseLocalTime: boolean;

    /** 缺省 数据库 model 存放目录*/
    modelDefaultPath: string;

    /** 是否开启表分区,缺省 false
     *   - false,表示不使用（使用老的按月份分表存储某些数据）
     */
    useTablePartition: boolean;

    db: { [key: string]: DialectCfg }
}

export type AddRecordRet = {
    status: boolean
    tbName?: string
    ids?: number[]
}

export interface DBFree {

  /**
   * odbc 原始查询, 返回odbc原始查询结果
   * @param {string} sql -SQL 语句
   * @param {Array<number|string>?} parameters - 参数
   */
  query( sql: string, parameters: Array<number|string>?): Promise< OdbcResult<T> >;

  /**
   * 需要返回数组，且数组中每个元素为对象
   * * 如果 insert 需要返回自增ID，可以使用此方法
   *
   * @param {string} sql -SQL 语句
   * @param {Array<number|string>?} parameters - 参数
   */
  queryDBSimpleArray<T>(sql: string, parameters: Array<number|string>?): Promise< Array<T> >;

  /** 简单查询, 之返回影响行数，0表示失败
   * 例如,更新和insert等
   *
   * @param {string} szSql -SQL 语句
   * @param {Array<number|string>} [params] - 参数列表
   *
   * @return { Promise< number > } 返回影响的行数
   */
  queryDBSimple(sql: string, params: Array<number|string>?): Promise< number >;

}

/**
 * @class HwDbCli DB 客户端
 *
 *
 *
 * 支持事件
 *   - message ( channel, message)=> {}
 *   - pmessage (pattern, channel, message)=> {}
 */
export class HwDbCli extends HwPluginBase {

    /**
     * 时区差异 秒
     *
     * @type {number}
     * @memberof HwDbCli
     */
    tmDiff: number;

    /** 是否使用表分区 */
    useTablePartition: boolean;

    _adaMgr: AdapterMgr;

    cfg: HwDBCfg;

    /** 增加DBS
     *
     * @param cfg
     */
    addDB( cfg: { [key: string]: SeqOpt } ): void;


    /** 根据db名字，获取DB实例
     *
     * @param dbInsName DB 名字
     */
    getDBIns ( dbInsName: string ): Sequelize | null;

    /**
     * 获取非Sequelize托管的DB实例
     * @param dbInsName DB 名字
     */
    getDBInsFree(dbInsName: string ): DBFree | null;

    /**
     * 根据表明获取对应的模型实例
     * @param tbName - 表名 <tbName>, ex: radar_info
     *
     * @example getModelByTbName('radar_info');
     */
    getModelByTbName( tbName: string ): typeof Model | null;

    /** 增加数据到表
     *
     * @param tbName 表名
     * @param data 数据
     */
    addRecord( tbName: string, data: {[key:string]: any}[]  ): AddRecordRet;

    /**
     * 获取所有模型
     */
    getModels(): {[key: string]: Model};

    /**
     * 设置日志级别
     * @param {string} dbInsName db 实例名称
     * @param {number} lv - 日志级别
     *  - 0 关闭日志
     *  - 1 开启全日志
     *  - 2 只打印sql
     */
    setlogging(dbInsName : string, lv: number);
}

