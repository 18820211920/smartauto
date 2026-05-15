
const jwt = require('jsonwebtoken');
const config = require('../config');

exports.sign = (payload) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expire });
};

exports.verify = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (e) {
    return null;
  }
};

exports.decode = (token) => {
  return jwt.decode(token);
};
