/**
 * Prüft, ob eine Zeichenkette leer oder undefiniert ist.
 * @param {string} str Zu prüfende Zeichenkette.
 * @return {boolean} Ergebnis der Prüfung.
 */
 export function isEmpty(str) {
    return (!str || str.length === 0);
}


/**
 * Prüft, ob eine Zeichenkette dem Muster einer URL entspricht.
 * @param {string} str Zu prüfende Zeichenkette.
 * @return {boolean} Ergebnis der Prüfung.
 */
 export function isUrl(str) {
    return (str && str.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/));
}


/**
 * Prüft, ob eine Zeichenkette eine Zahl ist.
 * @param {string} str Zu prüfende Zeichenkette.
 * @return {boolean} Ergebnis der Prüfung.
 */
 export function isNumber(str) {
    return (str || str.match(/\d+/));
}