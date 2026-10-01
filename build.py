from pathlib import Path
r=Path(__file__).parent
engine=(r/'vendor/three.cjs').read_text()
game=(r/'game.js').read_text()+'\n'+(r/'network.js').read_text()
html=(r/'shell.html').read_text().replace('<!-- ENGINE -->','<script>'+(r/'vendor/peerjs.min.js').read_text()+'</script><!-- ENGINE -->').replace('<!-- ENGINE -->','<script>window.THREE={};(function(exports){\n'+engine+'\n})(window.THREE);</script>').replace('<!-- GAME -->',game)
(r/'index.html').write_text(html)
print('Built standalone Three.js game',len(html.encode()))
