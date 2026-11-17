/**
 * PWA Controller - Projeto Acessibilidade
 * Gerencia Service Worker, Instalação no Android/iOS e Atalhos Standalone
 */

(function () {
  'use strict';

  // 1. Registro do Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado. Escopo:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Erro ao registrar Service Worker:', err);
        });
    });
  }

  // 2. Detecção de Ambiente Mobile e Standalone
  const isStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  };

  const isIos = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !window.MSStream;
  };

  const isAndroid = () => {
    return /android/i.test(window.navigator.userAgent);
  };

  if (isStandalone()) {
    document.documentElement.classList.add('pwa-standalone');
    document.body.classList.add('pwa-standalone');
  }

  // 3. Captura do Evento de Instalação (Android / Chromium)
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Exibe banner de instalação se não estiver em standalone e não tiver sido dispensado
    if (!isStandalone() && !sessionStorage.getItem('pwa_install_dismissed')) {
      showInstallBanner('android');
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Aplicativo instalado com sucesso!');
    hideInstallBanner();
    deferredPrompt = null;
    showToast('Aplicativo instalado com sucesso na sua tela inicial! 🎉');
  });

  // 4. Verificação para iOS (Safari não emite beforeinstallprompt)
  window.addEventListener('load', () => {
    if (isIos() && !isStandalone() && !sessionStorage.getItem('pwa_install_dismissed')) {
      // Exibe dica para iOS após 2.5 segundos de navegação
      setTimeout(() => {
        if (!isStandalone() && !sessionStorage.getItem('pwa_install_dismissed')) {
          showInstallBanner('ios');
        }
      }, 2500);
    }
  });

  // 5. Interface Visual do Banner de Instalação PWA
  function showInstallBanner(platform) {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Instalar aplicativo');

    const isIosPlatform = platform === 'ios';

    banner.innerHTML = `
      <div class="pwa-banner-card">
        <div class="pwa-banner-left">
          <img src="assets/icons/icon-96x96.png" alt="Ícone Projeto Acessibilidade" class="pwa-banner-icon" width="48" height="48">
          <div class="pwa-banner-text">
            <div class="pwa-banner-title">Instalar Projeto Acessibilidade</div>
            <div class="pwa-banner-desc">
              ${
                isIosPlatform
                  ? 'No iPhone: toque em <strong>Compartilhar <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; display: inline-block;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></strong> e selecione <strong>"Adicionar à Tela de Início"</strong>.'
                  : 'Instale na sua tela inicial para usar como aplicativo nativo, sem barras de navegador.'
              }
            </div>
          </div>
        </div>
        <div class="pwa-banner-actions">
          ${
            !isIosPlatform
              ? `<button type="button" id="pwa-btn-install" class="pwa-btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span>Instalar</span>
                </button>`
              : `<button type="button" id="pwa-btn-gotit" class="pwa-btn-primary">
                  <span>Entendi</span>
                </button>`
          }
          <button type="button" id="pwa-btn-dismiss" class="pwa-btn-close" aria-label="Fechar aviso">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Eventos dos botões
    const btnInstall = document.getElementById('pwa-btn-install');
    if (btnInstall) {
      btnInstall.addEventListener('click', async () => {
        if (!deferredPrompt) {
          showToast('Abra as opções do navegador e clique em "Instalar aplicativo" ou "Adicionar à tela inicial".');
          hideInstallBanner();
          return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] Escolha do usuário:', outcome);
        deferredPrompt = null;
        hideInstallBanner();
      });
    }

    const btnGotit = document.getElementById('pwa-btn-gotit');
    if (btnGotit) {
      btnGotit.addEventListener('click', () => {
        hideInstallBanner();
      });
    }

    const btnDismiss = document.getElementById('pwa-btn-dismiss');
    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        sessionStorage.setItem('pwa_install_dismissed', 'true');
        hideInstallBanner();
      });
    }
  }

  function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(20px)';
      setTimeout(() => banner.remove(), 250);
    }
  }

  // 6. Suporte aos Atalhos do App (Deep Linking)
  function handleDeepLinkShortcut() {
    const hash = window.location.hash.toLowerCase();
    if (!hash) return;

    if (hash === '#types' || hash.includes('types')) {
      const btn = document.getElementById('btn-goto-types');
      if (btn) btn.click();
    } else if (hash === '#test' || hash.includes('test')) {
      const btn = document.getElementById('btn-start-test');
      if (btn) {
        btn.click();
      } else {
        const gotoTypes = document.getElementById('btn-goto-types');
        if (gotoTypes) {
          gotoTypes.click();
          setTimeout(() => {
            const startTest = document.getElementById('btn-start-test');
            if (startTest) startTest.click();
          }, 150);
        }
      }
    } else if (hash === '#adaptation' || hash.includes('adaptation')) {
      const btn = document.getElementById('btn-adaptation');
      if (btn) btn.click();
    }
  }

  window.addEventListener('load', handleDeepLinkShortcut);
  window.addEventListener('hashchange', handleDeepLinkShortcut);

  // 7. Notificações Online / Offline
  window.addEventListener('online', () => {
    showToast('Conexão restabelecida. Modo online.');
  });

  window.addEventListener('offline', () => {
    showToast('Modo offline ativado. O aplicativo continua funcionando normalmente.', 4000);
  });

  // Função utilitária de toast não intrusiva
  function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-info';
    toast.innerHTML = `
      <div class="toast-content">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>${message}</span>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
})();
