const { db } = require('../config/firebase');

/**
 * Récupérer les participations d'un match (Confirmations Joueurs)
 */
exports.getMatchParticipations = async (req, res) => {
    try {
        const { matchId } = req.params;
        const matchDoc = await db.collection('matches').doc(matchId).get();
        if (!matchDoc.exists) return res.status(404).json({ error: 'Match introuvable' });

        const matchData = matchDoc.data();
        const participationsSnapshot = await db.collection('matches').doc(matchId).collection('participations').get();
        
        const participations = [];
        participationsSnapshot.forEach(doc => {
            participations.push({ id: doc.id, ...doc.data() });
        });

        // Summary logic
        const homeTeamId = matchData.home_team_id;
        const awayTeamId = matchData.away_team_id;

        const homeConfirmed = participations.filter(p => p.team_id === homeTeamId && p.status === 'confirmed').length;
        const awayConfirmed = participations.filter(p => p.team_id === awayTeamId && p.status === 'confirmed').length;
        
        const homeTotal = participations.filter(p => p.team_id === homeTeamId).length;
        const awayTotal = participations.filter(p => p.team_id === awayTeamId).length;

        // Dynamic validation rule (USER request)
        const minRequired = matchData.match_type === '11vs11' ? 6 : 4;
        const isValid = homeConfirmed >= minRequired && awayConfirmed >= minRequired;

        res.json({
            match: {
                id: matchId,
                matchDate: matchData.match_date,
                homeTeamId,
                awayTeamId,
                status: matchData.status,
                match_type: matchData.match_type
            },
            participations,
            summary: {
                homeConfirmed,
                awayConfirmed,
                homeTotal,
                awayTotal,
                minRequired,
                isValid
            }
        });
    } catch (error) {
        console.error('Erreur getMatchParticipations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

/**
 * Valider manuellement le match (Manager)
 */
exports.validateMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const matchRef = db.collection('matches').doc(matchId);
        const matchDoc = await matchRef.get();
        
        if (!matchDoc.exists) return res.status(404).json({ error: 'Match introuvable' });
        
        // Simplement on rafraîchit le statut (on pourrait ajouter des checks plus complexes ici)
        await matchRef.update({ 
            participation_validated: true,
            status: 'confirmed', // Si validé, le match est officiellement confirmé
            updated_at: new Date().toISOString()
        });

        res.json({ message: 'Match validé avec succès' });
    } catch (error) {
        console.error('Erreur validateMatch:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

/**
 * Récupérer les participations en attente pour l'utilisateur
 */
exports.getMyPendingParticipations = async (req, res) => {
    try {
        const uid = req.user.uid;
        
        // On doit parser tous les matchs ou utiliser une collection root ?
        // Pour Firebase, une collection root 'participations' avec match_id serait plus simple pour les queries cross-match.
        // Mais on a choisi subcollection. Pour interroger toutes les subcollections, on peut utiliser Collection Group Query.
        
        const snapshot = await db.collectionGroup('participations')
            .where('uid', '==', uid)
            .where('status', '==', 'pending')
            .get();

        const pending = [];
        snapshot.forEach(doc => {
            pending.push({ id: doc.id, ...doc.data(), match_id: doc.ref.parent.parent.id });
        });

        res.json(pending);
    } catch (error) {
        console.error('Erreur getMyPendingParticipations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
