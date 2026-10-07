const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDemoBookings() {
  console.log('--- Seeding Rich Demo Bookings for All Registered Users ---');

  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database.`);

  const sampleTrips = [
    {
      homeId: '5',
      checkIn: '2026-03-12',
      checkOut: '2026-03-16',
      guestsCount: 2,
      totalAmount: 12000,
      bookedAt: 'Feb 28, 2026',
      status: 'Completed'
    },
    {
      homeId: '1',
      checkIn: '2026-05-18',
      checkOut: '2026-05-21',
      guestsCount: 1,
      totalAmount: 7500,
      bookedAt: 'May 10, 2026',
      status: 'Completed'
    },
    {
      homeId: '4',
      checkIn: '2026-07-22',
      checkOut: '2026-07-24',
      guestsCount: 2,
      totalAmount: 16000,
      bookedAt: 'Jul 15, 2026',
      status: 'Completed'
    },
    {
      homeId: '10',
      checkIn: '2026-09-10',
      checkOut: '2026-09-14',
      guestsCount: 4,
      totalAmount: 11200,
      bookedAt: 'Aug 25, 2026',
      status: 'Completed'
    },
    {
      homeId: '13',
      checkIn: '2026-11-15',
      checkOut: '2026-11-18',
      guestsCount: 2,
      totalAmount: 16500,
      bookedAt: 'Oct 2, 2026',
      status: 'Confirmed'
    },
    {
      homeId: '16',
      checkIn: '2026-12-24',
      checkOut: '2026-12-28',
      guestsCount: 3,
      totalAmount: 7600,
      bookedAt: 'Oct 5, 2026',
      status: 'Confirmed'
    }
  ];

  let totalInserted = 0;

  for (const user of users) {
    console.log(`Seeding demo trips for: ${user.name} (${user.email})...`);

    for (let i = 0; i < sampleTrips.length; i++) {
      const trip = sampleTrips[i];
      const cleanUserId = user.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const bookingId = `demo_${cleanUserId}_${i + 1}`;

      // Check if home exists
      const home = await prisma.home.findUnique({
        where: { id: trip.homeId }
      });

      if (!home) {
        console.warn(`Home ${trip.homeId} not found, skipping trip ${i + 1}`);
        continue;
      }

      await prisma.booking.upsert({
        where: { id: bookingId },
        update: {
          homeId: trip.homeId,
          userId: user.id,
          guestName: user.name,
          guestEmail: user.email,
          checkIn: trip.checkIn,
          checkOut: trip.checkOut,
          guestsCount: trip.guestsCount,
          totalAmount: trip.totalAmount,
          bookedAt: trip.bookedAt,
          status: trip.status
        },
        create: {
          id: bookingId,
          homeId: trip.homeId,
          userId: user.id,
          guestName: user.name,
          guestEmail: user.email,
          checkIn: trip.checkIn,
          checkOut: trip.checkOut,
          guestsCount: trip.guestsCount,
          totalAmount: trip.totalAmount,
          bookedAt: trip.bookedAt,
          status: trip.status
        }
      });
      totalInserted++;
    }
  }

  // 2. Also ensure each host's properties have received guest bookings
  console.log('--- Seeding Incoming Guest Bookings for Host Revenue ---');
  const allHomes = await prisma.home.findMany();
  const sampleGuestBookings = [
    { guestName: 'Aditi Sharma', guestEmail: 'aditi@example.com', checkIn: '2026-04-10', checkOut: '2026-04-14', guestsCount: 2, totalAmount: 24000, bookedAt: 'Mar 28, 2026', status: 'Completed' },
    { guestName: 'Rohan Mehta', guestEmail: 'rohan@example.com', checkIn: '2026-06-18', checkOut: '2026-06-21', guestsCount: 4, totalAmount: 18000, bookedAt: 'Jun 1, 2026', status: 'Completed' },
    { guestName: 'Pooja Verma', guestEmail: 'pooja@example.com', checkIn: '2026-08-12', checkOut: '2026-08-15', guestsCount: 3, totalAmount: 21000, bookedAt: 'Jul 30, 2026', status: 'Completed' },
    { guestName: 'Karan Malhotra', guestEmail: 'karan@example.com', checkIn: '2026-11-20', checkOut: '2026-11-24', guestsCount: 2, totalAmount: 32000, bookedAt: 'Oct 15, 2026', status: 'Confirmed' }
  ];

  for (const home of allHomes) {
    for (let j = 0; j < sampleGuestBookings.length; j++) {
      const gb = sampleGuestBookings[j];
      const hostBookId = `host_rev_${home.id.replace(/[^a-zA-Z0-9_-]/g, '_')}_${j + 1}`;
      
      await prisma.booking.upsert({
        where: { id: hostBookId },
        update: {},
        create: {
          id: hostBookId,
          homeId: home.id,
          userId: 'user_guest_1',
          guestName: gb.guestName,
          guestEmail: gb.guestEmail,
          checkIn: gb.checkIn,
          checkOut: gb.checkOut,
          guestsCount: gb.guestsCount,
          totalAmount: gb.totalAmount,
          bookedAt: gb.bookedAt,
          status: gb.status
        }
      });
    }
  }

  console.log(`Successfully seeded ${totalInserted} demo trips and host revenue bookings!`);
}

addDemoBookings()
  .catch((e) => {
    console.error('Error seeding demo bookings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
