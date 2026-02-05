// --- НАСТРОЙКИ ---
var ALL_LANGUAGES = ['base', 'ru', 'en', 'es', 'pt', 'de', 'fr', 'it', 'zh']; 
var DISPLAY_LANGS = ['en', 'es', 'pt', 'ru', 'de', 'fr', 'it', 'zh']; 
var SUPPORT_BOT_URL = 'https://t.me/EsperoKontakto_bot'; 
var currentLang = 'en';

// --- ЗАГРУЗЧИК СЛОВАРЕЙ ---
(function loadDictionaries() {
    var path = 'languages/';
    var loc = window.location.pathname;
    if (loc.indexOf('/stories/') !== -1 || loc.indexOf('/welcome/') !== -1 || loc.indexOf('/news/') !== -1 || loc.indexOf('/jokes/') !== -1 || loc.indexOf('/quotes/') !== -1) {
        path = '../languages/';
    }
    ALL_LANGUAGES.forEach(function(lang) {
        var script = document.createElement('script');
        script.src = path + lang + '.js';
        script.async = false; 
        document.head.appendChild(script);
    });
})();

window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

try {
    var saved = localStorage.getItem('user_lang');
    if (saved && DISPLAY_LANGS.indexOf(saved) !== -1) currentLang = saved;
} catch(e) {}

window.onload = function() {
    var path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/') || path.endsWith('/esperanto/')) {
        var startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
        if (!startParam || startParam === 'welcome') {
            window.location.href = 'welcome/welcome.html';
        } else if (startParam.startsWith('q_')) {
            window.location.href = 'quotes/' + startParam + '.html';
        } else if (startParam.startsWith('j_')) {
            window.location.href = 'jokes/' + startParam + '.html';
        } else if (startParam.startsWith('n_')) {
            window.location.href = 'news/' + startParam + '.html';
        } else {
            window.location.href = 'stories/' + startParam + '.html';
        }
        return; 
    }
    renderMenu();
    updateUI();
};

function renderMenu() {
    var container = document.getElementById('lang-bar');
    if (!container) return;
    var html = '<div class="support-btn" onclick="openSupport()">💬</div><div class="lang-btns-wrap">';
    DISPLAY_LANGS.forEach(function(lang) {
        html += '<div class="lang-btn" id="btn-' + lang + '" onclick="switchLang(\'' + lang + '\')">' + lang.toUpperCase() + '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
}

function openSupport() { window.Telegram.WebApp.openTelegramLink(SUPPORT_BOT_URL); }

function switchLang(lang) {
    currentLang = lang;
    try { localStorage.setItem('user_lang', lang); } catch(e) {}
    updateUI();
    var title = document.getElementById('sheet-word').textContent;
    if (title && typeof LEGO_BASE !== 'undefined') {
        for (var key in LEGO_BASE) { if (LEGO_BASE[key].word === title) { openWord(key); break; } }
    }
}

function updateUI() {
    DISPLAY_LANGS.forEach(function(lang) {
        var btn = document.getElementById('btn-' + lang);
        if (btn) btn.className = (lang === currentLang) ? 'lang-btn active' : 'lang-btn';
    });
}

// --- НОВАЯ ЛОГИКА С ПРОВЕРКОЙ ПЕРЕВОДА ---
function openWord(key) {
    if (typeof LEGO_BASE === 'undefined') return;
    var baseData = LEGO_BASE[key];
    if (!baseData) return;

    try { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch(e) {}

    var dictName = 'DICT_' + currentLang.toUpperCase();
    var dict = window[dictName];
    
    // Ищем перевод только в выбранном языке!
    var wordData = (dict && dict[key]) ? dict[key] : null;
    
    var trans = "";
    var legoHTML = "";
    var showReportBtn = false;

    if (wordData) {
        // Перевод есть
        trans = wordData.text;
        if (baseData.parts) {
            for (var i=0; i<baseData.parts.length; i++) {
                legoHTML += '<div class="lego-row"><span class="lego-part">' + baseData.parts[i] + '</span><span>' + (wordData.roots[i] || '') + '</span></div>';
            }
        }
    } else {
        // ПЕРЕВОДА НЕТ -> Твоя новая логика
        trans = "???";
        legoHTML = '<div style="text-align:center; padding: 10px; color: #d9534f;">' +
                   'No translation yet / Перевода пока нет<br><br>' +
                   '<button onclick="reportMissing(\''+key+'\')" style="padding:10px; border-radius:8px; border:none; background:#007bff; color:white; font-weight:bold; cursor:pointer;">' +
                   '📢 Raporti mankon (Support)</button></div>';
    }

    var titles = { 'ru':'Конструктор:', 'en':'LEGO-Analysis:', 'es':'Análisis LEGO:' };
    document.getElementById('sheet-word').textContent = baseData.word;
    document.getElementById('sheet-trans').textContent = trans;
    document.getElementById('sheet-lego').innerHTML = '<div style="font-size:12px;color:#999;font-weight:bold;margin-bottom:10px;">'+(titles[currentLang] || 'LEGO:')+'</div>' + legoHTML;
    
    document.getElementById('sheet').classList.add('open');
    document.getElementById('overlay').classList.add('show');
}

// Функция отправки отчета в бот
function reportMissing(word) {
    var msg = "Missing translation for word: " + word + " in language: " + currentLang.toUpperCase();
    window.Telegram.WebApp.openTelegramLink(SUPPORT_BOT_URL + "?start=report_" + word + "_" + currentLang);
}

function closeSheet() {
    document.getElementById('sheet').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
}
