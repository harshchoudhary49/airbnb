const Home = require("../models/home");

exports.getAddHome = (req, res, next) => {
  res.render('host/addhome', {
    pageTitle: 'Add Home to airbnb',
    editing: false,
    home: {}
  });
};

exports.getHostHomes = (req, res, next) => {
  const currentHostId = req.session.user ? req.session.user.id : 'user_host_1';
  Home.findByHostId(currentHostId, (registeredHomes) => {
    res.render('host/host-home-list', {
      registeredHomes: registeredHomes || [],
      pageTitle: 'Host Homes List'
    });
  });
};

exports.postAddHome = (req, res, next) => {
  const { houseName, price, location, photoUrl, description } = req.body;
  const hostId = req.session.user ? req.session.user.id : 'user_host_1';

  // Sanitize and validate inputs
  const cleanedName = (houseName || '').trim();
  const cleanedLocation = (location || '').trim();
  const cleanedPhoto = (photoUrl || '').trim();
  const numericPrice = parseFloat(price);

  if (!cleanedName || !cleanedLocation || !cleanedPhoto || isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(422).render('host/addhome', {
      pageTitle: 'Add Home to airbnb',
      editing: false,
      home: { houseName, price, location, photoUrl, description },
      errorMessage: 'Please provide valid property details and a positive price.'
    });
  }

  const home = new Home(
    cleanedName,
    numericPrice,
    cleanedLocation,
    'New', // Newly listed property defaults to 'New' until guests leave reviews
    cleanedPhoto,
    (description || '').trim(),
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
  const homeId = req.params.homeId;
  const currentHostId = req.session.user ? req.session.user.id : 'user_host_1';

  Home.findById(homeId, (home) => {
    if (!home) {
      return res.redirect('/host/host-home-list');
    }
    // Verify property ownership
    if ((home.hostId || 'user_host_1') !== currentHostId) {
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
  const { id, houseName, price, location, photoUrl, description } = req.body;
  const currentHostId = req.session.user ? req.session.user.id : 'user_host_1';

  Home.findById(id, (existingHome) => {
    if (!existingHome) {
      return res.redirect('/host/host-home-list');
    }
    // Verify ownership
    if ((existingHome.hostId || 'user_host_1') !== currentHostId) {
      return res.status(403).render('403', {
        pageTitle: 'Forbidden',
        message: 'You can only update properties that you created.'
      });
    }

    const cleanedName = (houseName || '').trim();
    const cleanedLocation = (location || '').trim();
    const cleanedPhoto = (photoUrl || '').trim();
    const numericPrice = parseFloat(price);

    if (!cleanedName || !cleanedLocation || !cleanedPhoto || isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(422).render('host/edit-home', {
        pageTitle: 'Edit Listing - ' + (cleanedName || existingHome.houseName),
        editing: true,
        home: { id, houseName, price, location, photoUrl, description },
        errorMessage: 'Please provide valid property details and a positive price.'
      });
    }

    const updatedHome = new Home(
      cleanedName,
      numericPrice,
      cleanedLocation,
      existingHome.rating || 'New', // Preserve authentic rating!
      cleanedPhoto,
      (description || '').trim(),
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
  const homeId = req.body.homeId;
  const currentHostId = req.session.user ? req.session.user.id : 'user_host_1';

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
