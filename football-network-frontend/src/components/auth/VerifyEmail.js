import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Mail,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext"; // Utilisation du contexte

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth(); // Récupération depuis le contexte
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState(
    "Vérification de votre email en cours..."
  );

  const [resendEmailInput, setResendEmailInput] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien de vérification invalide ou manquant.");
      return;
    }

    const performVerification = async () => {
      const result = await verifyEmail(token);
      if (result.success) {
        setStatus("success");
        setMessage("Votre email a été vérifié avec succès !");
        setTimeout(() => navigate("/login"), 5000);
      } else {
        setStatus("error");
        setMessage(result.error);
      }
    };

    performVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // verifyEmail est stable grâce à useCallback dans le contexte

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmailInput) return;

    setIsResending(true);
    const result = await resendVerification(resendEmailInput);
    if (result.success) {
      setResendEmailInput("");
    }
    setIsResending(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background identique au Login */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2836&auto=format&fit=crop"
          alt="Football Stadium"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-black/80 to-black/90"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-green-500/30 transform rotate-3">
            <span className="text-2xl font-black text-white">FN</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Vérification Email
          </h1>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
          {/* ÉTAT : CHARGEMENT */}
          {status === "verifying" && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 text-green-500 animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">
                Vérification...
              </h3>
              <p className="text-gray-300">
                Nous validons votre lien de confirmation.
              </p>
            </div>
          )}

          {/* ÉTAT : SUCCÈS */}
          {status === "success" && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Compte Vérifié !
              </h3>
              <p className="text-gray-300 mb-8">{message}</p>

              <Link
                to="/login"
                className="w-full bg-green-600 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center space-x-2"
              >
                <span>Se connecter maintenant</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}

          {/* ÉTAT : ERREUR */}
          {status === "error" && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Lien Invalide
              </h3>
              <p className="text-red-200 mb-6 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {message}
              </p>

              {/* Formulaire de renvoi */}
              <div className="text-left mt-8 pt-6 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-4 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Renvoyer un lien de vérification ?
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                    <input
                      type="email"
                      value={resendEmailInput}
                      onChange={(e) => setResendEmailInput(e.target.value)}
                      placeholder="Votre adresse email"
                      className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full bg-white/10 text-white py-3 px-4 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Envoi...
                      </>
                    ) : (
                      "Renvoyer l'email"
                    )}
                  </button>
                </form>
              </div>

              <div className="mt-6">
                <Link
                  to="/login"
                  className="text-green-400 hover:text-green-300 text-sm"
                >
                  Retour à la connexion
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
