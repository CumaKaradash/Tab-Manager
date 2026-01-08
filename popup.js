document.addEventListener('DOMContentLoaded', async () => {
  const tabList = document.getElementById('tab-list');
  const statsText = document.getElementById('stats');

  async function updateTabList() {
    // Tüm sekmeleri çek
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    // Domain'e göre gruplandır
    const groups = {};
    tabs.forEach(tab => {
      try {
        const url = new URL(tab.url);
        const domain = url.hostname.replace('www.', '');
        if (!groups[domain]) {
          groups[domain] = {
            domain: domain,
            tabs: [],
            favicon: tab.favIconUrl || `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(tab.url)}&size=32`
          };
        }
        groups[domain].tabs.push(tab.id);
      } catch (e) {
        // chrome:// gibi özel sayfalar için hata payı
        const domain = 'Sistem Sayfaları';
        if (!groups[domain]) {
          groups[domain] = { domain, tabs: [], favicon: '' };
        }
        groups[domain].tabs.push(tab.id);
      }
    });

    // Listeyi temizle
    tabList.innerHTML = '';
    
    // İstatistikleri güncelle
    statsText.textContent = `Toplam: ${tabs.length} Sekme`;

    // Grupları listele (Sekme sayısına göre azalan sırada)
    const sortedGroups = Object.values(groups).sort((a, b) => b.tabs.length - a.tabs.length);

    sortedGroups.forEach(group => {
      const card = document.createElement('div');
      card.className = 'tab-card';
      
      card.innerHTML = `
        <div class="tab-info">
          <img src="${group.favicon}" class="favicon">
          <div class="domain-details">
            <span class="domain-name">${group.domain}</span>
            <span class="tab-count">${group.tabs.length} Sekme</span>
          </div>
        </div>
        <button class="close-btn" data-ids='${JSON.stringify(group.tabs)}'>Hepsini Kapat</button>
      `;

      // Favicon yükleme hatası durumunda Google favicon servisini kullan
      const img = card.querySelector('.favicon');
      img.addEventListener('error', () => {
        img.src = `https://www.google.com/s2/favicons?domain=${group.domain}`;
      });

      // Kapatma butonu işlevi
      card.querySelector('.close-btn').addEventListener('click', async (e) => {
        const ids = JSON.parse(e.target.getAttribute('data-ids'));
        await chrome.tabs.remove(ids);
        updateTabList(); // Listeyi yenile
      });

      tabList.appendChild(card);
    });

    if (tabs.length === 0) {
      tabList.innerHTML = '<div class="loading">Açık sekme bulunamadı.</div>';
    }
  }

  // İlk yükleme
  updateTabList();
});
