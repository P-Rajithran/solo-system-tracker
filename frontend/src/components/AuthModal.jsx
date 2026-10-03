import { API_BASE_URL, API_ROOT } from '../utils/apiConfig';
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { playSystemSound } from '../utils/hunterUtils';

const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const AuthModal = ({ isOpen, onAuthSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isGoogleConfigured = typeof window !== 'undefined' && Boolean(window.__IS_GOOGLE_AUTH_CONFIGURED__);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    playSystemSound('click');

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !password) {
      playSystemSound('penalty');
      setErrorMessage('Email address and Password are required.');
      setLoading(false);
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        playSystemSound('penalty');
        setErrorMessage('New Password and Confirm Password do not match!');
        setLoading(false);
        return;
      }
      if (password.length < 4) {
        playSystemSound('penalty');
        setErrorMessage('Password must be at least 4 characters long.');
        setLoading(false);
        return;
      }
    }

    const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
    const payload = mode === 'register' 
      ? { email: cleanEmail, password, name: cleanName } 
      : { email: cleanEmail, password };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        if (res.status === 404 || !contentType || !contentType.includes('application/json')) {
          throw new Error('API_ROUTE_UNAVAILABLE');
        }
        playSystemSound('penalty');
        setErrorMessage(data.error || data.message || `Authentication failed (HTTP ${res.status})`);
        setLoading(false);
        return;
      }

      if (!data.token) {
        throw new Error('INVALID_TOKEN_RESPONSE');
      }

      playSystemSound('levelUp');
      localStorage.setItem('hunter_token', data.token);
      const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('hunter_session_expiry', expiryTime.toString());

      if (onAuthSuccess) {
        onAuthSuccess(data);
      }
    } catch (err) {
      console.warn('[SYSTEM AUTH NOTICE]: External backend unavailable (' + err.message + '). Activating Offline-First Local Hunter Engine.');
      
      const storedUsersRaw = localStorage.getItem('solo_system_local_users');
      let localUsers = [];
      try {
        localUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      } catch {
        localUsers = [];
      }

      if (mode === 'register') {
        const existing = localUsers.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
        if (existing) {
          playSystemSound('penalty');
          setErrorMessage('Hunter account with this email already exists on this device. Please log in.');
          setLoading(false);
          return;
        }

        const newUserId = 'local_user_' + Date.now();
        const newPlayer = {
          name: cleanName || 'Hunter',
          userId: newUserId,
          level: 1,
          rank: 'E-Rank',
          exp: 0,
          goldCoins: 100,
          stats: { STR: 10, VIT: 10, MEN: 10, DIS: 10 },
          availableStatPoints: 5,
          currentWeight: 70,
          targetWeight: 65,
          startWeight: 70,
          dailyCalorieTarget: 2000,
          dailyProteinTarget: 140,
          isSetupComplete: true,
          isOnboarded: true
        };

        const newUser = {
          id: newUserId,
          email: cleanEmail.toLowerCase(),
          password: password,
          name: cleanName || 'Hunter',
          player: newPlayer
        };

        localUsers.push(newUser);
        localStorage.setItem('solo_system_local_users', JSON.stringify(localUsers));

        const localToken = 'solo_local_token_' + Date.now();
        localStorage.setItem('hunter_token', localToken);
        localStorage.setItem('hunter_session_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
        localStorage.setItem('hunter_is_onboarded', 'true');
        localStorage.setItem('isOnboarded', 'true');
        localStorage.setItem('hunter_onboarding_profile', JSON.stringify(newPlayer));

        playSystemSound('levelUp');
        if (onAuthSuccess) {
          onAuthSuccess({ token: localToken, user: newUser, player: newPlayer });
        }
        return;
      } else {
        // Mode is login
        const existing = localUsers.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
        if (!existing) {
          playSystemSound('penalty');
          setErrorMessage('Hunter account not found on this device. Please click "REGISTER" above to awaken your account, or use Instant Guest Access.');
          setLoading(false);
          return;
        }

        if (existing.password !== password) {
          playSystemSound('penalty');
          setErrorMessage('Incorrect password. Please verify your credentials.');
          setLoading(false);
          return;
        }

        const localToken = 'solo_local_token_' + Date.now();
        localStorage.setItem('hunter_token', localToken);
        localStorage.setItem('hunter_session_expiry', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
        localStorage.setItem('hunter_is_onboarded', 'true');
        localStorage.setItem('isOnboarded', 'true');
        localStorage.setItem('hunter_onboarding_profile', JSON.stringify(existing.player));

        playSystemSound('levelUp');
        if (onAuthSuccess) {
          onAuthSuccess({ token: localToken, user: existing, player: existing.player });
        }
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    playSystemSound('levelUp');
    const guestUser = {
      id: 'guest_hunter_001',
      email: 'jinwoo@monarch.system',
      name: 'Sung Jinwoo'
    };
    const guestPlayer = {
      name: 'Sung Jinwoo',
      level: 1,
      rank: 'E-Rank',
      title: 'Wolf Slayer',
      exp: 45,
      goldCoins: 250,
      stats: { STR: 12, VIT: 12, MEN: 10, DIS: 10 },
      availableStatPoints: 3,
      currentWeight: 72,
      targetWeight: 68,
      startWeight: 75,
      dailyCalorieTarget: 2200,
      dailyProteinTarget: 150,
      isSetupComplete: true,
      isOnboarded: true
    };
    const mockToken = 'mock_guest_token_' + Date.now();
    localStorage.setItem('hunter_token', mockToken);
    const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem('hunter_session_expiry', expiryTime.toString());
    localStorage.setItem('hunter_is_onboarded', 'true');
    localStorage.setItem('isOnboarded', 'true');
    localStorage.setItem('hunter_onboarding_profile', JSON.stringify(guestPlayer));

    if (onAuthSuccess) {
      onAuthSuccess({ token: mockToken, user: guestUser, player: guestPlayer });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMessage('');
    setLoading(true);
    playSystemSound('click');

    try {
      const payload = decodeJwt(credentialResponse.credential);
      const googleUser = {
        googleId: payload?.sub || `google_${Date.now()}`,
        email: payload?.email || 'hunter@monarch.io',
        name: payload?.name || 'Player',
        avatarUrl: payload?.picture || ''
      };

      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleUser)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google Login failed');
      }

      playSystemSound('levelUp');
      localStorage.setItem('hunter_token', data.token);
      const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('hunter_session_expiry', expiryTime.toString());

      if (onAuthSuccess) {
        onAuthSuccess(data);
      }
    } catch (err) {
      console.error('[GOOGLE AUTH ERROR]:', err);
      playSystemSound('penalty');
      setErrorMessage(err.message || 'Google OAuth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-3 sm:p-4 animate-fade-in select-none">
      <div 
        className="relative w-full max-w-md bg-[#060b17] border-2 border-[var(--glow)] p-5 sm:p-6 shadow-[0_0_40px_rgba(45,212,255,0.5)] text-left space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar"
        style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))' }}
      >
        {/* HEADER BADGE */}
        <div className="font-['Orbitron'] text-[10px] sm:text-[11px] tracking-[3px] text-[var(--glow)] uppercase flex justify-between">
          <span>[ SYSTEM ACCESS PROTOCOL ]</span>
          <span className="text-[var(--gold)]">S-RANK ENCRYPTION</span>
        </div>

        <div className="text-center py-1">
          <div className="font-['Orbitron'] text-xl sm:text-2xl font-black text-white tracking-widest uppercase">
            {mode === 'login' ? 'HUNTER AUTHENTICATION' : 'SYSTEM AWAKENING REGISTRATION'}
          </div>
          <div className="text-xs text-[var(--text-dim)] font-['Share_Tech_Mono'] mt-1">
            Authenticate your Hunter credentials to enter the Shadow System.
          </div>
        </div>

        {/* HELPER NOTE */}
        {mode === 'register' && (
          <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-['Share_Tech_Mono'] text-xs leading-relaxed flex items-start gap-2">
            <span className="text-cyan-400 font-bold shrink-0">ℹ️</span>
            <span>Create a new password for this app. Do NOT enter your personal email password.</span>
          </div>
        )}

        {/* MODE TOGGLE BUTTONS */}
        <div className="flex border border-[var(--line)] bg-[#0a0f1c] p-1 rounded-sm">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(''); }}
            className={`flex-1 font-['Orbitron'] text-xs py-2 tracking-wider uppercase transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[var(--glow)] text-[#04141c] font-bold shadow-[0_0_10px_rgba(45,212,255,0.4)]'
                : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            🔑 LOGIN
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(''); }}
            className={`flex-1 font-['Orbitron'] text-xs py-2 tracking-wider uppercase transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[var(--purple)] text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            ⚡ REGISTER
          </button>
        </div>

        {/* ERROR ALARM BANNER */}
        {errorMessage && (
          <div className="p-3 bg-red-950/90 border border-red-500 text-red-300 font-['Orbitron'] text-xs tracking-wider animate-pulse flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="shrink-0 font-bold">[ SYSTEM ERROR ]:</span>
              <span className="break-words flex-1 font-mono text-xs">{errorMessage}</span>
            </div>
            {errorMessage.toLowerCase().includes('register') && mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(''); }}
                className="mt-1 bg-purple-900/70 hover:bg-purple-800 border border-purple-400 text-purple-200 py-1.5 px-3 text-[11px] font-['Orbitron'] tracking-wider uppercase transition-all cursor-pointer text-left flex items-center gap-2"
              >
                <span>⚡</span>
                <span>Click here to SWITCH TO REGISTER TAB</span>
              </button>
            )}
            {(errorMessage.toLowerCase().includes('backend') || errorMessage.toLowerCase().includes('network')) && (
              <button
                type="button"
                onClick={handleGuestAccess}
                className="mt-1 bg-cyan-900/70 hover:bg-cyan-800 border border-cyan-400 text-cyan-200 py-1.5 px-3 text-[11px] font-['Orbitron'] tracking-wider uppercase transition-all cursor-pointer text-left flex items-center gap-2"
              >
                <span>⚔️</span>
                <span>Click here to ENTER AS GUEST HUNTER (DEMO MODE)</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 font-['Rajdhani']">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-['Orbitron'] text-[var(--glow)] mb-1 uppercase">
                FULL NAME / HUNTER CODENAME:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Iron Sovereign"
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-sm outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono']"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-['Orbitron'] text-cyan-300 mb-1 uppercase">
              EMAIL ADDRESS:
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hunter@monarch.io"
              className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 text-sm outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono']"
            />
          </div>

          <div>
            <label className="block text-xs font-['Orbitron'] text-purple-300 mb-1 uppercase">
              {mode === 'register' ? 'NEW PASSWORD:' : 'PASSWORD:'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 pr-10 text-sm outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono']"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-white transition-colors cursor-pointer text-xs p-1"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-['Orbitron'] text-purple-300 mb-1 uppercase">
                CONFIRM PASSWORD:
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0a0f1c] border border-[var(--line)] text-white p-2.5 pr-10 text-sm outline-none focus:border-[var(--glow)] font-['Share_Tech_Mono']"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-white transition-colors cursor-pointer text-xs p-1"
                  title={showConfirmPassword ? "Hide Password" : "Show Password"}
                >
                  {showConfirmPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--glow-dim)] hover:bg-[var(--glow)] text-[#04141c] font-['Orbitron'] font-extrabold text-xs tracking-[2px] py-3 uppercase transition-all shadow-[0_0_20px_rgba(45,212,255,0.5)] cursor-pointer"
          >
            {loading ? '[ TRANSMITTING CREDENTIALS... ]' : mode === 'login' ? '[ ACCESS SYSTEM ]' : '[ AWAKEN HUNTER ACCOUNT ]'}
          </button>
        </form>

        {/* INSTANT GUEST PASS ACCESS */}
        <div className="pt-1">
          <div className="flex items-center my-2 gap-2">
            <div className="h-[1px] bg-[var(--line)] flex-1"></div>
            <span className="text-[10px] font-['Orbitron'] text-[var(--gold)] uppercase tracking-wider">OR QUICK ACCESS</span>
            <div className="h-[1px] bg-[var(--line)] flex-1"></div>
          </div>

          <button
            type="button"
            onClick={handleGuestAccess}
            className="w-full bg-[#0a1220] hover:bg-[#111e33] border border-[var(--gold)]/70 text-[var(--gold)] font-['Orbitron'] font-bold text-xs tracking-[2px] py-2.5 uppercase transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:shadow-[0_0_20px_rgba(255,215,0,0.45)] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>⚔️</span>
            <span>ENTER AS GUEST HUNTER (INSTANT ACCESS)</span>
          </button>
        </div>

        {/* OFFICIAL GOOGLE OAUTH (CONDITIONALLY RENDERED ONLY WHEN VALID CLIENT ID IS SET) */}
        {isGoogleConfigured && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center my-2 gap-2">
              <div className="h-[1px] bg-[var(--line)] flex-1"></div>
              <span className="text-[10px] font-['Orbitron'] text-[var(--text-dim)] uppercase">OR CONNECT WITH GOOGLE</span>
              <div className="h-[1px] bg-[var(--line)] flex-1"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.warn('[SYSTEM OAUTH NOTICE]: Google login popup closed or unconfigured. Defaulting to local email/JWT authentication.')}
                theme="filled_dark"
                shape="square"
                text="signin_with"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
