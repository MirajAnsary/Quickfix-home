import { Booking, Review } from '../models/index.js';
import { ApiError } from '../utils/http.js';

// GET /api/reviews/public — latest published reviews for the home page
export async function publicReviews(_req, res) {
  const reviews = await Review.find({ isPublished: true }).sort({ createdAt: -1 }).limit(6).populate('customer', 'fullName').lean();
  res.set('Cache-Control', 'public, max-age=300');
  res.json({
    reviews: reviews.map((r) => ({
      _id: r._id,
      // Show first name + last initial only, to protect privacy.
      customerName: (() => {
        const [first, last] = (r.customer?.fullName || 'Customer').split(' ');
        return last ? `${first} ${last[0]}.` : first;
      })(),
      city: r.city,
      rating: r.rating,
      comment: r.comment,
    })),
  });
}

// GET /api/reviews/mine
export async function myReviews(req, res) {
  const reviews = await Review.find({ customer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('booking', 'bookingNo')
    .populate('service', 'name')
    .lean();
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  res.json({ reviews, count, average: Math.round(average * 10) / 10 });
}

// POST /api/reviews
export async function createReview(req, res) {
  const { bookingId, rating, comment } = req.body;
  const booking = await Booking.findOne({ _id: bookingId, customer: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found.');
  if (booking.status !== 'completed') throw new ApiError(400, 'You can review a booking after it is completed.');
  if (await Review.exists({ booking: booking._id })) throw new ApiError(409, 'You already reviewed this booking.');

  const review = await Review.create({
    booking: booking._id,
    customer: req.user._id,
    technician: booking.technician,
    service: booking.service,
    rating,
    comment,
    city: booking.address?.city || '',
  });
  res.status(201).json({ review });
}
