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
  ShieldUser,
  ArrowRight,
  ArrowLeft,
  Building2,
  CheckCircle2,
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
  teamName: yup.string().when("userType", {
    is: "manager",
    then: (schema) =>
      schema.min(3, "3 caractères minimum").required("Nom de l'équipe requis"),
    otherwise: (schema) => schema.optional(),
  }),
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
  locationCity: yup.string().required("Ville requise"),
});

// Composant Input défini EN DEHORS du composant principal
const InputField = React.memo(({ icon: Icon, name, type = "text", placeholder, error, label, registerFn }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-300 mb-2">
      {label}
    </label>
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
      <input
        type={type}
        {...registerFn(name)}
        className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-white/10 transition-all ${
          error ? "border-red-500/50" : "border-white/10"
        }`}
        placeholder={placeholder}
      />
    </div>
    {error && (
      <p className="text-red-400 text-sm mt-1.5 flex items-center">
        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
        {error.message}
      </p>
    )}
  </div>
));

const roleCards = [
  {
    type: "player",
    icon: User,
    title: "Joueur",
    description: "Je cherche une équipe ou des matchs",
  },
  {
    type: "manager",
    icon: Briefcase,
    title: "Manager",
    description: "Je gère une équipe de foot",
  },
  {
    type: "referee",
    icon: ShieldUser,
    title: "Arbitre",
    description: "J'arbitre des matchs",
  },
];

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleTypeChange = (type) => {
    setUserType(type);
    setValue("userType", type);
    clearErrors();
  };

  const onSubmit = async (data) => {
    setIsLoading(true);

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

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Partie gauche - Image */}
      <div className="hidden lg:flex lg:w-2/5 relative">
        <img
          src="https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=2500&auto=format&fit=crop"
          alt="Football Field"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-green-900/80"></div>

        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la connexion</span>
          </Link>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <span className="text-xl font-black text-white">FN</span>
              </div>
              <span className="text-2xl font-bold text-white">FootConnect</span>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white leading-tight mb-3">
                Rejoignez la<br />
                <span className="text-green-400">communauté.</span>
              </h2>
              <p className="text-white/60 max-w-sm">
                Des milliers de joueurs, managers et arbitres vous attendent pour partager votre passion.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/70">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Inscription gratuite et rapide</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Trouvez des matchs près de chez vous</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Gérez votre équipe facilement</span>
              </div>
            </div>
          </div>

          <p className="text-white/40 text-sm">
            © 2024 FootConnect. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-3/5 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6 py-10 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Mobile header */}
          <div className="lg:hidden mb-6">
            <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </Link>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Créez votre compte
            </h1>
            <p className="text-gray-400">
              Choisissez votre profil et rejoignez la communauté
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 lg:p-8">
            {/* Sélecteur de rôle */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {roleCards.map((role) => (
                <button
                  key={role.type}
                  type="button"
                  onClick={() => handleTypeChange(role.type)}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    userType === role.type
                      ? "bg-green-500/10 border-green-500 text-white"
                      : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <role.icon
                    className={`w-7 h-7 ${
                      userType === role.type ? "text-green-400" : "text-gray-500"
                    }`}
                  />
                  <span className="font-semibold text-sm">{role.title}</span>
                  <span className="text-xs text-gray-500 hidden sm:block text-center">
                    {role.description}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <input type="hidden" {...register("userType")} />

              {/* Section Identité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  icon={User}
                  name="firstName"
                  label="Prénom *"
                  placeholder="Jude"
                  error={errors.firstName}
                  registerFn={register}
                />
                <InputField
                  icon={User}
                  name="lastName"
                  label="Nom *"
                  placeholder="Bellingham"
                  error={errors.lastName}
                  registerFn={register}
                />
              </div>

              {/* Section Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  icon={Mail}
                  name="email"
                  type="email"
                  label="Email *"
                  placeholder="email@exemple.com"
                  error={errors.email}
                  registerFn={register}
                />
                <InputField
                  icon={Phone}
                  name="phone"
                  type="tel"
                  label="Téléphone"
                  placeholder="06 12 34 56 78"
                  error={errors.phone}
                  registerFn={register}
                />
              </div>

              {/* Section Sécurité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mot de passe *
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-green-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className={`w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all ${
                        errors.password ? "border-red-500/50" : "border-white/10"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1.5">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmer *
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-green-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      className={`w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all ${
                        errors.confirmPassword ? "border-red-500/50" : "border-white/10"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1.5">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Section Conditionnelle selon le rôle */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {userType === "manager" && "Votre équipe"}
                    {userType === "referee" && "Profil arbitre"}
                    {userType === "player" && "Profil joueur"}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Champs Manager */}
                  {userType === "manager" && (
                    <div className="md:col-span-2">
                      <InputField
                        icon={Trophy}
                        name="teamName"
                        label="Nom de l'équipe *"
                        placeholder="FC Paris..."
                        error={errors.teamName}
                        registerFn={register}
                      />
                    </div>
                  )}

                  {/* Champs Joueur */}
                  {userType === "player" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
                        <select
                          {...register("position")}
                          className="w-full py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        >
                          <option value="" className="bg-gray-900">Choisir...</option>
                          <option value="goalkeeper" className="bg-gray-900">Gardien</option>
                          <option value="defender" className="bg-gray-900">Défenseur</option>
                          <option value="midfielder" className="bg-gray-900">Milieu</option>
                          <option value="forward" className="bg-gray-900">Attaquant</option>
                          <option value="any" className="bg-gray-900">Polyvalent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Niveau</label>
                        <select
                          {...register("skillLevel")}
                          className="w-full py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        >
                          <option value="" className="bg-gray-900">Choisir...</option>
                          <option value="beginner" className="bg-gray-900">Débutant</option>
                          <option value="amateur" className="bg-gray-900">Amateur</option>
                          <option value="intermediate" className="bg-gray-900">Intermédiaire</option>
                          <option value="advanced" className="bg-gray-900">Avancé</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Champs Arbitre */}
                  {userType === "referee" && (
                    <>
                      <InputField
                        icon={ShieldUser}
                        name="licenseNumber"
                        label="N° de licence"
                        placeholder="REF-2024-001"
                        error={errors.licenseNumber}
                        registerFn={register}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Niveau licence</label>
                        <select
                          {...register("licenseLevel")}
                          className="w-full py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        >
                          <option value="" className="bg-gray-900">Choisir...</option>
                          <option value="trainee" className="bg-gray-900">Stagiaire</option>
                          <option value="regional" className="bg-gray-900">Régional</option>
                          <option value="national" className="bg-gray-900">National</option>
                          <option value="international" className="bg-gray-900">International</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Ville - Commun à tous */}
                  <InputField
                    icon={MapPin}
                    name="locationCity"
                    label="Ville *"
                    placeholder="Paris"
                    error={errors.locationCity}
                    registerFn={register}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-500 text-white py-4 px-4 rounded-xl font-bold hover:from-green-500 hover:to-green-400 focus:ring-4 focus:ring-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-600/25 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  <>
                    {userType === "manager" ? "Créer mon équipe" : userType === "referee" ? "Devenir arbitre" : "S'inscrire"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Login link */}
            <div className="mt-6 text-center border-t border-white/10 pt-6">
              <p className="text-gray-400">
                Vous avez déjà un compte ?{" "}
                <Link
                  to="/login"
                  className="text-green-400 hover:text-green-300 font-semibold transition-colors"
                >
                  Connectez-vous
                </Link>
              </p>
            </div>
          </div>

          {/* Venue Owner link */}
          <div className="mt-6 text-center">
            <Link
              to="/signup/venue-owner"
              className="inline-flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 hover:border-emerald-500/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">Vous gérez un terrain ?</p>
                <p className="text-sm text-gray-500">Inscription propriétaire</p>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
