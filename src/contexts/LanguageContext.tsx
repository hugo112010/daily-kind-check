import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en';

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
  };
}

const translations: Translations = {
  // Common
  'app.name': { fr: 'Je Vais Bien', en: 'I Am OK' },
  'common.loading': { fr: 'Chargement...', en: 'Loading...' },
  'common.save': { fr: 'Enregistrer', en: 'Save' },
  'common.cancel': { fr: 'Annuler', en: 'Cancel' },
  'common.delete': { fr: 'Supprimer', en: 'Delete' },
  'common.edit': { fr: 'Modifier', en: 'Edit' },
  'common.add': { fr: 'Ajouter', en: 'Add' },
  'common.back': { fr: 'Retour', en: 'Back' },
  'common.error': { fr: 'Une erreur est survenue', en: 'An error occurred' },
  
  // Auth
  'auth.login': { fr: 'Connexion', en: 'Login' },
  'auth.signup': { fr: 'Créer un compte', en: 'Create account' },
  'auth.logout': { fr: 'Déconnexion', en: 'Logout' },
  'auth.email': { fr: 'Adresse email', en: 'Email address' },
  'auth.password': { fr: 'Mot de passe', en: 'Password' },
  'auth.no_account': { fr: "Pas encore de compte ?", en: "Don't have an account?" },
  'auth.have_account': { fr: 'Déjà un compte ?', en: 'Already have an account?' },
  'auth.login_error': { fr: 'Email ou mot de passe incorrect', en: 'Invalid email or password' },
  'auth.signup_error': { fr: "Erreur lors de la création du compte", en: 'Error creating account' },
  'auth.password_min': { fr: 'Le mot de passe doit contenir au moins 6 caractères', en: 'Password must be at least 6 characters' },
  
  // Onboarding
  'onboarding.title': { fr: 'Bienvenue !', en: 'Welcome!' },
  'onboarding.subtitle': { fr: 'Configurons votre sécurité en quelques étapes simples.', en: 'Let\'s set up your safety in a few simple steps.' },
  'onboarding.step1.title': { fr: 'Check-in quotidien', en: 'Daily check-in' },
  'onboarding.step1.desc': { fr: 'Confirmez chaque jour que vous allez bien en appuyant sur un simple bouton.', en: 'Confirm each day that you are OK by pressing a simple button.' },
  'onboarding.step2.title': { fr: 'Alerte automatique', en: 'Automatic alert' },
  'onboarding.step2.desc': { fr: 'Si vous oubliez de faire votre check-in, vos proches seront alertés par email.', en: 'If you forget to check in, your loved ones will be alerted by email.' },
  'onboarding.step3.title': { fr: 'Simple et sûr', en: 'Simple and safe' },
  'onboarding.step3.desc': { fr: 'Pas de données inutiles collectées. Votre vie privée est respectée.', en: 'No unnecessary data collected. Your privacy is respected.' },
  'onboarding.your_name': { fr: 'Votre prénom', en: 'Your first name' },
  'onboarding.your_name_placeholder': { fr: 'ex: Marie', en: 'e.g. Mary' },
  'onboarding.contact_name': { fr: 'Nom de votre contact d\'urgence', en: 'Emergency contact name' },
  'onboarding.contact_name_placeholder': { fr: 'ex: Jean (mon fils)', en: 'e.g. John (my son)' },
  'onboarding.contact_email': { fr: 'Email de votre contact', en: 'Contact email' },
  'onboarding.contact_email_placeholder': { fr: 'ex: jean@email.com', en: 'e.g. john@email.com' },
  'onboarding.interval': { fr: 'Délai de check-in (heures)', en: 'Check-in interval (hours)' },
  'onboarding.interval_help': { fr: 'Nous alerterons vos proches si vous n\'avez pas fait de check-in après ce délai.', en: 'We will alert your loved ones if you haven\'t checked in after this time.' },
  'onboarding.start': { fr: 'Commencer', en: 'Start' },
  
  // Dashboard
  'dashboard.greeting': { fr: 'Bonjour', en: 'Hello' },
  'dashboard.last_checkin': { fr: 'Dernier check-in', en: 'Last check-in' },
  'dashboard.next_deadline': { fr: 'Prochain délai', en: 'Next deadline' },
  'dashboard.checkin_button': { fr: 'Je vais bien ✓', en: 'I am OK ✓' },
  'dashboard.checkin_success': { fr: 'Check-in enregistré !', en: 'Check-in recorded!' },
  'dashboard.status_ok': { fr: 'Tout va bien', en: 'All is well' },
  'dashboard.status_soon': { fr: 'Check-in bientôt nécessaire', en: 'Check-in needed soon' },
  'dashboard.status_overdue': { fr: 'Check-in en retard', en: 'Check-in overdue' },
  'dashboard.never': { fr: 'Jamais', en: 'Never' },
  'dashboard.hours_left': { fr: 'heures restantes', en: 'hours left' },
  'dashboard.minutes_left': { fr: 'minutes restantes', en: 'minutes left' },
  
  // History
  'history.title': { fr: 'Historique', en: 'History' },
  'history.empty': { fr: 'Aucun check-in enregistré', en: 'No check-ins recorded' },
  'history.today': { fr: 'Aujourd\'hui', en: 'Today' },
  'history.yesterday': { fr: 'Hier', en: 'Yesterday' },
  
  // Settings
  'settings.title': { fr: 'Paramètres', en: 'Settings' },
  'settings.interval': { fr: 'Délai de check-in', en: 'Check-in interval' },
  'settings.interval_hours': { fr: 'heures', en: 'hours' },
  'settings.contacts': { fr: 'Contacts d\'urgence', en: 'Emergency contacts' },
  'settings.contacts_help': { fr: 'Ces personnes recevront un email si vous ne faites pas votre check-in.', en: 'These people will receive an email if you don\'t check in.' },
  'settings.add_contact': { fr: 'Ajouter un contact', en: 'Add a contact' },
  'settings.primary_contact': { fr: 'Contact principal', en: 'Primary contact' },
  'settings.cannot_delete_last': { fr: 'Vous devez avoir au moins un contact d\'urgence', en: 'You must have at least one emergency contact' },
  'settings.language': { fr: 'Langue', en: 'Language' },
  'settings.saved': { fr: 'Paramètres enregistrés', en: 'Settings saved' },
  
  // Navigation
  'nav.dashboard': { fr: 'Accueil', en: 'Home' },
  'nav.history': { fr: 'Historique', en: 'History' },
  'nav.settings': { fr: 'Paramètres', en: 'Settings' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    const stored = localStorage.getItem('preferred_language') as Language;
    if (stored && (stored === 'fr' || stored === 'en')) {
      setLanguage(stored);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferred_language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
