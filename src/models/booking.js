const prisma = require('../db/prisma');

const formatBooking = (b) => {
  if (!b) return null;
  return {
    id: b.id,
    homeId: b.homeId,
    userId: b.userId,
    houseName: b.home ? b.home.houseName : '',
    price: b.home ? b.home.price : 0,
    location: b.home ? b.home.location : '',
    photoUrl: b.home ? b.home.photoUrl : '',
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guestsCount: b.guestsCount,
    totalAmount: b.totalAmount,
    bookedAt: b.bookedAt,
    status: b.status
  };
};

module.exports = class Booking {
  constructor(
    homeId,
    houseName,
    price,
    location,
    photoUrl,
    guestName,
    guestEmail,
    checkIn,
    checkOut,
    guestsCount,
    totalAmount,
    userId = null,
    id = null
  ) {
    this.id = id;
    this.userId = userId ? userId.toString() : null;
    this.homeId = homeId;
    this.houseName = houseName;
    this.price = parseFloat(price) || 0;
    this.location = location;
    this.photoUrl = photoUrl;
    this.guestName = guestName;
    this.guestEmail = guestEmail;
    this.checkIn = checkIn;
    this.checkOut = checkOut;
    this.guestsCount = parseInt(guestsCount, 10) || 1;
    this.totalAmount = parseFloat(totalAmount) || 0;
    this.bookedAt = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    this.status = 'Confirmed';
  }

  async save(callback) {
    try {
      const data = {
        homeId: this.homeId.toString(),
        userId: this.userId.toString(),
        guestName: this.guestName,
        guestEmail: this.guestEmail,
        checkIn: this.checkIn,
        checkOut: this.checkOut,
        guestsCount: this.guestsCount,
        totalAmount: this.totalAmount,
        bookedAt: this.bookedAt,
        status: this.status
      };

      if (this.id) {
        data.id = this.id.toString();
      }

      const created = await prisma.booking.create({
        data,
        include: { home: true }
      });
      this.id = created.id;
      if (callback) callback(null, formatBooking(created));
      return formatBooking(created);
    } catch (err) {
      console.error('Error saving booking to PostgreSQL:', err);
      if (callback) callback(err);
      else throw err;
    }
  }

  static async fetchAll(callback) {
    try {
      const bookings = await prisma.booking.findMany({
        include: { home: true },
        orderBy: { createdAt: 'desc' }
      });
      const formatted = bookings.map(formatBooking);
      if (callback) callback(formatted);
      return formatted;
    } catch (err) {
      console.error('Error in Booking.fetchAll:', err);
      if (callback) callback([]);
      return [];
    }
  }

  static async fetchByUserId(userId, callback) {
    try {
      const targetUserId = (userId || 'user_guest_1').toString();
      const bookings = await prisma.booking.findMany({
        where: { userId: targetUserId },
        include: { home: true },
        orderBy: { createdAt: 'desc' }
      });
      const formatted = bookings.map(formatBooking);
      if (callback) callback(formatted);
      return formatted;
    } catch (err) {
      console.error('Error in Booking.fetchByUserId:', err);
      if (callback) callback([]);
      return [];
    }
  }

  static async deleteById(id, userId, callback) {
    try {
      if (!id) {
        if (callback) callback(new Error('Missing booking id'));
        return;
      }

      if (userId) {
        const booking = await prisma.booking.findUnique({
          where: { id: id.toString() }
        });
        if (!booking) {
          if (callback) callback(null);
          return;
        }
        if (booking.userId !== userId.toString()) {
          const unauthorizedErr = new Error('Unauthorized');
          if (callback) callback(unauthorizedErr);
          return;
        }
      }

      await prisma.booking.delete({
        where: { id: id.toString() }
      });

      if (callback) callback(null);
    } catch (err) {
      console.error('Error in Booking.deleteById:', err);
      if (callback) callback(err);
      else throw err;
    }
  }

  static async deleteByHomeId(homeId, callback) {
    try {
      if (!homeId) {
        if (callback) callback(null);
        return;
      }
      await prisma.booking.deleteMany({
        where: { homeId: homeId.toString() }
      });
      if (callback) callback(null);
    } catch (err) {
      console.error('Error in Booking.deleteByHomeId:', err);
      if (callback) callback(err);
      else throw err;
    }
  }
};
