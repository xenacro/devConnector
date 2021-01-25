const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route    Post api/posts
//@desc     Create a post
//@access   Private

router.post('/', [ auth, [ check('text', 'Text is required').not().isEmpty() ] ], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const user = await User.findById(req.user.id).select('-password');
    
        const newPost = new Post({ text: req.body.text, name: user.name, avatar: user.avatar, user: req.user.id });

        const post = await newPost.save();
        
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

    
});

//@route    Get api/posts
//@desc     get all posts
//@access   Private
router.get('/', auth, async (re, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    Get api/posts/:id
//@desc     get post by id
//@access   Private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post not found' });
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
        res.status(500).send('Server Error');
    }
});

//@route    Delete api/posts/:id
//@desc     delete post by id
//@access   Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post not found' });

        //Check User
        if(post.user.toString()!==req.user.id) return res.status(401).json({ msg: 'User Not authorised' });

        await post.remove();

        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
        res.status(500).send('Server Error');
    }
});

//@route    Put api/posts/like/:id
//@desc     like a post
//@access   Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post not found' });

        //Check if alredy liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) return res.status(400).json({ msg: 'Alredy liked' });

        post.likes.unshift({ user: req.user.id });

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
        res.status(500).send('Server Error');
    }
});

//@route    Put api/posts/unlike/:id
//@desc     unlike a post
//@access   Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post not found' });

        //Check if alredy liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) return res.status(400).json({ msg: 'Not liked yet' });

        //get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
        res.status(500).send('Server Error');
    }
});

//@route    Post api/posts/comment/:id
//@desc     Comment on a post
//@access   Private

router.post('/comment/:id', [ auth, [ check('text', 'Text is required').not().isEmpty() ] ], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post not found' });
    
        const newComment = { text: req.body.text, name: user.name, avatar: user.avatar, user: req.user.id };

        post.comments.unshift(newComment);

        await post.save();
        
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
        res.status(500).send('Server Error');
    }
});

//@route    delete api/posts/comment/:id/:comment_id
//@desc     Delete Comment
//@access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post not found' });
        const comment = await post.comments.find(comment => comment.id === req.params.comment_id);
        if(!comment) return res.status(404).json({ msg: 'Comment not found' });
        
        //get remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);

        await post.save();

        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId') return res.status(404).json({ msg: 'Post not found' });
        res.status(500).send('Server Error');
    }
});


module.exports = router;
