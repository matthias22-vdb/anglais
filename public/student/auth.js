(() => {
  'use strict';
  const config = window.ENGLISH_POCKET_CONFIG;
  const screen = document.getElementById('login-screen');
  const shell = document.getElementById('app-shell');
  const secureLogin = document.getElementById('secure-login');
  const classForm = document.getElementById('class-form');
  const classCode = document.getElementById('class-code');
  const error = document.getElementById('login-error');
  const intro = document.getElementById('login-intro');
  const invitation = new URLSearchParams(window.location.search).get('classe') || '';
  const invitationCode = /^[A-Z0-9]{6}$/i.test(invitation) ? invitation.toUpperCase() : '';
  let identity = null;
  if (invitationCode) {
    classCode.value = invitationCode;
    secureLogin.href = '/login?return_to=' + encodeURIComponent('/student/index.html?classe=' + invitationCode);
    intro.textContent = 'Ton professeur t’invite à rejoindre sa classe. Connecte-toi, puis confirme ton inscription.';
  }

  document.getElementById('login-product').textContent = config.productName;

  function offerRecovery() {
    if (!identity?.testMode) return;
    const panel = document.getElementById('recovery-panel');
    const button = document.getElementById('recover-local');
    const label = document.getElementById('recovery-local-text');
    const prefix = 'toeic-pocket-stage1-v1:user:';
    const currentKey = prefix + encodeURIComponent(identity.userId);
    let previous = null;
    let count = 0;
    try {
      const current = JSON.parse(localStorage.getItem(currentKey) || 'null') || identity.remoteState;
      if (current && current.answers && Object.keys(current.answers).length > 0) return;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== 'toeic-pocket-stage1-v1' && (!key?.startsWith(prefix) || key === currentKey)) continue;
        const saved = JSON.parse(localStorage.getItem(key) || 'null');
        const size = saved?.answers && typeof saved.answers === 'object' && !Array.isArray(saved.answers)
          ? Object.keys(saved.answers).length : 0;
        if (size > count && size <= 500) { previous = saved; count = size; }
      }
    } catch { previous = null; }
    panel.hidden = false;
    if (previous) {
      label.textContent = `${count} question${count > 1 ? 's' : ''} déjà travaillée${count > 1 ? 's' : ''} ${count > 1 ? 'ont' : 'a'} été retrouvée${count > 1 ? 's' : ''} dans ce navigateur.`;
      label.hidden = false;
      button.hidden = false;
      button.onclick = () => {
        try {
          localStorage.setItem(currentKey, JSON.stringify(previous));
          window.location.reload();
        } catch {
          label.textContent = 'Restauration impossible sur cet appareil. Utilise ton ancien compte ci-dessous.';
          button.hidden = true;
        }
      };
    }
  }

  async function openApp() {
    if (!identity || typeof identity.userId !== 'string' || !identity.userId) {
      showLogin();
      error.textContent = 'Ton identité n’a pas pu être vérifiée. Reconnecte-toi.';
      error.hidden = false;
      return;
    }
    window.PocketSync?.bind(identity.userId);
    try {
      const response = await fetch('/api/progress', { headers: { accept: 'application/json' } });
      if (response.ok) {
        const result = await response.json();
        identity.remoteState = result.state || null;
      }
    } catch {
      identity.remoteState = null;
    }
    window.PocketApp?.start(identity);
    screen.hidden = true;
    shell.hidden = false;
    offerRecovery();
    document.getElementById('sentence').focus({ preventScroll: true });
  }

  function showLogin() {
    shell.hidden = true;
    screen.hidden = false;
    secureLogin.hidden = false;
    classForm.hidden = true;
    error.hidden = true;
  }

  function showClassForm(name) {
    shell.hidden = true;
    screen.hidden = false;
    secureLogin.hidden = true;
    classForm.hidden = false;
    intro.textContent = invitationCode
      ? `Bonjour ${name}. Le code de ta classe est déjà rempli. Appuie sur « Rejoindre ma classe » pour confirmer.`
      : `Bonjour ${name}. Colle le code de ton professeur dans « Code de ma classe », ou ouvre son lien d’accès.`;
    classCode.focus();
  }

  async function enterTestTraining() {
    const response = await fetch('/api/demo/enter', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'role=student',
    });
    if (!response.ok) throw new Error('Accès de test indisponible');
  }

  async function checkAccount() {
    try {
      let response = await fetch('/api/student/me', { headers: { accept: 'application/json' } });
      if (response.status === 401) {
        await enterTestTraining();
        response = await fetch('/api/student/me', { headers: { accept: 'application/json' } });
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Connexion indisponible');
      if (typeof result.userId !== 'string' || !result.userId) throw new Error('Identité manquante');
      if (invitationCode && result.isTeacher && result.testMode) {
        await enterTestTraining();
        const studentResponse = await fetch('/api/student/me', { headers: { accept: 'application/json' } });
        if (!studentResponse.ok) throw new Error('Accès élève indisponible');
        Object.assign(result, await studentResponse.json());
      }
      if (result.mustChangePassword === true) {
        window.location.replace('/change-password?return_to=' + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }
      identity = { userId: result.userId, legacyStorageOwner: result.legacyStorageOwner === true, testMode: result.testMode === true };
      if (result.class || (result.testMode && !invitationCode) || (result.isTeacher && !invitationCode)) await openApp();
      else showClassForm(result.displayName || '');
    } catch {
      showLogin();
      error.textContent = 'La connexion est temporairement indisponible. Réessaie dans quelques instants.';
      error.hidden = false;
    }
  }

  classForm.onsubmit = async event => {
    event.preventDefault();
    error.hidden = true;
    const code = classCode.value.trim().toUpperCase();
    if (!code) { openApp(); return; }
    try {
      const response = await fetch('/api/student/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Code incorrect');
      await openApp();
    } catch (cause) {
      error.textContent = cause instanceof Error ? cause.message : 'Impossible de rejoindre la classe.';
      error.hidden = false;
      classCode.focus();
    }
  };

  document.getElementById('skip-class').onclick = () => { void openApp(); };
  document.getElementById('logout').onclick = async () => {
    if (identity?.testMode) { window.location.assign('/'); return; }
    window.PocketSync?.cancel();
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    window.location.replace('/');
  };

  checkAccount();
})();
