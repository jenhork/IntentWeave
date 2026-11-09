const { test, expect } = require('@playwright/test');
const {pathToFileURL}=require('node:url'); const path=require('node:path'); const fs=require('node:fs/promises');
const url=pathToFileURL(path.join(__dirname,'..','index.html')).href;
const fixture={format:'intentweave-diagram',version:6,actors:[{id:'actor',type:'actor',name:'Team',x:400,y:400,radius:150}],elements:[{id:'a',type:'goal',name:'Inside',x:400,y:400},{id:'b',type:'task',name:'Outside',x:750,y:400}],links:[]};
test.beforeEach(async({page})=>{await page.goto(url); await page.locator('#file').setInputFiles({name:'diagram.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});});
const element=(page,id)=>page.locator(`.goal[data-id="${id}"]`);
const diagramLink=(page,id)=>page.locator(`.diagram-link[data-id="${id}"]`);
async function connect(page,label) {await page.getByRole('button',{name:`Add ${label} link`,exact:true}).click(); await element(page,'a').click(); await element(page,'b').click();}
test('T-054 draw straight AND, OR and Needed by links with target decorations',async({page})=>{
  for(const [type,marker] of [['AND','and-marker'],['OR','or-marker'],['Needed by','needed-marker']]) {
    await expect(page.getByRole('button',{name:`Add ${type} link`,exact:true}).locator('svg')).toBeVisible(); await connect(page,type);
    const link=page.getByRole('button',{name:`${type} link: ${type}`,exact:true});
    await expect(link.locator('text')).toHaveText(type); await expect(link.locator('.link-path')).toHaveAttribute('d',/^M [\d. -]+ L [\d. -]+$/);
    await expect(link.locator('.link-path')).toHaveAttribute('marker-end',`url(#${marker})`); await expect(link.locator('.link-path')).not.toHaveAttribute('marker-start',/.+/);
    await expect(page.getByLabel('Contribution',{exact:true})).toBeHidden();
  }
  await expect(page.locator('#and-marker path')).toHaveAttribute('d','M 5 1 L 5 15');
  await expect(page.locator('#or-marker path')).toHaveAttribute('fill','#52637a'); await expect(page.locator('#needed-marker circle')).toHaveCount(1);
});
test('T-055 straight links follow elements, cancel, reject self links and can be deleted',async({page})=>{
  await page.getByRole('button',{name:'Add AND link'}).click(); await element(page,'a').click(); await element(page,'a').click(); await expect(page.locator('#status')).toContainText('different destination'); await page.keyboard.press('Escape'); await element(page,'b').click(); await expect(page.locator('.diagram-link')).toHaveCount(0);
  await connect(page,'AND'); const link=page.getByRole('button',{name:'AND link: AND'}), before=await link.locator('.link-path').getAttribute('d');
  await element(page,'a').focus(); await page.keyboard.press('ArrowRight'); expect(await link.locator('.link-path').getAttribute('d')).not.toBe(before); await link.focus(); await page.keyboard.press('Delete'); await expect(link).toHaveCount(0); await expect(element(page,'a')).toBeVisible();
});
test('T-056 save and reopen all new links and preserve types and endpoint ids',async({page})=>{
  for(const type of ['AND','OR','Needed by']) await connect(page,type);
  const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Save diagram'}).click(); const data=JSON.parse(await fs.readFile(await (await pending).path(),'utf8'));
  expect(data.version).toBe(7); expect(data.links.map(x=>[x.type,x.source,x.target,x.label])).toEqual([['and','a','b','AND'],['or','a','b','OR'],['needed-by','a','b','Needed by']]);
  await page.reload(); await page.locator('#file').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  for(const type of ['AND','OR','Needed by']) await expect(page.getByRole('button',{name:`${type} link: ${type}`})).toBeVisible();
});
test('T-057 collapsed actors redirect straight links without changing endpoints',async({page})=>{
  await connect(page,'OR'); const link=page.getByRole('button',{name:'OR link: OR'}), before=await link.locator('.link-path').getAttribute('d');
  await page.getByRole('button',{name:'Actor: Team'}).focus(); await page.getByRole('button',{name:'Collapse actor'}).click(); await expect(element(page,'a')).toBeHidden(); await expect(link).toBeVisible(); expect(await link.locator('.link-path').getAttribute('d')).not.toBe(before); await expect(link.locator('.link-path')).toHaveAttribute('d',/^M [\d. -]+ L [\d. -]+$/);
  await page.getByRole('button',{name:'Expand actor'}).click(); await expect(link.locator('.link-path')).toHaveAttribute('d',before);
});
test('T-058 invalid new link data does not replace the current diagram',async({page})=>{
  const bad={...fixture,version:7,links:[{id:'bad',type:'or',source:'a',target:'b',label:'AND'}]};
  await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))}); await expect(page.locator('#status')).toContainText('invalid link data'); await expect(element(page,'a')).toBeVisible();
});
test('T-059 new links can connect directly to actor circles and reopen',async({page})=>{
  await page.getByRole('button',{name:'Add Needed by link'}).click(); await page.locator('.actor[data-id="actor"] .actor-head').click(); await element(page,'b').click();
  const link=page.getByRole('button',{name:'Needed by link: Needed by'}); await expect(link).toBeVisible();
  const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Save diagram'}).click(); const data=JSON.parse(await fs.readFile(await (await pending).path(),'utf8')); expect(data.links[0]).toMatchObject({type:'needed-by',source:'actor',target:'b'});
  await page.reload(); await page.locator('#file').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))}); await expect(link).toBeVisible();
});
