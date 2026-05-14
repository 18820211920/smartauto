// 分页工具
const getPageParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
};

module.exports = { getPageParams };