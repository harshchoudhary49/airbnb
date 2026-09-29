// Core Modules
const fs = require('fs');
const path = require('path');
const rootDir = require('../utils/pathUtil');

const favDataPath = path.join(rootDir, 'data', 'favorites.json');

const getFavoritesFromFile = (callback) => {
  fs.readFile(favDataPath, (err, data) => {
    if (err || !data || data.length === 0) {
      return callback([]);
    }
    try {
      const favs = JSON.parse(data);
      callback(favs);
    } catch (e) {
      callback([]);
    }
  });
};

module.exports = class Favorite {
  static addToFavorites(homeId, callback) {
    getFavoritesFromFile((favIds) => {
      const strId = homeId.toString();
      if (!favIds.includes(strId)) {
        favIds.push(strId);
        fs.writeFile(favDataPath, JSON.stringify(favIds, null, 2), (err) => {
          if (callback) callback(err, true);
        });
      } else {
        if (callback) callback(null, false);
      }
    });
  }

  static removeFromFavorites(homeId, callback) {
    getFavoritesFromFile((favIds) => {
      const strId = homeId.toString();
      const updated = favIds.filter((id) => id !== strId);
      fs.writeFile(favDataPath, JSON.stringify(updated, null, 2), (err) => {
        if (callback) callback(err);
      });
    });
  }

  static getFavoriteIds(callback) {
    getFavoritesFromFile(callback);
  }

  static deleteByHomeId(homeId, callback) {
    Favorite.removeFromFavorites(homeId, callback);
  }
};
