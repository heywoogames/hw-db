# 概述

hw-db 插件,提供数据库实例及 model 管理:

- 支持 本地路径 model加载
- 支持 库 方式 model 加载

**注意** 当本地和库有相同的model时，本地的model实例为准；

**注意** odbc 库,没有加到依赖里,如果需要,你可以在 使用的 app里 的 postinstall,调用调用脚本 checkodbc
``` json
{
  "scripts": {
      "postinstall": "npx checkodbc"
  }
}
```
* `checkodbc`, 脚本会安装 odbc库到全局,然后再复制到 app/node_modules, 以便防止每次 npminstall 编译


# 配置

## 插件配置

缺省配置文件 ```mq.json```

``` json
{
    "queryUseLocalTime": true,
    "modelDefaultPath": "dbmodel",
    "db" :{
        "radar":{
            "enable": false,
            "dialect": "mysql",
            "host": "127.0.0.1",
            "port": 3306,
            "database": "test",
            "username": "root",
            "password": "111111",
            "logging": false
        },
        "manager": {
            "dialect": "mysql",
            "host": "127.0.0.1",
            "port": 3306,
            "database": "db2",
            "username": "root",
            "password": "---",
            "logging": true
        }

    }
}
```

- queryUseLocalTime 是否使用本地时间，使用本地时间,会加上时区差异（秒），注意，不会自动加，需要开发者自己添加
- modelDefaultPath 模型缺省路径
- db  db实例连接配置

## 库模式的model

 以库模式提供的model 需要缺省导出绝对路径。例如库的缺省加载脚本为 index.js
 那么index.js例子如下:

``` js
const const path = require( 'path' );
module.exports = path.normalize(__dirname);
```

库目录结构如下

```txt
- index.js
- package.json
+ radar
   - radar.js
+ manager
   - manager.js
```

目录 **radar**, **manager** 是配置里数据库名字，下面存放库的各个model。

# api

## HwDbCli 类

### 函数: `addDB(cfg: { [key: string]: SeqOpt }): void`

增加新的DB配置

**参数:**
- cfg: 数据库配置对象，key为数据库名称，value为Sequelize配置

### 函数: `getDBIns(dbInsName: string): Sequelize | null`

根据db名字获取DB实例

**参数:**

- dbInsName: 数据库名称

**返回值:**

- Sequelize实例，如果不存在返回null

### 函数: `getModelByTbName(tbName: string): typeof Model | null`

根据表名获取对应的模型实例

**参数:**

- tbName: 表名，例如 'radar_info'

**返回值:**

- Model类型，如果不存在返回null

**示例:**

```js
getModelByTbName('radar_info');
```

### 函数: `addRecord(tbName: string, data: {[key:string]: any}[]): AddRecordRet`

增加数据到表

**参数:**

- tbName: 表名
- data: 要插入的数据数组

**返回值:**

```ts
{
  status: boolean,  // 操作状态
  tbName?: string,  // 表名
  ids?: number[]    // 插入记录的ID数组
}
```

### 函数: `getModels(): {[key: string]: Model}`

获取所有模型

**返回值:**

- 包含所有模型的键值对对象，key为模型名称，value为Model实例

### 函数: `getDBInsFree(dbInsName: string): DBFree`

根据db名字获取DB实例

**参数:**

- dbInsName: 数据库名称

**返回值:**

- DBFree实例，如果不存在返回null

## DBFree 类

``` ts
interface DBFree {

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
```



# config(配置)

``` json

{
    "queryUseLocalTime": true,      // 是否使用本地时间查询
    "modelDefaultPath": "dbmodel",  // model 存放缺省路径
    "useTablePartition": false,     // 是否使用表分区，false,表示不使用（使用老的按月份分表存储某些数据）
    "db" :{
        "test1":{
            "dialect": "mysql",
            "host": "127.0.0.1",
            "port": 13320,
            "database": "test1",
            "username": "root",
            "password": "1111",
            "logging": false,
            "timezone": "+08:00",
            "modelPath": ["./modelPaths"]
        },
        "test2": {
            "dialect": "postgres",
            "host": "127.0.0.1",
            "port": 13310,
            "database": "test2",
            "username": "root",
            "password": "1111",
            "logging": true,
            "modelPath": ["./modelPaths"]
        },
        "test1": {
            "dialect": "opengauss",
            "host": "127.0.0.1",
            "port": 15432,
            "database": "test1",
            "username": "gaussdb",
            "password": "111111",
            "logging": false,
            "timezone": "UTC",
            "options" : {
              "Sslmode": "allow",
              "Debug": 0,
            },
            "odbc":{
              "connectionTimeout": 5,
              "loginTimeout": 5,
              "initialSize": 2,
              "incrementSize": 2,
              "maxSize": 10,
              "reuseConnections": true,
              "shrink": true
            }
        }

    }
}
```

- timezone, 时区配置，不配置，缺省使用 ```"+08:00"```, 
  - opengauss 使用 timezone的name 例如:  `UTC`,`Asia/Shanghai`, 使用sql `SELECT * FROM pg_timezone_names;` 查询支持的时区配置
- options, 用于 opengauss, 会 作为 odbc 的连接参数
- odbc, odbc 连接及 pool相关配置

# Change Log


## 1.0.0

- 实现功能
