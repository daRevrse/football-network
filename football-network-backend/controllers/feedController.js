const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Create a new post
exports.createPost = async (req, res) => {
    try {
        const { text, imageUrl } = req.body;
        
        if (!text && !imageUrl) {
            return res.status(400).json({ error: 'Le post doit contenir du texte ou une image.' });
        }

        const db = getFirestore();
        const postData = {
            authorId: req.user.uid,
            text: text || '',
            imageUrl: imageUrl || null, // Image URL stored on Firebase Storage by frontend
            likes: [], // Array of UIDs
            created_at: new Date().toISOString()
        };

        const docRef = await db.collection('posts').add(postData);

        res.status(201).json({ id: docRef.id, ...postData });
    } catch (error) {
        console.error('Erreur createPost:', error);
        res.status(500).json({ error: 'Erreur lors de la création du post.' });
    }
};

// Get Feed (Simple chronological)
exports.getFeed = async (req, res) => {
    try {
        // Optionnel : Pagination avec startAfter
        const db = getFirestore();
        const snapshot = await db.collection('posts')
            .orderBy('created_at', 'desc')
            .limit(20)
            .get();

        const posts = [];
        snapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error('Erreur getFeed:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du feed.' });
    }
};

// Toggle Like
exports.toggleLike = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.uid;

        const db = getFirestore();
        const postRef = db.collection('posts').doc(postId);

        // Transaction for safety, but FieldValue is atomic enough for likes. We'll use FieldValue 
        // to simplify, but we need to know if we are liking or unliking.
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ error: 'Post introuvable.' });
        }

        const likes = postDoc.data().likes || [];
        const isLiked = likes.includes(userId);

        if (isLiked) {
            // Unlike
            await postRef.update({
                likes: FieldValue.arrayRemove(userId)
            });
            res.status(200).json({ message: 'Post unliked', liked: false });
        } else {
            // Like
            await postRef.update({
                likes: FieldValue.arrayUnion(userId)
            });
            res.status(200).json({ message: 'Post liked', liked: true });
        }
    } catch (error) {
        console.error('Erreur toggleLike:', error);
        res.status(500).json({ error: 'Erreur lors de la modification du like.' });
    }
};

// Add comment
exports.addComment = async (req, res) => {
    try {
        const postId = req.params.postId;
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Le commentaire ne peut pas être vide.' });
        }

        const db = getFirestore();
        const postRef = db.collection('posts').doc(postId);
        
        // Ensure post exists
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ error: 'Post introuvable.' });
        }

        const commentData = {
            authorId: req.user.uid,
            text,
            created_at: new Date().toISOString()
        };

        const commentRef = await postRef.collection('comments').add(commentData);

        res.status(201).json({ id: commentRef.id, ...commentData });
    } catch (error) {
        console.error('Erreur addComment:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du commentaire.' });
    }
};

// Get comments for a post
exports.getComments = async (req, res) => {
    try {
        const postId = req.params.postId;
        const db = getFirestore();
        
        const snapshot = await db.collection('posts').doc(postId).collection('comments')
            .orderBy('created_at', 'asc')
            .get();

        const comments = [];
        snapshot.forEach(doc => {
            comments.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(comments);

    } catch (error) {
        console.error('Erreur getComments:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des commentaires.' });
    }
};
