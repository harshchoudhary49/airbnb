// Core Modules
const fs = require('fs');
const path = require('path');
const rootDir = require('../utils/pathUtil');

const bookingDataPath = path.join(rootDir, 'data', 'bookings.json');

const getBookingsFromFile = (callback) => {
  fs.readFile(bookingDataPath, (err, data) => {
    if (err || !data || data.length === 0) {
      return callback([]);
    }
    try {
      const bookings = JSON.parse(data);
      callback(bookings);
    } catch (e) {
      callback([]);
    }
  });
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
    this.id = id || Date.now().toString();
    this.userId = userId || 'user_guest_1';
    this.homeId = homeId;
    this.houseName = houseName;
    this.price = price;
    this.location = location;
    this.photoUrl = photoUrl;
    this.guestName = guestName;
    this.guestEmail = guestEmail;
    this.checkIn = checkIn;
    this.checkOut = checkOut;
    this.guestsCount = guestsCount;
    this.totalAmount = totalAmount;
    this.bookedAt = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    this.status = 'Confirmed';
  }

  save(callback) {
    getBookingsFromFile((bookings) => {
      bookings.push(this);
      fs.writeFile(bookingDataPath, JSON.stringify(bookings, null, 2), (err) => {
        if (callback) callback(err);
      });
    });
  }

  static fetchAll(callback) {
    getBookingsFromFile(callback);
  }

  static fetchByUserId(userId, callback) {
    getBookingsFromFile((bookings) => {
      const userBookings = bookings.filter(
        (b) => (b.userId || 'user_guest_1') === userId.toString()
      );
      callback(userBookings);
    });
  }

  static deleteById(id, userId, callback) {
    getBookingsFromFile((bookings) => {
      const target = bookings.find((b) => b.id.toString() === id.toString());
      if (userId && target && (target.userId || 'user_guest_1') !== userId.toString()) {
        return callback(new Error('Unauthorized'));
      }
      const updated = bookings.filter((b) => b.id.toString() !== id.toString());
      fs.writeFile(bookingDataPath, JSON.stringify(updated, null, 2), (err) => {
        if (callback) callback(err);
      });
    });
  }

  static deleteByHomeId(homeId, callback) {
    getBookingsFromFile((bookings) => {
      const updated = bookings.filter(
        (b) => b.homeId.toString() !== homeId.toString()
      );
      fs.writeFile(bookingDataPath, JSON.stringify(updated, null, 2), (err) => {
        if (callback) callback(err);
      });
    });
  }
};
