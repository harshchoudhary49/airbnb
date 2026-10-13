const Home = require("../models/home");

exports.getAddHome = (req, res, next) => {
  res.render('host/addhome', {
    pageTitle: 'Add Home to airbnb',
    editing: false,
    home: {}
  });
};

exports.getHostHomes = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const currentHostId = req.session.user.id;
  Home.findByHostId(currentHostId, (registeredHomes) => {
    res.render('host/host-home-list', {
      registeredHomes: registeredHomes || [],
      pageTitle: 'Host Homes List'
    });
  });
};

// Check that an image URL uses HTTPS
const isValidHttpsUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

exports.postAddHome = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const hostId = req.session.user.id;
  const { houseName, price, location, photoUrl, description } = req.body;

  // Sanitize form inputs
  const cleanedName = (houseName || '').trim();
  const cleanedLocation = (location || '').trim();
  const cleanedPhoto = (photoUrl || '').trim();
  const cleanedDesc = (description || '').trim();
  const numericPrice = parseFloat(price);

  if (!cleanedName || !cleanedLocation || !cleanedPhoto || isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(422).render('host/addhome', {
      pageTitle: 'Add Home to airbnb',
      editing: false,
      home: { houseName, price, location, photoUrl, description },
      errorMessage: 'Please provide valid property details and a positive price.'
    });
  }

  // Validate field lengths
  if (cleanedName.length > 100) {
    return res.status(422).render('host/addhome', {
      pageTitle: 'Add Home to airbnb',
      editing: false,
      home: { houseName, price, location, photoUrl, description },
      errorMessage: 'Property name cannot exceed 100 characters.'
    });
  }

  if (cleanedLocation.length > 150) {
    return res.status(422).render('host/addhome', {
      pageTitle: 'Add Home to airbnb',
      editing: false,
      home: { houseName, price, location, photoUrl, description },
      errorMessage: 'Location cannot exceed 150 characters.'
    });
  }

  if (cleanedPhoto.length > 2000 || !isValidHttpsUrl(cleanedPhoto)) {
    return res.status(422).render('host/addhome', {
      pageTitle: 'Add Home to airbnb',
      editing: false,
      home: { houseName, price, location, photoUrl, description },
      errorMessage: 'Photo URL must be a valid, secure URL starting with https:// and under 2000 characters.'
    });
  }

  if (cleanedDesc.length > 2000) {
    return res.status(422).render('host/addhome', {
      pageTitle: 'Add Home to airbnb',
      editing: false,
      home: { houseName, price, location, photoUrl, description },
      errorMessage: 'Description cannot exceed 2000 characters.'
    });
  }

  const home = new Home(
    cleanedName,
    numericPrice,
    cleanedLocation,
    'New', // Default rating for new listings
    cleanedPhoto,
    cleanedDesc,
    hostId
  );

  home.save((err) => {
    if (err) {
      console.error('Error saving home:', err);
      return res.redirect('/host/add-home');
    }
    res.render('host/homeadded', { pageTitle: 'Home Added Successfully' });
  });
};

exports.getEditHome = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const homeId = req.params.homeId;
  const currentHostId = req.session.user.id;

  Home.findById(homeId, (home) => {
    if (!home) {
      return res.redirect('/host-home-list');
    }
    // Host can only edit their own listings
    if (home.hostId !== currentHostId) {
      return res.status(403).render('403', {
        pageTitle: 'Forbidden',
        message: 'You can only edit properties that you created.'
      });
    }
    res.render('host/edit-home', {
      pageTitle: 'Edit Listing - ' + home.houseName,
      editing: true,
      home: home
    });
  });
};

exports.postEditHome = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const { id, houseName, price, location, photoUrl, description } = req.body;
  const currentHostId = req.session.user.id;

  Home.findById(id, (existingHome) => {
    if (!existingHome) {
      return res.redirect('/host/host-home-list');
    }
    // Host can only edit their own listings
    if (existingHome.hostId !== currentHostId) {
      return res.status(403).render('403', {
        pageTitle: 'Forbidden',
        message: 'You can only update properties that you created.'
      });
    }

    const cleanedName = (houseName || '').trim();
    const cleanedLocation = (location || '').trim();
    const cleanedPhoto = (photoUrl || '').trim();
    const cleanedDesc = (description || '').trim();
    const numericPrice = parseFloat(price);

    if (!cleanedName || !cleanedLocation || !cleanedPhoto || isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(422).render('host/edit-home', {
        pageTitle: 'Edit Listing - ' + (cleanedName || existingHome.houseName),
        editing: true,
        home: { id, houseName, price, location, photoUrl, description },
        errorMessage: 'Please provide valid property details and a positive price.'
      });
    }

    // Validate field lengths
    if (cleanedName.length > 100) {
      return res.status(422).render('host/edit-home', {
        pageTitle: 'Edit Listing - ' + (cleanedName || existingHome.houseName),
        editing: true,
        home: { id, houseName, price, location, photoUrl, description },
        errorMessage: 'Property name cannot exceed 100 characters.'
      });
    }

    if (cleanedLocation.length > 150) {
      return res.status(422).render('host/edit-home', {
        pageTitle: 'Edit Listing - ' + (cleanedName || existingHome.houseName),
        editing: true,
        home: { id, houseName, price, location, photoUrl, description },
        errorMessage: 'Location cannot exceed 150 characters.'
      });
    }

    if (cleanedPhoto.length > 2000 || !isValidHttpsUrl(cleanedPhoto)) {
      return res.status(422).render('host/edit-home', {
        pageTitle: 'Edit Listing - ' + (cleanedName || existingHome.houseName),
        editing: true,
        home: { id, houseName, price, location, photoUrl, description },
        errorMessage: 'Photo URL must be a valid, secure URL starting with https:// and under 2000 characters.'
      });
    }

    if (cleanedDesc.length > 2000) {
      return res.status(422).render('host/edit-home', {
        pageTitle: 'Edit Listing - ' + (cleanedName || existingHome.houseName),
        editing: true,
        home: { id, houseName, price, location, photoUrl, description },
        errorMessage: 'Description cannot exceed 2000 characters.'
      });
    }

    const updatedHome = new Home(
      cleanedName,
      numericPrice,
      cleanedLocation,
      existingHome.rating || 'New', // Keep existing rating
      cleanedPhoto,
      cleanedDesc,
      currentHostId,
      id
    );

    updatedHome.save((err) => {
      if (err) {
        console.error('Error updating home:', err);
      }
      res.redirect('/host/host-home-list');
    });
  });
};

exports.postDeleteHome = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const homeId = req.body.homeId;
  const currentHostId = req.session.user.id;

  Home.deleteById(homeId, currentHostId, (err) => {
    if (err) {
      console.error('Error deleting home:', err);
      if (err.message && err.message.includes('Unauthorized')) {
        return res.status(403).render('403', {
          pageTitle: 'Forbidden',
          message: 'You can only delete properties that you created.'
        });
      }
    }
    res.redirect('/host/host-home-list');
  });
};
