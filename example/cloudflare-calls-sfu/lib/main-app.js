// main app
window.addEventListener("load", onPageLoad);
window.addEventListener("beforeunload", onPageBeforeUnload);
var isTabPage = true;

/**
 * on page load
 */
function onPageLoad() {

    // tab page
    if (isTabPage) {
        initTabPage();
    }

    // init local video.
    initLocalVideo();

    // load module.
    import('lib/main.mjs')
        .then((m) => {
            m.authLoginAccessToken();
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

/**
 * Init local video.
 */
function initLocalVideo() {
    $(function () {
        $("#resizableLocal").resizable({
            alsoResize: "#localVideo"
        });
        $("#localVideo").resizable();

        $("#dialogVideoLocal").dialog({
            title: "Local Video",
            autoOpen: false,
            draggable: true,
            resizable: true,
            modal: false,
            width: 400,
            height: 400,
            show: { effect: "explode", duration: 300 },
            hide: { effect: "explode", duration: 300 },
            position: {
                my: "right center",
                at: "right center"
            }
        });

        $("#videoLocalShow").on("click",
            function () {

                // If contact details set.
                if (uniqueIDElement.value && applicationIDElement.value) {

                    // Change local video title.
                    var title = uniqueIDElement.value + " from " + applicationIDElement.value;
                    $('#dialogVideoLocal').dialog({ title: "Local Video - " + title })
                }
                $("#dialogVideoLocal").dialog("open");
            });

        $('#dialogVideoLocal').bind("dialogresize", function (event, ui) {
            $('#dialogVideoLocal #resizableLocal').css('height', ($('#dialogVideoLocal').height() - 15) + 'px');
            $('#dialogVideoLocal #resizableLocal').css('width', ($('#dialogVideoLocal').width() - 15) + 'px');

            $('#resizableLocal #localVideo').css('height', ($('#resizableLocal').height()) + 'px');
            $('#resizableLocal #localVideo').css('width', ($('#resizableLocal').width()) + 'px');
        });

        $("#dialogRemoteVideoShow").dialog({
            title: "Remote Videos",
            autoOpen: false,
            draggable: true,
            resizable: true,
            modal: false,
            width: 500,
            height: 500,
            show: { effect: "explode", duration: 300 },
            hide: { effect: "explode", duration: 300 },
            position: {
                my: "left top",
                at: "left top"
            }
        });

        $("#videoRemoteShow").on("click",
            function () {
                $("#dialogRemoteVideoShow").dialog("open");
            });

        $("#dialogAddNewContact").dialog({
            title: "Add New Contact",
            autoOpen: false,
            draggable: true,
            resizable: false,
            modal: true,
            width: 500,
            height: 200,
            show: { effect: "explode", duration: 300 },
            hide: { effect: "explode", duration: 300 },
            position: {
                my: "center top",
                at: "center top"
            },
            buttons: {
                Add: function () {
                    // Get the inputs.
                    var uID = contactUniqueIDAddNew.value;
                    var aIP = contactApplicationIDAddNew.value;

                    // If contact details set.
                    if (uID && aIP) {
                        // Add to list.
                        conferenceContactList.push(uID);

                        // Create the conference contacts.
                        createConferenceContact(uID, aIP);

                        // Create the conference contacts.
                        createNewContact(uID, aIP);
                    }
                    $(this).dialog("close");
                },
                Cancel: function () {
                    $(this).dialog("close");
                }
            }
        });

        $("#addNewContact").on("click",
            function () {
                contactUniqueIDAddNew.value = "";
                contactApplicationIDAddNew.value = conferenceApplicationID;
                $("#dialogAddNewContact").dialog("open");
            });
    });
}

/**
 * init remote video.
 * @param {any} resizableRemote
 * @param {any} remoteVideo
 * @param {any} dialogVideoRemote
 * @param {any} videoRemoteShow
 * @param {any} uniqueID
 * @param {any} applicationID
 */
function initRemoteVideo(resizableRemote, remoteVideo, dialogVideoRemote, videoRemoteShow, uniqueID, applicationID) {
    $("#" + resizableRemote).resizable({
        alsoResize: "#" + remoteVideo
    });
    $("#" + remoteVideo).resizable();

    $("#" + dialogVideoRemote).dialog({
        title: "Remote Video",
        autoOpen: false,
        draggable: true,
        resizable: true,
        modal: false,
        width: 400,
        height: 400,
        show: { effect: "explode", duration: 300 },
        hide: { effect: "explode", duration: 300 },
        position: {
            my: "left bottom",
            at: "left bottom"
        }
    });

    $("#" + videoRemoteShow).on("click",
        function () {

            // Change remote video title.
            var title = uniqueID + " from " + applicationID;
            contactUniqueIDElement.value = uniqueID;
            contactApplicationIDElement.value = applicationID;
            $('#' + dialogVideoRemote).dialog({ title: "Remote Video - " + title });
            $("#" + dialogVideoRemote).dialog("open");
        });

    $("#" + dialogVideoRemote).bind("dialogresize", function (event, ui) {
        $('#' + dialogVideoRemote + ' #' + resizableRemote).css('height', ($('#' + dialogVideoRemote).height() - 15) + 'px');
        $('#' + dialogVideoRemote + ' #' + resizableRemote).css('width', ($('#' + dialogVideoRemote).width() - 15) + 'px');

        $('#' + resizableRemote + ' #' + remoteVideo).css('height', ($('#' + resizableRemote).height()) + 'px');
        $('#' + resizableRemote + ' #' + remoteVideo).css('width', ($('#' + resizableRemote).width()) + 'px');
    });
}

/**
 * init the tab page selected.
 */
function initTabPage() {

    // init
    var bOneElement = document.getElementById("bOne");
    bOneElement.addEventListener("click", (e) => {
        openTabPage('divOne', bOneElement, '#4CAF50')
    });

    var bTwoElement = document.getElementById("bTwo");
    bTwoElement.addEventListener("click", (e) => {
        openTabPage('divTwo', bTwoElement, '#4CAF50')
    });

    var bThreeElement = document.getElementById("bThree");
    bThreeElement.addEventListener("click", (e) => {
        openTabPage('divThree', bThreeElement, '#4CAF50')
    });

    var bFourElement = document.getElementById("bFour");
    bFourElement.addEventListener("click", (e) => {
        openTabPage('divFour', bFourElement, '#4CAF50')
    });

    var bFiveElement = document.getElementById("bFive");
    bFiveElement.addEventListener("click", (e) => {
        openTabPage('divFive', bFiveElement, '#4CAF50')
    });

    var bSixElement = document.getElementById("bSix");
    bSixElement.addEventListener("click", (e) => {
        openTabPage('divSix', bSixElement, '#4CAF50')
    });

    var bSevenElement = document.getElementById("bSeven");
    bSevenElement.addEventListener("click", (e) => {
        openTabPage('divSeven', bSevenElement, '#4CAF50')
    });

    // Get the element with id="bOne" and click on it
    document.getElementById("bOne").click();

}

/**
* open the tab page selected.
*
* @param {string}      pageName	the name of the tab page.
* @param {object}      elmnt		the current tab element.
* @param {string}		color		the color of the tab.
*/
function openTabPage(pageName, elmnt, color) {

    // Hide all elements with class="tabContent" by default */
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabContent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove the background color of all tablinks/buttons
    tablinks = document.getElementsByClassName("tabLink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }

    // Show the specific tab content
    document.getElementById(pageName).style.display = "block";

    // Add the specific color to the button used to open the tab content.
    elmnt.style.backgroundColor = color;
}

var conferenceAppID = '';
var uniqueID = '';

var containerDivElement = null;
var conatinerDivRemoteVideoShow = null;
var localVideoElement = null;

var audioInputSelect = null;
var audioOutputSelect = null;
var videoSelect = null;
var selectors = null;

var uniqueIDElement = null;
var applicationIDElement = null;
var availableElement = null;
var broadcastElement = null;
var broadcastAppIDElement = null;
var clientStateElement = null;

var contactUniqueIDElement = null;
var contactApplicationIDElement = null;
var contactUniqueIDListButton = null;
var contactApplicationIDListButton = null;
var contactGroupListButton = null;
var alertTextList = null;

var startCamButton = null;
var stopCamButton = null;
var toggleMuteAudioButton = null;
var toggleMuteAllRemoteButton = null;

var videoCallButton = null;
var endCallButton = null;
var alertTextElement = null;
var alertTextBackElement = null;
var alertTextMessageElement = null;
var changeSettingsButton = null;
var clientStateButton = null;

var contactAvailableButton = null;
var contactSendMessageElement = null;
var contactSendMessageButton = null;
var contactSendMessageClearButton = null;
var contactClearListButton = null;

var useVideoElement = null;
var useAudioElement = null;
var useScreenElement = null;
var useWindowElement = null;

var localVolumeControlElement = null;
var remoteVolumeControlElement = null;

var fileInput = null;
var statusMessage = null;
var downloadAnchor = null;
var sendReceiveProgress = null;
var fileInputStartTransferButton = null;
var fileInputStopTransferButton = null;

var recordedBlobs = [];
var startRecodingButton = null;
var stopRecodingButton = null;

var conferenceIndex = 0;
var conferenceContactList = [];
var conferenceApplicationID = null;
var conferenceDialogVideoRemoteDiv = [];
var conferenceResizableRemoteDiv = [];
var conferenceRemoteVideoElement = [];
var conferenceRemoteShowElement = [];
var conferenceRemoteVolumeElement = [];
var conferenceRemoteStateElement = [];
var conferenceRemoteDiv = [];