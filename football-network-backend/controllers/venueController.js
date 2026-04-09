const { getFirestore } = require('firebase-admin/firestore');

// Create a new venue
exports.createVenue = async (req, res) => {
    try {
        // RPAC: Only venue_owner can create a venue
        if (req.user.userType !== 'venue_owner') {
            return res.status(403).json({ error: 'Seul un propriétaire de terrain peut ajouter un complexe sportif.' });
        }

        const { name, location, pricePerHour, description, facilities, images } = req.body;

        if (!name || !location || !pricePerHour) {
            return res.status(400).json({ error: 'Les champs nom, location et pricePerHour sont obligatoires.' });
        }

        const db = getFirestore();
        const venueData = {
            name,
            location,
            pricePerHour: Number(pricePerHour),
            description: description || '',
            facilities: facilities || [], // Array of strings (e.g. ['wifi', 'parking', 'showers'])
            images: images || [], // Array of public URLs from Firebase Storage
            ownerId: req.user.uid,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        const docRef = await db.collection('venues').add(venueData);

        res.status(201).json({ id: docRef.id, ...venueData });
    } catch (error) {
        console.error('Erreur createVenue:', error);
        res.status(500).json({ error: 'Erreur lors de la création du complexe sportif.' });
    }
};

// Get all venues
exports.getVenues = async (req, res) => {
    try {
        const db = getFirestore();
        const venuesSnapshot = await db.collection('venues').where('status', '==', 'active').get();
        
        const venues = [];
        venuesSnapshot.forEach(doc => {
            venues.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json({ venues });
    } catch (error) {

        console.error('Erreur getVenues:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des terrains.' });
    }
};

// Book a venue
exports.bookVenue = async (req, res) => {
    try {
        const venueId = req.params.venueId;
        const { date, startTime, endTime, matchId } = req.body;

        // Ensure proper format for simplicity: YYYY-MM-DD and HH:MM
        if (!date || !startTime || !endTime) {
            return res.status(400).json({ error: 'Date, startTime et endTime requis.' });
        }

        // Ideally only a manager organising a match can book, but we'll leave it accessible 
        // to logged-in users who might want a friendly kickabout.
        const db = getFirestore();
        const venueRef = db.collection('venues').doc(venueId);
        const bookingsCol = venueRef.collection('bookings');

        // Check if venue exists
        const venueDoc = await venueRef.get();
        if (!venueDoc.exists) {
            return res.status(404).json({ error: 'Terrain introuvable.' });
        }

        const bookingDocId = await db.runTransaction(async (transaction) => {
            // Check for existing bookings on that date
            const existingBookingsSnapshot = await transaction.get(
                bookingsCol.where('date', '==', date)
            );
            
            let isOverlapping = false;
            
            existingBookingsSnapshot.forEach(doc => {
                const booking = doc.data();
                if (booking.status !== 'cancelled') {
                    // Overlap check
                    if (
                        (startTime >= booking.startTime && startTime < booking.endTime) ||
                        (endTime > booking.startTime && endTime <= booking.endTime) ||
                        (startTime <= booking.startTime && endTime >= booking.endTime)
                    ) {
                        isOverlapping = true;
                    }
                }
            });

            if (isOverlapping) {
                throw new Error('OVERLAP');
            }

            // Create new booking
            const newBookingRef = bookingsCol.doc();
            const newBookingData = {
                bookerId: req.user.uid,
                matchId: matchId || null,
                date,
                startTime,
                endTime,
                status: 'confirmed', // could be 'pending_payment' in a real app
                createdAt: new Date().toISOString()
            };

            transaction.set(newBookingRef, newBookingData);
            return newBookingRef.id;
        });

        res.status(201).json({ 
            message: 'Réservation confirmée avec succès.', 
            bookingId: bookingDocId 
        });

    } catch (error) {
        console.error('Erreur bookVenue:', error);
        if (error.message === 'OVERLAP') {
            return res.status(409).json({ error: 'Le créneau demandé est déjà réservé.' });
        }
        res.status(500).json({ error: 'Erreur lors de la réservation du terrain.' });
    }
};

// Get bookings for a venue
exports.getVenueBookings = async (req, res) => {
    try {
        const venueId = req.params.venueId;
        const { date } = req.query; // optional filter by date

        const db = getFirestore();
        let query = db.collection('venues').doc(venueId).collection('bookings');

        if (date) {
            query = query.where('date', '==', date);
        }

        const snapshot = await query.get();
        const bookings = [];
        snapshot.forEach(doc => {
            bookings.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(bookings);
    } catch (error) {
        console.error('Erreur getVenueBookings:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des réservations.' });
    }
};
