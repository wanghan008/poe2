document.addEventListener('DOMContentLoaded', function() {
    const languageOptions = document.querySelectorAll('.language-option');
    const statusMsg = document.getElementById('status-msg');
    const openSettings = document.getElementById('open-settings');

    function updateLanguageUI(currentLang) {
        languageOptions.forEach(option => {
            const lang = option.dataset.lang;
            const checkMark = option.querySelector('.check-mark');
            if (lang === currentLang) {
                option.classList.add('selected');
                if (checkMark) checkMark.style.display = 'inline';
            } else {
                option.classList.remove('selected');
                if (checkMark) checkMark.style.display = 'none';
            }
        });
    }

    function showStatus(message, duration) {
        if (!duration) duration = 2000;
        statusMsg.textContent = message;
        statusMsg.classList.add('show');
        setTimeout(() => {
            statusMsg.classList.remove('show');
        }, duration);
    }

    function refreshCurrentTab() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    }

    chrome.storage.local.get(['language'], function(result) {
        const currentLang = result.language || 'zh_cn';
        updateLanguageUI(currentLang);
    });

    languageOptions.forEach(option => {
        option.addEventListener('click', function() {
            const lang = this.dataset.lang;
            
            chrome.storage.local.set({ 
                language: lang,
                updated: Date.now()
            }, function() {
                updateLanguageUI(lang);
                showStatus('语言已切换，正在刷新页面...');
                setTimeout(refreshCurrentTab, 500);
            });
        });
    });

    openSettings.addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
});
