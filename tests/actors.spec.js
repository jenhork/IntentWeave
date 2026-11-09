const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs/promises');
const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
test.beforeEach(async ({ page }) => { await page.goto(url); });
async function point(page, x, y) {
  return page.locator('#canvas').evaluate((canvas, p) => { const q = new DOMPoint(p.x,p.y).matrixTransform(canvas.getScreenCTM()); return {x:q.x,y:q.y}; }, {x,y});
}
async function clickAt(page, x, y) { const p = await point(page,x,y); await page.mouse.click(p.x,p.y); }
async function add(page, tool, x, y, name) {
  await page.getByRole('button', {name: `Add ${tool}`, exact:true}).click();
  await clickAt(page,x,y);
  if (name) await page.getByLabel('Name', {exact:true}).fill(name);
}
async function drag(page, x1,y1,x2,y2) {
  const a = await point(page,x1,y1), b = await point(page,x2,y2);
  await page.mouse.move(a.x,a.y); await page.mouse.down(); await page.mouse.move(b.x,b.y,{steps:8}); await page.mouse.up();
}
test('T-034 create and name an actor with a dotted boundary', async ({page}) => {
  await add(page,'actor',500,400,'Team');
  const actor = page.getByRole('button',{name:'Actor: Team'});
  await expect(actor.locator('.actor-boundary')).toHaveAttribute('r','125');
  await expect(actor.locator('.actor-boundary')).toHaveCSS('stroke-dasharray','3px, 7px');
  await expect(actor.locator('.actor-head')).toBeVisible();
  await expect(actor.locator('.actor-head')).toHaveCSS('fill','rgb(255, 251, 230)');
  await expect(page.locator('#actor-tool circle').nth(1)).toHaveCSS('fill','rgb(255, 251, 230)');
  await expect(page.locator('#goal-tool ellipse')).not.toHaveCSS('fill','rgb(255, 251, 230)');
  await expect(page.locator('#count')).toHaveText('1 element');
});
test('T-035 elements enter and leave actors and internal links follow ownership', async ({page}) => {
  await add(page,'actor',500,400,'Team');
  await add(page,'goal',400,400,'A'); await add(page,'task',600,400,'B');
  const actor=page.getByRole('button',{name:'Actor: Team'}), a=page.getByRole('button',{name:'Goal: A'}), b=page.getByRole('button',{name:'Task: B'});
  const id=await actor.getAttribute('data-id');
  await expect(a).toHaveAttribute('data-actor-id',id); await expect(b).toHaveAttribute('data-actor-id',id);
  await page.getByRole('button',{name:'Add contribution link'}).click(); await a.click(); await b.click();
  const link=page.getByRole('button',{name:'Contribution: Make'}); await expect(link).toHaveAttribute('data-actor-id',id);
  await drag(page,400,400,180,400);
  await expect(a).not.toHaveAttribute('data-actor-id',/.+/); await expect(link).not.toHaveAttribute('data-actor-id',/.+/);
  await drag(page,180,400,400,400); await expect(a).toHaveAttribute('data-actor-id',id); await expect(link).toHaveAttribute('data-actor-id',id);
});
test('T-036 moving and deleting an actor preserves its elements and links', async ({page}) => {
  await add(page,'actor',500,400,'Team'); await add(page,'goal',400,400,'A'); await add(page,'task',600,400,'B');
  const actor=page.getByRole('button',{name:'Actor: Team'}), a=page.getByRole('button',{name:'Goal: A'}), b=page.getByRole('button',{name:'Task: B'});
  await page.getByRole('button',{name:'Add contribution link'}).click(); await a.click(); await b.click();
  const before=await a.getAttribute('transform'); await actor.locator('.actor-head').scrollIntoViewIfNeeded(); await drag(page,412,312,462,362); expect(await a.getAttribute('transform')).not.toBe(before);
  await actor.focus(); const after=await a.getAttribute('transform'); await page.keyboard.press('ArrowRight'); expect(await a.getAttribute('transform')).not.toBe(after);
  await page.keyboard.press('Delete'); await expect(actor).toHaveCount(0); await expect(a).toBeVisible(); await expect(b).toBeVisible(); await expect(page.getByRole('button',{name:'Contribution: Make'})).toBeVisible();
  await expect(a).not.toHaveAttribute('data-actor-id',/.+/);
});
test('T-037 actor diagrams save and reopen with derived containment and links', async ({page}) => {
  await add(page,'actor',500,400,'Team'); await add(page,'goal',400,400,'A'); await add(page,'task',600,400,'B');
  const a=page.getByRole('button',{name:'Goal: A'}), b=page.getByRole('button',{name:'Task: B'});
  await page.getByRole('button',{name:'Add contribution link'}).click(); await a.click(); await b.click();
  const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Save diagram'}).click();
  const contents=await fs.readFile(await (await pending).path(),'utf8'); const data=JSON.parse(contents);
  expect(data.version).toBe(4); expect(data.actors[0].name).toBe('Team'); expect(data.links).toHaveLength(1);
  await page.reload(); await page.locator('#file').setInputFiles({name:'diagram.json',mimeType:'application/json',buffer:Buffer.from(contents)});
  const id=await page.getByRole('button',{name:'Actor: Team'}).getAttribute('data-id');
  await expect(a).toHaveAttribute('data-actor-id',id); await expect(page.getByRole('button',{name:'Contribution: Make'})).toHaveAttribute('data-actor-id',id);
});
test('T-038 invalid actor data is rejected without replacing the diagram', async ({page}) => {
  await add(page,'goal',200,200,'Keep');
  const data={format:'intentweave-diagram',version:4,elements:[],actors:[{id:'a',type:'actor',name:'Broken',x:'bad',y:400}],links:[]};
  await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await expect(page.getByRole('status')).toContainText('invalid actor data'); await expect(page.getByRole('button',{name:'Goal: Keep'})).toBeVisible();
});
test('T-039 default elements are comparable in size to the actor circle', async ({page}) => {
  await add(page,'actor',500,400,'Team');
  const head = await page.getByRole('button',{name:'Actor: Team'}).locator('.actor-head').boundingBox();
  for (const [tool, label] of [['goal','Goal'],['quality','Quality'],['task','Task'],['resource','Resource']]) {
    await add(page,tool,800,400,label);
    const shape = await page.getByRole('button',{name:`${label}: ${label}`,exact:true}).locator('.shape').boundingBox();
    expect(shape.width / head.width).toBeLessThan(1.6);
    expect(shape.width / head.width).toBeGreaterThan(0.8);
    await page.getByRole('button',{name:`Delete ${tool}`,exact:true}).click();
  }
});
test('T-040 resize an actor boundary using handle and keyboard without deleting elements', async ({page}) => {
  await add(page,'actor',500,400,'Team'); await add(page,'goal',650,400,'A'); await add(page,'task',380,400,'B');
  const actor=page.getByRole('button',{name:'Actor: Team'}), a=page.getByRole('button',{name:'Goal: A'}), b=page.getByRole('button',{name:'Task: B'});
  await page.getByRole('button',{name:'Add contribution link'}).click(); await a.click(); await b.click();
  const link=page.getByRole('button',{name:'Contribution: Make'}), id=await actor.getAttribute('data-id');
  await actor.focus(); const slider=page.getByLabel('Boundary size: 125');
  await slider.focus(); await page.keyboard.press('Home');
  await expect(actor.locator('.actor-boundary')).toHaveAttribute('r','100');
  await expect(a).not.toHaveAttribute('data-actor-id',/.+/); await expect(b).not.toHaveAttribute('data-actor-id',/.+/); await expect(link).not.toHaveAttribute('data-actor-id',/.+/);
  await page.locator('.resize-handle.selected').scrollIntoViewIfNeeded(); await drag(page,600,400,700,400);
  await expect(actor.locator('.actor-boundary')).toHaveAttribute('r','200');
  await expect(a).toHaveAttribute('data-actor-id',id); await expect(b).toHaveAttribute('data-actor-id',id); await expect(link).toHaveAttribute('data-actor-id',id);
  await expect(page.getByLabel('Boundary size: 200')).toHaveValue('200');
});
test('T-041 resized actor boundaries round trip and old actor files keep their default size', async ({page}) => {
  await add(page,'actor',500,400,'Team');
  const slider=page.getByLabel('Boundary size: 125'); await slider.focus(); await page.keyboard.press('End');
  await expect(page.getByRole('button',{name:'Actor: Team'}).locator('.actor-boundary')).toHaveAttribute('r','400');
  const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Save diagram'}).click();
  const contents=await fs.readFile(await (await pending).path(),'utf8'); const data=JSON.parse(contents); expect(data.actors[0].radius).toBe(400);
  await page.reload(); await page.locator('#file').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(contents)});
  await expect(page.getByRole('button',{name:'Actor: Team'}).locator('.actor-boundary')).toHaveAttribute('r','400');
  delete data.actors[0].radius;
  await page.locator('#file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await expect(page.getByRole('button',{name:'Actor: Team'}).locator('.actor-boundary')).toHaveAttribute('r','220');
});
test('T-053 new actors exclude elements outside the smaller default boundary', async ({page}) => {
  await add(page,'goal',640,400,'Nearby');
  await add(page,'actor',500,400,'Team');
  const actor=page.getByRole('button',{name:'Actor: Team'}), goal=page.getByRole('button',{name:'Goal: Nearby'});
  await expect(actor.locator('.actor-boundary')).toHaveAttribute('r','125');
  await expect(goal).not.toHaveAttribute('data-actor-id',/.+/);
  await actor.focus(); const oldPosition=await goal.getAttribute('transform'); await page.keyboard.press('ArrowRight');
  await expect(goal).toHaveAttribute('transform',oldPosition);
});
