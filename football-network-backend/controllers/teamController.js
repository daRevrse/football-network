const { db } = require('../config/firebase');

// Créer une nouvelle équipe
exports.createTeam = async (req, res) => {
    try {
        const { name, city, short_name, logo_url } = req.body;
        const manager_id = req.user.uid;

        // Vérifier si l'utilisateur est manager
        const userDoc = await db.collection('users').doc(manager_id).get();
        if (!userDoc.exists || userDoc.data().role !== 'manager') {
            return res.status(403).json({ error: 'Seuls les managers peuvent créer une équipe.' });
        }

        const newTeam = {
            name,
            short_name: short_name || '',
            city: city || '',
            logo_url: logo_url || '',
            manager_id,
            players: [], // array de uids
            stats: { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0 },
            created_at: new Date().toISOString()
        };

        const docRef = await db.collection('teams').add(newTeam);

        res.status(201).json({ 
            message: 'Équipe créée avec succès', 
            teamId: docRef.id,
            team: newTeam
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'équipe:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création' });
    }
};


// Récupérer les équipes de l'utilisateur connecté
exports.getMyTeams = async (req, res) => {
    try {
        const userId = req.user.uid;
        
        // On cherche quand on est manager
        const managerSnapshot = await db.collection('teams').where('manager_id', '==', userId).get();
        // On cherche quand on est dans le array players
        const playerSnapshot = await db.collection('teams').where('players', 'array-contains', userId).get();

        let teams = [];
        managerSnapshot.forEach(doc => {
            teams.push({ id: doc.id, ...doc.data(), role: 'manager' });
        });
        playerSnapshot.forEach(doc => {
            // eviter les doublons (si manager est aussi joueur, ce qui est rare normalement par design ici mais possible)
            if (!teams.find(t => t.id === doc.id)) {
                teams.push({ id: doc.id, ...doc.data(), role: 'player' });
            }
        });

        res.status(200).json(teams);
    } catch (error) {
        console.error('Erreur lors de la récupération de mes équipes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer toutes les équipes (global)
exports.getTeams = async (req, res) => {
    try {
        let teamsQuery = db.collection('teams');
        const snapshot = await teamsQuery.get();
        const teams = [];
        snapshot.forEach(doc => {
            teams.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(teams);
    } catch (error) {
        console.error('Erreur lors de la récupération des équipes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};


// Ajouter un joueur à une équipe (par le manager)
exports.addPlayer = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { playerId } = req.body;
        const managerId = req.user.uid;

        const teamRef = db.collection('teams').doc(teamId);
        
        await db.runTransaction(async (transaction) => {
            const teamDoc = await transaction.get(teamRef);
            
            if (!teamDoc.exists) {
                throw new Error('Équipe non trouvée.');
            }
            
            const teamData = teamDoc.data();
            
            // RBAC : Seul le manager de cette équipe peut la modifier
            if (teamData.managerId !== managerId) {
                throw new Error('Accès refusé. Vous n\'êtes pas le manager de cette équipe.');
            }

            // Vérification profil joueur ciblé
            const playerDoc = await transaction.get(db.collection('users').doc(playerId));
            if (!playerDoc.exists) {
                throw new Error('Joueur introuvable');
            }
            
            // S'assurer qu'il s'agit bien d'un profil player et pas d'un autre profil incompatible
            // Bien que techniquement d'autres profils existent, on renforce ici selon votre RBAC restrictif
            
            let players = teamData.players || [];
            if (players.includes(playerId)) {
                throw new Error('Le joueur est déjà dans l\'équipe.');
            }
            
            players.push(playerId);
            transaction.update(teamRef, { players });
        });

        res.status(200).json({ message: 'Joueur ajouté à l\'équipe avec succès.' });

    } catch (error) {
        console.error('Erreur dans addPlayer:', error);
        // Gestion de l'erreur envoyée par la transaction
        if (error.message.includes('Accès refusé') || error.message.includes('non trouvée') || error.message.includes('déjà dans')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du joueur.' });
    }
};
module.exports = {
    createTeam: exports.createTeam,
    getTeams: exports.getTeams,
    getMyTeams: exports.getMyTeams,
    addPlayer: exports.addPlayer
};
