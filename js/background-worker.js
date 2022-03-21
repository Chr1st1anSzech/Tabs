var openedTabId = null;
var openedWindowId = null;
var notificationTabIds = {}

const handleUrl = "https://www.bahn.de/";
const closeWarningUrl = "https://www.bahn.de/angebot";

async function openUrlAsync(url, windowId) {
    if (windowId == null) {
        await openNewWindowAsync(url);
    }
    else {
        navigateToUrl(openedTabId, url);
    }
}

function focusWindow(windowId){
    chrome.windows.get(windowId)
        .then(window => {
            chrome.windows.update(window.id, { focused: true });
        });
    
}

function isEmpty(str) {
    return (!str || str.length === 0);
}

function isUrl(str) {
    return (str && str.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/));
}

function isNumber(str) {
    return (str || str.match(/\d+/));
}

function navigateToUrl(tabId, newUrl) {
    if (!tabId || !isUrl(newUrl)) {
        return;
    }
    console.log(`Call the URL in the open tab with id ${tabId}.`);
    chrome.tabs.update(tabId, {
        url: newUrl
    });
}

function resizeWindow(windowId, newWidth, newHeight) {
    if (!windowId || !isNumber(newHeight) || !isNumber(newWidth)) {
        return;
    }
    chrome.windows.update(windowId, { height: parseInt(newHeight), width: parseInt(newWidth) });
}

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

async function centerWindow(windowId, width, height) {
    const point = await calcCenterWindow(width, height);
    chrome.windows.update(windowId, { left: point.left, top: point.top });
}

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
    openedWindowId = window.id;
    openedTabId = window.tabs[0].id;
    console.log(`A new tab with id ${openedTabId} was created.`);
}

async function onTabUpdated(tabId, changeInfo, tab) {
    if (openedTabId != tabId &&
        !isEmpty(changeInfo.url) &&
        !isEmpty(handleUrl)) {
        console.log(`A new tab with id ${tabId} was detected.`);
        if (tab.url.includes(closeWarningUrl)) {
            showNotification(tabId);
        }
        else if (tab.url.includes(handleUrl)) {
            await openUrlAsync(tab.url, openedWindowId);
            focusWindow(openedWindowId);
            removeTab(tabId);
        }
    }
}

function removeTab(tabId) {
    chrome.tabs.get(tabId)
        .then(tab => {
            console.log(`Remove tab with id ${tabId}.`);
            chrome.tabs.remove(tab.id);
        },
            () => {
                console.log(`There is no tab with id ${tabId}.`);
            });
}

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

function onWindowClosed(closedWindowId) {
    if (closedWindowId == openedWindowId) {
        openedTabId = null;
        openedWindowId = null;
    }
}

chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.notifications.onButtonClicked.addListener(onButtonClicked);
chrome.windows.onRemoved.addListener(onWindowClosed);