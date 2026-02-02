// --- НАСТРОЙКИ ---
var ALL_LANGUAGES = ['base', 'ru', 'en', 'es']; 
var DISPLAY_LANGS = ['en', 'es', 'ru', 'de', 'fr', 'it', 'zh']; 
var SUPPORT_BOT_URL = 'https://t.me/EsperoKontakto_bot'; 

var currentLang = 'en';

// --- УМНЫЙ ЗАГРУЗЧИК СЛОВАРЕЙ ---
(function loadDictionaries() {
    var path = 'languages/'; // Путь по умолчанию (если файл в корне)
    var loc = window.location.pathname;

    // ИСПРАВЛЕНИЕ: Добавили проверку папки 'welcome'
    if (loc.indexOf('/stories/') !== -1 || 
        loc.indexOf('/welcome/') !== -1 || 
        loc.indexOf('/news/') !== -1 || 
        loc.indexOf('/jokes/') !== -1) {
        
        path = '../languages/'; // Выходим на уровень выше
    }

    ALL_LANGUAGES.forEach(function(lang) {
        var script = document.createElement('script');
        script.src = path + lang + '.js';
        script.async = false; // Грузим строго по очереди
        document.head.appendChild(script);
    });
})();

// --- ЗАПУСК ---
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

try {
    var saved = localStorage.getItem('user_lang');
    if (saved && DISPLAY_LANGS.includes(saved)) currentLang = saved;
} catch(e) {}

// --- ЛОГИКА ТРАНЗИТА (ГЛАВНАЯ ССЫЛКА) ---
var startParam = window.Telegram.WebApp.initDataUnsafe.start_param;

window.onload = function() {
    // Если это index.html (транзит)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        if (!startParam || startParam === 'welcome') {
            window.location.href = 'welcome/welcome.html';
        } else {
            window.location.href = 'stories/' + startParam + '.html';
        }
        return; 
    }

    // Если это обычная страница
    renderMenu();
    renderSupportBtn();
    updateUI();
};

// --- МЕНЮ ---
function renderMenu() {
    var container = document.getElementById('lang-bar');
    if (!container) return;
    
    var html = '';
    html += '<div class="support-btn" onclick="openSupport()">💬</div>';
    html += '<div class="lang-btns-wrap">';
    DISPLAY_LANGS.forEach(function(lang) {
        html += '<div class="lang-btn" id="btn-' + lang + '" onclick="switchLang(\'' + lang + '\')">' + lang.toUpperCase() + '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
}

function openSupport() {
    window.Telegram.WebApp.openTelegramLink(SUPPORT_BOT_URL);
}

function switchLang(lang) {
    currentLang = lang;
    try { localStorage.setItem('user_lang', lang); } catch(e) {}
    updateUI();
    
    // Обновляем открытую шторку
    var title = document.getElementById('sheet-word').innerText;
    if (title && typeof LEGO_BASE !== 'undefined') {
        for (var key in LEGO_BASE) {
            if (LEGO_BASE[key].word === title) { openWord(key); break; }
        }
    }
}

function updateUI() {
    DISPLAY_LANGS.forEach(function(lang) {
        var btn = document.getElementById('btn-' + lang);
        if (btn) btn.className = (lang === currentLang) ? 'lang-btn active' : 'lang-btn';
    });
}

// --- ОТКРЫТИЕ СЛОВА ---
function openWord(key) {
    // Проверка, загрузилась ли база
    if (typeof LEGO_BASE === 'undefined') { 
        console.error('Словарь не найден!'); 
        return; 
    }
    
    var baseData = LEGO_BASE[key];
    if (!baseData) return;

    try { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch(e) {}

    // 1. Перевод слова целиком
    var trans = "---";
    var dictName = 'DICT_' + currentLang.toUpperCase(); // DICT_RU
    var dict = window[dictName];
    
    if (dict && dict[key]) {
        trans = dict[key].text;
    } else {
        // Запасной: EN или RU
        if (typeof DICT_EN !== 'undefined' && DICT_EN[key]) trans = DICT_EN[key].text;
        else if (typeof DICT_RU !== 'undefined' && DICT_RU[key]) trans = DICT_RU[key].text;
    }

    // 2. Разбор корней
    var legoHTML = '';
    if (baseData.parts) {
        for (var i=0; i<baseData.parts.length; i++) {
            var partName = baseData.parts[i];
            var partMeaning = "";
            
            // Ищем перевод корня
            if (dict && dict[key] && dict[key].roots) partMeaning = dict[key].roots[i];
            
            // Запасной для корней
            if (!partMeaning && typeof DICT_EN !== 'undefined' && DICT_EN[key]) partMeaning = DICT_EN[key].roots[i];

            legoHTML += '<div class="lego-row"><span class="lego-part">' + partName + '</span><span>' + (partMeaning || '') + '</span></div>';
        }
    }

    var titles = { 'ru':'Конструктор:', 'en':'LEGO-Analysis:', 'es':'Análisis LEGO:' };
    var title = titles[currentLang] || 'LEGO:';

    document.getElementById('sheet-word').innerText = baseData.word;
    document.getElementById('sheet-trans').innerText = trans;
    document.getElementById('sheet-lego').innerHTML = '<div style="font-size:12px;color:#999;font-weight:bold;margin-bottom:10px;">'+title+'</div>' + legoHTML;
    
    document.getElementById('sheet').classList.add('open');
    document.getElementById('overlay').classList.add('show');
}

function closeSheet() {
    document.getElementById('sheet').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
}
