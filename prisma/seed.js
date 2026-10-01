const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dataDir = path.join(__dirname, '..', 'src', 'data');

async function seed() {
  console.log('--- Starting PostgreSQL Seed from JSON Data ---');

  // 1. Seed Users
  const usersPath = path.join(dataDir, 'users.json');
  if (fs.existsSync(usersPath)) {
    const rawUsers = fs.readFileSync(usersPath, 'utf8');
    const users = JSON.parse(rawUsers || '[]');
    console.log(`Seeding ${users.length} users...`);

    for (const u of users) {
      await prisma.user.upsert({
        where: { email: u.email.toLowerCase().trim() },
        update: {
          name: u.name,
          password: u.password,
          userType: u.userType || 'guest'
        },
        create: {
          id: u.id.toString(),
          name: u.name,
          email: u.email.toLowerCase().trim(),
          password: u.password,
          userType: u.userType || 'guest'
        }
      });
    }
  }

  // 2. Ensure default demo host exists if referenced
  await prisma.user.upsert({
    where: { email: 'host@airbnb.com' },
    update: {},
    create: {
      id: 'user_host_1',
      name: 'Default Host',
      email: 'host@airbnb.com',
      password: '$2a$12$e8Yg12qQ9iK3ZzQn5l2QdeGkGZt.7GqN3W6pZfO1h7h/u8QxZg1eS', // dummy hash
      userType: 'host'
    }
  });

  // 3. Seed Homes
  const homesPath = path.join(dataDir, 'homes.json');
  if (fs.existsSync(homesPath)) {
    const rawHomes = fs.readFileSync(homesPath, 'utf8');
    const homes = JSON.parse(rawHomes || '[]');
    console.log(`Seeding ${homes.length} listings...`);

    for (const h of homes) {
      const hostId = (h.hostId || 'user_host_1').toString();
      // Ensure host exists
      const hostExists = await prisma.user.findUnique({ where: { id: hostId } });
      const validHostId = hostExists ? hostId : 'user_host_1';

      await prisma.home.upsert({
        where: { id: h.id.toString() },
        update: {
          houseName: h.houseName,
          price: parseFloat(h.price) || 0,
          location: h.location,
          rating: (h.rating || 'New').toString(),
          photoUrl: h.photoUrl,
          description: h.description || '',
          hostId: validHostId
        },
        create: {
          id: h.id.toString(),
          houseName: h.houseName,
          price: parseFloat(h.price) || 0,
          location: h.location,
          rating: (h.rating || 'New').toString(),
          photoUrl: h.photoUrl,
          description: h.description || '',
          hostId: validHostId
        }
      });
    }
  }

  // 4. Seed Bookings
  const bookingsPath = path.join(dataDir, 'bookings.json');
  if (fs.existsSync(bookingsPath)) {
    const rawBookings = fs.readFileSync(bookingsPath, 'utf8');
    const bookings = JSON.parse(rawBookings || '[]');
    console.log(`Seeding ${bookings.length} bookings...`);

    for (const b of bookings) {
      if (!b.homeId) continue;
      const homeExists = await prisma.home.findUnique({ where: { id: b.homeId.toString() } });
      const userExists = b.userId ? await prisma.user.findUnique({ where: { id: b.userId.toString() } }) : null;

      if (homeExists && userExists) {
        await prisma.booking.upsert({
          where: { id: b.id.toString() },
          update: {},
          create: {
            id: b.id.toString(),
            homeId: b.homeId.toString(),
            userId: b.userId.toString(),
            guestName: b.guestName || 'Guest',
            guestEmail: b.guestEmail || 'guest@example.com',
            checkIn: b.checkIn || '',
            checkOut: b.checkOut || '',
            guestsCount: parseInt(b.guestsCount, 10) || 1,
            totalAmount: parseFloat(b.totalAmount) || 0,
            bookedAt: b.bookedAt || new Date().toISOString(),
            status: b.status || 'Confirmed'
          }
        });
      }
    }
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
