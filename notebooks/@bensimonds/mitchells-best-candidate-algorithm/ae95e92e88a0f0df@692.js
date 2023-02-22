function _1(md){return(
md`# Mitchell's Best Candidate Algorithm

Learning from Mike Bostock's [gist](https://gist.github.com/mbostock/1893974).

> Mitchell’s best-candidate algorithm generates a new random sample by creating k candidate samples and picking the best of k. Here the “best” sample is defined as the sample that is farthest away from previous samples. The algorithm approximates Poisson-disc sampling, producing a much more natural appearance (better blue noise spectral characteristics) than uniform random sampling.`
)}

function _2(md){return(
md`I wanted to play with different algorithms for placing circles that don't overlap. My first, naive circle generator is pretty inefficient. It just tries random candidate places until it finds one a circle will fit in. `
)}

function _naiveCircleGenerator(distanceSquared){return(
function naiveCircleGenerator(maxRadius, padding,x0, x1, y0, y1) {
  // No optimisation, pick anywhere in the plane from (x0,y0) to (x1,y1)
  const circles = [];

  return function(k) {
    var bestX, bestY, bestDistance = 0;
    // Generate k samples and return the furthest from any existing circle.
    for (let i = 0; i < k; ++i) {
      const x = (x1 - x0) * Math.random() + x0;
      const y = (y1 - y0) * Math.random() + y0;
      var minDistance = maxRadius;
      for (let j = 0; j < circles.length && minDistance > 0; ++j) {
        const dSquared = distanceSquared(x, y, circles[j][0], circles[j][1]);
        if (dSquared < circles[j][2] *  circles[j][2]) minDistance = 0; // Inside an existing circle.
        const d = Math.sqrt(dSquared) - circles[j][2];
        if (d < minDistance) minDistance = d;
      }
      // If that's the best one so far then update best...
      if (minDistance > bestDistance) bestX = x, bestY = y, bestDistance = minDistance;
    }
    const best = [bestX, bestY, bestDistance]
    circles.push(best);
    return best;
  }
}
)}

function _replay1(Inputs){return(
Inputs.button("replay")
)}

function* _canvas(replay1,DOM,width,height,naiveCircleGenerator,config,$0)
{
  replay1;
  const t1 = performance.now();
  const context = DOM.context2d(width, height);
  context.canvas.style.background = 'hsl(216deg 100% 13%)';
  
  const newCircle = naiveCircleGenerator(
    config.maxRadius, 
    config.padding, 
    config.margin.left, 
    width - config.margin.right, 
    config.margin.top, 
    height - config.margin.bottom
  )
  
  var n = config.nCircles;
  var tries = config.failAfter;
  var k = config.nCandidates;
  
  while (n > 0 && tries > 0) {
    const c = newCircle(config.nCandidates);
    if (c[2] > config.padding) {
      context.globalAlpha = 1;
      context.fillStyle = config.cm(Math.random())
      context.beginPath();
      context.arc(c[0], c[1], c[2]  - config.padding, 0, 2 * Math.PI, false)
      context.fill()
      n--;
    } else {
      tries--;
    }
    if (n % config.nCirclesPerFrame === 0) yield context.canvas;
    if (k < 100) k *= 1.02;
  }
  if (tries == 0) console.log('ran out of spaces to put circles')
  if (n == 0) console.log('ran out of circles to place')
  yield context.canvas;
  const t2 = performance.now();
  $0.value = t2 - t1;
}


function _6(d3,timer1,md){return(
md`That took ${d3.format('.2f')(timer1/1000)} seconds to render.

Not bad, but can we write a more efficient circle generator for finding empty spots with d3-quadtree? This will limit the number of circles we have to compare against for each candidate.`
)}

function _quadTreeCircleGenerator(d3,distanceSquared){return(
function quadTreeCircleGenerator(maxRadius, padding,x0, x1, y0, y1) {
  
  const quadtree = d3.quadtree()
    .extent([[x0,y0],[x1,y1]])
  const searchRadius = maxRadius * 2;

  function f(k) {
    var bestX, bestY, bestDistance = 0;
    // Generate k samples and return the furthest from any existing circle.
    for (let i = 0; i < k; ++i) {
      const x = (x1 - x0) * Math.random() + x0;
      const y = (y1 - y0) * Math.random() + y0;
      const xmin = x - searchRadius;
      const xmax = x + searchRadius;
      const ymin = y - searchRadius;
      const ymax = y + searchRadius;
      var minDistance = maxRadius;

      // Visit all nodes in the tree within our search radius.
      quadtree.visit((node, x1, y1, x2, y2) => {
        //console.log({quad})
        if (!node.length) {
          var p = node.data;
          var dsquared = distanceSquared(x, y, p[0], p[1]);
          if (dsquared < p[2] * p[2] ) return minDistance = 0, true;// Within a circle. Can stop early since this sample is not viable.
          var d  = Math.sqrt(dsquared) - p[2];
          if (d < minDistance) minDistance = d; // Store radius of new circle.
        }
        //Return true for all nodes that DONT need to be visited.
        return !minDistance || x1 >= xmax || x2 <= xmin || y1 >= ymax || y2 <= ymin;
      });

      // If that's the best one so far then update best...
      if ((minDistance > bestDistance) && (minDistance > 0)) {
        bestX = x;
        bestY = y; 
        bestDistance = minDistance;
      }
    }
    const best = [bestX, bestY, bestDistance]
    quadtree.add(best)
    return best;
  }
  f.quadtree = quadtree;
  return f;
}
)}

function _replay2(Inputs){return(
Inputs.button("replay")
)}

function* _canvas2(timer1,replay2,DOM,width,height,quadTreeCircleGenerator,config,$0)
{
  if (timer1) {
  const t1 = performance.now();
  replay2;
  const context = DOM.context2d(width, height);
  context.canvas.style.background = 'hsl(216deg 100% 13%)';

  const newCircle = quadTreeCircleGenerator(
    config.maxRadius, 
    config.padding, 
    config.margin.left, 
    width - config.margin.right, 
    config.margin.top, 
    height - config.margin.bottom
  )
  
  var n = config.nCircles;
  var tries = config.failAfter;
  var k = config.nCandidates;
  
  while (n > 0 && tries > 0) {
    const c = newCircle(k);
    if (c[2] > config.padding) {
      context.globalAlpha = 1;
      context.fillStyle = config.cm(Math.random())
      context.beginPath();
      context.arc(c[0], c[1], c[2]  - config.padding, 0, 2 * Math.PI, false)
      context.fill()
      n--;
    } else {
      tries--;
    }
    if (n % config.nCirclesPerFrame === 0) yield context.canvas;
    if (k < 500) k *= 1.01;
  }
  if (tries == 0) console.log('ran out of spaces to put circles')
  if (n == 0) console.log('ran out of circles to place')
  yield context.canvas;
  const t2 = performance.now();
  $0.value = t2 - t1;
  newCircle.quadtree
  }
}


function _10(d3,timer2,md){return(
md`Took ${d3.format('.2f')(timer2/1000)} seconds to render`
)}

function _11(md){return(
md`## 🤔 That Was supposed to be faster... 

Odd, our quadtree was supposed to require checking fewer circles for overlaps. Why was it so much slower?


It turns out that my naive circle generator was _already_ fairly efficient. Because I opted to fill with the largest circles possible and fill in the gaps with progressively smaller ones, big circles appear first in the list, and so later in the filling process, most guesses are likely to be within an _earlier_ circle and so will terminate before comparing to the whole list of circles. 

The quadtree's method for generating guesses is the same - it's only guaranteed to be faster than checking _every_ circle, and my naive method generally only had to check the first few for a lot of guesses. 

We can test this explanation - we should see an advantage for the quadtree generator if we were trying to place lots of circles of a similar size. In that case our naive method wouldn't have the efficiency of checking circles that covered a lot of the canvas first baked in.

Let's try that out.

### Small Circles - Naive`
)}

function _replay3(Inputs){return(
Inputs.button("replay")
)}

function* _canvas3(timer2,replay3,DOM,width,height,naiveCircleGenerator,config,$0)
{
  if (timer2) { // Run after canvas 2 completes
  const t1 = performance.now();
  replay3;
  const context = DOM.context2d(width, height);
  context.canvas.style.background = 'hsl(216deg 100% 13%)';

  const newCircle = naiveCircleGenerator(
    20, 
    config.padding, 
    config.margin.left, 
    width - config.margin.right, 
    config.margin.top, 
    height - config.margin.bottom
  )
  
  var n = config.nCircles;
  var tries = config.failAfter;
  var k = config.nCandidates;
  
  while (n > 0 && tries > 0) {
    const c = newCircle(k);
    if (c[2] > config.padding) {
      context.globalAlpha = 1;
      context.fillStyle = config.cm(Math.random())
      context.beginPath();
      context.arc(c[0], c[1], c[2]  - config.padding, 0, 2 * Math.PI, false)
      context.fill()
      n--;
    } else {
      tries--;
    }
    if (n % config.nCirclesPerFrame === 0) yield context.canvas;
    if (k < 500) k *= 1.01;
  }
  if (tries == 0) console.log('ran out of spaces to put circles')
  if (n == 0) console.log('ran out of circles to place')
  yield context.canvas;
  const t2 = performance.now();
  $0.value = t2 - t1;
  }
}


function _14(d3,timer3,md){return(
md`Took ${d3.format('.2f')(timer3/1000)} seconds to render

## Small Circles - Quadtree`
)}

function _replay4(Inputs){return(
Inputs.button("replay")
)}

function* _canvas4(timer3,replay4,DOM,width,height,quadTreeCircleGenerator,config,$0)
{
  if (timer3) { // Run after canvas 3 completes
  const t1 = performance.now();
  replay4;
  const context = DOM.context2d(width, height);
  context.canvas.style.background = 'hsl(216deg 100% 13%)';

  const newCircle = quadTreeCircleGenerator(
    20, 
    config.padding, 
    config.margin.left, 
    width - config.margin.right, 
    config.margin.top, 
    height - config.margin.bottom
  )
  
  var n = config.nCircles;
  var tries = config.failAfter;
  var k = config.nCandidates;
  
  while (n > 0 && tries > 0) {
    const c = newCircle(k);
    if (c[2] > config.padding) {
      context.globalAlpha = 1;
      context.fillStyle = config.cm(Math.random())
      context.beginPath();
      context.arc(c[0], c[1], c[2]  - config.padding, 0, 2 * Math.PI, false)
      context.fill()
      n--;
    } else {
      tries--;
    }
    if (n % config.nCirclesPerFrame === 0) yield context.canvas;
    if (k < 500) k *= 1.01;
  }
  if (tries == 0) console.log('ran out of spaces to put circles')
  if (n == 0) console.log('ran out of circles to place')
  yield context.canvas;
  const t2 = performance.now();
  $0.value = t2 - t1;
  }
}


function _17(d3,timer4,md){return(
md`Took ${d3.format('.2f')(timer4/1000)} seconds to render.

There we go. The quadtree method is faster when our naive method ends up checking most circles.`
)}

function _18(md){return(
md`## Appendix`
)}

function _height(width){return(
width / 2
)}

function _timer1(){return(
undefined
)}

function _timer2(){return(
undefined
)}

function _timer3(){return(
undefined
)}

function _timer4(){return(
undefined
)}

function _config(height,d3)
{
  const maxRadius = height / 3;
    return {
      maxRadius,
      padding: 1,
      margin: {top: -maxRadius, right: -maxRadius, bottom: -maxRadius, left: -maxRadius},
      nCircles: 1000,
      nCandidates: 100,
      nCirclesPerFrame:100,
      failAfter: 1000,
      cm: d3.scaleSequential().interpolator(d3.interpolateSpectral).domain([0, 1])
  }  
}


function _distanceSquared(){return(
function distanceSquared(x0,y0,x1,y1) {
  return (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)
}
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("naiveCircleGenerator")).define("naiveCircleGenerator", ["distanceSquared"], _naiveCircleGenerator);
  main.variable(observer("viewof replay1")).define("viewof replay1", ["Inputs"], _replay1);
  main.variable(observer("replay1")).define("replay1", ["Generators", "viewof replay1"], (G, _) => G.input(_));
  main.variable(observer("canvas")).define("canvas", ["replay1","DOM","width","height","naiveCircleGenerator","config","mutable timer1"], _canvas);
  main.variable(observer()).define(["d3","timer1","md"], _6);
  main.variable(observer("quadTreeCircleGenerator")).define("quadTreeCircleGenerator", ["d3","distanceSquared"], _quadTreeCircleGenerator);
  main.variable(observer("viewof replay2")).define("viewof replay2", ["Inputs"], _replay2);
  main.variable(observer("replay2")).define("replay2", ["Generators", "viewof replay2"], (G, _) => G.input(_));
  main.variable(observer("canvas2")).define("canvas2", ["timer1","replay2","DOM","width","height","quadTreeCircleGenerator","config","mutable timer2"], _canvas2);
  main.variable(observer()).define(["d3","timer2","md"], _10);
  main.variable(observer()).define(["md"], _11);
  main.variable(observer("viewof replay3")).define("viewof replay3", ["Inputs"], _replay3);
  main.variable(observer("replay3")).define("replay3", ["Generators", "viewof replay3"], (G, _) => G.input(_));
  main.variable(observer("canvas3")).define("canvas3", ["timer2","replay3","DOM","width","height","naiveCircleGenerator","config","mutable timer3"], _canvas3);
  main.variable(observer()).define(["d3","timer3","md"], _14);
  main.variable(observer("viewof replay4")).define("viewof replay4", ["Inputs"], _replay4);
  main.variable(observer("replay4")).define("replay4", ["Generators", "viewof replay4"], (G, _) => G.input(_));
  main.variable(observer("canvas4")).define("canvas4", ["timer3","replay4","DOM","width","height","quadTreeCircleGenerator","config","mutable timer4"], _canvas4);
  main.variable(observer()).define(["d3","timer4","md"], _17);
  main.variable(observer()).define(["md"], _18);
  main.variable(observer("height")).define("height", ["width"], _height);
  main.define("initial timer1", _timer1);
  main.variable(observer("mutable timer1")).define("mutable timer1", ["Mutable", "initial timer1"], (M, _) => new M(_));
  main.variable(observer("timer1")).define("timer1", ["mutable timer1"], _ => _.generator);
  main.define("initial timer2", _timer2);
  main.variable(observer("mutable timer2")).define("mutable timer2", ["Mutable", "initial timer2"], (M, _) => new M(_));
  main.variable(observer("timer2")).define("timer2", ["mutable timer2"], _ => _.generator);
  main.define("initial timer3", _timer3);
  main.variable(observer("mutable timer3")).define("mutable timer3", ["Mutable", "initial timer3"], (M, _) => new M(_));
  main.variable(observer("timer3")).define("timer3", ["mutable timer3"], _ => _.generator);
  main.define("initial timer4", _timer4);
  main.variable(observer("mutable timer4")).define("mutable timer4", ["Mutable", "initial timer4"], (M, _) => new M(_));
  main.variable(observer("timer4")).define("timer4", ["mutable timer4"], _ => _.generator);
  main.variable(observer("config")).define("config", ["height","d3"], _config);
  main.variable(observer("distanceSquared")).define("distanceSquared", _distanceSquared);
  return main;
}
