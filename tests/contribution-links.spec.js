const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs/promises');
const appUrl = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

test.beforeEach(async ({ page }) => { await page.goto(appUrl); });
async function add(page, tool, name, x) {
  await page.getByRole('button', { name: tool, exact: true }).click();
  await page.locator('#canvas').click({ position: { x, y: 260 } });
  await page.getByLabel('Name', { exact: true }).fill(name);
}
async function setup(page) {
  await add(page, 'Add goal', 'Source', 180);
  await add(page, 'Add task', 'Destination', 520);
}
async function connect(page) {
  await page.getByRole('button', { name: 'Add contribution link' }).click();
  await page.getByRole('button', { name: 'Goal: Source' }).click();
  await page.getByRole('button', { name: 'Task: Destination' }).click();
}

test('T-025 create contribution with curved line and destination arrow', async ({ page }) => {
  await setup(page); await connect(page);
  const link = page.getByRole('button', { name: 'Contribution: Make' });
  await expect(link).toBeVisible();
  await expect(link.locator('.link-path')).toHaveAttribute('d', / Q /);
  await expect(link.locator('.link-path')).toHaveAttribute('marker-end', 'url(#arrow)');
  await expect(link.locator('.link-path')).not.toHaveAttribute('marker-start', /.+/);
  await expect(link.locator('text')).toHaveText('Make');
});

test('T-026 choose and edit each contribution label', async ({ page }) => {
  await setup(page); await connect(page);
  const choice = page.getByLabel('Contribution', { exact: true });
  for (const label of ['Help', 'Hurt', 'Break', 'Make']) {
    await choice.selectOption({ label });
    await expect(page.getByRole('button', { name: `Contribution: ${label}` }).locator('text')).toHaveText(label);
  }
});

test('T-027 links follow moving elements and can be deleted', async ({ page }) => {
  await setup(page); await connect(page);
  const link = page.getByRole('button', { name: 'Contribution: Make' });
  const before = await link.locator('.link-path').getAttribute('d');
  const source = page.getByRole('button', { name: 'Goal: Source' });
  await source.focus(); await page.keyboard.press('ArrowRight');
  expect(await link.locator('.link-path').getAttribute('d')).not.toBe(before);
  await link.focus(); await page.keyboard.press('Delete');
  await expect(link).toHaveCount(0);
  await expect(source).toBeVisible();
});

test('T-028 save and reopen contribution links', async ({ page }) => {
  await setup(page); await connect(page);
  await page.getByLabel('Contribution', { exact: true }).selectOption('Hurt');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save diagram' }).click();
  const contents = await fs.readFile(await (await pending).path(), 'utf8');
  const data = JSON.parse(contents);
  expect(data.version).toBe(3);
  expect(data.links).toHaveLength(1);
  expect(data.links[0]).toMatchObject({ type: 'contribution', label: 'Hurt', source: data.elements[0].id, target: data.elements[1].id });
  await page.reload();
  await page.locator('#file').setInputFiles({ name: 'saved.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
  await expect(page.getByRole('button', { name: 'Contribution: Hurt' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Goal: Source' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Task: Destination' })).toBeVisible();
});

test('T-029 invalid links are rejected without replacing the diagram', async ({ page }) => {
  await setup(page);
  const bad = {format: 'intentweave-diagram', version: 3, elements: [{id:'a',type:'goal',name:'A',x:200,y:200}], links:[{id:'l',type:'contribution',source:'a',target:'missing',label:'Help'}]};
  await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
  await expect(page.getByRole('status')).toContainText('invalid link data');
  await expect(page.getByRole('button', {name:'Goal: Source'})).toBeVisible();
});

test('T-030 deleting an element removes connected links', async ({ page }) => {
  await setup(page); await connect(page);
  await page.getByRole('button', {name:'Goal: Source'}).focus();
  await page.keyboard.press('Delete');
  await expect(page.getByRole('button', {name:'Contribution: Make'})).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Task: Destination'})).toBeVisible();
});

test('T-031 cancel link creation without changing the diagram', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', {name:'Add contribution link'}).click();
  await page.getByRole('button', {name:'Goal: Source'}).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', {name:'Task: Destination'}).click();
  await expect(page.locator('.diagram-link')).toHaveCount(0);
});


test('T-033 contribution palette shows its curved link and creation instructions', async ({ page }) => {
  const tool = page.getByRole('button', { name: 'Add contribution link', exact: true });
  await expect(tool.locator('svg')).toBeVisible();
  await expect(tool.locator('svg path')).toHaveAttribute('d', / Q /);
  await expect(tool.locator('svg text')).toHaveText('Make / Help / Hurt / Break');
  await expect(page.getByText('Choose a link, then select the source and destination elements or actor circles. For a dependency, select the dependent first, then the element it depends on. Press Escape to cancel.')).toBeHidden();
  await page.getByText('How to use the palette').click();
  await expect(page.getByText('Choose a link, then select the source and destination elements or actor circles. For a dependency, select the dependent first, then the element it depends on. Press Escape to cancel.')).toBeVisible();
});


test('T-042 contribution and element labels use the same text size', async ({ page }) => {
  await setup(page); await connect(page);
  const elementText = page.getByRole('button', { name: 'Goal: Source' }).locator('text');
  const linkText = page.getByRole('button', { name: 'Contribution: Make' }).locator('text');
  await expect(linkText).toHaveCSS('font-size', await elementText.evaluate(element => getComputedStyle(element).fontSize));
});
