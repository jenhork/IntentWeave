const {test,expect}=require('@playwright/test');
const {pathToFileURL}=require('node:url');const path=require('node:path');const fs=require('node:fs/promises');
const url=pathToFileURL(path.join(__dirname,'..','index.html')).href;
const fixture={format:'intentweave-diagram',version:6,actors:[{id:'actor',type:'actor',name:'Team',x:350,y:400,radius:125}],elements:[{id:'a',type:'goal',name:'A',x:350,y:400},{id:'b',type:'task',name:'B',x:750,y:400}],links:[]};
test.beforeEach(async({page})=>{await page.goto(url);await page.locator('#file').setInputFiles({name:'diagram.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});});
const element=(page,id)=>page.locator(`.goal[data-id="${id}"]`);
async function connect(page,source,target){await page.getByRole('button',{name:'Add dependency link'}).click();await element(page,source).click();await element(page,target).click();}
async function download(page){const p=page.waitForEvent('download');await page.getByRole('button',{name:'Save diagram'}).click();return JSON.parse(await fs.readFile(await (await p).path(),'utf8'));}
test('T-067 dependency points from first selected element toward second',async({page})=>{
  const tool=page.getByRole('button',{name:'Add dependency link'});await expect(tool.locator('svg text')).toHaveText('D');await connect(page,'a','b');
  const link=page.getByRole('button',{name:'Dependency: D'});await expect(link.locator('.link-path')).toHaveAttribute('d',/ Q /);await expect(link.locator('.link-path')).not.toHaveAttribute('marker-end',/.+/);
  await expect(link.locator('text')).toHaveText('D');const angle=Number((await link.locator('text').getAttribute('transform')).match(/^rotate\(([-.\d]+)/)[1]);expect(Math.abs(angle)).toBeLessThan(1);
  const data=await download(page);expect(data.version).toBe(9);expect(data.links[0]).toMatchObject({type:'dependency',source:'a',target:'b',label:'D'});
});
test('T-068 dependency D turns toward the target when reversed and when elements move',async({page})=>{
  await connect(page,'b','a');const link=page.getByRole('button',{name:'Dependency: D'}),label=link.locator('text');
  let angle=Number((await label.getAttribute('transform')).match(/^rotate\(([-.\d]+)/)[1]);expect(Math.abs(angle)).toBeGreaterThan(179);
  await element(page,'a').focus();for(let i=0;i<5;i++)await page.keyboard.press('ArrowDown');
  angle=Number((await label.getAttribute('transform')).match(/^rotate\(([-.\d]+)/)[1]);expect(angle).toBeGreaterThan(160);expect(angle).toBeLessThan(179);
});
test('T-069 dependency survives actor collapse and expanded canvas save and reopen',async({page})=>{
  await connect(page,'a','b');const link=page.getByRole('button',{name:'Dependency: D'}),before=await link.locator('.link-path').getAttribute('d');
  await page.getByRole('button',{name:'Actor: Team'}).focus();await page.getByRole('button',{name:'Collapse actor'}).click();expect(await link.locator('.link-path').getAttribute('d')).not.toBe(before);
  await page.getByRole('button',{name:'Add space right'}).click();const data=await download(page);expect(data.canvas.width).toBe(1800);expect(data.links[0]).toMatchObject({source:'a',target:'b'});
  await page.reload();await page.locator('#file').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await expect(element(page,'a')).toBeHidden();await expect(link).toBeVisible();await page.getByRole('button',{name:'Actor: Team'}).focus();await page.getByRole('button',{name:'Expand actor'}).click();await expect(link.locator('.link-path')).toHaveAttribute('d',before);
});
test('T-070 cancel dependency creation and reject invalid dependency data',async({page})=>{
  await page.getByRole('button',{name:'Add dependency link'}).click();await element(page,'a').click();await page.keyboard.press('Escape');await element(page,'b').click();await expect(page.locator('.diagram-link')).toHaveCount(0);
  const bad={...fixture,version:9,canvas:{width:1200,height:800},links:[{id:'bad',type:'dependency',source:'a',target:'missing',label:'D'}]};
  await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await expect(page.locator('#status')).toContainText('invalid link data');await expect(element(page,'a')).toBeVisible();
});
