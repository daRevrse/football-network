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
  Loader2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Ruler,
  Euro,
  Clock,
  CheckCircle2,
  Star,
  Users,
  Calendar,
  TrendingUp,
  Shield
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

// Input Field Component - défini EN DEHORS du composant principal pour éviter les re-créations
const InputField = React.memo(({ icon: Icon, name, type = "text", placeholder, label, error, registerFn, ...props }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
      <input
        type={type}
        {...registerFn(name)}
        className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-white/10 transition-all ${
          error ? "border-red-500/50" : "border-white/10"
        }`}
        placeholder={placeholder}
        {...props}
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

// Select Field Component - défini EN DEHORS du composant principal
const SelectField = React.memo(({ icon: Icon, name, label, options, error, registerFn }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors pointer-events-none" />
      <select
        {...registerFn(name)}
        className={`w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 focus:bg-white/10 transition-all appearance-none ${
          error ? "border-red-500/50" : "border-white/10"
        }`}
      >
        <option value="" className="bg-gray-900">Sélectionner...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    {error && (
      <p className="text-red-400 text-sm mt-1.5 flex items-center">
        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
        {error.message}
      </p>
    )}
  </div>
));

const schema = yup.object({
  // Informations personnelles
  firstName: yup.string().min(2, "Minimum 2 caractères").required("Prénom requis"),
  lastName: yup.string().min(2, "Minimum 2 caractères").required("Nom requis"),
  email: yup.string().email("Email invalide").required("Email requis"),
  phone: yup.string().required("Téléphone requis"),
  password: yup.string().min(6, "Minimum 6 caractères").required("Mot de passe requis"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Les mots de passe ne correspondent pas")
    .required("Confirmation requise"),

  // Informations du terrain
  venueName: yup.string().min(3, "Minimum 3 caractères").required("Nom du terrain requis"),
  venueAddress: yup.string().required("Adresse requise"),
  venueCity: yup.string().required("Ville requise"),
  fieldType: yup.string().required("Type de terrain requis"),
  fieldSurface: yup.string().required("Surface requise"),
  fieldSize: yup.string().required("Taille requise"),

  // Conditions
  acceptTerms: yup.boolean().oneOf([true], "Vous devez accepter les conditions"),
});

const VenueOwnerSignup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fieldType: "",
      fieldSurface: "",
      fieldSize: "",
    },
  });

  const watchedFields = watch();

  const validateStep = async (step) => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ["firstName", "lastName", "email", "phone", "password", "confirmPassword"];
    } else if (step === 2) {
      fieldsToValidate = ["venueName", "venueAddress", "venueCity", "fieldType", "fieldSurface", "fieldSize"];
    }
    const isValid = await trigger(fieldsToValidate);
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        userType: "venue_owner",
        locationCity: data.venueCity,
      };

      const result = await signup(payload);

      if (result.success && result.user) {
        try {
          // Informations du terrain pour création automatique via Firebase
          await addDoc(collection(db, "locations"), {
             name: data.venueName,
             address: data.venueAddress,
             city: data.venueCity,
             owner_id: result.user.uid,
             field_type: data.fieldType,
             field_surface: data.fieldSurface,
             field_size: data.fieldSize,
             latitude: 0, // Fallback requires default
             longitude: 0, // Fallback requires default
             created_at: serverTimestamp(),
             updated_at: serverTimestamp()
          });

          // Toast succés déjà géré dans AuthContext
          navigate("/login");
        } catch (venueError) {
          console.error("Erreur création terrain:", venueError);
          toast.error("Compte créé mais erreur lors de l'enregistrement du terrain.");
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Erreur inattendue de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  // Composant Step Indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              currentStep >= step
                ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                : "bg-white/10 text-gray-500"
            }`}
          >
            {currentStep > step ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              step
            )}
          </div>
          {index < 2 && (
            <div
              className={`w-16 h-1 mx-2 rounded-full transition-all ${
                currentStep > step ? "bg-green-500" : "bg-white/10"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Partie gauche - Features */}
      <div className="hidden lg:flex lg:w-2/5 relative">
        <img
          src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2670&auto=format&fit=crop"
          alt="Football Field"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-black/80 to-black/95"></div>

        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <div>
            <Link to="/login" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la connexion</span>
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">FootConnect</span>
                <span className="text-emerald-400 font-medium ml-2">Pro</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white leading-tight mb-3">
                Gérez votre terrain<br />
                <span className="text-emerald-400">comme un pro.</span>
              </h2>
              <p className="text-white/60">
                Rejoignez le réseau et recevez des réservations de milliers de joueurs.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Réservations simplifiées</h4>
                  <p className="text-white/50 text-sm">Gérez vos créneaux et recevez des réservations 24h/24.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Augmentez vos revenus</h4>
                  <p className="text-white/50 text-sm">Maximisez l'occupation de votre terrain.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Communauté active</h4>
                  <p className="text-white/50 text-sm">Accédez à des milliers de joueurs dans votre région.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-white/40 text-sm">
            <Shield className="w-4 h-4" />
            <span>Inscription gratuite - Sans engagement</span>
          </div>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-3/5 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6 py-12">
        <div className="w-full max-w-xl">
          {/* Mobile header */}
          <div className="lg:hidden mb-8">
            <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">FootConnect</span>
                <span className="text-emerald-400 font-medium ml-1">Pro</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              {currentStep === 1 && "Créez votre compte"}
              {currentStep === 2 && "Décrivez votre terrain"}
              {currentStep === 3 && "Finalisez votre inscription"}
            </h1>
            <p className="text-gray-400">
              {currentStep === 1 && "Commençons par vos informations personnelles."}
              {currentStep === 2 && "Renseignez les caractéristiques de votre terrain."}
              {currentStep === 3 && "Vérifiez et confirmez vos informations."}
            </p>
          </div>

          <StepIndicator />

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 lg:p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      icon={User}
                      name="firstName"
                      label="Prénom *"
                      placeholder="Jean"
                      error={errors.firstName}
                      registerFn={register}
                    />
                    <InputField
                      icon={User}
                      name="lastName"
                      label="Nom *"
                      placeholder="Dupont"
                      error={errors.lastName}
                      registerFn={register}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      icon={Mail}
                      name="email"
                      type="email"
                      label="Email professionnel *"
                      placeholder="contact@terrain.fr"
                      error={errors.email}
                      registerFn={register}
                    />
                    <InputField
                      icon={Phone}
                      name="phone"
                      type="tel"
                      label="Téléphone *"
                      placeholder="06 12 34 56 78"
                      error={errors.phone}
                      registerFn={register}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Mot de passe *
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          className={`w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all ${
                            errors.password ? "border-red-500/50" : "border-white/10"
                          }`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
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
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-green-400 transition-colors" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          {...register("confirmPassword")}
                          className={`w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all ${
                            errors.confirmPassword ? "border-red-500/50" : "border-white/10"
                          }`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-400 text-sm mt-1.5">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Venue Info */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <InputField
                    icon={Building2}
                    name="venueName"
                    label="Nom du terrain / complexe *"
                    placeholder="Ex: Stade Municipal de Paris"
                    error={errors.venueName}
                    registerFn={register}
                  />

                  <InputField
                    icon={MapPin}
                    name="venueAddress"
                    label="Adresse complète *"
                    placeholder="123 Rue du Football"
                    error={errors.venueAddress}
                    registerFn={register}
                  />

                  <InputField
                    icon={MapPin}
                    name="venueCity"
                    label="Ville *"
                    placeholder="Paris"
                    error={errors.venueCity}
                    registerFn={register}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <SelectField
                      icon={Building2}
                      name="fieldType"
                      label="Type de terrain *"
                      error={errors.fieldType}
                      registerFn={register}
                      options={[
                        { value: "outdoor", label: "Extérieur" },
                        { value: "indoor", label: "Indoor / Couvert" },
                        { value: "hybrid", label: "Hybride" },
                      ]}
                    />

                    <SelectField
                      icon={Ruler}
                      name="fieldSurface"
                      label="Surface *"
                      error={errors.fieldSurface}
                      registerFn={register}
                      options={[
                        { value: "natural_grass", label: "Gazon naturel" },
                        { value: "synthetic", label: "Synthétique" },
                        { value: "hybrid", label: "Hybride" },
                        { value: "indoor", label: "Parquet / Résine" },
                      ]}
                    />

                    <SelectField
                      icon={Ruler}
                      name="fieldSize"
                      label="Taille *"
                      error={errors.fieldSize}
                      registerFn={register}
                      options={[
                        { value: "5v5", label: "5 contre 5" },
                        { value: "7v7", label: "7 contre 7" },
                        { value: "11v11", label: "11 contre 11" },
                        { value: "futsal", label: "Futsal" },
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <User className="w-4 h-4 text-green-400" />
                      Informations personnelles
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Nom complet</p>
                        <p className="text-white">{watchedFields.firstName} {watchedFields.lastName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="text-white">{watchedFields.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Téléphone</p>
                        <p className="text-white">{watchedFields.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-green-400" />
                      Votre terrain
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="col-span-2">
                        <p className="text-gray-500">Nom</p>
                        <p className="text-white">{watchedFields.venueName}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Adresse</p>
                        <p className="text-white">{watchedFields.venueAddress}, {watchedFields.venueCity}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="text-white capitalize">{watchedFields.fieldType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Taille</p>
                        <p className="text-white uppercase">{watchedFields.fieldSize}</p>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register("acceptTerms")}
                      className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      J'accepte les{" "}
                      <Link to="/terms" className="text-green-400 hover:underline">
                        conditions générales d'utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link to="/privacy" className="text-green-400 hover:underline">
                        politique de confidentialité
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-red-400 text-sm flex items-center">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                      {errors.acceptTerms.message}
                    </p>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-white/5 border border-white/10 text-white py-4 px-4 rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Retour
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-500 text-white py-4 px-4 rounded-xl font-bold hover:from-emerald-500 hover:to-green-400 transition-all shadow-lg shadow-green-600/25 flex items-center justify-center gap-2 group"
                  >
                    Continuer
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-500 text-white py-4 px-4 rounded-xl font-bold hover:from-emerald-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-600/25 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Créer mon compte Pro
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Vous avez déjà un compte ?{" "}
              <Link to="/login" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueOwnerSignup;
