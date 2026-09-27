import os
WORK=os.environ.get('OFFSER_WORK','.offser')
os.makedirs(WORK,exist_ok=True)
import json, re, os, sys, urllib.request
ROOT='src'
B='https://agent.ephellon.duckdns.org'; TOK=os.environ['OFFSER_TOKEN']
MODEL=sys.argv[1] if len(sys.argv)>1 else 'gemma4:31b-cloud'
ONLY=set(sys.argv[2].split(',')) if len(sys.argv)>2 else None
chunks=json.load(open(WORK+'/chunks.json'))
src={}
PREAMBLE='''You are documenting a hand-written Chrome/Firefox MV3 extension ("TTV Tools") that adds features to twitch.tv.
Conventions: features register `Handlers.<id>` (run), `Unhandlers.<id>` (undo), `Timers.<id>` (ms; positive = interval, negative = one-shot timeout) and are started by `RegisterJob('<id>')` inside labeled blocks like `__AutoJoin__: if(parseBool(Settings.x)) {...}`. `Settings` holds user options. Common helpers from other files: `$(sel)` = querySelector, `$.all(sel)` = querySelectorAll as array, `when(...)`/`when.defined(...)` = poll until truthy (promise), `parseBool`, `defined`, `nullish`, `furnish` (create element), `wait(ms)`, `STREAMER` (current channel object), `Storage`/`Runtime`/`Container` (extension APIs), `$log/$warn/$error/$remark/$notice` (logging). Treat any name not declared in the excerpt as an external global.
The project polyfills these prototype methods, so calls to them are VALID (do not report them): Array/HTMLCollection: contains missing isolate random shuffle at findLast findLastIndex; String: anyOf contains count distanceFrom equals (case-insensitive) errs missing mutilate noneOf pad pluralSuffix sheer toImage toTitle unlike (case-insensitive not-equals); Number: ceilToNearest clamp floorToNearest prefix suffix to; Element: addToAttr getAllElementsByText getElementByText getPath isVisible modStyle queryBy setTooltip toImage; HTMLVideoElement: captureFrame copyFrame startRecording stopRecording getRecording hasRecording saveRecording removeRecording pause/resumeRecording cancelRecording passFrame supports; Promise: status; Function: toTitle wrap; Date: getAbsoluteDay getMeridiem getWeek; Document: get.
CSS selectors ending in `"i]` (case-insensitive attribute flag) are valid.

Below is ONE excerpt. Each line is prefixed with its real line number. Answer ONLY with this Markdown template, filled in tersely (bullet fragments, not prose). Write "—" for empty fields. Never invent names or line numbers that are not in the excerpt.

### Purpose
1-3 sentences: what this code does for the user (or for other code, if it is a helper).
### Runs when
Page types / frames / conditions / triggers (settings, events, timers, observers).
### Defines
Functions, classes, constants, and globals declared here that other code likely uses (name — one-line role).
### Depends on
External globals/helpers it calls (names only, comma-separated; skip browser built-ins).
### Twitch coupling
Brittle dependencies on Twitch: key CSS selectors / data-a-target values, GQL operations, URLs, endpoints (max 8, most important first).
### Storage & messaging
Storage keys read/written, Runtime.sendMessage actions, custom events, localStorage/cache keys.
### Suspected bugs
One bullet per real defect you can point to: `L<line>` — what is wrong and the consequence — confidence high/med/low. Only concrete defects (logic errors, wrong variable, missing await, race, leak, undefined name, dead branch that should run, unhandled null). No style advice. Write "—" if none.
'''
def facts(text):
    f=lambda p: sorted(set(re.findall(p,text)))
    return {
      'Settings keys': f(r'Settings\.([A-Za-z_]\w*)'),
      'Handlers': f(r'\bHandlers\.([A-Za-z_]\w*)\s*='),
      'Unhandlers': f(r'\bUnhandlers\.([A-Za-z_]\w*)\s*='),
      'Timers': f(r'\bTimers\.([A-Za-z_]\w*)\s*='),
      'RegisterJob': f(r"RegisterJob\(\s*['\"]([\w]+)"),
      'Labels': f(r'^\s*(__\w+__)\s*:',) if False else sorted(set(re.findall(r'(?m)^\s*(__\w+__)\s*:',text))),
    }
DONE=WORK+'/submitted.json'
done=set(json.load(open(DONE))) if os.path.exists(DONE) else set()
out=[]
for i,c in enumerate(chunks):
    slug=f'ttv-p1b-{i:03d}'
    c['slug']=slug
    L=src.setdefault(c['file'],open(os.path.join(ROOT,c['file']),encoding='utf8').read().split('\n'))
    body='\n'.join(f'{n}| {L[n-1]}' for n in range(c['start'],c['end']+1))
    c['facts']=facts('\n'.join(L[c['start']-1:c['end']]))
    if ONLY and slug not in ONLY: continue
    content=f"{PREAMBLE}\nFile: `{c['file']}`, lines {c['start']}–{c['end']}, section: {c['title']}\n\n```js\n{body}\n```\n"
    req=urllib.request.Request(B+'/jobs',data=json.dumps({'filename':slug,'model':MODEL,'content':content}).encode(),headers={'Authorization':'Bearer '+TOK,'Content-Type':'application/json'})
    if slug in done: continue
    for attempt in range(6):
        try:
            r=json.load(urllib.request.urlopen(req,timeout=60)); break
        except Exception as e:
            import time; time.sleep(2**attempt)
    else:
        print('FAILED',slug); continue
    out.append((slug,r.get('ok'),r.get('key'))); done.add(slug)
    json.dump(sorted(done),open(DONE,'w'))
json.dump(chunks,open(WORK+'/chunks.json','w'),indent=1)
print(len(out), [o for o in out if not o[1]][:5], out[:2])
