var notificationTabIds = {}

/**
 * Die URL, die in einem separaten Fenster geöffnet werden soll.
 * @const {string}
 */
const handleUrl = "https://www.bahn.de/";


/**
 * Die URL, für die eine Benachrichtigung angezeigt werden soll.
 * @const {string}
 */
const closeWarningUrl = "https://www.bahn.de/angebot";


/**
 * Setzt alle gespeicherten Variablen zurück.
 */
function setVariablesToNull(){
    chrome.storage.local.set({'PopupTabId': null }, function() {
        console.log('Set property PopupTabId to null.');
    });
    chrome.storage.local.set({'PopupWindowId': null }, function() {
        console.log('Set property PopupWindowId to null.');
    });
}


/**
 * Prüft, ob eine Zeichenkette leer oder undefiniert ist.
 * @param {string} str Zu prüfende Zeichenkette.
 * @return {boolean} Ergebnis der Prüfung.
 */
function isEmpty(str) {
    return (!str || str.length === 0);
}


/**
 * Prüft, ob eine Zeichenkette dem Muster einer URL entspricht.
 * @param {string} str Zu prüfende Zeichenkette.
 * @return {boolean} Ergebnis der Prüfung.
 */
function isUrl(str) {
    return (str && str.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/));
}


/**
 * Prüft, ob eine Zeichenkette eine Zahl ist.
 * @param {string} str Zu prüfende Zeichenkette.
 * @return {boolean} Ergebnis der Prüfung.
 */
function isNumber(str) {
    return (str || str.match(/\d+/));
}


/**
 * Verändert die Größe eines Fensters.
 * @param {number} windowId Bezeichner des Fensters, dessen Größer verändert werden soll.
 * @param {number} newWidth Neue Breite des Fenster.
 * @param {number} newHeight Neue Höhe des Fenster
 */
function resizeWindow(windowId, newWidth, newHeight) {
    if (!windowId || !isNumber(newHeight) || !isNumber(newWidth)) {
        return;
    }
    chrome.windows.update(windowId, { height: parseInt(newHeight), width: parseInt(newWidth) });
}


/**
 * Berechnet den oberen, linken Punkt des Fensters, damit es zentriert ist.
 * @param {number} width Breite des Fenster.
 * @param {number} height Höhe des Fenster
 * @return {object} Der oberen, linken Punkt des Fensters.
 */
async function calcCenterWindow(width, height) {
    const displayInfos = await chrome.system.display.getInfo();
    let point = {
        left: 0,
        top: 0
    }
    if (displayInfos.length > 0) {
        const displayBounds = displayInfos[0].bounds;
        point.left = ~~((displayBounds.width - width) / 2);
        point.top = ~~((displayBounds.height - height) / 2);
    }
    return point;
}


/**
 * Zentriert ein Fenster.
 * @param {number} windowId Bezeichner des Fensters, das zentriert werden soll.
 * @param {number} width Breite des Fenster.
 * @param {number} height Höhe des Fenster
 */
async function centerWindow(windowId, width, height) {
    const point = await calcCenterWindow(width, height);
    chrome.windows.update(windowId, { left: point.left, top: point.top });
}


/**
 * Lege auf ein Fenster den Fokus.
 * @param {number} windowId Bezeichner des Tabs.
 */
function focusWindow(windowId){
    if (windowId != null) {
        chrome.windows.update(windowId, { focused: true });
    }
}


/**
 * Öffne eine URL entweder im vorhandenen Fenster oder erstelle ein neues Fenster. 
 * @param {string} url Die zu öffnende Adresse.
 * @param {number?} tabId Bezeichner des Tabs, falls vorhanden.
 */
async function openUrlAsync(url, tabId) {
    if (tabId == null) {
        await openNewWindowAsync(url);
    }
    else {
        navigateToUrl(tabId, url);
    }
}


/**
 * Öffnet ein neues, zentriertes Fenster und öffnet eine URL.
 * @param {string} url Adresse der Webseite, die geöffnet werden soll.
 */
async function openNewWindowAsync(url) {
    if (!isUrl(url)) {
        return;
    }
    console.log('Create new window and open URL.');
    const width = 1200;
    const height = 750;
    const point = await calcCenterWindow(width, height);
    let window = await chrome.windows.create({
        focused: true,
        height: height,
        width: width,
        left: point.left,
        top: point.top,
        type: "popup",
        url: url
    });
    chrome.storage.local.set({'PopupTabId': window.tabs[0].id}, function() {
        console.log(`Save value ${window.tabs[0].id} for property PopupTabId.`);
    });
    chrome.storage.local.set({'PopupWindowId': window.id}, function() {
        console.log(`Save value ${window.id} for property PopupWindowId.`);
    });

    console.log(`A new tab with id was created.`);
}


/**
 * Navigiert eine URL im Browser im vorgegebenen Tab an.
 * @param {number} tabId Bezeichner des Tabs, indem die Webseite geöffnet werden soll.
 * @param {string} newUrl Adresse der Webseite, die geöffnet werden soll.
 */
function navigateToUrl(tabId, newUrl) {
    if (!tabId || !isUrl(newUrl)) {
        return;
    }
    console.log(`Call the URL in the open tab with id ${tabId}.`);
    chrome.tabs.update(tabId, {
        url: newUrl
    });
}


/**
 * Entfernt einen Tab.
 * @param {number} tabId Bezeichner des Tabs, der entfernt werden soll.
 */
function removeTab(tabId) {
    if (tabId != null) {
        console.log(`Remove tab with id ${tabId}.`);
        chrome.tabs.remove(tabId);
    }
}


/**
 * Listener für Aktualisierung eines Tabs.
 * Zeigt entweder eine Benachrichtigung an oder öffnet die URL in einem separaten Fenster,
 * wenn eines der Muster passt.
 * @param {number} tabId Bezeichner des Tabs, der aktualisiert wurde.
 * @param {object} changeInfo Information über die Veränderungen.
 * @param {Tab} tab Der Tab, der aktualisiert wurde.
 */
async function onTabUpdatedAsync(tabId, changeInfo, tab) {
    const data = await chrome.storage.local.get(['PopupTabId', 'PopupWindowId']);
    const popupTabId = data.PopupTabId;
    const popupWindowId = data.PopupWindowId;

    if (popupTabId != tabId &&
        !isEmpty(changeInfo.url) &&
        !isEmpty(handleUrl)) {
        console.log(`A new tab with id ${tabId} was detected.`);
        if (tab.url.includes(closeWarningUrl)) {
            showNotification(tabId);
        }
        else if (tab.url.includes(handleUrl)) {
            await openUrlAsync(tab.url, popupTabId);
            focusWindow(popupWindowId);
            removeTab(tabId);
        }
    }
}


/**
 * Zeige eine Benachrichtigung an.
 * @param {number} tabId Bezeichner des Tabs.
 */
function showNotification(tabId) {
    const notificationId = `TabsWarningMessage-${Date.now()}`;
    chrome.notifications.create(notificationId,
        {
            type: "basic",
            title: "Dokument noch in Bearbeitung",
            message: "Möchten Sie die Bearbeitung des Dokuments abbrechen? Der aktuelle Bearbeitungsstand geht verloren.",
            iconUrl: "/icons/tabs-128x128.png",
            requireInteraction: true,
            buttons: [{ title: "OK" }, { title: "Abbrechen" }]
        });
    notificationTabIds[notificationId] = tabId;
}

function onButtonClicked(notificationId, buttonIndex) {
    
}


/**
 * Listener für das Schließen eines Fensters.
 * Setzt alle gespeicherten Variablen zurück, falls das separate Fenster geschlossen wurde.
 * @param {number} closedWindowId Bezeichner des Tabs, der geschlossen wurde.
 */
async function onWindowClosedAsync(closedWindowId) {
    const popupWindowId = (await chrome.storage.local.get(['PopupWindowId'])).PopupWindowId;
    if (closedWindowId == popupWindowId) {
        setVariablesToNull();
    }
}


/**
 * Setzt alle gespeicherten Variablen beim Starten des Browsers zurück.
 */
function onBrowserStart() {
    console.log('Clear storage at startup.');
    setVariablesToNull();
}


chrome.runtime.onStartup.addListener(onBrowserStart);
chrome.tabs.onUpdated.addListener(onTabUpdatedAsync);
chrome.notifications.onButtonClicked.addListener(onButtonClicked);
chrome.windows.onRemoved.addListener(onWindowClosedAsync);