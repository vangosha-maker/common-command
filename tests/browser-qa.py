"""Self-hosted smoke: python tests/browser-qa.py (requires Python Playwright + Chromium)."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import tempfile
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOLUTIONS = ['UULLRULDDDR', 'DLUUURDDDLDDLLUUULD', 'URURRUL',
             'RUUULLLRDDRLULD', 'RDRDLDLULDDURRLD']
SAVE_KEY = 'common-command:save:v1'


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def run():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.server_port}/'
    output = Path(tempfile.mkdtemp(prefix='common-command-upgrade-', dir='/tmp'))
    try:
        for filename in ['index.html', 'style.css', 'app.js', 'engine.js', 'save.js']:
            with urllib.request.urlopen(base + filename, timeout=5) as response:
                assert response.status == 200
                assert response.read() == (ROOT / 'dist' / filename).read_bytes()
        print('PASS HTTP: HTML, CSS and all three JavaScript modules')
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
            try:
                page = browser.new_page()
                errors, failures, bad_responses = [], [], []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.on('requestfailed', lambda request: failures.append(request.url))
                page.on('response', lambda response: bad_responses.append(response.url)
                        if response.status >= 400 and not response.url.endswith('/favicon.ico') else None)
                page.goto(base, wait_until='networkidle')
                assert page.locator('[data-level="2"]').get_attribute('aria-pressed') == 'true'
                for width, height in [(1280, 1000), (600, 900), (390, 844), (320, 740)]:
                    page.set_viewport_size({'width': width, 'height': height})
                    assert page.locator('.cell').count() == 32
                    assert page.locator('[data-level]').count() == 5
                    assert page.locator('.status-icon svg').count() == 1
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                    buttons = page.locator('[data-level]').all()
                    for button in buttons:
                        box = button.bounding_box()
                        assert button.is_visible() and box['width'] >= 44 and box['height'] >= 44
                    page.screenshot(path=str(output / f'{width}.png'), full_page=True)
                print('PASS layout: 1280, 600, 390, 320px; SVG status icon; all five selectors reachable')
                page.set_viewport_size({'width': 390, 'height': 844})

                def count(value):
                    assert page.locator('#count').inner_text() == f'{value:02}'

                def reset():
                    page.locator('#reset').click()
                    count(0)

                for number, solution in enumerate(SOLUTIONS, 1):
                    page.locator(f'[data-level="{number}"]').click()
                    reset()
                    for d in solution[:3]:
                        page.locator(f'[data-dir="{d}"]').click()
                    count(3)
                    labels = page.locator('.board').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("aria-label"))')
                    page.reload(wait_until='networkidle')
                    count(3)
                    assert page.locator(f'[data-level="{number}"]').get_attribute('aria-pressed') == 'true'
                    assert page.locator('.board').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("aria-label"))') == labels
                    page.locator('#undo').click()
                    count(2)
                    reset()
                    page.reload(wait_until='networkidle')
                    count(0)
                    for d in solution:
                        page.locator(f'[data-dir="{d}"]').click()
                    assert 'синхронизация' in page.locator('#status-title').inner_text()
                    count(len(solution))
                    page.reload(wait_until='networkidle')
                    assert 'синхронизация' in page.locator('#status-title').inner_text()
                    assert all(button.is_disabled() for button in page.locator('[data-dir]').all())
                    assert page.locator('#next-level').is_visible() == (number < 5)
                    if number == 5:
                        page.screenshot(path=str(output / 'final-win.png'), full_page=True)
                    page.locator('#undo').click()
                    count(len(solution) - 1)
                    assert page.locator('#next-level').is_hidden()
                    page.locator(f'[data-dir="{solution[-1]}"]').click()
                    if number < 5:
                        page.locator('#next-level').click()
                        count(0)
                        page.reload(wait_until='networkidle')
                        assert page.locator(f'[data-level="{number+1}"]').get_attribute('aria-pressed') == 'true'
                    print(f'PASS level {number}: victory at {len(solution)}, reload, undo, reset, next/final state')

                for level, losing_move in [(4, 'L'), (5, 'D')]:
                    page.locator(f'[data-level="{level}"]').click()
                    reset()
                    page.locator(f'[data-dir="{losing_move}"]').click()
                    page.reload(wait_until='networkidle')
                    assert 'раньше' in page.locator('#status-title').inner_text()
                    assert page.locator('[data-dir="U"]').is_disabled()
                    page.keyboard.press('ArrowUp')
                    count(1)
                    page.locator('#undo').click()
                    count(0)

                page.locator('[data-level="1"]').click()
                reset()
                page.keyboard.press('ArrowUp')
                count(1)
                page.keyboard.press('w')
                count(2)
                # Playwright's key name table lacks Cyrillic characters; dispatch the browser event directly.
                page.evaluate('window.dispatchEvent(new KeyboardEvent("keydown",{key:"ц",bubbles:true}))')
                count(3)
                page.keyboard.press('Control+ArrowDown')
                count(3)
                page.locator('[data-level="1"]').click()
                count(3)  # Selecting the active task preserves its history.
                page.locator('[data-level="3"]').click()
                count(0)
                page.evaluate('(key)=>localStorage.setItem(key,"{bad")', SAVE_KEY)
                page.reload(wait_until='networkidle')
                count(0)
                assert page.locator('[data-level="2"]').get_attribute('aria-pressed') == 'true'
                page.evaluate('(key)=>localStorage.setItem(key,JSON.stringify({version:1,level:"3",moves:["X"]}))', SAVE_KEY)
                page.reload(wait_until='networkidle')
                count(0)
                assert page.locator('[data-level="2"]').get_attribute('aria-pressed') == 'true'
                # A denied storage getter must not prevent boot or interaction.
                page.add_init_script('Object.defineProperty(window,"localStorage",{get(){throw new Error("denied")}})')
                page.reload(wait_until='networkidle')
                page.locator('[data-dir="D"]').click()
                count(1)
                assert 'недоступно' in page.locator('#save-status').inner_text()
                assert errors == [], errors
                assert failures == [], failures
                assert bad_responses == [], bad_responses
                print('PASS loss/reload/freeze, arrows/W/Ц, modifier ignored, same/different task, corrupt/invalid/denied storage')
                print('PASS no JS page errors or failed application resources')
                print(f'Screenshots: {output}')
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
        print('Temporary HTTP server stopped')


if __name__ == '__main__':
    run()
