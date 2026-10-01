const prisma = require('../db/prisma');

module.exports = class User {
  constructor(name, email, password, userType = 'guest', id = null) {
    this.id = id;
    this.name = name;
    this.email = (email || '').toLowerCase().trim();
    this.password = password;
    this.userType = userType; // 'guest' or 'host'
    this.createdAt = new Date();
  }

  async save(callback) {
    try {
      let savedUser;
      if (this.id) {
        savedUser = await prisma.user.update({
          where: { id: this.id },
          data: {
            name: this.name,
            email: this.email,
            password: this.password,
            userType: this.userType
          }
        });
      } else {
        savedUser = await prisma.user.create({
          data: {
            name: this.name,
            email: this.email,
            password: this.password,
            userType: this.userType
          }
        });
      }
      this.id = savedUser.id;
      if (callback) callback(null, savedUser);
      return savedUser;
    } catch (err) {
      if (callback) callback(err, null);
      else throw err;
    }
  }

  static async findByEmail(email, callback) {
    try {
      const normalized = (email || '').toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email: normalized }
      });
      if (callback) callback(user);
      return user;
    } catch (err) {
      console.error('Error in User.findByEmail:', err);
      if (callback) callback(null);
      return null;
    }
  }

  static async findById(id, callback) {
    try {
      if (!id) {
        if (callback) callback(null);
        return null;
      }
      const user = await prisma.user.findUnique({
        where: { id: id.toString() }
      });
      if (callback) callback(user);
      return user;
    } catch (err) {
      console.error('Error in User.findById:', err);
      if (callback) callback(null);
      return null;
    }
  }

  static async fetchAll(callback) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
      if (callback) callback(users);
      return users;
    } catch (err) {
      console.error('Error in User.fetchAll:', err);
      if (callback) callback([]);
      return [];
    }
  }
};
