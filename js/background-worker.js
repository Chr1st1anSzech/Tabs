var openedTabId = null;
var openedWindowId = null;
var isPopupOpen = false;
var isNavigationInProcess = false;

const handleUrl = "www.bahn.de";

async function openUrlAsync(url) {
    if (!isPopupOpen) {
        await openNewWindowAsync(url);
    }
    else {
        navigateToUrl(openedTabId, url);
    }
    chrome.windows.update(openedWindowId, { focused: true });
}

function isEmpty(str) {
    return (!str || str.length === 0 );
}

function isUrl(str) {
    return (str && str.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/) );
}

function isNumber(str) {
    return (str || str.match(/\d+/) );
}

function navigateToUrl(tabId, newUrl) {
    if( !tabId || !isUrl(newUrl) ){
        return;
    }
    chrome.tabs.update(tabId, { url: newUrl });
}

function resizeWindow(windowId, newWidth, newHeight) {
    if(!windowId || !isNumber(newHeight) || !isNumber(newWidth) ){
        return;
    }
    chrome.windows.update(windowId, { height: parseInt(newHeight), width: parseInt(newWidth) });
}

async function calcCenterWindow(width, height){
    const displayInfos = await chrome.system.display.getInfo();
    let point = {
        left : 0,
        top : 0
    }
    if( displayInfos.length > 0 ){
        const displayBounds = displayInfos[0].bounds;
        point.left = ~~((displayBounds.width - width) / 2);
        point.top = ~~((displayBounds.height - height) / 2);
    }
    return point;
}

async function centerWindow(windowId, width, height){
    const point = await calcCenterWindow(width, height);
    chrome.windows.update(windowId, { left: point.left, top: point.top });
}

async function openNewWindowAsync(url) {
    if(!isUrl(url) ){
        return;
    }
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
    isPopupOpen = true;
    openedWindowId = window.id;
    openedTabId = window.tabs[0].id;
    chrome.windows.onRemoved.addListener(onWindowClosed);
    console.log('Finish navigation');
    isNavigationInProcess = false;
}

function onBeforeNavigate(details) {
    if(!navigationFinished){
        if(details.url.includes('www.bahn.de')){
            openUrl('https://www.bahn.de/');
            chrome.tabs.remove(details.tabId);
            navigationFinished = true;
        }
    }
    else{
        //navigationFinished = false;
    }
    
}

async function onTabUpdated(tabId, changeInfo, tab) {
    console.log('Incoming: Tab='+tabId);
    if(!isEmpty(changeInfo.url) && 
            openedTabId != tabId && 
            !isEmpty(handleUrl) && 
            tab.url.includes(handleUrl)){

        isNavigationInProcess = true;
        await openUrlAsync(tab.url);
        console.log('Remove: Tab='+tabId);
        chrome.tabs.remove(tabId);
    }
    
}

function onWindowClosed(closedWindowId) {
    if(closedWindowId == openedWindowId){
        isPopupOpen = false;
        openedTabId = null;
        openedWindowId = null;
    }
}

//chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate);
chrome.tabs.onUpdated.addListener(onTabUpdated);