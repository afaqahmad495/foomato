const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const commentController = require('../controller/comment.controller');

// list comments (public to logged-in users, because feed is protected)
router.get('/:foodId', authMiddleware.authUserMiddleware, commentController.listCommentsByFood);
// add comment
router.post('/:foodId', authMiddleware.authUserMiddleware, commentController.addCommentToFood);

module.exports = router;

