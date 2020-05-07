const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

/** 
 * @desc    Create a post   
 * @route   POST api/posts
 * @access  Private
**/
router.post('/', [ auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });

        const post = await newPost.save();

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/** 
 * @desc    Get all posts  
 * @route   GET api/posts
 * @access  Private
**/
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });

        res.status(200).json({
            count: posts.length,
            posts
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/** 
 * @desc    Get Single Post By ID
 * @route   GET api/posts/:id
 * @access  Private
**/
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.status(200).json({ post });

    } catch (err) {
        console.error(err.message);
        if(err.name === 'CastError') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

/** 
 * @desc    Delete a post
 * @route   DELETE api/post/:id
 * @access  Private
**/
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if the user is the owner of the post
        if(post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.remove();

        res.json({ msg: 'Post removed' });

    } catch (err) {
        console.error(err.message);
        if(err.name === 'CastError') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

/** 
 * @desc    Like a post, :id is post_id
 * @route   PUT api/posts/like/:id
 * @access  Private
**/
router.put('/like/:id', auth, async (req, res) => {

    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked by this same user
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: "Post already liked" });
        }

        // Else add the like to the post
        post.likes.unshift({ user: req.user.id });

        // Save the post with current like
        await post.save();

        res.json(post.likes);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/** 
 * @desc    Undo Like a post, :id is post_id
 * @route   PUT api/posts/unlike/:id
 * @access  Private
**/
router.put('/unlike/:id', auth, async (req, res) => {

    try {
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked by this same user
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: "Post has not yet been liked" });
        }

        // Get remove index for the undo like feature, you can't unlike a post just undo your like
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        // Remove the like
        post.likes.splice(removeIndex, 1);

        // Save the post with current like
        await post.save();

        res.json(post.likes);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/** 
 * @desc    Comment on a post, :id is post id 
 * @route   POST api/posts/comment/:id
 * @access  Private
**/
router.post('/comment/:id', [ auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        // Adding comment to post
        post.comments.unshift(newComment);

        await post.save();

        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/** 
 * @desc    Delete Comment, :id is post id
 * @route   DELETE api/posts/comment/:id/:comment_id
 * @access  Private
**/
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {

        const post = await Post.findById(req.params.id);

        // Pull out comment that needs to be deleted
        // .find will give us either a comment or false, remember that
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // Make sure comment exists
        if(!comment) {
            return res.status(404).json({ msg: 'Comment does not exists' });
        }

        // Check if user is owner of the comment
        if(comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Get remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

        // Remove the like
        post.comments.splice(removeIndex, 1);

        // Save the post with current like
        await post.save();

        res.json(post.comments);

    } catch (error) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;