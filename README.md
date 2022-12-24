# Danbooru Animated Captions

## **Demo**

[Demo post #5843334](https://danbooru.donmai.us/posts/5843334) | [Demo DMail link](https://danbooru.donmai.us/dmails/2224057?key=eyJfcmFpbHMiOnsibWVzc2FnZSI6Ik1qSXlOREExTnc9PSIsImV4cCI6bnVsbCwicHVyIjoiZG1haWxfbGluayJ9fQ%3D%3D--bdbc83bccd4f96e369a9985ef2664286fec0722b7a7c4ad5fc321c674d881a28) | [Demo gist link](https://gist.github.com/sk4rm/05d5fd19dec2b762a5cb179073f26454/raw/f75486964cad5d66be4a148ec0e23ce664f5012e/post%2520%25235843334.vtt) | [Demo pastebin link](https://pastebin.com/raw/6KHsSVh7)

https://user-images.githubusercontent.com/74897601/209259027-b4a48a13-e981-4171-9e55-51531254faf2.mp4

**Other example posts:** [posts #4287071](https://danbooru.donmai.us/posts/4287071) | [posts #4345939](https://danbooru.donmai.us/posts/4345939)

## **Installation**

1. Install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/).

2. Install [`AnimatedCaptions.user.js`](https://github.com/sk4rm/Danbooru-Animated-Captions/raw/main/AnimatedCaptions.user.js)

3. Enable the script in Tampermonkey or Greasemonkey then refresh Danbooru.

## **Usage**

In any post that contains a `.mp4` or `.webm` content, there will be an input box above the video.

1. In that input box, copy and paste the link to a pastebin, gist, or similar website containing valid VTT text for the post. Alternatively, a link to a DMail can be used; however, the DMail should contain nothing else but the VTT text.

2. Click on the `Apply subtitles!` button.

3. The video should now have subtitles in the controls (CC icon).

*As of v2022.12.22.2, WebVTT source file links in the artist commentary will be auto-detected. The link must be formatted as a DText hyperlink with the custom text "WebVTT". For example, check the translated commentary section in [post #5843334](https://danbooru.donmai.us/posts/5843334).*

## **For subtitlers**

If you would like to create VTT subtitle files manually via a text editor, you can check out [the MDN documentation for WebVTT](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API) for the syntax as well as CSS styling options.

Alternatively, there are subtitle editor softwares out there that export to `.vtt`, such as [VTT Creator](https://www.vtt-creator.com/) (web-based) or [SubtitleEdit](https://github.com/SubtitleEdit/subtitleedit) (downloadable software).

~~In order to cater towards users who aren't using the script, subtitlers would have to rewrite the time-stamped text in the artist commentary section in addition to the WebVTT file. For that, I'm thinking of adding a generator that can convert `.vtt` into simpler, human-readable format.~~

Subtitlers can also click on the `Copy subtitles!` button next to the `Apply subtitles!` button for a human-readable version of subtitles, instead of rewriting the entire subtitles for other users to see.

## **Known issues**

1. Auto-detection not working in Safari Userscript
