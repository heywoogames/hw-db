

# 1.0.3 - 1.0.4 / 2024-10-20

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
