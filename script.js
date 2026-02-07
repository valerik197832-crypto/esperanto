// --- НАСТРОЙКИ ---
var ALL_LANGUAGES = ['base', 'ru', 'en', 'es', 'pt', 'de', 'fr', 'it', 'zh']; 
var DISPLAY_LANGS = ['en', 'es', 'pt', 'ru', 'de', 'fr', 'it', 'zh']; 
var SUPPORT_BOT_URL = 'https://t.me/EsperoKontakto_bot'; 

var currentLang = 'en';

// Единообразный перевод: "Перевод отсутствует" (Subject + Predicate)
var MISSING_PHRASES = {
    'en': 'Translation missing',
    'ru': 'Перевод отсутствует',
    'es': 'Traducción ausente',    // Исправлено (было Falta traducción)
    'pt': 'Tradução ausente',      // Исправлено (было Tradução faltando)
    'de': 'Übersetzung fehlt',
    'fr': 'Traduction manquante',
    'it': 'Traduzione mancante',
    'zh': '翻译缺失'               // Исправлено (было 缺少翻译)
};

// --- ЗАГРУЗЧИК ---
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
    if (saved && DISPLAY_LANGS.includes(saved)) currentLang = saved;
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
    renderSupportBtn();
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

// Кнопка поддержки (в правом нижнем углу)
function renderSupportBtn() {
    // Проверка, чтобы не создавать кнопку дважды
    if (document.querySelector('.support-btn.floating')) return;

    var btn = document.createElement('div');
    btn.className = 'support-btn floating'; // Добавил класс для отличия от кнопки в меню
    btn.innerHTML = '💬'; 
    btn.onclick = openSupport;
    // Мы решили оставить кнопку только в меню, или плавающую тоже?
    // В style.css у нас прописана .support-btn как fixed.
    // В renderMenu мы уже добавили кнопку.
    // Если мы хотим кнопку ТОЛЬКО в меню (сверху), то эту функцию renderSupportBtn можно удалить из onload.
    // Но судя по прошлому разговору, ты хотел кнопку в меню.
    // Давай оставим только в меню, чтобы не дублировать.
    
    // UPD: В прошлом коде я добавлял кнопку в body. Сейчас она в меню.
    // Удаляю вызов renderSupportBtn из window.onload, так как кнопка уже рендерится внутри renderMenu.
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

function openWord(key) {
    if (typeof LEGO_BASE === 'undefined') return;
    var baseData = LEGO_BASE[key];
    if (!baseData) return;

    try { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch(e) {}

    var dictName = 'DICT_' + currentLang.toUpperCase();
    var dict = window[dictName];
    
    var wordData = (dict && dict[key]) ? dict[key] : null;

    var elWord = document.getElementById('sheet-word');
    var elTrans = document.getElementById('sheet-trans');
    var elLego = document.getElementById('sheet-lego');

    elWord.textContent = baseData.word;

    if (wordData) {
        // --- ПЕРЕВОД ЕСТЬ ---
        elTrans.textContent = wordData.text;
        
        var legoHTML = '';
        if (baseData.parts) {
            for (var i=0; i<baseData.parts.length; i++) {
                var partMeaning = wordData.roots[i];
                if (!partMeaning) {
                    if (typeof DICT_EN !== 'undefined' && DICT_EN[key]) partMeaning = DICT_EN[key].roots[i];
                    else if (typeof DICT_RU !== 'undefined' && DICT_RU[key]) partMeaning = DICT_RU[key].roots[i];
                }
                legoHTML += '<div class="lego-row"><span class="lego-part">' + baseData.parts[i] + '</span><span>' + (partMeaning || '') + '</span></div>';
            }
        }
        var titles = { 'ru':'Конструктор:', 'en':'LEGO-Analysis:', 'es':'Análisis LEGO:', 'pt':'Análise LEGO:', 'de':'Analyse:', 'fr':'Analyse:', 'it':'Analisi:', 'zh':'分析:' };
        var title = titles[currentLang] || 'LEGO:';
        
        elLego.innerHTML = '<div style="font-size:12px;color:#999;font-weight:bold;margin-bottom:10px;">'+title+'</div>' + legoHTML;

    } else {
        // --- ПЕРЕВОДА НЕТ ---
        elTrans.textContent = "???";
        var missingText = MISSING_PHRASES[currentLang] || 'Translation missing';
        
        // Тут поменяли заголовок на "Traduko mankas"
        elLego.innerHTML = 
            '<div class="missing-box">' +
                '<div class="missing-title">Traduko mankas</div>' +
                '<div class="missing-subtitle">' + missingText + '</div>' +
                '<div class="sheet-support-btn" onclick="openSupport()">💬</div>' +
            '</div>';
    }
    
    document.getElementById('sheet').classList.add('open');
    document.getElementById('overlay').classList.add('show');
}

function closeSheet() {
    document.getElementById('sheet').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
}