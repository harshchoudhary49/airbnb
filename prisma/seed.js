const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Hash demo password at runtime
const demoPasswordHash = bcrypt.hashSync(process.env.DEMO_USER_PASSWORD || 'AirbnbDemo2026!', 10);

const initialUsers = [
  {
    id: 'user_host_1',
    name: 'Harsh (Host)',
    email: 'host@airbnb.com',
    passwordHash: demoPasswordHash,
    userType: 'host'
  },
  {
    id: 'user_guest_1',
    name: 'Harsh (Guest)',
    email: 'guest@airbnb.com',
    passwordHash: demoPasswordHash,
    userType: 'guest'
  }
];

const initialHomes = [
  {
    id: '1',
    houseName: 'Modern Downtown Apartment',
    price: 2500,
    location: 'Mumbai',
    rating: '4.8',
    photoUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    description: 'Experience a delightful stay at Modern Downtown Apartment in the heart of Mumbai. Boasts top-tier comfort, high-speed Wi-Fi, and a serene ambiance.',
    hostId: 'user_host_1'
  },
  {
    id: '2',
    houseName: 'Spacious Villa with Garden',
    price: 5000,
    location: 'Pune',
    rating: '4.8',
    photoUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
    description: 'Delightful villa with lush green garden and private patio in Pune. Ideal for families and weekend retreats.',
    hostId: 'user_host_1'
  },
  {
    id: '3',
    houseName: 'Cozy Studio in City Center',
    price: 1800,
    location: 'Delhi',
    rating: '4.2',
    photoUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    description: 'Cozy, well-lit studio apartment located right at city center. Walking distance to Metro station, cafes, and historic landmarks.',
    hostId: 'user_host_1'
  },
  {
    id: '4',
    houseName: 'Luxury Penthouse Suite',
    price: 8000,
    location: 'Bangalore',
    rating: '4.9',
    photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    description: 'Stunning skyline views from this luxury penthouse in Bangalore. Features a private terrace and designer interiors.',
    hostId: 'user_host_1'
  },
  {
    id: '5',
    houseName: 'Charming Beachside Cottage',
    price: 3200,
    location: 'Goa',
    rating: '4.7',
    photoUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
    description: 'Charming beachside retreat in North Goa. Enjoy gentle sea breezes, swaying palm trees, and quick beach access.',
    hostId: 'user_host_1'
  },
  {
    id: '6',
    houseName: 'Tranquil Mountain Cabin',
    price: 2800,
    location: 'Shimla',
    rating: '4.5',
    photoUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800',
    description: 'Perched on the hills of Shimla with sweeping mountain views. Complete with a fireplace and cozy cedarwood architecture.',
    hostId: 'user_host_1'
  }
];

async function seed() {
  console.log('--- Starting PostgreSQL Seed ---');

  // 1. Seed Users
  for (const u of initialUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        userType: u.userType
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.passwordHash,
        userType: u.userType
      }
    });
  }

  // 2. Seed Homes
  for (const h of initialHomes) {
    await prisma.home.upsert({
      where: { id: h.id },
      update: {
        houseName: h.houseName,
        price: h.price,
        location: h.location,
        rating: h.rating,
        photoUrl: h.photoUrl,
        description: h.description,
        hostId: h.hostId
      },
      create: {
        id: h.id,
        houseName: h.houseName,
        price: h.price,
        location: h.location,
        rating: h.rating,
        photoUrl: h.photoUrl,
        description: h.description,
        hostId: h.hostId
      }
    });
  }

  // 3. Seed Sample Bookings
  const demoBookings = [
    {
      id: 'demo_booking_1',
      homeId: '1',
      userId: 'user_guest_1',
      guestName: 'Harsh (Guest)',
      guestEmail: 'guest@airbnb.com',
      checkIn: '2026-11-10',
      checkOut: '2026-11-14',
      guestsCount: 2,
      totalAmount: 10000,
      bookedAt: 'Oct 1, 2026',
      status: 'Confirmed'
    },
    {
      id: 'demo_booking_2',
      homeId: '5',
      userId: 'user_guest_1',
      guestName: 'Harsh (Guest)',
      guestEmail: 'guest@airbnb.com',
      checkIn: '2026-12-20',
      checkOut: '2026-12-25',
      guestsCount: 2,
      totalAmount: 16000,
      bookedAt: 'Oct 5, 2026',
      status: 'Confirmed'
    }
  ];

  for (const b of demoBookings) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: {},
      create: b
    });
  }

  // 4. Seed Sample Reviews
  const demoReviews = [
    {
      id: 'demo_rev_1',
      homeId: '1',
      userId: 'user_guest_1',
      rating: 5,
      comment: 'Absolutely breathtaking place! Impeccably clean, great Wi-Fi, and the host was super communicative.'
    },
    {
      id: 'demo_rev_2',
      homeId: '5',
      userId: 'user_guest_1',
      rating: 5,
      comment: 'The cottage was paradise. Seconds to the beach, wonderful patio, will definitely be booking again!'
    }
  ];

  for (const r of demoReviews) {
    await prisma.review.upsert({
      where: { id: r.id },
      update: {
        rating: r.rating,
        comment: r.comment
      },
      create: r
    });
  }

  console.log('--- PostgreSQL Seed Completed Successfully ---');
}

seed()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
