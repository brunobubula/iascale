import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function DynamicBackground({ pageName }) {
  const { data: configs = [] } = useQuery({
    queryKey: ['backgroundConfigs', pageName],
    queryFn: () => base44.entities.SiteBackgroundConfig.list(),
    initialData: [],
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  const config = configs.find(c => c.page_name === pageName && c.is_active);

  if (!config) {
    // Default background
    return (
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/c1919ca9a_5072609.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.09,
            animation: 'slowMove 60s ease-in-out infinite alternate'
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690c0c0bc7d291a071fd4ad2/57f18d4cb_Art-ScaleCriptoiA-LOGO6mini.png"
            alt="Scale Logo"
            className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] opacity-[0.93]"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/70" />

        <style jsx>{`
          @keyframes slowMove {
            0% { transform: scale(1) translateX(0) translateY(0); }
            25% { transform: scale(1.08) translateX(-30px) translateY(-15px); }
            50% { transform: scale(1.05) translateX(-20px) translateY(-30px); }
            75% { transform: scale(1.08) translateX(-15px) translateY(-20px); }
            100% { transform: scale(1) translateX(0) translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Base Layer */}
      {config.background_type === "solid" && (
        <div className="absolute inset-0" style={{ backgroundColor: config.solid_color }} />
      )}

      {config.background_type === "gradient" && (
        <div 
          className="absolute inset-0" 
          style={{ 
            background: `linear-gradient(to bottom right, ${config.gradient_from}, ${config.gradient_via}, ${config.gradient_to})` 
          }} 
        />
      )}

      {config.background_type === "image" && config.background_url && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${config.background_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: config.background_opacity,
            animation: config.enable_animation ? `slowMove ${config.animation_duration}s ease-in-out infinite alternate` : 'none'
          }}
        />
      )}

      {config.background_type === "video" && config.background_url && (
        <video
          src={config.background_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: config.background_opacity }}
        />
      )}

      {/* Logo Layer */}
      {config.logo_url && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src={config.logo_url}
            alt="Logo"
            className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]"
            style={{
              width: `${config.logo_size}px`,
              height: `${config.logo_size}px`,
              opacity: config.logo_opacity,
              filter: 'brightness(0) invert(1)'
            }}
          />
        </div>
      )}

      {/* Overlay Layer */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-950/70"
        style={{ opacity: config.overlay_opacity }}
      />

      <style jsx>{`
        @keyframes slowMove {
          0% { transform: scale(1) translateX(0) translateY(0); }
          25% { transform: scale(1.08) translateX(-30px) translateY(-15px); }
          50% { transform: scale(1.05) translateX(-20px) translateY(-30px); }
          75% { transform: scale(1.08) translateX(-15px) translateY(-20px); }
          100% { transform: scale(1) translateX(0) translateY(0); }
        }
      `}</style>
    </div>
  );
}