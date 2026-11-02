"""Render the code-native s-in-zero / superscript-x creator mark."""
from pathlib import Path
from PIL import Image, ImageDraw
import math
ROOT=Path(__file__).resolve().parent.parent
C='#e8dfc9'
# Shared vector geometry, no font dependency.
S=[((68,44),(56,34),(36,38),(37,52)),((37,52),(38,65),(67,56),(67,72)),((67,72),(67,87),(45,91),(35,81))]
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><g fill="none" stroke="'+C+'" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="52" cy="66" rx="35" ry="49"/><path d="M68 44 C56 34 36 38 37 52 C38 65 67 56 67 72 C67 87 45 91 35 81"/><path d="m96 10 21 23 m0-23-21 23"/></g></svg>'
(ROOT/'extension/icons/mark.svg').write_text(svg+'\n')
for size in (16,32,48,128):
 scale=size*4/128
 im=Image.new('RGBA',(size*4,size*4),'#101918');d=ImageDraw.Draw(im)
 w=max(1,round(8*scale))
 def line(points):
  pts=[(round(x*scale),round(y*scale)) for x,y in points];d.line(pts,fill=C,width=w,joint='curve')
  for x,y in (pts[0],pts[-1]):d.ellipse((x-w/2,y-w/2,x+w/2,y+w/2),fill=C)
 line([(52+35*math.cos(t*math.tau/180),66+49*math.sin(t*math.tau/180)) for t in range(181)])
 for a,b,c,e in S:
  line([tuple((1-t)**3*a[j]+3*(1-t)**2*t*b[j]+3*(1-t)*t*t*c[j]+t**3*e[j] for j in (0,1)) for t in [i/40 for i in range(41)]])
 line([(96,10),(117,33)]);line([(117,10),(96,33)])
 im.resize((size,size),Image.Resampling.LANCZOS).save(ROOT/f'extension/icons/{size}.png')
