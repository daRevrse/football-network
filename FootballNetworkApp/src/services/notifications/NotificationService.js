export class NotificationService {
  static async initialize() {
    try {
      console.log('Service de notifications initialisé (version simplifiée)');
      // TODO: Ajouter Firebase plus tard
      return true;
    } catch (error) {
      console.error(
        "Erreur lors de l'initialisation des notifications:",
        error,
      );
      return false;
    }
  }

  static async requestPermission() {
    try {
      console.log('Permission notifications demandée');
      return true;
    } catch (error) {
      console.error('Erreur permission notifications:', error);
      return false;
    }
  }

  static async getToken() {
    try {
      return 'dummy_token_for_now';
    } catch (error) {
      console.error('Erreur récupération token FCM:', error);
      return null;
    }
  }
}
