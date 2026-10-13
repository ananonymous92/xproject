/* Theme Engine (Light / Dark & Auto Day/Night)
 * Waktu Siang: 06:00 - 18:00 -> Light Mode
 * Waktu Malam: 18:00 - 06:00 -> Dark Mode
 */
(() => {
  const getAutoTheme = () => {
    const h = new Date().getHours();
    return (h >= 6 && h < 18) ? 'light' : 'dark';
  };

  const getSavedTheme = () => {
    try {
      return localStorage.getItem('xp_theme');
    } catch (e) {
      return null;
    }
  };

  const applyTheme = (theme) => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  };

  // 1. Eksekusi langsung di <head> tanpa menunggu DOM selesai (menghindari flash of wrong theme)
  const initialTheme = getSavedTheme() || getAutoTheme();
  applyTheme(initialTheme);

  // 2. Setup UI Tombol & Event Listener setelah DOM siap
  const initThemeUI = () => {
    const toggle = document.getElementById('themeToggle');
    const text = document.getElementById('themeText');

    const updateUI = (theme) => {
      applyTheme(theme);
      if (toggle) {
        const isManual = !!getSavedTheme();
        const label = theme === 'light' ? 'Siang' : 'Malam';
        if (text) {
          text.textContent = isManual ? label : `${label} • Auto`;
        }
        toggle.title = isManual
          ? `Mode ${label} (Klik untuk ganti mode)`
          : `Mode ${label} Otomatis (06.00-18.00 Siang, 18.00-06.00 Malam). Klik untuk ganti.`;
      }
    };

    updateUI(document.documentElement.getAttribute('data-theme') || initialTheme);

    if (toggle) {
      // Hapus listener duplikat bila ada
      toggle.onclick = (e) => {
        e.preventDefault();
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem('xp_theme', next);
        } catch (err) {}
        updateUI(next);
      };
    }

    // Periksa perpindahan waktu otomatis setiap 60 detik jika user belum memilih preferensi manual
    setInterval(() => {
      if (!getSavedTheme()) {
        const auto = getAutoTheme();
        if (document.documentElement.getAttribute('data-theme') !== auto) {
          updateUI(auto);
        }
      }
    }, 60000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeUI);
  } else {
    initThemeUI();
  }
})();
