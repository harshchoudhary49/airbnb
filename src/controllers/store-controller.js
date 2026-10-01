const Home = require("../models/home");
const Favorite = require("../models/favorite");
const Booking = require("../models/booking");

exports.getIndex = (req, res, next) => {
  const searchQuery = (req.query.search || '').trim().toLowerCase();
  const userId = req.session.user ? req.session.user.id : null;

  Home.fetchAll((registeredHomes) => {
    Favorite.getFavoriteIds(userId, (favoriteIds) => {
      let homes = registeredHomes;
      if (searchQuery) {
        homes = homes.filter(
          (h) =>
            (h.houseName || '').toLowerCase().includes(searchQuery) ||
            (h.location || '').toLowerCase().includes(searchQuery) ||
            (h.description || '').toLowerCase().includes(searchQuery)
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
  const userId = req.session.user ? req.session.user.id : null;

  Home.fetchAll((registeredHomes) => {
    Favorite.getFavoriteIds(userId, (favoriteIds) => {
      let homes = registeredHomes || [];
      if (searchQuery) {
        homes = homes.filter(
          (h) =>
            (h.houseName || '').toLowerCase().includes(searchQuery) ||
            (h.location || '').toLowerCase().includes(searchQuery) ||
            (h.description || '').toLowerCase().includes(searchQuery)
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
  const userId = req.session.user ? req.session.user.id : null;

  Home.findById(homeId, (home) => {
    if (!home) {
      return res.status(404).render('404', { pageTitle: 'Home Not Found' });
    }
    Favorite.getFavoriteIds(userId, (favoriteIds) => {
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
    checkIn,
    checkOut,
    guestsCount,
    guestName,
    guestEmail
  } = req.body;

  if (!req.session.user) {
    return res.redirect('/login');
  }

  const userId = req.session.user.id;

  // Retrieve authentic home details from DB to prevent client-side price tampering
  Home.findById(homeId, (home) => {
    if (!home) {
      return res.redirect('/homes');
    }

    // Validate dates: checkIn must be valid, checkOut must be after checkIn
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (
      isNaN(checkInDate.getTime()) ||
      isNaN(checkOutDate.getTime()) ||
      checkOutDate <= checkInDate
    ) {
      return res.redirect(`/reserve/${homeId}`);
    }

    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const authenticPrice = parseFloat(home.price) || 0;
    const totalAmount = nights * authenticPrice;

    const booking = new Booking(
      home.id,
      home.houseName,
      authenticPrice,
      home.location,
      home.photoUrl,
      (guestName || req.session.user.name || '').trim(),
      (guestEmail || req.session.user.email || '').trim(),
      checkIn,
      checkOut,
      parseInt(guestsCount, 10) || 1,
      totalAmount,
      userId
    );

    booking.save((err) => {
      if (err) {
        console.error('Error saving booking:', err);
      }
      res.redirect('/bookings');
    });
  });
};

exports.getBookings = (req, res, next) => {
  const userId = req.session.user ? req.session.user.id : null;
  if (!userId) {
    return res.redirect('/login');
  }
  Booking.fetchByUserId(userId, (bookings) => {
    res.render('store/booking', {
      bookings: bookings || [],
      pageTitle: 'My Bookings'
    });
  });
};

exports.postCancelBooking = (req, res, next) => {
  const bookingId = req.body.bookingId;
  const userId = req.session.user ? req.session.user.id : null;

  if (!userId) {
    return res.redirect('/login');
  }

  Booking.deleteById(bookingId, userId, (err) => {
    if (err) {
      console.error('Error cancelling booking:', err);
      if (err.message === 'Unauthorized') {
        return res.status(403).render('403', {
          pageTitle: 'Forbidden',
          message: 'You are not authorized to cancel this booking.'
        });
      }
    }
    res.redirect('/bookings');
  });
};

exports.getfavoritelist = (req, res, next) => {
  const userId = req.session.user ? req.session.user.id : null;
  if (!userId) {
    return res.redirect('/login');
  }

  Home.fetchAll((registeredHomes) => {
    Favorite.getFavoriteIds(userId, (favoriteIds) => {
      const favoriteHomes = (registeredHomes || []).filter((home) =>
        (favoriteIds || []).includes(home.id.toString())
      );
      res.render('store/favorite-list', {
        registeredHomes: favoriteHomes,
        pageTitle: 'My Favorite Homes'
      });
    });
  });
};

exports.postAddToFavorites = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    req.session.returnTo = req.get('Referrer') || '/';
    return res.redirect('/login');
  }

  const homeId = req.body.homeId;
  const userId = req.session.user.id;

  Favorite.addToFavorites(userId, homeId, () => {
    const referrer = req.get('Referrer') || '/favorites';
    res.redirect(referrer);
  });
};

exports.postRemoveFromFavorites = (req, res, next) => {
  if (!req.session || !req.session.isLoggedIn) {
    return res.redirect('/login');
  }

  const homeId = req.body.homeId;
  const userId = req.session.user.id;

  Favorite.removeFromFavorites(userId, homeId, () => {
    const referrer = req.get('Referrer') || '/favorites';
    res.redirect(referrer);
  });
};