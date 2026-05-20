
# 1.0.8 / 2026-05-20

* 增加功能，数据库配置中的 `host`, `port`, `username`, `password` 支持环境变量引用
  - 当字段值以 `"ENV_HW_"` 开头时，自动从环境变量读取真实值（去掉前缀作为环境变量 key）
  - `port` 字段会自动转换为数字并校验有效性 (1-65535)
  - 不以 `"ENV_HW_"` 开头的值保持原样，向后兼容

```json
{
  "db": {
    "radar": {
      "dialect": "mysql",
      "host": "ENV_HW_RADAR_HOST",
      "port": "ENV_HW_RADAR_PORT",
      "database": "test",
      "username": "ENV_HW_RADAR_USER",
      "password": "ENV_HW_RADAR_PASS"
    }
  }
}
```


# 1.0.6 / 2026-02-07

* 增加导出 fn 


# 1.0.5 / 2026-01-25

- 更新依赖库版本
- 增加功能，可以自动生成 model typing
- 使用 oxlint 替代掉 eslint


# 1.0.3 - 1.0.4

- 更新依赖库版本
- 增加功能，可以 配置 要使用 db 配置里的哪些数据库实例（缺省使用所有数据库实例 ），这样可以同一份配置，app 根据需求，设置要连接的实例
  - 可以通过 extCfg.useDb 配置要使用的数据库实例名称列表，不跟此配置，表示完全按照 配置 连接数据库

``` js
// config.json
"db": {
    "package": "@heywoogames/hw-db",
    "enable": true,
    "alias": "_db",
    "cfgName": "db",
    "extCfg": {
        "useDb": ["qt"]  //!< 要使用的数据库实例名称列表，不跟此配置，表示完全按照 配置 连接数据库
    }
}

```


# 1.0.1

* 增加 sequelize 对 mssql的 支持
* update types


# 1.0.0 

* 初始化库
