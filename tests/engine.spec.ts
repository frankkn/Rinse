import { test, expect, type Page } from '@playwright/test'

function readPct(page: Page): Promise<number> {
  return page
    .getByTestId('progress')
    .innerText()
    .then((t) => parseInt(t.replace('%', ''), 10))
}

/** Drag the nozzle back and forth to cover the whole surface. */
async function scrub(page: Page, passes: 'rows' | 'cols') {
  const box = (await page.getByTestId('wash-surface').boundingBox())!
  const pad = 6
  const step = 34
  await page.mouse.move(box.x + pad, box.y + pad)
  await page.mouse.down()

  if (passes === 'rows') {
    let dir = 1
    for (let y = box.y + pad; y <= box.y + box.height - pad; y += step) {
      const x0 = dir > 0 ? box.x + pad : box.x + box.width - pad
      const x1 = dir > 0 ? box.x + box.width - pad : box.x + pad
      await page.mouse.move(x1, y, { steps: 15 })
      dir *= -1
      void x0
    }
  } else {
    let dir = 1
    for (let x = box.x + pad; x <= box.x + box.width - pad; x += step) {
      const y1 = dir > 0 ? box.y + box.height - pad : box.y + pad
      await page.mouse.move(x, y1, { steps: 15 })
      dir *= -1
    }
  }

  await page.mouse.up()
}

test('erasing reveals the clean surface and progress climbs', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByTestId('wash-surface').locator('canvas')).toHaveCount(3)
  expect(await readPct(page)).toBe(0)

  await scrub(page, 'rows')
  await page.waitForTimeout(250)
  expect(await readPct(page)).toBeGreaterThan(40)
})

test('thorough scrubbing completes the level and fires the chime overlay', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await scrub(page, 'rows')
  await scrub(page, 'cols')
  // onComplete flips the overlay in when progress >= target (0.98).
  await expect(page.getByText('乾淨溜溜')).toBeVisible({ timeout: 5000 })
})
