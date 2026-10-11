from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
(root / 'app/studio-html.ts').write_text('export default ' + json.dumps((root / 'public/index.html').read_text(), ensure_ascii=False) + ';\n')
