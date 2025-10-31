// let удалено (у тех, которые ещё раз присваиваются, т.к. ошибка возникает, когда через историю браузера возвращаемся назад, при этом заново загружается из кэша app.js и заново инициализируется, хотя он уже был ранее инициализирован (при первой загрузке страницы), и startOnLoad() уже не срабатывает
verApp = "1.0"; // при изменении значения ОБЯЗАТЕЛЬНО необходимо поменять это значение и в MSU.Ext.Shared.ExtService
domain = "";
hostname = typeof hostname !== 'undefined' && hostname !== "" ? hostname : "";
extHost = typeof extHost !== 'undefined' && extHost !== "" ? extHost : "";
dnsLinks = typeof dnsLinks !== 'undefined' && dnsLinks !== "" ? dnsLinks : ""; // dnslink.msu.linkpc.net // если пусто, то не пытаемся подключиться к другим хостам
isStaticMode = typeof isStaticMode !== 'undefined' && isStaticMode !== "" ? isStaticMode : false;

isAlert = false;
sendExtSPA = true; // подменять, для htmx, расширение отправляемого запроса на .spa

prefix = "";
StaticResourcesHost = typeof StaticResourcesHost !== 'undefined' && StaticResourcesHost !== "" ? StaticResourcesHost : "https://cdn.jsdelivr.net/gh/publish-dt/msu-otk@main"; // надо дополнительно получать этот хост через ajax, т.к. этот CDN может быть недоступен и приложение будет не работоспособно.
cachePathFile = "_cnt";

originalHostname = hostname; // запоминаем изначальный хост, чтобы потом к нему вернуться, после смены на дополнительный хост, когда текущий недоступен




isQuoteRequestVal = false; // получать цитату отдельным запросом
isCldRequestVal = false; // получать данные календаря отдельным запросом (может быть закэширован в отдельный файл)
isOnlineRequestVal = false; // получать количество онлайн-польлзователей отдельным запросом
isExtRequestVal = true; // получать различные динамические данные одним запросом (не кэшируется этот запрос/данные)

urls = []; // полный список доп. хостов, полученные из DNS TXT-записи
newHosts = {}; // список новых/дополнительных хостов (т.к. текущий недоступен). Это не полный список, а только те, к которым уже был выполнен запрос, т.е уже знаем рабочий этот хост или недоступный
isNewHost = false; // установлен новый хост, т.к. текущий недоступен
badHosts = []; // список сбойных/недоступных хостов
queue = []; // очередь сбойных запросов. Они начинают обрабатываться, когда был получен список хостов из DnsLink
numbMinutes = 30; // количество минут, по истечению которых будет сброшен список новых хостов (newHosts)
numbTryLoadImg = {}; // попытки загрузок изображений при ошибке их загрузке
isIE = false;
triggerOnload = "msu-on-get-dns";
isLoaded = false; // признак, что первоначальная загрузка сайта была выполнена
isReadDnsLinks = false; // dnsLinks получен
basePath = '';
minCldYear = 2016;
maxCldYear = new Date().getFullYear();

/* обратный отсчёт */
servTime = undefined;
timeleft = -1; // (в секундах) сколько осталось секунд до ближайшего Посыла
showBlock = false; // вкл/выкл отображение блока обратного отсчёта
diff = 0; // разница между временем на клиенте (в браузере) и на сервере
countStartPosyl = 0; // сколько прошо времени с момента начала Посыла
//counter2 = 0;
countFromLastUpdate = 0; // сколько прошло времени с последнего обновления
rndLeft = 0;
rndCounter = 0; // чтобы не в одно и тоже время все клиенты синхронизировали время обратного отсчёта
period = 5000; // интервал времени (в сек.) для обновления в отображении обратного отсчёта
timerOn = false; // признак активности таймера обратного отсчёта
procBigDiff = false; // начат процесс получения времени с сервера, т.к. сайт находился в спящем режиме
onDebugTimeleft = true; // вкл./выкл. отладчик обратного отсчёта

/** это для периодической отправки запросов для отслеживания, что пользоветель ещё активен на сайте */
startTime = new Date(); // время с начала нового отсчёта отслеживания активности
moveCounter = 0; // счётчик движения мыши на странице, если =0, то пользователь не активен на странице
intervalAddUser = 300000 - 10000; // (млсек.) продолжительность интервала, через которые будет периодически отправляться запрос на подтверждение активности пользователя. 300000 - длительность хэша _!UsersOnline_ (5 мин.); 10000 - это 5 сек. (берётся из period или из every 5s в hx-trigger) + 5 сек. запаса

//MSUDATA_TAG_REGEX = msuMakeTagRegEx('msu-data');

htmx.config.timeout = 15000; // (милисекунды) максимальное время ожидания результата запроса (15 сек., т.к. очень долго может выполняться запрос к S3)



/*document.querySelector('.header').style.setProperty("--header-background", "url('" + StaticResourcesHost + "/_content/msu.view.otk/img/header.jpg')");
document.querySelector('body').style.setProperty("--body-background", "url('" + StaticResourcesHost + "/_content/msu.view.otk/img/stars.gif')");*/

document.baseURI = getBaseURI();
//basePath = getBasePath(); этот код перенесён в самый низ, т.к. в IE11 сначала должна инициализироваться функция window.URL = function (которая используется в getBasePath())


/*  -------------  Функции первоначальной загрузки  -------------  */



/*window.onerror = function (message, url, line, col, error) {
    if (isAlert) alert(message + "\n В " + line + ":" + col + " на " + url);
};*/

/*window.onload = function startWinOnLoad() {
    debugger;
}*/

function startOnLoad() {

    var eventsCld = [];
    var settings = { };
    var element = document.getElementById('caleandar');
    element.innerHTML = '';
    caleandar(element, eventsCld, settings); // , newDateCld

    EnableDisableNonext();

    var max = 300;
    var min = 0;
    rndCounter = Math.floor(Math.random() * (max - min + 1)) + min;

    getAddressFromDNS(true); // получаем первоначальный hostname (его может не быть) из DNS-записи

    onLoadMain();

    if (typeof siteID !== 'undefined' && siteID === 'Poems') backTop();
    if (typeof typeContent !== 'undefined' && typeContent === 'Poem') {
        tooltipstering();
        clearTooltip(); // управление отображением номера стиха Катрена, чтобы он по таймеру пропадал, когда на элементе мышка стоит долго
    }
    //debugger;
    //if (isIE) startReplaceDataStream(); // это не правильно здесь использовать, т.к. onload срабатывает только после полной/окончательной загрузки всех данных, а у нас загружаться может в несколько этапов поток

    isLoaded = true;
}
addLoadEvent(startOnLoad);

// самые первые действия сразу после загрузки всех ресурсов сайта
function onLoadMain() {

    // кнопка "гамбургер"
    let toggleBtn = document.getElementsByClassName('navbar-toggle')[0];
    let menu = htmx.find("#bs-navbar");
    toggleBtn.addEventListener('click', function () {
        htmx.toggleClass(menu, "in");
    });
}

// получаем хост/url из DNS-записи
function getAddressFromDNS(isOriginDnsLink/*, evt, callback*/) {
    if (isOriginDnsLink === undefined) isOriginDnsLink = false;

    if (dnsLinks !== "") {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", "https://dns.google/resolve?name=" + dnsLinks + "&type=TXT");
        xhr.send();

        xhr.onload = function () {
            if (xhr.status === 200) {
                const res = JSON.parse(xhr.response);
                if (res.Answer !== undefined && res.Answer.length > 0) {
                    const data = res.Answer[0].data;
                    const re = /'/gi;
                    dataStr = data.replace(re, '"');
                    try {
                        const dataObj = JSON.parse(dataStr);
                        const siteConf = dataObj.Sites[siteID];

                        if (siteConf !== undefined) {
                            if (siteConf.dnsLinks !== undefined) urls = siteConf.dnsLinks;

                            if (isOriginDnsLink &&
                                siteConf.originDnsLink !== undefined && siteConf.originDnsLink !== ''
                            )
                                originalHostname = siteConf.originDnsLink;

                            if (siteConf.minutes !== undefined) numbMinutes = siteConf.minutes;
                        }

                        isReadDnsLinks = true;
                    } catch (e) {
                        console.error("Ошибка при разборе json-данных из DNS TXT-записи. Ошибка:", e.message);
                        if (isAlert) alert("Ошибка при разборе json-данных из DNS TXT-записи. Ошибка: " + e.message);
                    }

                    let isLoadErrorVal = isLoadError();
                    // если ручной запрос (первое открытие в браузере), при открытии страницы, вернул ошибку, то инициируем событие msu-on-get-dns (используется в hx-trigger)
                    if (urls.length > 0 && isLoadErrorVal || isAutonomyOrStatic()) {
                        if (isLoadErrorVal) callNewServer();

                        for (var i = 0; i < queue.length; i++) {
                            callNewServer(queue.shift()); // это стек FIFO
                        }

                        htmx.trigger('#main-cont', triggerOnload, { detail: true });
                        /*const eventVal = new CustomEvent(triggerOnload, { detail: true });
                        document.getElementById('main-cont').dispatchEvent(eventVal);*/
                    }
                }
            }
            else {
                if (isAlert) alert("Ошибка при получении доменов: " + xhr.status);
            }
        };

        xhr.onerror = function () { // происходит, только когда запрос совсем не получилось выполнить
            if (isAlert) alert("Ошибка соединения");
        };

        /*let response = await fetch("https://dns.google/resolve?name=" + dnsLinks + "&type=TXT");
        if (response.ok) { // если HTTP-статус в диапазоне 200-299
            res = await response.json();
        } else {
            if (isAlert) alert("Ошибка при получении доменов: " + response.status);
        }*/
    }
    else if (isAutonomyOrStatic())
        htmx.trigger('#main-cont', triggerOnload, { detail: true });
}






/*  -------------  Интерактивные элементы сайта  ----------------  */



// управление отображением нумерацией четверостиший Катрена, чтобы он по таймеру пропадал, когда на элементе мышка стоит долго
function hiddenTooltip(el) {
    el.style.setProperty("--visibility", "hidden");
}

// управление отображением нумерацией четверостиший Катрена, чтобы он по таймеру пропадал, когда на элементе мышка стоит долго
function clearTooltip() {

    let listTimeoutID = [];
    Array.prototype.slice.call(document.querySelectorAll('.poem')).forEach(function (box) { // hint--left
        return box.addEventListener('mouseenter', function (event) {
            //event.target.style.setProperty("--visibility", "visible");

            timeoutID = window.setTimeout(hiddenTooltip, 500, event.target);
            listTimeoutID.push([event.target, timeoutID]);
        });
    }
    );
    Array.prototype.slice.call(document.querySelectorAll('.poem')).forEach(function (box) { // hint--left
        return box.addEventListener('mouseleave', function (event) {
            for (let i = 0; i < listTimeoutID.length; i++) {
                if (listTimeoutID[i][0] === event.target) {
                    event.target.style.removeProperty("--visibility");

                    window.clearTimeout(listTimeoutID[i][1]);
                    listTimeoutID.splice(i, 1);
                    //console.log(listTimeoutID.length);
                    //hiddenTooltip(event.target);
                }
            }
        });
    }
    );

}

// кнопка "Наверх сайта"
function backTop() {

    let topEl = document.getElementById("back-top");
    topEl.style.display = 'none';
    window.onscroll = function () {
        var scrollTop = window.scrollY || document.body.scrollTop || document.documentElement.scrollTop || 0;
        //console.info("window.scrollY", scrollTop);
        if (scrollTop > 200) {
            topEl.style.display = '';
        } else {
            topEl.style.display = 'none';
        }
    };
    /*topEl.addEventListener('click', function () {
        window.scroll(0, 0);
        return false;
    });*/
}

// обратный отсчёт до Посыла
var timeleftBlock = document.getElementById('timeleft-block');
function countdown() {

    countFromLastUpdate += period / 1000;
    countStartPosyl += period / 1000;

    var today = 0;
    var thour = /*timeleft <= 0*/ !showBlock ? 0 : Math.floor(timeleft / 3600);
    var tmin = /*timeleft <= 0*/ !showBlock ? 0 : Math.floor(timeleft / 60 - 60 * thour);
    var tsec = /*timeleft <= 0*/ !showBlock ? 0 : timeleft % 60;

    if (/*timeleft !== -1*/showBlock) {
        timestr = (today > 0 ? '<span class="txt-gray">' + today + '</span>' + declOfNum(today, [' день ', ' дня ', ' дней ']) : '') + '<span class="txt-gray">' + thour + '</span>' + declOfNum(thour, [' час ', ' часа ', ' часов ']) + '<span class="txt-gray">' + tmin + '</span>' + declOfNum(tmin, [' минута ', ' минуты ', ' минут ']) + '<span class="txt-gray">' + tsec + '</span>' + " сек.";
        document.getElementById('timeleft').innerHTML = timestr;
        if (timeleftBlock.classList.contains('hidden')) {
            //htmx.removeClass(el, "hidden");
            timeleftBlock.classList.remove('hidden');
        }
    }
    if (timeleft >= 0) {
        if (timeleft === 0 && showBlock) {
            showBlock = false;
            countStartPosyl = 0;
        }
        timeleft -= period / 1000;
    }

    /*// это не нужно, т.к. нижележащий код устраняет разницу, если она составила больше чем 10 сек. (За 5-10 минут до Посыла устанавливаем рандомный момент времени для синхронизации (для тех, кто больше 30 минут назад обновился))
    var min = 300;
    var max = 600;
    if (timeleft <= max + 10 && timeleft >= min && rndLeft === 0 && countFromLastUpdate > 1800) {
        rndLeft = Math.floor(Math.random() * (max - min + 1)) + min;
        if (onDebugTimeleft) console.log('rndLeft = ' + rndLeft + ' timeleft = ' + timeleft);
    }
    // синхронизируем за 5-10 мин. до Посыла время с сервером в назначенное рандомное время
    if (rndLeft > 0 && timeleft <= rndLeft && timeleft > 0) {
        rndLeft = 0;
        if (onDebugTimeleft) console.log('синхронизация за ~10 мин.');

        htmx.ajax('GET', '/ext/countdown', { handler: processJsonCountdown });
    }*/


    if (/*timeleft <= 0*/ !showBlock && countStartPosyl >= (301 + rndCounter)) { // через 5+rnd минут после начала Посыла синхронизируем (получаем остаток времени до следующего Посыла)
        if (onDebugTimeleft) console.log('синхронизация через ~5 мин. после начала Посыла');

        htmx.ajax('GET', '/ext/countdown', { handler: processJsonCountdown }); // нужно делать запрос, чтобы получить время следующего Посыла
    }
    //else if (/*timeleft <= 0*/ !showBlock) countStartPosyl += period / 1000;


    var diffServ = new Date() - servTime;
    var diffLocal = new Date() - localTime; // Math.abs(new Date() - localTime/*servTime*/);
    // если разница во времени между сохранённой ранее локальной/клиентской датой и текущей локальной датой больше чем 5+5 сек, т.е. страница сайта была долго в спящем режиме (свёрнута или комп. был в спящем режиме)
    if (diffLocal > 10000/*(diff + 30000)*/) {
        if (procBigDiff === false && checkIntervalAddUser(true)) { // когда окно браузера с сайтом свёрнуто, то js выполняет код раз в минуту, поэтому проверяем ещё и активность пользователя перед отправкой запроса
            procBigDiff = true;
            if (onDebugTimeleft) console.log('разница - ' + diffLocal + ' время = ' + new Date());

            htmx.ajax('GET', '/ext/countdown', { handler: processJsonCountdown });
        }
    }
    else {
        localTime = new Date();

        if (checkIntervalAddUser()) {
            htmx.ajax('POST', '/ext/addusr', { source: '#dummy' }); // каждые 5 мин. (активные intervalAddUser) обновляем активность пользователя на сервере
        }
    }

    servTime.setSeconds(servTime.getSeconds() + period / 1000); // поддерживаем в актуальном состоянии время, полученное с сервера

    /*if (onDebugTimeleft) {
        console.log('timeleft = ' + timeleft + '; rndLeft = ' + rndLeft + '; countFromLastUpdate = ' + countFromLastUpdate + '; countStartPosyl = ' + countStartPosyl + '; rndCounter = ' + rndCounter + '; diffLocal = ' + diffLocal + '; diffServ = ' + diffServ);
        console.log('время = ' + new Date());
    }*/
}





/*  -------------  Работа с изображениями  ------------  */



// устанавливаем для автономного режима путь статических ресурсов (изображений) или ресурсов из БД
function imgSetSrc(targetEl) {
    if (location.hostname === "") { // это для автономного режима
        if (targetEl === undefined) targetEl = document;
        let elements = targetEl.getElementsByTagName('img');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            if (element == null) continue;

            let src = element.getAttribute("src");
            if (src.indexOf('http') === 0) continue;

            let imgHost = StaticResourcesHost;
            if (src.indexOf(cachePathFile + '/') !== -1) imgHost = hostname; // continue; //  это ресурс/изображение из БД
            element.src = imgHost + (src.indexOf('/') === 0 ? "" : "/") + src;
        }
    }
}

// если сменился хост, то и изображения загружаем с нового хоста (т.к. старый недоступен, а значит будет ошибка загрузки, которая сюда приведёт),
// а так же это для автономного режима получаем путь / байты изображения из БД, когда через механизм браузера не удалось загрузить(не было найдено изображение по указанному пути)
window.getImgData = function (imgEl) {
    if (isAutonomyOrStatic() || hostname !== "") { // это для автономного и статического режима
        let src = imgEl.getAttribute("src");
        if (src.indexOf('http') !== 0) src = hostname + (src.indexOf('/') === 0 ? "" : "/") + src;

        // ведём учёт попыток неудавшихся загрузок изображений. Только одна повторная попытка с того же хоста. (это нужно, чтобы не зацикливалась попытка загрузки изображений с одного и того же хоста)
        if (numbTryLoadImg[src] === undefined) {
            numbTryLoadImg[src] = true;
            imgEl.src = src;
        }
        else {
            delete numbTryLoadImg[src]; // удаляем использованную попытку загрузки конкретного изображения
        }
    }
}

// срабатывает при клике по изображению в автономном режиме
function openImg(imgEl) {
    if (location.hostname === "") { // это для автономного режима
        var dataImg = imgEl.getAttribute("src"); //imgEl.src;// document.getElementById(id).src;
        var imgElement = "<img width='100%' src='" + dataImg + "' />";
        var win = window.open();
        win.document.write(imgElement);
    }
}





/* --------  Работа с HTMX  -------- */

// схемы жизненного цикла HTMX - https://www.mostlylucid.net/blog/htmxandaspnetcore



// это для автономного или статического режима (ссылка на статическом сайте никогда не ищется при работе через htmx)
document.body.addEventListener('htmx:configRequest', function (evt) {
    // здесь использовать await нельзя!

    //это всё не работает let trigger = evt.detail.elt.getAttribute('hx-trigger');
    //if (trigger !== null && trigger.indexOf('load') === 0) isFirstLoadRequest = true;
    //else isFirstLoadRequest = false;

    let detail = evt.detail;
    //if (!isAutonomyOrStatic() && detail.headers["HX-Trigger"] !== undefined && detail.headers["HX-Trigger"] !== null && detail.headers["HX-Trigger"].indexOf('msu-') !== 0) return; // для всех триггеров, которые не начинаются с msu- не выполняем нижележащий код, например, для триггера "quote-block". Т.к. иначе подставляются к запросу .spa

    let path = detail.path;

    if (isAutonomyOrStatic() ||  // это для автономного или статического режима
        (evt.detail.triggeringEvent !== undefined && evt.detail.triggeringEvent !== null && evt.detail.triggeringEvent.detail.notfound === true) || // или если при предыдущей попытке не найден
        isNewHost // или при предыдущей попытке был установлен новый хост, значит и последующие заприсы будем выполнять к этому новому хосту, пока он не сброситься 
    ) {
        //// это нужно только только для IE11, когда срабатывает событие triggerOnload
        //if (typeof window.CustomEvent === "function" &&
        //    (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > -1)) {
        //    detail = evt.detail.detail;
        //}

        detail.headers['MSU-Dev'] = prefix;
        path = detail.path;
        if (!isAutonomyOrStatic() && detail.triggeringEvent !== undefined && detail.triggeringEvent.type === triggerOnload) { // detail.headers["HX-Trigger"] === "main-cont"
            //if (path.indexOf('http') !== -1) return new URL(path);
            if (detail.headers["HX-Current-URL"] !== undefined) {
                let hXCurrentURL = detail.headers["HX-Current-URL"];
                let url = getURL(hXCurrentURL); // new URL
                path = url.pathname;
            }
        }
    }

    let url = getURL(path);

    // при каждом новом переходе по ссылке кроме основного контента подгружается дополнительный - ext и пр.
    if (detail.boosted && detail.triggeringEvent.type !== "msu-ext-data" && detail.triggeringEvent.type !== "msu-ext-quote") {
        if (!callTriggerExtWhenChangePage(url))
            detail.headers["msu-addclient"] = true;
    }

    detail.path = (sendExtSPA
        && (detail.boosted
            || (detail.triggeringEvent !== undefined && evt.detail.triggeringEvent !== null && detail.triggeringEvent.type === triggerOnload))
        && url.href.indexOf('.spa') === -1) ? (url.href.replace(".html", '') + (url.pathname === basePath ? "index" : "") + ".spa") : url.href; // подставляем .spa, при необходимости

    if (detail.triggeringEvent && detail.triggeringEvent.detail.replaceEndPath)
        detail.path = detail.path.substring(0, detail.path.lastIndexOf('/') + 1) + detail.triggeringEvent.detail.replaceEndPath;

    if (detail.triggeringEvent && detail.triggeringEvent.detail.headers) {
        for (let header in detail.triggeringEvent.detail.headers) {
            detail.headers[header] = detail.triggeringEvent.detail.headers[header];
        }
    }

    if (location.hostname === "")
        detail.headers["msu-isAutonomy"] = true;


    if (isAlert) alert("hostname = " + hostname);
});

/*document.body.addEventListener('htmx:afterProcessNode', function (evt) {
    if (evt.detail.elt.id === "api-ext-cld") {
        htmx.trigger('#api-ext-cld', "msu-ext-cld");
    }
});*/

document.body.addEventListener('htmx:beforeHistoryUpdate', function (evt) { // beforeOnLoad
    returnOriginalExtension(evt); // это для возрвата нового расширения запроса в исходное расширения (например, .spa возвращаем в .html или в пустое расширение)
});

document.body.addEventListener('htmx:afterOnLoad', function (evt) {
    if (evt.srcElement.parentElement.attributes['aria-selected']) {
        let currentTab = document.querySelector('[aria-selected=true]');
        if (currentTab) {
            currentTab.setAttribute('aria-selected', 'false');
            currentTab.classList.remove('selected');
        }

        let newTab = evt.target.parentElement;
        if (newTab) {
            newTab.setAttribute('aria-selected', 'true');
            newTab.classList.add('selected');
        }
    }

    // сбрасываем счётчик отслеживания активности пользователя
    if (evt.detail.requestConfig.headers["HX-Trigger"] === "api-ext-addusr"
        || evt.detail.requestConfig.headers["HX-Trigger"] === "api-ext-data"
        || evt.detail.requestConfig.headers["HX-Trigger"] === "api-ext-cld") {
        startTime = new Date();
        moveCounter = 0;
    }
});

// событие: перед заменой таргета полученными в результате запроса данными
document.body.addEventListener('htmx:beforeSwap', function (evt) {

    let isError = evt.detail.isError;

    if (evt.detail.xhr.status === 404) {
        evt.detail.shouldSwap = true;
        evt.detail.isError = false; // это, ВРОДЕ, для того, чтобы не зацикливалось
        //evt.detail.target = htmx.find("#teapot");

        // для ext и прочих .spa не срабатывает htmx:responseError, поэтому обрабатываем их здесь
        reCallRequest(evt, true);
    }
    else if (evt.detail.xhr.status >= 500 && evt.detail.xhr.status < 600) {
        //alert("Произошла ошибка на сервере! Попробуйте позже.");
        //getAddressFromDNS(false, evt, selNewServer);
        let a = 1;
    }
    else {
        let menu = htmx.find("#bs-navbar");
        if (menu && menu.classList.contains('in') === true)
            htmx.toggleClass(menu, "in");

        // при клике по ссылке в цитате, т.к. у элемента quote-block hx-target="this", то нужно его заменить на #main-cont, иначе основной контент прямо в quote-block выводится 
        if (evt.detail.boosted
            && (evt.srcElement.offsetParent.firstChild.attributes && evt.srcElement.offsetParent.firstChild.getAttribute('id') === "quote-block"
                || evt.detail.target.attributes && evt.detail.target.getAttribute('id') === "quote-block")
        )
            evt.detail.target = htmx.find("#main-cont");
        else {
            // это для ext, когда запрос выполняется не через htmx-триггер, а через htmx-ajax, т.е. результат возвращается не в defineExtension, а сюда в evt.detail.serverResponse
            if (evt.detail.serverResponse !== undefined && evt.detail.serverResponse !== null && evt.detail.requestConfig.triggeringEvent === null) {
                if (processJson(evt.detail.serverResponse) === "")
                    evt.detail.shouldSwap = false; // вставили данные в функции processJson, поэтому их больше не надо вставлять
            }
        }
    }
});

document.body.addEventListener('htmx:afterSwap', function (evt) {
    if (location.hostname === "" && evt.detail.boosted) { // это для автономного режима
        imgSetSrc(evt.detail.target);
    }
});

// событие: произошла ошибка при запросе через htmx (например, не найдена страница или ошибка 500)
document.body.addEventListener('htmx:responseError', function (evt) {
    if (isAutonomyOrStatic() && evt.detail.xhr.status === 404 ||  // на статическом хосте не найдена страница (не была закэширована на стат. сайте)
        (evt.detail.xhr.status >= 500 && evt.detail.xhr.status < 600)
    ) {
        if (evt.detail.boosted) callNewServer(evt); // выполняем повторный запрос к доп. хосту (только для запроса основного контента (не для ext и пр.))
    }
});

// событие: произошла ошибка при запросе через htmx (например, недоступен сервер)
document.body.addEventListener('htmx:sendError', /*async*/ function (evt) {
    const url = getURL(evt.detail.pathInfo.finalRequestPath); // new URL
    badHosts[url.origin] = true;
    callNewServer(evt);
    //returnOriginalExtension(evt);
});

// событие: произошло превышение времени ожидания ответа при запросе через htmx
document.body.addEventListener('htmx:timeout', function (evt) {
    const url = getURL(evt.detail.pathInfo.finalRequestPath); // new URL
    badHosts[url.origin] = true;
    callNewServer(evt);
    //returnOriginalExtension(evt);
});

// это для возрвата нового расширения запроса в исходное расширения (например, .spa возвращаем в .html или в пустое расширение)
function returnOriginalExtension(evt) {
    if (evt.detail.boosted && evt.detail.requestConfig.elt.localName == 'a') { // evt.detail.elt.localName
        var path = "";
        var msuData = undefined;

        // извлекаем из полученного контента ссылку на последнюю страницу
        if (evt.detail.xhr.response !== "")
            msuData = evt.detail.xhr.response.match(new RegExp('<msu-data\\spathToUrl="(.+)"><\\/msu-data>', 'im'));
        if (msuData) {
            var ext = evt.detail.requestConfig.elt.href.split('.').pop();
            path = '/' + msuData[1] + (ext ? ('.' + ext) : "");
        }
        else {
            const url = getURL(evt.detail.requestConfig.elt.href); // evt.detail.elt.href // new URL
            path = url.pathname;
        }

        evt.detail.history.path = path;
        /*evt.detail.pathInfo.responsePath = url.pathname;
        evt.detail.requestConfig.path = url.pathname;*/
    }
}

/* Плагин для HTMX - обработка JSON-данных, полученных с сервера */
htmx.defineExtension('json-response', {
    transformResponse: function (text, xhr, elt) {
        if (xhr.status == 200) {
            //var mustacheTemplate = htmx.closest(elt, '[mustache-template]')
            var apiName = elt.getAttribute('id')
            //debugger
            if (text) {
                if (text[0] === "{" || text[0] === "[") {
                    var data = JSON.parse(text)
                    if (apiName === 'api-ext-data') {
                        return processJson(data/*text*/);
                    }
                    else if (apiName === 'api-ext-cld') {
                        return processJsonCld(data/*text*/);
                    }
                }
                else
                    throw new Error('Неправильный формат данных (не json).')
            }
        }

        return ""; //throw new Error('Данные не найдены!'); // 
    }
})

function processJson(data) {
    try {
        if (data) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].targetElt) {
                    var targetElt = htmx.find(data[i].targetElt)
                    if (targetElt) {
                        targetElt.innerHTML = data[i].content;

                        /*// для БВ очищаем подпись-ссылку на Послание
                        if (data[i].targetElt === "#quote-block" && siteID.indexOf("OTK") !== 0) {
                            htmx.remove(htmx.find("#signature"));
                        }*/

                        htmx.process(targetElt); // document.body
                        var a = 1;
                    }
                }
                else if (data[i].targetJson === "calendar") {
                    processJsonCld(data[i].content);
                }
                else if (data[i].targetJson === "countdown") {
                    processJsonCountdown(data[i].content);
                }
            }
            return "";
        } else {
            throw new Error('С сервера пришли пустые данные')
        }
    } catch (e) {
        throw new Error(e.message)
    }
}




function processJsonCountdown(data, detail) {
    if (detail) {
        data = JSON.parse(detail.xhr.response)
    }

    try {
        if (data) {
            servTime = new Date(data.ServerTime);
            timeleft = data.TimeLeft;
            showBlock = data.ShowBlock;
            countStartPosyl = data.PassTime;

            procBigDiff = false;
            diff = Math.abs(new Date() - servTime);
            if (onDebugTimeleft) console.log('diff = ' + diff);

            localTime = new Date();
            startTime = new Date();
            moveCounter = 0;
            countFromLastUpdate = 0;
            procBigDiff = false;

            if (timerOn === false) {
                countdown();
                setInterval(countdown, period);
                timerOn = true;
                if (onDebugTimeleft) console.log('включен таймпер обновления обратного отсчёта');
            }

        } else {
            throw new Error('С сервера пришли пустые данные')
        }
    } catch (e) {
        throw new Error(e.message)
    }

    return "";
}




/* -----------  Работа с календарём  ------------ */

function processJsonCld(data) {

    var daysData = [];
    var month = undefined;
    var year = undefined;

    try {
        if (data) {
            month = data.Month;
            year = data.Year;
            minCldYear = data.MinYear;
            daysData = data.DaysData;
        } else {
            throw new Error('С сервера пришли пустые данные')
        }
    } catch (e) {
        throw new Error(e.message)
    }

    if (month + 1 && year) {
        curCldMonth = month;
        curCldYear = year;

        var newDate = new Date(year, month-1);

        var cldTitle = document.getElementById('cldTitle');
        if (cldTitle) cldTitle.innerHTML = months[month - 1] + " " + year;

        var element = document.getElementById('caleandar');
        element.innerHTML = '';
        caleandar(element, daysData, {}, newDate);

        // заполнение списка годов в поле выбора (под календарём)
        var selectYear = document.getElementById('cldYear');
        if (selectYear.options.length === 1) {
            for (i = minCldYear - 2004; i <= maxCldYear - 2004; i += 1) {
                option = document.createElement('option');
                option.value = 2004 + i;
                option.text = 2004 + i;
                selectYear.add(option);
            }
        }
        selectYear.value = -1;

        var selectMonth = document.getElementById('cldMonth');
        selectMonth.value = -1;
    }

    return "";
}

function onChangeCld(adjuster) {
    var date = new Date(curCldYear, curCldMonth + adjuster - 1, 1);
    var month = date.getMonth();
    var year = date.getFullYear();

    var yearExist = false;
    if (year >= minCldYear && year <= new Date().getFullYear()) { // проверяем, можно ли стрелками месяца перейти к след./пред. году, поскольку список годов ограничен
        changeCalendar(month + 1, year);
    }
}

function onChangeMonth(month) {
    var year = parseInt(document.getElementById('cldYear').value);
    if (year !== -1) changeCalendar(parseInt(month), year);
}

function onChangeYear(year) {
    var month = parseInt(document.getElementById('cldMonth').value);
    if (month !== -1) changeCalendar(month, parseInt(year));
}

function changeCalendar(month, year) {
    if (curCldYear != year || curCldMonth != month) {
        //GetDataAjax(year + "-" + month + ".json");
        //htmx.trigger('#api-ext-cld', "msu-ext-cld", { replaceEndPath: year + "-" + month + ".json" });
        CldProcess(year + "-" + month);
    }
}

function getDateFromPath(path) {
    if (path === basePath)
        return null;
    else {
        var dateArr = path.split(/.*?\/(\d{2}).(\d{2}).(\d{2}).html/);
        if (dateArr.length > 1) {
            var year = parseInt(dateArr[3]);
            var month = parseInt(dateArr[2]);
            var day = parseInt(dateArr[1]);
            return new Date(2000+year, month-1, day);
        }
        else {
            var dateArr2 = path.split(/.*?\/(\d{4})-(\d{2})-(\d{2})/);
            if (dateArr.length > 1) {
                var year = parseInt(dateArr2[1]);
                var month = parseInt(dateArr2[2]);
                var day = parseInt(dateArr[3]);
                return new Date(year, month-1, day);
            }
            else
                return null; // -next тоже должна сюда попасть, т.к. следующий материал уже может быть в следующем месяце, а дата здесь будет ещё предыдущего месяца
        }
    }
}

function isCldRequestOnLoad() {
    return !isLoaded ? isCldRequestVal : true; // false устанавливается только для первоначальной загрузки страницы целиком, в остальных случаях (при переходах с пом. htmx) нужно всегда возвращать true, чтобы htmx.process в качестве ajax-запроса работал
}

function getPreCldPath() {
    if (typeof curCldYear !== 'undefined' && typeof curCldMonth !== 'undefined')
        return curCldYear + '-' + curCldMonth;
    else
        return 'empty';
}






/* -----------  Работа с повторными отправками запросов на другие хосты  ------------ */


function callTriggerExtWhenChangePage(url) {
    if (isExtRequestVal) {
        if (url !== undefined) {
            var date = getDateFromPath(url.pathname);
            htmx.trigger("#api-ext-data", "msu-ext-data", {
                replaceEndPath: date !== null ? (date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()) : "last",
                headers: { 'msu-PreMonth': getPreCldPath(), 'msu-IsCldRequest': isCldRequestVal, 'msu-VerApp': verApp } // изменив здесь необходимо изменить и в <div id="api-ext-data"...
            });
        }
    }
    else if (isQuoteRequestVal)
        htmx.trigger("#quote-block", "msu-ext-quote"); // вместо "click from:a""

    // API-запрос данных календаря
    if (isCldRequestVal) {
        var path = '';
        var date = getDateFromPath(url.pathname);
        if (date === null)
            path = 'last'; // -next тоже должна сюда попасть, т.к. следующий материал уже может быть в следующем месяце, а дата здесь будет ещё предыдущего месяца
        else
            path = date.getFullYear() + '-' + (date.getMonth()+1);

        if (date === null || (curCldYear != date.getFullYear() || curCldMonth != (date.getMonth() + 1))) {
            CldProcess(path);
        }
        else if (!isExtRequestVal) { // это для сайта Катренов, т.к. у него нет отдельных запросов, по которым можно добавить онлайн-пользователя
            return false;
        }
    }

    return true;
}

function CldProcess(path) {
    var elCld = htmx.find("#api-ext-cld");
    elCld.attributes['hx-get'].value = elCld.attributes['hx-get'].value.replace(/(ext\/cld\/).*?(\.json)/, "$1" + path + "$2");
    //elCld.attributes['hx-trigger'].value = elCld.attributes['hx-trigger'].value.replace(/(load).*?(, msu-ext-cld)/, "$1$2"); // теперь это не надо, т.к. эта проблема устраняется в isCldRequestOnLoad() с пом. isLoaded, а иначе, при изменении триггера - хэши не будут совпадать. (Поскольку при первоначальной загрузке страницы триггер с условием для load ("load[isCldRequestOnLoad()], msu-ext-cld"), то это условие надо убрать, т.к. в данном случае мы всегда должны выполнять этот запрос)
    htmx.process(elCld); // это так же выполняет запрос если есть триггер load
}

// дополнительные запросы всегда выполняются не к домену по умолчанию (т.е. на котором открыт сайт), а к доп. хостам (для автономного режима всегда есть доп. хост)
function reCallRequest(evt, withoutBase) {
    if (hostname !== "") {
        //var url = new URL(evt.detail.pathInfo.requestPath, evt.detail.pathInfo.requestPath.indexOf('http') !== -1 ? '' : hostname);
        let url = getURL(evt.detail.pathInfo.requestPath, hostname, withoutBase);
        let path = (sendExtSPA && evt.detail.boosted && url.href.indexOf('.spa') === -1) ? (url.href.replace(".html", '') + (url.pathname === basePath ? "index" : "") + ".spa") : url.href;
        if (evt.srcElement["htmx-internal-data"].listenerInfos
            && evt.srcElement["htmx-internal-data"].listenerInfos.length > 0
            && evt.srcElement["htmx-internal-data"].listenerInfos[0].trigger // если элемент первоначально был вызван через триггер, то снова вызываем этот триггер
            && evt.srcElement["htmx-internal-data"].listenerInfos[0].trigger.indexOf('msu-ext-') === 0
        ) {
            callTriggerExtWhenChangePage();
        }
        else {
            var promise = htmx.ajax('GET', path, '#' + evt.detail.target.getAttribute('id'));
            /*promise.then( // не работает в IE11
                function (result) {
                    let a = 1;
                },
                function (error) {
                    let a = 2;
                }
            );*/
        }
    }
}

function callNewServer(evt) {
    let firstTime = false;

    //let urls = /*await*/ getAddressFromDNS(); // это выполняется через callback
    if (urls !== undefined && urls.length > 0) {

        if (isNewHost === false) firstTime = true;

        if (firstTime || badHosts[hostname] === true) { // текущий хост уже отмечен как сбойный - пробуем другой хост

            isNewHost = false;
            for (var i = 0; i < urls.length; i++) {

                if (newHosts[urls[i]] === undefined && // этот хост мы ещё не пробовали
                    urls[i] !== location.origin &&  // нам не надо использовать хост, который совпадает с хостом из адресной строки браузера
                    (location.protocol !== "https:" ||
                        (location.protocol === "https:" && urls[i].indexOf('http:') === -1) // http нельзя вызывать из https, по правилам безопасности
                    )
                ) {

                    newHosts[urls[i]] = true;
                    hostname = urls[i];
                    if (isAlert) console.log("Новый хост: " + hostname);
                    isNewHost = true;

                    if (evt !== undefined) reCallRequest(evt);

                    break;
                }
                else if (newHosts[urls[i]] === true) {
                    newHosts[urls[i]] = false; // отключаем ранее испробованный хост, чтобы в новом цикле его можно было снова пробовать
                }
            }
        }
        else if (evt !== undefined) reCallRequest(evt); // это параллельный запрос, который мы не пробовали ещё обработать с этим хостом

        // через 30 мин., после первого изменения хоста, сбрасываем это новое значение и возвращаемся к исходному
        if (firstTime === true && isNewHost === true) {
            setTimeout(function () {

                returnOriginalHostname();

                isNewHost = false;

            }, 60000 * numbMinutes);
        }

        if (isNewHost == false) {
            returnOriginalHostname();

            //if (evt.detail.target.getAttribute('id') === "main-cont")
            alert("Все сервера недоступны! Попробуйте снова, через некоторое время.");
        }
    }
    else if (dnsLinks !== "" && !isReadDnsLinks)
        queue.push(evt);
    else
        if (evt.detail.boosted || (evt.detail.requestConfig.triggeringEvent && evt.detail.requestConfig.triggeringEvent.type === triggerOnload) /*evt.detail.target.getAttribute('id') === "main-cont"*/)
            alert("Сервер недоступен! Попробуйте снова, через некоторое время."); // это нужно отображать только для основного контента, а для ext и пр. не надо.
}
function returnOriginalHostname() {
    hostname = originalHostname;
    newHosts = {};
    if (isAlert) console.log("Вернули исходный хост: " + hostname);
}





/* -----------  Прочие функции  ------------ */


// вкл/откл. показ перехода к будущей последней странице Катрена при её текущем отсутствии (https://example.com/#nonext-true)
var styleDyn = document.createElement('style');
document.head.appendChild(styleDyn);
function EnableDisableNonext(isEnableNonext) {
    isEnableNonext = JSON.parse(getHashValue('nonext'));

    if (localStorage && (isEnableNonext === undefined || isEnableNonext === null)) {
        var nonext = localStorage.getItem('msu-nonext');
        isEnableNonext = JSON.parse(nonext);
    }

    if (isEnableNonext === true && localStorage) {
        localStorage.setItem('msu-nonext', true);
        styleDyn.innerHTML = '.nonext { display: inline; }';
    }
    else if (isEnableNonext === false && localStorage) {
        localStorage.setItem('msu-nonext', false);
        styleDyn.innerHTML = '.nonext { display: none; }';
    }
}


// проверка активности пользователя на сайте
function checkIntervalAddUser(noAddUser) {
    var diffStart = new Date() - startTime;

    if ((noAddUser || (!noAddUser && diffStart >= intervalAddUser)) && moveCounter > 0) {
        if (!noAddUser && onDebugTimeleft) console.log('разница к старту активности пользователя - ' + diffStart + ' время = ' + new Date());

        startTime = new Date();
        moveCounter = 0;

        return true;
    }
}

// сигнализирует, что пользователь активен/находится на странице
window.addEventListener('scroll', function () {
    typeof moveCounter !== 'undefined' ? moveCounter++ : 0;
});






/*  ----------  Хелперы  ------------  */


function getURL(path, newHostname, withoutBase) {
    let baseUrl = path.includes("/ext/") && extHost !== undefined && extHost !== "" ? extHost :
        (newHostname !== undefined ? newHostname :
            (path.indexOf('http') !== -1 ? '' : (location.origin.indexOf('file://') === -1/*hostname === ""*/ ? location.origin : hostname)));
    //path = path.toLowerCase();

    if (baseUrl === '') return new URL(path); //baseUrl = undefined;
    else {
        if (path.indexOf('http') === -1)
            return new URL((withoutBase === true ? "" : ((path.indexOf('/') === 0 ? basePath.substring(0, basePath.length - 1) : basePath))) + path, baseUrl);

        let url = new URL(path);
        return new URL(withoutBase === true ? ((url.pathname.indexOf(basePath) === 0 ? url.pathname.substring(basePath.length - 1) : url.pathname)) : "", baseUrl);
    }
}

function isLoadError() {
    if (document.title === "Ошибка")
        return true;

    return false;
}

// проверка, является ли текущее приложение автономным или работает в статическом режиме, например, через GitHub Pages
function isAutonomyOrStatic(event) {
    if (location.hostname === "" || isStaticMode === true)
        return true;
    else
        return false;
}

function isQuoteRequest() {
    return isQuoteRequestVal;
}

// склонение числительных
function declOfNum(number, titles) {
    cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

function getBaseURI() {
    if (document.baseURI) return document.baseURI;
    const base = document.getElementsByTagName('base');
    if (base.length > 0) return base[0].href;
    return document.URL;
}

function getBasePath() {
    let url_ = new URL(document.baseURI);
    return url_.protocol === "file:" ? "/" : url_.pathname;
}

function getHashValue(hashName) {
    var hash = window.location.hash.substring(1);
    var hashArr = hash.split('-');
    if (hashArr.length > 1 && hashArr[0] === hashName)
        return hashArr[1];
    else
        return 'null';
}

/*function getSetUserId() {
    var guid = getCookie('msu-clientid');
    if (!guid) {
        var guid = generateUUID();

        setCookie('msu-clientid', guid, { 'max-age': 31536000 });
    }

    return guid;
}

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options) {
    if (options === undefined) options = { path: '/' };

    //options = {
    //    path: '/',
    //    // при необходимости добавьте другие значения по умолчанию
    //    ...options
    //};

    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}*/

/**
* @param {string} tag
* @param {boolean} [global]
* @returns {RegExp}
*/
function msuMakeTagRegEx(tag, global) {
    return new RegExp('<' + tag + '(\\s[^>]*>|>)([\\s\\S]*?)<\\/' + tag + '>',
        !!global ? 'gim' : 'im')
}

// С пом. этой функции можно много раз подключать обработчик window.onload (по умолчанию можно отолько один раз подключить, все остальные разы затираются)
function addLoadEvent(func) {
    var oldonload = window.onload;
    if (typeof window.onload != 'function') {
        window.onload = func;
    }
    else {
        window.onload = function () {
            oldonload();
            func();
        }
    }
}

function domReady(fn) {
    // If we're early to the party
    document.addEventListener("DOMContentLoaded", fn);
    // If late; I mean on time.
    if (document.readyState === "interactive" || document.readyState === "complete") {
        fn();
    }
}

/* обработка StreamRendering */
/*class Ii extends HTMLElement {
    // срабатывает при поступлении каждой новой порции данных из потока рендеринга Блазор
    connectedCallback() {
        //alert('asd')
        const e = this.parentNode;
        e.parentNode?.removeChild(e),
            e.childNodes.forEach((e => {
                if (e instanceof HTMLTemplateElement) {
                    replaceDataStream(e);
                }
            }
            ))
    }
}
customElements.define("blazor-ssr-end", Ii)

// замена предварительного контента на основной контент, который был загружен с задержкой в режиме потока (StreamRendering)
function replaceDataStream(templateElement) {
    // Get the blazor-component-id attribute value
    const componentId = templateElement.getAttribute('blazor-component-id');

    // Find the corresponding start and end comments
    let startComment = findComment('bl:' + componentId);
    let endComment = findComment('/bl:' + componentId);

    if (startComment === null && endComment === null) {
        const targetName = templateElement.content.cloneNode(true).firstChild.getAttribute('msu-component-target');
        if (targetName !== null) {
            startComment = findComment('bl:'+componentId, targetName);
            endComment = findComment('/bl:'+componentId, targetName);
        }
    }

    // If both start and end comments are found
    if (startComment && endComment) {
        // Get the parent node (container) of the comments
        const containerNode = startComment.parentNode;

        // Create a temporary document fragment to hold the template content
        const tempFragment = document.createDocumentFragment();
        tempFragment.appendChild(templateElement.content.cloneNode(true));

        // Replace the content between start and end comments with template content
        let currentNode = startComment.nextSibling;
        while (currentNode && currentNode !== endComment) {
            containerNode.removeChild(currentNode);
            currentNode = startComment.nextSibling;
        }

        // Insert each child node of the fragment before the endComment
        while (tempFragment.firstChild) {
            containerNode.insertBefore(tempFragment.firstChild, endComment);
        }

        // Remove the template element
        templateElement.remove();
    }
}

// Function to find a comment node based on its text content
function findComment(textContent, targetName) {
    if (targetName === undefined || targetName === null || targetName === '') targetName = 'main-cont';
    const allNodes = document.getElementById(targetName).childNodes; //document.body.childNodes;
    for (let i = 0; i < allNodes.length; i++) {
        if (allNodes[i].nodeType === Node.COMMENT_NODE && allNodes[i].textContent.trim() === textContent) {
            return allNodes[i];
        }
    }
    return null;
}

// начало обработки StreamRendering
function startReplaceDataStream() {

    //const ssrElements = document.querySelectorAll('blazor-ssr');

    Array.prototype.slice.call(document.querySelectorAll('blazor-ssr')).forEach(function (ssrElement) {
        // Get all template elements with blazor-component-id attribute
        //const templateElements = document.querySelectorAll('template[blazor-component-id]');

        // Iterate through each template element
        Array.prototype.slice.call(document.querySelectorAll('template[blazor-component-id]')).forEach(function (templateElement) {
            replaceDataStream(templateElement);
        });

        ssrElement.remove();
    });
}*/




function loadScript(src, callback) {
    let script = document.createElement('script');
    script.src = src;
    script.onload = function () { callback(script); };
    document.head.append(script);
}


// Create the event.
//const event = document.createEvent("Event");
// Define that the event name is 'build'.
//event.initEvent(triggerOnload);

// Listen for the event.
/*document.getElementById('main-cont').addEventListener(
    triggerOnload,
    function (e) {
        debugger;
    },
    false,
);*/


if (navigator.userAgent.indexOf('MSIE') !== -1
    || navigator.appVersion.indexOf('Trident/') > -1) {

    isIE = true;

    /* Polyfill URL method IE 11 */
    // ES5
    if (typeof window.URL !== 'function') {
        window.URL = function (url, base) {
            if (url !== undefined) {
                var ind = url.indexOf('http') === 0 ? 1 : 0;
                if (url.indexOf('/') === 0) url = url.substring(1);

                var protocol = url.indexOf('//') === -1/*ind === 0*/ ? '' : url.split('//')[0],
                    comps = url.split('#')[0].replace(/^(https\:\/\/|http\:\/\/)|(\/)$/g, '').split('/'),
                    host = ind === 0 ? '' : comps[0],
                    search = comps[comps.length - 1].split('?')[1],
                    tmp = host.split(':'),
                    port = ind === 0 ? '' : tmp[1],
                    hostname = ind === 0 ? '' : tmp[0];

                if (base !== undefined && base !== null) {
                    var protocol = base.split('//')[0],
                        comps2 = base.split('#')[0].replace(/^(https\:\/\/|http\:\/\/)|(\/)$/g, '').split('/'),
                        host = comps2[0],
                        tmp = host.split(':'),
                        port = tmp[1],
                        hostname = tmp[0];
                }

                search = typeof search !== 'undefined' ? '?' + search : '';

                var params = [];
                //// выдаёт ошибку, поэтому закомментировано
                //if (search !== "") {
                //    params = search
                //        .slice(1)
                //        .split('&')
                //        .map(function (p) { return p.split('='); })
                //        .reduce(function (p, c) {
                //            var parts = c.split('=', 2).map(function (param) { return decodeURIComponent(param); });
                //            if (parts.length == 0 || parts[0] != param) return (p instanceof Array) && !asArray ? null : p;
                //            return asArray ? p.concat(parts.concat(true)[1]) : parts.concat(true)[1];
                //        }, []);
                //}

                return {
                    hash: url.indexOf('#') > -1 ? url.substring(url.indexOf('#')) : '',
                    protocol: protocol,
                    host: host,
                    hostname: hostname,
                    href: (protocol !== "" ? (protocol + '//' + host) : "") + "/" + url,
                    pathname: '/' + comps.splice(ind).map(function (o) { return /\?/.test(o) ? o.split('?')[0] : o; }).join('/'),
                    search: search,
                    origin: protocol !== "" ? (protocol + '//' + host) : "",
                    port: typeof port !== 'undefined' ? port : '',
                    searchParams: {
                        get: function (p) {
                            return p in params ? params[p] : ''
                        },
                        getAll: function () { return params; }
                    }
                };
            }
        }
    }
    /* Polyfill IE 11 end */

    /* это для работы с StreamRendering */
    /*if (typeof HTMLTemplateElement === 'undefined') {
        (function () {

            var TEMPLATE_TAG = 'template';

            HTMLTemplateElement = function () { }
            HTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);

            HTMLTemplateElement.decorate = function (template) {
                if (template.content) {
                    return;
                }
                template.content = template.ownerDocument.createDocumentFragment();
                var child;
                while (child = template.firstChild) {
                    template.content.appendChild(child);
                }
            }

            HTMLTemplateElement.bootstrap = function (doc) {
                var templates = doc.querySelectorAll(TEMPLATE_TAG);
                Array.prototype.forEach.call(templates, function (template) {
                    HTMLTemplateElement.decorate(template);
                });
            }

            // auto-bootstrapping
            // boot main document
            addEventListener('DOMContentLoaded', function () {
                HTMLTemplateElement.bootstrap(document);
            });
            
        })();
    }*/
}
else {


}

basePath = getBasePath(); // этот код нельзя ставить в startOnLoad(), т.к. при возврате кнопкой браузере "Назад" startOnLoad() не срабатывает - см. первый комментарий в этом файле
