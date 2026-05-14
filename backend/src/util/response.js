// 统一响应格式
class Result {
  static success(data = null, message = '操作成功') {
    return {
      code: 0,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }
  static fail(message = '操作失败', code = -1) {
    return {
      code,
      message,
      data: null,
      timestamp: new Date().toISOString()
    };
  }
  static page(data, total, page, pageSize) {
    return {
      code: 0,
      message: '查询成功',
      data: { list: data, total, page, pageSize },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { Result };