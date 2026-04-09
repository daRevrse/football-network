const { db } = require('../config/firebase');

/**
 * Récupérer ou créer le profil utilisateur depuis Firestore.
 * Utile juste après un login réussi (ou un signup) côté Front-end.
 */
const getOrCreateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    const userRef = db.collection('users').doc(uid);
    
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      // S'il n'existe pas, on le crée avec les infos par défaut
      const newUserProfile = {
        uid,
        email,
        displayName: req.user.name || req.body.displayName || "",
        photoURL: req.user.picture || req.body.photoURL || "",
        phoneNumber: req.user.phone_number || "",
        role: "player",           // Valeur par défaut ('player', 'organizer', 'admin')
        stats: {
          matchesPlayed: 0,
          goalsScored: 0,
          assists: 0,
          rating: 5.0
        },
        joinedAt: new Date().toISOString(),
      };

      await userRef.set(newUserProfile);
      return res.status(201).json({ message: "Profil créé avec succès", user: newUserProfile });
    }

    // Le document existe, on le renvoie
    return res.status(200).json({ message: "Profil récupéré", user: userDoc.data() });

  } catch (error) {
    console.error("Erreur gérant le profil utilisateur:", error);
    return res.status(500).json({ error: "Erreur serveur lors de la gestion du profil" });
  }
};

/**
 * Récupérer un profil public par son UID
 */
const getPublicProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.status(200).json({ user: userDoc.data() });
  } catch (error) {
    console.error("Erreur récupération profil public:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


/**
 * Mettre à jour des champs spécifiques du profil
 */
const updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const updates = req.body; // e.g. { displayName: "Nouveau Nom", position: "Attaquant" }

    // Interdire la modification de champs sensibles par l'utilisateur lui-même (comme le rôle ou les stats manuellement)
    delete updates.role;
    delete updates.stats;
    delete updates.uid;
    
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      ...updates,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ message: "Profil mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur de mise à jour:", error);
    res.status(500).json({ error: "Impossible de mettre à jour le profil" });
  }
};

module.exports = {
  getOrCreateProfile,
  updateProfile,
  getPublicProfile
};
