import { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
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
  countryCode?: string | null;
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

type ShareAsset = {
  blob: Blob;
  url: string;
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

function drawPanel(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fillStyle: string, strokeStyle = '#111827', lineWidth = 8) {
  context.fillStyle = fillStyle;
  context.fillRect(x, y, width, height);
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.strokeRect(x, y, width, height);
}

function drawPill(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, fillStyle: string, textStyle = '#111827') {
  context.fillStyle = fillStyle;
  context.fillRect(x, y, width, 54);
  context.strokeStyle = '#111827';
  context.lineWidth = 5;
  context.strokeRect(x, y, width, 54);
  context.fillStyle = textStyle;
  context.textAlign = 'center';
  context.font = '900 22px Arial, sans-serif';
  context.fillText(text.toUpperCase(), x + width / 2, y + 36);
}

function getFlagEmoji(team: PredictionShareTeam) {
  const fifaToIso2: Record<string, string> = {
    ALG: 'DZ', ARG: 'AR', AUS: 'AU', AUT: 'AT', BEL: 'BE', BIH: 'BA', BRA: 'BR', CAN: 'CA', CIV: 'CI', COD: 'CD', COL: 'CO', CPV: 'CV', CRO: 'HR', CUW: 'CW', CZE: 'CZ', ECU: 'EC', EGY: 'EG', ENG: 'GB', ESP: 'ES', FRA: 'FR', GER: 'DE', GHA: 'GH', HAI: 'HT', IRN: 'IR', IRQ: 'IQ', JOR: 'JO', JPN: 'JP', KOR: 'KR', KSA: 'SA', MAR: 'MA', MEX: 'MX', NED: 'NL', NOR: 'NO', NZL: 'NZ', PAN: 'PA', PAR: 'PY', POR: 'PT', QAT: 'QA', RSA: 'ZA', SCO: 'GB', SEN: 'SN', SUI: 'CH', SWE: 'SE', TUN: 'TN', TUR: 'TR', URU: 'UY', USA: 'US', UZB: 'UZ'
  };
  const code = (team.countryCode ?? team.shortName).toUpperCase();
  const isoCode = fifaToIso2[code] ?? code;
  if (!/^[A-Z]{2}$/.test(isoCode)) return '🏳️';
  return String.fromCodePoint(...isoCode.split('').map((char) => 127397 + char.charCodeAt(0)));
}

function drawTeamCard(context: CanvasRenderingContext2D, team: PredictionShareTeam, x: number, y: number, width: number, accent: string) {
  drawPanel(context, x + 14, y + 14, width, 430, '#111827', '#111827', 0);
  drawPanel(context, x, y, width, 430, '#ffffff');
  context.fillStyle = accent;
  context.fillRect(x, y, width, 22);

  context.textAlign = 'center';
  context.font = '900 96px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  context.fillText(getFlagEmoji(team), x + width / 2, y + 128);

  context.fillStyle = '#111827';
  context.font = '900 86px Arial Black, Impact, sans-serif';
  context.fillText(team.shortName, x + width / 2, y + 228);

  context.font = '900 24px Arial, sans-serif';
  context.fillStyle = '#4b5563';
  drawWrappedText(context, team.name.toUpperCase(), x + width / 2, y + 276, width - 70, 30, 2);

  drawPill(context, `FIFA #${team.fifaRank ?? '—'}`, x + 70, y + 342, width - 140, '#f6f0df');
}

function drawDividerPattern(context: CanvasRenderingContext2D) {
  context.strokeStyle = '#111827';
  context.lineWidth = 3;
  for (let x = 66; x < 1130; x += 34) {
    context.beginPath();
    context.moveTo(x, 257);
    context.lineTo(x + 16, 279);
    context.stroke();
  }
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

  const matchMeta = [match.groupCode ? `GROUP ${match.groupCode}` : match.stage, match.matchday ? `MD ${match.matchday}` : null].filter(Boolean).join(' • ');
  const pickText = formatPredictionPick(prediction, homeTeam.shortName, awayTeam.shortName);

  context.fillStyle = '#0f172a';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#1f6feb';
  context.fillRect(0, 0, canvas.width, 520);
  context.fillStyle = '#facc15';
  context.fillRect(0, 520, canvas.width, 28);
  context.fillStyle = '#f6f0df';
  context.fillRect(0, 548, canvas.width, 1052);

  context.fillStyle = 'rgba(255,255,255,0.14)';
  for (let x = -180; x < canvas.width; x += 180) {
    context.fillRect(x, 0, 80, 520);
  }

  drawPanel(context, 42, 42, 1116, 1516, 'transparent', '#111827', 12);
  drawPanel(context, 72, 72, 1056, 154, '#111827', '#111827');
  context.fillStyle = '#ffffff';
  context.textAlign = 'left';
  context.font = '900 44px Arial Black, Impact, sans-serif';
  context.fillText('PREDICT 2026', 116, 142);
  context.font = '900 22px Arial, sans-serif';
  context.fillStyle = '#facc15';
  context.fillText('WORLD CUP PREDICTION SLIP', 116, 190);
  context.textAlign = 'right';
  context.fillStyle = '#ffffff';
  context.font = '900 24px Arial, sans-serif';
  context.fillText((playerName || 'GOAL GURU').toUpperCase(), 1084, 156);
  context.font = '900 18px Arial, sans-serif';
  context.fillStyle = '#93c5fd';
  context.fillText(formatShareDate(match.kickoffAt).toUpperCase(), 1084, 190);

  drawDividerPattern(context);
  drawTeamCard(context, homeTeam, 82, 322, 430, '#22c55e');
  drawTeamCard(context, awayTeam, 688, 322, 430, '#f97316');

  drawPanel(context, 474, 410, 252, 196, '#facc15', '#111827', 8);
  context.textAlign = 'center';
  context.fillStyle = '#111827';
  context.font = '900 76px Arial Black, Impact, sans-serif';
  context.fillText('VS', 600, 500);
  context.font = '900 20px Arial, sans-serif';
  context.fillText(matchMeta.toUpperCase(), 600, 552);

  drawPanel(context, 72, 814, 1056, 312, '#ffffff');
  context.fillStyle = '#111827';
  context.textAlign = 'center';
  context.font = '900 24px Arial, sans-serif';
  context.fillText('MY PICK', 600, 886);
  context.font = '900 66px Arial Black, Impact, sans-serif';
  drawWrappedText(context, pickText, 600, 982, 900, 74, 2);
  drawPill(context, prediction.predictionType === 'exact_score' ? 'Exact Score Prediction' : 'Outcome Prediction', 374, 1046, 452, '#facc15');

  drawPanel(context, 72, 1178, 316, 170, '#22c55e');
  drawPanel(context, 442, 1178, 316, 170, '#ffffff');
  drawPanel(context, 812, 1178, 316, 170, '#facc15');
  context.textAlign = 'center';
  context.fillStyle = '#111827';
  context.font = '900 22px Arial, sans-serif';
  context.fillText('CONFIDENCE', 230, 1240);
  context.fillText('POINTS', 600, 1240);
  context.fillText('MODE', 970, 1240);
  context.font = '900 48px Arial Black, Impact, sans-serif';
  context.fillText(`${prediction.confidence}%`, 230, 1304);
  context.fillText(points === null || points === undefined ? '—' : `${points}`, 600, 1304);
  context.fillText(prediction.isRiskPick ? 'RISK' : 'SAFE', 970, 1304);

  drawPanel(context, 72, 1402, 1056, 98, '#111827', '#111827');
  context.fillStyle = '#ffffff';
  context.textAlign = 'left';
  context.font = '900 22px Arial, sans-serif';
  drawWrappedText(context, `${match.stadium ?? 'World Cup 2026'}${match.city ? ` • ${match.city}` : ''}`.toUpperCase(), 116, 1462, 690, 28, 1);
  context.textAlign = 'right';
  context.fillStyle = '#facc15';
  context.font = '900 28px Arial Black, Impact, sans-serif';
  context.fillText('JOIN THE PICKS', 1084, 1466);

  return canvasToBlob(canvas);
}

export default function PredictionShareButton({ prediction, match, homeTeam, awayTeam, playerName, points, variant = 'secondary' }: PredictionShareButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [shareAsset, setShareAsset] = useState<ShareAsset | null>(null);
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileName = `predict-2026-${homeTeam.shortName}-${awayTeam.shortName}.png`;
  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  useEffect(() => {
    if (!open) return undefined;

    let active = true;
    setCreating(true);
    setError(null);

    createPredictionShareBlob({ prediction, match, homeTeam, awayTeam, playerName, points })
      .then((blob) => {
        if (!active) return;
        setShareAsset((current) => {
          if (current) URL.revokeObjectURL(current.url);
          return { blob, url: URL.createObjectURL(blob) };
        });
      })
      .catch((nextError) => {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : t('ui.sharePreviewError'));
      })
      .finally(() => {
        if (active) setCreating(false);
      });

    return () => {
      active = false;
    };
  }, [awayTeam, fileName, homeTeam, match, open, playerName, points, prediction, t]);

  useEffect(() => () => {
    setShareAsset((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  function closeModal() {
    setOpen(false);
    setError(null);
    setShareAsset((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  function downloadAsset() {
    if (!shareAsset) return;
    const anchor = document.createElement('a');
    anchor.href = shareAsset.url;
    anchor.download = fileName;
    anchor.click();
  }

  async function shareNative() {
    if (!shareAsset) return;

    setSharing(true);
    try {
      const file = new File([shareAsset.blob], fileName, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };

      if (navigator.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: 'Predict 2026', text: t('ui.sharePredictionText') });
        return;
      }

      downloadAsset();
    } finally {
      setSharing(false);
    }
  }

  const tone = variant === 'primary'
    ? 'bg-c3 hover:opacity-90 text-main'
    : 'bg-card hover:bg-muted text-main';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${tone} font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] flex items-center justify-center gap-2 text-xs`}>
        <Share2 size={16} strokeWidth={3} />
        {t('ui.sharePredictionSlip')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-main/70 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="prediction-share-title">
          <div className="w-full max-w-md bg-card border-4 border-main shadow-[8px_8px_0_var(--color-shadow)] max-h-[92vh] overflow-y-auto">
            <div className="bg-main text-inv p-4 flex items-center justify-between gap-4 border-b-4 border-main">
              <div>
                <h2 id="prediction-share-title" className="font-black uppercase tracking-tight text-xl">{t('ui.sharePreviewTitle')}</h2>
                <p className="font-bold text-xs opacity-80 uppercase mt-1">{homeTeam.shortName} vs {awayTeam.shortName}</p>
              </div>
              <button type="button" onClick={closeModal} className="bg-card text-main border-2 border-main p-2 shadow-[2px_2px_0_var(--color-shadow)]" aria-label={t('ui.closeSharePreview')}>
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <div className="p-4 bg-page border-b-4 border-main">
              {creating && <div className="min-h-[420px] flex items-center justify-center bg-card border-2 border-main font-black uppercase text-sm">{t('ui.creatingShareCard')}</div>}
              {!creating && error && <div className="min-h-[240px] flex items-center justify-center bg-c5 border-2 border-main p-4 text-center font-black uppercase text-sm">{error}</div>}
              {!creating && !error && shareAsset && <img src={shareAsset.url} alt={t('ui.predictionSharePreviewAlt')} className="w-full bg-card border-2 border-main shadow-[4px_4px_0_var(--color-shadow)]" />}
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-card">
              <button type="button" onClick={() => void shareNative()} disabled={!shareAsset || sharing} className="bg-c3 hover:opacity-90 text-main font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] flex items-center justify-center gap-2 text-xs disabled:opacity-60">
                <Share2 size={16} strokeWidth={3} />
                {sharing ? t('ui.sharingPredictionSlip') : t('ui.shareNow')}
              </button>
              <button type="button" onClick={downloadAsset} disabled={!shareAsset} className="bg-card hover:bg-muted text-main font-black uppercase py-3 px-4 border-2 border-main shadow-[3px_3px_0_var(--color-shadow)] flex items-center justify-center gap-2 text-xs disabled:opacity-60">
                <Download size={16} strokeWidth={3} />
                {canNativeShare ? t('ui.downloadPredictionSlip') : t('ui.downloadPredictionSlip')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
