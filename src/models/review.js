const prisma = require('../db/prisma');

module.exports = class Review {
  constructor(homeId, userId, rating, comment, id = null) {
    this.id = id;
    this.homeId = homeId;
    this.userId = userId;
    this.rating = parseInt(rating, 10) || 5;
    this.comment = comment;
  }

  static async create({ homeId, userId, rating, comment }) {
    try {
      const parsedRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
      const newReview = await prisma.review.create({
        data: {
          homeId: homeId.toString(),
          userId: userId.toString(),
          rating: parsedRating,
          comment: (comment || '').trim()
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Recalculate average rating for the home and update home.rating
      await Review.syncHomeRating(homeId);

      return newReview;
    } catch (err) {
      console.error('Error creating review in PostgreSQL:', err);
      throw err;
    }
  }

  static async fetchByHomeId(homeId) {
    try {
      if (!homeId) return [];
      const reviews = await prisma.review.findMany({
        where: { homeId: homeId.toString() },
        include: {
          user: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return reviews;
    } catch (err) {
      console.error('Error in Review.fetchByHomeId:', err);
      return [];
    }
  }

  static async syncHomeRating(homeId) {
    try {
      const stats = await prisma.review.aggregate({
        where: { homeId: homeId.toString() },
        _avg: { rating: true },
        _count: { rating: true }
      });

      const avg = stats._avg.rating;
      const count = stats._count.rating;

      const formattedRating = count > 0 && avg ? avg.toFixed(1) : 'New';

      await prisma.home.update({
        where: { id: homeId.toString() },
        data: { rating: formattedRating }
      });

      return { avg: avg ? Number(avg.toFixed(1)) : null, count };
    } catch (err) {
      console.error('Error in Review.syncHomeRating:', err);
      return null;
    }
  }

  static async deleteById(id, userId) {
    try {
      if (!id) return null;
      const review = await prisma.review.findUnique({
        where: { id: id.toString() }
      });
      if (!review) return null;

      if (userId && review.userId !== userId.toString()) {
        const error = new Error('Unauthorized');
        throw error;
      }

      await prisma.review.delete({
        where: { id: id.toString() }
      });

      // Recalculate home rating after deletion
      await Review.syncHomeRating(review.homeId);
      return true;
    } catch (err) {
      console.error('Error deleting review:', err);
      throw err;
    }
  }
};
