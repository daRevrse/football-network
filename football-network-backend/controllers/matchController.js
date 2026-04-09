const { db } = require('../config/firebase');

/**
 * Créer un nouveau match
 */
const createMatch = async (req, res) => {
  try {
    const { title, match_date, match_time, venue_id, venue_name, max_players, price, home_team_id, away_team_id } = req.body;
    const creator_id = req.user.uid;

    // RBAC: Seuls les managers peuvent créer un match
    const userDoc = await db.collection('users').doc(creator_id).get();
    if (!userDoc.exists || userDoc.data().role !== 'manager') {
      return res.status(403).json({ error: 'Accès refusé. Seuls les managers peuvent organiser un match.' });
    }

    const match_type = max_players === 22 ? "11vs11" : "others";

    const newMatch = {
      title: title || "Match Organisé",
      match_date: match_date || null,
      match_time: match_time || null,
      venue_id: venue_id || null,
      venue_name: venue_name || "Lieu à définir",
      max_players: max_players || 10,
      match_type,
      price: price || 0,
      home_team_id: home_team_id || null,
      away_team_id: away_team_id || null,
      creator_id,
      status: "planning", // planning, ongoing, finished, canceled
      created_at: new Date().toISOString(),
      players: [] // Le manager N'EST PAS ajouté aux joueurs
    };



    const matchRef = await db.collection('matches').add(newMatch);
    
    res.status(201).json({ 
      message: "Match créé avec succès", 
      matchId: matchRef.id,
      match: newMatch 
    });
  } catch (error) {
    console.error("Erreur création de match:", error);
    res.status(500).json({ error: "Impossible de créer le match" });
  }
};

/**
 * Récupérer tous les matchs à venir (statut : planning)
 */
const getUpcomingMatches = async (req, res) => {
  try {
    const snapshot = await db.collection('matches')
      .where('status', '==', 'planning')
      .orderBy('created_at', 'desc')
      .get();

    const matches = [];
    snapshot.forEach(doc => {
      matches.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({ matches });
  } catch (error) {
    console.error("Erreur lors de la récupération des matchs:", error);
    res.status(500).json({ error: "Impossible de récupérer les matchs" });
  }
};

/**
 * Récupérer les matchs "trending" (ex: les 5 plus récents en planification)
 */
const getTrendingMatches = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const snapshot = await db.collection('matches')
      .where('status', '==', 'planning')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    const matches = [];
    snapshot.forEach(doc => {
      matches.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(matches);
  } catch (error) {
    console.error("Erreur matches trending:", error);
    res.status(500).json({ error: "Impossible de récupérer les matchs trending" });
  }
};

/**
 * Récupérer les détails d'un match
 */

const getMatchDetails = async (req, res) => {
    try {
        const { matchId } = req.params;
        const matchDoc = await db.collection('matches').doc(matchId).get();

        if (!matchDoc.exists) {
            return res.status(404).json({ error: 'Match non trouvé' });
        }

        const matchData = matchDoc.data();
        
        // Enrichir avec les détails des équipes
        const teamA = await db.collection('teams').doc(matchData.team_a_id).get();
        const teamB = matchData.team_b_id ? await db.collection('teams').doc(matchData.team_b_id).get() : null;

        const enrichedMatch = {
            id: matchDoc.id,
            ...matchData,
            homeTeam: teamA.exists ? { id: teamA.id, ...teamA.data() } : { name: 'Équipe A' },
            awayTeam: teamB && teamB.exists ? { id: teamB.id, ...teamB.data() } : null,
            // Mappings pour le frontend
            matchDate: matchData.match_date,
            userRole: matchData.created_by === req.user.uid ? 'manager' : 'player' // Simplifié
        };

        // On renomme pour le frontend si besoin
        if (enrichedMatch.homeTeam) {
            enrichedMatch.homeTeam.logoUrl = enrichedMatch.homeTeam.logo_url;
        }
        if (enrichedMatch.awayTeam) {
            enrichedMatch.awayTeam.logoUrl = enrichedMatch.awayTeam.logo_url;
        }

        res.status(200).json(enrichedMatch);
    } catch (error) {
        console.error('Erreur getMatchDetails:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du match' });
    }
};

// Confirmer un match (invitation acceptée)
const confirmMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        await db.collection('matches').doc(matchId).update({
            status: 'confirmed',
            updated_at: new Date().toISOString()
        });
        res.status(200).json({ message: 'Match confirmé' });
    } catch (error) {
        console.error('Erreur confirmMatch:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Annuler un match
const cancelMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { reason } = req.body;
        await db.collection('matches').doc(matchId).update({
            status: 'cancelled',
            cancellation_reason: reason || '',
            updated_at: new Date().toISOString()
        });
        res.status(200).json({ message: 'Match annulé' });
    } catch (error) {
        console.error('Erreur cancelMatch:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Assigner un arbitre à un match
const assignReferee = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { refereeId } = req.body;
        
        await db.collection('matches').doc(matchId).update({
            referee_id: refereeId,
            updated_at: new Date().toISOString()
        });
        
        res.status(200).json({ message: 'Arbitre assigné' });
    } catch (error) {
        console.error('Erreur assignReferee:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Réserver un terrain pour un match
const bookVenue = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { venueId, bookingDate, startTime, duration } = req.body;
        
        // Simuler une réservation (on pourrait avoir une collection bookings)
        const bookingRef = db.collection('bookings').doc();
        const bookingData = {
            match_id: matchId,
            venue_id: venueId,
            user_id: req.user.uid,
            booking_date: bookingDate,
            start_time: startTime,
            duration: duration,
            status: 'confirmed',
            created_at: new Date().toISOString()
        };
        
        await bookingRef.set(bookingData);
        
        // Mettre à jour le match
        await db.collection('matches').doc(matchId).update({
            venue_booking_id: bookingRef.id,
            venue_id: venueId,
            updated_at: new Date().toISOString()
        });
        
        res.status(200).json({ message: 'Terrain réservé', booking: bookingData });
    } catch (error) {
        console.error('Erreur bookVenue:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const deleteMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        await db.collection('matches').doc(matchId).delete();
        res.status(200).json({ message: 'Match supprimé' });
    } catch (error) {
        console.error('Erreur deleteMatch:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};


/**
 * Rejoindre un match
 */
const joinMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const uid = req.user.uid;
    const displayName = req.user.name || req.body.displayName || "Joueur inconnu";

    const matchRef = db.collection('matches').doc(matchId);

    // RBAC Check via Transaction
    await db.runTransaction(async (transaction) => {
      // 1. Charger et vérifier le profil de l'utilisateur
      const userDoc = await transaction.get(db.collection('users').doc(uid));
      if (!userDoc.exists || userDoc.data().userType === 'manager') {
        throw new Error("Un manager ne peut pas s'inscrire en tant que joueur sur le terrain !");
      }

      // 2. Charger le match
      const matchDoc = await transaction.get(matchRef);
      if (!matchDoc.exists) {
         throw new Error("Match introuvable");
      }

      const matchData = matchDoc.data();
      const currentPlayers = matchData.players || [];

      // Vérifier si le joueur est déjà dans le match
      const isAlreadyPlaying = currentPlayers.some(p => p.uid === uid);
      if (isAlreadyPlaying) {
        throw new Error("Vous êtes déjà inscrit à ce match");
      }

      // Vérifier si le match est plein
      if (currentPlayers.length >= (matchData.max_players || 10)) {
        throw new Error("Désolé, le match est complet !");
      }


      // Ajouter le joueur
      currentPlayers.push({
        uid,
        displayName,
        team: "unassigned",
        joinedAt: new Date().toISOString()
      });

      transaction.update(matchRef, { players: currentPlayers });
    });

    res.status(200).json({ message: "Vous avez rejoint le match avec succès !" });

  } catch (error) {
    console.error("Erreur lors de l'inscription au match:", error);
    return res.status(400).json({ error: error.message });
  }
};

// Envoyer une invitation de match
const sendInvitation = async (req, res) => {
    try {
        const { senderTeamId, receiverTeamId, proposedDate, proposedLocationId, message, max_players } = req.body;
        
        const type = max_players === 22 ? "11vs11" : "others";

        const newMatch = {
            home_team_id: senderTeamId,
            away_team_id: receiverTeamId,
            match_date: proposedDate,
            venue_id: proposedLocationId || null,
            max_players: max_players || 10,
            match_type: type,
            status: 'pending',
            created_by: req.user.uid,
            message: message || '',
            created_at: new Date().toISOString(),
            players: []
        };

        const docRef = await db.collection('matches').add(newMatch);
        res.status(201).json({ id: docRef.id, ...newMatch });
    } catch (error) {
        console.error('Erreur sendInvitation:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'invitation' });
    }
};

// Récupérer les invitations reçues
const getReceivedInvitations = async (req, res) => {
    try {
        const uid = req.user.uid;
        // Trouver les équipes dont l'utilisateur est manager/capitaine (simplifié pour l'instant : on cherche dans teams où manager_id == uid)
        const teamsSnapshot = await db.collection('teams').where('manager_id', '==', uid).get();
        const myTeamIds = teamsSnapshot.docs.map(doc => doc.id);

        if (myTeamIds.length === 0) return res.json([]);

        const snapshot = await db.collection('matches')
            .where('away_team_id', 'in', myTeamIds)
            .where('status', '==', 'pending')
            .get();

        const invitations = [];
        for (const doc of snapshot.docs) {
            const data = doc.id ? { id: doc.id, ...doc.data() } : doc.data();
            // Enrichir avec les noms des équipes
            const homeTeam = await db.collection('teams').doc(data.home_team_id).get();
            const receiverTeam = await db.collection('teams').doc(data.away_team_id).get();
            
            invitations.push({
                ...data,
                senderTeam: homeTeam.exists ? { name: homeTeam.data().name } : { name: "Équipe" },
                receiverTeam: receiverTeam.exists ? { name: receiverTeam.data().name } : { name: "Ma Team" }
            });
        }
        res.json(invitations);
    } catch (error) {
        console.error('Erreur getReceivedInvitations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer les invitations envoyées
const getSentInvitations = async (req, res) => {
    try {
        const uid = req.user.uid;
        const snapshot = await db.collection('matches')
            .where('created_by', '==', uid)
            .where('home_team_id', '!=', null) // S'assurer que c'est une invitation d'équipe
            .get();

        const invitations = [];
        for (const doc of snapshot.docs) {
             const data = { id: doc.id, ...doc.data() };
             const receiverTeam = await db.collection('teams').doc(data.away_team_id).get();
             invitations.push({
                 ...data,
                 receiverTeam: receiverTeam.exists ? { name: receiverTeam.data().name } : { name: "Adversaire" }
             });
        }
        res.json(invitations);
    } catch (error) {
        console.error('Erreur getSentInvitations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Répondre à une invitation
const respondToInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const { response } = req.body; // 'accepted' ou 'declined'

        const matchRef = db.collection('matches').doc(invitationId);
        const matchDoc = await matchRef.get();

        if (!matchDoc.exists) return res.status(404).json({ error: 'Invitation introuvable' });

        if (response === 'accepted') {
            await matchRef.update({ 
                status: 'planning', // Devient un match officiel en cours de planification
                updated_at: new Date().toISOString()
            });
        } else {
            await matchRef.update({ 
                status: 'cancelled',
                updated_at: new Date().toISOString()
            });
        }

        res.json({ message: `Invitation ${response}` });
    } catch (error) {
        console.error('Erreur respondToInvitation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};


// Récupérer les messages du chat d'un match
const getMatchMessages = async (req, res) => {
    try {
        const { matchId } = req.params;
        const messagesSnapshot = await db.collection('matches')
            .doc(matchId)
            .collection('messages')
            .orderBy('created_at', 'asc')
            .get();

        const messages = [];
        messagesSnapshot.forEach(doc => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                ...data,
                // Mappings pour le frontend
                createdAt: data.created_at,
                sender: data.sender || { id: data.sender_id, firstName: 'Utilisateur' }
            });
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Erreur getMatchMessages:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
    }
};

// Envoyer un message dans le chat d'un match
const sendMatchMessage = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Le contenu est obligatoire' });
        }

        const userDoc = await db.collection('users').doc(req.user.uid).get();
        const userData = userDoc.data();

        const newMessage = {
            content,
            sender_id: req.user.uid,
            sender: {
                id: req.user.uid,
                firstName: userData?.firstName || userData?.first_name || 'Utilisateur',
                lastName: userData?.lastName || userData?.last_name || ''
            },
            created_at: new Date().toISOString()
        };

        const messageRef = await db.collection('matches')
            .doc(matchId)
            .collection('messages')
            .add(newMessage);

        res.status(201).json({ id: messageRef.id, ...newMessage });
    } catch (error) {
        console.error('Erreur sendMatchMessage:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
    }
};

// --- Post-Match Validation ---

const getPendingValidations = async (req, res) => {
    try {
        const uid = req.user.uid;
        // Trouver les équipes gérées par l'utilisateur
        const teamsSnapshot = await db.collection('teams').where('manager_id', '==', uid).get();
        const myTeamIds = teamsSnapshot.docs.map(doc => doc.id);

        if (myTeamIds.length === 0) return res.json({ matches: [] });

        // Matchs où l'utilisateur est manager (home ou away) et qui sont terminés ou en attente de validation
        // Pour simplifier, on récupère les matchs confirmed ou planning qui sont passés
        const now = new Date().toISOString();
        
        // Firestore won't allow 'in' and inequality on different fields in a single query easily without composite indexes
        // Let's do a simpler query and filter in memory for now OR use status='finished' if we had a cron job
        const snapshot = await db.collection('matches')
            .where('status', 'in', ['confirmed', 'planning', 'finished'])
            .get();

        const matches = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const isHome = myTeamIds.includes(data.home_team_id);
            const isAway = myTeamIds.includes(data.away_team_id);

            if (isHome || isAway) {
                // Vérifier si le match est passé
                if (data.match_date < now || data.status === 'finished') {
                    // Enrichir pour le frontend PendingValidations.js
                    const homeTeam = await db.collection('teams').doc(data.home_team_id).get();
                    const awayTeam = data.away_team_id ? await db.collection('teams').doc(data.away_team_id).get() : null;

                    matches.push({
                        id: doc.id,
                        ...data,
                        matchDate: data.match_date,
                        homeTeam: homeTeam.exists ? { name: homeTeam.data().name } : { name: "Équipe" },
                        awayTeam: awayTeam && awayTeam.exists ? { name: awayTeam.data().name } : { name: "Adversaire" },
                        score: {
                            home: data.home_score,
                            away: data.away_score
                        },
                        validation: {
                            homeCaptainValidated: data.home_validated || false,
                            awayCaptainValidated: data.away_validated || false,
                            needsYourValidation: (isHome && !data.home_validated) || (isAway && !data.away_validated)
                        },
                        isDisputed: data.status === 'disputed'
                    });
                }
            }
        }

        res.json({ matches });
    } catch (error) {
        console.error('Erreur getPendingValidations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getValidationStatus = async (req, res) => {
    try {
        const { matchId } = req.params;
        const uid = req.user.uid;
        
        const matchDoc = await db.collection('matches').doc(matchId).get();
        if (!matchDoc.exists) return res.status(404).json({ error: 'Match non trouvé' });
        
        const data = matchDoc.data();
        const homeTeam = await db.collection('teams').doc(data.home_team_id).get();
        const awayTeam = data.away_team_id ? await db.collection('teams').doc(data.away_team_id).get() : null;

        let userRole = 'player';
        if (data.home_team_id && (await db.collection('teams').doc(data.home_team_id).get()).data().manager_id === uid) userRole = 'home_captain';
        if (data.away_team_id && (await db.collection('teams').doc(data.away_team_id).get()).data().manager_id === uid) userRole = 'away_captain';

        res.json({
            match: {
                id: matchDoc.id,
                ...data,
                homeTeamName: homeTeam.exists ? homeTeam.data().name : "Équipe A",
                awayTeamName: awayTeam && awayTeam.exists ? awayTeam.data().name : "Équipe B",
                homeScore: data.home_score,
                awayScore: data.away_score,
                status: data.status || 'planning'
            },
            validation: {
                homeCaptainValidated: data.home_validated || false,
                awayCaptainValidated: data.away_validated || false,
                isDisputed: data.status === 'disputed',
                fullyValidated: data.status === 'finished'
            },
            userRole
        });
    } catch (error) {
        console.error('Erreur getValidationStatus:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const validateScore = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { homeScore, awayScore } = req.body;
        const uid = req.user.uid;

        const matchRef = db.collection('matches').doc(matchId);
        const matchDoc = await matchRef.get();
        if (!matchDoc.exists) return res.status(404).json({ error: 'Match non trouvé' });

        const data = matchDoc.data();
        
        // Déterminer si l'utilisateur est le manager home ou away
        const homeTeam = await db.collection('teams').doc(data.home_team_id).get();
        const awayTeam = data.away_team_id ? await db.collection('teams').doc(data.away_team_id).get() : null;

        const isHome = homeTeam.exists && homeTeam.data().manager_id === uid;
        const isAway = awayTeam && awayTeam.exists && awayTeam.data().manager_id === uid;

        if (!isHome && !isAway) return res.status(403).json({ error: 'Seuls les capitaines peuvent valider le score' });

        const updates = {};
        if (isHome) {
            updates.home_score = homeScore;
            updates.home_validated = true;
        } else {
            updates.away_score = awayScore;
            updates.away_validated = true;
        }

        // Vérification de conflit
        if (isHome && data.away_validated && (homeScore !== data.away_score || awayScore !== data.home_score_opposite_placeholder)) {
             // Si l'autre a déjà validé et que ça ne correspond pas
             // Note: away_score pour le home est le même que away_score pour le away
             if (homeScore !== data.home_score && data.home_score !== undefined) {
                 // Conflit
                 return res.status(409).json({ error: 'Conflit de score' });
             }
        }

        // Pour simplifier : on stocke le dernier score soumis et on vérifie si les deux ont validé
        await matchRef.update(updates);

        // Recharger pour vérifier si on finit le match
        const updatedDoc = await matchRef.get();
        const updatedData = updatedDoc.data();

        if (updatedData.home_validated && updatedData.away_validated) {
            // Idéalement on vérifie l'égalité des scores ici aussi
            if (updatedData.home_score === updatedData.home_score && updatedData.away_score === updatedData.away_score) {
                 await matchRef.update({ status: 'finished' });
            } else {
                 await matchRef.update({ status: 'disputed' });
            }
        }

        res.json({ message: 'Score enregistré' });
    } catch (error) {
        console.error('Erreur validateScore:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const disputeMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { reason } = req.body;
        
        await db.collection('matches').doc(matchId).update({
            status: 'disputed',
            dispute_reason: reason,
            updated_at: new Date().toISOString()
        });

        res.json({ message: 'Litige ouvert' });
    } catch (error) {
        console.error('Erreur disputeMatch:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {
  createMatch,
  getUpcomingMatches,
  getTrendingMatches,
  getMatchDetails,
  joinMatch,
  sendInvitation,
  getReceivedInvitations,
  getSentInvitations,
  respondToInvitation,
  confirmMatch,
  cancelMatch,
  deleteMatch,
  assignReferee,
  bookVenue,
  getMatchMessages,
  sendMatchMessage,
  getPendingValidations,
  getValidationStatus,
  validateScore,
  disputeMatch
};




