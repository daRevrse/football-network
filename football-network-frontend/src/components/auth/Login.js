import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2836&auto=format&fit=crop"
          alt="Football Stadium"
          className="w-full h-full object-cover"
        />
        {/* Overlay dégradé sombre */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-black/80 to-black/90"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          {/* Logo placeholder ou icône */}
          <div className="w-16 h-16 bg-green-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-green-500/30 transform rotate-3">
            <span className="text-2xl font-black text-white">FN</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bon retour !</h1>
          <p className="text-gray-300">
            Prêt pour le prochain match ? Connectez-vous.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-400 transition-colors" />
                <input
                  type="email"
                  {...register("email")}
                  className={`w-full pl-10 pr-4 py-3 bg-black/20 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/10"
                  }`}
                  placeholder="votre@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-200">
                  Mot de passe
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  Oublié ?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`w-full pl-10 pr-12 py-3 bg-black/20 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/10"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-green-500 focus:ring-4 focus:ring-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-600/20 flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-gray-400">
              Pas encore de compte ?{" "}
              <Link
                to="/signup"
                className="text-green-400 hover:text-green-300 font-bold transition-colors inline-flex items-center hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Footer simple */}
        <p className="text-center text-gray-500 text-xs mt-8">
          © 2024 Football Network. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default Login;
