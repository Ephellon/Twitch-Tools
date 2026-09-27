import os
WORK=os.environ.get('OFFSER_WORK','.offser')
os.makedirs(WORK,exist_ok=True)
import re, json
from html.parser import HTMLParser
src=open('ttv-tools/settings.html',encoding='utf8').read()
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.group=None; s.sec=None; s.secs=[]; s.stack=[]; s.cap=None; s.buf=''; s.select=None; s.depth=0
    def handle_starttag(s,t,a):
        a=dict(a)
        if t=='header': s.cap='header'; s.buf=''
        elif t=='section':
            s.depth+=1
            if s.depth==1:
                s.sec=dict(group=s.group,title='',new=a.get('new'),inputs=[],summary='',line=s.getpos()[0]); s.secs.append(s.sec)
        elif t=='div' and a.get('class')=='title' and s.sec is not None and not s.sec['title']: s.cap='title'; s.buf=''
        elif t=='p' and s.sec is not None and not s.sec['summary']: s.cap='p'; s.buf=''
        elif t in('input','select','textarea') and a.get('id') and s.sec is not None:
            d=dict(id=a['id'],type=a.get('type',t),default=None)
            if d['type'] in('checkbox','radio'): d['default']='checked' in a; d['name']=a.get('name'); d['value']=a.get('value')
            else: d['default']=a.get('value')
            s.sec['inputs'].append(d)
            if t=='select': s.select=d
        elif t=='option' and s.select is not None and 'selected' in a: s.select['default']=a.get('value')
    def handle_endtag(s,t):
        if t=='select': s.select=None
        if t=='section': s.depth-=1
        if s.cap and ((t=='header' and s.cap=='header') or (t=='div' and s.cap=='title') or (t=='p' and s.cap=='p')):
            txt=re.sub(r'\s+',' ',s.buf).strip()
            if s.cap=='header': s.group=txt
            elif s.cap=='title': s.sec['title']=txt
            else: s.sec['summary']=txt
            s.cap=None
    def handle_data(s,d):
        if s.cap: s.buf+=d
p=P(); p.feed(src)
secs=[x for x in p.secs if x['inputs'] or x['title']]
json.dump(secs,open(WORK+'/settings.json','w'),indent=1)
ids={i['id'] for x in secs for i in x['inputs']}
code=set()
for f in ['core.js','tools.js','chat.js','player.js','clips.js','background.js','settings.js']:
    code|=set(re.findall(r'Settings\.([A-Za-z_]\w*)',open('ttv-tools/'+f,encoding='utf8').read()))
print(len(secs),'sections',len(ids),'input ids',len(code),'keys in code')
print('in code not html:',sorted(code-ids)[:60])
print('in html not code:',len(ids-code),sorted(ids-code)[:40])
from collections import Counter; print(Counter(x['group'] for x in secs))
