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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const schema = yup.object({
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
  birthDate: yup.date().optional(),
  position: yup.string().optional(),
  skillLevel: yup.string().optional(),
  locationCity: yup.string().optional(),
});

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await signup(data);
    if (result.success) {
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  // Composant Input réutilisable pour garder le code propre
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
            Créez votre profil et connectez-vous avec des milliers de joueurs.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  placeholder="Kylian"
                  error={errors.firstName}
                />
                <InputField
                  icon={User}
                  name="lastName"
                  label="Nom *"
                  placeholder="Mbappé"
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
                placeholder="joueur@exemple.com"
                error={errors.email}
              />
              <InputField
                icon={Phone}
                name="phone"
                type="tel"
                label="Téléphone"
                placeholder="06 12 34 56 78"
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

            {/* Section 4: Profil Joueur */}
            <div className="pt-2">
              <h3 className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-4 flex items-center">
                <Trophy className="w-4 h-4 mr-2" /> Profil Joueur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                <InputField
                  icon={MapPin}
                  name="locationCity"
                  label="Ville"
                  placeholder="Paris"
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
              ) : (
                "S'inscrire et commencer"
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
