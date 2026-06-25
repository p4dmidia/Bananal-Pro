import React from "react";

interface YouTubePlayerProps {
  url: string;
  title?: string;
}

// Helper para extrair URL caso o produtor cole a tag <iframe> inteira
function extractUrlFromIframe(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.toLowerCase().startsWith("<iframe")) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  return trimmed;
}

// Helpers para extração de IDs de vídeo e validação
function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getVimeoId(url: string): string | null {
  if (!url) return null;
  const vimeoReg = /(?:vimeo)\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
  const vimeoMatch = url.match(vimeoReg);
  return (vimeoMatch && vimeoMatch[3]) ? vimeoMatch[3] : null;
}

function getPandaVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  if (!url.includes("pandavideo.com") && !url.includes("pandavideo.com.br")) {
    return null;
  }
  
  // Captura o UUID do vídeo de parâmetros como ?v=UUID ou &v=UUID
  const vMatch = url.match(/[?&]v=([a-fA-F0-9-]+)/);
  if (vMatch && vMatch[1]) {
    if (url.includes("/embed/")) {
      try {
        const urlObj = new URL(url);
        return `https://${urlObj.host}/embed/?v=${vMatch[1]}`;
      } catch (e) {
        // Ignora erro e usa fallback
      }
    }
    return `https://player.pandavideo.com.br/embed/?v=${vMatch[1]}`;
  }
  
  // Captura o UUID de caminhos como /embed/UUID ou /v/UUID
  const pathMatch = url.match(/\/(embed|v)\/([a-fA-F0-9-]+)/);
  if (pathMatch && pathMatch[2]) {
    return `https://player.pandavideo.com.br/embed/?v=${pathMatch[2]}`;
  }
  
  // Se contiver /embed/, assume que já está no formato correto
  if (url.includes("embed/")) {
    return url;
  }

  return url;
}

function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/') || url.match(/\.(mp4|webm|ogg|mov)($|\?)/i) !== null;
}

export default function YouTubePlayer({ url, title = "Vídeo do treinamento" }: YouTubePlayerProps) {
  const cleanedUrl = extractUrlFromIframe(url);
  const youtubeId = getYoutubeId(cleanedUrl);
  const vimeoId = getVimeoId(cleanedUrl);
  const pandaUrl = getPandaVideoEmbedUrl(cleanedUrl);
  const isDirectVideo = isDirectVideoUrl(cleanedUrl);

  // Função interna para renderizar o player correspondente
  const renderPlayer = () => {
    if (youtubeId) {
      const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&iv_load_policy=3&showinfo=0`;
      return (
        <>
          {/* Overlay do topo: Bloqueia cliques no título, botão compartilhar e assistir mais tarde */}
          <div 
            className="absolute top-0 left-0 right-0 h-[60px] z-10 bg-transparent pointer-events-auto"
            title={title}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Overlay inferior direito: Bloqueia cliques no logo do YouTube e botão "Assistir no YouTube" */}
          <div 
            className="absolute bottom-0 right-0 w-[140px] h-[50px] z-10 bg-transparent pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          />

          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </>
      );
    }

    if (vimeoId) {
      const embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
      return (
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (pandaUrl) {
      return (
        <iframe
          src={pandaUrl}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; gyroscope; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      );
    }

    if (isDirectVideo) {
      return (
        <video
          src={cleanedUrl}
          controls
          controlsList="nodownload"
          disablePictureInPicture
          className="w-full h-full object-cover bg-black select-none"
          title={title}
          onContextMenu={(e) => e.preventDefault()}
        />
      );
    }

    // Fallback padrão se não for YouTube, Vimeo, Panda ou link direto
    return (
      <iframe
        src={cleanedUrl}
        title={title}
        className="w-full h-full border-0"
        allowFullScreen
      />
    );
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-black group">
      {renderPlayer()}
    </div>
  );
}

