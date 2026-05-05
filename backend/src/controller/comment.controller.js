const Comment = require('../models/comment.model');
const Food = require('../models/food.model');
const User = require('../models/user.model');

function parseLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  const int = Math.trunc(n);
  return Math.min(100, Math.max(1, int));
}

function parseSkip(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const int = Math.trunc(n);
  return Math.min(5000, Math.max(0, int));
}

const listCommentsByFood = async (req, res) => {
  try {
    const foodId = req.params?.foodId;
    if (!foodId) return res.status(400).json({ message: 'foodId is required' });

    const limit = parseLimit(req.query?.limit);
    const skip = parseSkip(req.query?.skip);

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ message: 'Food item not found' });

    // keep stable order (oldest first) so UI feels like Instagram
    const comments = await Comment.find({ foodId }).lean();
    comments.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    const windowed = comments.slice(skip, skip + limit);

    const userIds = [...new Set(windowed.map(c => String(c.userId)).filter(Boolean))];
    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } }).select('_id username').lean()
      : [];
    const userById = new Map(users.map(u => [String(u._id), u]));

    const shaped = windowed.map(c => {
      const u = userById.get(String(c.userId));
      return {
        _id: c._id,
        foodId: c.foodId,
        text: c.text,
        createdAt: c.createdAt,
        user: u ? { _id: u._id, username: u.username } : { _id: c.userId, username: 'User' },
      };
    });

    return res.status(200).json({ comments: shaped, limit, skip, total: comments.length });
  } catch (err) {
    console.error('listCommentsByFood error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const addCommentToFood = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Please login first' });

    const foodId = req.params?.foodId;
    if (!foodId) return res.status(400).json({ message: 'foodId is required' });

    const textRaw = req.body?.text;
    const text = String(textRaw || '').trim();
    if (!text) return res.status(400).json({ message: 'Comment text is required' });
    if (text.length > 500) return res.status(400).json({ message: 'Comment must be 500 characters or less' });

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ message: 'Food item not found' });

    const comment = await Comment.create({ userId, foodId, text });

    return res.status(201).json({
      message: 'Comment added',
      comment: {
        _id: comment._id,
        foodId: comment.foodId,
        text: comment.text,
        createdAt: comment.createdAt,
        user: { _id: userId, username: req.user?.username || 'You' },
      },
    });
  } catch (err) {
    console.error('addCommentToFood error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  listCommentsByFood,
  addCommentToFood,
};
