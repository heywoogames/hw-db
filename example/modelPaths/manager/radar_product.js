const { DataTypes, Model } = require("@sequelize/core");

const modelName = "radar_product";

class Product extends Model {}

/**
 * @param {import('@sequelize/core').Sequelize} seqIns seq 实例
 * @returns {Radar}
 */
function createModel(seqIns) {
  Product.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      p_id: {
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
      },
      ename: {
        type: DataTypes.STRING,
      },
      script: {
        type: DataTypes.STRING,
      }
    },
    {
      tableName: modelName,
      freezeTableName: true,
      sequelize: seqIns,
      timestamps: false,
    },
  );

  return Product;
}

module.exports = {
  modelName,
  createModel,
};
