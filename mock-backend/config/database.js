import mysql from 'mysql2/promise';

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',  // 您的MySQL没有设置密码
  database: 'dlmp_platform',
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 数据库连接类
class Database {
  constructor() {
    this.pool = pool;
  }

  // 执行查询
  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('数据库查询错误:', error);
      throw error;
    }
  }

  // 执行插入操作
  async insert(table, data) {
    try {
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const sql = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`;
      const [result] = await this.pool.execute(sql, values);
      return result;
    } catch (error) {
      console.error('数据库插入错误:', error);
      throw error;
    }
  }

  // 执行更新操作
  async update(table, data, condition, conditionParams = []) {
    try {
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), ...conditionParams];
      
      const sql = `UPDATE ${table} SET ${setClause} WHERE ${condition}`;
      const [result] = await this.pool.execute(sql, values);
      return result;
    } catch (error) {
      console.error('数据库更新错误:', error);
      throw error;
    }
  }

  // 执行删除操作
  async delete(table, condition, params = []) {
    try {
      const sql = `DELETE FROM ${table} WHERE ${condition}`;
      const [result] = await this.pool.execute(sql, params);
      return result;
    } catch (error) {
      console.error('数据库删除错误:', error);
      throw error;
    }
  }

  // 分页查询
  async paginate(table, options = {}) {
    try {
      const {
        page = 1,
        size = 10,
        where = '',
        whereParams = [],
        orderBy = 'id DESC',
        fields = '*'
      } = options;

      const offset = (page - 1) * size;
      
      // 构建查询条件
      const whereClause = where ? `WHERE ${where}` : '';
      
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
      const [countResult] = await this.pool.execute(countSql, whereParams);
      const total = countResult[0].total;
      
      // 查询数据
      const dataSql = `SELECT ${fields} FROM ${table} ${whereClause} ORDER BY ${orderBy} LIMIT ${parseInt(size)} OFFSET ${parseInt(offset)}`;
      const dataParams = [...whereParams];
      const [rows] = await this.pool.execute(dataSql, dataParams);
      
      return {
        data: rows,
        total,
        page: parseInt(page),
        size: parseInt(size),
        pages: Math.ceil(total / size)
      };
    } catch (error) {
      console.error('分页查询错误:', error);
      throw error;
    }
  }

  // 事务操作
  async transaction(callback) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 测试连接
  async testConnection() {
    try {
      const [rows] = await this.pool.execute('SELECT 1 as test');
      console.log('数据库连接成功!');
      return true;
    } catch (error) {
      console.error('数据库连接失败:', error);
      return false;
    }
  }

  // 关闭连接池
  async close() {
    try {
      await this.pool.end();
      console.log('数据库连接池已关闭');
    } catch (error) {
      console.error('关闭数据库连接池错误:', error);
    }
  }
}

// 创建数据库实例
const db = new Database();

export default db;