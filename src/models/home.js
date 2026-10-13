const prisma = require('../db/prisma');

module.exports = class Home {
  constructor(
    houseName,
    price,
    location,
    rating = 'New',
    photoUrl,
    description = '',
    hostId = null,
    id = null
  ) {
    this.id = id;
    this.hostId = hostId || 'user_host_1';
    this.houseName = houseName;
    this.price = parseFloat(price) || 0;
    this.location = location;
    this.rating = rating || 'New';
    this.photoUrl = photoUrl;
    this.description =
      description ||
      `Experience a delightful stay at ${houseName}, located in the heart of ${location}. Perfect for families, solo travelers, and couples seeking comfort and convenience.`;
  }

  async save(callback) {
    try {
      let savedHome;
      if (this.id) {
        // Edit / update existing home
        savedHome = await prisma.home.update({
          where: { id: this.id.toString() },
          data: {
            houseName: this.houseName,
            price: this.price,
            location: this.location,
            rating: this.rating,
            photoUrl: this.photoUrl,
            description: this.description,
            hostId: this.hostId
          }
        });
      } else {
        // New home registration
        savedHome = await prisma.home.create({
          data: {
            houseName: this.houseName,
            price: this.price,
            location: this.location,
            rating: this.rating,
            photoUrl: this.photoUrl,
            description: this.description,
            hostId: this.hostId
          }
        });
        this.id = savedHome.id;
      }
      if (callback) callback(null, savedHome);
      return savedHome;
    } catch (err) {
      console.error('Error saving home to PostgreSQL:', err);
      if (callback) callback(err);
      else throw err;
    }
  }

  static async fetchAll(callbackOrOptions, maybeOptions) {
    let callback;
    let options = {};

    if (typeof callbackOrOptions === 'function') {
      callback = callbackOrOptions;
      options = maybeOptions || {};
    } else if (typeof callbackOrOptions === 'object' && callbackOrOptions !== null) {
      options = callbackOrOptions;
      callback = maybeOptions;
    }

    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 50));
    const skip = (page - 1) * limit;

    try {
      const queryOptions = {
        orderBy: { createdAt: 'desc' }
      };

      // Support pagination to avoid full table scanning
      if (options.unlimited !== true) {
        queryOptions.take = limit;
        queryOptions.skip = skip;
      }

      const homes = await prisma.home.findMany(queryOptions);
      if (callback) callback(homes);
      return homes;
    } catch (err) {
      console.error('Error in Home.fetchAll:', err);
      if (callback) callback([]);
      return [];
    }
  }

  static async findById(id, callback) {
    try {
      if (!id) {
        if (callback) callback(null);
        return null;
      }
      const home = await prisma.home.findUnique({
        where: { id: id.toString() }
      });
      if (callback) callback(home);
      return home;
    } catch (err) {
      console.error('Error in Home.findById:', err);
      if (callback) callback(null);
      return null;
    }
  }

  static async findByHostId(hostId, callback) {
    try {
      const homes = await prisma.home.findMany({
        where: { hostId: (hostId || 'user_host_1').toString() },
        orderBy: { createdAt: 'desc' }
      });
      if (callback) callback(homes);
      return homes;
    } catch (err) {
      console.error('Error in Home.findByHostId:', err);
      if (callback) callback([]);
      return [];
    }
  }

  static async deleteById(id, hostId, callback) {
    try {
      if (!id) {
        if (callback) callback(new Error('Missing listing id'));
        return;
      }

      // Check ownership if hostId provided
      if (hostId) {
        const home = await prisma.home.findUnique({ where: { id: id.toString() } });
        if (!home) {
          if (callback) callback(null);
          return;
        }
        if (home.hostId !== hostId.toString()) {
          const unauthorizedErr = new Error('Unauthorized: You can only delete your own listings');
          if (callback) callback(unauthorizedErr);
          return;
        }
      }

      await prisma.home.delete({
        where: { id: id.toString() }
      });

      if (callback) callback(null);
    } catch (err) {
      console.error('Error in Home.deleteById:', err);
      if (callback) callback(err);
      else throw err;
    }
  }
};