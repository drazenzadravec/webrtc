// main app
window.addEventListener("load", onPageLoad);
window.addEventListener("beforeunload", onPageBeforeUnload);

/**
 * on page load
 */
function onPageLoad() {

    var serviceBaseURL = "/awsapi/api/cf/call/";
    var accessTokenUrlOrPath = "/awsapi/api/site/access/token";

    // load module.
    import('../main.mjs')
        .then((m) => {
            m.authLoginAccessToken(serviceBaseURL, accessTokenUrlOrPath);
        })
        .catch((e) => {
            console.error(e);
        });
}

/**
 * on before page unload
 */
function onPageBeforeUnload() {
}

/**
 * what is the browser and version
 * @returns {string} the browser and version.
 */
function whatBrowser() {
    var ua = navigator.userAgent;
    var tem;
    var M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE ' + (tem[1] || '');
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2] ? [M[1], M[2]] : ['Unknown', 'browser or version', '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
    return M.join(' ');
}
