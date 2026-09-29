// Core Modules
const fs = require('fs');
const path = require('path');
const rootDir = require('../utils/pathUtil');

const homeDataPath = path.join(rootDir, 'data', 'homes.json');

const getHomesFromFile = (callback) => {
  fs.readFile(homeDataPath, (err, data) => {
    if (err || !data || data.length === 0) {
      return callback([]);
    }
    try {
      const homes = JSON.parse(data);
      let updated = false;
      homes.forEach((home, index) => {
        if (!home.id) {
          home.id = (index + 1).toString();
          updated = true;
        }
        if (!home.hostId) {
          home.hostId = 'user_host_1'; // Associate legacy seed homes with demo host
          updated = true;
        }
        if (!home.description) {
          home.description = `Experience a delightful stay at ${home.houseName}, located in the heart of ${home.location}. This property boasts top-tier comfort, modern amenities, high-speed Wi-Fi, and a serene ambiance perfect for both leisure and business stays.`;
          updated = true;
        }
      });
      if (updated) {
        fs.writeFile(homeDataPath, JSON.stringify(homes, null, 2), () => {});
      }
      callback(homes);
    } catch (e) {
      callback([]);
    }
  });
};

module.exports = class Home {
  constructor(
    houseName,
    price,
    location,
    rating,
    photoUrl,
    description = '',
    hostId = null,
    id = null
  ) {
    this.id = id;
    this.hostId = hostId || 'user_host_1';
    this.houseName = houseName;
    this.price = price;
    this.location = location;
    this.rating = rating;
    this.photoUrl = photoUrl;
    this.description =
      description ||
      `Experience a delightful stay at ${houseName}, located in the heart of ${location}. Perfect for families, solo travelers, and couples seeking comfort and convenience.`;
  }

  save(callback) {
    getHomesFromFile((registeredHomes) => {
      if (this.id) {
        // Edit / update existing home
        const existingIndex = registeredHomes.findIndex(
          (h) => h.id.toString() === this.id.toString()
        );
        if (existingIndex >= 0) {
          registeredHomes[existingIndex] = {
            id: this.id,
            hostId: this.hostId || registeredHomes[existingIndex].hostId || 'user_host_1',
            houseName: this.houseName,
            price: this.price,
            location: this.location,
            rating: this.rating,
            photoUrl: this.photoUrl,
            description: this.description || registeredHomes[existingIndex].description
          };
        } else {
          registeredHomes.push(this);
        }
      } else {
        // New home registration
        this.id = Date.now().toString();
        registeredHomes.push(this);
      }

      fs.writeFile(homeDataPath, JSON.stringify(registeredHomes, null, 2), (error) => {
        if (callback) callback(error);
      });
    });
  }

  static fetchAll(callback) {
    getHomesFromFile(callback);
  }

  static findById(id, callback) {
    getHomesFromFile((homes) => {
      const home = homes.find((h) => h.id.toString() === id.toString());
      callback(home);
    });
  }

  static findByHostId(hostId, callback) {
    getHomesFromFile((homes) => {
      const filtered = homes.filter(
        (h) => (h.hostId || 'user_host_1') === hostId.toString()
      );
      callback(filtered);
    });
  }

  static deleteById(id, hostId, callback) {
    // If hostId provided, verify ownership
    getHomesFromFile((homes) => {
      const target = homes.find((h) => h.id.toString() === id.toString());
      if (hostId && target && (target.hostId || 'user_host_1') !== hostId.toString()) {
        // Unauthorized
        return callback(new Error('Unauthorized: You can only delete your own listings'));
      }

      const updatedHomes = homes.filter((h) => h.id.toString() !== id.toString());
      fs.writeFile(homeDataPath, JSON.stringify(updatedHomes, null, 2), (err) => {
        // Clean up linked favorites and bookings
        const Favorite = require('./favorite');
        const Booking = require('./booking');
        Favorite.deleteByHomeId(id, () => {
          Booking.deleteByHomeId(id, () => {
            if (callback) callback(err);
          });
        });
      });
    });
  }
};