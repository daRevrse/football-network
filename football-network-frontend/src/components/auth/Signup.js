import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Trophy,
  Loader2,
  Briefcase,
  Shield,
  ShieldUser,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

// Schéma de validation conditionnel
const schema = yup.object({
  userType: yup.string().oneOf(["player", "manager", "referee"]).required(),
  email: yup.string().email("Email invalide").required("Email requis"),
  password: yup
    .string()
    .min(6, "Minimum 6 caractères")
    .required("Mot de passe requis"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Les mots de passe ne correspondent pas")
    .required("Confirmation requise"),
  firstName: yup
    .string()
    .min(2, "Minimum 2 caractères")
    .required("Prénom requis"),
  lastName: yup.string().min(2, "Minimum 2 caractères").required("Nom requis"),
  phone: yup.string().optional(),

  // Validation conditionnelle pour Manager
  teamName: yup.string().when("userType", {
    is: "manager",
    then: (schema) =>
      schema.min(3, "3 caractères minimum").required("Nom de l'équipe requis"),
    otherwise: (schema) => schema.optional(),
  }),

  // Validation conditionnelle pour Joueur
  position: yup.string().when("userType", {
    is: "player",
    then: (schema) => schema.optional(),
    otherwise: (schema) => schema.nullable(),
  }),
  skillLevel: yup.string().when("userType", {
    is: "player",
    then: (schema) => schema.optional(),
    otherwise: (schema) => schema.nullable(),
  }),

  // Validation conditionnelle pour Arbitre
  licenseNumber: yup.string().when("userType", {
    is: "referee",
    then: (schema) => schema.optional(),
    otherwise: (schema) => schema.nullable(),
  }),
  licenseLevel: yup.string().when("userType", {
    is: "referee",
    then: (schema) => schema.optional(),
    otherwise: (schema) => schema.nullable(),
  }),
  experienceYears: yup.number().when("userType", {
    is: "referee",
    then: (schema) => schema.min(0, "Minimum 0 ans").optional(),
    otherwise: (schema) => schema.nullable(),
  }),

  locationCity: yup.string().required("Ville requise"), // Requis pour tous
});

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // État local pour gérer l'affichage UI, synchronisé avec react-hook-form
  const [userType, setUserType] = useState("player");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      userType: "player",
      position: "",
      skillLevel: "",
    },
  });

  // Fonction pour changer de type
  const handleTypeChange = (type) => {
    setUserType(type);
    setValue("userType", type);
    clearErrors(); // Nettoyer les erreurs potentielles lors du changement
  };

  const onSubmit = async (data) => {
    setIsLoading(true);

    // Nettoyage des données avant envoi
    const payload = { ...data };
    if (payload.userType === "manager") {
      delete payload.position;
      delete payload.skillLevel;
      delete payload.licenseNumber;
      delete payload.licenseLevel;
      delete payload.experienceYears;
    } else if (payload.userType === "referee") {
      delete payload.position;
      delete payload.skillLevel;
      delete payload.teamName;
    } else {
      delete payload.teamName;
      delete payload.licenseNumber;
      delete payload.licenseLevel;
      delete payload.experienceYears;
    }

    const result = await signup(payload);
    if (result.success) {
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  // Composant Input réutilisable
  const InputField = ({
    icon: Icon,
    name,
    type = "text",
    placeholder,
    error,
    label,
    ...props
  }) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative group">
        <Icon className="absolute left-3 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
        <input
          type={type}
          {...register(name)}
          className={`w-full pl-10 pr-4 py-3 bg-black/20 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
            error ? "border-red-500 focus:ring-red-500" : "border-white/10"
          }`}
          placeholder={placeholder}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-1 ml-1">{error.message}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden py-12">
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=2500&auto=format&fit=crop"
          alt="Football Field"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-green-900/80"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-3xl px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Rejoignez le terrain
          </h1>
          <p className="text-gray-300">
            Créez votre profil et connectez-vous avec des milliers de
            passionnés.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
          {/* SÉLECTEUR DE RÔLE */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button
              type="button"
              onClick={() => handleTypeChange("player")}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                userType === "player"
                  ? "bg-green-600/20 border-green-500 text-white"
                  : "bg-black/20 border-transparent text-gray-400 hover:bg-black/40"
              }`}
            >
              <User
                className={`w-8 h-8 ${
                  userType === "player" ? "text-green-400" : "text-gray-500"
                }`}
              />
              <span className="font-bold text-sm">Joueur</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange("manager")}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                userType === "manager"
                  ? "bg-green-600/20 border-green-500 text-white"
                  : "bg-black/20 border-transparent text-gray-400 hover:bg-black/40"
              }`}
            >
              <Briefcase
                className={`w-8 h-8 ${
                  userType === "manager" ? "text-green-400" : "text-gray-500"
                }`}
              />
              <span className="font-bold text-sm">Manager</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange("referee")}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                userType === "referee"
                  ? "bg-green-600/20 border-green-500 text-white"
                  : "bg-black/20 border-transparent text-gray-400 hover:bg-black/40"
              }`}
            >
              <ShieldUser
                className={`w-8 h-8 ${
                  userType === "referee" ? "text-green-400" : "text-gray-500"
                }`}
              />
              <span className="font-bold text-sm">Arbitre</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Input caché pour le userType (nécessaire pour react-hook-form) */}
            <input type="hidden" {...register("userType")} />

            {/* Bouton Google Sign-In */}
            <button
              type="button"
              onClick={() => {
                alert('Cette fonctionnalité sera bientôt disponible. Veuillez remplir le formulaire ci-dessous.');
              }}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white py-3 px-4 rounded-xl font-semibold hover:bg-white/15 focus:ring-4 focus:ring-white/20 transition-all flex items-center justify-center space-x-3"
            >
              <img
                src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                alt="Google"
                className="w-5 h-5"
              />
              <span>S'inscrire avec Google</span>
            </button>

            {/* Divider avec OU */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="px-4 text-sm text-gray-400 font-semibold">OU</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            {/* Section 1: Identité */}
            <div>
              <h3 className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-4 flex items-center">
                <User className="w-4 h-4 mr-2" /> Informations Personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  icon={User}
                  name="firstName"
                  label="Prénom *"
                  placeholder={userType === "manager" ? "Carlos" : "Jude"}
                  error={errors.firstName}
                />
                <InputField
                  icon={User}
                  name="lastName"
                  label="Nom *"
                  placeholder={
                    userType === "manager" ? "Ancelotti" : "Bellingham"
                  }
                  error={errors.lastName}
                />
              </div>
            </div>

            {/* Section 2: Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                icon={Mail}
                name="email"
                type="email"
                label="Email *"
                placeholder="email@exemple.com"
                error={errors.email}
              />
              <InputField
                icon={Phone}
                name="phone"
                type="tel"
                label="Téléphone"
                placeholder="90 90 90 90"
                error={errors.phone}
              />
            </div>

            {/* Section 3: Sécurité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">
                  Mot de passe *
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-green-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`w-full pl-10 pr-12 py-3 bg-black/20 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 border-white/10 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">
                  Confirmer *
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500 group-focus-within:text-green-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className={`w-full pl-10 pr-12 py-3 bg-black/20 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 border-white/10 ${
                      errors.confirmPassword ? "border-red-500" : ""
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Section 4: CONDITIONNELLE */}
            <div className="pt-2">
              <h3 className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-4 flex items-center">
                {userType === "manager" ? (
                  <>
                    <Shield className="w-4 h-4 mr-2" /> Votre Équipe
                  </>
                ) : userType === "referee" ? (
                  <>
                    <ShieldUser className="w-4 h-4 mr-2" /> Profil Arbitre
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 mr-2" /> Profil Joueur
                  </>
                )}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Champs spécifiques MANAGER */}
                {userType === "manager" && (
                  <div className="md:col-span-2">
                    <InputField
                      icon={Shield}
                      name="teamName"
                      label="Nom de l'équipe *"
                      placeholder="FC Paris..."
                      error={errors.teamName}
                    />
                    <p className="text-xs text-gray-400 mt-2 ml-1">
                      * Vous serez automatiquement désigné manager.
                    </p>
                  </div>
                )}

                {/* Champs spécifiques JOUEUR */}
                {userType === "player" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Position
                      </label>
                      <select
                        {...register("position")}
                        className="w-full py-3 px-4 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="" className="bg-gray-800">
                          Choisir...
                        </option>
                        <option value="goalkeeper" className="bg-gray-800">
                          Gardien
                        </option>
                        <option value="defender" className="bg-gray-800">
                          Défenseur
                        </option>
                        <option value="midfielder" className="bg-gray-800">
                          Milieu
                        </option>
                        <option value="forward" className="bg-gray-800">
                          Attaquant
                        </option>
                        <option value="any" className="bg-gray-800">
                          Polyvalent
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Niveau
                      </label>
                      <select
                        {...register("skillLevel")}
                        className="w-full py-3 px-4 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="" className="bg-gray-800">
                          Choisir...
                        </option>
                        <option value="beginner" className="bg-gray-800">
                          Débutant
                        </option>
                        <option value="amateur" className="bg-gray-800">
                          Amateur
                        </option>
                        <option value="intermediate" className="bg-gray-800">
                          Intermédiaire
                        </option>
                        <option value="advanced" className="bg-gray-800">
                          Avancé
                        </option>
                      </select>
                    </div>
                  </>
                )}

                {/* Champs spécifiques ARBITRE */}
                {userType === "referee" && (
                  <>
                    <div>
                      <InputField
                        icon={ShieldUser}
                        name="licenseNumber"
                        label="Numéro de licence"
                        placeholder="REF-2024-001"
                        error={errors.licenseNumber}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Niveau de licence
                      </label>
                      <select
                        {...register("licenseLevel")}
                        className="w-full py-3 px-4 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="" className="bg-gray-800">
                          Choisir...
                        </option>
                        <option value="trainee" className="bg-gray-800">
                          Stagiaire
                        </option>
                        <option value="regional" className="bg-gray-800">
                          Régional
                        </option>
                        <option value="national" className="bg-gray-800">
                          National
                        </option>
                        <option value="international" className="bg-gray-800">
                          International
                        </option>
                      </select>
                    </div>
                    <div>
                      <InputField
                        icon={Trophy}
                        name="experienceYears"
                        type="number"
                        label="Années d'expérience"
                        placeholder="5"
                        error={errors.experienceYears}
                      />
                    </div>
                  </>
                )}

                {/* Champ commun : Ville */}
                <InputField
                  icon={MapPin}
                  name="locationCity"
                  label="Ville *"
                  placeholder="Paris"
                  error={errors.locationCity}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-green-600 text-white py-4 px-4 rounded-xl font-bold hover:bg-green-500 focus:ring-4 focus:ring-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-600/20 flex items-center justify-center transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Création du compte...
                </>
              ) : userType === "manager" ? (
                "Créer mon équipe"
              ) : userType === "referee" ? (
                "Devenir arbitre"
              ) : (
                "S'inscrire et jouer"
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-gray-400">
              Vous avez déjà un compte ?{" "}
              <Link
                to="/login"
                className="text-green-400 hover:text-green-300 font-bold transition-colors hover:underline"
              >
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
