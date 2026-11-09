const {test,expect}=require('@playwright/test');
const {pathToFileURL}=require('node:url'); const path=require('node:path'); const fs=require('node:fs/promises');
const url=pathToFileURL(path.join(__dirname,'..','index.html')).href;
test.beforeEach(async({page})=>page.goto(url));
async function clickCanvas(page,x,y) {
  await page.locator('.canvas-scroll').evaluate((scroller,p)=>{const canvas=scroller.querySelector('svg'),q=new DOMPoint(p.x,p.y).matrixTransform(canvas.getScreenCTM()),r=scroller.getBoundingClientRect(); scroller.scrollLeft+=q.x-r.left-r.width/2;scroller.scrollTop+=q.y-r.top-r.height/2;},{x,y});
  const point=await page.locator('#canvas').evaluate((canvas,p)=>{const q=new DOMPoint(p.x,p.y).matrixTransform(canvas.getScreenCTM()); return {x:q.x,y:q.y};},{x,y}); await page.mouse.click(point.x,point.y);
}
test('T-061 palette guidance is available on demand and link tools are compact',async({page})=>{
  const help=page.getByText('How to use the palette'); const guidance=page.getByText('Choose a link, then select the source and destination elements or actor circles. For a dependency, select the dependent first, then the element it depends on. Press Escape to cancel.');
  await expect(guidance).toBeHidden(); await help.click(); await expect(guidance).toBeVisible(); await help.click(); await expect(guidance).toBeHidden();
  const and=await page.getByRole('button',{name:'Add AND link'}).boundingBox(), or=await page.getByRole('button',{name:'Add OR link'}).boundingBox(); expect(and.y).toBeCloseTo(or.y,0); expect(and.height).toBeLessThan(75);
});
test('T-062 expand canvas right and below without shrinking existing elements, then save and reopen',async({page})=>{
  const canvas=page.locator('#canvas'); await page.getByRole('button',{name:'Add goal',exact:true}).click(); await clickCanvas(page,300,300);
  const goal=page.getByRole('button',{name:'Goal: Goal',exact:true}), width=(await goal.locator('.shape').boundingBox()).width;
  await page.getByRole('button',{name:'Add space right'}).click(); await page.getByRole('button',{name:'Add space below'}).click();
  await expect(canvas).toHaveAttribute('viewBox','0 0 1800 1200'); expect((await goal.locator('.shape').boundingBox()).width).toBeCloseTo(width,1);
  await page.getByRole('button',{name:'Add task',exact:true}).click(); await clickCanvas(page,1500,1000);
  const task=page.getByRole('button',{name:'Task: Task',exact:true}); await expect(task).toHaveAttribute('transform','translate(1500 1000)');
  const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Save diagram'}).click(); const data=JSON.parse(await fs.readFile(await (await pending).path(),'utf8')); expect(data.version).toBe(8); expect(data.canvas).toEqual({width:1800,height:1200});
  await page.reload(); await page.locator('#file').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))}); await expect(canvas).toHaveAttribute('viewBox','0 0 1800 1200'); await expect(task).toHaveAttribute('transform','translate(1500 1000)');
});
test('T-063 expanded canvas allows actor movement and resizing beyond original edge',async({page})=>{
  await page.getByRole('button',{name:'Add space right'}).click(); await page.getByRole('button',{name:'Add space below'}).click();
  await page.getByRole('button',{name:'Add actor',exact:true}).click(); await clickCanvas(page,1450,900);
  const actor=page.getByRole('button',{name:'Actor: Actor'}); await expect(actor).toHaveAttribute('transform','translate(1450 900)');
  const slider=page.getByLabel('Boundary size: 125'); await expect(slider).toHaveAttribute('max','300'); await slider.focus(); await page.keyboard.press('End'); await expect(actor.locator('.actor-boundary')).toHaveAttribute('r','300');
  await actor.focus(); await page.keyboard.press('ArrowRight'); await expect(actor).toHaveAttribute('transform','translate(1460 900)');
});
test('T-064 invalid expanded canvas dimensions preserve the current diagram',async({page})=>{
  const bad={format:'intentweave-diagram',version:8,canvas:{width:100000,height:800},elements:[],actors:[],links:[]};
  await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});
  await expect(page.locator('#status')).toContainText('invalid canvas dimensions'); await expect(page.locator('#canvas')).toHaveAttribute('viewBox','0 0 1200 800');
});
test('T-065 zoom controls change the view without changing diagram data',async({page})=>{
  await page.getByRole('button',{name:'Add goal',exact:true}).click(); await clickCanvas(page,300,300);
  const goal=page.getByRole('button',{name:'Goal: Goal',exact:true}), shape=goal.locator('.shape'); const before=(await shape.boundingBox()).width, position=await goal.getAttribute('transform');
  await page.getByRole('button',{name:'Zoom in',exact:true}).click(); await expect(page.locator('#zoom-level')).toHaveText('125%'); expect((await shape.boundingBox()).width/before).toBeCloseTo(1.25,1); await expect(goal).toHaveAttribute('transform',position);
  await page.getByRole('button',{name:'Zoom out',exact:true}).click(); await page.getByRole('button',{name:'Zoom out',exact:true}).click(); await expect(page.locator('#zoom-level')).toHaveText('75%'); expect((await shape.boundingBox()).width/before).toBeCloseTo(0.75,1);
  await page.getByRole('button',{name:'Reset zoom'}).click(); await expect(page.locator('#zoom-level')).toHaveText('100%'); expect((await shape.boundingBox()).width/before).toBeCloseTo(1,1);
});
test('T-066 zoom works with expanded canvases, placement and its limits',async({page})=>{
  await page.getByRole('button',{name:'Add space right'}).click(); await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await page.getByRole('button',{name:'Add task',exact:true}).click(); await clickCanvas(page,1500,300); await expect(page.getByRole('button',{name:'Task: Task',exact:true})).toHaveAttribute('transform','translate(1500 300)');
  for(let i=0;i<3;i++) await page.getByRole('button',{name:'Zoom in',exact:true}).click(); await expect(page.locator('#zoom-level')).toHaveText('200%'); await expect(page.getByRole('button',{name:'Zoom in',exact:true})).toBeDisabled();
  for(let i=0;i<6;i++) await page.getByRole('button',{name:'Zoom out',exact:true}).click(); await expect(page.locator('#zoom-level')).toHaveText('50%'); await expect(page.getByRole('button',{name:'Zoom out',exact:true})).toBeDisabled(); await expect(page.locator('#canvas')).toHaveAttribute('viewBox','0 0 1800 800');
});
