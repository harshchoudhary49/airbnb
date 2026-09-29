// Core Modules
const fs = require('fs');
const path = require('path');
const rootDir = require('../utils/pathUtil');

const userDataPath = path.join(rootDir, 'data', 'users.json');

const getUsersFromFile = (callback) => {
  fs.readFile(userDataPath, (err, data) => {
    if (err || !data || data.length === 0) {
      return callback([]);
    }
    try {
      const users = JSON.parse(data);
      callback(users);
    } catch (e) {
      callback([]);
    }
  });
};

module.exports = class User {
  constructor(name, email, password, userType = 'guest', id = null) {
    this.id = id || 'user_' + Date.now().toString();
    this.name = name;
    this.email = email.toLowerCase().trim();
    this.password = password;
    this.userType = userType; // 'guest' or 'host'
    this.createdAt = new Date().toISOString().split('T')[0];
  }

  save(callback) {
    getUsersFromFile((users) => {
      const existingIndex = users.findIndex((u) => u.id === this.id);
      if (existingIndex >= 0) {
        users[existingIndex] = this;
      } else {
        users.push(this);
      }
      fs.writeFile(userDataPath, JSON.stringify(users, null, 2), (err) => {
        if (callback) callback(err, this);
      });
    });
  }

  static findByEmail(email, callback) {
    getUsersFromFile((users) => {
      const normalized = (email || '').toLowerCase().trim();
      const user = users.find((u) => u.email === normalized);
      callback(user || null);
    });
  }

  static findById(id, callback) {
    getUsersFromFile((users) => {
      const user = users.find((u) => u.id.toString() === (id || '').toString());
      callback(user || null);
    });
  }

  static fetchAll(callback) {
    getUsersFromFile(callback);
  }
};
