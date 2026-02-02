// --- НАСТРОЙКИ ---
var ALL_LANGUAGES = ['base', 'ru', 'en', 'es']; 
var DISPLAY_LANGS = ['en', 'es', 'ru', 'de', 'fr', 'it', 'zh']; 
var SUPPORT_BOT_URL = 'https://t.me/EsperoKontakto_bot'; 

// По умолчанию английский
var currentLang = 'en';

// --- 1. ЗАГРУЗЧИК СЛОВАРЕЙ ---
(function loadDictionaries() {
    var path = 'languages/';
    var loc = window.location.pathname;
    // Если мы внутри папки (stories, welcome...), выходим на уровень выше
    if (loc.indexOf('/stories/') !== -1 || loc.indexOf('/welcome/') !== -1 || loc.indexOf('/news/') !== -1 || loc.indexOf('/jokes/') !== -1) {
        path = '../languages/';
    }
    
    // Загружаем все словари
    ALL_LANGUAGES.forEach(function(lang) {
        var script = document.createElement('script');
        script.src = path + lang + '.js';
        script.async = false; 
        document.head.appendChild(script);
    });
})();

// --- 2. ИНИЦИАЛИЗАЦИЯ ---
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

// Пытаемся вспомнить выбор пользователя
try {
    var saved = localStorage.getItem('user_lang');
    // Проверяем, что сохраненный язык реально существует в нашем списке
    if (saved && DISPLAY_LANGS.indexOf(saved) !== -1) {
        currentLang = saved;
    }
} catch(e) {}

// --- 3. ЗАПУСК ПОСЛЕ ЗАГРУЗКИ СТРАНИЦЫ ---
window.onload = function() {
    // Логика транзита (если это index.html)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        var startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
        if (!startParam || startParam === 'welcome') {
            window.location.href = 'welcome/welcome.html';
        } else {
            window.location.href = 'stories/' + startParam + '.html';
        }
        return; 
    }

    // Обычная страница: Рисуем интерфейс
    renderMenu();
    updateUI(); // <--- ВОТ ЭТО КРАСИТ КНОПКИ
};

// --- ФУНКЦИИ ИНТЕРФЕЙСА ---
function renderMenu() {
    var container = document.getElementById('lang-bar');
    if (!container) return;
    
    var html = '<div class="support-btn" onclick="openSupport()">💬</div><div class="lang-btns-wrap">';
    DISPLAY_LANGS.forEach(function(lang) {
        // Создаем кнопку с ID, чтобы потом её найти
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
    // Сохраняем выбор навсегда
    try { localStorage.setItem('user_lang', lang); } catch(e) {}
    
    updateUI(); // Перекрашиваем кнопки
    
    // Если шторка открыта - обновляем перевод на лету
    var title = document.getElementById('sheet-word').innerText;
    if (title && typeof LEGO_BASE !== 'undefined') {
        for (var key in LEGO_BASE) {
            if (LEGO_BASE[key].word === title) { openWord(key); break; }
        }
    }
}

function updateUI() {
    // Пробегаем по всем кнопкам и красим нужную
    DISPLAY_LANGS.forEach(function(lang) {
        var btn = document.getElementById('btn-' + lang);
        if (btn) {
            if (lang === currentLang) {
                btn.className = 'lang-btn active'; // Синий
            } else {
                btn.className = 'lang-btn'; // Серый
            }
        }
    });
}

// --- ОТКРЫТИЕ СЛОВА ---
function openWord(key) {
    if (typeof LEGO_BASE === 'undefined') return;
    var baseData = LEGO_BASE[key];
    if (!baseData) return;

    try { window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); } catch(e) {}

    // Ищем перевод
    var trans = "---";
    var dictName = 'DICT_' + currentLang.toUpperCase(); // DICT_EN
    var dict = window[dictName];
    
    if (dict && dict[key]) {
        trans = dict[key].text;
    } else {
        // Запасной: EN или RU
        if (typeof DICT_EN !== 'undefined' && DICT_EN[key]) trans = DICT_EN[key].text;
        else if (typeof DICT_RU !== 'undefined' && DICT_RU[key]) trans = DICT_RU[key].text;
    }

    // LEGO разбор
    var legoHTML = '';
    if (baseData.parts) {
        for (var i=0; i<baseData.parts.length; i++) {
            var partName = baseData.parts[i];
            var partMeaning = "";
            
            if (dict && dict[key] && dict[key].roots) partMeaning = dict[key].roots[i];
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
