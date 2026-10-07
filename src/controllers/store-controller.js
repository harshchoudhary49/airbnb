const Home = require("../models/home");
const Favorite = require("../models/favorite");
const Booking = require("../models/booking");
const prisma = require("../db/prisma");

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

exports.getSpendAnalyzer = async (req, res, next) => {
  try {
    const userId = req.session.user ? req.session.user.id : null;
    if (!userId) {
      return res.redirect('/login');
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: userId.toString() },
      include: { home: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalBookings = bookings.length;
    let totalSpend = 0;
    let totalNights = 0;
    let upcomingSpend = 0;
    let completedSpend = 0;
    const cityMap = {};
    const monthlyMap = {};

    const todayStr = new Date().toISOString().split('T')[0];

    const processedBookings = bookings.map((b) => {
      const amount = parseFloat(b.totalAmount) || 0;
      totalSpend += amount;

      // Calculate nights
      let nights = 1;
      if (b.checkIn && b.checkOut) {
        const inDate = new Date(b.checkIn);
        const outDate = new Date(b.checkOut);
        if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime()) && outDate > inDate) {
          nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)));
        }
      }
      totalNights += nights;

      // Upcoming vs Past spend
      const isUpcoming = b.checkIn && b.checkIn >= todayStr;
      if (isUpcoming) {
        upcomingSpend += amount;
      } else {
        completedSpend += amount;
      }

      // City / Location aggregation
      const city = (b.home && b.home.location ? b.home.location : 'Other').trim();
      if (!cityMap[city]) {
        cityMap[city] = { city, totalAmount: 0, count: 0, nights: 0 };
      }
      cityMap[city].totalAmount += amount;
      cityMap[city].count += 1;
      cityMap[city].nights += nights;

      // Monthly aggregation
      const bookingDate = b.checkIn ? new Date(b.checkIn) : new Date(b.createdAt);
      const monthKey = !isNaN(bookingDate.getTime())
        ? bookingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        : 'Unknown';

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          totalAmount: 0,
          count: 0,
          sortTime: !isNaN(bookingDate.getTime()) ? bookingDate.getTime() : 0
        };
      }
      monthlyMap[monthKey].totalAmount += amount;
      monthlyMap[monthKey].count += 1;

      return {
        ...b,
        calculatedNights: nights,
        isUpcoming
      };
    });

    const avgNightlyRate = totalNights > 0 ? Math.round(totalSpend / totalNights) : 0;
    const avgTripCost = totalBookings > 0 ? Math.round(totalSpend / totalBookings) : 0;

    // Sort cities by amount descending
    const cityBreakdown = Object.values(cityMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((c) => ({
        ...c,
        percentage: totalSpend > 0 ? Math.round((c.totalAmount / totalSpend) * 100) : 0
      }));

    const topDestination = cityBreakdown.length > 0 ? cityBreakdown[0].city : 'None';

    // Sort monthly trend chronologically
    const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.sortTime - b.sortTime);

    // Compute percentage of spend per trip for table
    const enrichedBookings = processedBookings.map((b) => ({
      ...b,
      spendPercentage: totalSpend > 0 ? ((b.totalAmount / totalSpend) * 100).toFixed(1) : 0
    }));

    // Default target budget
    const targetBudget = 60000;

    res.render('store/spend-analyzer', {
      pageTitle: 'Travel Spend Analyzer & Budget',
      bookings: enrichedBookings,
      metrics: {
        totalSpend,
        totalBookings,
        totalNights,
        avgNightlyRate,
        avgTripCost,
        upcomingSpend,
        completedSpend,
        topDestination,
        targetBudget
      },
      cityBreakdown,
      monthlyTrend
    });
  } catch (error) {
    console.error('Error in getSpendAnalyzer:', error);
    next(error);
  }
};

exports.getSpendExport = async (req, res, next) => {
  try {
    const userId = req.session.user ? req.session.user.id : null;
    if (!userId) {
      return res.redirect('/login');
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: userId.toString() },
      include: { home: true },
      orderBy: { createdAt: 'desc' }
    });

    const csvRows = [
      ['Booking ID', 'Property Name', 'Location', 'Check-In', 'Check-Out', 'Nights', 'Guests', 'Total Amount (INR)', 'Status', 'Booked Date']
    ];

    bookings.forEach((b) => {
      let nights = 1;
      if (b.checkIn && b.checkOut) {
        const inDate = new Date(b.checkIn);
        const outDate = new Date(b.checkOut);
        if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime()) && outDate > inDate) {
          nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)));
        }
      }

      csvRows.push([
        `"${b.id}"`,
        `"${(b.home ? b.home.houseName : '').replace(/"/g, '""')}"`,
        `"${(b.home ? b.home.location : '').replace(/"/g, '""')}"`,
        `"${b.checkIn || ''}"`,
        `"${b.checkOut || ''}"`,
        nights,
        b.guestsCount || 1,
        b.totalAmount || 0,
        `"${b.status || 'Confirmed'}"`,
        `"${b.bookedAt || ''}"`
      ]);
    });

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="airbnb-spend-report-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error in getSpendExport:', error);
    next(error);
  }
};