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
  Loader2,
  ArrowRight,
  Users,
  Trophy,
  MapPin,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const schema = yup.object({
  email: yup.string().email("Email invalide").required("Email requis"),
  password: yup.string().required("Mot de passe requis"),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
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
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Partie gauche - Image et branding */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2836&auto=format&fit=crop"
          alt="Football Stadium"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-black/70 to-black/90"></div>

        {/* Contenu overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <span className="text-xl font-black text-white">FN</span>
              </div>
              <span className="text-2xl font-bold text-white">FootConnect</span>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Le football<br />
              <span className="text-green-400">connecté.</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-white/80">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <span>Rejoignez des milliers de joueurs</span>
              </div>
              <div className="flex items-center gap-4 text-white/80">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <span>Organisez vos matchs facilement</span>
              </div>
              <div className="flex items-center gap-4 text-white/80">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <span>Trouvez les meilleurs terrains</span>
              </div>
            </div>
          </div>

          <p className="text-white/40 text-sm">
            © 2024 FootConnect. La plateforme du football amateur.
          </p>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6">
        {/* Background pattern */}
        <div className="absolute inset-0 lg:left-1/2 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-green-500/30">
              <span className="text-2xl font-black text-white">FN</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Bon retour !
            </h1>
            <p className="text-gray-400">
              Connectez-vous pour accéder à votre espace.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                  <input
                    type="email"
                    {...register("email")}
                    className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-white/10 transition-all ${
                      errors.email
                        ? "border-red-500/50 focus:ring-red-500/50"
                        : "border-white/10"
                    }`}
                    placeholder="votre@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Mot de passe
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-green-400 hover:text-green-300 transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-white/10 transition-all ${
                      errors.password
                        ? "border-red-500/50 focus:ring-red-500/50"
                        : "border-white/10"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-4 px-4 rounded-xl font-bold hover:from-green-500 hover:to-green-400 focus:ring-4 focus:ring-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-600/25 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connexion...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <span className="px-4 text-sm text-gray-500">ou</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            {/* Google Sign-In */}
            <button
              type="button"
              onClick={() => alert('Fonctionnalité bientôt disponible')}
              className="w-full bg-white/5 border border-white/10 text-white py-3.5 px-4 rounded-xl font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              <img
                src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Continuer avec Google</span>
            </button>
          </div>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Pas encore de compte ?{" "}
              <Link
                to="/signup"
                className="text-green-400 hover:text-green-300 font-semibold transition-colors"
              >
                Créer un compte
              </Link>
            </p>
          </div>

          {/* Venue Owner Link */}
          <div className="mt-4 text-center">
            <Link
              to="/signup/venue-owner"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-400 transition-colors group"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vous gérez un terrain de foot ?</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
