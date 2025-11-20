import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Check } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/password/forgot`, { email });

      setEmailSent(true);
      toast.success("Email envoyé ! Vérifiez votre boîte de réception.");
    } catch (error) {
      console.error("Forgot password error:", error);
      // Même en cas d'erreur, on affiche un message générique pour la sécurité
      setEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Bouton retour */}
        <Link
          to="/login"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour à la connexion
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {!emailSent ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Mot de passe oublié ?
                </h2>
                <p className="text-gray-600">
                  Entrez votre email et nous vous enverrons un lien pour
                  réinitialiser votre mot de passe.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </div>
                  ) : (
                    "Envoyer le lien de réinitialisation"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Email envoyé !
                </h2>
                <p className="text-gray-600 mb-6">
                  Si un compte existe avec l'adresse <strong>{email}</strong>, vous
                  recevrez un email avec un lien pour réinitialiser votre mot de
                  passe.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Conseil :</strong> Vérifiez également votre dossier
                    spam si vous ne recevez pas l'email dans les prochaines minutes.
                  </p>
                </div>

                <Link
                  to="/login"
                  className="inline-flex items-center text-green-600 font-medium hover:text-green-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Vous n'avez pas encore de compte ?{" "}
          <Link
            to="/signup"
            className="font-medium text-green-600 hover:text-green-700"
          >
            Inscrivez-vous
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
