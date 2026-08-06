"""Creates /tmp/testfiles/* fixtures used by test_step1.py, test_steps2to5.py,
and test_step1_negative.py. Run this once before running those scripts.

    pip install --break-system-packages pillow requests
    python3 setup_test_files.py
"""
import os
from PIL import Image

os.makedirs('/tmp/testfiles', exist_ok=True)

img = Image.new('RGB', (200, 200), color=(120, 40, 60))
img.save('/tmp/testfiles/photo.jpg')
img.save('/tmp/testfiles/family.jpg')

for name, label in [('idproof', 'test'), ('horoscope', 'horoscope'), ('receipt', 'receipt')]:
    with open(f'/tmp/testfiles/{name}.pdf', 'w') as f:
        f.write(f'%PDF-1.4 {label}')

print('Test fixtures created in /tmp/testfiles/')
