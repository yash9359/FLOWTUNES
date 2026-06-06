export interface ExtractedColors {
  accent: string;
  accentRgb: string;
  accentHover: string;
  accentMuted: string;
  glow: string;
  bgGlow: string;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getDefaultColors(): ExtractedColors {
  return {
    accent: '#8b5cf6',
    accentRgb: '139, 92, 246',
    accentHover: '#a78bfa',
    accentMuted: 'rgba(139, 92, 246, 0.15)',
    glow: 'rgba(139, 92, 246, 0.35)',
    bgGlow: 'rgba(139, 92, 246, 0.05)',
  };
}

export function generateColorsFromRgb(r: number, g: number, b: number): ExtractedColors {
  let { h, s, l } = rgbToHsl(r, g, b);
  
  if (s < 0.35) s = Math.min(0.55, s + 0.2);
  
  if (l < 0.45) {
    l = 0.55; 
  } else if (l > 0.80) {
    l = 0.68;
  }
  
  const accentRgbObj = hslToRgb(h, s, l);
  const accent = rgbToHex(accentRgbObj.r, accentRgbObj.g, accentRgbObj.b);
  const accentRgb = `${accentRgbObj.r}, ${accentRgbObj.g}, ${accentRgbObj.b}`;
  
  const hoverL = Math.min(0.85, l + 0.1);
  const hoverRgb = hslToRgb(h, s, hoverL);
  const accentHover = rgbToHex(hoverRgb.r, hoverRgb.g, hoverRgb.b);
  
  const accentMuted = `rgba(${accentRgb}, 0.15)`;
  
  const glow = `rgba(${accentRgb}, 0.35)`;
  
  const bgGlowL = Math.max(0.08, l * 0.18);
  const bgGlowRgbObj = hslToRgb(h, Math.max(0.4, s * 0.9), bgGlowL);
  const bgGlow = `rgba(${bgGlowRgbObj.r}, ${bgGlowRgbObj.g}, ${bgGlowRgbObj.b}, 0.16)`;
  
  return {
    accent,
    accentRgb,
    accentHover,
    accentMuted,
    glow,
    bgGlow
  };
}

export function extractColorsFromImage(imgUrl: string): Promise<ExtractedColors> {
  return new Promise((resolve) => {
    if (!imgUrl) {
      resolve(getDefaultColors());
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(getDefaultColors());
          return;
        }
        
        canvas.width = 12;
        canvas.height = 12;
        ctx.drawImage(img, 0, 0, 12, 12);
        
        const imgData = ctx.getImageData(0, 0, 12, 12).data;
        
        let bestPixel = { r: 139, g: 92, b: 246 };
        let maxScore = -1;
        
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i+1];
          const b = imgData[i+2];
          const a = imgData[i+3];
          
          if (a < 200) continue;
          
          sumR += r;
          sumG += g;
          sumB += b;
          count++;
          
          const { h, s, l } = rgbToHsl(r, g, b);
          
          if (l > 0.15 && l < 0.85 && s > 0.15) {
            const score = s * (1 - Math.abs(l - 0.55) * 1.5);
            if (score > maxScore) {
              maxScore = score;
              bestPixel = { r, g, b };
            }
          }
        }
        
        let finalRgb = bestPixel;
        if (maxScore < 0.05 && count > 0) {
          finalRgb = {
            r: Math.round(sumR / count),
            g: Math.round(sumG / count),
            b: Math.round(sumB / count),
          };
        }
        
        resolve(generateColorsFromRgb(finalRgb.r, finalRgb.g, finalRgb.b));
      } catch (err) {
        console.warn('[Vibe] Canvas extraction error:', err);
        resolve(getDefaultColors());
      }
    };
    
    img.onerror = () => {
      console.warn('[Vibe] Error loading image for extraction:', imgUrl);
      resolve(getDefaultColors());
    };
    
    img.src = imgUrl;
  });
}
