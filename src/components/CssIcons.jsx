import React from 'react';

export function CssStar({ className = '', filled = true, size = 14 }) {
  return (
    <span
      aria-hidden="true"
      className={`css-star ${filled ? 'opacity-100' : 'opacity-25'} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function CssSparkle({ className = '', size = 14 }) {
  return (
    <span
      aria-hidden="true"
      className={`css-sparkle ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function CssLock({ className = '', open = false }) {
  return <span aria-hidden="true" className={`css-lock ${open ? 'opacity-70' : ''} ${className}`} />;
}

export function CssCheck({ className = '' }) {
  return <span aria-hidden="true" className={`css-check ${className}`} />;
}

export function CssCrown({ className = '' }) {
  return <span aria-hidden="true" className={`css-crown ${className}`} />;
}

export function CssPin({ className = '' }) {
  return <span aria-hidden="true" className={`css-pin ${className}`} />;
}

export function CssClock({ className = '' }) {
  return <span aria-hidden="true" className={`css-clock ${className}`} />;
}

export function CssPhone({ className = '' }) {
  return <span aria-hidden="true" className={`css-phone ${className}`} />;
}

export function CssCalendar({ className = '' }) {
  return <span aria-hidden="true" className={`css-calendar ${className}`} />;
}

export function CssCopy({ className = '' }) {
  return <span aria-hidden="true" className={`css-copy ${className}`} />;
}

/**
 * Circular Instagram-Consistent Brand Logo (Black Glossy + Royal Gold + Bridal Red)
 */
export function FusionLogoMark({ size = 44 }) {
  const [imgOk, setImgOk] = React.useState(true);
  return (
    <div
      className="rounded-full bg-[#121212] border-2 border-[#D4AF37] p-0.5 flex items-center justify-center shadow-[0_0_18px_rgba(212,175,55,0.4)] shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      {imgOk ? (
        <img
          src="/images/logo.jpg"
          alt="FUSION - The Magical Mirror"
          onError={() => setImgOk(false)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div className="w-full h-full rounded-full border border-[#B01E2E] bg-gradient-to-br from-[#121212] via-[#121212] to-[#2A080D] flex flex-col items-center justify-center">
          <span className="font-display font-bold text-[#D4AF37] leading-none" style={{ fontSize: size * 0.42 }}>
            F
          </span>
        </div>
      )}
    </div>
  );
}

const VARIANT_IMAGES = {
  'red-bride': '/images/bride-red.jpg',
  'pastel-bride': '/images/bride-pastel.jpg',
  engagement: '/images/engagement.jpg',
  groom: '/images/groom.jpg',
};

/**
 * Luxury Editorial Bridal / Groom Mirror Composition
 * Uses real @fusionsaloon16 photos when present in /public/images/,
 * otherwise renders an ornate Rajasthani Jharokha, Zari Mandala, & Shaded Bridal Lehenga + Jewellery showcase.
 */
export function MirrorLookVisual({
  variant = 'red-bride',
  jewellery = 'Kundan',
  makeup = 'HD',
  sparkleBurstKey = 0,
  customImageSrc = null,
}) {
  const [imgOk, setImgOk] = React.useState(true);
  const imgSrc = customImageSrc || VARIANT_IMAGES[variant];

  React.useEffect(() => {
    setImgOk(true);
  }, [imgSrc]);

  const paletteMap = {
    'red-bride': {
      bg: 'radial-gradient(circle at 50% 28%, #B01E2E 0%, #4D0912 58%, #121212 100%)',
      drape: 'linear-gradient(160deg, #D92638 0%, #B01E2E 48%, #4F0911 100%)',
      dupatta: 'linear-gradient(180deg, rgba(212,175,55,0.28) 0%, rgba(176,30,46,0.18) 100%)',
      glow: 'rgba(245, 224, 142, 0.35)',
      tag: 'BRIDAL RED & GOLD',
      subtitle: 'Crimson Zardosi · Winged Kohl · Bold Red Lip',
    },
    'pastel-bride': {
      bg: 'radial-gradient(circle at 50% 28%, #9B4D61 0%, #3E1823 62%, #121212 100%)',
      drape: 'linear-gradient(160deg, #FADADD 0%, #E796A8 50%, #9E4E62 100%)',
      dupatta: 'linear-gradient(180deg, rgba(250,218,221,0.35) 0%, rgba(212,175,55,0.12) 100%)',
      glow: 'rgba(250, 218, 221, 0.4)',
      tag: 'SOFT NAIL PINK',
      subtitle: 'Dewy Airbrush · Rose Glow · Polki Shine',
    },
    engagement: {
      bg: 'radial-gradient(circle at 50% 28%, #6D2645 0%, #2C0E1E 62%, #121212 100%)',
      drape: 'linear-gradient(160deg, #F3C4D0 0%, #B85272 52%, #591630 100%)',
      dupatta: 'linear-gradient(180deg, rgba(212,175,55,0.24) 0%, transparent 100%)',
      glow: 'rgba(212, 175, 55, 0.35)',
      tag: 'SHIMMER COCKTAIL',
      subtitle: 'Sculpted Glass Skin · Champagne Shimmer Lid',
    },
    groom: {
      bg: 'radial-gradient(circle at 50% 28%, #362B24 0%, #191513 62%, #121212 100%)',
      drape: 'linear-gradient(160deg, #FFF8F0 0%, #DFCEB2 52%, #A68D63 100%)',
      dupatta: 'linear-gradient(180deg, rgba(212,175,55,0.2) 0%, transparent 100%)',
      glow: 'rgba(212, 175, 55, 0.3)',
      tag: 'ROYAL GROOM',
      subtitle: 'Matte Camera Finish · Safa & Beard Sculpt',
    },
  };

  const p = paletteMap[variant] || paletteMap['red-bride'];
  const isGroom = variant === 'groom';
  const jewColor =
    jewellery === 'Polki' ? '#FFF8F0' : jewellery === 'Gold' ? '#D4AF37' : '#F5E08E';

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center transition-all duration-700"
      style={{ background: p.bg }}
    >
      {/* Centered Arch-Safe Badge Bar (Never clipped by rounded-t arch!) */}
      <div className="absolute top-9 inset-x-4 flex flex-col items-center gap-1 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121212]/75 backdrop-blur-md border border-[#D4AF37]/60 text-[9px] tracking-[0.18em] uppercase text-[#F5E08E]">
          <span>{p.tag}</span>
          <span className="text-[#D4AF37]">·</span>
          <span>{makeup} FINISH</span>
        </div>
      </div>

      {/* Sparkle burst on jewellery change */}
      {sparkleBurstKey > 0 && (
        <div key={sparkleBurstKey} className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <span className="css-sparkle text-[#F5E08E] sparkle-burst absolute top-16 left-12" style={{ width: 18, height: 18 }} />
          <span className="css-sparkle text-[#FFF8F0] sparkle-burst absolute top-24 right-12" style={{ width: 14, height: 14 }} />
          <span className="css-sparkle text-[#D4AF37] sparkle-burst absolute bottom-28 left-14" style={{ width: 16, height: 16 }} />
          <span className="css-sparkle text-[#F5E08E] sparkle-burst absolute bottom-24 right-14" style={{ width: 20, height: 20 }} />
        </div>
      )}

      {imgOk && imgSrc ? (
        <img
          src={imgSrc}
          alt={`${p.tag} ${makeup}`}
          onError={() => setImgOk(false)}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        /* Editorial Zari Mandala & Royal Bridal Couture Visual */
        <div className="relative w-full h-full flex flex-col items-center justify-center pb-14">
          {/* Studio Spotlight */}
          <div
            className="absolute w-52 h-52 rounded-full blur-2xl"
            style={{ background: p.glow }}
          />

          {/* Ornate Rajasthani Mandala Halo */}
          <div className="relative w-44 h-44 rounded-full border border-[#D4AF37]/45 flex items-center justify-center shadow-[0_0_35px_rgba(212,175,55,0.2)]">
            <div className="w-36 h-36 rounded-full border border-dashed border-[#F5E08E]/50 flex items-center justify-center">
              <div
                className="w-28 h-28 rounded-full border-2 border-[#D4AF37]/70 flex flex-col items-center justify-center shadow-inner p-2 text-center"
                style={{ background: p.drape }}
              >
                {/* Maang Tikka / Kalgi Jewel */}
                <div
                  className="w-3 h-3 rounded-full mb-1.5 shadow-md"
                  style={{ backgroundColor: jewColor, boxShadow: `0 0 12px ${jewColor}` }}
                />
                {/* Royal Monogram / Couture Crest */}
                <span className="font-display text-xl font-bold tracking-widest text-[#FFF8F0] drop-shadow">
                  {isGroom ? 'GROOM' : 'BRIDE'}
                </span>
                {/* Layered Kundan Choker Arc */}
                <div
                  className="mt-1.5 w-14 h-4 rounded-b-full border-b-[3px] border-x border-dotted"
                  style={{ borderColor: jewColor }}
                />
              </div>
            </div>
          </div>

          {/* Jewellery & Finish Caption */}
          <div className="mt-3 px-4 text-center z-10">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">
              {jewellery} Jewellery Pairing
            </div>
            <div className="text-[11px] text-[#FFF8F0]/80 mt-0.5">{p.subtitle}</div>
          </div>
        </div>
      )}

      <div className="mirror-sweep" />
    </div>
  );
}
