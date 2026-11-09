const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs/promises');
const appUrl = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
test.beforeEach(async ({page}) => page.goto(appUrl));
async function point(page,x,y) { return page.locator('#canvas').evaluate((canvas,p) => { const q=new DOMPoint(p.x,p.y).matrixTransform(canvas.getScreenCTM()); return {x:q.x,y:q.y}; },{x,y}); }
async function place(page,tool,x,y) { await page.getByRole('button',{name:`Add ${tool}`,exact:true}).click(); const p=await point(page,x,y); await page.mouse.click(p.x,p.y); }
async function move(page,x1,y1,x2,y2) { const a=await point(page,x1,y1),b=await point(page,x2,y2); await page.mouse.move(a.x,a.y); await page.mouse.down(); await page.mouse.move(b.x,b.y,{steps:8}); await page.mouse.up(); }
test('T-043 every element type can be resized using the keyboard control', async ({page}) => {
  for (const [tool,label] of [['goal','Goal'],['quality','Quality'],['task','Task'],['resource','Resource']]) {
    await place(page,tool,500,400);
    const shape=page.getByRole('button',{name:`${label}: ${label}`,exact:true}).locator('.shape');
    const before=(await shape.boundingBox()).width;
    const slider=page.getByLabel('Element size: 100%'); await slider.focus(); await page.keyboard.press('End');
    expect((await shape.boundingBox()).width / before).toBeCloseTo(2,1);
    await expect(page.getByLabel('Element size: 200%')).toHaveValue('200');
    await page.keyboard.press('Home'); expect((await shape.boundingBox()).width / before).toBeCloseTo(0.5,1);
    await page.getByRole('button',{name:`Delete ${tool}`,exact:true}).click();
  }
});
test('T-044 dragging an element handle updates linked geometry and preserves actor membership', async ({page}) => {
  await place(page,'actor',500,400); await place(page,'goal',400,400); await place(page,'task',600,400);
  const goal=page.getByRole('button',{name:'Goal: Goal'}), task=page.getByRole('button',{name:'Task: Task'}), actor=page.getByRole('button',{name:'Actor: Actor'});
  const id=await actor.getAttribute('data-id'); await page.getByRole('button',{name:'Add contribution link'}).click(); await goal.click(); await task.click();
  const link=page.getByRole('button',{name:'Contribution: Make'}); const before=await link.locator('.link-path').getAttribute('d');
  await goal.focus(); await page.locator('.resize-handle.selected').scrollIntoViewIfNeeded(); await move(page,445,400,490,400);
  await expect(page.getByLabel('Element size: 200%')).toHaveValue('200');
  expect(await link.locator('.link-path').getAttribute('d')).not.toBe(before);
  await expect(goal).toHaveAttribute('data-actor-id',id); await expect(link).toHaveAttribute('data-actor-id',id);
});
test('T-045 element sizes persist and legacy elements use the default', async ({page}) => {
  await place(page,'goal',400,400); const slider=page.getByLabel('Element size: 100%'); await slider.focus(); await page.keyboard.press('End');
  const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Save diagram'}).click(); const contents=await fs.readFile(await (await pending).path(),'utf8');
  const data=JSON.parse(contents); expect(data.version).toBe(5); expect(data.elements[0].size).toBe(200);
  await page.reload(); await page.locator('#file').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(contents)});
  await page.getByRole('button',{name:'Goal: Goal'}).focus(); await expect(page.getByLabel('Element size: 200%')).toHaveValue('200');
  const old={format:'intentweave-goals',version:1,goals:[{id:'old',type:'goal',name:'Old',x:400,y:400}]};
  await page.locator('#file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});
  await page.getByRole('button',{name:'Goal: Old'}).focus(); await expect(page.getByLabel('Element size: 100%')).toHaveValue('100');
});
test('T-046 invalid element sizes do not replace the current diagram', async ({page}) => {
  await place(page,'goal',400,400);
  const invalid={format:'intentweave-diagram',version:5,elements:[{id:'bad',type:'goal',name:'Bad',x:400,y:400,size:999}],actors:[],links:[]};
  await page.locator('#file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});
  await expect(page.getByRole('status')).toContainText('invalid goal data'); await expect(page.getByRole('button',{name:'Goal: Goal'})).toBeVisible();
});
test('T-047 resizing keeps text size fixed and reveals more of the name', async ({page}) => {
  for (const [tool,label] of [['goal','Goal'],['quality','Quality'],['task','Task'],['resource','Resource']]) {
    await place(page,tool,500,400);
    const name='Make the service easier to use for everyone';
    await page.getByLabel('Name',{exact:true}).fill(name);
    const text=page.getByRole('button',{name:`${label}: ${name}`,exact:true}).locator('text');
    const before=await text.textContent(), initialLine=await text.locator('tspan').first().boundingBox();
    expect(before).toContain('…');
    await page.getByLabel('Element size: 100%').focus(); await page.keyboard.press('End');
    const after=await text.textContent();
    expect(after.length).toBeGreaterThan(before.length);
    expect(await text.evaluate(el => getComputedStyle(el).fontSize)).toBe('10px');
    const line=await text.locator('tspan').first().boundingBox();
    expect(line.height).toBeCloseTo(initialLine.height, 1);
    await page.getByRole('button',{name:`Delete ${tool}`,exact:true}).click();
  }
});
