const { test, expect } = require('@playwright/test');
const {pathToFileURL}=require('node:url'); const path=require('node:path'); const fs=require('node:fs/promises');
const url=pathToFileURL(path.join(__dirname,'..','index.html')).href;
const fixture={format:'intentweave-diagram',version:6,actors:[{id:'a',type:'actor',name:'Team',x:400,y:400,radius:220},{id:'b',type:'actor',name:'Other',x:900,y:400,radius:180}],elements:[{id:'in1',type:'goal',name:'Inside one',x:350,y:400},{id:'in2',type:'task',name:'Inside two',x:450,y:400},{id:'out',type:'resource',name:'Outside',x:650,y:400},{id:'in3',type:'goal',name:'Other inside',x:900,y:400}],links:[{id:'inner',type:'contribution',source:'in1',target:'in2',label:'Help'},{id:'outgoing',type:'contribution',source:'in1',target:'out',label:'Make'},{id:'incoming',type:'contribution',source:'out',target:'in2',label:'Hurt'},{id:'direct',type:'contribution',source:'a',target:'out',label:'Break'},{id:'between',type:'contribution',source:'in1',target:'in3',label:'Help'}]};
test.beforeEach(async({page})=>{await page.goto(url);await page.locator('#file').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});});
const item=(page,id)=>page.locator(`g[data-id="${id}"]`);
const link=(page,id)=>page.locator(`.diagram-link[data-id="${id}"]`);
async function toggle(page,id){await item(page,id).filter({has:page.locator('.actor-head')}).focus();await page.getByRole('button',{name:/^(Collapse|Expand) actor$/}).click();}
test('T-048 collapse hides contents and redirects external links without changing endpoints',async({page})=>{
  const in1=item(page,'in1'), actor=item(page,'a').filter({has:page.locator('.actor-head')});
  await expect(in1).toBeVisible(); const outbound=await link(page,'outgoing').locator('.link-path').getAttribute('d'); const inbound=await link(page,'incoming').locator('.link-path').getAttribute('d'); const direct=await link(page,'direct').locator('.link-path').getAttribute('d');
  await toggle(page,'a'); await expect(actor.locator('.actor-head')).toBeVisible(); await expect(actor.locator('.actor-boundary')).toBeHidden(); await expect(in1).toBeHidden(); await expect(item(page,'in2')).toBeHidden(); await expect(link(page,'inner')).toHaveCount(0);
  expect(await link(page,'outgoing').locator('.link-path').getAttribute('d')).not.toBe(outbound); expect(await link(page,'incoming').locator('.link-path').getAttribute('d')).not.toBe(inbound); expect(await link(page,'direct').locator('.link-path').getAttribute('d')).toBe(direct);
  await toggle(page,'a'); await expect(in1).toBeVisible(); await expect(actor.locator('.actor-boundary')).toBeVisible(); await expect(link(page,'inner')).toBeVisible(); expect(await link(page,'outgoing').locator('.link-path').getAttribute('d')).toBe(outbound); expect(await link(page,'incoming').locator('.link-path').getAttribute('d')).toBe(inbound); expect(await link(page,'direct').locator('.link-path').getAttribute('d')).toBe(direct);
});
test('T-049 links between collapsed actors redirect both ends and actor movement preserves hidden contents',async({page})=>{
  await toggle(page,'a'); await toggle(page,'b'); const before=await link(page,'between').locator('.link-path').getAttribute('d');
  const actor=item(page,'a').filter({has:page.locator('.actor-head')}); await actor.focus(); await page.keyboard.press('ArrowRight'); expect(await link(page,'between').locator('.link-path').getAttribute('d')).not.toBe(before);
  await toggle(page,'a'); await expect(item(page,'in1')).toHaveAttribute('transform','translate(360 400)'); await expect(item(page,'in3')).toBeHidden(); await toggle(page,'b'); await expect(item(page,'in3')).toBeVisible();
});
test('T-050 collapsed state and original endpoints persist on save and reopen',async({page})=>{
  await toggle(page,'a'); const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Save diagram'}).click(); const data=JSON.parse(await fs.readFile(await (await pending).path(),'utf8'));
  expect(data.version).toBe(6); expect(data.actors.find(x=>x.id==='a').collapsed).toBe(true); expect(data.links.find(x=>x.id==='outgoing')).toMatchObject({source:'in1',target:'out'}); expect(data.links.find(x=>x.id==='direct')).toMatchObject({source:'a',target:'out'});
  await page.reload(); await page.locator('#file').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))}); await expect(item(page,'in1')).toBeHidden(); await expect(link(page,'outgoing')).toBeVisible(); await toggle(page,'a'); await expect(item(page,'in1')).toBeVisible(); await expect(link(page,'inner')).toBeVisible();
});
test('T-051 create and retain a direct actor link through collapse and expansion',async({page})=>{
  const actor=item(page,'a').filter({has:page.locator('.actor-head')}); await page.getByRole('button',{name:'Add contribution link'}).click(); await actor.locator('.actor-head').click(); await item(page,'in1').click();
  const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Save diagram'}).click(); const data=JSON.parse(await fs.readFile(await (await pending).path(),'utf8')); expect(data.links.some(x=>x.source==='a' && x.target==='in1')).toBe(true);
  await toggle(page,'a'); await toggle(page,'a'); await expect(page.getByRole('button',{name:'Contribution: Make'})).toHaveCount(2);
});
test('T-052 reject invalid actor collapse state without replacing the diagram',async({page})=>{
  const bad=structuredClone(fixture); bad.actors[0].collapsed='yes';
  await page.locator('#file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
  await expect(page.locator('#status')).toContainText('invalid actor data'); await expect(item(page,'in1')).toBeVisible();
});
