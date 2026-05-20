# hw-db — AGENTS.md

HW Framework 数据库插件 (`@heywoogames/hw-db`)，提供多数据库实例与 Sequelize Model 管理。

## 快速命令

| 命令 | 说明 |
|---|---|
| `npm test` | 运行测试（`node ./example/test.js`） |
| `npm run lint` | oxlint 检查（含 JSDoc 校验） |
| `npm run format` | oxfmt 格式化 |

## 架构

- **入口**: `src/index.js` — 导出 `HwDbCli` (继承 `@heywoogames/hw-base.HwPluginBase`)
- **适配器层**: `src/lib/adapterMgr.js` 管理多个数据库适配器
  - `src/lib/adapter/sequelize.js` — MySQL / PostgreSQL (Sequelize)
  - `src/lib/adapter/nodbc.js` — OpenGauss (ODBC, 非 Sequelize)
- **类型定义**: `index.d.ts` + JSDoc 注释（jsconfig.json `checkJs: true`）

## 语言与风格

- CommonJS JavaScript，JSDoc 标注类型
- 中文注释，2 空格缩进
- Lint: oxlint (`.oxlintrc.json`) — correctness error, suspicious warn, JSDoc 校验开启
- Format: oxfmt (`.oxfmtrc.json`) — printWidth 100, 双引号, trailingComma all

## 数据库支持

| 方言 | 适配器 | 备注 |
|---|---|---|
| `mysql` | Sequelize | mysql2 |
| `postgres` | Sequelize | pg |
| `mssql` | Sequelize | tedious |
| `opengauss` | ODBC (nodbc) | 需额外安装 odbc 库 |

## OpenGauss / ODBC 注意

- `odbc` 不在依赖中。使用方需在 `package.json` 加: `"postinstall": "npx checkodbc"`
- `checkodbc` CLI (`bin/checkodbc`) 全局安装后复制到 node_modules，避免每次编译

## Model 加载

- 本地路径优先于库模式（同名 model）
- 配置 `modelDefaultPath` (默认 `"dbmodel"`) 指定 model 目录
- 库模式: package 导出绝对路径 (`path.normalize(__dirname)`)

## CI / 发布

- **Push/PR**: `.github/workflows/push-build.yml` — MySQL 8.0 service container, `testdb/mysql_schema.sql` + `mysql_seed.sql`, 然后 `npm test`
- **Release**: `.github/workflows/release-package.yml` — `npm publish` → GitHub Packages (`@heywoogames`)
- Node 版本: `package.json` `engines.node >=24`

