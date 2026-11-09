const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs/promises');

const appUrl = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

test.beforeEach(async ({ page }) => { await page.goto(appUrl); });

async function addGoal(page, name = 'Goal') {
  await page.getByRole('button', { name: 'Add goal' }).click();
  await page.locator('#canvas').click({ position: { x: 300, y: 200 } });
  await page.getByLabel('Name', { exact: true }).fill(name);
}

test('T-001 create, rename, select and delete a goal', async ({ page }) => {
  await expect(page.locator('#count')).toHaveText('0 goals');
  await addGoal(page, 'Improve learning');
  const goal = page.getByRole('button', { name: 'Goal: Improve learning' });
  await expect(goal).toBeVisible();
  await expect(page.locator('#count')).toHaveText('1 goal');
  await page.locator('#canvas').click({ position: { x: 30, y: 30 } });
  await goal.click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Improve learning');
  await page.getByRole('button', { name: 'Delete goal' }).click();
  await expect(page.locator('#count')).toHaveText('0 goals');
  await expect(goal).toHaveCount(0);
});

test('T-002 drag and arrow keys move a goal within the canvas', async ({ page }) => {
  await addGoal(page);
  const goal = page.getByRole('button', { name: 'Goal: Goal' });
  const initial = await goal.getAttribute('transform');
  await goal.scrollIntoViewIfNeeded();
  const box = await goal.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 30, { steps: 5 });
  await page.mouse.up();
  const dragged = await goal.getAttribute('transform');
  expect(dragged).not.toBe(initial);
  await goal.focus();
  await page.keyboard.press('ArrowRight');
  expect(await goal.getAttribute('transform')).not.toBe(dragged);
  for (let i = 0; i < 150; i++) await page.keyboard.press('ArrowRight');
  expect(await goal.getAttribute('transform')).toMatch(/^translate\(1096 [\d.]+\)$/);
});

test('T-003 save and reopen preserves goal name and position', async ({ page }) => {
  await addGoal(page, 'Preserve this goal');
  const before = await page.getByRole('button', { name: 'Goal: Preserve this goal' }).getAttribute('transform');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save diagram' }).click();
  const download = await downloadPromise;
  const saved = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(saved.goals).toHaveLength(1);
  expect(saved.goals[0].name).toBe('Preserve this goal');
  await page.getByRole('button', { name: 'Delete goal' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#file').setInputFiles(await download.path());
  const reopened = page.getByRole('button', { name: 'Goal: Preserve this goal' });
  await expect(reopened).toBeVisible();
  await expect(reopened).toHaveAttribute('transform', before);
  await expect(page.locator('#count')).toHaveText('1 goal');
});

test('T-004 invalid files report an error and preserve the diagram', async ({ page }) => {
  await addGoal(page, 'Keep me');
  for (const contents of ['{broken', JSON.stringify({ format: 'intentweave-goals', version: 1, goals: [{ id: 'a', type: 'goal', name: 'Bad', x: 'invalid', y: 50 }] })]) {
    await page.locator('#file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
    await expect(page.getByRole('status')).toContainText('Could not open file:');
    await expect(page.getByRole('button', { name: 'Goal: Keep me' })).toBeVisible();
    await expect(page.locator('#count')).toHaveText('1 goal');
  }
});

test('T-005 keyboard focus selects, moves and deletes a goal', async ({ page }) => {
  await addGoal(page, 'Keyboard goal');
  const goal = page.getByRole('button', { name: 'Goal: Keyboard goal' });
  await page.locator('#canvas').click({ position: { x: 30, y: 30 } });
  await goal.focus();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Keyboard goal');
  const before = await goal.getAttribute('transform');
  await page.keyboard.press('ArrowDown');
  expect(await goal.getAttribute('transform')).not.toBe(before);
  await page.keyboard.press('Delete');
  await expect(page.locator('#count')).toHaveText('0 goals');
});
test('T-060 placing an element preserves the viewport and canvas scroll position', async ({ page }) => {
  await page.setViewportSize({width:800,height:600});
  await page.getByRole('button',{name:'Add goal',exact:true}).click();
  await page.evaluate(() => { window.scrollTo(0,0); document.querySelector('.canvas-scroll').scrollLeft = 100; });
  const before=await page.evaluate(() => ({x:window.scrollX,y:window.scrollY,canvas:document.querySelector('.canvas-scroll').scrollLeft}));
  const canvas=await page.locator('#canvas').boundingBox();
  await page.mouse.click(Math.max(canvas.x + 200, 300),canvas.y + 150);
  const after=await page.evaluate(() => ({x:window.scrollX,y:window.scrollY,canvas:document.querySelector('.canvas-scroll').scrollLeft}));
  expect(after).toEqual(before);
  await expect(page.getByRole('button',{name:'Goal: Goal'})).toBeVisible();
});
