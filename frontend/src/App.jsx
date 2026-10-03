import { API_BASE_URL, API_ROOT } from './utils/apiConfig';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import StatusPage from './pages/StatusPage';
import QuestPage from './pages/QuestPage';
import NutritionPage from './pages/NutritionPage';
import BootScreen from './components/BootScreen';
import TrainerPage from './pages/TrainerPage';
import ElectricParticles from './components/ElectricParticles';
import defaultAvatar from './assets/default-avatar.svg';
import LevelUpModal from './components/LevelUpModal';
import AvatarSelectorModal from './components/AvatarSelectorModal';
import OnboardingModal from './components/OnboardingModal';
import AuthModal from './components/AuthModal';
import ShopPage from './pages/ShopPage';
import AchievementsPage from './pages/AchievementsPage';
import AchievementUnlockedModal from './components/AchievementUnlockedModal';
import QuestCompleteOverlay from './components/QuestCompleteOverlay';
import HunterProfileHeader from './components/HunterProfileHeader';
import QuestRewardToast from './components/QuestRewardToast';
import SavedDataToast from './components/SavedDataToast';
import ShadowTrainingModal from './components/ShadowTrainingModal';
import { playSystemSound } from './utils/hunterUtils';

// =========================================================================
// SYSTEM ACCESS CONFIGURATION FLAG
// Set to false to bypass login and enter dashboard straight away.
// Set to true later to re-enable authentication requirements.
// =========================================================================
const REQUIRE_LOGIN = false;

function App() {
  // 1. Splash Screen & Intro Bypass
  const [isBooting, setIsBooting] = useState(() => {
    if (!REQUIRE_LOGIN) return false;
    const hasSeenIntro = localStorage.getItem('hasSeenIntro') === 'true';
    const token = localStorage.getItem('hunter_token');
    return !hasSeenIntro && !token;
  });

  // 2. Synchronous Auth & Session Expiry Check (30 Days)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (!REQUIRE_LOGIN) return true;
    const token = localStorage.getItem('hunter_token');
    const expiry = localStorage.getItem('hunter_session_expiry');
    if (!token) return false;
    if (expiry && Date.now() > Number(expiry)) {
      localStorage.removeItem('hunter_token');
      localStorage.removeItem('hunter_session_expiry');
      return false;
    }
    return true;
  });

  // 3. Synchronous Onboarding Status Hydration directly from localStorage
  const [isOnboarded, setIsOnboarded] = useState(() => {
    if (!REQUIRE_LOGIN) return true;
    return (
      localStorage.getItem('hunter_is_onboarded') === 'true' ||
      localStorage.getItem('isOnboarded') === 'true'
    );
  });

  // 4. Loading guard state for backend profile synchronization
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Modals & System Greeting state
  const [showAuthModal, setShowAuthModal] = useState(() => REQUIRE_LOGIN && !isAuthenticated);
  const [showOnboarding, setShowOnboarding] = useState(() => REQUIRE_LOGIN && isAuthenticated && !isOnboarded);
  const [showQuestOverlay, setShowQuestOverlay] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showShadowTrainingModal, setShowShadowTrainingModal] = useState(false);
  const [unlockedAchievementModal, setUnlockedAchievementModal] = useState(null);
  const [systemGreeting, setSystemGreeting] = useState('');
  const [rewardToast, setRewardToast] = useState(null);
  const [savedToast, setSavedToast] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    '7': null,
    '30': null
  });

  // System State Data
  const [player, setPlayer] = useState(() => {
    const saved = localStorage.getItem('hunter_onboarding_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [quest, setQuest] = useState(null);
  const [weight, setWeight] = useState('');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);

  const fetchAnalytics = async (range = '7', force = false) => {
    if (!force && analyticsData[range]) return analyticsData[range];
    try {
      const res = await fetch(`${API_BASE_URL}/quests/analytics?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData((prev) => ({ ...prev, [range]: data }));
        return data;
      }
    } catch (err) {
      console.error('[ANALYTICS FETCH ERROR]:', err);
    }
    return null;
  };

  const handleProcessNewAchievements = (newlyUnlocked) => {
    if (Array.isArray(newlyUnlocked) && newlyUnlocked.length > 0) {
      playSystemSound('levelUp');
      setUnlockedAchievementModal(newlyUnlocked[0]);
    }
  };

  // Central system data synchronizer
  const fetchSystemData = async () => {
    const token = localStorage.getItem('hunter_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/player/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.newlyUnlocked) {
        handleProcessNewAchievements(data.newlyUnlocked);
      }
      setPlayer((prev) => ({ ...prev, ...data }));
      fetchAnalytics('7', true);
      fetchAnalytics('30', true);
    } catch (err) {
      console.error('[SYSTEM ERROR]: Failed to connect to backend server:', err);
    }
  };

  useEffect(() => {
    let ignore = false;
    const initializeAuthAndData = async () => {
      const token = localStorage.getItem('hunter_token');
      const expiry = localStorage.getItem('hunter_session_expiry');
      let fetchedPlayer = null;

      if (token) {
        if (expiry && Date.now() > Number(expiry)) {
          localStorage.removeItem('hunter_token');
          localStorage.removeItem('hunter_session_expiry');
          if (!ignore) {
            setIsAuthenticated(false);
            setShowAuthModal(true);
            setShowOnboarding(false);
            setIsAuthLoading(false);
          }
          return;
        }

        if (token.startsWith('mock_guest_token_')) {
          const savedProfile = localStorage.getItem('hunter_onboarding_profile');
          if (savedProfile) {
            try {
              const guestData = JSON.parse(savedProfile);
              if (!ignore) {
                setIsAuthenticated(true);
                setPlayer(guestData);
                setIsOnboarded(true);
                setShowOnboarding(false);
                setShowAuthModal(false);
                setIsAuthLoading(false);
                fetchedPlayer = guestData;
              }
            } catch (e) {
              console.warn('Failed to parse guest profile:', e);
            }
          }
        } else {
          try {
            const authRes = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (authRes.ok) {
              const authData = await authRes.json();
              if (!ignore) {
                setIsAuthenticated(true);
                const playerData = authData.player || {};
                fetchedPlayer = playerData;

                setPlayer({
                  ...playerData,
                  name: playerData.name || authData.user?.name || 'Hunter',
                  avatarUrl: playerData.avatarUrl || defaultAvatar
                });

                const isPlayerOnboarded =
                  localStorage.getItem('hunter_is_onboarded') === 'true' ||
                  localStorage.getItem('isOnboarded') === 'true' ||
                  playerData.isSetupComplete === true ||
                  playerData.isOnboarded === true;

                if (isPlayerOnboarded) {
                  localStorage.setItem('hunter_is_onboarded', 'true');
                  localStorage.setItem('isOnboarded', 'true');
                  setIsOnboarded(true);
                  setShowOnboarding(false);
                  setShowAuthModal(false);
                } else {
                  setIsOnboarded(false);
                  setShowOnboarding(true);
                  setShowAuthModal(false);
                  setSystemGreeting('[ SYSTEM NOTICE ]: Welcome New Hunter! Complete your baseline evaluation to activate System Tracking.');
                }
              }
            } else {
              localStorage.removeItem('hunter_token');
              if (!ignore) {
                if (REQUIRE_LOGIN) {
                  setIsAuthenticated(false);
                  setShowAuthModal(true);
                  setShowOnboarding(false);
                } else {
                  setIsAuthenticated(true);
                  setShowAuthModal(false);
                }
              }
            }
          } catch (err) {
            console.error('[AUTH CHECK ERROR]:', err);
          } finally {
            if (!ignore) setIsAuthLoading(false);
          }
        }
      } else {
        if (!ignore) {
          if (REQUIRE_LOGIN) {
            setIsAuthenticated(false);
            setShowAuthModal(true);
            setShowOnboarding(false);
          } else {
            setIsAuthenticated(true);
            setIsOnboarded(true);
            setShowAuthModal(false);
            setShowOnboarding(false);
          }
          setIsAuthLoading(false);
        }
      }

      try {
        const questRes = await fetch(`${API_BASE_URL}/quests/today`);
        if (questRes.ok) {
          const questData = await questRes.json();
          if (!ignore) {
            setQuest(questData);
            if (questData.nutrition) {
              const activeWeight = (questData.nutrition.currentWeight > 0)
                ? questData.nutrition.currentWeight 
                : (fetchedPlayer?.currentWeight || fetchedPlayer?.startWeight || '');
              if (activeWeight) setWeight(activeWeight);
              setCalories(questData.nutrition.caloriesConsumed || 0);
              setProtein(questData.nutrition.proteinGrams || 0);
            }
          }
        }
      } catch (err) {
        console.warn('[QUEST FETCH NOTICE]:', err.message);
        if (!ignore) {
          setQuest((prev) => prev || {
            date: new Date().toISOString().split('T')[0],
            tasks: {
              pushupsCompleted: false,
              situpsCompleted: false,
              squatsCompleted: false,
              runningCompleted: false,
              stretchingCompleted: false,
              workoutCompleted: false
            },
            nutrition: {
              currentWeight: 72,
              caloriesConsumed: 0,
              proteinGrams: 0
            },
            allDailyQuestsCleared: false
          });
        }
      }

      try {
        const a7Res = await fetch(`${API_BASE_URL}/quests/analytics?range=7`);
        if (a7Res.ok) {
          const a7Data = await a7Res.json();
          if (!ignore) setAnalyticsData((prev) => ({ ...prev, '7': a7Data }));
        }
        const a30Res = await fetch(`${API_BASE_URL}/quests/analytics?range=30`);
        if (a30Res.ok) {
          const a30Data = await a30Res.json();
          if (!ignore) setAnalyticsData((prev) => ({ ...prev, '30': a30Data }));
        }
      } catch (err) {
        console.error('[INITIAL ANALYTICS FETCH ERROR]:', err);
      }
    };

    initializeAuthAndData();
    return () => { ignore = true; };
  }, []);

  const handleLoginSuccess = (data) => {
    localStorage.setItem('hunter_token', data.token);
    const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem('hunter_session_expiry', expiryTime.toString());

    setIsAuthenticated(true);
    setShowAuthModal(false);
    setIsAuthLoading(false);

    const playerData = data.player || {};
    const updatedPlayerObj = {
      ...playerData,
      name: playerData.name || data.user?.name || 'Hunter',
      avatarUrl: playerData.avatarUrl || defaultAvatar
    };

    setPlayer(updatedPlayerObj);

    const isPlayerOnboarded =
      localStorage.getItem('hunter_is_onboarded') === 'true' ||
      localStorage.getItem('isOnboarded') === 'true' ||
      playerData.isSetupComplete === true ||
      playerData.isOnboarded === true;

    if (isPlayerOnboarded) {
      localStorage.setItem('hunter_is_onboarded', 'true');
      localStorage.setItem('isOnboarded', 'true');
      setIsOnboarded(true);
      setShowOnboarding(false);
      setSystemGreeting(`[ SYSTEM NOTICE ]: Welcome back, Hunter ${updatedPlayerObj.name}! System status synchronized.`);
    } else {
      setIsOnboarded(false);
      setShowOnboarding(true);
      setSystemGreeting('[ SYSTEM NOTICE ]: Welcome New Hunter! Complete your baseline evaluation to activate System Tracking.');
    }

    fetchSystemData();
  };

  const handleOnboardingComplete = (updatedProfile) => {
    localStorage.setItem('hunter_is_onboarded', 'true');
    localStorage.setItem('isOnboarded', 'true');
    localStorage.setItem('hunter_onboarding_profile', JSON.stringify(updatedProfile));

    setIsOnboarded(true);
    setShowOnboarding(false);
    setPlayer((prev) => ({ ...prev, ...updatedProfile }));
    setSystemGreeting(`[ SYSTEM NOTICE ]: System parameters initialized! Welcome aboard, Hunter ${updatedProfile.name || 'Hunter'}!`);
  };

  const handleLogout = () => {
    playSystemSound('click');
    localStorage.removeItem('hunter_token');
    localStorage.removeItem('hunter_session_expiry');
    localStorage.removeItem('hunter_is_onboarded');
    localStorage.removeItem('isOnboarded');
    localStorage.removeItem('hunter_onboarding_profile');
    localStorage.removeItem('hunter_cleared_gates');
    localStorage.removeItem('hunter_avatar');

    setIsAuthenticated(false);
    setIsOnboarded(false);
    setPlayer(null);
    setQuest(null);
    setSystemGreeting('');
    setShowAuthModal(true);
    setShowOnboarding(false);
    setIsAuthLoading(false);
  };

  const triggerRewardToast = (toastObj) => {
    setRewardToast(toastObj);
  };

  const triggerSavedToast = (toastObj) => {
    setSavedToast(toastObj);
  };

  const handleToggleTask = async (taskName) => {
    // 1. Instant zero-delay toast trigger on click
    const isCurrentlyDone = quest?.tasks?.[taskName] ?? quest?.customTasks?.find(t => String(t.id) === String(taskName))?.completed;

    if (!isCurrentlyDone) {
      if (taskName === 'workoutCompleted') {
        triggerRewardToast({
          title: 'WORKOUT QUEST COMPLETED!',
          earnedText: '+30 XP, +1 STR, +20 GOLD',
          icon: '💪'
        });
      } else if (taskName === 'meditationCompleted') {
        triggerRewardToast({
          title: 'DAILY MEDITATION COMPLETED!',
          earnedText: '+20 XP, +1 INT, +20 GOLD',
          icon: '🧘'
        });
        triggerSavedToast({
          message: 'Daily Meditation session record persisted to System'
        });
      } else if (taskName === 'macrosTracked') {
        triggerRewardToast({
          title: 'DAILY MACROS TRACKED!',
          earnedText: '+15 XP, +1 VIT, +50 GOLD',
          icon: '🥗'
        });
        triggerSavedToast({
          message: 'Daily Macro Tracking record persisted to System'
        });
      } else {
        const customTask = quest?.customTasks?.find(t => String(t.id) === String(taskName));
        const xpAmount = customTask?.xp || 20;
        const taskTitle = customTask?.label ? customTask.label.toUpperCase() : 'CUSTOM OBJECTIVE';
        triggerRewardToast({
          title: `${taskTitle} CLEARED!`,
          earnedText: `+${xpAmount} XP, +20 GOLD`,
          icon: '🎯'
        });
      }
    } else {
      triggerRewardToast({
        title: 'TASK REVERTED',
        earnedText: 'Task status unchecked',
        icon: '↩️',
        type: 'revert'
      });
    }

    try {
      const token = localStorage.getItem('hunter_token');
      const res = await fetch(`${API_BASE_URL}/quests/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ taskName })
      });
      const data = await res.json();

      if (data.quest) {
        setQuest(data.quest);
        if (data.quest.isCompleted && !quest?.isCompleted) {
          setShowQuestOverlay(true);
          playSystemSound('questDone');
        }
      }

      if (data.player) {
        setPlayer((prev) => ({ ...prev, ...data.player }));
      }

      if (data.limitMessage) {
        triggerSavedToast({ message: data.limitMessage });
      }

      if (data.newlyUnlocked) {
        handleProcessNewAchievements(data.newlyUnlocked);
      }

      fetchAnalytics('7', true);
      fetchAnalytics('30', true);
    } catch (err) {
      console.warn('[TOGGLE TASK OFFLINE SYNC]:', err.message);
      setQuest((prev) => {
        if (!prev) return prev;
        const currentDone = prev.tasks?.[taskName] ?? false;
        return {
          ...prev,
          tasks: {
            ...prev.tasks,
            [taskName]: !currentDone
          }
        };
      });
      setPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exp: (prev.exp || 0) + 20,
          goldCoins: (prev.goldCoins || 0) + 15
        };
      });
    }
  };

  const handleSaveNutrition = async (nutritionData) => {
    try {
      const token = localStorage.getItem('hunter_token');
      const res = await fetch(`${API_BASE_URL}/quests/nutrition`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(nutritionData)
      });
      const data = await res.json();

      if (data.quest) setQuest(data.quest);
      if (data.player) {
        setPlayer((prev) => ({ ...prev, ...data.player }));
        if (data.player.currentWeight) setWeight(data.player.currentWeight);
      }

      if (data.newlyUnlocked) {
        handleProcessNewAchievements(data.newlyUnlocked);
      }

      triggerSavedToast({
        message: 'Physical Metrics updated & +50 Gold Coins awarded!'
      });

      fetchAnalytics('7', true);
      fetchAnalytics('30', true);
    } catch (err) {
      console.error('[SAVE NUTRITION ERROR]:', err);
    }
  };

  const handleDismissAnomaly = async () => {
    try {
      const token = localStorage.getItem('hunter_token');
      const res = await fetch(`${API_BASE_URL}/player/dismiss-anomaly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setPlayer((prev) => ({ ...prev, dataAnomalyDetected: false }));
      }
    } catch (err) {
      console.error('[DISMISS ANOMALY ERROR]:', err);
      setPlayer((prev) => ({ ...prev, dataAnomalyDetected: false }));
    }
  };

  const handleAllocateStat = async (statName) => {
    try {
      const token = localStorage.getItem('hunter_token');
      const res = await fetch(`${API_BASE_URL}/player/allocate-stat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ statName })
      });
      const data = await res.json();
      if (res.ok) {
        setPlayer(data);
      }
    } catch (err) {
      console.warn('[ALLOCATE STAT OFFLINE SYNC]:', err.message);
      setPlayer((prev) => {
        if (!prev || (prev.availableStatPoints || 0) <= 0) return prev;
        return {
          ...prev,
          availableStatPoints: (prev.availableStatPoints || 1) - 1,
          stats: {
            ...prev.stats,
            [statName]: (prev.stats?.[statName] || 10) + 1
          }
        };
      });
    }
  };

  const handleCompleteShadowTraining = async (trainingData) => {
    try {
      const token = localStorage.getItem('hunter_token');
      const res = await fetch(`${API_BASE_URL}/quests/shadow-training`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(trainingData)
      });
      const data = await res.json();

      if (res.ok) {
        triggerRewardToast({
          title: 'SHADOW TRAINING CLEARED!',
          earnedText: `+${data.xpAwarded || 10} XP, +${data.goldAwarded || 5} GOLD`,
          icon: '⚔️'
        });
        triggerSavedToast({
          message: `Micro-Quest (${trainingData.taskLabel}) logged to System Journal`
        });

        if (data.newlyUnlocked) handleProcessNewAchievements(data.newlyUnlocked);
        if (data.player) setPlayer((prev) => ({ ...prev, ...data.player }));
        if (data.quest) setQuest(data.quest);
      } else if (data.error) {
        triggerSavedToast({
          message: data.error
        });
      }
    } catch (err) {
      console.error('[SHADOW TRAINING ERROR]:', err);
    }
  };

  const activePlayer = player || {
    name: 'Hunter',
    age: 22,
    heightCm: 170,
    startWeight: 70,
    currentWeight: 70,
    targetWeight: 65,
    goalType: 'lose',
    primaryGoal: 'lose',
    activityLevel: 'moderate',
    dietaryPreference: 'balanced',
    dailyCalorieTarget: 2000,
    dailyProteinTarget: 140,
    level: 1,
    exp: 0,
    hp: 100,
    availableStatPoints: 0,
    stats: { STR: 10, VIT: 10, MEN: 10, DIS: 10 },
    goldCoins: 250,
    dungeonClears: 0,
    clearedGates: [],
    unlockedAchievements: [],
    weightHistory: [],
    avatarUrl: defaultAvatar
  };

  if (isBooting) {
    return (
      <BootScreen 
        player={activePlayer} 
        onComplete={() => setIsBooting(false)} 
        onStart={() => setIsBooting(false)} 
      />
    );
  }

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-[#020306] flex flex-col items-center justify-center font-['Orbitron'] text-[var(--glow)] text-xs tracking-[3px] animate-pulse select-none z-50">
        <div>[ SYSTEM SYNCHRONIZING... ]</div>
        <div className="text-[10px] text-cyan-400/60 font-mono mt-2">Authenticating Hunter Session</div>
      </div>
    );
  }

  const calculateWorkoutStreak = () => {
    const timeline = analyticsData?.['7']?.timeline || [];
    const isTodayDone = quest?.tasks?.workoutCompleted;
    let streak = 0;

    if (timeline.length > 0) {
      for (let i = timeline.length - 1; i >= 0; i--) {
        const item = timeline[i];
        const isTodayItem = i === timeline.length - 1;
        const isDone = isTodayItem ? isTodayDone : Boolean(item.workoutCompleted);
        if (isDone) {
          streak++;
        } else {
          break;
        }
      }
    } else if (isTodayDone) {
      streak = 1;
    }
    return streak;
  };

  const workoutStreak = calculateWorkoutStreak();

  return (
    <Router>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-['Rajdhani'] p-3 sm:p-4 max-w-4xl mx-auto relative antialiased z-0">
        <ElectricParticles />

        {/* AUTH MODAL BLOCKING ACCESS IF UNAUTHENTICATED (ONLY WHEN REQUIRE_LOGIN IS TRUE) */}
        {REQUIRE_LOGIN && showAuthModal && !isAuthenticated && (
          <AuthModal 
            isOpen={showAuthModal} 
            onAuthSuccess={handleLoginSuccess} 
          />
        )}

        {/* ONBOARDING MODAL BLOCKING ACCESS FOR NEW UNCONFIGURED ACCOUNTS ONLY */}
        {REQUIRE_LOGIN && showOnboarding && isAuthenticated && (
          <OnboardingModal
            isOpen={showOnboarding}
            initialData={activePlayer}
            onComplete={handleOnboardingComplete}
          />
        )}

        {/* MAIN DASHBOARD CONTENT - ACCESSIBLE DIRECTLY WHEN REQUIRE_LOGIN IS FALSE */}
        {(!REQUIRE_LOGIN || (!showAuthModal && !showOnboarding)) && (
          <>
            {/* SINGLE SOURCE OF TRUTH: TOP-LEVEL HUNTER PROFILE HEADER */}
            <HunterProfileHeader 
              player={activePlayer} 
              onLogout={handleLogout} 
              onUpdateAvatar={() => setShowAvatarModal(true)} 
              onSaveProfile={(updated) => {
                setPlayer((prev) => {
                  const next = { ...prev, ...updated };
                  if (next.currentWeight) setWeight(next.currentWeight);
                  return next;
                });
              }}
              onOpenShadowTraining={() => setShowShadowTrainingModal(true)}
            />

            {/* SYSTEM CONDITIONAL GREETING BANNER */}
            {systemGreeting && (
              <div className="mb-3 p-3 bg-cyan-950/80 border border-[var(--glow)] text-[var(--glow)] font-['Orbitron'] text-xs tracking-wider animate-fade-in flex items-center justify-between flex-wrap gap-2 rounded-xs shadow-[0_0_15px_rgba(45,212,255,0.2)] relative z-20">
                <span className="min-w-0 flex-1 break-words">{systemGreeting}</span>
                <button 
                  onClick={() => setSystemGreeting('')}
                  className="text-slate-400 hover:text-white text-[10px] uppercase cursor-pointer"
                >
                  [ DISMISS ]
                </button>
              </div>
            )}

            <Navbar />

            <main className="space-y-4 relative z-10">
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <StatusPage 
                      player={activePlayer} 
                      weight={weight} 
                      quest={quest}
                      onAllocateStat={handleAllocateStat}
                      onSaveNutrition={handleSaveNutrition}
                      analyticsData={analyticsData}
                      onFetchAnalytics={fetchAnalytics}
                      workoutStreak={workoutStreak}
                      onDismissAnomaly={handleDismissAnomaly}
                    />
                  } 
                />

                <Route 
                  path="/quests" 
                  element={
                    <QuestPage 
                      quest={quest} 
                      onToggleTask={handleToggleTask}
                      player={activePlayer}
                      onPlayerUpdate={fetchSystemData}
                      workoutStreak={workoutStreak}
                    />
                  } 
                />

                <Route 
                  path="/achievements" 
                  element={<AchievementsPage player={activePlayer} />} 
                />

                <Route 
                  path="/nutrition" 
                  element={
                    <NutritionPage 
                      quest={quest}
                      player={activePlayer}
                      weight={weight}
                      setWeight={setWeight}
                      calories={calories}
                      setCalories={setCalories}
                      protein={protein}
                      setProtein={setProtein}
                      onSaveNutrition={handleSaveNutrition}
                      onTriggerRewardToast={triggerRewardToast}
                      onTriggerSavedToast={triggerSavedToast}
                    />
                  } 
                />

                <Route path="/trainer" element={<TrainerPage player={activePlayer} quest={quest} analyticsData={analyticsData} />} />
                <Route path="/shop" element={<ShopPage player={activePlayer} onPlayerUpdate={fetchSystemData} />} />
              </Routes>
            </main>
          </>
        )}

        {/* SYSTEM TOAST OVERLAYS */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md space-y-2.5 pointer-events-none select-none">
          {rewardToast && <QuestRewardToast toast={rewardToast} onClose={() => setRewardToast(null)} />}
          {savedToast && <SavedDataToast toast={savedToast} onClose={() => setSavedToast(null)} />}
        </div>

        {/* SYSTEM OVERLAYS & MODALS */}
        {showQuestOverlay && (
          <QuestCompleteOverlay
            isOpen={showQuestOverlay}
            player={activePlayer}
            expGained={30}
            onClose={() => setShowQuestOverlay(false)}
          />
        )}

        {showLevelUpModal && (
          <LevelUpModal 
            level={activePlayer.level} 
            player={activePlayer}
            onAllocateStat={handleAllocateStat}
            onClose={() => setShowLevelUpModal(false)} 
          />
        )}

        {unlockedAchievementModal && (
          <AchievementUnlockedModal 
            achievement={unlockedAchievementModal} 
            onClose={() => setUnlockedAchievementModal(null)} 
          />
        )}

        {showAvatarModal && (
          <AvatarSelectorModal
            isOpen={showAvatarModal}
            currentAvatar={activePlayer.avatarUrl}
            onSelectAvatar={(newAvatar) => {
              setPlayer((prev) => {
                const nextPlayer = { ...prev, avatarUrl: newAvatar };
                if (nextPlayer.userId || nextPlayer._id) {
                  localStorage.setItem(`hunter_avatar_${nextPlayer.userId || nextPlayer._id}`, newAvatar);
                }
                return nextPlayer;
              });
            }}
            onClose={() => setShowAvatarModal(false)}
          />
        )}

        {showShadowTrainingModal && (
          <ShadowTrainingModal
            player={activePlayer}
            onClose={() => setShowShadowTrainingModal(false)}
            onCompleteTraining={handleCompleteShadowTraining}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
