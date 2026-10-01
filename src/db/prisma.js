const { PrismaClient } = require('@prisma/client');

// PrismaClient is attached to the global object in development to prevent
// exhausting your database connection limit during hot-reloads.
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
