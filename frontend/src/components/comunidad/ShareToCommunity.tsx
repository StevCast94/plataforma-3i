import { Megaphone } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/shared/Toast';

interface ShareToCommunityProps {
  /** Nombre de la propiedad/producto. */
  title: string;
  /** Ruta interna (hash) del recurso, ej. "/tienda/membresia". */
  path: string;
  image?: string | null;
  description?: string;
}

/** Botón "Compartir en la comunidad" → crea un post pre-armado. */
export function ShareToCommunity({ title, path, image, description }: ShareToCommunityProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sharing, setSharing] = useState(false);

  async function share() {
    if (!isAuthenticated) {
      toast('Inicia sesión como miembro para compartir', 'info');
      return;
    }
    setSharing(true);
    const url = `${window.location.origin}/#${path}`;
    try {
      await api.post('/community/posts', {
        content: `¡Miren esta oportunidad en Grupo 3i! 🏡 ${title}${description ? ` — ${description}` : ''}`,
        images: image ? [image] : [],
        linkUrl: url,
        linkPreview: { title, description, image },
      });
      toast('¡Compartido en la comunidad!', 'success');
      navigate('/comunidad');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSharing(false);
    }
  }

  return (
    <Button variant="outline" onClick={share} disabled={sharing}>
      <Megaphone className="h-4 w-4" strokeWidth={1.8} />
      {sharing ? 'Compartiendo…' : 'Compartir en la comunidad'}
    </Button>
  );
}
