var notificationTabIds = {}

const handleUrl = "https://www.bahn.de/";
const closeWarningUrl = "https://www.bahn.de/angebot";

async function openUrlAsync(url, windowId, tabId) {
    if (windowId == null) {
        await openNewWindowAsync(url);
    }
    else {
        navigateToUrl(tabId, url);
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
    chrome.storage.local.set({'PopupTabId': window.tabs[0].id}, function() {
        console.log(`Save value ${window.tabs[0].id} for property PopupTabId.`);
    });
    chrome.storage.local.set({'PopupWindowId': window.id}, function() {
        console.log(`Save value ${window.id} for property PopupWindowId.`);
    });

    console.log(`A new tab with id was created.`);
}

async function onTabUpdated(tabId, changeInfo, tab) {
    const popupTabId = await chrome.storage.local.get(['PopupTabId']);
    const popupWindowId = await chrome.storage.local.get(['PopupWindowId']);

    if (popupTabId != tabId &&
        !isEmpty(changeInfo.url) &&
        !isEmpty(handleUrl)) {
        console.log(`A new tab with id ${tabId} was detected.`);
        if (tab.url.includes(closeWarningUrl)) {
            showNotification(tabId);
        }
        else if (tab.url.includes(handleUrl)) {
            await openUrlAsync(tab.url, popupWindowId, popupTabId);
            focusWindow(popupWindowId);
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

async function onWindowClosedAsync(closedWindowId) {
    const popupWindowId = await chrome.storage.local.get(['PopupWindowId']);
    if (closedWindowId == popupWindowId) {
        setVariablesToNull();
    }
}

function setVariablesToNull(){
    chrome.storage.local.set({'PopupTabId': null }, function() {
        console.log(`Set property PopupTabId to null.`);
    });
    chrome.storage.local.set({'PopupWindowId': null }, function() {
        console.log(`Set property PopupWindowId to null.`);
    });
}

setVariablesToNull();
chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.notifications.onButtonClicked.addListener(onButtonClicked);
chrome.windows.onRemoved.addListener(onWindowClosedAsync);