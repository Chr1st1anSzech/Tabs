export const leftSide = "left";
export const rightSide = "right";


/**
 * Verändert die Größe eines Fensters.
 * @param {number} windowId Bezeichner des Fensters, dessen Größer verändert werden soll.
 * @param {number} newWidth Neue Breite des Fenster.
 * @param {number} newHeight Neue Höhe des Fenster
 */
 export function resizeWindow(windowId, newWidth, newHeight) {
    if (!windowId || !helperModule.isNumber(newHeight) || !helperModule.isNumber(newWidth)) {
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
 export async function calcCenterWindow(width, height) {
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
 export async function centerWindow(windowId, width, height) {
    const point = await calcCenterWindow(width, height);
    chrome.windows.update(windowId, { left: point.left, top: point.top });
}


/**
 * Zentriert ein Fenster.
 * @param {number} windowId Bezeichner des Fensters, das zentriert werden soll.
 * @param {number} width Breite des Fenster.
 * @param {number} height Höhe des Fenster
 */
 export async function calcCoordToPlaceWindowOnSide(side) {
    const displayInfos = await chrome.system.display.getInfo();
    let coord = {
        left: 0,
        top: 0,
        height: 0,
        width : 0
    }
    
    const displayBounds = displayInfos[0].bounds;
    const halfWidth = ~~(displayBounds.width / 2);
    coord.width = halfWidth;
    coord.height = displayBounds.height;
    if (displayInfos.length > 0 && side == rightSide) {
        coord.left = halfWidth;
    }
    return coord;
}


/**
 * Lege auf ein Fenster den Fokus.
 * @param {number} windowId Bezeichner des Tabs.
 */
 export function focusWindow(windowId){
    if (windowId != null) {
        chrome.windows.update(windowId, { focused: true });
    }
}
