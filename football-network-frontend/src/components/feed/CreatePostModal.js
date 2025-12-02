import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Trophy,
  UserPlus,
  Image as ImageIcon,
  MessageSquare,
  Users,
  Target,
  MapPin,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const CreatePostModal = ({ isOpen, onClose, onPostCreated, token }) => {
  const [postType, setPostType] = useState("general");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour équipes et matchs
  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamMatches, setTeamMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");

  // États pour Match à venir
  const [matchDate, setMatchDate] = useState("");
  const [matchOpponent, setMatchOpponent] = useState("");

  // États pour Résultat de match
  const [matchScoreHome, setMatchScoreHome] = useState("");
  const [matchScoreAway, setMatchScoreAway] = useState("");

  // États pour Recrutement
  const [recruitmentPosition, setRecruitmentPosition] = useState("");
  const [recruitmentSkillLevel, setRecruitmentSkillLevel] = useState("");
  const [recruitmentDescription, setRecruitmentDescription] = useState("");

  // États pour Média
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");

  // États pour Localisation
  const [locationCity, setLocationCity] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadUserTeams();
    }
  }, [isOpen]);

  // Charger les matchs quand l'équipe ou le type de post change
  useEffect(() => {
    if (teamId && (postType === "match_announcement" || postType === "match_result")) {
      loadTeamMatches();
    } else {
      setTeamMatches([]);
      setSelectedMatchId("");
    }
  }, [teamId, postType]);

  // Remplir automatiquement les champs quand un match est sélectionné
  useEffect(() => {
    if (selectedMatchId && teamMatches.length > 0) {
      const match = teamMatches.find(m => m.id === parseInt(selectedMatchId));
      if (match) {
        if (postType === "match_announcement") {
          setMatchDate(match.match_date || "");
          setMatchOpponent(match.opponent_name || "");
        } else if (postType === "match_result") {
          setMatchOpponent(match.opponent_name || "");
          setMatchScoreHome(match.team_score?.toString() || "");
          setMatchScoreAway(match.opponent_score?.toString() || "");
        }
      }
    }
  }, [selectedMatchId, teamMatches, postType]);

  const loadUserTeams = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/teams/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(res.data);
    } catch (error) {
      console.error("Error loading teams:", error);
    }
  };

  const loadTeamMatches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/teams/${teamId}/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const now = new Date();
      let filteredMatches = [];

      if (postType === "match_announcement") {
        // Matchs futurs uniquement
        filteredMatches = res.data.filter(match =>
          new Date(match.match_date) > now
        );
      } else if (postType === "match_result") {
        // Matchs passés uniquement
        filteredMatches = res.data.filter(match =>
          new Date(match.match_date) <= now
        );
      }

      setTeamMatches(filteredMatches);
    } catch (error) {
      console.error("Error loading team matches:", error);
      setTeamMatches([]);
    }
  };

  const resetForm = () => {
    setPostType("general");
    setContent("");
    setMatchDate("");
    setMatchOpponent("");
    setTeamId("");
    setSelectedMatchId("");
    setTeamMatches([]);
    setMatchScoreHome("");
    setMatchScoreAway("");
    setRecruitmentPosition("");
    setRecruitmentSkillLevel("");
    setRecruitmentDescription("");
    setMediaUrl("");
    setMediaType("image");
    setLocationCity("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Le contenu ne peut pas être vide");
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        type: postType,
        content,
        locationCity: locationCity || undefined,
        teamId: teamId ? parseInt(teamId) : undefined,
      };

      if (postType === "match_announcement") {
        postData.matchDate = matchDate;
        postData.matchOpponent = matchOpponent;
      } else if (postType === "match_result") {
        postData.matchOpponent = matchOpponent;
        postData.matchScoreHome = parseInt(matchScoreHome);
        postData.matchScoreAway = parseInt(matchScoreAway);
      } else if (postType === "recruitment") {
        postData.recruitmentPosition = recruitmentPosition;
        postData.recruitmentSkillLevel = recruitmentSkillLevel;
        postData.recruitmentDescription = recruitmentDescription;
      } else if (postType === "media") {
        postData.mediaUrl = mediaUrl;
        postData.mediaType = mediaType;
      }

      const res = await axios.post(`${API_BASE_URL}/feed`, postData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Publication créée avec succès !");
      resetForm();
      onClose();
      if (onPostCreated) {
        onPostCreated(res.data.post);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(
        error.response?.data?.error || "Erreur lors de la création de la publication"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const postTypes = [
    { value: "general", label: "Publication", icon: MessageSquare, color: "blue" },
    {
      value: "match_announcement",
      label: "Match à venir",
      icon: Calendar,
      color: "indigo",
    },
    {
      value: "match_result",
      label: "Résultat de match",
      icon: Trophy,
      color: "green",
    },
    {
      value: "recruitment",
      label: "Recrutement",
      icon: UserPlus,
      color: "purple",
    },
    { value: "media", label: "Média", icon: ImageIcon, color: "pink" },
  ];

  const positions = [
    { value: "goalkeeper", label: "Gardien" },
    { value: "defender", label: "Défenseur" },
    { value: "midfielder", label: "Milieu" },
    { value: "forward", label: "Attaquant" },
    { value: "any", label: "Tous postes" },
  ];

  const skillLevels = [
    { value: "beginner", label: "Débutant" },
    { value: "amateur", label: "Amateur" },
    { value: "intermediate", label: "Intermédiaire" },
    { value: "advanced", label: "Avancé" },
    { value: "semi_pro", label: "Semi-professionnel" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Créer une publication
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type de publication */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Type de publication
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {postTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = postType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPostType(type.value)}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition ${
                      isSelected
                        ? `border-${type.color}-500 bg-${type.color}-50`
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <Icon
                      className={`w-8 h-8 mb-2 ${
                        isSelected ? `text-${type.color}-600` : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? `text-${type.color}-900` : "text-gray-600"
                      }`}
                    >
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sélection d'équipe (pour tous sauf general) */}
          {postType !== "general" && teams.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Équipe
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Sélectionnez une équipe</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Champs spécifiques pour Match à venir */}
          {postType === "match_announcement" && (
            <>
              {teamId && teamMatches.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sélectionner un match futur
                  </label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  >
                    <option value="">Choisir un match ou saisir manuellement</option>
                    {teamMatches.map((match) => (
                      <option key={match.id} value={match.id}>
                        vs {match.opponent_name} - {new Date(match.match_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </option>
                    ))}
                  </select>
                  {teamMatches.length === 0 && teamId && (
                    <p className="text-sm text-gray-500 mb-3">Aucun match à venir trouvé pour cette équipe</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adversaire
                </label>
                <input
                  type="text"
                  value={matchOpponent}
                  onChange={(e) => setMatchOpponent(e.target.value)}
                  placeholder="Nom de l'équipe adverse"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date du match
                </label>
                <input
                  type="datetime-local"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </>
          )}

          {/* Champs spécifiques pour Résultat de match */}
          {postType === "match_result" && (
            <>
              {teamId && teamMatches.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sélectionner un match passé
                  </label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent mb-3"
                  >
                    <option value="">Choisir un match ou saisir manuellement</option>
                    {teamMatches.map((match) => (
                      <option key={match.id} value={match.id}>
                        vs {match.opponent_name} - {new Date(match.match_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long'
                        })} {match.team_score !== null && match.opponent_score !== null ? `(${match.team_score}-${match.opponent_score})` : ''}
                      </option>
                    ))}
                  </select>
                  {teamMatches.length === 0 && teamId && (
                    <p className="text-sm text-gray-500 mb-3">Aucun match passé trouvé pour cette équipe</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adversaire
                </label>
                <input
                  type="text"
                  value={matchOpponent}
                  onChange={(e) => setMatchOpponent(e.target.value)}
                  placeholder="Nom de l'équipe adverse"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Score (Nous)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matchScoreHome}
                    onChange={(e) => setMatchScoreHome(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Score (Eux)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matchScoreAway}
                    onChange={(e) => setMatchScoreAway(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Champs spécifiques pour Recrutement */}
          {postType === "recruitment" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Poste recherché
                </label>
                <select
                  value={recruitmentPosition}
                  onChange={(e) => setRecruitmentPosition(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez un poste</option>
                  {positions.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Niveau demandé
                </label>
                <select
                  value={recruitmentSkillLevel}
                  onChange={(e) => setRecruitmentSkillLevel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez un niveau</option>
                  {skillLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description du profil recherché
                </label>
                <textarea
                  value={recruitmentDescription}
                  onChange={(e) => setRecruitmentDescription(e.target.value)}
                  placeholder="Décrivez le profil idéal..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            </>
          )}

          {/* Champs spécifiques pour Média */}
          {postType === "media" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de média
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="image"
                      checked={mediaType === "image"}
                      onChange={(e) => setMediaType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Image</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="video"
                      checked={mediaType === "video"}
                      onChange={(e) => setMediaType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Vidéo</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL du média
                </label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  Pour le moment, veuillez utiliser une URL publique. L'upload sera
                  disponible prochainement.
                </p>
              </div>
            </>
          )}

          {/* Contenu */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contenu de la publication
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrivez votre message..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Localisation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Localisation (optionnel)
            </label>
            <input
              type="text"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              placeholder="Ville"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Publication..." : "Publier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
