const prisma = require('../db/prisma');

module.exports = class Favorite {
  static async addToFavorites(userId, homeId, callback) {
    try {
      const uId = (userId || 'user_guest_1').toString();
      const hId = homeId.toString();

      await prisma.favorite.upsert({
        where: {
          userId_homeId: {
            userId: uId,
            homeId: hId
          }
        },
        update: {},
        create: {
          userId: uId,
          homeId: hId
        }
      });

      if (callback) callback(null, true);
      return true;
    } catch (err) {
      console.error('Error adding favorite in PostgreSQL:', err);
      if (callback) callback(err, false);
      return false;
    }
  }

  static async removeFromFavorites(userId, homeId, callback) {
    try {
      const uId = (userId || 'user_guest_1').toString();
      const hId = homeId.toString();

      await prisma.favorite.deleteMany({
        where: {
          userId: uId,
          homeId: hId
        }
      });

      if (callback) callback(null);
    } catch (err) {
      console.error('Error removing favorite in PostgreSQL:', err);
      if (callback) callback(err);
    }
  }

  static async getFavoriteIds(userId, callback) {
    try {
      if (!userId) {
        if (callback) callback([]);
        return [];
      }

      const favorites = await prisma.favorite.findMany({
        where: { userId: userId.toString() },
        select: { homeId: true }
      });

      const ids = favorites.map((f) => f.homeId);
      if (callback) callback(ids);
      return ids;
    } catch (err) {
      console.error('Error getting favorite ids from PostgreSQL:', err);
      if (callback) callback([]);
      return [];
    }
  }

  static async deleteByHomeId(homeId, callback) {
    try {
      if (!homeId) {
        if (callback) callback(null);
        return;
      }
      await prisma.favorite.deleteMany({
        where: { homeId: homeId.toString() }
      });
      if (callback) callback(null);
    } catch (err) {
      console.error('Error deleting favorites by homeId:', err);
      if (callback) callback(err);
    }
  }
};
