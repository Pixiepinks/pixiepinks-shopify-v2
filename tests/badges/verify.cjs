// Synthetic Liquid and Chromium fixtures; not a replacement for Shopify preview QA.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Liquid } = require('liquidjs');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const engine = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid' });
engine.registerFilter('image_url', () => 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="100"%3E%3C/svg%3E');
engine.registerFilter('image_tag', src => `<img class="pp-product-badges__image" src='${src}' width="300" height="100" alt="">`);
engine.registerFilter('money', () => 'Rs. 22,000.00');
engine.registerFilter('money_with_currency', () => 'LKR 22,000.00');
engine.registerFilter('t', x => x);
const settings = { pp_badges_enabled: true, pp_free_delivery_enabled: true, pp_badge_position: 'top-left', pp_badge_size_desktop:110, pp_badge_size_mobile:90, pp_badge_offset_x:8, pp_badge_offset_y:8 };
const product = { title:'Gift pack', url:'/products/gift', available:false, featured_image:null, selected_or_first_available_variant:{ price:2200000,compare_at_price:2500000 }, metafields:{ custom:{ free_delivery_badge:{value:true} } } };
const render = (s=settings,p=product,context='card') => engine.renderFile('pp-product-badges', {product:p,context}, {globals:{settings:s}});
const count = html => (html.match(/class="pp-product-badges /g)||[]).length;
(async()=>{
  let cases=0;
  for (const global of [true,false]) for (const enabled of [true,false]) for (const value of [true,false,undefined,'true']) {
    const p={...product,metafields:{custom:{free_delivery_badge:{value}}}};
    assert.equal(count(await render({...settings,pp_badges_enabled:global,pp_free_delivery_enabled:enabled},p)),global && enabled && value===true ? 1:0); cases++;
  }
  assert.equal(count(await render(settings,{})),0);
  assert.equal(count(await render({...settings,pp_badges_enabled:false})),0);
  assert.match(await render(),/aria-label="Free Delivery"/);
  assert.match(await render({...settings,pp_free_delivery_image:{width:300,height:100}}),/pp-product-badges__image/);
  const thumbnail=await engine.renderFile('product-thumbnail', {product, media:{media_type:'image',aspect_ratio:1,preview_image:{aspect_ratio:1}}, position:1}, {globals:{settings,section:{settings:{}}}});
  assert.equal(count(thumbnail),1,'product image owns exactly one badge');
  const ineligibleThumbnail=await engine.renderFile('product-thumbnail', {product:{},media:{media_type:'image',preview_image:{}}}, {globals:{settings,section:{settings:{}}}});
  assert.equal(count(ineligibleThumbnail),0);
  const disabledGift=await engine.renderFile('pp-gift-card',{product,section:{settings:{}}},{globals:{settings:{...settings,pp_badges_enabled:false}}});
  assert.equal(count(disabledGift),0);
  assert.ok(!disabledGift.includes('pp-product-badges-gift-layer'),'disabled gifts preserve original price markup');
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  const css=['pp-product-badges.css','pp-gift-packs-gallery.css','component-card.css'].map(f=>fs.readFileSync(path.join(root,'assets',f),'utf8')).join('\n');
  let layouts=0;
  for (const width of [320,390,1440]) for(const position of ['top-left','top-right','bottom-left','bottom-right']) for(const custom of [false,true]) {
    await page.setViewportSize({width,height:800});
    const s={...settings,pp_badge_position:position,pp_free_delivery_image:custom?{}:null};
    const gift=await engine.renderFile('pp-gift-card',{product,section:{settings:{missing_image:'Image unavailable',code_label:'Code'}}}, {globals:{settings:s}});
    assert.equal(count(gift),1);
    const badge=await render(s);
    await page.setContent(`<style>${css} .fixture{width:${width<750?145:196}px}.card__inner{height:240px}.card__badge{position:absolute;top:8px;left:8px}.product-media-container{width:280px;height:300px}.control{position:absolute;left:12px;top:12px;width:36px;height:36px}</style><div class="fixture">${gift}</div><div class="fixture card__inner">${badge}<div class="card__badge top"><span class="badge">Sold out</span></div></div><div class="product-media-container">${await render(s,product,'product')}<button class="control">Zoom</button></div>`);
    await page.locator('.pp-gift__photo').waitFor();
    const result=await page.evaluate(()=>{
      const box=s=>document.querySelector(s).getBoundingClientRect();
      const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      const gift=box('.pp-gift__photo .pp-product-badges'),price=box('.pp-gift__price'),photo=box('.pp-gift__photo');
      const badge=document.querySelector('.pp-product-badges');
      return {overlap:intersects(gift,price),inside:gift.left>=photo.left&&gift.right<=photo.right&&gift.bottom<=photo.bottom, width:gift.width,pointer:getComputedStyle(badge).pointerEvents,cardOverlap:intersects(box('.card__inner > .pp-product-badges'),box('.card__badge')),zoomOverlap:intersects(box('.product-media-container > .pp-product-badges'),box('.control'))};
    });
    assert.equal(result.overlap,false,JSON.stringify({width,position,custom,result}));
    assert.equal(result.inside,true);
    assert.equal(result.pointer,'none');
    assert.equal(result.cardOverlap,false);
    assert.equal(result.zoomOverlap,false);
    assert.equal(Math.round(result.width),width<750?90:110);
    layouts++;
  }
  await browser.close();
  console.log(`Passed ${cases} eligibility combinations, absent metafield, artwork/accessibility checks and ${layouts} browser layouts.`);
})().catch(e=>{console.error(e);process.exit(1)});
