import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Award, BarChart2, Shield, Star, Trophy, Users } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import PointsCoin from '../components/ui/PointsCoin';
import RankBadge from '../components/ui/RankBadge';
import StatusPill from '../components/ui/StatusPill';
import StreakBadge from '../components/ui/StreakBadge';
import { useAuth } from '../lib/auth';
import { listCurrentUserBadges, type UserBadgeWithBadge } from '../services/badges';
import { listCurrentUserLeagueMemberships, type LeagueMemberRow } from '../services/leagues';
import { calculateAccuracy, calculateStreak, getPredictionOutcome } from '../lib/scoring';
import { listCurrentUserPredictions, type PredictionWithMatch } from '../services/predictions';
import { ensureCurrentProfile, updateCurrentProfile, type ProfileRow } from '../services/profile';
import { getErrorMessage } from '../services/serviceTypes';
import { getTeamMap, type TeamRow } from '../services/teams';
import { getBadgeImageSrc } from '../utils/badgeImages';
import { getPublicDisplayName, getPublicInitials } from '../utils/displayName';
import { formatPredictionPick } from '../utils/predictionDisplay';
import type { ThemeControls } from '../App';
import type { MatchResult, Prediction, PredictionDisplayStatus, PredictionType } from '../types/domain';

type ProfileProps = {
  themeControls: ThemeControls;
};

function toPrediction(row: PredictionWithMatch): Prediction {
  const predictedOutcome = row.predicted_outcome as Prediction['predictedOutcome'];

  return {
    id: row.id,
    userId: row.user_id,
    matchId: row.match_id,
    predictionType: row.prediction_type as PredictionType,
    homeScore: row.home_score,
    awayScore: row.away_score,
    predictedOutcome,
    confidence: row.confidence,
    isRiskPick: row.is_risk_pick,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lockedAt: row.locked_at ?? undefined,
    status: row.status as Prediction['status'],
    revision: row.revision,
  };
}

function getMatchResult(row: PredictionWithMatch): MatchResult | undefined {
  const match = row.matches;
  if (!match || match.status !== 'finished' || typeof match.home_score !== 'number' || typeof match.away_score !== 'number') return undefined;
  return { homeScore: match.home_score, awayScore: match.away_score };
}

function getDisplayStatus(prediction: Prediction, result?: MatchResult): PredictionDisplayStatus {
  if (!result) return prediction.status === 'locked' ? 'locked' : 'pending';
  return getPredictionOutcome(prediction, result);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export default function Profile({ themeControls }: ProfileProps) {
  const { t } = useTranslation();
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);
  const [teams, setTeams] = useState<Map<string, TeamRow>>(new Map());
  const [badges, setBadges] = useState<UserBadgeWithBadge[]>([]);
  const [leagueMemberships, setLeagueMemberships] = useState<LeagueMemberRow[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [displayNameStatus, setDisplayNameStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const userPredictions = predictions.map((source) => ({ source, prediction: toPrediction(source), result: getMatchResult(source) }));
  const scoredItems = userPredictions.map(({ prediction, result }) => ({ prediction, result }));
  const accuracy = calculateAccuracy(scoredItems);
  const streak = calculateStreak(scoredItems);
  const unlockedBadges = badges.filter((badge) => badge.unlocked_at);
  const favoriteTeam = profile?.fan_club_team_id ? teams.get(profile.fan_club_team_id) : undefined;

  useEffect(() => {
    if (!authUser) {
      setProfile(null);
      return;
    }

    let active = true;
    setProfileLoading(true);
    setProfileError(null);

    Promise.all([ensureCurrentProfile(authUser.id, authUser.email, authUser.user_metadata.username), listCurrentUserPredictions(), getTeamMap(), listCurrentUserBadges(), listCurrentUserLeagueMemberships()])
      .then(([nextProfile, nextPredictions, nextTeams, nextBadges, nextLeagueMemberships]) => {
        if (!active) return;
        setProfile(nextProfile);
        setDisplayNameDraft(nextProfile.display_name ?? '');
        setDisplayNameStatus('idle');
        setDisplayNameError(null);
        setPredictions(nextPredictions);
        setTeams(nextTeams);
        setBadges(nextBadges);
        setLeagueMemberships(nextLeagueMemberships);
      })
      .catch((error) => {
        if (!active) return;
        setProfileError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authUser]);

  async function handleDisplayNameSave() {
    if (!authUser || !profile || displayNameStatus === 'saving') return;

    const nextDisplayName = displayNameDraft.trim();
    if (nextDisplayName.length > 40) {
      setDisplayNameError(t('ui.displayNameTooLong'));
      setDisplayNameStatus('idle');
      return;
    }

    setDisplayNameStatus('saving');
    setDisplayNameError(null);
    try {
      const nextProfile = await updateCurrentProfile(authUser.id, { display_name: nextDisplayName || null });
      setProfile(nextProfile);
      setDisplayNameDraft(nextProfile.display_name ?? '');
      setDisplayNameStatus('saved');
    } catch (error) {
      setDisplayNameStatus('idle');
      setDisplayNameError(getErrorMessage(error));
    }
  }

  if (authLoading || profileLoading) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">{t('ui.playerProfile')}</h1>
          </div>
          <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm font-black uppercase text-sm">
            {t('ui.loadingProfile')}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!authUser) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-4 lg:p-6 gap-4 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main">{t('ui.playerProfile')}</h1>
          </div>
          <div className="bg-card border-4 border-main p-4 lg:p-6 shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm font-black uppercase text-sm flex flex-col gap-3">
            <span>{t('ui.signInProfile')}</span>
            <Link to="/login" className="text-c2 underline">{t('ui.goToLogin')}</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (profileError || !profile) {
    return (
      <AppShell themeControls={themeControls}>
        <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
          <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">{t('ui.playerProfile')}</h1>
          </div>
          <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm font-black uppercase text-sm">
            {profileError ?? t('ui.profileNotFound')}
          </div>
        </div>
      </AppShell>
    );
  }

  const publicDisplayName = getPublicDisplayName(profile, authUser.id);
  const publicInitials = getPublicInitials(profile, authUser.id);

  return (
    <AppShell themeControls={themeControls}>
      <div className="relative z-10 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 lg:gap-6 min-h-0">
        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col w-full xl:w-1/2 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-1 text-main leading-none">
            {t('ui.playerProfile')}
          </h1>
        </div>

        <div className="bg-card border-4 border-main p-3 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-6 shadow-[6px_6px_0_0_var(--color-shadow)] lg:shadow-[8px_8px_0_0_var(--color-shadow)] rounded-sm">
          <div className="grid grid-cols-2 xl:grid-cols-4 border-b-4 border-main">
            <div className="flex items-center gap-2 sm:gap-4 border-b-4 border-r-4 xl:border-b-0 border-main p-2.5 sm:p-4 lg:p-5 bg-c1 text-main min-w-0">
              <div className="shrink-0"><Trophy size={24} className="sm:w-9 sm:h-9" strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('ui.globalRank')}</div>
                <div className="text-lg sm:text-3xl font-black leading-none">#{profile.rank ?? '—'}</div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1 truncate">{t('ui.globalArena')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-b-4 xl:border-b-0 xl:border-r-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c2 text-inv min-w-0">
              <div className="shrink-0"><RankBadge points={profile.points} size="sm" showLabel={false} /></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('ui.rankTier')}</div>
                <div className="text-lg sm:text-3xl font-black leading-none truncate"><RankBadge points={profile.points} size="sm" /></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1 flex items-center gap-1 truncate"><PointsCoin size="sm" />{profile.points.toLocaleString()} {t('ui.pointsShort')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-r-4 xl:border-r-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c3 text-main min-w-0">
              <div className="shrink-0"><BarChart2 size={24} className="sm:w-9 sm:h-9" strokeWidth={2.5} /></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('ui.accuracy')}</div>
                <div className="text-lg sm:text-3xl font-black leading-none">{accuracy || profile.accuracy || 0}%</div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1 truncate">{t('ui.exactOrOutcome')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 border-main p-2.5 sm:p-4 lg:p-5 bg-c4 text-main min-w-0">
              <div className="shrink-0"><StreakBadge streak={streak || profile.current_streak} size="sm" showValue={false} /></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="text-[9px] sm:text-xs uppercase font-black tracking-widest leading-none mb-1 opacity-90 truncate">{t('ui.streak')}</div>
                <div className="text-lg sm:text-3xl font-black leading-none truncate"><StreakBadge streak={streak || profile.current_streak} size="sm" /></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase mt-1 truncate">{t('ui.best')} {profile.best_streak}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1">
            <div className="order-2 xl:order-1 flex-1 border-r-0 xl:border-r-4 border-main flex flex-col bg-card min-w-0">
              <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main flex items-center justify-between">
                <span>{t('ui.recentPredictions')}</span>
                <span className="text-[10px] font-bold text-faint">{t('ui.picksCount', { count: userPredictions.length })}</span>
              </div>
              <div className="flex flex-col bg-card">
                {userPredictions.slice(0, 5).map(({ source, prediction, result }) => {
                  const match = source.matches;
                  if (!match) return null;
                  const homeTeam = teams.get(match.home_team_id);
                  const awayTeam = teams.get(match.away_team_id);
                  return (
                    <div key={prediction.id} className="grid grid-cols-1 md:grid-cols-[1fr_150px_130px] border-b-4 border-main last:border-b-0 font-bold text-xs sm:text-sm hover:bg-muted transition-colors">
                      <div className="p-3 sm:p-4 md:border-r-2 border-main min-w-0">
                        <Link to={`/matches/${match.id}`} className="font-black uppercase text-main hover:text-c2 hover:underline block truncate">{homeTeam?.name ?? match.home_team_id} vs {awayTeam?.name ?? match.away_team_id}</Link>
                        <div className="text-[10px] sm:text-xs text-subtle uppercase mt-1 truncate">{formatDate(match.kickoff_at)} • {match.city}</div>
                      </div>
                      <div className="px-3 pb-2 sm:p-4 md:border-r-2 border-main font-black md:text-center flex items-center">{formatPredictionPick(prediction, homeTeam?.short_name ?? t('appPages.common.unknownTeam'), awayTeam?.short_name ?? t('appPages.common.unknownTeam'))}</div>
                      <div className="px-3 pb-3 sm:p-4 flex md:justify-center items-center"><StatusPill status={getDisplayStatus(prediction, result)} /></div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-y-4 border-main">
                {t('ui.badgeProgress')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-card">
                {badges.map((userBadge, index) => {
                  const badge = userBadge.badges;
                  if (!badge) return null;
                  const imageSrc = getBadgeImageSrc(badge);
                  const progress = badge.progress_target ? Math.round((userBadge.progress_current / badge.progress_target) * 100) : 0;
                  return (
                    <Link key={badge.id} to="/badges" className={`p-3 sm:p-4 border-b-4 border-main hover:bg-muted ${index % 2 !== 1 ? 'sm:border-r-4' : ''} ${index % 3 !== 2 ? 'lg:border-r-4' : ''}`}>
                      <div className="flex items-center gap-2 sm:gap-3 font-black uppercase text-xs sm:text-sm min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-main bg-card text-main flex items-center justify-center shrink-0 overflow-hidden p-1 rounded-sm">
                          {imageSrc ? (
                            <img src={imageSrc} alt="" className={`w-full h-full object-contain ${userBadge.unlocked_at ? '' : 'grayscale opacity-50'}`} />
                          ) : <Award size={18} />}
                        </div>
                        <span className="truncate">{badge.name}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs font-bold text-subtle mt-2 leading-snug line-clamp-2">{badge.description}</div>
                      <div className="h-3 border-2 border-main mt-3 bg-muted rounded-sm overflow-hidden"><div className="h-full bg-c3 rounded-sm" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                      <div className="text-[10px] font-black uppercase mt-2">{userBadge.unlocked_at ? t('appPages.common.unlocked') : `${userBadge.progress_current}/${badge.progress_target ?? 0}`}</div>
                    </Link>
                  );
                })}
                {badges.length === 0 && <div className="p-4 font-black uppercase text-sm">{t('ui.noBadgeProgress')}</div>}
              </div>
            </div>

            <div className="order-1 xl:order-2 w-full xl:w-[420px] bg-card flex flex-col border-b-4 xl:border-b-0 border-main">
              <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main">
                {t('ui.identity')}
              </div>
              <div className="p-3 sm:p-5 bg-card flex flex-col gap-3 sm:gap-4 border-b-4 border-main">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-main rounded-full bg-c1 flex items-center justify-center font-black text-2xl sm:text-3xl shrink-0">{publicInitials}</div>
                  <div className="min-w-0">
                    <div className="font-black text-2xl sm:text-3xl uppercase tracking-tighter text-main leading-none truncate">{publicDisplayName}</div>
                    <div className="font-black text-[10px] sm:text-xs uppercase text-subtle truncate">@{profile.username}</div>
                    <div className="font-bold text-xs sm:text-sm text-subtle truncate">{profile.email ?? authUser.email}</div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <RankBadge points={profile.points} size="sm" className="text-main" />
                      <span className="border-2 border-main bg-c1 px-2 py-1 font-black uppercase text-[10px] sm:text-xs flex items-center gap-1 text-main shadow-[2px_2px_0_var(--color-shadow)] rounded-sm">
                        <PointsCoin size="sm" />
                        {profile.points.toLocaleString()} {t('ui.pointsShort')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-2 border-main p-2.5 sm:p-3 flex flex-col gap-2 rounded-sm">
                  <label className="font-black uppercase text-[10px] text-subtle" htmlFor="display-name">{t('ui.displayNamePublic')}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                    <input
                      id="display-name"
                      type="text"
                      value={displayNameDraft}
                      onChange={(event) => {
                        setDisplayNameDraft(event.target.value);
                        setDisplayNameStatus('idle');
                        setDisplayNameError(null);
                      }}
                      maxLength={60}
                      placeholder={profile.username}
                      className="min-w-0 border-2 border-main bg-card px-3 py-2 font-bold text-sm text-main shadow-[2px_2px_0_var(--color-shadow)] outline-none rounded-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void handleDisplayNameSave()}
                      disabled={displayNameStatus === 'saving'}
                      className="bg-c2 text-inv border-2 border-main px-4 py-2 font-black uppercase text-xs shadow-[2px_2px_0_var(--color-shadow)] disabled:opacity-60 disabled:cursor-wait rounded-sm"
                    >
                      {displayNameStatus === 'saving' ? t('ui.savingEllipsis') : t('ui.save')}
                    </button>
                  </div>
                  <div className="font-bold text-[10px] uppercase text-subtle">{t('ui.displayNameHelp')}</div>
                  {displayNameStatus === 'saved' && <div className="font-black text-[10px] uppercase text-c3">{t('ui.displayNameSaved')}</div>}
                  {displayNameError && <div className="font-black text-[10px] uppercase text-c5">{displayNameError}</div>}
                </div>
                <div className="grid grid-cols-2 border-2 border-main text-xs sm:text-sm font-bold rounded-sm overflow-hidden">
                  <div className="p-2.5 sm:p-3 border-r-2 border-main min-w-0"><div className="text-[10px] uppercase text-subtle font-black">{t('ui.fanTeam')}</div><span className="truncate block">{favoriteTeam?.name ?? t('ui.notSet')}</span></div>
                  <div className="p-2.5 sm:p-3"><div className="text-[10px] uppercase text-subtle font-black">{t('ui.joined')}</div>{formatDate(profile.created_at)}</div>
                </div>
              </div>

              <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main">
                {t('ui.leagues')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-col bg-card border-b-4 border-main">
                {leagueMemberships.map((membership) => {
                  const league = membership.leagues;
                  if (!league) return null;
                  return (
                    <Link key={membership.league_id} to={`/leagues/${league.slug}`} className="p-3 sm:p-4 border-b-2 sm:border-r-2 xl:border-r-0 border-line last:border-b-0 hover:bg-muted min-w-0">
                      <div className="font-black uppercase text-sm truncate">{league.name}</div>
                      <div className="text-[10px] sm:text-xs font-bold text-subtle uppercase mt-1 truncate">{t('ui.memberCount', { count: league.member_count.toLocaleString() })} • {league.visibility}</div>
                    </Link>
                  );
                })}
                {leagueMemberships.length === 0 && <div className="p-3 sm:p-4 font-black uppercase text-xs">{t('ui.noLeagueMemberships')}</div>}
              </div>

              <div className="flex flex-col flex-1 bg-c2 text-inv">
                <div className="bg-main text-inv font-black px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wide text-xs sm:text-sm border-b-4 border-main">
                  {t('ui.quickLinks')}
                </div>
                <div className="p-3 sm:p-4 font-black uppercase grid grid-cols-1 sm:grid-cols-3 xl:flex xl:flex-col gap-2 sm:gap-3">
                  <Link to="/activity" className="bg-card text-main border-2 border-main p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:bg-muted text-xs sm:text-sm rounded-sm"><Shield size={18} /> {t('ui.viewActivity')}</Link>
                  <Link to="/badges" className="bg-c1 text-main border-2 border-main p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm rounded-sm"><Shield size={18} /> {t('ui.unlockedBadgesCount', { count: unlockedBadges.length })}</Link>
                  <Link to="/leagues" className="bg-main text-inv border-2 border-main p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm rounded-sm"><Users size={18} /> {t('ui.browseLeagues')}</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
