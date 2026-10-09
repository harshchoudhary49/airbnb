const Home = require("../models/home");
const Favorite = require("../models/favorite");
const Booking = require("../models/booking");
const Review = require("../models/review");
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

exports.getHomeDetails = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const userId = req.session.user ? req.session.user.id : null;

    const home = await Home.findById(homeId);
    if (!home) {
      return res.status(404).render('404', { pageTitle: 'Home Not Found' });
    }

    const [favoriteIds, reviews] = await Promise.all([
      new Promise((resolve) => Favorite.getFavoriteIds(userId, resolve)),
      Review.fetchByHomeId(homeId)
    ]);

    const isFavorite = favoriteIds.includes(home.id.toString());
    const totalReviews = reviews.length;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let avgRating = 'New';

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => {
        counts[r.rating] = (counts[r.rating] || 0) + 1;
        return acc + r.rating;
      }, 0);
      avgRating = (sum / totalReviews).toFixed(1);
    }

    const percentages = {};
    for (let star = 1; star <= 5; star++) {
      percentages[star] = totalReviews > 0 ? Math.round((counts[star] / totalReviews) * 100) : 0;
    }

    const userReview = userId ? reviews.find((r) => r.userId === userId) : null;

    res.render('store/home-detail', {
      home: home,
      isFavorite: isFavorite,
      reviews: reviews,
      reviewStats: {
        avg: avgRating,
        total: totalReviews,
        counts: counts,
        percentages: percentages
      },
      hasUserReviewed: Boolean(userReview),
      userReview: userReview,
      reviewError: req.query.reviewError || null,
      pageTitle: home.houseName
    });
  } catch (err) {
    console.error('Error in getHomeDetails:', err);
    res.status(500).render('404', { pageTitle: 'Server Error' });
  }
};

exports.postAddReview = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const userId = req.session.user ? req.session.user.id : null;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.redirect('/login');
    }

    const parsedRating = parseInt(rating, 10);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5 || !comment || !comment.trim()) {
      return res.redirect(`/homes/${homeId}?reviewError=${encodeURIComponent('Please select a star rating (1-5) and write a comment.')}#reviews-section`);
    }

    await Review.create({
      homeId,
      userId,
      rating: parsedRating,
      comment: comment.trim()
    });

    res.redirect(`/homes/${homeId}#reviews-section`);
  } catch (err) {
    console.error('Error posting review:', err);
    res.redirect(`/homes/${req.params.homeId}`);
  }
};

exports.postDeleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.session.user ? req.session.user.id : null;
    const returnHomeId = req.body.homeId;

    if (!userId) {
      return res.redirect('/login');
    }

    await Review.deleteById(reviewId, userId);
    res.redirect(`/homes/${returnHomeId}#reviews-section`);
  } catch (err) {
    console.error('Error deleting review:', err);
    res.redirect('/homes');
  }
};

exports.getReserveHome = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);
    if (!home) {
      return res.redirect('/homes');
    }

    // Fetch confirmed bookings for this home to disable booked dates in calendar
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        homeId: homeId.toString(),
        status: { in: ['Confirmed', 'Active'] }
      },
      select: {
        checkIn: true,
        checkOut: true
      }
    });

    const bookedRanges = confirmedBookings.map((b) => ({
      from: b.checkIn,
      to: b.checkOut
    }));

    res.render('store/reserve', {
      home: home,
      bookedRanges: bookedRanges,
      errorMessage: req.query.error || null,
      pageTitle: `Reserve - ${home.houseName}`
    });
  } catch (err) {
    console.error('Error in getReserveHome:', err);
    res.redirect('/homes');
  }
};

exports.postReserveHome = async (req, res, next) => {
  try {
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
    const home = await Home.findById(homeId);
    if (!home) {
      return res.redirect('/homes');
    }

    // Validate dates: checkIn must be valid, checkOut must be strictly after checkIn
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      isNaN(checkInDate.getTime()) ||
      isNaN(checkOutDate.getTime()) ||
      checkOutDate <= checkInDate ||
      checkInDate < today
    ) {
      return res.redirect(
        `/reserve/${homeId}?error=${encodeURIComponent(
          'Please select a valid check-in and check-out date range in the future.'
        )}`
      );
    }

    // AIRBNB DOUBLE-BOOKING PREVENTER:
    // Check if any existing confirmed booking overlaps with the selected date range.
    // Interval overlap condition: newCheckIn < existingCheckOut AND newCheckOut > existingCheckIn
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        homeId: homeId.toString(),
        status: { in: ['Confirmed', 'Active'] }
      }
    });

    const isOverlapping = confirmedBookings.some((b) => {
      const bIn = new Date(b.checkIn);
      const bOut = new Date(b.checkOut);
      return checkInDate < bOut && checkOutDate > bIn;
    });

    if (isOverlapping) {
      return res.redirect(
        `/reserve/${homeId}?error=${encodeURIComponent(
          'The selected dates are no longer available. Another guest has already reserved this property for overlapping nights. Please select alternate dates.'
        )}`
      );
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
        return res.redirect(
          `/reserve/${homeId}?error=${encodeURIComponent(
            'Unable to process booking at this time. Please try again.'
          )}`
        );
      }
      res.redirect('/bookings');
    });
  } catch (err) {
    console.error('Error in postReserveHome:', err);
    res.redirect(`/reserve/${req.body.homeId}`);
  }
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

    // Compute Host Revenue metrics if the logged-in user is a Host
    let hostMetrics = null;
    let hostBookings = [];
    let propertyBreakdown = [];
    let hostMonthlyTrend = [];

    const isHost = Boolean(req.session.user && req.session.user.userType === 'host');
    if (isHost) {
      const rawHostBookings = await prisma.booking.findMany({
        where: {
          home: { hostId: userId.toString() }
        },
        include: { home: true, user: true },
        orderBy: { createdAt: 'desc' }
      });

      let totalHostRevenue = 0;
      let totalHostedNights = 0;
      let upcomingRevenue = 0;
      let completedRevenue = 0;
      const propMap = {};
      const hostMonthMap = {};

      hostBookings = rawHostBookings.map((b) => {
        const amount = parseFloat(b.totalAmount) || 0;
        totalHostRevenue += amount;

        let nights = 1;
        if (b.checkIn && b.checkOut) {
          const inDate = new Date(b.checkIn);
          const outDate = new Date(b.checkOut);
          if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime()) && outDate > inDate) {
            nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)));
          }
        }
        totalHostedNights += nights;

        const isUpcoming = b.checkIn && b.checkIn >= todayStr;
        if (isUpcoming) {
          upcomingRevenue += amount;
        } else {
          completedRevenue += amount;
        }

        // Property aggregation
        const propName = (b.home && b.home.houseName ? b.home.houseName : 'Property').trim();
        if (!propMap[propName]) {
          propMap[propName] = {
            propertyName: propName,
            location: b.home ? b.home.location : '',
            photoUrl: b.home ? b.home.photoUrl : '',
            totalRevenue: 0,
            bookingsCount: 0,
            nightsCount: 0
          };
        }
        propMap[propName].totalRevenue += amount;
        propMap[propName].bookingsCount += 1;
        propMap[propName].nightsCount += nights;

        // Monthly revenue aggregation
        const bookingDate = b.checkIn ? new Date(b.checkIn) : new Date(b.createdAt);
        const monthKey = !isNaN(bookingDate.getTime())
          ? bookingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
          : 'Unknown';

        if (!hostMonthMap[monthKey]) {
          hostMonthMap[monthKey] = {
            month: monthKey,
            totalRevenue: 0,
            count: 0,
            sortTime: !isNaN(bookingDate.getTime()) ? bookingDate.getTime() : 0
          };
        }
        hostMonthMap[monthKey].totalRevenue += amount;
        hostMonthMap[monthKey].count += 1;

        return {
          ...b,
          calculatedNights: nights,
          isUpcoming
        };
      });

      const avgPayoutPerBooking = hostBookings.length > 0 ? Math.round(totalHostRevenue / hostBookings.length) : 0;
      const avgNightlyRevenue = totalHostedNights > 0 ? Math.round(totalHostRevenue / totalHostedNights) : 0;

      propertyBreakdown = Object.values(propMap)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .map((p) => ({
          ...p,
          percentage: totalHostRevenue > 0 ? Math.round((p.totalRevenue / totalHostRevenue) * 100) : 0
        }));

      hostMonthlyTrend = Object.values(hostMonthMap).sort((a, b) => a.sortTime - b.sortTime);

      hostMetrics = {
        totalRevenue: totalHostRevenue,
        totalBookings: hostBookings.length,
        totalHostedNights,
        upcomingRevenue,
        completedRevenue,
        avgPayoutPerBooking,
        avgNightlyRevenue,
        topProperty: propertyBreakdown.length > 0 ? propertyBreakdown[0].propertyName : 'None'
      };
    }

    res.render('store/spend-analyzer', {
      pageTitle: 'Travel Spend & Revenue Analyzer',
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
      monthlyTrend,
      hostMetrics,
      hostBookings,
      propertyBreakdown,
      hostMonthlyTrend
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

    const exportType = req.query.type || 'spend'; // 'spend' or 'revenue'

    if (exportType === 'revenue') {
      const hostBookings = await prisma.booking.findMany({
        where: {
          home: { hostId: userId.toString() }
        },
        include: { home: true, user: true },
        orderBy: { createdAt: 'desc' }
      });

      const csvRows = [
        ['Booking ID', 'Property Name', 'Guest Name', 'Guest Email', 'Check-In', 'Check-Out', 'Nights', 'Guests', 'Payout Revenue (INR)', 'Status', 'Booking Date']
      ];

      hostBookings.forEach((b) => {
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
          `"${(b.guestName || '').replace(/"/g, '""')}"`,
          `"${(b.guestEmail || '').replace(/"/g, '""')}"`,
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
      res.setHeader('Content-Disposition', `attachment; filename="airbnb-host-revenue-report-${Date.now()}.csv"`);
      return res.status(200).send(csvContent);
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