// 基础DAO - 所有业务DAO继承此类，统一租户隔离
const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;
const getPool = () => {
  if (!pool) pool = mysql.createPool(config.db);
  return pool;
};

class BaseDao {
  async query(sql, params = []) {
    const conn = await getPool().getConnection();
    try {
      const [rows] = await conn.query(sql, params);
      return rows;
    } finally {
      conn.release();
    }
  }

  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  async execute(sql, params = []) {
    const conn = await getPool().getConnection();
    try {
      const [result] = await conn.execute(sql, params);
      return result;
    } finally {
      conn.release();
    }
  }

  async count(table, where = {}) {
    const conditions = Object.keys(where).map(k => `${k} = ?`).join(' AND ');
    const sql = `SELECT COUNT(*) as total FROM ${table} WHERE ${conditions || '1=1'}`;
    const row = await this.queryOne(sql, Object.values(where));
    return row?.total || 0;
  }

  async insert(table, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await this.execute(sql, values);
    return result.insertId;
  }

  async update(table, data, where) {
    const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const whereClause = Object.keys(where).map(k => `${k} = ?`).join(' AND ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const result = await this.execute(sql, [...Object.values(data), ...Object.values(where)]);
    return result.affectedRows;
  }

  async softDelete(table, where) {
    return this.update(table, { is_deleted: 1, updated_at: new Date() }, where);
  }

  async findById(table, id, tenantId = null) {
    let sql = `SELECT * FROM ${table} WHERE id=? AND is_deleted=0`;
    const params = [id];
    if (tenantId) { sql += ' AND tenant_id=?'; params.push(tenantId); }
    return this.queryOne(sql, params);
  }

  async findByTenant(table, tenantId, extraWhere = '') {
    const sql = `SELECT * FROM ${table} WHERE tenant_id=? AND is_deleted=0 ${extraWhere} ORDER BY id DESC`;
    return this.query(sql, [tenantId]);
  }
}

module.exports = { BaseDao, getPool };