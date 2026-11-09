const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs/promises');
const appUrl = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

const types = [
  { type: 'softgoal', label: 'Quality', shape: 'path', ids: ['006', '007', '008', '009', '010'] },
  { type: 'task', label: 'Task', shape: 'polygon', ids: ['011', '012', '013', '014', '015'] },
  { type: 'resource', label: 'Resource', shape: 'rect', ids: ['016', '017', '018', '019', '020'] },
];

test.beforeEach(async ({ page }) => { await page.goto(appUrl); });

async function add(page, item, name = item.label, position = { x: 300, y: 200 }) {
  await page.locator(`#${item.type}-tool`).click();
  await page.locator('#canvas').click({ position });
  await page.getByLabel('Name', { exact: true }).fill(name);
}
const element = (page, item, name = item.label) => page.getByRole('button', { name: `${item.label}: ${name}`, exact: true });
async function upload(page, data) {
  await page.locator('#file').setInputFiles({ name: 'diagram.json', mimeType: 'application/json', buffer: Buffer.from(data) });
}

for (const item of types) {
  test(`T-${item.ids[0]} create, name, select and delete ${item.type}`, async ({ page }) => {
    await add(page, item, 'New name');
    const shape = element(page, item, 'New name');
    await expect(shape.locator(item.shape)).toHaveCount(1);
    await expect(page.locator('#count')).toHaveText('1 element');
    await page.locator('#canvas').click({ position: { x: 30, y: 30 } });
    await shape.click();
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('New name');
    await page.getByRole('button', { name: `Delete ${item.label.toLowerCase()}` }).click();
    await expect(shape).toHaveCount(0);
    await expect(page.locator('#count')).toHaveText('0 goals');
  });

  test(`T-${item.ids[1]} drag and arrow keys move ${item.type} within the canvas`, async ({ page }) => {
    await add(page, item);
    const shape = element(page, item);
    const before = await shape.getAttribute('transform');
    await shape.scrollIntoViewIfNeeded();
  const box = await shape.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 30, { steps: 5 });
    await page.mouse.up();
    const moved = await shape.getAttribute('transform');
    expect(moved).not.toBe(before);
    await shape.focus();
    await page.keyboard.press('ArrowRight');
    expect(await shape.getAttribute('transform')).not.toBe(moved);
    for (let i = 0; i < 150; i++) await page.keyboard.press('ArrowRight');
    await expect(shape).toHaveAttribute('transform', /^translate\(1096 [\d.]+\)$/);
  });

  test(`T-${item.ids[2]} save and reopen ${item.type} preserves type, name and position`, async ({ page }) => {
    await add(page, item, 'Saved name');
    const before = await element(page, item, 'Saved name').getAttribute('transform');
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save diagram' }).click();
    const download = await pending;
    const contents = await fs.readFile(await download.path(), 'utf8');
    const data = JSON.parse(contents);
    expect(data.elements).toHaveLength(1);
    expect(data.elements[0]).toMatchObject({ type: item.type, name: 'Saved name' });
    await page.getByRole('button', { name: `Delete ${item.label.toLowerCase()}` }).click();
    page.once('dialog', dialog => dialog.accept());
    await upload(page, contents);
    await expect(element(page, item, 'Saved name')).toHaveAttribute('transform', before);
  });

  test(`T-${item.ids[3]} invalid files preserve ${item.type}`, async ({ page }) => {
    await add(page, item, 'Keep me');
    for (const [contents, expected] of [['{broken', 'Could not open file:'], [JSON.stringify({ format: 'intentweave-diagram', version: 2, elements: [{ id: 'bad', type: item.type, name: 'Bad', x: 'invalid', y: 50 }] }), 'The diagram contains invalid goal data.']]) {
      await upload(page, contents);
      await expect(page.getByRole('status')).toContainText(expected);
      await expect(element(page, item, 'Keep me')).toBeVisible();
      await expect(page.locator('#count')).toHaveText('1 element');
    }
  });

  test(`T-${item.ids[4]} keyboard focus selects, moves and deletes ${item.type}`, async ({ page }) => {
    await add(page, item, 'Keyboard name');
    const shape = element(page, item, 'Keyboard name');
    await page.locator('#canvas').click({ position: { x: 30, y: 30 } });
    await shape.focus();
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Keyboard name');
    const before = await shape.getAttribute('transform');
    await page.keyboard.press('ArrowDown');
    expect(await shape.getAttribute('transform')).not.toBe(before);
    await page.keyboard.press('Delete');
    await expect(shape).toHaveCount(0);
  });
}

test('T-021 mixed diagram round trip preserves all four element types', async ({ page }) => {
  const all = [{ type: 'goal', label: 'Goal' }, ...types];
  for (let i = 0; i < all.length; i++) await add(page, all[i], `Item ${i}`, { x: 150 + i * 130, y: 200 });
  const before = await Promise.all(all.map((item, i) => element(page, item, `Item ${i}`).getAttribute('transform')));
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save diagram' }).click();
  const contents = await fs.readFile(await (await pending).path(), 'utf8');
  const data = JSON.parse(contents);
  expect(data.elements.map(item => item.type)).toEqual(all.map(item => item.type));
  await page.reload();
  await upload(page, contents);
  for (let i = 0; i < all.length; i++) await expect(element(page, all[i], `Item ${i}`)).toHaveAttribute('transform', before[i]);
  await expect(page.locator('#count')).toHaveText('4 elements');
});

test('T-022 open legacy version 1 goal diagram', async ({ page }) => {
  const old = { format: 'intentweave-goals', version: 1, goals: [{ id: 'old-goal', type: 'goal', name: 'Previous goal', x: 300, y: 250 }] };
  await upload(page, JSON.stringify(old));
  await expect(page.getByRole('button', { name: 'Goal: Previous goal' })).toHaveAttribute('transform', 'translate(300 250)');
});

test('T-023 palette and diagram use the specified pastel element colors', async ({ page }) => {
  const colors = [
    { type: 'goal', label: 'Goal', shape: 'ellipse', color: 'rgb(255, 244, 203)' },
    { type: 'softgoal', label: 'Quality', shape: 'path', color: 'rgb(255, 234, 219)' },
    { type: 'task', label: 'Task', shape: 'polygon', color: 'rgb(224, 243, 220)' },
    { type: 'resource', label: 'Resource', shape: 'rect', color: 'rgb(222, 237, 255)' },
  ];
  for (let i = 0; i < colors.length; i++) {
    const item = colors[i];
    await expect(page.locator(`#${item.type}-tool ${item.shape}`)).toHaveCSS('fill', item.color);
    await add(page, item, `Color ${i}`, { x: 150 + i * 130, y: 200 });
    await expect(element(page, item, `Color ${i}`).locator('.shape')).toHaveCSS('fill', item.color);
  }
});

test('T-024 palette shapes show their element names', async ({ page }) => {
  for (const [type, label] of [['goal', 'Goal'], ['softgoal', 'Quality'], ['task', 'Task'], ['resource', 'Resource']]) {
    await expect(page.locator(`#${type}-tool svg text`)).toHaveText(label);
    await expect(page.locator(`#${type}-tool svg text`)).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Add quality', exact: true })).toBeVisible();
});


test('T-032 new quality uses Quality as its default name', async ({ page }) => {
  await page.getByRole('button', { name: 'Add quality', exact: true }).click();
  await page.locator('#canvas').click({ position: { x: 300, y: 200 } });
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Quality');
  await expect(page.getByRole('button', { name: 'Quality: Quality', exact: true }).locator('text')).toHaveText('Quality');
  await expect(page.getByRole('button', { name: 'Delete quality', exact: true })).toBeVisible();
});
