// middleware/uploadMiddleware.js - VERSION DEBUG INTENSIVE
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Créer les dossiers d'upload s'ils n'existent pas
const uploadDir = process.env.UPLOAD_PATH || "./uploads";
const createUploadDirs = () => {
  const dirs = [
    uploadDir,
    path.join(uploadDir, "users"),
    path.join(uploadDir, "teams"),
    path.join(uploadDir, "matches"),
    path.join(uploadDir, "posts"),
    path.join(uploadDir, "messages"),
    path.join(uploadDir, "locations"),
    path.join(uploadDir, "temp"),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log("✅ Dossier créé:", dir);
    }
  });
};

createUploadDirs();

// Fonction pour déterminer le dossier de destination basé sur le contexte
const getSubFolder = (context) => {
  console.log("📁 getSubFolder appelée avec context:", context);

  let result;
  switch (context) {
    case "user_profile":
    case "user_cover":
      result = "users";
      break;
    case "team_logo":
    case "team_banner":
      result = "teams";
      break;
    case "match_photo":
      result = "matches";
      break;
    case "post_media":
      result = "posts";
      break;
    case "message_attachment":
      result = "messages";
      break;
    case "location_photo":
      result = "locations";
      break;
    default:
      result = "temp";
  }

  console.log("📁 Résultat:", result);
  return result;
};

// Configuration du stockage avec LOGS EXHAUSTIFS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Déterminer le contexte avec TOUTES les sources possibles
    const contextFromQuery = req.query.upload_context;
    const contextFromHeader = req.headers["x-upload-context"];
    const contextFromBody = req.body ? req.body.upload_context : undefined;

    const context =
      contextFromQuery || contextFromHeader || contextFromBody || "temp";

    // Déterminer le sous-dossier
    const subFolder = getSubFolder(context);

    const destinationPath = path.join(uploadDir, subFolder);

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    } else {
      console.log("✅ Dossier existe déjà");
    }

    cb(null, destinationPath);
  },

  filename: (req, file, cb) => {
    // Générer un nom de fichier unique et sécurisé
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");

    const ext = path.extname(file.originalname);

    const context =
      req.query.upload_context || req.headers["x-upload-context"] || "file";

    const userId = req.user ? req.user.id : "anonymous";

    const filename = `${context}_${userId}_${uniqueSuffix}${ext}`;

    cb(null, filename);
  },
});

// Filtre pour valider les types de fichiers
const fileFilter = (req, file, cb) => {
  console.log("🔍 FILE FILTER - Validation du type:", file.mimetype);

  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const allowedVideoTypes = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/webm",
  ];
  const allowedDocTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const allAllowedTypes = [
    ...allowedImageTypes,
    ...allowedVideoTypes,
    ...allowedDocTypes,
  ];

  if (allAllowedTypes.includes(file.mimetype)) {
    console.log("✅ Type autorisé");
    cb(null, true);
  } else {
    console.log("❌ Type NON autorisé");
    cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
  }
};

// Limites de taille
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  files: 5,
};

// Configuration multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

// Middleware pour un seul fichier
const uploadSingle = (fieldName = "file") => {
  return upload.single(fieldName);
};

// Middleware pour plusieurs fichiers (même champ)
const uploadMultiple = (fieldName = "files", maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Middleware pour plusieurs champs différents
const uploadFields = (fields) => upload.fields(fields);

// Fonction utilitaire pour déterminer le type de fichier
const getFileType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (
    mimetype.startsWith("application/pdf") ||
    mimetype.includes("document") ||
    mimetype.includes("word")
  )
    return "document";
  return "other";
};

// Fonction pour supprimer un fichier physique
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath) {
      return resolve();
    }

    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Erreur lors de la suppression du fichier:", err);
        return reject(err);
      }
      resolve();
    });
  });
};

// Fonction pour obtenir les dimensions d'une image
const getImageDimensions = (filePath) => {
  return new Promise((resolve, reject) => {
    resolve({ width: null, height: null });
  });
};

// Middleware de gestion d'erreurs pour multer
const handleMulterError = (err, req, res, next) => {
  console.log("❌ ERREUR MULTER:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Fichier trop volumineux",
        maxSize: `${limits.fileSize / (1024 * 1024)}MB`,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Trop de fichiers",
        maxFiles: limits.files,
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Champ de fichier inattendu",
      });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err) {
    return res.status(400).json({ error: err.message });
  }

  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleMulterError,
  getFileType,
  deleteFile,
  getImageDimensions,
  uploadDir,
  getSubFolder,
};
