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

const CHAR_SETS = [
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+-=<>',
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
  'ابتثجحخدذرزسشصضطظعغفقكلمنهوي',
  'अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह',
  'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω',
  '가나다라마바사아자차카타파하갈날달랄말발살알잘찰칼탈팔할',
  'அஆஇஈஉஊஎஏஐஒஓஔகங சஞடணதநபமயரலவழளறனஸ',
  'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя',
  '金属回收循环经济可持续发展技术工程研究创新绿色能源矿物提取冶炼电解精炼',
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

    // Tight matrix columns — true Matrix look
    const COL_W = 14;
    const FONT_SIZE = 14;

    let drops: Drop[] = [];
    let words: FloatingWord[] = [];
    let animId: number;
    let frame = 0;

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      initDrops();
    }

    function initDrops() {
      const cols = Math.floor(canvas!.width / COL_W);
      drops = Array.from({ length: cols }, (_, i) => ({
        x: i * COL_W + 2,
        y: Math.random() * -canvas!.height * 1.5,
        speed: 1.5 + Math.random() * 3.5,   // faster — true matrix
        chars: Array.from({ length: 30 + Math.floor(Math.random() * 20) }, randomChar),
        length: 15 + Math.floor(Math.random() * 25), // longer trails
      }));
    }

    function initWords() {
      words = KEYWORDS.map((text) => ({
        text,
        // Bias words toward screen edges — away from centre card area
        x: Math.random() < 0.5
          ? Math.random() * canvas!.width * 0.22          // left edge zone
          : canvas!.width * 0.78 + Math.random() * canvas!.width * 0.2, // right edge zone
        y: 20 + Math.random() * (canvas!.height - 40),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: 0.13 + Math.random() * 0.12, // softer — less competition with card text
        fontSize: 11 + Math.floor(Math.random() * 6),
      }));
    }

    function draw() {
      frame++;

      // Dark fade — controls trail persistence (lower = longer ghost)
      ctx!.fillStyle = 'rgba(0,0,0,0.075)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      // ── Matrix drops ──
      ctx!.font = `bold ${FONT_SIZE}px monospace`;

      for (const drop of drops) {
        for (let i = 0; i < drop.length; i++) {
          const charY = drop.y - i * FONT_SIZE;
          if (charY < -FONT_SIZE || charY > canvas!.height + FONT_SIZE) continue;

          // Mutate chars at head frequently — classic Matrix glitch
          if (i === 0 && Math.random() < 0.4) {
            drop.chars[0] = randomChar();
          } else if (Math.random() < 0.01) {
            drop.chars[i % drop.chars.length] = randomChar();
          }

          const frac = 1 - i / drop.length;

          if (i === 0) {
            // Brightest white head
            ctx!.fillStyle = `rgba(255,255,255,0.95)`;
          } else if (i === 1) {
            ctx!.fillStyle = `rgba(255,200,200,0.85)`;
          } else if (i < 5) {
            // Rose near-head
            ctx!.fillStyle = `rgba(244,63,94,${0.7 * frac})`;
          } else {
            // Emerald trail fading out
            const alpha = 0.55 * frac;
            ctx!.fillStyle = `rgba(52,211,153,${alpha})`;
          }

          ctx!.fillText(drop.chars[i % drop.chars.length], drop.x, charY);
        }

        drop.y += drop.speed;

        if (drop.y - drop.length * FONT_SIZE > canvas!.height) {
          drop.y = -FONT_SIZE * (5 + Math.random() * 20);
          drop.speed = 1.5 + Math.random() * 3.5;
        }
      }

      // ── Floating keywords ──
      for (const word of words) {
        ctx!.font = `${word.fontSize}px sans-serif`;
        ctx!.fillStyle = `rgba(244,63,94,${word.opacity})`;
        ctx!.fillText(word.text, word.x, word.y);

        word.x += word.vx;
        word.y += word.vy;

        const w = ctx!.measureText(word.text).width;
        if (word.x < 0) { word.x = 0; word.vx = Math.abs(word.vx); }
        if (word.x + w > canvas!.width) { word.x = canvas!.width - w; word.vx = -Math.abs(word.vx); }
        if (word.y < word.fontSize) { word.y = word.fontSize; word.vy = Math.abs(word.vy); }
        if (word.y > canvas!.height) { word.y = canvas!.height; word.vy = -Math.abs(word.vy); }
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
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
