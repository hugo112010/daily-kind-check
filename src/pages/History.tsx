import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCheckins } from '@/hooks/useCheckins';
import { CheckCircle } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import BottomNav from '@/components/layout/BottomNav';

const History: React.FC = () => {
  const { t, language } = useLanguage();
  const { checkins, loading } = useCheckins();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `${t('history.today')}, ${date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (isYesterday) {
      return `${t('history.yesterday')}, ${date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageContainer>
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
        {t('history.title')}
      </h1>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-lg text-muted-foreground">{t('common.loading')}</p>
        </div>
      ) : checkins.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-lg text-muted-foreground">{t('history.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {checkins.map((checkin) => (
            <Card key={checkin.id} className="border-2">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-shrink-0 w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-medium text-lg capitalize">
                    {formatDate(checkin.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BottomNav />
    </PageContainer>
  );
};

export default History;
