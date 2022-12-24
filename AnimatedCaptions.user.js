// ==UserScript==
// @name         AnimatedCaptions
// @version      2022.12.23.1
// @description  Enables native on-screen captions in videos.
// @author       skarm
// @downloadURL  https://github.com/sk4rm/Danbooru-Animated-Captions/raw/main/AnimatedCaptions.user.js
// @updateURL    https://github.com/sk4rm/Danbooru-Animated-Captions/raw/main/AnimatedCaptions.user.js
// @source       https://danbooru.donmai.us/users/970979
// @match        https://*.donmai.us/posts/*
// @exclude      /^https?://\w+\.donmai\.us/.*\.(xml|json|atom)(\?|$)/
// @grant        GM.xmlHttpRequest
// @connect      gist.githubusercontent.com
// @connect      pastebin.com
// @connect      *
// ==/UserScript==

// ----------------------------------- CONFIG -----------------------------------

const DEBUG_MODE_ENABLED = true;
const VALID_FILE_TYPES = [ ".mp4", ".webm" ];

// ------------------------------- USER INTERFACE -------------------------------

const INPUT_BOX_AND_BUTTONS = `
<div id="animated-captions-ui" style="display: flex;">
    <input id="subtitle-source-input" placeholder="Paste link to raw VTT subtitles here." style="width:100%">
    <button id="subtitle-source-submit" style="width:auto;border-radius:0;border-left:0;" disabled>Apply subtitles</button>
    <button id="subtitle-source-copy" style="width:auto;border-radius:0;border-left:0" disabled>Copy subtitles</button>
</div>
`;

// ------------------------------ HELPER FUNCTIONS ------------------------------

const IS_VIDEO = () => {
    for (const filetype of VALID_FILE_TYPES) {
        if (document.querySelector("#post-info-size").innerText.includes(filetype)) return true;
    }

    DEBUG_LOG("Post does not contain video content!");
    return false;
};

const DEBUG_LOG = (text) => {
    if (!DEBUG_MODE_ENABLED) return;
    console.log(`${text}`);
};

const NOTIFY_INVALID_LINK = (additionalContext = "") => {
    Danbooru.notice(`Invalid link provided. ${additionalContext}`, false);
}

// ------------------------------------------------------------------------------

const INJECT_USER_INTERFACE = () => {
    DEBUG_LOG("Injecting input box above video player...");
    const CONTENT_SECTION = document.querySelector("#content");
    CONTENT_SECTION.innerHTML = INPUT_BOX_AND_BUTTONS + CONTENT_SECTION.innerHTML;
    if (document.querySelector("#animated-captions-ui")) DEBUG_LOG("Input box injected!");

    // Inject functionality
    const SUBMIT_BUTTON = document.querySelector("#subtitle-source-submit");
    const COPY_BUTTON = document.querySelector("#subtitle-source-copy");
    const INPUT_BOX = document.querySelector("#subtitle-source-input");
    SUBMIT_BUTTON.onclick = VALIDATE_LINK;
    INPUT_BOX.oninput = e => {
        if (e.key === "Enter") VALIDATE_LINK();
        SUBMIT_BUTTON.disabled = !INPUT_BOX.value;
        // COPY_BUTTON.disabled = !INPUT_BOX.value;
        // Only allow for copy after apply
        COPY_BUTTON.disabled = true;
    };
};

const VALIDATE_LINK = () => {
    const INPUT_BOX = document.querySelector("#subtitle-source-input");
    const URL = INPUT_BOX.value;
    DEBUG_LOG("Checking URL: " + URL);

    // data:text/vtt URLs
    if (URL.startsWith("data:text/vtt,")) {
        CREATE_AND_ATTACH_SUBTITLES(URL);
        return;
    }

    // Empty strings
    if (!URL.trim()) {
        DEBUG_LOG("Empty link given");
        NOTIFY_INVALID_LINK();
        return;
    }

    // Non-HTTP URLs
    if (!URL.startsWith("http")) {
        DEBUG_LOG("Link given is not a valid HTTP URL");
        NOTIFY_INVALID_LINK();
        return;
    }

    // DMail
    if (URL.startsWith("https://danbooru.donmai.us/dmails/")) {
        GET_VTT_FROM_DMAIL(URL);
        return;
    }

    // External (e.g. raw pastebin, raw gist)
    GET_VTT_FROM_EXTERNAL(URL);
};

const GET_VTT_FROM_DMAIL = (dmailLink) => {
    DEBUG_LOG("Generating IFrame that links to DMail...");
    const IFRAME = document.createElement("iframe");
    IFRAME.src = dmailLink;
    IFRAME.id = "subtitles-source";
    IFRAME.hidden = false;
    document.body.appendChild(IFRAME);
    if (document.querySelector("#subtitles-source")) DEBUG_LOG("IFrame created!");

    // Get data from iframe then delete
    DEBUG_LOG("Extracting text from DMail...");
    document.querySelector("#subtitles-source").onload = PROCESS_VTT_FROM_DMAIL;
};

const GET_VTT_FROM_EXTERNAL = (url) => {
    DEBUG_LOG(`Performing HTTP request to ${url}...`);
    GM.xmlHttpRequest({
        method: "GET",
        url: url,
        onload: res => { PROCESS_VTT_FROM_EXTERNAL(res); }
    });
};

// Legacy (uses iframes)
const PROCESS_VTT_FROM_DMAIL = () => {
    const DMAIL_IFRAME = document.querySelector("#subtitles-source");
    const RAW_VTT = DMAIL_IFRAME.contentWindow.document.querySelector("div.prose").innerText;

    MAKE_WEBVTT_HUMAN_READABLE(RAW_VTT);

    // Delete iframe after use
    DMAIL_IFRAME.hidden = true;
    DMAIL_IFRAME.remove();

    // Turn raw text into data url
    // Replace newlines with url encoded "%0A"
    const ENCODED_VTT = RAW_VTT.split("\n").join("%0A");

    // Attach to track
    CREATE_AND_ATTACH_SUBTITLES(`data:text/vtt,${ENCODED_VTT}`);
};

// GM.xmlHttpRequest onload callback
const PROCESS_VTT_FROM_EXTERNAL = (xhr) => {
    const RAW_VTT = xhr.responseText;
    if (!RAW_VTT.startsWith("WEBVTT")) {
        DEBUG_LOG("Linked file doesn't seem like a valid WEBVTT format. Aborting...");
        NOTIFY_INVALID_LINK();
        return;
    }

    MAKE_WEBVTT_HUMAN_READABLE(RAW_VTT);

    const ENCODED_VTT = RAW_VTT.split("\n").join("%0A");
    CREATE_AND_ATTACH_SUBTITLES(`data:text/vtt,${ENCODED_VTT}`);
};

// vttDataURL is a string in the format of `data:text/vtt,WEBVTT%0A...`
const CREATE_AND_ATTACH_SUBTITLES = (vttDataURL) => {
    const VIDEO_ELEMENT = document.querySelector("video#image");
    if (!VIDEO_ELEMENT) { DEBUG_LOG("Unable to get video element!"); return; }

    const SUBTITLES = document.createElement("track");
    SUBTITLES.src = vttDataURL;
    SUBTITLES.kind = "subtitles";
    SUBTITLES.srclang = "en";
    SUBTITLES.label = "English";
    SUBTITLES.default = true;

    const EXISTING_SUBTITLES = document.querySelector("track#subtitle-track");
    // If there are existing subs, remove them first
    if (!!EXISTING_SUBTITLES) {
        DEBUG_LOG("Existing subtitles detected and will be overridden!");
        EXISTING_SUBTITLES.remove();
    }
    SUBTITLES.id = "subtitle-track"
    VIDEO_ELEMENT.appendChild(SUBTITLES);

    DEBUG_LOG("Subtitles attached!");
    Danbooru.notice("Subtitles attached!", false);
};

const CHECK_FOR_WEBVTT_LINKS = () => {
    // TODO search comments section too but:
    //      1. link present in commentary takes precedent
    //      2. if no link is present in commentary, the latest comment takes precedent
    // const COMMENTS_SECTION = document.querySelector("#comments");

    // Capture links in format "WebVTT":[<any HTTP link>]
    const COMMENTARY_LINKS = document.querySelectorAll("#artist-commentary a");
    for (const LINK of COMMENTARY_LINKS) {
        if (LINK.innerHTML !== "WebVTT") continue;

        // Grab the link (example: "https://pastebin.com/raw/6KHsSVh7")
        const URL = LINK.getAttribute("href");
        DEBUG_LOG(`WebVTT link detected in artist commentary ${URL}`);
        Danbooru.notice("WebVTT link detected in artist commentary. Subtitles will be attached automatically.", false);

        const INPUT_BOX = document.querySelector("#subtitle-source-input");
        INPUT_BOX.value = URL;
        VALIDATE_LINK();

        return;
    }
};

// vttRaw is a string in the format of `WEBVTT\n1\n00:...`
// Convert that string into readable text format:
// <time stamp><space><cue text>
// e.g. 0:01 Bocchi-chan! Bocchi-chan!
const MAKE_WEBVTT_HUMAN_READABLE = (vttRaw) => {
    DEBUG_LOG("Converting raw VTT text into human-readable text...");

    // Any line containing "-->" is a time stamp line
    // Any line that comes after that isn't an empty new line are cue texts

    const TIME_STAMPS = [];
    const CUES = [];

    // Compile time stamps and cue texts
    const LINES = vttRaw.split("\n");
    let is_cue_text = false;
    let buffer = "";
    for (const LINE of LINES) {
        // Time stamp line
        if (LINE.includes("-->")) {
            TIME_STAMPS.push(GET_TIME_STAMP(LINE));
            is_cue_text = true;
            continue;
        }

        // Empty line
        if (LINE.trim() === "") {
            if (buffer) CUES.push(buffer.trim());
            buffer = "";
            is_cue_text = false;
        }

        // Cue line
        if (is_cue_text) buffer += LINE.trim() + " ";
    }
    DEBUG_LOG(`Parsed ${TIME_STAMPS.length} time stamps and ${CUES.length} cues`);

    // Join to a string
    if (TIME_STAMPS.length !== CUES.length) { DEBUG_LOG("Time stamp and cue mismatch! Aborting..."); return; }
    buffer = "";
    for (let i = 0; i < TIME_STAMPS.length; i++) {
        buffer += `${TIME_STAMPS[i]} ${CUES[i]}\n`;
    }

    // Copy to clipboard
    const COPY_BUTTON = document.querySelector("#subtitle-source-copy");
    COPY_BUTTON.onclick = () => {
        navigator.clipboard.writeText(buffer);
        Danbooru.notice("Subtitles copied to clipboard! Paste in artist commentary or comments for others to see.");
    };
    COPY_BUTTON.disabled = false;
};

const GET_TIME_STAMP = (lineContainingTimeStamp) => {
    // "00:00:25.676 --> 00:00:27.542" becomes "00:00:25"
    const INDEX_OF_DOT = lineContainingTimeStamp.indexOf(".");
    const TIME_STAMP = lineContainingTimeStamp.substr(0, INDEX_OF_DOT);

    return TIME_STAMP;
};

const TRIM_TIME_STAMP = (timeStamps) => {
    // HH:MM:SS --> MM:SS or M:SS if possible
    const LAST_TIME_STAMP = timeStamps[timeStamps.length - 1];

    // TODO

    let charsToTrim = 0;
    for (const CHAR of LAST_TIME_STAMP) {
        if (CHAR === ":" || CHAR === "0") { charsToTrim++; continue; }
        break;
    }

    for (let i = 0; i < timeStamps.length; i++) {
        timeStamps[i] = timeStamps[i].substr();
    }

    return timeStamps;
};

// ------------------------------------ MAIN ------------------------------------

const MAIN = () => {
    if (!IS_VIDEO()) return;
    console.log("%cAnimatedCaptions v2022.12.21.0%c", "color: gold; font-size: 14px;");

    INJECT_USER_INTERFACE();
    CHECK_FOR_WEBVTT_LINKS();
};

MAIN();