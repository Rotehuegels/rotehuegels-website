'use client';

import { useEffect, useRef } from 'react';

const KEYWORDS = [
  'Hydrometallurgy', 'Circular Economy', 'Battery Recycling', 'Critical Minerals',
  'Sustainability', 'Plant Automation', 'Zinc Recovery', 'Copper Extraction',
  'AutoREX™', 'Zero Discharge', 'EPC Delivery', 'Process Engineering',
  'Electrowinning', 'Leaching', 'Solvent Extraction', 'Flotation',
  'Digital Twin', 'AI Modelling', 'Green Industry', 'Rare Earths',
  'Black Mass', 'NdFeB', 'E-Waste Recovery', 'Waste-to-Value',
  'Carbon Neutral', 'ESG', 'Resource Recovery', 'Critical Metals',
];

// Characters from multiple global scripts
const CHAR_SETS = [
  // Latin + digits + symbols
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&',
  // Japanese Katakana
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
  // Arabic
  'ابتثجحخدذرزسشصضطظعغفقكلمنهوي',
  // Devanagari (Hindi)
  'अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह',
  // Greek
  'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω',
  // Korean Hangul
  '가나다라마바사아자차카타파하갈날달랄말발살알잘찰칼탈팔할',
  // Tamil
  'அஆஇஈஉஊஎஏஐஒஓஔகங சஞடணதநபமயரலவழளறனஸ',
  // Cyrillic
  'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя',
  // Chinese (simplified subset)
  '金属回收循环经济可持续发展技术工程研究创新绿色能源矿物提取',
  // Hebrew
  'אבגדהוזחטיכלמנסעפצקרשת',
];

const ALL_CHARS = CHAR_SETS.join('');

function randomChar() {
  return ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)];
}

interface Drop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  length: number;
  opacity: number;
}

interface FloatingWord {
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  fontSize: number;
}

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COL_W = 18;
    const FONT_SIZE = 13;
    const DROP_SPEED_MIN = 0.3;
    const DROP_SPEED_MAX = 1.2;

    let drops: Drop[] = [];
    let words: FloatingWord[] = [];
    let animId: number;

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      initDrops();
    }

    function initDrops() {
      const cols = Math.floor(canvas!.width / COL_W);
      drops = Array.from({ length: cols }, (_, i) => ({
        x: i * COL_W,
        y: Math.random() * -canvas!.height,
        speed: DROP_SPEED_MIN + Math.random() * (DROP_SPEED_MAX - DROP_SPEED_MIN),
        chars: Array.from({ length: 20 + Math.floor(Math.random() * 20) }, randomChar),
        length: 12 + Math.floor(Math.random() * 20),
        opacity: 0.08 + Math.random() * 0.12,
      }));
    }

    function initWords() {
      words = KEYWORDS.map((text) => ({
        text,
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        opacity: 0.12 + Math.random() * 0.15,
        fontSize: 11 + Math.floor(Math.random() * 8),
      }));
    }

    function draw() {
      // Fade trail
      ctx!.fillStyle = 'rgba(0,0,0,0.06)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      ctx!.font = `${FONT_SIZE}px monospace`;

      // Draw matrix drops
      for (const drop of drops) {
        for (let i = 0; i < drop.length; i++) {
          const charY = drop.y - i * FONT_SIZE;
          if (charY < 0 || charY > canvas!.height) continue;

          // Randomise char occasionally
          if (Math.random() < 0.02) {
            drop.chars[i % drop.chars.length] = randomChar();
          }

          const frac = 1 - i / drop.length;
          // Head = bright rose, trail fades to emerald/green
          if (i === 0) {
            ctx!.fillStyle = `rgba(255,255,255,${drop.opacity * 2.5})`;
          } else if (i < 3) {
            ctx!.fillStyle = `rgba(244,63,94,${drop.opacity * frac * 1.8})`;
          } else {
            ctx!.fillStyle = `rgba(52,211,153,${drop.opacity * frac})`;
          }

          ctx!.fillText(drop.chars[i % drop.chars.length], drop.x, charY);
        }

        drop.y += drop.speed;
        if (drop.y - drop.length * FONT_SIZE > canvas!.height) {
          drop.y = -FONT_SIZE * 5;
          drop.speed = DROP_SPEED_MIN + Math.random() * (DROP_SPEED_MAX - DROP_SPEED_MIN);
          drop.opacity = 0.08 + Math.random() * 0.12;
        }
      }

      // Draw floating keywords
      for (const word of words) {
        ctx!.font = `${word.fontSize}px sans-serif`;
        ctx!.fillStyle = `rgba(244,63,94,${word.opacity})`;
        ctx!.fillText(word.text, word.x, word.y);

        word.x += word.vx;
        word.y += word.vy;

        // Bounce off edges
        const w = ctx!.measureText(word.text).width;
        if (word.x < 0 || word.x + w > canvas!.width) word.vx *= -1;
        if (word.y < word.fontSize || word.y > canvas!.height) word.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    initWords();
    window.addEventListener('resize', resize);
    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity: 1 }}
      aria-hidden="true"
    />
  );
}
