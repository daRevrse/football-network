const { getFirestore } = require('firebase-admin/firestore');

// Submit a match report (Only Referees)
exports.submitMatchReport = async (req, res) => {
    try {
        if (req.user.userType !== 'referee') {
            return res.status(403).json({ error: 'Seul un arbitre peut soumettre un rapport de match.' });
        }

        const matchId = req.params.matchId;
        const { homeScore, awayScore, redCards, yellowCards, notes } = req.body;

        if (homeScore === undefined || awayScore === undefined) {
            return res.status(400).json({ error: 'Les scores sont obligatoires.' });
        }

        const db = getFirestore();
        const matchRef = db.collection('matches').doc(matchId);
        
        // Use a transaction to ensure match exists and we're not overwriting a finalized report without care
        await db.runTransaction(async (transaction) => {
            const matchDoc = await transaction.get(matchRef);
            
            if (!matchDoc.exists) {
                throw new Error('MATCH_NOT_FOUND');
            }

            // Create the report in a subcollection
            const reportRef = matchRef.collection('reports').doc(); // Auto-ID
            
            const reportData = {
                refereeId: req.user.uid,
                homeScore: Number(homeScore),
                awayScore: Number(awayScore),
                redCards: redCards || 0,
                yellowCards: yellowCards || 0,
                notes: notes || '',
                submittedAt: new Date().toISOString()
            };

            transaction.set(reportRef, reportData);

            // Update main match status
            transaction.update(matchRef, {
                status: 'played',
                officialScore: {
                    home: Number(homeScore),
                    away: Number(awayScore)
                }
            });
        });

        res.status(201).json({ message: 'Rapport soumis avec succès.' });

    } catch (error) {
        console.error('Erreur submitMatchReport:', error);
        if (error.message === 'MATCH_NOT_FOUND') {
            return res.status(404).json({ error: 'Match introuvable.' });
        }
        res.status(500).json({ error: 'Erreur lors de la soumission du rapport.' });
    }
};

// Get matches assigned to the referee
exports.getAssignedMatches = async (req, res) => {
    try {
        if (req.user.userType !== 'referee') {
            return res.status(403).json({ error: 'Accès réservé aux arbitres.' });
        }

        const db = getFirestore();
        // Assuming refereeId is stored directly on the match document
        const snapshot = await db.collection('matches')
            .where('refereeId', '==', req.user.uid)
            .get();

        const matches = [];
        snapshot.forEach(doc => {
            matches.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(matches);

    } catch (error) {
        console.error('Erreur getAssignedMatches:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des matchs assignés.' });
    }
};
// Get all referees
exports.getReferees = async (req, res) => {
    try {
        const db = getFirestore();
        const snapshot = await db.collection('users')
            .where('userType', '==', 'referee')
            .get();

        const referees = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            referees.push({ 
                id: doc.id, 
                displayName: data.displayName || data.display_name || 'Arbitre',
                photoURL: data.photoURL || data.photo_url || ''
            });
        });

        res.status(200).json({ referees });
    } catch (error) {
        console.error('Erreur getReferees:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des arbitres' });
    }
};
