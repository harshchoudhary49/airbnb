const Home = require("../models/home");
const Favorite = require("../models/favorite");
const Booking = require("../models/booking");

exports.getIndex = (req, res, next) => {
  const searchQuery = (req.query.search || '').trim().toLowerCase();
  Home.fetchAll((registeredHomes) => {
    Favorite.getFavoriteIds((favoriteIds) => {
      let homes = registeredHomes;
      if (searchQuery) {
        homes = homes.filter(
          (h) =>
            h.houseName.toLowerCase().includes(searchQuery) ||
            h.location.toLowerCase().includes(searchQuery)
        );
      }
      res.render('store/index-list', {
        registeredHomes: homes,
        favoriteIds: favoriteIds,
        searchQuery: searchQuery,
        pageTitle: 'Airbnb - Vacation Rentals & Cabins'
      });
    });
  });
};

exports.getHomes = (req, res, next) => {
  const searchQuery = (req.query.search || '').trim().toLowerCase();
  Home.fetchAll((registeredHomes) => {
    Favorite.getFavoriteIds((favoriteIds) => {
      let homes = registeredHomes;
      if (searchQuery) {
        homes = homes.filter(
          (h) =>
            h.houseName.toLowerCase().includes(searchQuery) ||
            h.location.toLowerCase().includes(searchQuery)
        );
      }
      res.render('store/home-list', {
        registeredHomes: homes,
        favoriteIds: favoriteIds,
        searchQuery: searchQuery,
        pageTitle: 'All Registered Homes'
      });
    });
  });
};

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId, (home) => {
    if (!home) {
      return res.status(404).render('404', { pageTitle: 'Home Not Found' });
    }
    Favorite.getFavoriteIds((favoriteIds) => {
      const isFavorite = favoriteIds.includes(home.id.toString());
      res.render('store/home-detail', {
        home: home,
        isFavorite: isFavorite,
        pageTitle: home.houseName
      });
    });
  });
};

exports.getReserveHome = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId, (home) => {
    if (!home) {
      return res.redirect('/homes');
    }
    res.render('store/reserve', {
      home: home,
      pageTitle: `Reserve - ${home.houseName}`
    });
  });
};

exports.postReserveHome = (req, res, next) => {
  const {
    homeId,
    houseName,
    price,
    location,
    photoUrl,
    guestName,
    guestEmail,
    checkIn,
    checkOut,
    guestsCount
  } = req.body;

  // Calculate total nights
  let nights = 1;
  if (checkIn && checkOut) {
    const diffTime = Math.abs(new Date(checkOut) - new Date(checkIn));
    nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
  const totalAmount = nights * (parseFloat(price) || 0);

  const booking = new Booking(
    homeId,
    houseName,
    price,
    location,
    photoUrl,
    guestName,
    guestEmail,
    checkIn,
    checkOut,
    guestsCount || 1,
    totalAmount
  );

  booking.save((err) => {
    if (err) {
      console.error('Error saving booking:', err);
    }
    res.redirect('/bookings');
  });
};

exports.getBookings = (req, res, next) => {
  Booking.fetchAll((bookings) => {
    res.render('store/booking', {
      bookings: bookings,
      pageTitle: 'My Bookings'
    });
  });
};

exports.postCancelBooking = (req, res, next) => {
  const bookingId = req.body.bookingId;
  Booking.deleteById(bookingId, (err) => {
    if (err) {
      console.error('Error cancelling booking:', err);
    }
    res.redirect('/bookings');
  });
};

exports.getfavoritelist = (req, res, next) => {
  Home.fetchAll((registeredHomes) => {
    Favorite.getFavoriteIds((favoriteIds) => {
      const favoriteHomes = registeredHomes.filter((home) =>
        favoriteIds.includes(home.id.toString())
      );
      res.render('store/favorite-list', {
        registeredHomes: favoriteHomes,
        pageTitle: 'My Favorite Homes'
      });
    });
  });
};

exports.postAddToFavorites = (req, res, next) => {
  const homeId = req.body.homeId;
  Favorite.addToFavorites(homeId, () => {
    const referrer = req.get('Referrer') || '/favorites';
    res.redirect(referrer);
  });
};

exports.postRemoveFromFavorites = (req, res, next) => {
  const homeId = req.body.homeId;
  Favorite.removeFromFavorites(homeId, () => {
    const referrer = req.get('Referrer') || '/favorites';
    res.redirect(referrer);
  });
};