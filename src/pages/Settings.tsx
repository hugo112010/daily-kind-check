import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { useEmergencyContacts, EmergencyContact } from '@/hooks/useEmergencyContacts';
import { useToast } from '@/hooks/use-toast';
import { Globe, Trash2, Plus, Star, Edit2, X, Check } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import BottomNav from '@/components/layout/BottomNav';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { profile, updateProfile } = useProfile();
  const { contacts, addContact, updateContact, deleteContact, loading: contactsLoading } = useEmergencyContacts();
  const { toast } = useToast();

  const [intervalHours, setIntervalHours] = useState(profile?.checkin_interval_hours || 24);
  const [saving, setSaving] = useState(false);

  // New contact form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Edit contact
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  React.useEffect(() => {
    if (profile) {
      setIntervalHours(profile.checkin_interval_hours);
    }
  }, [profile]);

  const handleSaveInterval = async () => {
    setSaving(true);
    try {
      const { error } = await updateProfile({ checkin_interval_hours: intervalHours });
      if (error) throw error;
      toast({ title: t('settings.saved') });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || !newContactEmail.trim()) return;

    try {
      const { error } = await addContact(newContactName.trim(), newContactEmail.trim());
      if (error) throw error;
      
      setNewContactName('');
      setNewContactEmail('');
      setShowAddForm(false);
      toast({ title: t('settings.saved') });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact.id);
    setEditName(contact.name);
    setEditEmail(contact.email);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const { error } = await updateContact(id, { name: editName.trim(), email: editEmail.trim() });
      if (error) throw error;
      
      setEditingContact(null);
      toast({ title: t('settings.saved') });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (contacts.length <= 1) {
      toast({
        title: t('common.error'),
        description: t('settings.cannot_delete_last'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await deleteContact(id);
      if (error) throw error;
      toast({ title: t('settings.saved') });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  return (
    <PageContainer>
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
        {t('settings.title')}
      </h1>

      {/* Language */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Globe className="h-6 w-6" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant={language === 'fr' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setLanguage('fr')}
              className="flex-1 h-14 text-lg"
            >
              Français
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setLanguage('en')}
              className="flex-1 h-14 text-lg"
            >
              English
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Interval */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.interval')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={1}
              max={168}
              value={intervalHours}
              onChange={(e) => setIntervalHours(parseInt(e.target.value) || 24)}
              className="h-14 text-lg flex-1 focus-accessible"
            />
            <span className="text-lg text-muted-foreground">{t('settings.interval_hours')}</span>
          </div>
          <Button
            onClick={handleSaveInterval}
            disabled={saving || intervalHours === profile?.checkin_interval_hours}
            size="lg"
            className="w-full h-14 text-lg"
          >
            {saving ? t('common.loading') : t('common.save')}
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle className="text-xl">{t('settings.contacts')}</CardTitle>
          <p className="text-muted-foreground">{t('settings.contacts_help')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactsLoading ? (
            <p className="text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <>
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 bg-muted/50 rounded-xl border-2 border-border"
                >
                  {editingContact === contact.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder={t('onboarding.contact_name')}
                        className="h-12 text-lg"
                      />
                      <Input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder={t('onboarding.contact_email')}
                        className="h-12 text-lg"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="lg"
                          onClick={() => handleSaveEdit(contact.id)}
                          className="flex-1 h-12"
                        >
                          <Check className="h-5 w-5 mr-2" />
                          {t('common.save')}
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setEditingContact(null)}
                          className="h-12"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {contact.is_primary && (
                          <Star className="h-5 w-5 text-warning fill-warning" />
                        )}
                        <div>
                          <p className="font-semibold text-lg">{contact.name}</p>
                          <p className="text-muted-foreground">{contact.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditContact(contact)}
                          className="p-3 hover:bg-background rounded-lg transition-colors focus-accessible"
                        >
                          <Edit2 className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-3 hover:bg-destructive/10 rounded-lg transition-colors focus-accessible"
                          disabled={contacts.length <= 1}
                        >
                          <Trash2 className={`h-5 w-5 ${contacts.length <= 1 ? 'text-muted' : 'text-destructive'}`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Contact Form */}
              {showAddForm ? (
                <div className="p-4 bg-muted/50 rounded-xl border-2 border-dashed border-primary space-y-3">
                  <Input
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder={t('onboarding.contact_name')}
                    className="h-12 text-lg"
                  />
                  <Input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder={t('onboarding.contact_email')}
                    className="h-12 text-lg"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      onClick={handleAddContact}
                      className="flex-1 h-12"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      {t('common.add')}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewContactName('');
                        setNewContactEmail('');
                      }}
                      className="h-12"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowAddForm(true)}
                  className="w-full h-14 text-lg border-dashed border-2"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {t('settings.add_contact')}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <BottomNav />
    </PageContainer>
  );
};

export default Settings;
