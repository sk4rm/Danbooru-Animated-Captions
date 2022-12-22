// ==UserScript==
// @name         AnimatedCaptions
// @version      2022.12.21.0
// @description  Enables native on-screen captions in videos.
// @author       skarm
// @source       https://danbooru.donmai.us/users/970979
// @match        https://*.donmai.us/posts/*
// @exclude      /^https?://\w+\.donmai\.us/.*\.(xml|json|atom)(\?|$)/
// @grant        none
// ==/UserScript==

// ----------------------------------- CONFIG -----------------------------------

const DEBUG_MODE_ENABLED = true;
const VALID_FILE_TYPES = [ ".mp4", ".webm" ];

// ------------------------------- USER INTERFACE -------------------------------

const INPUT_BOX_AND_BUTTON = `
<div id="animated-captions-ui" style="display: flex;">
    <input id="subtitle-source-input" placeholder="Paste DMail link to VTT subtitle text here." style="width:100%">
    <button id="subtitle-source-submit" style="width:auto;padding-top: 1px;padding-bottom: 1px;">Apply subtitles!</button>
</div>
`;

// ------------------------------ HELPER FUNCTIONS ------------------------------

const IS_ANIMATED = () => {
    for (const filetype of VALID_FILE_TYPES) {
        if (document.querySelector("#post-info-size").innerText.includes(filetype)) return true;
    }

    DEBUG_LOG("Post does not contain video content!");
    return false;
};

const DEBUG_LOG = text => {
    if (!DEBUG_MODE_ENABLED) return;
    console.log(`${text}`);
};

// HTML subtitles requires the subtitile files to come from the same
// domain/origin for security purposes.
// Tried using pastebin and other sites to bypass CORS but to no avail,
// so I decided to resort to dmails to host subtitle files.
const GET_VTT_FROM_DMAIL = dmailLink => {
    DEBUG_LOG("Generating IFrame that links to DMail...");
    const IFRAME = document.createElement("iframe");
    IFRAME.src = dmailLink;
    IFRAME.id = "subtitles-source";
    IFRAME.hidden = false;
    document.body.appendChild(IFRAME);
    if (document.querySelector("#subtitles-source")) DEBUG_LOG("IFrame created!");

    // Get data from iframe then delete
    DEBUG_LOG("Extracting text from DMail...");
    document.querySelector("#subtitles-source").onload = EXTRACT_AND_ENCODE_VTT;
};

const EXTRACT_AND_ENCODE_VTT = () => {
    const DMAIL_IFRAME = document.querySelector("#subtitles-source");
    const RAW_VTT = DMAIL_IFRAME.contentWindow.document.querySelector("div.prose").innerText;

    // Delete iframe after use
    DMAIL_IFRAME.hidden = true;
    DMAIL_IFRAME.remove();

    // Turn raw text into data url
    // Replace newlines with url encoded "%0A"
    const ENCODED_VTT = RAW_VTT.split("\n").join("%0A");

    // Attach to track
    CREATE_AND_ATTACH_SUBTITLES(`data:text/vtt,${ENCODED_VTT}`);
};

const CREATE_AND_ATTACH_SUBTITLES = vttData => {
    const VIDEO_ELEMENT = document.querySelector("video#image");
    if (!VIDEO_ELEMENT) { DEBUG_LOG("Unable to get video element!"); return; }

    const SUBTITLES = document.createElement("track");
    SUBTITLES.src = vttData;
    SUBTITLES.kind = "subtitles";
    SUBTITLES.srclang = "en";
    SUBTITLES.label = "English";
    SUBTITLES.default = true;
    VIDEO_ELEMENT.appendChild(SUBTITLES);

    DEBUG_LOG("Subtitles attached!");
    Danbooru.notice("Subtitles attached!", false);
};

// Add a button near the favourite button that promps for VTT DMail link
const INJECT_USER_INTERFACE = () => {
    DEBUG_LOG("Injecting link input box above video player...");
    const CONTENT_SECTION = document.querySelector("#content");
    CONTENT_SECTION.innerHTML = INPUT_BOX_AND_BUTTON + CONTENT_SECTION.innerHTML;
    if (document.querySelector("#animated-captions-ui")) DEBUG_LOG("Input box injected!");

    const SUBMIT_BUTTON = document.querySelector("#subtitle-source-submit");
    const INPUT_BOX = document.querySelector("#subtitle-source-input");

    SUBMIT_BUTTON.onclick = () => {
        const DMAIL_LINK = INPUT_BOX.value;
        DEBUG_LOG("Received submission: " + DMAIL_LINK);
        if (IS_LINK_VALID(DMAIL_LINK)) {
            GET_VTT_FROM_DMAIL(DMAIL_LINK);
            return;
        }
        Danbooru.notice("Invalid link provided. Please ensure the link is copied from \"Share\" below the DMail page.", false);
    };


};

const IS_LINK_VALID = dmailLink => {
    const URL_PREFIX = "https://danbooru.donmai.us/dmails/";

    if (dmailLink === URL_PREFIX) return false;
    if (!dmailLink.startsWith(URL_PREFIX)) return false;

    return true;
};

// ------------------------------------ MAIN ------------------------------------

const MAIN = () => {
    if (!IS_ANIMATED()) return;
    console.log("%cAnimatedCaptions v2022.12.21.0%c", "color: gold; font-size: 14px;");

    INJECT_USER_INTERFACE();
};

MAIN();