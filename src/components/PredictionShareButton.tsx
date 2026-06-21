import { useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPredictionPick } from '../utils/predictionDisplay';
import type { Prediction } from '../types/domain';

export type PredictionShareMatch = {
  id: string;
  kickoffAt: string;
  stage?: string | null;
  groupCode?: string | null;
  matchday?: number | null;
  stadium?: string | null;
  city?: string | null;
};

export type PredictionShareTeam = {
  name: string;
  shortName: string;
  fifaRank?: number | null;
};

type PredictionShareButtonProps = {
  prediction: Prediction;
  match: PredictionShareMatch;
  homeTeam: PredictionShareTeam;
  awayTeam: PredictionShareTeam;
  playerName?: string | null;
  points?: number | null;
  variant?: 'primary' | 'secondary';
};

function formatShareDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function drawWrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth) {
      line = nextLine;
      return;
    }

    if (line) lines.push(line);
    line = word;
  });

  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((nextLine, index) => {
    context.fillText(index === maxLines - 1 && lines.length > maxLines ? `${nextLine}...` : nextLine, x, y + index * lineHeight);
  });
}

function drawPanel(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fillStyle: string, strokeStyle = '#111827') {
  context.fillStyle = fillStyle;
  context.fillRect(x, y, width, height);
  context.strokeStyle = strokeStyle;
  context.lineWidth = 8;
  context.strokeRect(x, y, width, height);
}

function drawTeam(context: CanvasRenderingContext2D, team: PredictionShareTeam, x: number, align: CanvasTextAlign) {
  context.textAlign = align;
  context.fillStyle = '#111827';
  context.font = '900 88px Arial Black, Impact, sans-serif';
  context.fillText(team.shortName, x, 400);
  context.font = '800 24px Arial, sans-serif';
  context.fillStyle = '#4b5563';
  drawWrappedText(context, team.name.toUpperCase(), x, 438, 300, 30, 2);
  context.font = '900 22px Arial, sans-serif';
  context.fillStyle = '#111827';
  context.fillText(`FIFA #${team.fifaRank ?? '—'}`, x, 510);
}

async function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create prediction card image.'));
    }, 'image/png');
  });
}

async function createPredictionShareBlob({ prediction, match, homeTeam, awayTeam, playerName, points }: Omit<PredictionShareButtonProps, 'variant'>) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available in this browser.');

  context.fillStyle = '#f6f0df';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#111827';
  context.fillRect(42, 42, 1116, 1516);
  context.fillStyle = '#f6f0df';
  context.fillRect(24, 24, 1116, 1516);
  context.strokeStyle = '#111827';
  context.lineWidth = 10;
  context.strokeRect(24, 24, 1116, 1516);

  drawPanel(context, 72, 72, 1056, 170, '#1f6feb');
  context.fillStyle = '#ffffff';
  context.textAlign = 'left';
  context.font = '900 38px Arial Black, Impact, sans-serif';
  context.fillText('PREDICT 2026', 116, 142);
  context.font = '900 24px Arial, sans-serif';
  context.fillText('MY WORLD CUP PREDICTION SLIP', 116, 190);
  context.textAlign = 'right';
  context.font = '900 28px Arial, sans-serif';
  context.fillText(playerName || 'GOAL GURU', 1084, 154);

  drawPanel(context, 72, 286, 1056, 330, '#ffffff');
  drawTeam(context, homeTeam, 212, 'left');
  drawTeam(context, awayTeam, 988, 'right');

  context.textAlign = 'center';
  context.fillStyle = '#111827';
  context.font = '900 72px Arial Black, Impact, sans-serif';
  context.fillText('VS', 600, 410);
  context.font = '900 24px Arial, sans-serif';
  context.fillStyle = '#4b5563';
  context.fillText(formatShareDate(match.kickoffAt).toUpperCase(), 600, 470);
  context.fillText([match.groupCode ? `GROUP ${match.groupCode}` : match.stage, match.matchday ? `MD ${match.matchday}` : null].filter(Boolean).join(' • ').toUpperCase(), 600, 510);

  drawPanel(context, 72, 660, 1056, 350, '#facc15');
  context.fillStyle = '#111827';
  context.textAlign = 'center';
  context.font = '900 30px Arial, sans-serif';
  context.fillText('MY PICK', 600, 738);
  context.font = '900 64px Arial Black, Impact, sans-serif';
  drawWrappedText(context, formatPredictionPick(prediction, homeTeam.shortName, awayTeam.shortName), 600, 830, 900, 76, 2);
  context.font = '900 26px Arial, sans-serif';
  context.fillText(prediction.predictionType === 'exact_score' ? 'EXACT SCORE PREDICTION' : 'OUTCOME-ONLY PREDICTION', 600, 970);

  drawPanel(context, 72, 1054, 500, 214, '#22c55e');
  drawPanel(context, 628, 1054, 500, 214, '#ffffff');
  context.textAlign = 'center';
  context.fillStyle = '#111827';
  context.font = '900 24px Arial, sans-serif';
  context.fillText('CONFIDENCE', 322, 1138);
  context.font = '900 58px Arial Black, Impact, sans-serif';
  context.fillText(`${prediction.confidence}%`, 322, 1210);
  context.font = '900 24px Arial, sans-serif';
  context.fillText('POTENTIAL / EARNED', 878, 1138);
  context.font = '900 58px Arial Black, Impact, sans-serif';
  context.fillText(points === null || points === undefined ? '— PTS' : `${points} PTS`, 878, 1210);

  drawPanel(context, 72, 1310, 1056, 150, '#111827');
  context.fillStyle = '#ffffff';
  context.textAlign = 'left';
  context.font = '900 26px Arial, sans-serif';
  drawWrappedText(context, `${match.stadium ?? 'World Cup 2026'}${match.city ? ` • ${match.city}` : ''}`.toUpperCase(), 116, 1372, 780, 32, 2);
  context.textAlign = 'right';
  context.font = '900 28px Arial Black, Impact, sans-serif';
  context.fillText('JOIN THE PICKS', 1084, 1394);

  return canvasToBlob(canvas);
}

export default function PredictionShareButton({ prediction, match, homeTeam, awayTeam, playerName, points, variant = 'secondary' }: PredictionShareButtonProps) {
  const { t } = useTranslation();
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    try {
      const blob = await createPredictionShareBlob({ prediction, match, homeTeam, awayTeam, playerName, points });
      const file = new File([blob], `predict-2026-${homeTeam.shortName}-${awayTeam.shortName}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };

      if (navigator.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: 'Predict 2026', text: t('ui.sharePredictionText') });
        return;
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setSharing(false);
    }
  }

  const tone = variant === 'primary'
    ? 'bg-c3 hover:opacity-90 text-main'
    : 'bg-card hover:bg-muted text-main';

  return (
    <button type="button" onClick={() => void handleShare()} disabled={sharing} className={`${tone} font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] flex items-center justify-center gap-2 text-xs disabled:opacity-60`}>
      {navigator.share ? <Share2 size={16} strokeWidth={3} /> : <Download size={16} strokeWidth={3} />}
      {sharing ? t('ui.creatingShareCard') : t('ui.sharePredictionSlip')}
    </button>
  );
}
