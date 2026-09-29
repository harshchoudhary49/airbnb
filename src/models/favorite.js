// Core Modules
const fs = require('fs');
const path = require('path');
const rootDir = require('../utils/pathUtil');

const favDataPath = path.join(rootDir, 'data', 'favorites.json');

const getFavoritesFromFile = (callback) => {
  fs.readFile(favDataPath, (err, data) => {
    if (err || !data || data.length === 0) {
      return callback({});
    }
    try {
      const parsed = JSON.parse(data);
      // Migrate legacy array to map if necessary
      if (Array.isArray(parsed)) {
        return callback({ user_guest_1: parsed });
      }
      callback(parsed || {});
    } catch (e) {
      callback({});
    }
  });
};

module.exports = class Favorite {
  static addToFavorites(userId, homeId, callback) {
    getFavoritesFromFile((favMap) => {
      const uId = userId || 'user_guest_1';
      if (!favMap[uId]) {
        favMap[uId] = [];
      }
      const strId = homeId.toString();
      if (!favMap[uId].includes(strId)) {
        favMap[uId].push(strId);
        fs.writeFile(favDataPath, JSON.stringify(favMap, null, 2), (err) => {
          if (callback) callback(err, true);
        });
      } else {
        if (callback) callback(null, false);
      }
    });
  }

  static removeFromFavorites(userId, homeId, callback) {
    getFavoritesFromFile((favMap) => {
      const uId = userId || 'user_guest_1';
      if (favMap[uId]) {
        const strId = homeId.toString();
        favMap[uId] = favMap[uId].filter((id) => id !== strId);
        fs.writeFile(favDataPath, JSON.stringify(favMap, null, 2), (err) => {
          if (callback) callback(err);
        });
      } else {
        if (callback) callback(null);
      }
    });
  }

  static getFavoriteIds(userId, callback) {
    getFavoritesFromFile((favMap) => {
      const uId = userId || 'user_guest_1';
      callback(favMap[uId] || []);
    });
  }

  static deleteByHomeId(homeId, callback) {
    getFavoritesFromFile((favMap) => {
      const strId = homeId.toString();
      let changed = false;
      for (const uId in favMap) {
        if (favMap[uId].includes(strId)) {
          favMap[uId] = favMap[uId].filter((id) => id !== strId);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFile(favDataPath, JSON.stringify(favMap, null, 2), (err) => {
          if (callback) callback(err);
        });
      } else {
        if (callback) callback(null);
      }
    });
  }
};
