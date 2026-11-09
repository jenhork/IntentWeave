const {test,expect}=require('@playwright/test');const {pathToFileURL}=require('node:url');const path=require('node:path');const fs=require('node:fs/promises');
const url=pathToFileURL(path.join(__dirname,'..','index.html')).href;
const fixture={format:'intentweave-diagram',version:9,canvas:{width:1800,height:1200},actors:[{id:'actor',type:'actor',name:'Team',x:350,y:400,radius:125}],elements:[{id:'a',type:'goal',name:'A',x:350,y:400},{id:'b',type:'task',name:'B',x:1400,y:900}],links:[{id:'l',type:'dependency',source:'a',target:'b',label:'D'}]};
test.beforeEach(async({page})=>{await page.goto(url);await page.locator('#file').setInputFiles({name:'fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});});
async function exported(page,format){await page.getByText('Export',{exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:`Export ${format.toUpperCase()}`}).click();return await pending;}
async function pixel(page,buffer,mime,x,y){return page.evaluate(async({base64,mime,x,y})=>{const data=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),image=await createImageBitmap(new Blob([data],{type:mime})),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d');context.drawImage(image,0,0);return {width:image.width,height:image.height,rgba:Array.from(context.getImageData(x,y,1,1).data)};},{base64:buffer.toString('base64'),mime,x,y});}
test('T-071 SVG export includes full diagram, labels and styles without editing handles',async({page})=>{
  await page.getByRole('button',{name:'Zoom in'}).click();await page.getByRole('button',{name:'Goal: A'}).focus();
  const file=await exported(page,'svg');expect(file.suggestedFilename()).toBe('intentweave-diagram.svg');const data=await fs.readFile(await file.path(),'utf8');
  expect(data).toContain('viewBox="0 0 1800 1200"');expect(data).toContain('width="1800"');expect(data).toContain('class="link-label"');expect(data).toContain('>D</text>');
  const parsed=await page.evaluate(text=>{const doc=new DOMParser().parseFromString(text,'image/svg+xml');return {error:!!doc.querySelector('parsererror'),handles:!!doc.querySelector('#actor-handles'),hit:!!doc.querySelector('.link-hit'),selected:!!doc.querySelector('.selected'),style:doc.querySelector('style')?.textContent};},data);
  expect(parsed.error).toBe(false);expect(parsed.handles).toBe(false);expect(parsed.hit).toBe(false);expect(parsed.selected).toBe(false);expect(parsed.style).toContain('#fff4cb');
});
test('T-072 PNG export renders full canvas at higher resolution independent of zoom',async({page})=>{
  await page.getByRole('button',{name:'Zoom out'}).click();const file=await exported(page,'png');expect(file.suggestedFilename()).toBe('intentweave-diagram.png');const data=await fs.readFile(await file.path());
  const goal=await pixel(page,data,'image/png',700,780), task=await pixel(page,data,'image/png',2800,1780);expect([goal.width,goal.height]).toEqual([3600,2400]);expect(goal.rgba.slice(0,3)).toEqual([255,244,203]);expect(task.rgba.slice(0,3)).toEqual([224,243,220]);
});
test('T-073 PDF export preserves vector drawing and text',async({page})=>{
  const file=await exported(page,'pdf');expect(file.suggestedFilename()).toBe('intentweave-diagram.pdf');const data=await fs.readFile(await file.path()),contents=data.toString('latin1');
  expect(contents.startsWith('%PDF-')).toBe(true);expect(contents).toContain('/MediaBox [0 0 1800. 1200.]');expect(contents).not.toContain('/Subtype /Image');
  expect(contents).toContain('(Team) Tj');expect(contents).toContain('(D) Tj');
  const xref=Number(contents.match(/startxref\s+(\d+)/)[1]);expect(contents.slice(xref,xref+4)).toBe('xref');
});
test('T-074 exports reflect collapsed actors and preserve unsaved edits',async({page})=>{
  await page.getByRole('button',{name:'Actor: Team'}).focus();await page.getByRole('button',{name:'Collapse actor'}).click();const file=await exported(page,'svg');const svg=await fs.readFile(await file.path(),'utf8');
  const state=await page.evaluate(text=>{const doc=new DOMParser().parseFromString(text,'image/svg+xml');return {actor:doc.querySelector('.actor').getAttribute('class'),hidden:doc.querySelector('.goal[data-id="a"]').getAttribute('style'),link:!!doc.querySelector('.diagram-link')};},svg);
  expect(state.actor).toContain('collapsed');expect(state.hidden).toContain('display: none');expect(state.link).toBe(true);
  let prompted=false;page.once('dialog',dialog=>{prompted=true;dialog.dismiss();});await page.locator('#file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});expect(prompted).toBe(true);await expect(page.getByRole('button',{name:'Expand actor'})).toBeVisible();
});
